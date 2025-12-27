/**
 * Analytics Controller - API endpoints for analytics dashboard
 * Admin dashboard routes require Analytics feature in subscription
 */
import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FeatureGuard } from '../../common/guards/feature.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  RequiresFeature,
  SUBSCRIPTION_FEATURES,
} from '../../common/decorators/subscription.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  // Admin endpoints (protected + requires analytics feature)
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getDashboardStats(@Query('period') period?: string) {
    return this.analyticsService.getDashboardStats(period || 'week');
  }

  @Get('pageviews')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getPageViewsOverTime(@Query('period') period?: string) {
    return this.analyticsService.getPageViewsOverTime(period || 'week');
  }

  @Get('top-pages')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getTopPages(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getTopPages(period || 'week', parseInt(limit || '10'));
  }

  @Get('traffic-sources')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getTrafficSources(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getTrafficSources(period || 'week', parseInt(limit || '10'));
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getDeviceBreakdown(@Query('period') period?: string) {
    return this.analyticsService.getDeviceBreakdown(period || 'week');
  }

  @Get('browsers')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getBrowserBreakdown(@Query('period') period?: string) {
    return this.analyticsService.getBrowserBreakdown(period || 'week');
  }

  @Get('realtime')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getRealTimeStats() {
    return this.analyticsService.getRealTimeStats();
  }

  // Public tracking endpoints (no auth required)
  @Post('track/pageview')
  async trackPageView(@Req() req: Request, @Body() body: { path: string; sessionId?: string }) {
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || null;
    const ip = this.anonymizeIp(req.ip || req.socket.remoteAddress || '');
    const { device, browser, os } = this.parseUserAgent(userAgent);

    // Ensure sessionId is a string or null, not an object
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

    return this.prisma.pageView.create({
      data: {
        path: body.path,
        sessionId,
        ipAddress: ip,
        userAgent,
        referer,
        device,
        browser,
        os,
      },
    });
  }

  @Post('track/event')
  async trackEvent(
    @Req() req: Request,
    @Body()
    body: {
      category: string;
      action: string;
      label?: string;
      value?: number;
      path?: string;
      sessionId?: string;
    },
  ) {
    const ip = this.anonymizeIp(req.ip || req.socket.remoteAddress || '');

    // Ensure sessionId is a string or null, not an object
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

    return this.prisma.analyticsEvent.create({
      data: {
        category: body.category,
        action: body.action,
        label: body.label,
        value: body.value,
        path: body.path,
        sessionId,
        ipAddress: ip,
      },
    });
  }

  @Post('track/session')
  async trackSession(@Req() req: Request, @Body() body: { path?: string }) {
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || null;
    const ip = this.anonymizeIp(req.ip || req.socket.remoteAddress || '');
    const { device, browser, os } = this.parseUserAgent(userAgent);

    const session = await this.prisma.analyticsSession.create({
      data: {
        ipAddress: ip,
        userAgent,
        device,
        browser,
        os,
        referer,
        landingPage: body.path,
      },
    });
    return { sessionId: session.id };
  }

  /**
   * Anonymize IP address for GDPR compliance
   * Removes the last octet for IPv4 or last 80 bits for IPv6
   */
  private anonymizeIp(ip: string): string {
    if (!ip) return '';
    // IPv4: Replace last octet with 0
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        parts[3] = '0';
        return parts.join('.');
      }
    }
    // IPv6: Replace last 80 bits (last 5 groups) with zeros
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 5) {
        return parts.slice(0, 3).join(':') + ':0:0:0:0:0';
      }
    }
    return ip;
  }

  private parseUserAgent(ua: string) {
    const uaLower = ua.toLowerCase();
    let device = 'desktop';
    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
      device = /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
    }
    let browser = 'unknown';
    if (uaLower.includes('firefox')) browser = 'Firefox';
    else if (uaLower.includes('edg')) browser = 'Edge';
    else if (uaLower.includes('chrome')) browser = 'Chrome';
    else if (uaLower.includes('safari')) browser = 'Safari';
    else if (uaLower.includes('opera') || uaLower.includes('opr')) browser = 'Opera';
    let os = 'unknown';
    if (uaLower.includes('windows')) os = 'Windows';
    else if (uaLower.includes('mac')) os = 'macOS';
    else if (uaLower.includes('linux')) os = 'Linux';
    else if (uaLower.includes('android')) os = 'Android';
    else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS';
    return { device, browser, os };
  }
}
