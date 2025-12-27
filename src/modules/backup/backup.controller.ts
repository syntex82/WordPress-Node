/**
 * Backup Controller
 * API endpoints for backup management
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  Res,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { BackupService, CreateBackupDto } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BackupStatus, BackupType, UserRole } from '@prisma/client';

@Controller('api/backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BackupController {
  constructor(private backupService: BackupService) {}

  /**
   * Create a new backup
   * POST /api/backups
   */
  @Post()
  async create(@Body() dto: CreateBackupDto, @Request() req: any) {
    return this.backupService.create(dto, req.user.id);
  }

  /**
   * List all backups
   * GET /api/backups
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: BackupStatus,
    @Query('type') type?: BackupType,
  ) {
    return this.backupService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      type,
    });
  }

  /**
   * Get backup statistics
   * GET /api/backups/stats
   */
  @Get('stats')
  async getStats() {
    return this.backupService.getStats();
  }

  /**
   * Get a single backup
   * GET /api/backups/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const backup = await this.backupService.findOne(id);
    if (!backup) {
      throw new NotFoundException('Backup not found');
    }
    return backup;
  }

  /**
   * Download a backup file
   * GET /api/backups/:id/download
   */
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const backup = await this.backupService.findOne(id);
    if (!backup) {
      throw new NotFoundException('Backup not found');
    }
    if (!backup.filePath) {
      throw new NotFoundException('Backup file not available');
    }

    const filePath = this.backupService.getFilePath(backup.filePath);
    if (!filePath) {
      throw new NotFoundException('Backup file not found on disk');
    }

    res.download(filePath, backup.filePath);
  }

  /**
   * Delete a backup
   * DELETE /api/backups/:id
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const backup = await this.backupService.findOne(id);
    if (!backup) {
      throw new NotFoundException('Backup not found');
    }
    await this.backupService.delete(id);
    return { success: true };
  }

  /**
   * Create a quick backup (full backup with auto-generated name)
   * POST /api/backups/quick
   */
  @Post('quick')
  async quickBackup(@Request() req: any) {
    const name = `Quick Backup - ${new Date().toLocaleString()}`;
    return this.backupService.create({ name, type: 'FULL' }, req.user.id);
  }

  /**
   * Create a database-only backup
   * POST /api/backups/database
   */
  @Post('database')
  async databaseBackup(@Request() req: any) {
    const name = `Database Backup - ${new Date().toLocaleString()}`;
    return this.backupService.create(
      {
        name,
        type: 'DATABASE',
        includesDatabase: true,
        includesMedia: false,
        includesThemes: false,
        includesPlugins: false,
      },
      req.user.id,
    );
  }

  /**
   * Restore from a backup
   * POST /api/backups/:id/restore
   */
  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @Body()
    options: {
      restoreDatabase?: boolean;
      restoreMedia?: boolean;
      restoreThemes?: boolean;
      restorePlugins?: boolean;
    },
  ) {
    const backup = await this.backupService.findOne(id);
    if (!backup) {
      throw new NotFoundException('Backup not found');
    }
    if (backup.status !== 'COMPLETED') {
      throw new ForbiddenException('Cannot restore from incomplete backup');
    }
    return this.backupService.restore(id, options);
  }
}
