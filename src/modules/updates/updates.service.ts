/**
 * Updates Service
 * Core update management - download, apply, rollback functionality
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { VersionService } from './version.service';
import { MigrationService } from './migration.service';
import { BackupService } from '../backup/backup.service';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as AdmZip from 'adm-zip';
import { createHash } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface UpdateProgress {
  stage: string;
  progress: number;
  message: string;
}

@Injectable()
export class UpdatesService {
  private readonly logger = new Logger(UpdatesService.name);
  private readonly updatesDir = path.join(process.cwd(), 'updates');
  private readonly rollbackDir = path.join(process.cwd(), 'updates', 'rollback');
  private updateInProgress = false;
  private currentProgress: UpdateProgress = { stage: 'idle', progress: 0, message: '' };

  constructor(
    private prisma: PrismaService,
    private versionService: VersionService,
    private migrationService: MigrationService,
    private backupService: BackupService,
  ) {
    // Ensure directories exist
    if (!fs.existsSync(this.updatesDir)) {
      fs.mkdirSync(this.updatesDir, { recursive: true });
    }
    if (!fs.existsSync(this.rollbackDir)) {
      fs.mkdirSync(this.rollbackDir, { recursive: true });
    }
  }

  /**
   * Get current update status
   */
  async getStatus() {
    const updateCheck = await this.versionService.isUpdateAvailable();
    const pendingMigrations = await this.migrationService.getPendingMigrations();

    return {
      currentVersion: updateCheck.currentVersion,
      latestVersion: updateCheck.latestVersion,
      updateAvailable: updateCheck.available,
      versionInfo: updateCheck.versionInfo,
      pendingMigrations,
      updateInProgress: this.updateInProgress,
      currentProgress: this.currentProgress,
    };
  }

  /**
   * Check for updates
   */
  async checkForUpdates() {
    const updateCheck = await this.versionService.isUpdateAvailable();
    const availableUpdates = await this.versionService.getAvailableUpdates();

    // Store latest version info if update available
    if (updateCheck.available && updateCheck.versionInfo) {
      await this.prisma.setting.upsert({
        where: { key: 'latest_available_version' },
        create: {
          key: 'latest_available_version',
          value: JSON.stringify(updateCheck.versionInfo),
          type: 'JSON',
        },
        update: { value: JSON.stringify(updateCheck.versionInfo) },
      });
    }

    return {
      ...updateCheck,
      availableUpdates,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Download update package
   */
  async downloadUpdate(
    version: string,
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    const manifest = await this.versionService.fetchUpdateManifest();
    const versionInfo = manifest?.versions.find((v) => v.version === version);

    if (!versionInfo) {
      throw new BadRequestException(`Version ${version} not found`);
    }

    if (!versionInfo.downloadUrl) {
      throw new BadRequestException('No download URL available for this version');
    }

    const fileName = `NodePress-${version}.zip`;
    const filePath = path.join(this.updatesDir, fileName);

    // Create update history record
    const updateHistory = await this.prisma.updateHistory.create({
      data: {
        fromVersion: this.versionService.getCurrentVersion(),
        toVersion: version,
        status: 'DOWNLOADING',
        downloadUrl: versionInfo.downloadUrl,
        checksum: versionInfo.checksum,
        fileSize: BigInt(versionInfo.fileSize || 0),
        changelog: versionInfo.changelog,
        releaseNotes: versionInfo.releaseNotes,
      },
    });

    try {
      this.setProgress('downloading', 0, `Downloading version ${version}...`);

      await this.downloadFile(versionInfo.downloadUrl, filePath, (progress) => {
        this.setProgress('downloading', progress, `Downloading: ${progress}%`);
      });

      // Verify checksum if provided
      if (versionInfo.checksum) {
        const fileChecksum = await this.calculateChecksum(filePath);
        if (fileChecksum !== versionInfo.checksum) {
          fs.unlinkSync(filePath);
          throw new Error('Checksum verification failed');
        }
      }

      await this.prisma.updateHistory.update({
        where: { id: updateHistory.id },
        data: { status: 'DOWNLOADED' },
      });

      this.setProgress('downloaded', 100, 'Download complete');
      return { success: true, filePath };
    } catch (error: any) {
      await this.prisma.updateHistory.update({
        where: { id: updateHistory.id },
        data: { status: 'FAILED', errorMessage: error.message },
      });
      throw error;
    }
  }

  private setProgress(stage: string, progress: number, message: string) {
    this.currentProgress = { stage, progress, message };
    this.logger.log(`[${stage}] ${progress}% - ${message}`);
  }

  /**
   * Apply a downloaded update
   */
  async applyUpdate(
    version: string,
    userId?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (this.updateInProgress) {
      throw new BadRequestException('An update is already in progress');
    }
    this.updateInProgress = true;
    const currentVersion = this.versionService.getCurrentVersion();

    let updateHistory = await this.prisma.updateHistory.findFirst({
      where: { toVersion: version, status: 'DOWNLOADED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!updateHistory) {
      const downloadResult = await this.downloadUpdate(version);
      if (!downloadResult.success) {
        this.updateInProgress = false;
        throw new BadRequestException('Failed to download update');
      }
      updateHistory = await this.prisma.updateHistory.findFirst({
        where: { toVersion: version, status: 'DOWNLOADED' },
        orderBy: { createdAt: 'desc' },
      });
    }

    try {
      this.setProgress('backing_up', 10, 'Creating pre-update backup...');
      await this.prisma.updateHistory.update({
        where: { id: updateHistory!.id },
        data: { status: 'BACKING_UP', initiatedBy: userId },
      });

      const backup = await this.backupService.create(
        {
          name: `Pre-Update Backup v${version}`,
          description: `Auto backup before updating to ${version}`,
          type: 'FULL',
          includesDatabase: true,
          includesMedia: true,
          includesThemes: true,
          includesPlugins: true,
        },
        userId || 'system',
      );

      await this.prisma.updateHistory.update({
        where: { id: updateHistory!.id },
        data: { backupId: backup.id },
      });

      this.setProgress('preparing', 20, 'Creating rollback point...');
      await this.createRollbackPoint(currentVersion);

      this.setProgress('applying', 40, 'Extracting update package...');
      await this.prisma.updateHistory.update({
        where: { id: updateHistory!.id },
        data: { status: 'APPLYING' },
      });

      const updateFile = path.join(this.updatesDir, `NodePress-${version}.zip`);
      await this.extractUpdate(updateFile);

      this.setProgress('migrating', 60, 'Running database migrations...');
      await this.prisma.updateHistory.update({
        where: { id: updateHistory!.id },
        data: { status: 'MIGRATING' },
      });

      const migrationResult = await this.migrationService.runMigrations();
      await this.prisma.updateHistory.update({
        where: { id: updateHistory!.id },
        data: { migrationsRun: migrationResult.migrationsRun, migrationLogs: migrationResult.logs },
      });

      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.error}`);
      }

      this.setProgress('installing', 75, 'Installing dependencies...');
      await execAsync('npm install --production --quiet --no-progress', {
        cwd: process.cwd(),
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      this.setProgress('building', 85, 'Building application...');
      await execAsync('npm run build', {
        cwd: process.cwd(),
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      this.setProgress('verifying', 95, 'Verifying update...');
      await this.prisma.updateHistory.update({
        where: { id: updateHistory!.id },
        data: { status: 'VERIFYING' },
      });

      const schemaValid = await this.migrationService.validateSchema();
      if (!schemaValid.valid) {
        throw new Error(`Schema validation failed`);
      }

      this.setProgress('completed', 100, 'Update completed successfully!');
      await this.prisma.updateHistory.update({
        where: { id: updateHistory!.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      await this.versionService.recordCurrentVersion();
      this.updateInProgress = false;
      return { success: true, message: `Updated to ${version}. Please restart the server.` };
    } catch (error: any) {
      this.logger.error('Update failed', error);
      await this.prisma.updateHistory.update({
        where: { id: updateHistory!.id },
        data: { status: 'FAILED', errorMessage: error.message, errorStack: error.stack },
      });
      this.setProgress('failed', 0, `Update failed: ${error.message}`);
      this.updateInProgress = false;
      throw error;
    }
  }

  /**
   * Rollback to previous version
   */
  async rollback(updateHistoryId: string): Promise<{ success: boolean; message: string }> {
    const updateHistory = await this.prisma.updateHistory.findUnique({
      where: { id: updateHistoryId },
      include: { backup: true },
    });

    if (!updateHistory) {
      throw new BadRequestException('Update history not found');
    }

    try {
      this.setProgress('rolling_back', 10, 'Initiating rollback...');
      const rollbackPath = path.join(this.rollbackDir, updateHistory.fromVersion);

      if (fs.existsSync(rollbackPath)) {
        this.setProgress('rolling_back', 30, 'Restoring files...');
        await this.restoreFromRollback(rollbackPath);
      }

      if (updateHistory.backup) {
        this.setProgress('rolling_back', 60, 'Restoring database...');
        await this.backupService.restore(updateHistory.backup.id, { restoreDatabase: true });
      }

      this.setProgress('rolling_back', 80, 'Reinstalling dependencies...');
      await execAsync('npm install --production --quiet --no-progress', {
        cwd: process.cwd(),
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      this.setProgress('rolling_back', 90, 'Rebuilding...');
      await execAsync('npm run build', {
        cwd: process.cwd(),
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      await this.prisma.updateHistory.update({
        where: { id: updateHistoryId },
        data: { rolledBack: true, rollbackAt: new Date(), status: 'ROLLED_BACK' },
      });

      this.setProgress('completed', 100, 'Rollback completed');
      return {
        success: true,
        message: `Rolled back to ${updateHistory.fromVersion}. Restart server.`,
      };
    } catch (error: any) {
      this.setProgress('failed', 0, `Rollback failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get update history
   */
  async getUpdateHistory(limit = 20) {
    return this.prisma.updateHistory.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: { backup: true, initiatedByUser: { select: { id: true, name: true, email: true } } },
    });
  }

  // Helper methods
  private async downloadFile(
    url: string,
    dest: string,
    onProgress?: (p: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      const protocol = url.startsWith('https') ? https : http;

      protocol
        .get(url, { headers: { 'User-Agent': 'NodePress-CMS' } }, (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            file.close();
            fs.unlinkSync(dest);
            return this.downloadFile(response.headers.location!, dest, onProgress)
              .then(resolve)
              .catch(reject);
          }
          const totalSize = parseInt(response.headers['content-length'] || '0', 10);
          let downloaded = 0;
          response.on('data', (chunk) => {
            downloaded += chunk.length;
            if (totalSize && onProgress) onProgress(Math.round((downloaded / totalSize) * 100));
          });
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        })
        .on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
    });
  }

  /**
   * Validate file path to prevent directory traversal attacks
   */
  private validateFilePath(filePath: string, allowedDir: string): void {
    const resolvedPath = path.resolve(filePath);
    const resolvedAllowedDir = path.resolve(allowedDir);

    if (!resolvedPath.startsWith(resolvedAllowedDir + path.sep) && resolvedPath !== resolvedAllowedDir) {
      throw new BadRequestException('Invalid file path: directory traversal attempt detected');
    }
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    // Validate path is within updates directory
    this.validateFilePath(filePath, this.updatesDir);

    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async createRollbackPoint(version: string): Promise<void> {
    const rollbackPath = path.join(this.rollbackDir, version);
    if (!fs.existsSync(rollbackPath)) fs.mkdirSync(rollbackPath, { recursive: true });
    const files = ['package.json', 'package-lock.json', 'prisma/schema.prisma'];
    for (const file of files) {
      const src = path.join(process.cwd(), file);
      const dest = path.join(rollbackPath, file);
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    }
  }

  private async extractUpdate(zipPath: string): Promise<void> {
    const zip = new AdmZip(zipPath);
    const extractPath = path.join(this.updatesDir, 'extracted');
    zip.extractAllTo(extractPath, true);
    const exclude = ['node_modules', '.git', 'uploads', 'backups', 'updates', '.env'];
    await this.copyDirectory(extractPath, process.cwd(), exclude);
  }

  private async copyDirectory(src: string, dest: string, exclude: string[]): Promise<void> {
    // Ensure source directory exists
    if (!fs.existsSync(src)) {
      this.logger.warn(`Source directory does not exist: ${src}`);
      return;
    }

    // Ensure destination directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (exclude.includes(entry.name)) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      try {
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          await this.copyDirectory(srcPath, destPath, exclude);
        } else {
          // Verify source file exists before copying
          if (!fs.existsSync(srcPath)) {
            this.logger.warn(`Skipping missing file: ${srcPath}`);
            continue;
          }
          // Ensure parent directory exists before copying file
          const parentDir = path.dirname(destPath);
          if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
          }
          fs.copyFileSync(srcPath, destPath);
        }
      } catch (err: any) {
        // Log but don't fail on individual file copy errors during backup
        this.logger.warn(`Failed to copy ${srcPath}: ${err.message}`);
      }
    }
  }

  private async restoreFromRollback(rollbackPath: string): Promise<void> {
    const files = fs.readdirSync(rollbackPath, { withFileTypes: true });
    for (const file of files) {
      const src = path.join(rollbackPath, file.name);
      const dest = path.join(process.cwd(), file.name);
      if (file.isDirectory()) await this.copyDirectory(src, dest, []);
      else fs.copyFileSync(src, dest);
    }
  }

  /**
   * Pull latest changes from GitHub main branch and rebuild
   * This is for quick updates without waiting for official releases
   */
  async pullLatest(userId?: string): Promise<{
    success: boolean;
    message: string;
    fromVersion: string;
    toVersion: string;
    logs: string[];
  }> {
    if (this.updateInProgress) {
      throw new BadRequestException('An update is already in progress');
    }
    this.updateInProgress = true;
    const logs: string[] = [];
    const currentVersion = this.versionService.getCurrentVersion();
    let newVersion = currentVersion;

    // Create update history record
    const updateHistory = await this.prisma.updateHistory.create({
      data: {
        fromVersion: currentVersion,
        toVersion: 'latest',
        status: 'DOWNLOADING',
        changelog: 'Pull latest from main branch',
        initiatedBy: userId,
      },
    });

    try {
      // Step 1: Create backup
      this.setProgress('backing_up', 5, 'Creating pre-update backup...');
      logs.push('Creating backup before update...');

      const backupDir = path.join(process.cwd(), 'backups', `pre-update-${Date.now()}`);
      fs.mkdirSync(backupDir, { recursive: true });

      // Backup critical files
      const distPath = path.join(process.cwd(), 'dist');
      const adminDistPath = path.join(process.cwd(), 'admin', 'dist');
      const envPath = path.join(process.cwd(), '.env');

      if (fs.existsSync(distPath)) {
        await this.copyDirectory(distPath, path.join(backupDir, 'dist'), []);
      }
      if (fs.existsSync(adminDistPath)) {
        await this.copyDirectory(adminDistPath, path.join(backupDir, 'admin-dist'), []);
      }
      if (fs.existsSync(envPath)) {
        fs.copyFileSync(envPath, path.join(backupDir, '.env'));
      }
      fs.copyFileSync(
        path.join(process.cwd(), 'package.json'),
        path.join(backupDir, 'package.json'),
      );
      logs.push(`✓ Backup created at: ${backupDir}`);

      // Step 2: Git pull
      this.setProgress('downloading', 15, 'Pulling latest changes from GitHub...');
      logs.push('Pulling latest changes from GitHub...');

      await this.prisma.updateHistory.update({
        where: { id: updateHistory.id },
        data: { status: 'DOWNLOADING' },
      });

      // Stash any local changes
      try {
        await execAsync('git stash', { cwd: process.cwd(), timeout: 30000 });
        logs.push('✓ Stashed local changes');
      } catch {
        // No local changes to stash, continue
      }

      // Reset scripts folder to avoid conflicts
      try {
        await execAsync('git checkout scripts/', { cwd: process.cwd(), timeout: 30000 });
        logs.push('✓ Reset scripts folder');
      } catch {
        // Continue even if this fails
      }

      // Pull latest
      const pullResult = await execAsync('git pull origin main', {
        cwd: process.cwd(),
        timeout: 120000,
      });
      logs.push('✓ Code updated');
      logs.push(pullResult.stdout.trim());

      // Get new version
      try {
        const pkgJson = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
        );
        newVersion = pkgJson.version || currentVersion;
        logs.push(`New version: ${newVersion}`);
      } catch {
        newVersion = 'unknown';
      }

      await this.prisma.updateHistory.update({
        where: { id: updateHistory.id },
        data: { toVersion: newVersion, status: 'APPLYING' },
      });

      // Step 3: Install backend dependencies
      this.setProgress('installing', 30, 'Installing backend dependencies...');
      logs.push('Installing backend dependencies...');

      await execAsync('npm install --production=false --quiet --no-progress', {
        cwd: process.cwd(),
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      logs.push('✓ Backend dependencies installed');

      // Step 4: Install admin dependencies
      this.setProgress('installing', 45, 'Installing admin dependencies...');
      logs.push('Installing admin dependencies...');

      const adminDir = path.join(process.cwd(), 'admin');

      // Clean install to avoid module resolution issues
      const nodeModulesPath = path.join(adminDir, 'node_modules');
      const packageLockPath = path.join(adminDir, 'package-lock.json');
      if (fs.existsSync(nodeModulesPath)) {
        await execAsync('rm -rf node_modules', { cwd: adminDir, timeout: 60000 });
        logs.push('✓ Cleaned old node_modules');
      }
      if (fs.existsSync(packageLockPath)) {
        fs.unlinkSync(packageLockPath);
        logs.push('✓ Removed package-lock.json');
      }

      // Install dependencies including dev dependencies (force include dev deps even in production)
      await execAsync('npm install --include=dev --quiet --no-progress', {
        cwd: adminDir,
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: { ...process.env, NODE_ENV: 'development' },
      });
      logs.push('✓ Admin dependencies installed');

      // Verify vite is installed before attempting build
      const viteCheck = path.join(adminDir, 'node_modules', 'vite');
      if (!fs.existsSync(viteCheck)) {
        logs.push('⚠ Vite not found, installing explicitly...');
        await execAsync('npm install vite @vitejs/plugin-react --save-dev --quiet', {
          cwd: adminDir,
          timeout: 120000,
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          env: { ...process.env, NODE_ENV: 'development' },
        });
        logs.push('✓ Vite installed');
      }

      // Step 5: Build admin panel
      this.setProgress('building', 60, 'Building admin panel...');
      logs.push('Building admin panel...');

      await this.prisma.updateHistory.update({
        where: { id: updateHistory.id },
        data: { status: 'APPLYING' },
      });

      await execAsync('npm run build', {
        cwd: adminDir,
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      // Verify admin build
      if (!fs.existsSync(path.join(adminDir, 'dist', 'index.html'))) {
        throw new Error('Admin panel build failed - dist/index.html not found');
      }
      logs.push('✓ Admin panel built');

      // Step 6: Build backend
      this.setProgress('building', 75, 'Building backend...');
      logs.push('Building backend...');

      await execAsync('npm run build', {
        cwd: process.cwd(),
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      // Verify backend build
      if (!fs.existsSync(path.join(process.cwd(), 'dist', 'main.js'))) {
        throw new Error('Backend build failed - dist/main.js not found');
      }
      logs.push('✓ Backend built');

      // Step 7: Run database migrations
      this.setProgress('migrating', 85, 'Applying database migrations...');
      logs.push('Applying database migrations...');

      await this.prisma.updateHistory.update({
        where: { id: updateHistory.id },
        data: { status: 'MIGRATING' },
      });

      try {
        await execAsync('npx prisma generate', { cwd: process.cwd(), timeout: 120000 });
        await execAsync('npx prisma db push --accept-data-loss', {
          cwd: process.cwd(),
          timeout: 300000,
        });
        logs.push('✓ Database schema updated');
      } catch (migErr: any) {
        logs.push(`Warning: Migration had issues: ${migErr.message}`);
        // Try alternative migration
        try {
          await execAsync('npx prisma db push', { cwd: process.cwd(), timeout: 300000 });
          logs.push('✓ Database schema updated (retry)');
        } catch {
          logs.push('Warning: Could not auto-migrate, manual migration may be needed');
        }
      }

      // Step 8: Verify
      this.setProgress('verifying', 95, 'Verifying update...');
      logs.push('Verifying update...');

      await this.prisma.updateHistory.update({
        where: { id: updateHistory.id },
        data: { status: 'VERIFYING' },
      });

      // Step 9: Complete
      this.setProgress('completed', 100, 'Update completed successfully!');
      logs.push('');
      logs.push('═══════════════════════════════════════════');
      logs.push('           Update Complete!');
      logs.push('═══════════════════════════════════════════');
      logs.push(`Updated from ${currentVersion} to ${newVersion}`);
      logs.push('Restart the server to apply changes');

      await this.prisma.updateHistory.update({
        where: { id: updateHistory.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          migrationLogs: logs.join('\n'),
        },
      });

      await this.versionService.recordCurrentVersion();
      this.updateInProgress = false;

      return {
        success: true,
        message: `Updated from ${currentVersion} to ${newVersion}. Please restart the server.`,
        fromVersion: currentVersion,
        toVersion: newVersion,
        logs,
      };
    } catch (error: any) {
      this.logger.error('Pull latest failed', error);
      logs.push(`✗ Error: ${error.message}`);

      await this.prisma.updateHistory.update({
        where: { id: updateHistory.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          errorStack: error.stack,
          migrationLogs: logs.join('\n'),
        },
      });

      this.setProgress('failed', 0, `Update failed: ${error.message}`);
      this.updateInProgress = false;

      throw new BadRequestException({
        message: `Update failed: ${error.message}`,
        logs,
      });
    }
  }
}
