/**
 * Plugin Marketplace Controller
 * API endpoints for browsing, submitting, and installing marketplace plugins
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
  UseInterceptors,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PluginMarketplaceService } from './plugin-marketplace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('api/plugin-marketplace')
export class PluginMarketplaceController {
  constructor(private readonly marketplaceService: PluginMarketplaceService) {}

  /**
   * Get all marketplace plugins (public)
   * GET /api/plugin-marketplace/plugins
   */
  @Get('plugins')
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'downloads' | 'rating' | 'newest' | 'name' | 'activeInstalls',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.findAll({
      category,
      search,
      status: 'approved',
      sortBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /**
   * Get featured plugins (public)
   * GET /api/plugin-marketplace/featured
   */
  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    return this.marketplaceService.getFeatured(limit ? parseInt(limit) : 6);
  }

  /**
   * Get marketplace statistics
   * GET /api/plugin-marketplace/stats
   */
  @Get('stats')
  getStats() {
    return this.marketplaceService.getStats();
  }

  /**
   * Get categories with counts
   * GET /api/plugin-marketplace/categories
   */
  @Get('categories')
  getCategories() {
    return this.marketplaceService.getCategories();
  }

  /**
   * Get plugin by ID (public)
   * GET /api/plugin-marketplace/plugins/:id
   */
  @Get('plugins/:id')
  findById(@Param('id') id: string) {
    return this.marketplaceService.findById(id);
  }

  /**
   * Get plugin by slug (public)
   * GET /api/plugin-marketplace/plugins/slug/:slug
   */
  @Get('plugins/slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.marketplaceService.findBySlug(slug);
  }

  /**
   * Submit a plugin to the marketplace
   * POST /api/plugin-marketplace/submit
   */
  @Post('submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'icon', maxCount: 1 },
    ]),
  )
  submitPlugin(
    @UploadedFiles() files: { file?: Express.Multer.File[]; icon?: Express.Multer.File[] },
    @Body() body: any,
    @Request() req: any,
  ) {
    const dto = {
      name: body.name,
      description: body.description,
      longDescription: body.longDescription,
      version: body.version || '1.0.0',
      author: body.author || req.user.name,
      authorEmail: body.authorEmail || req.user.email,
      authorUrl: body.authorUrl,
      category: body.category || 'utility',
      tags: body.tags ? JSON.parse(body.tags) : [],
      features: body.features ? JSON.parse(body.features) : [],
      repositoryUrl: body.repositoryUrl,
      licenseType: body.licenseType,
    };
    if (!files.file?.[0]) {
      throw new Error('Plugin file is required');
    }
    return this.marketplaceService.submitPlugin(
      dto,
      {
        pluginFile: files.file[0],
        iconFile: files.icon?.[0],
      },
      req.user.id,
    );
  }

  /**
   * Install a plugin from the marketplace
   * POST /api/plugin-marketplace/plugins/:id/install
   */
  @Post('plugins/:id/install')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  installPlugin(@Param('id') id: string) {
    return this.marketplaceService.installPlugin(id);
  }

  /**
   * Rate a plugin
   * POST /api/plugin-marketplace/plugins/:id/rate
   */
  @Post('plugins/:id/rate')
  @UseGuards(JwtAuthGuard)
  ratePlugin(
    @Param('id') id: string,
    @Body() body: { rating: number; review?: string },
    @Request() req: any,
  ) {
    return this.marketplaceService.ratePlugin(id, req.user.id, body.rating, body.review);
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all plugins including pending (admin)
   * GET /api/plugin-marketplace/admin/plugins
   */
  @Get('admin/plugins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: 'downloads' | 'rating' | 'newest' | 'name' | 'activeInstalls',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.findAll({
      category,
      search,
      status: status || undefined,
      sortBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /**
   * Approve a plugin
   * POST /api/plugin-marketplace/admin/plugins/:id/approve
   */
  @Post('admin/plugins/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  approvePlugin(@Param('id') id: string, @Request() req: any) {
    return this.marketplaceService.approvePlugin(id, req.user.id);
  }

  /**
   * Reject a plugin
   * POST /api/plugin-marketplace/admin/plugins/:id/reject
   */
  @Post('admin/plugins/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  rejectPlugin(@Param('id') id: string, @Body() body: { reason: string }, @Request() req: any) {
    return this.marketplaceService.rejectPlugin(id, req.user.id, body.reason);
  }

  /**
   * Set plugin as featured
   * POST /api/plugin-marketplace/admin/plugins/:id/feature
   */
  @Post('admin/plugins/:id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setFeatured(@Param('id') id: string, @Body() body: { featured: boolean; order?: number }) {
    return this.marketplaceService.setFeatured(id, body.featured, body.order);
  }

  /**
   * Delete a plugin from marketplace
   * DELETE /api/plugin-marketplace/admin/plugins/:id
   */
  @Delete('admin/plugins/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deletePlugin(@Param('id') id: string) {
    return this.marketplaceService.deletePlugin(id);
  }

  /**
   * Bulk approve plugins
   * POST /api/plugin-marketplace/admin/bulk/approve
   */
  @Post('admin/bulk/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkApprove(@Body() body: { ids: string[] }, @Request() req: any) {
    return this.marketplaceService.bulkApprove(body.ids, req.user.id);
  }

  /**
   * Bulk reject plugins
   * POST /api/plugin-marketplace/admin/bulk/reject
   */
  @Post('admin/bulk/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkReject(@Body() body: { ids: string[]; reason: string }, @Request() req: any) {
    return this.marketplaceService.bulkReject(body.ids, req.user.id, body.reason);
  }

  /**
   * Bulk delete plugins
   * POST /api/plugin-marketplace/admin/bulk/delete
   */
  @Post('admin/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkDelete(@Body() body: { ids: string[] }) {
    return this.marketplaceService.bulkDelete(body.ids);
  }
}
