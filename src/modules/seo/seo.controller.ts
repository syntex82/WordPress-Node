/**
 * SEO Controller - API endpoints for SEO management
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
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { SeoService } from './seo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  // ============ REDIRECTS ============
  @Get('redirects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getRedirects() {
    return this.seoService.getRedirects();
  }

  @Post('redirects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createRedirect(@Body() body: { fromPath: string; toPath: string; type?: number }) {
    return this.seoService.createRedirect(body);
  }

  @Put('redirects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateRedirect(
    @Param('id') id: string,
    @Body() body: { fromPath?: string; toPath?: string; type?: number; isActive?: boolean },
  ) {
    return this.seoService.updateRedirect(id, body);
  }

  @Delete('redirects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteRedirect(@Param('id') id: string) {
    return this.seoService.deleteRedirect(id);
  }

  // ============ SITEMAP ============
  @Get('sitemap/entries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getSitemapEntries() {
    return this.seoService.getSitemapEntries();
  }

  @Post('sitemap/entries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createSitemapEntry(@Body() body: { url: string; priority?: number; changefreq?: string }) {
    return this.seoService.createSitemapEntry(body);
  }

  @Put('sitemap/entries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateSitemapEntry(@Param('id') id: string, @Body() body: any) {
    return this.seoService.updateSitemapEntry(id, body);
  }

  @Delete('sitemap/entries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteSitemapEntry(@Param('id') id: string) {
    return this.seoService.deleteSitemapEntry(id);
  }

  // Public sitemap.xml endpoint
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemap(@Res() res: Response) {
    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    const xml = await this.seoService.generateSitemap(baseUrl);
    res.send(xml);
  }

  // ============ SCHEMA MARKUP ============
  @Get('schema')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getSchemaMarkups(@Query('scope') scope?: string) {
    return this.seoService.getSchemaMarkups(scope);
  }

  @Post('schema')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createSchemaMarkup(
    @Body() body: { name: string; type: string; content: any; scope?: string; scopeId?: string },
  ) {
    return this.seoService.createSchemaMarkup(body);
  }

  @Put('schema/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateSchemaMarkup(@Param('id') id: string, @Body() body: any) {
    return this.seoService.updateSchemaMarkup(id, body);
  }

  @Delete('schema/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteSchemaMarkup(@Param('id') id: string) {
    return this.seoService.deleteSchemaMarkup(id);
  }

  // Get schemas for frontend rendering
  @Get('schema/render')
  async getSchemaForPage(@Query('scope') scope?: string, @Query('scopeId') scopeId?: string) {
    const schemas = await this.seoService.getSchemaMarkups(scope);
    const filtered = scopeId
      ? schemas.filter((s: any) => !s.scopeId || s.scopeId === scopeId)
      : schemas;
    return filtered.map((s: any) => s.content);
  }

  // ============ SEO ANALYSIS ============
  @Get('analyze/:contentType/:contentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  analyzeContent(@Param('contentType') contentType: string, @Param('contentId') contentId: string) {
    return this.seoService.analyzeContent(contentType, contentId);
  }
}
