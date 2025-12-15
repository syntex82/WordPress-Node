/**
 * Theme Editor Service
 * Handles theme file editing, backups, and restoration
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as AdmZip from 'adm-zip';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
}

@Injectable()
export class ThemeEditorService {
  private themesDir = path.join(process.cwd(), 'themes');
  private backupsDir = path.join(process.cwd(), 'backups', 'themes');

  constructor(private prisma: PrismaService) {
    this.ensureBackupDir();
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating backup directory:', error);
    }
  }

  /**
   * Get file tree for a theme
   */
  async getFileTree(themeSlug: string): Promise<FileNode> {
    const themePath = path.join(this.themesDir, themeSlug);

    try {
      await fs.access(themePath);
    } catch {
      throw new NotFoundException('Theme not found');
    }

    return this.buildFileTree(themePath, themeSlug);
  }

  /**
   * Build file tree recursively
   */
  private async buildFileTree(dirPath: string, relativePath: string): Promise<FileNode> {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);

    if (stats.isFile()) {
      return {
        name,
        path: relativePath,
        type: 'file',
        extension: path.extname(name).slice(1),
      };
    }

    const children: FileNode[] = [];
    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
      // Skip node_modules and hidden files
      if (entry === 'node_modules' || entry.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dirPath, entry);
      const relPath = path.join(relativePath, entry);
      children.push(await this.buildFileTree(fullPath, relPath));
    }

    return {
      name,
      path: relativePath,
      type: 'directory',
      children: children.sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }),
    };
  }

  /**
   * Read file content
   */
  async readFile(themeSlug: string, filePath: string): Promise<{ content: string; path: string }> {
    const fullPath = path.join(this.themesDir, themeSlug, filePath);

    // Security check: ensure path is within theme directory
    const normalizedPath = path.normalize(fullPath);
    const themePath = path.normalize(path.join(this.themesDir, themeSlug));

    if (!normalizedPath.startsWith(themePath)) {
      throw new BadRequestException('Invalid file path');
    }

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return { content, path: filePath };
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  /**
   * Save file content
   */
  async saveFile(
    themeSlug: string,
    filePath: string,
    content: string,
  ): Promise<{ success: boolean; message: string }> {
    const fullPath = path.join(this.themesDir, themeSlug, filePath);

    // Security check
    const normalizedPath = path.normalize(fullPath);
    const themePath = path.normalize(path.join(this.themesDir, themeSlug));

    if (!normalizedPath.startsWith(themePath)) {
      throw new BadRequestException('Invalid file path');
    }

    try {
      // Validate file extension (only allow specific file types)
      const ext = path.extname(filePath).toLowerCase();
      const allowedExtensions = ['.hbs', '.css', '.js', '.json', '.md'];

      if (!allowedExtensions.includes(ext)) {
        throw new BadRequestException('File type not allowed for editing');
      }

      // Create backup before saving
      await this.createBackup(themeSlug, `auto-backup-${Date.now()}`);

      // Save file
      await fs.writeFile(fullPath, content, 'utf-8');

      return { success: true, message: 'File saved successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to save file: ' + error.message);
    }
  }

  /**
   * Create backup of theme
   */
  async createBackup(
    themeSlug: string,
    backupName?: string,
  ): Promise<{ success: boolean; backupId: string; message: string }> {
    const themePath = path.join(this.themesDir, themeSlug);

    try {
      await fs.access(themePath);
    } catch {
      throw new NotFoundException('Theme not found');
    }

    const timestamp = Date.now();
    const backupId = backupName || `backup-${timestamp}`;
    const backupFileName = `${themeSlug}-${backupId}.zip`;
    const backupPath = path.join(this.backupsDir, backupFileName);

    try {
      // Create ZIP archive
      const zip = new AdmZip();
      await this.addDirectoryToZip(zip, themePath, '');
      zip.writeZip(backupPath);

      return {
        success: true,
        backupId,
        message: `Backup created: ${backupFileName}`,
      };
    } catch (error) {
      throw new BadRequestException('Failed to create backup: ' + error.message);
    }
  }

  /**
   * Add directory to ZIP recursively
   */
  private async addDirectoryToZip(zip: AdmZip, dirPath: string, zipPath: string) {
    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
      if (entry === 'node_modules' || entry.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dirPath, entry);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        await this.addDirectoryToZip(zip, fullPath, path.join(zipPath, entry));
      } else {
        const content = await fs.readFile(fullPath);
        zip.addFile(path.join(zipPath, entry), content);
      }
    }
  }

  /**
   * List backups for a theme
   */
  async listBackups(
    themeSlug: string,
  ): Promise<Array<{ id: string; name: string; date: Date; size: number }>> {
    try {
      const files = await fs.readdir(this.backupsDir);
      const backups: Array<{ id: string; name: string; date: Date; size: number }> = [];

      for (const file of files) {
        if (file.startsWith(`${themeSlug}-`) && file.endsWith('.zip')) {
          const filePath = path.join(this.backupsDir, file);
          const stats = await fs.stat(filePath);
          const backupId = file.replace(`${themeSlug}-`, '').replace('.zip', '');

          backups.push({
            id: backupId,
            name: file,
            date: stats.mtime,
            size: stats.size,
          });
        }
      }

      return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      return [];
    }
  }

  /**
   * Restore theme from backup
   */
  async restoreBackup(
    themeSlug: string,
    backupId: string,
  ): Promise<{ success: boolean; message: string }> {
    const backupFileName = `${themeSlug}-${backupId}.zip`;
    const backupPath = path.join(this.backupsDir, backupFileName);
    const themePath = path.join(this.themesDir, themeSlug);

    try {
      await fs.access(backupPath);
    } catch {
      throw new NotFoundException('Backup not found');
    }

    try {
      // Create a safety backup before restoring
      await this.createBackup(themeSlug, `pre-restore-${Date.now()}`);

      // Delete current theme directory
      await fs.rm(themePath, { recursive: true, force: true });

      // Extract backup
      const zip = new AdmZip(backupPath);
      zip.extractAllTo(themePath, true);

      return {
        success: true,
        message: 'Theme restored successfully from backup',
      };
    } catch (error) {
      throw new BadRequestException('Failed to restore backup: ' + error.message);
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(
    themeSlug: string,
    backupId: string,
  ): Promise<{ success: boolean; message: string }> {
    const backupFileName = `${themeSlug}-${backupId}.zip`;
    const backupPath = path.join(this.backupsDir, backupFileName);

    try {
      await fs.unlink(backupPath);
      return {
        success: true,
        message: 'Backup deleted successfully',
      };
    } catch (error) {
      throw new NotFoundException('Backup not found');
    }
  }

  /**
   * Validate file syntax (basic validation)
   */
  async validateFile(
    filePath: string,
    content: string,
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const ext = path.extname(filePath).toLowerCase();
    const errors: string[] = [];

    try {
      if (ext === '.json') {
        JSON.parse(content);
      }
      // Add more validation as needed

      return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }
}
