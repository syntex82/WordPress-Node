/**
 * Settings Controller
 * Handles HTTP requests for settings management
 */

import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get all settings
   * GET /api/settings
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findAll(@Query('group') group?: string) {
    return this.settingsService.findAll(group);
  }

  /**
   * Get setting by key
   * GET /api/settings/:key
   */
  @Get(':key')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findOne(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  /**
   * Set or update setting
   * POST /api/settings
   */
  @Post()
  @Roles(UserRole.ADMIN)
  set(@Body() data: { key: string; value: any; type: string; group?: string }) {
    return this.settingsService.set(data.key, data.value, data.type, data.group);
  }

  /**
   * Delete setting
   * DELETE /api/settings/:key
   */
  @Delete(':key')
  @Roles(UserRole.ADMIN)
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
