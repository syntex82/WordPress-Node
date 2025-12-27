import { Controller, Get, Post, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CustomizationExportService } from '../services/customization-export.service';

@Controller('api/customizations')
export class CustomizationExportController {
  constructor(private readonly exportService: CustomizationExportService) {}

  /**
   * Export all page customizations
   * GET /api/customizations/export/pages
   */
  @Get('export/pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async exportPages(@Res() res: Response) {
    try {
      const data = await this.exportService.exportPageCustomizations();
      const filename = `page-customizations-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(data, null, 2));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Export all post customizations
   * GET /api/customizations/export/posts
   */
  @Get('export/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async exportPosts(@Res() res: Response) {
    try {
      const data = await this.exportService.exportPostCustomizations();
      const filename = `post-customizations-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(data, null, 2));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Export all customizations
   * GET /api/customizations/export/all
   */
  @Get('export/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async exportAll(@Res() res: Response) {
    try {
      const data = await this.exportService.exportAllCustomizations();
      const filename = `all-customizations-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(data, null, 2));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Import customizations from file
   * POST /api/customizations/import
   */
  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async import(@Body() data: any) {
    try {
      const result = await this.exportService.importCustomizations(data);
      return {
        success: true,
        message: `Successfully imported ${result.imported} customizations`,
        imported: result.imported,
        failed: result.failed,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
