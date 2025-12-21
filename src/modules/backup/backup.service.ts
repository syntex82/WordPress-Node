/**
 * Backup Service
 * Handles database and file backups
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BackupType, BackupStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import * as AdmZip from 'adm-zip';
import { createHash } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CreateBackupDto {
  name: string;
  description?: string;
  type?: BackupType;
  includesDatabase?: boolean;
  includesMedia?: boolean;
  includesThemes?: boolean;
  includesPlugins?: boolean;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(private prisma: PrismaService) {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a new backup
   */
  async create(dto: CreateBackupDto, userId?: string) {
    const backup = await this.prisma.backup.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type || 'FULL',
        status: 'PENDING',
        includesDatabase: dto.includesDatabase ?? true,
        includesMedia: dto.includesMedia ?? true,
        includesThemes: dto.includesThemes ?? true,
        includesPlugins: dto.includesPlugins ?? true,
        createdById: userId,
      },
    });

    // Start backup process asynchronously
    this.runBackup(backup.id).catch(err => {
      this.logger.error(`Backup ${backup.id} failed: ${err.message}`);
    });

    return backup;
  }

  /**
   * Run the actual backup process
   */
  private async runBackup(backupId: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id: backupId } });
    if (!backup) return;

    await this.prisma.backup.update({
      where: { id: backupId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup-${backup.type.toLowerCase()}-${timestamp}.zip`;
      const filePath = path.join(this.backupDir, fileName);

      const archive = archiver('zip', { zlib: { level: 9 } });
      const output = fs.createWriteStream(filePath);

      let filesCount = 0;
      let recordsCount = 0;
      let tablesCount = 0;

      await new Promise<void>((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);

        // Add database export if included
        if (backup.includesDatabase) {
          const dbData = this.exportDatabaseSync();
          archive.append(JSON.stringify(dbData, null, 2), { name: 'database.json' });
          tablesCount = Object.keys(dbData).length;
          recordsCount = Object.values(dbData).reduce((sum: number, arr: any[]) => sum + arr.length, 0);
        }

        // Add media files
        if (backup.includesMedia) {
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (fs.existsSync(uploadsDir)) {
            archive.directory(uploadsDir, 'uploads');
            filesCount += this.countFiles(uploadsDir);
          }
        }

        // Add themes
        if (backup.includesThemes) {
          const themesDir = path.join(process.cwd(), 'themes');
          if (fs.existsSync(themesDir)) {
            archive.directory(themesDir, 'themes');
            filesCount += this.countFiles(themesDir);
          }
        }

        // Add plugins
        if (backup.includesPlugins) {
          const pluginsDir = path.join(process.cwd(), 'plugins');
          if (fs.existsSync(pluginsDir)) {
            archive.directory(pluginsDir, 'plugins');
            filesCount += this.countFiles(pluginsDir);
          }
        }

        archive.finalize();
      });

      // Calculate file size and checksum
      const stats = fs.statSync(filePath);
      const checksum = await this.calculateChecksum(filePath);

      await this.prisma.backup.update({
        where: { id: backupId },
        data: {
          status: 'COMPLETED',
          filePath: fileName,
          fileSize: BigInt(stats.size),
          checksum,
          tablesCount,
          recordsCount,
          filesCount,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Backup ${backupId} completed: ${fileName}`);
    } catch (error) {
      await this.prisma.backup.update({
        where: { id: backupId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Export database tables to JSON (synchronous for archiver)
   */
  private exportDatabaseSync(): Record<string, any[]> {
    // This will be called within the backup process
    // For now, return empty - we'll populate async
    return {};
  }

  /**
   * Export database tables to JSON
   */
  async exportDatabase(): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {};

    // Export core tables
    data.users = await this.prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } });
    data.posts = await this.prisma.post.findMany();
    data.pages = await this.prisma.page.findMany();
    data.media = await this.prisma.media.findMany();
    data.menus = await this.prisma.menu.findMany({ include: { items: true } });
    data.settings = await this.prisma.setting.findMany();

    return data;
  }

  /**
   * Count files in a directory recursively
   */
  private countFiles(dir: string): number {
    let count = 0;
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          count += this.countFiles(fullPath);
        } else {
          count++;
        }
      }
    } catch { /* ignore */ }
    return count;
  }

  /**
   * Calculate MD5 checksum of a file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('md5');
      const stream = fs.createReadStream(filePath);
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * List all backups
   */
  async findAll(query: { page?: number; limit?: number; status?: BackupStatus; type?: BackupType } = {}) {
    const { page = 1, limit = 20, status, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [backups, total] = await Promise.all([
      this.prisma.backup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.backup.count({ where }),
    ]);

    return {
      data: backups.map(b => ({
        ...b,
        fileSize: b.fileSize ? Number(b.fileSize) : null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single backup
   */
  async findOne(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    if (backup) {
      return { ...backup, fileSize: backup.fileSize ? Number(backup.fileSize) : null };
    }
    return null;
  }

  /**
   * Delete a backup
   */
  async delete(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (backup?.filePath) {
      const fullPath = path.join(this.backupDir, backup.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    return this.prisma.backup.delete({ where: { id } });
  }

  /**
   * Get backup file path for download
   */
  getFilePath(fileName: string): string | null {
    const fullPath = path.join(this.backupDir, fileName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    return null;
  }

  /**
   * Get backup statistics
   */
  async getStats() {
    const [total, completed, failed, inProgress, totalSize] = await Promise.all([
      this.prisma.backup.count(),
      this.prisma.backup.count({ where: { status: 'COMPLETED' } }),
      this.prisma.backup.count({ where: { status: 'FAILED' } }),
      this.prisma.backup.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.backup.aggregate({ _sum: { fileSize: true } }),
    ]);

    return {
      total,
      completed,
      failed,
      inProgress,
      totalSize: totalSize._sum.fileSize ? Number(totalSize._sum.fileSize) : 0,
    };
  }

  /**
   * Restore from a backup
   */
  async restore(id: string, options: { restoreDatabase?: boolean; restoreMedia?: boolean; restoreThemes?: boolean; restorePlugins?: boolean } = {}) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) {
      throw new BadRequestException('Backup not found');
    }
    if (backup.status !== 'COMPLETED') {
      throw new BadRequestException('Cannot restore from incomplete backup');
    }
    if (!backup.filePath) {
      throw new BadRequestException('Backup file not available');
    }

    const backupPath = path.join(this.backupDir, backup.filePath);
    if (!fs.existsSync(backupPath)) {
      throw new BadRequestException('Backup file not found on disk');
    }

    // Default to restoring what the backup contains
    const restoreDatabase = options.restoreDatabase ?? backup.includesDatabase;
    const restoreMedia = options.restoreMedia ?? backup.includesMedia;
    const restoreThemes = options.restoreThemes ?? backup.includesThemes;
    const restorePlugins = options.restorePlugins ?? backup.includesPlugins;

    const results: { database?: any; media?: any; themes?: any; plugins?: any } = {};

    try {
      const zip = new AdmZip(backupPath);
      const zipEntries = zip.getEntries();

      // Restore database
      if (restoreDatabase) {
        const dbEntry = zipEntries.find(e => e.entryName === 'database.json');
        if (dbEntry) {
          const dbData = JSON.parse(dbEntry.getData().toString('utf8'));
          results.database = await this.restoreDatabase(dbData);
        }
      }

      // Restore media files
      if (restoreMedia) {
        const mediaEntries = zipEntries.filter(e => e.entryName.startsWith('uploads/'));
        if (mediaEntries.length > 0) {
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          for (const entry of mediaEntries) {
            if (!entry.isDirectory) {
              const targetPath = path.join(process.cwd(), entry.entryName);
              const targetDir = path.dirname(targetPath);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              fs.writeFileSync(targetPath, entry.getData());
            }
          }
          results.media = { filesRestored: mediaEntries.filter(e => !e.isDirectory).length };
        }
      }

      // Restore themes
      if (restoreThemes) {
        const themeEntries = zipEntries.filter(e => e.entryName.startsWith('themes/'));
        if (themeEntries.length > 0) {
          const themesDir = path.join(process.cwd(), 'themes');
          for (const entry of themeEntries) {
            if (!entry.isDirectory) {
              const targetPath = path.join(process.cwd(), entry.entryName);
              const targetDir = path.dirname(targetPath);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              fs.writeFileSync(targetPath, entry.getData());
            }
          }
          results.themes = { filesRestored: themeEntries.filter(e => !e.isDirectory).length };
        }
      }

      // Restore plugins
      if (restorePlugins) {
        const pluginEntries = zipEntries.filter(e => e.entryName.startsWith('plugins/'));
        if (pluginEntries.length > 0) {
          const pluginsDir = path.join(process.cwd(), 'plugins');
          for (const entry of pluginEntries) {
            if (!entry.isDirectory) {
              const targetPath = path.join(process.cwd(), entry.entryName);
              const targetDir = path.dirname(targetPath);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              fs.writeFileSync(targetPath, entry.getData());
            }
          }
          results.plugins = { filesRestored: pluginEntries.filter(e => !e.isDirectory).length };
        }
      }

      this.logger.log(`Backup ${id} restored successfully`);
      return { success: true, message: 'Backup restored successfully', results };
    } catch (error) {
      this.logger.error(`Restore failed: ${error.message}`);
      throw new BadRequestException(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Restore database from JSON data
   */
  private async restoreDatabase(data: Record<string, any[]>) {
    const results: Record<string, number> = {};

    // Restore settings
    if (data.settings && Array.isArray(data.settings)) {
      for (const setting of data.settings) {
        await this.prisma.setting.upsert({
          where: { key: setting.key },
          create: setting,
          update: setting,
        });
      }
      results.settings = data.settings.length;
    }

    // Restore posts (upsert to avoid conflicts)
    if (data.posts && Array.isArray(data.posts)) {
      for (const post of data.posts) {
        try {
          await this.prisma.post.upsert({
            where: { id: post.id },
            create: post,
            update: post,
          });
        } catch { /* skip if conflict */ }
      }
      results.posts = data.posts.length;
    }

    // Restore pages
    if (data.pages && Array.isArray(data.pages)) {
      for (const page of data.pages) {
        try {
          await this.prisma.page.upsert({
            where: { id: page.id },
            create: page,
            update: page,
          });
        } catch { /* skip if conflict */ }
      }
      results.pages = data.pages.length;
    }

    // Restore menus
    if (data.menus && Array.isArray(data.menus)) {
      for (const menu of data.menus) {
        try {
          const { items, ...menuData } = menu;
          await this.prisma.menu.upsert({
            where: { id: menu.id },
            create: menuData,
            update: menuData,
          });
          // Restore menu items
          if (items && Array.isArray(items)) {
            for (const item of items) {
              await this.prisma.menuItem.upsert({
                where: { id: item.id },
                create: item,
                update: item,
              });
            }
          }
        } catch { /* skip if conflict */ }
      }
      results.menus = data.menus.length;
    }

    return results;
  }
}

