/**
 * Theme Marketplace Controller
 * API endpoints for browsing, submitting, and installing marketplace themes
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
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('api/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /**
   * Get all marketplace themes (public)
   * GET /api/marketplace/themes
   */
  @Get('themes')
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'downloads' | 'rating' | 'newest' | 'name',
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
   * Get featured themes (public)
   * GET /api/marketplace/featured
   */
  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    return this.marketplaceService.getFeatured(limit ? parseInt(limit) : 6);
  }

  /**
   * Get marketplace statistics
   * GET /api/marketplace/stats
   */
  @Get('stats')
  getStats() {
    return this.marketplaceService.getStats();
  }

  /**
   * Get categories with counts
   * GET /api/marketplace/categories
   */
  @Get('categories')
  getCategories() {
    return this.marketplaceService.getCategories();
  }

  /**
   * Get theme by ID (public)
   * GET /api/marketplace/themes/:id
   */
  @Get('themes/:id')
  findById(@Param('id') id: string) {
    return this.marketplaceService.findById(id);
  }

  /**
   * Get theme by slug (public)
   * GET /api/marketplace/themes/slug/:slug
   */
  @Get('themes/slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.marketplaceService.findBySlug(slug);
  }

  /**
   * Submit a theme to the marketplace
   * POST /api/marketplace/submit
   * Accepts: file (theme ZIP), thumbnail (image)
   */
  @Post('submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]))
  submitTheme(
    @UploadedFiles() files: { file?: Express.Multer.File[], thumbnail?: Express.Multer.File[] },
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
      category: body.category || 'blog',
      tags: body.tags ? JSON.parse(body.tags) : [],
      features: body.features ? JSON.parse(body.features) : [],
      demoUrl: body.demoUrl,
      repositoryUrl: body.repositoryUrl,
      licenseType: body.licenseType,
    };
    if (!files.file?.[0]) {
      throw new Error('Theme file is required');
    }
    return this.marketplaceService.submitTheme(dto, {
      themeFile: files.file[0],
      thumbnailFile: files.thumbnail?.[0],
    }, req.user.id);
  }

  /**
   * Install a theme from the marketplace
   * POST /api/marketplace/themes/:id/install
   */
  @Post('themes/:id/install')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  installTheme(@Param('id') id: string) {
    return this.marketplaceService.installTheme(id);
  }

  /**
   * Rate a theme
   * POST /api/marketplace/themes/:id/rate
   */
  @Post('themes/:id/rate')
  @UseGuards(JwtAuthGuard)
  rateTheme(
    @Param('id') id: string,
    @Body() body: { rating: number; review?: string },
    @Request() req: any,
  ) {
    return this.marketplaceService.rateTheme(id, req.user.id, body.rating, body.review);
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all themes including pending (admin)
   * GET /api/marketplace/admin/themes
   */
  @Get('admin/themes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: 'downloads' | 'rating' | 'newest' | 'name',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.findAll({
      category,
      search,
      status: status || undefined, // Show all if not specified
      sortBy,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /**
   * Approve a theme
   * POST /api/marketplace/admin/themes/:id/approve
   */
  @Post('admin/themes/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  approveTheme(@Param('id') id: string, @Request() req: any) {
    return this.marketplaceService.approveTheme(id, req.user.id);
  }

  /**
   * Reject a theme
   * POST /api/marketplace/admin/themes/:id/reject
   */
  @Post('admin/themes/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  rejectTheme(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.marketplaceService.rejectTheme(id, req.user.id, body.reason);
  }

  /**
   * Set theme as featured
   * POST /api/marketplace/admin/themes/:id/feature
   */
  @Post('admin/themes/:id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setFeatured(
    @Param('id') id: string,
    @Body() body: { featured: boolean; order?: number },
  ) {
    return this.marketplaceService.setFeatured(id, body.featured, body.order);
  }

  /**
   * Delete a theme from marketplace
   * DELETE /api/marketplace/admin/themes/:id
   */
  @Delete('admin/themes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteTheme(@Param('id') id: string) {
    return this.marketplaceService.deleteTheme(id);
  }

  /**
   * Bulk approve themes
   * POST /api/marketplace/admin/bulk/approve
   */
  @Post('admin/bulk/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkApprove(@Body() body: { ids: string[] }, @Request() req: any) {
    return this.marketplaceService.bulkApprove(body.ids, req.user.id);
  }

  /**
   * Bulk reject themes
   * POST /api/marketplace/admin/bulk/reject
   */
  @Post('admin/bulk/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkReject(@Body() body: { ids: string[]; reason: string }, @Request() req: any) {
    return this.marketplaceService.bulkReject(body.ids, req.user.id, body.reason);
  }

  /**
   * Bulk delete themes
   * POST /api/marketplace/admin/bulk/delete
   */
  @Post('admin/bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkDelete(@Body() body: { ids: string[] }) {
    return this.marketplaceService.bulkDelete(body.ids);
  }
}

