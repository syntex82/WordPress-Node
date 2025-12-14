/**
 * Plugins Controller
 * Handles HTTP requests for plugin management
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PluginsService } from './plugins.service';
import { PluginLoaderService } from './plugin-loader.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/plugins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PluginsController {
  constructor(
    private readonly pluginsService: PluginsService,
    private readonly pluginLoader: PluginLoaderService,
  ) {}

  // Static routes MUST come before parameterized routes

  /**
   * Scan and register plugins
   * POST /api/plugins/scan
   */
  @Post('scan')
  @Roles(UserRole.ADMIN)
  scan() {
    return this.pluginsService.scanPlugins();
  }

  /**
   * Validate plugin without installing
   * POST /api/plugins/validate
   */
  @Post('validate')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  validate(@UploadedFile() file: Express.Multer.File) {
    return this.pluginsService.validatePlugin(file);
  }

  /**
   * Upload and install plugin
   * POST /api/plugins/upload
   */
  @Post('upload')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.pluginsService.uploadPlugin(file);
  }

  /**
   * Get active plugins
   * GET /api/plugins/active
   */
  @Get('active')
  @Roles(UserRole.ADMIN)
  findActive() {
    return this.pluginsService.findActive();
  }

  /**
   * Get all plugins
   * GET /api/plugins
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.pluginsService.findAll();
  }

  // Parameterized routes come AFTER static routes

  /**
   * Get plugin by ID
   * GET /api/plugins/:id
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.pluginsService.findById(id);
  }

  /**
   * Activate plugin
   * POST /api/plugins/:id/activate
   */
  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string) {
    const plugin = await this.pluginsService.activate(id);
    await this.pluginLoader.loadPlugin(plugin.slug);
    return plugin;
  }

  /**
   * Deactivate plugin
   * POST /api/plugins/:id/deactivate
   */
  @Post(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    const plugin = await this.pluginsService.findById(id);
    await this.pluginLoader.unloadPlugin(plugin.slug);
    return this.pluginsService.deactivate(id);
  }

  /**
   * Delete plugin
   * DELETE /api/plugins/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    const plugin = await this.pluginsService.findById(id);
    if (plugin.isActive) {
      await this.pluginLoader.unloadPlugin(plugin.slug);
    }
    return this.pluginsService.deletePlugin(id);
  }

  /**
   * Update plugin settings
   * PATCH /api/plugins/:id/settings
   */
  @Patch(':id/settings')
  @Roles(UserRole.ADMIN)
  updateSettings(@Param('id') id: string, @Body() settings: any) {
    return this.pluginsService.updateSettings(id, settings);
  }
}
