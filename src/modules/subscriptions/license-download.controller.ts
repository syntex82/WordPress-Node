/**
 * License Download Controller
 * Handles secure downloads of NodePress source code for license purchasers
 */

import {
  Controller,
  Get,
  Param,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as archiver from 'archiver';

@Controller('api/license')
export class LicenseDownloadController {
  private readonly logger = new Logger(LicenseDownloadController.name);

  constructor(private prisma: PrismaService) {}

  @Get('download/:token')
  async downloadSource(@Param('token') token: string, @Res() res: Response) {
    this.logger.log(`Download request for token: ${token.substring(0, 8)}...`);

    // Find the license record
    const licenseRecord = await this.prisma.systemConfig.findUnique({
      where: { key: `license_${token}` },
    });

    if (!licenseRecord) {
      throw new HttpException('Invalid or expired download link', HttpStatus.NOT_FOUND);
    }

    let licenseData: any;
    try {
      licenseData = JSON.parse(licenseRecord.value);
    } catch {
      throw new HttpException('Invalid license data', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Check expiration
    if (new Date(licenseData.expiresAt) < new Date()) {
      throw new HttpException(
        'Download link has expired. Please contact support.',
        HttpStatus.GONE,
      );
    }

    // Update download count
    licenseData.downloadCount = (licenseData.downloadCount || 0) + 1;
    licenseData.lastDownloadAt = new Date().toISOString();
    await this.prisma.systemConfig.update({
      where: { key: `license_${token}` },
      data: { value: JSON.stringify(licenseData) },
    });

    // Create ZIP archive of the source code
    const projectRoot = path.resolve(__dirname, '../../../..');
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=nodepress-source.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Define what to include (exclude sensitive and unnecessary files)
    const includePatterns = [
      'src/**/*',
      'admin/**/*',
      'prisma/**/*',
      'public/**/*',
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'nest-cli.json',
      '.env.example',
      'docker-compose.yml',
      'Dockerfile',
      'README.md',
    ];

    const excludePatterns = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/.env',
      '**/.env.local',
      '**/uploads/**',
      '**/*.log',
      '**/coverage/**',
    ];

    // Add files to archive
    for (const pattern of includePatterns) {
      const baseName = pattern.replace('/**/*', '').replace('**/*', '');
      const fullPath = path.join(projectRoot, baseName);

      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          archive.directory(fullPath, baseName, (data) => {
            // Skip excluded files
            const relativePath = data.name;
            for (const exclude of excludePatterns) {
              const excludePattern = exclude.replace('**/', '').replace('/**', '');
              if (relativePath.includes(excludePattern)) {
                return false;
              }
            }
            return data;
          });
        } else if (stat.isFile()) {
          archive.file(fullPath, { name: baseName });
        }
      }
    }

    await archive.finalize();

    this.logger.log(`Source code downloaded for license: ${licenseData.email}`);
  }
}

