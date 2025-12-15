/**
 * File Integrity Service
 * Monitors file changes in core directories
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventType } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

interface FileHash {
  path: string;
  hash: string;
}

export interface ScanResult {
  new: string[];
  modified: string[];
  deleted: string[];
  scannedAt: Date;
}

@Injectable()
export class FileIntegrityService {
  private readonly BASELINE_KEY = 'file_integrity_baseline';
  private readonly MONITORED_DIRS = ['src', 'prisma/schema.prisma'];

  constructor(
    private prisma: PrismaService,
    private securityEvents: SecurityEventsService,
  ) {}

  /**
   * Calculate hash of a file
   */
  private async hashFile(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Recursively scan directory and generate hashes
   */
  private async scanDirectory(dirPath: string, baseDir: string = dirPath): Promise<FileHash[]> {
    const hashes: FileHash[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip node_modules, dist, uploads, etc.
        if (
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === 'uploads' ||
          entry.name === '.git' ||
          entry.name.startsWith('.')
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          const subHashes = await this.scanDirectory(fullPath, baseDir);
          hashes.push(...subHashes);
        } else if (entry.isFile()) {
          const hash = await this.hashFile(fullPath);
          const relativePath = path.relative(baseDir, fullPath);
          hashes.push({ path: relativePath, hash });
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return hashes;
  }

  /**
   * Generate baseline hashes for monitored directories
   */
  async generateBaseline(userId?: string): Promise<FileHash[]> {
    const allHashes: FileHash[] = [];

    for (const dir of this.MONITORED_DIRS) {
      const dirPath = path.join(process.cwd(), dir);

      try {
        const stats = await fs.stat(dirPath);

        if (stats.isDirectory()) {
          const hashes = await this.scanDirectory(dirPath);
          allHashes.push(...hashes);
        } else if (stats.isFile()) {
          const hash = await this.hashFile(dirPath);
          allHashes.push({ path: dir, hash });
        }
      } catch (error) {
        console.error(`Error processing ${dir}:`, error);
      }
    }

    // Store baseline in database
    await this.prisma.setting.upsert({
      where: { key: this.BASELINE_KEY },
      create: {
        key: this.BASELINE_KEY,
        value: allHashes as any,
        type: 'json',
        group: 'security',
      },
      update: {
        value: allHashes as any,
      },
    });

    // Log the event
    if (userId) {
      await this.securityEvents.createEvent({
        userId,
        type: SecurityEventType.INTEGRITY_SCAN,
        metadata: {
          action: 'baseline_generated',
          fileCount: allHashes.length,
        },
      });
    }

    return allHashes;
  }

  /**
   * Scan for file changes compared to baseline
   */
  async scanForChanges(userId?: string): Promise<ScanResult> {
    // Get baseline
    const baselineSetting = await this.prisma.setting.findUnique({
      where: { key: this.BASELINE_KEY },
    });

    if (!baselineSetting) {
      throw new Error('No baseline found. Please generate a baseline first.');
    }

    const baseline = baselineSetting.value as unknown as FileHash[];
    const baselineMap = new Map(baseline.map((f) => [f.path, f.hash]));

    // Get current state
    const current = await this.generateCurrentHashes();
    const currentMap = new Map(current.map((f) => [f.path, f.hash]));

    // Compare
    const result: ScanResult = {
      new: [],
      modified: [],
      deleted: [],
      scannedAt: new Date(),
    };

    // Find new and modified files
    for (const [filePath, hash] of currentMap) {
      if (!baselineMap.has(filePath)) {
        result.new.push(filePath);
      } else if (baselineMap.get(filePath) !== hash) {
        result.modified.push(filePath);
      }
    }

    // Find deleted files
    for (const filePath of baselineMap.keys()) {
      if (!currentMap.has(filePath)) {
        result.deleted.push(filePath);
      }
    }

    // Log the scan
    if (userId) {
      await this.securityEvents.createEvent({
        userId,
        type: SecurityEventType.INTEGRITY_SCAN,
        metadata: {
          action: 'scan_completed',
          new: result.new.length,
          modified: result.modified.length,
          deleted: result.deleted.length,
        },
      });
    }

    return result;
  }

  /**
   * Generate hashes for current state (without saving)
   */
  private async generateCurrentHashes(): Promise<FileHash[]> {
    const allHashes: FileHash[] = [];

    for (const dir of this.MONITORED_DIRS) {
      const dirPath = path.join(process.cwd(), dir);

      try {
        const stats = await fs.stat(dirPath);

        if (stats.isDirectory()) {
          const hashes = await this.scanDirectory(dirPath);
          allHashes.push(...hashes);
        } else if (stats.isFile()) {
          const hash = await this.hashFile(dirPath);
          allHashes.push({ path: dir, hash });
        }
      } catch (error) {
        // File might have been deleted
      }
    }

    return allHashes;
  }
}
