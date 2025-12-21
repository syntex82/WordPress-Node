/**
 * Updates Controller
 * API endpoints for system updates
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdatesService } from './updates.service';
import { VersionService } from './version.service';

@Controller('api/updates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UpdatesController {
  constructor(
    private updatesService: UpdatesService,
    private versionService: VersionService,
  ) {}

  /**
   * Get current update status
   * GET /api/updates/status
   */
  @Get('status')
  async getStatus() {
    return this.updatesService.getStatus();
  }

  /**
   * Check for available updates
   * GET /api/updates/check
   */
  @Get('check')
  async checkForUpdates() {
    return this.updatesService.checkForUpdates();
  }

  /**
   * Get available updates list
   * GET /api/updates/available
   */
  @Get('available')
  async getAvailableUpdates() {
    return this.versionService.getAvailableUpdates();
  }

  /**
   * Get version history
   * GET /api/updates/history
   */
  @Get('history')
  async getUpdateHistory(@Query('limit') limit?: string) {
    return this.updatesService.getUpdateHistory(limit ? parseInt(limit, 10) : 20);
  }

  /**
   * Get version compatibility check
   * GET /api/updates/compatibility/:version
   */
  @Get('compatibility/:version')
  async checkCompatibility(@Param('version') version: string) {
    return this.versionService.checkCompatibility(version);
  }

  /**
   * Download an update
   * POST /api/updates/download
   */
  @Post('download')
  async downloadUpdate(@Body() body: { version: string }) {
    return this.updatesService.downloadUpdate(body.version);
  }

  /**
   * Apply an update
   * POST /api/updates/apply
   */
  @Post('apply')
  async applyUpdate(@Body() body: { version: string }, @Request() req: any) {
    return this.updatesService.applyUpdate(body.version, req.user?.id);
  }

  /**
   * Rollback an update
   * POST /api/updates/rollback/:id
   */
  @Post('rollback/:id')
  async rollback(@Param('id') id: string) {
    return this.updatesService.rollback(id);
  }

  /**
   * Get current version info
   * GET /api/updates/version
   */
  @Get('version')
  async getVersionInfo() {
    const currentVersion = this.versionService.getCurrentVersion();
    const versionHistory = await this.versionService.getVersionHistory();
    
    return {
      currentVersion,
      versionHistory,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }
}

