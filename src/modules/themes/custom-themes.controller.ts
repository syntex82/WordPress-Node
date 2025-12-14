/**
 * Custom Themes Controller
 * Handles HTTP requests for custom theme management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  CustomThemesService,
  CreateCustomThemeDto,
  UpdateCustomThemeDto,
} from './custom-themes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/custom-themes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomThemesController {
  constructor(private readonly customThemesService: CustomThemesService) {}

  /**
   * Get all custom themes
   * GET /api/custom-themes
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.customThemesService.findAll();
  }

  /**
   * Get active custom theme
   * GET /api/custom-themes/active
   */
  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  getActive() {
    return this.customThemesService.getActiveTheme();
  }

  /**
   * Get custom theme by ID
   * GET /api/custom-themes/:id
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.customThemesService.findById(id);
  }

  /**
   * Create a new custom theme
   * POST /api/custom-themes
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCustomThemeDto, @Request() req: any) {
    return this.customThemesService.create(dto, req.user.id);
  }

  /**
   * Update a custom theme
   * PUT /api/custom-themes/:id
   */
  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCustomThemeDto) {
    return this.customThemesService.update(id, dto);
  }

  /**
   * Delete a custom theme
   * DELETE /api/custom-themes/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) {
    return this.customThemesService.delete(id);
  }

  /**
   * Duplicate a custom theme
   * POST /api/custom-themes/:id/duplicate
   */
  @Post(':id/duplicate')
  @Roles(UserRole.ADMIN)
  duplicate(@Param('id') id: string, @Body() body: { name?: string }, @Request() req: any) {
    return this.customThemesService.duplicate(id, req.user.id, body.name);
  }

  /**
   * Activate a custom theme
   * POST /api/custom-themes/:id/activate
   */
  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  activate(@Param('id') id: string) {
    return this.customThemesService.activate(id);
  }

  /**
   * Export a custom theme as JSON
   * GET /api/custom-themes/:id/export
   */
  @Get(':id/export')
  @Roles(UserRole.ADMIN)
  exportTheme(@Param('id') id: string) {
    return this.customThemesService.exportTheme(id);
  }

  /**
   * Import a custom theme from JSON
   * POST /api/custom-themes/import
   */
  @Post('import')
  @Roles(UserRole.ADMIN)
  importTheme(@Body() data: any, @Request() req: any) {
    return this.customThemesService.importTheme(data, req.user.id);
  }

  /**
   * Generate CSS from theme settings
   * POST /api/custom-themes/generate-css
   */
  @Post('generate-css')
  @Roles(UserRole.ADMIN)
  generateCSS(@Body() body: { settings: any; customCSS?: string }) {
    return { css: this.customThemesService.generateCSS(body.settings, body.customCSS) };
  }
}
