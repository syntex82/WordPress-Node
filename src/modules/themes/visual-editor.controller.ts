/**
 * Visual Editor Controller
 * API endpoints for the visual theme editor
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VisualEditorService } from './visual-editor.service';
import { AiThemeGeneratorService } from './ai-theme-generator.service';
import {
  MoveBlockDto,
  ReorderBlocksDto,
  InlineEditDto,
  ApplyAiThemeDto,
  CreateBlockFromTemplateDto,
} from './dto/visual-editor.dto';
import { UpdateThemeSettingsDto } from './dto/theme-customization-settings.dto';
import { GenerateAiThemeDto } from './dto/generate-ai-theme.dto';

@Controller('api/visual-editor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisualEditorController {
  constructor(
    private visualEditorService: VisualEditorService,
    private aiThemeGenerator: AiThemeGeneratorService,
  ) {}

  // ============ BLOCK MANAGEMENT ============

  @Post('blocks/:themeId')
  @Roles('ADMIN', 'EDITOR')
  async addBlock(
    @Param('themeId') themeId: string,
    @Body() body: { type: string; props?: any; position?: number; parentId?: string },
    @Req() req: any,
  ) {
    return this.visualEditorService.addBlock(
      themeId,
      req.user.id,
      { type: body.type, props: body.props },
      body.position,
      body.parentId,
    );
  }

  @Delete('blocks/:themeId/:blockId')
  @Roles('ADMIN', 'EDITOR')
  async removeBlock(
    @Param('themeId') themeId: string,
    @Param('blockId') blockId: string,
    @Req() req: any,
  ) {
    return this.visualEditorService.removeBlock(themeId, req.user.id, blockId);
  }

  @Put('blocks/:themeId/:blockId/move')
  @Roles('ADMIN', 'EDITOR')
  async moveBlock(
    @Param('themeId') themeId: string,
    @Param('blockId') blockId: string,
    @Body() body: { newOrder: number; newParentId?: string; newZone?: string },
    @Req() req: any,
  ) {
    return this.visualEditorService.moveBlock(themeId, req.user.id, {
      blockId,
      ...body,
    });
  }

  @Put('blocks/:themeId/:blockId')
  @Roles('ADMIN', 'EDITOR')
  async updateBlock(
    @Param('themeId') themeId: string,
    @Param('blockId') blockId: string,
    @Body() updates: any,
    @Req() req: any,
  ) {
    return this.visualEditorService.updateBlock(themeId, req.user.id, blockId, updates);
  }

  @Post('blocks/:themeId/:blockId/duplicate')
  @Roles('ADMIN', 'EDITOR')
  async duplicateBlock(
    @Param('themeId') themeId: string,
    @Param('blockId') blockId: string,
    @Req() req: any,
  ) {
    return this.visualEditorService.duplicateBlock(themeId, req.user.id, blockId);
  }

  @Post('blocks/:themeId/reorder')
  @Roles('ADMIN', 'EDITOR')
  async reorderBlocks(
    @Param('themeId') themeId: string,
    @Body() dto: ReorderBlocksDto,
    @Req() req: any,
  ) {
    return this.visualEditorService.reorderBlocks(themeId, req.user.id, dto);
  }

  // ============ INLINE EDITING ============

  @Post('inline-edit/:themeId')
  @Roles('ADMIN', 'EDITOR')
  async inlineEdit(@Param('themeId') themeId: string, @Body() dto: InlineEditDto, @Req() req: any) {
    return this.visualEditorService.inlineEdit(themeId, req.user.id, dto);
  }

  // ============ UNDO/REDO ============

  @Post('undo/:themeId')
  @Roles('ADMIN', 'EDITOR')
  async undo(@Param('themeId') themeId: string, @Req() req: any) {
    return this.visualEditorService.undo(themeId, req.user.id);
  }

  @Post('redo/:themeId')
  @Roles('ADMIN', 'EDITOR')
  async redo(@Param('themeId') themeId: string, @Req() req: any) {
    return this.visualEditorService.redo(themeId, req.user.id);
  }

  // ============ THEME SETTINGS ============

  @Get('settings/:themeId')
  async getThemeSettings(@Param('themeId') themeId: string) {
    return this.visualEditorService.getThemeSettings(themeId);
  }

  @Put('settings/:themeId')
  @Roles('ADMIN', 'EDITOR')
  async updateThemeSettings(
    @Param('themeId') themeId: string,
    @Body() body: { settings: any; merge?: boolean },
  ) {
    return this.visualEditorService.updateThemeSettings({
      themeId,
      settings: body.settings,
      merge: body.merge,
    });
  }

  // ============ BLOCK TEMPLATES ============

  @Get('templates')
  getBlockTemplates(@Query('category') category?: string) {
    return this.visualEditorService.getBlockTemplates(category);
  }

  @Post('templates/create-block')
  @Roles('ADMIN', 'EDITOR')
  async createBlockFromTemplate(@Body() dto: CreateBlockFromTemplateDto, @Req() req: any) {
    return this.visualEditorService.createBlockFromTemplate(dto, req.user.id);
  }

  // ============ AI INTEGRATION ============

  @Post('ai/generate')
  @Roles('ADMIN', 'EDITOR')
  async generateAiTheme(@Body() dto: GenerateAiThemeDto, @Req() req: any) {
    return this.aiThemeGenerator.generateTheme(dto, req.user.id);
  }

  @Post('ai/apply')
  @Roles('ADMIN', 'EDITOR')
  async applyAiTheme(@Body() dto: ApplyAiThemeDto, @Req() req: any) {
    return this.visualEditorService.applyAiTheme(dto, req.user.id);
  }

  @Post('ai/generate-and-apply/:themeId')
  @Roles('ADMIN', 'EDITOR')
  async generateAndApplyAiTheme(
    @Param('themeId') themeId: string,
    @Body() dto: GenerateAiThemeDto,
    @Req() req: any,
  ) {
    // Generate theme
    const generatedTheme = await this.aiThemeGenerator.generateTheme(dto, req.user.id);

    // Generate complete files
    const themeFiles = this.aiThemeGenerator.generateCompleteThemeFiles(generatedTheme);

    // Apply to existing theme
    await this.visualEditorService.updateThemeSettings({
      themeId,
      settings: {
        colors: { palette: generatedTheme.settings.colors },
        typography: {
          headingFont: {
            name: generatedTheme.settings.typography.headingFont,
            family: generatedTheme.settings.typography.headingFont,
            source: 'google' as const,
          },
          bodyFont: {
            name: generatedTheme.settings.typography.bodyFont,
            family: generatedTheme.settings.typography.bodyFont,
            source: 'google' as const,
          },
          fontSizes: { base: generatedTheme.settings.typography.baseFontSize },
          lineHeight: generatedTheme.settings.typography.lineHeight,
          headingWeight: generatedTheme.settings.typography.headingWeight,
        },
        spacing: {
          sectionPadding: generatedTheme.settings.spacing.sectionPadding,
          elementSpacing: generatedTheme.settings.spacing.elementSpacing,
          containerPadding: generatedTheme.settings.spacing.containerPadding,
        },
        borders: {
          radius: generatedTheme.settings.borders.radius,
          width: generatedTheme.settings.borders.width,
        },
        layout: {
          contentWidth: generatedTheme.settings.layout.contentWidth,
          sidebarPosition: generatedTheme.settings.layout.sidebarPosition,
        },
      },
      merge: false,
    });

    // Add generated blocks
    for (const page of generatedTheme.pages) {
      for (const block of page.blocks) {
        await this.visualEditorService.addBlock(themeId, req.user.id, block);
      }
    }

    return {
      success: true,
      theme: generatedTheme,
      files: themeFiles,
    };
  }

  @Get('ai/suggestions/:themeId')
  @Roles('ADMIN', 'EDITOR')
  async getAiSuggestions(@Param('themeId') themeId: string, @Query('context') context?: string) {
    // Get current theme settings
    const settings = await this.visualEditorService.getThemeSettings(themeId);

    // Return suggestions based on context
    const suggestions = {
      blocks: [
        { type: 'hero', reason: 'Add an eye-catching hero section' },
        { type: 'features', reason: 'Showcase your key features' },
        { type: 'testimonials', reason: 'Build trust with social proof' },
        { type: 'cta', reason: 'Drive conversions with a call-to-action' },
      ],
      colors: this.getColorSuggestions(settings),
      improvements: [
        'Consider adding a sticky header for better navigation',
        'Add more white space between sections',
        'Use a consistent button style throughout',
      ],
    };

    return suggestions;
  }

  private getColorSuggestions(settings: any) {
    // Simple color suggestions based on primary color
    const primary = settings?.colors?.palette?.primary || '#3b82f6';
    return {
      complementary: this.getComplementaryColor(primary),
      analogous: this.getAnalogousColors(primary),
      triadic: this.getTriadicColors(primary),
    };
  }

  private getComplementaryColor(hex: string): string {
    // Simple complementary color calculation
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `#${(255 - r).toString(16).padStart(2, '0')}${(255 - g).toString(16).padStart(2, '0')}${(255 - b).toString(16).padStart(2, '0')}`;
  }

  private getAnalogousColors(hex: string): string[] {
    // Placeholder - would use proper color theory
    return [hex, hex, hex];
  }

  private getTriadicColors(hex: string): string[] {
    // Placeholder - would use proper color theory
    return [hex, hex, hex];
  }

  // ============ SESSION MANAGEMENT ============

  @Post('session/clear/:themeId')
  @Roles('ADMIN', 'EDITOR')
  clearSession(@Param('themeId') themeId: string, @Req() req: any) {
    this.visualEditorService.clearSession(themeId, req.user.id);
    return { success: true };
  }
}
