/**
 * Demo Analytics Controller
 * Admin endpoints for viewing conversion analytics
 */

import { Controller, Get, UseGuards, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DemoAnalyticsService } from './demo-analytics.service';
import { ThemeRendererService } from '../themes/theme-renderer.service';

@Controller('admin/demo-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DemoAnalyticsController {
  constructor(
    private readonly analyticsService: DemoAnalyticsService,
    private readonly themeRenderer: ThemeRendererService,
  ) {}

  /**
   * Analytics Dashboard Page
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
   * Get recent demos as JSON API
   * GET /admin/demo-analytics/api/demos
   */
  @Get('api/demos')
  async getDemos(@Query('limit') limit?: string) {
    return this.analyticsService.getRecentDemos(parseInt(limit || '20'));
  }
}

