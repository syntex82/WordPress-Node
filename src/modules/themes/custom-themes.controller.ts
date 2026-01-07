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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CustomThemesService } from './custom-themes.service';
import { CreateCustomThemeDto } from './dto/create-custom-theme.dto';
import { UpdateCustomThemeDto } from './dto/update-custom-theme.dto';
import { GenerateAiThemeDto } from './dto/generate-ai-theme.dto';
import { AiThemeGeneratorService } from './ai-theme-generator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/custom-themes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomThemesController {
  constructor(
    private readonly customThemesService: CustomThemesService,
    private readonly aiThemeGeneratorService: AiThemeGeneratorService,
    private readonly jwtService: JwtService,
  ) {}

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
   * List available AI theme presets
   * GET /api/custom-themes/presets
   * NOTE: This must be BEFORE /:id to avoid being caught by the dynamic route
   */
  @Get('presets')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  listPresets() {
    return this.aiThemeGeneratorService.listPresets();
  }

  /**
   * Get a specific preset by ID
   * GET /api/custom-themes/presets/:id
   */
  @Get('presets/:id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  getPreset(@Param('id') id: string) {
    return this.aiThemeGeneratorService.getPreset(id);
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
   * Export a custom theme as ZIP file
   * GET /api/custom-themes/:id/export-zip
   */
  @Get(':id/export-zip')
  @Roles(UserRole.ADMIN)
  async exportAsZip(@Param('id') id: string, @Res() res: Response) {
    const theme = await this.customThemesService.findById(id);
    const buffer = await this.customThemesService.exportAsZip(id);

    const slug = theme.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}.zip"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  /**
   * Install custom theme as a full installable theme
   * POST /api/custom-themes/:id/install
   */
  @Post(':id/install')
  @Roles(UserRole.ADMIN)
  installTheme(@Param('id') id: string) {
    return this.customThemesService.installTheme(id);
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

  /**
   * Generate theme using AI
   * POST /api/custom-themes/generate-ai
   */
  @Post('generate-ai')
  @Roles(UserRole.ADMIN)
  async generateAiTheme(@Body() dto: GenerateAiThemeDto, @Request() req: any) {
    return this.aiThemeGeneratorService.generateTheme(dto, req.user.id);
  }

  /**
   * Generate a short-lived preview token for iframe embedding
   * This token allows the Theme Customizer to embed the site in an iframe securely.
   * Token expires in 15 minutes and contains a 'preview' claim.
   *
   * Security considerations:
   * - Only ADMIN/EDITOR can get preview tokens
   * - Tokens are short-lived (15 min)
   * - Token is tied to user ID for audit trail
   * - Backend validates token before allowing iframe embedding
   *
   * POST /api/custom-themes/preview-token
   */
  @Post('preview-token')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  generatePreviewToken(@Request() req: any) {
    const token = this.jwtService.sign(
      {
        sub: req.user.id,
        preview: true, // Special claim to identify preview tokens
        purpose: 'theme-customizer-preview',
      },
      { expiresIn: '15m' },
    );

    return {
      token,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}
