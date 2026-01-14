/**
 * Analytics Controller - Comprehensive self-hosted analytics API
 * A complete Google Analytics replacement with GDPR compliance
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Res,
  UseGuards,
  Req,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
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
import { PrismaService } from '../../database/prisma.service';

// In-memory cache for geolocation to avoid rate limits
const geoCache = new Map<string, { data: GeoData | null; timestamp: number }>();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface GeoData {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
}

@Controller('api/analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get geolocation data from IP address using ip-api.com (free service)
   * Rate limit: 45 requests/minute for free tier
   */
  private async getGeoFromIp(ip: string): Promise<GeoData | null> {
    // Skip private/local IPs
    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') ||
        ip.startsWith('10.') || ip.startsWith('172.') || ip === '::1') {
      return null;
    }

    // Check cache first
    const cached = geoCache.get(ip);
    if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon`);
      const data = await response.json();

      if (data.status === 'success') {
        const geoData: GeoData = {
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          lat: data.lat,
          lon: data.lon,
        };
        geoCache.set(ip, { data: geoData, timestamp: Date.now() });
        return geoData;
      }
    } catch (error) {
      this.logger.warn(`Geolocation lookup failed for IP ${ip}: ${error}`);
    }

    geoCache.set(ip, { data: null, timestamp: Date.now() });
    return null;
  }

  /**
   * Get client IP from request, handling proxies
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      return realIp;
    }
    return req.ip || req.socket?.remoteAddress || '';
  }

  // ============================================
  // ADMIN DASHBOARD ENDPOINTS
  // ============================================

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getDashboardStats(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getDashboardStats(period || 'week', startDate, endDate);
  }

  @Get('pageviews')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getPageViewsOverTime(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getPageViewsOverTime(period || 'week', startDate, endDate);
  }

  @Get('top-pages')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getTopPages(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getTopPages(period || 'week', parseInt(limit || '10'));
  }

  @Get('entry-pages')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getEntryPages(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getEntryPages(period || 'week', parseInt(limit || '10'));
  }

  @Get('exit-pages')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getExitPages(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getExitPages(period || 'week', parseInt(limit || '10'));
  }

  @Get('traffic-sources')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getTrafficSources(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getTrafficSources(period || 'week', parseInt(limit || '10'));
  }

  @Get('campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getCampaignAnalytics(@Query('period') period?: string) {
    return this.analyticsService.getCampaignAnalytics(period || 'week');
  }

  @Get('geographic')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getGeographicData(@Query('period') period?: string) {
    return this.analyticsService.getGeographicData(period || 'week');
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

  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getEventAnalytics(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getEventAnalytics(period || 'week', parseInt(limit || '20'));
  }

  @Get('vitals')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getWebVitals(@Query('period') period?: string) {
    return this.analyticsService.getWebVitals(period || 'week');
  }

  // ============================================
  // GOALS & CONVERSIONS
  // ============================================

  @Get('goals')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getGoals() {
    return this.analyticsService.getGoals();
  }

  @Post('goals')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  createGoal(
    @Body() body: { name: string; description?: string; type: string; target: string; targetValue?: number },
  ) {
    return this.analyticsService.createGoal(body);
  }

  @Get('conversions')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getConversions(@Query('period') period?: string, @Query('goalId') goalId?: string) {
    return this.analyticsService.getConversions(period || 'week', goalId);
  }

  // ============================================
  // FUNNELS
  // ============================================

  @Get('funnels')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getFunnels() {
    return this.analyticsService.getFunnels();
  }

  @Post('funnels')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  createFunnel(@Body() body: { name: string; description?: string; steps: any[] }) {
    return this.analyticsService.createFunnel(body);
  }

  @Get('funnels/:id/analyze')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  analyzeFunnel(@Param('id') id: string, @Query('period') period?: string) {
    return this.analyticsService.analyzeFunnel(id, period || 'week');
  }

  // ============================================
  // COHORTS & RETENTION
  // ============================================

  @Get('cohorts')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getCohortAnalysis(@Query('period') period?: string) {
    return this.analyticsService.getCohortAnalysis(period || 'month');
  }

  // ============================================
  // SITE SEARCH
  // ============================================

  @Get('site-search')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getSiteSearchAnalytics(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getSiteSearchAnalytics(period || 'week', parseInt(limit || '20'));
  }

  // ============================================
  // E-COMMERCE
  // ============================================

  @Get('ecommerce')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  getEcommerceAnalytics(@Query('period') period?: string) {
    return this.analyticsService.getEcommerceAnalytics(period || 'week');
  }

  // ============================================
  // DATA EXPORT
  // ============================================

  @Get('export/:type')
  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequiresFeature(SUBSCRIPTION_FEATURES.ANALYTICS)
  async exportData(
    @Param('type') type: string,
    @Query('period') period?: string,
    @Query('format') format?: 'json' | 'csv',
    @Res() res?: Response,
  ) {
    const data = await this.analyticsService.exportData(type, period || 'week', format || 'json');

    if (format === 'csv' && res) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${Date.now()}.csv`);
      return res.send(data);
    }

    if (res) {
      return res.json(data);
    }
    return data;
  }

  // ============================================
  // PUBLIC TRACKING ENDPOINTS (No auth required)
  // ============================================

  @Post('track/pageview')
  async trackPageView(
    @Req() req: Request,
    @Body()
    body: {
      path: string;
      sessionId?: string;
      visitorId?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    },
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || null;
    const rawIp = this.getClientIp(req);
    const ip = this.anonymizeIp(rawIp);
    const { device, browser, os } = this.parseUserAgent(userAgent);
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

    // Get geolocation data from IP
    const geoData = await this.getGeoFromIp(rawIp);

    const pageView = await this.prisma.pageView.create({
      data: {
        path: body.path,
        sessionId,
        ipAddress: ip,
        userAgent,
        referer,
        device,
        browser,
        os,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        // Geolocation data
        country: geoData?.countryCode || null,
        city: geoData?.city || null,
        region: geoData?.region || null,
        latitude: geoData?.lat || null,
        longitude: geoData?.lon || null,
      },
    });

    // Update session pageCount and exitPage
    if (sessionId) {
      await this.prisma.analyticsSession.update({
        where: { id: sessionId },
        data: {
          pageCount: { increment: 1 },
          exitPage: body.path,
          isBounce: false,
        },
      }).catch(() => {});
    }

    return { id: pageView.id };
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
      metadata?: Record<string, any>;
    },
  ) {
    const ip = this.anonymizeIp(req.ip || req.socket.remoteAddress || '');
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

    const event = await this.prisma.analyticsEvent.create({
      data: {
        category: body.category,
        action: body.action,
        label: body.label,
        value: body.value,
        path: body.path,
        sessionId,
        ipAddress: ip,
        metadata: body.metadata,
      },
    });

    // Update session event count
    if (sessionId) {
      await this.prisma.analyticsSession.update({
        where: { id: sessionId },
        data: { eventCount: { increment: 1 } },
      }).catch(() => {});
    }

    return { id: event.id };
  }

  @Post('track/session')
  async trackSession(
    @Req() req: Request,
    @Body()
    body: {
      path?: string;
      visitorId?: string;
      screenWidth?: number;
      screenHeight?: number;
      language?: string;
      timezone?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
    },
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || null;
    const rawIp = this.getClientIp(req);
    const ip = this.anonymizeIp(rawIp);
    const { device, browser, os } = this.parseUserAgent(userAgent);
    const trafficSource = this.detectTrafficSource(referer, body.utmSource);
    const refererDomain = referer ? this.extractDomain(referer) : null;

    // Get geolocation data from IP (async, non-blocking)
    const geoData = await this.getGeoFromIp(rawIp);

    // Check if returning visitor
    const isReturning = body.visitorId
      ? (await this.prisma.analyticsSession.count({ where: { visitorId: body.visitorId } })) > 0
      : false;

    const session = await this.prisma.analyticsSession.create({
      data: {
        visitorId: body.visitorId,
        ipAddress: ip,
        userAgent,
        device,
        browser,
        os,
        referer,
        refererDomain,
        trafficSource,
        landingPage: body.path,
        screenWidth: body.screenWidth,
        screenHeight: body.screenHeight,
        language: body.language,
        timezone: body.timezone,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        utmTerm: body.utmTerm,
        utmContent: body.utmContent,
        isReturning,
        // Geolocation data
        country: geoData?.countryCode || null,
        city: geoData?.city || null,
        region: geoData?.region || null,
        latitude: geoData?.lat || null,
        longitude: geoData?.lon || null,
      },
    });

    // Store UTM campaign data if present
    if (body.utmSource || body.utmCampaign) {
      await this.prisma.utmCampaign.create({
        data: {
          sessionId: session.id,
          source: body.utmSource,
          medium: body.utmMedium,
          campaign: body.utmCampaign,
          term: body.utmTerm,
          content: body.utmContent,
          landingPage: body.path,
        },
      }).catch(() => {});
    }

    return { sessionId: session.id };
  }

  @Post('track/update')
  async updatePageView(
    @Body()
    body: {
      pageViewId?: string;
      sessionId?: string;
      duration?: number;
      scrollDepth?: number;
      interactions?: number;
    },
  ) {
    if (body.pageViewId) {
      await this.prisma.pageView.update({
        where: { id: body.pageViewId },
        data: {
          duration: body.duration,
          scrollDepth: body.scrollDepth,
          interactions: body.interactions,
        },
      }).catch(() => {});
    }

    if (body.sessionId && body.duration) {
      await this.prisma.analyticsSession.update({
        where: { id: body.sessionId },
        data: {
          duration: { increment: body.duration },
          totalScrollDepth: body.scrollDepth ? { increment: body.scrollDepth } : undefined,
        },
      }).catch(() => {});
    }

    return { success: true };
  }

  @Post('track/vitals')
  async trackWebVitals(
    @Req() req: Request,
    @Body()
    body: {
      sessionId?: string;
      path: string;
      metrics: Array<{ metric: string; value: number; rating?: string }>;
    },
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const { device, browser } = this.parseUserAgent(userAgent);

    const vitals = await Promise.all(
      body.metrics.map((m) =>
        this.prisma.webVital.create({
          data: {
            sessionId: body.sessionId,
            path: body.path,
            metric: m.metric,
            value: m.value,
            rating: m.rating,
            device,
            browser,
          },
        })
      )
    );

    return { count: vitals.length };
  }

  @Post('track/search')
  async trackSiteSearch(
    @Body()
    body: {
      sessionId?: string;
      query: string;
      resultsCount?: number;
      clickedResult?: string;
    },
  ) {
    const search = await this.prisma.siteSearch.create({
      data: {
        sessionId: body.sessionId,
        query: body.query,
        resultsCount: body.resultsCount || 0,
        clickedResult: body.clickedResult,
      },
    });

    return { id: search.id };
  }

  @Post('track/conversion')
  async trackConversion(
    @Body()
    body: {
      goalId: string;
      sessionId?: string;
      userId?: string;
      path?: string;
      value?: number;
      metadata?: Record<string, any>;
    },
  ) {
    const conversion = await this.prisma.analyticsConversion.create({
      data: {
        goalId: body.goalId,
        sessionId: body.sessionId,
        userId: body.userId,
        path: body.path,
        value: body.value,
        metadata: body.metadata,
      },
    });

    return { id: conversion.id };
  }

  @Post('track/transaction')
  async trackTransaction(
    @Body()
    body: {
      sessionId?: string;
      userId?: string;
      orderId: string;
      revenue: number;
      tax?: number;
      shipping?: number;
      currency?: string;
      items: Array<{ productId: string; name: string; price: number; quantity: number }>;
      source?: string;
      campaign?: string;
    },
  ) {
    const transaction = await this.prisma.analyticsTransaction.create({
      data: {
        sessionId: body.sessionId,
        userId: body.userId,
        orderId: body.orderId,
        revenue: body.revenue,
        tax: body.tax,
        shipping: body.shipping,
        currency: body.currency || 'USD',
        items: body.items,
        source: body.source,
        campaign: body.campaign,
      },
    });

    return { id: transaction.id };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private anonymizeIp(ip: string): string {
    if (!ip) return '';
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        parts[3] = '0';
        return parts.join('.');
      }
    }
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

  private detectTrafficSource(referer: string | null, utmSource?: string): string {
    if (utmSource) {
      if (['google', 'bing', 'yahoo', 'duckduckgo'].includes(utmSource.toLowerCase())) {
        return 'paid';
      }
      return 'campaign';
    }
    if (!referer) return 'direct';
    const ref = referer.toLowerCase();
    if (ref.includes('google.') || ref.includes('bing.') || ref.includes('yahoo.') || ref.includes('duckduckgo.')) {
      return 'organic';
    }
    if (ref.includes('facebook.') || ref.includes('twitter.') || ref.includes('linkedin.') || ref.includes('instagram.')) {
      return 'social';
    }
    return 'referral';
  }

  private extractDomain(url: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return null;
    }
  }
}
