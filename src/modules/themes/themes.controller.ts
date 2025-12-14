/**
 * Themes Controller
 * Handles HTTP requests for theme management
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThemesService, ThemeDesignConfig } from './themes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/themes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  /**
   * Scan and register themes
   * POST /api/themes/scan
   */
  @Post('scan')
  @Roles(UserRole.ADMIN)
  scan() {
    return this.themesService.scanThemes();
  }

  /**
   * Get all themes
   * GET /api/themes
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.themesService.findAll();
  }

  /**
   * Get active theme
   * GET /api/themes/active
   */
  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  getActive() {
    return this.themesService.getActiveTheme();
  }

  /**
   * Get theme by ID
   * GET /api/themes/:id
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.themesService.findById(id);
  }

  /**
   * Activate theme
   * POST /api/themes/:id/activate
   */
  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  activate(@Param('id') id: string) {
    return this.themesService.activate(id);
  }

  /**
   * Validate theme without installing
   * POST /api/themes/validate
   */
  @Post('validate')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  validate(@UploadedFile() file: Express.Multer.File) {
    return this.themesService.validateTheme(file);
  }

  /**
   * Upload theme
   * POST /api/themes/upload
   */
  @Post('upload')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.themesService.uploadTheme(file);
  }

  /**
   * Generate theme from visual builder
   * POST /api/themes/generate
   */
  @Post('generate')
  @Roles(UserRole.ADMIN)
  generate(@Body() config: ThemeDesignConfig) {
    return this.themesService.generateTheme(config);
  }

  /**
   * Delete theme
   * DELETE /api/themes/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) {
    return this.themesService.deleteTheme(id);
  }
}
