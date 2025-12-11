/**
 * Theme Editor Controller
 * Handles HTTP requests for theme file editing
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ThemeEditorService } from './theme-editor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/theme-editor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Only admins can edit themes
export class ThemeEditorController {
  constructor(private readonly themeEditorService: ThemeEditorService) {}

  /**
   * Get file tree for a theme
   * GET /api/theme-editor/:themeSlug/files
   */
  @Get(':themeSlug/files')
  getFileTree(@Param('themeSlug') themeSlug: string) {
    return this.themeEditorService.getFileTree(themeSlug);
  }

  /**
   * Read file content
   * GET /api/theme-editor/:themeSlug/file
   */
  @Get(':themeSlug/file')
  readFile(
    @Param('themeSlug') themeSlug: string,
    @Query('path') filePath: string,
  ) {
    return this.themeEditorService.readFile(themeSlug, filePath);
  }

  /**
   * Save file content
   * POST /api/theme-editor/:themeSlug/file
   */
  @Post(':themeSlug/file')
  saveFile(
    @Param('themeSlug') themeSlug: string,
    @Body() body: { path: string; content: string },
  ) {
    return this.themeEditorService.saveFile(themeSlug, body.path, body.content);
  }

  /**
   * Create backup
   * POST /api/theme-editor/:themeSlug/backup
   */
  @Post(':themeSlug/backup')
  createBackup(
    @Param('themeSlug') themeSlug: string,
    @Body() body?: { name?: string },
  ) {
    return this.themeEditorService.createBackup(themeSlug, body?.name);
  }

  /**
   * List backups
   * GET /api/theme-editor/:themeSlug/backups
   */
  @Get(':themeSlug/backups')
  listBackups(@Param('themeSlug') themeSlug: string) {
    return this.themeEditorService.listBackups(themeSlug);
  }

  /**
   * Restore from backup
   * POST /api/theme-editor/:themeSlug/restore
   */
  @Post(':themeSlug/restore')
  restoreBackup(
    @Param('themeSlug') themeSlug: string,
    @Body() body: { backupId: string },
  ) {
    return this.themeEditorService.restoreBackup(themeSlug, body.backupId);
  }

  /**
   * Delete backup
   * DELETE /api/theme-editor/:themeSlug/backup/:backupId
   */
  @Delete(':themeSlug/backup/:backupId')
  deleteBackup(
    @Param('themeSlug') themeSlug: string,
    @Param('backupId') backupId: string,
  ) {
    return this.themeEditorService.deleteBackup(themeSlug, backupId);
  }

  /**
   * Validate file
   * POST /api/theme-editor/validate
   */
  @Post('validate')
  validateFile(@Body() body: { path: string; content: string }) {
    return this.themeEditorService.validateFile(body.path, body.content);
  }
}

