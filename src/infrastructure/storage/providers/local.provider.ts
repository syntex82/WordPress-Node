/**
 * Local Storage Provider
 * Stores files on the local filesystem
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { StorageProvider, StorageFile, UploadOptions } from '../storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(@Inject('STORAGE_CONFIG') private readonly config: any) {
    this.uploadDir = this.config.local.uploadDir;
    this.baseUrl = this.config.local.baseUrl;
  }

  /**
   * Validate that a file path is within the upload directory (prevent path traversal)
   */
  private validatePath(filePath: string): string {
    const uploadBase = path.resolve(this.uploadDir);
    const fullPath = path.resolve(this.uploadDir, filePath);

    if (!fullPath.startsWith(uploadBase)) {
      throw new Error('Invalid file path: path traversal detected');
    }

    return fullPath;
  }

  async upload(file: Buffer, originalName: string, options?: UploadOptions): Promise<StorageFile> {
    const ext = path.extname(originalName);
    const filename = options?.filename || `${uuidv4()}${ext}`;
    const folder = options?.folder || this.getDateFolder();
    const relativePath = path.join(folder, filename);

    // Validate path to prevent traversal
    const fullPath = this.validatePath(relativePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file);

    const stats = await fs.stat(fullPath);

    return {
      path: relativePath.replace(/\\/g, '/'),
      url: `${this.baseUrl}/${relativePath.replace(/\\/g, '/')}`,
      size: stats.size,
      mimeType: options?.mimeType || 'application/octet-stream',
      filename,
    };
  }

  async delete(filePath: string): Promise<boolean> {
    try {
      // Validate path to prevent traversal
      const fullPath = this.validatePath(filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (_error) {
      this.logger.warn(`Failed to delete file: ${filePath}`);
      return false;
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      // Validate path to prevent traversal
      const fullPath = this.validatePath(filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath.replace(/\\/g, '/')}`;
  }

  private getDateFolder(): string {
    const now = new Date();
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
