/**
 * Demo Analytics Controller
 * Admin endpoints for viewing conversion analytics
 */

import { Controller, Get, Post, UseGuards, Res, Query, Param, Body } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DemoAnalyticsService, DemoListFilters } from './demo-analytics.service';
import { ThemeRendererService } from '../themes/theme-renderer.service';

@Controller('api/admin/demo-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DemoAnalyticsController {
  constructor(
    private readonly analyticsService: DemoAnalyticsService,
    private readonly themeRenderer: ThemeRendererService,
  ) {}

  /**
   * Analytics Dashboard Page (legacy HBS template)
   * GET /admin/demo-analytics
   */
  @Get()
  async dashboard(@Res() res: Response) {
    try {
      const metrics = await this.analyticsService.getConversionMetrics();
      const recentDemos = await this.analyticsService.getRecentDemos(20);

      const html = await this.themeRenderer.render('admin/demo-analytics', {
        title: 'Demo Conversion Analytics',
        metrics,
        recentDemos,
        layout: 'admin',
      });
      res.send(html);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get metrics as JSON API
   * GET /admin/demo-analytics/api/metrics
   */
  @Get('api/metrics')
  async getMetrics() {
    return this.analyticsService.getConversionMetrics();
  }

  /**
   * Get demo users with filtering and pagination
   * GET /admin/demo-analytics/api/users
   */
  @Get('api/users')
  async getUsers(
    @Query('status') status?: 'active' | 'expired' | 'all',
    @Query('segment') segment?: 'high_engagement' | 'low_engagement' | 'upgrade_requested' | 'all',
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'lastAccessedAt' | 'engagementScore' | 'sessionCount',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: DemoListFilters = {
      status,
      segment,
      search,
      sortBy,
      sortOrder,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    };
    return this.analyticsService.getDemoUsers(filters);
  }

  /**
   * Get single demo user detail
   * GET /admin/demo-analytics/api/users/:id
   */
  @Get('api/users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.analyticsService.getDemoUserDetail(id);
  }

  /**
   * Get sessions for a demo user
   * GET /admin/demo-analytics/api/users/:id/sessions
   */
  @Get('api/users/:id/sessions')
  async getUserSessions(@Param('id') id: string) {
    return this.analyticsService.getDemoSessions(id);
  }

  /**
   * Get login attempts for a demo user
   * GET /admin/demo-analytics/api/users/:id/logins
   */
  @Get('api/users/:id/logins')
  async getUserLogins(@Param('id') id: string) {
    return this.analyticsService.getLoginAttempts(id);
  }

  /**
   * Extend demo expiration
   * POST /admin/demo-analytics/api/users/:id/extend
   */
  @Post('api/users/:id/extend')
  async extendDemo(
    @Param('id') id: string,
    @Body('hours') hours: number,
  ) {
    await this.analyticsService.extendDemo(id, hours || 24);
    return { success: true, message: `Demo extended by ${hours || 24} hours` };
  }

  /**
   * Reset demo access token
   * POST /admin/demo-analytics/api/users/:id/reset-access
   */
  @Post('api/users/:id/reset-access')
  async resetAccess(@Param('id') id: string) {
    const newToken = await this.analyticsService.resetDemoAccess(id);
    return { success: true, newToken };
  }

  /**
   * Add user to mailing list
   * POST /admin/demo-analytics/api/users/:id/add-to-list
   */
  @Post('api/users/:id/add-to-list')
  async addToMailingList(
    @Param('id') id: string,
    @Body('listId') listId?: string,
  ) {
    await this.analyticsService.addToMailingList(id, listId);
    return { success: true };
  }

  /**
   * Remove user from mailing list
   * POST /admin/demo-analytics/api/users/:id/remove-from-list
   */
  @Post('api/users/:id/remove-from-list')
  async removeFromMailingList(@Param('id') id: string) {
    await this.analyticsService.removeFromMailingList(id);
    return { success: true };
  }

  /**
   * Bulk add users to mailing list
   * POST /admin/demo-analytics/api/bulk/add-to-list
   */
  @Post('api/bulk/add-to-list')
  async bulkAddToMailingList(
    @Body('demoIds') demoIds: string[],
    @Body('listId') listId?: string,
  ) {
    const added = await this.analyticsService.bulkAddToMailingList(demoIds, listId);
    return { success: true, added };
  }

  /**
   * Get marketing lists
   * GET /admin/demo-analytics/api/lists
   */
  @Get('api/lists')
  async getMarketingLists() {
    return this.analyticsService.getMarketingLists();
  }

  /**
   * Export demo users
   * GET /admin/demo-analytics/api/export
   */
  @Get('api/export')
  async exportUsers(
    @Res() res: Response,
    @Query('status') status?: 'active' | 'expired' | 'all',
    @Query('segment') segment?: 'high_engagement' | 'low_engagement' | 'upgrade_requested' | 'all',
  ) {
    const users = await this.analyticsService.exportDemoUsers({ status, segment });

    // Generate CSV
    const headers = Object.keys(users[0] || {}).join(',');
    const rows = users.map(u => Object.values(u).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=demo-users.csv');
    res.send(csv);
  }

  /**
   * Get recent demos as JSON API (legacy)
   * GET /admin/demo-analytics/api/demos
   */
  @Get('api/demos')
  async getDemos(@Query('limit') limit?: string) {
    return this.analyticsService.getRecentDemos(parseInt(limit || '20'));
  }
}

