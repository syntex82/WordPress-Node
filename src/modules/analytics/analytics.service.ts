/**
 * Analytics Service - Comprehensive self-hosted analytics
 * A complete Google Analytics replacement with GDPR compliance
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get date filter for period or custom range
   */
  private getDateFilter(period: string, customStart?: string, customEnd?: string) {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    if (customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }
    return { gte: startDate, lte: endDate };
  }

  /**
   * Get previous period for comparison
   */
  private getPreviousPeriodFilter(period: string): DateRange {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    return { startDate, endDate };
  }

  /**
   * Dashboard stats with period comparison
   */
  async getDashboardStats(period = 'week', customStart?: string, customEnd?: string) {
    const dateFilter = this.getDateFilter(period, customStart, customEnd);
    const prevPeriod = this.getPreviousPeriodFilter(period);

    const [current, previous] = await Promise.all([
      this.getStatsForPeriod(dateFilter),
      this.getStatsForPeriod({ gte: prevPeriod.startDate, lte: prevPeriod.endDate }),
    ]);

    return {
      ...current,
      comparison: {
        pageViews: this.calculateChange(current.pageViews, previous.pageViews),
        uniqueVisitors: this.calculateChange(current.uniqueVisitors, previous.uniqueVisitors),
        sessions: this.calculateChange(current.sessions, previous.sessions),
        avgDuration: this.calculateChange(current.avgDuration, previous.avgDuration),
        bounceRate: this.calculateChange(current.bounceRate, previous.bounceRate, true),
      },
    };
  }

  private async getStatsForPeriod(dateFilter: { gte: Date; lte?: Date }) {
    const [totalPageViews, uniqueVisitors, totalSessions, avgSessionDuration, bounces, avgScrollDepth] =
      await Promise.all([
        this.prisma.pageView.count({ where: { createdAt: dateFilter } }),
        this.prisma.analyticsSession.groupBy({ by: ['visitorId'], where: { startedAt: dateFilter } }),
        this.prisma.analyticsSession.count({ where: { startedAt: dateFilter } }),
        this.prisma.analyticsSession.aggregate({
          where: { startedAt: dateFilter, duration: { gt: 0 } },
          _avg: { duration: true },
        }),
        this.prisma.analyticsSession.count({ where: { startedAt: dateFilter, isBounce: true } }),
        this.prisma.pageView.aggregate({
          where: { createdAt: dateFilter, scrollDepth: { not: null } },
          _avg: { scrollDepth: true },
        }),
      ]);

    const bounceRate = totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0;
    const pagesPerSession = totalSessions > 0 ? Math.round((totalPageViews / totalSessions) * 10) / 10 : 0;

    return {
      pageViews: totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      sessions: totalSessions,
      avgDuration: Math.round(avgSessionDuration._avg?.duration || 0),
      bounceRate,
      pagesPerSession,
      avgScrollDepth: Math.round(avgScrollDepth._avg?.scrollDepth || 0),
    };
  }

  private calculateChange(current: number, previous: number, inverse = false): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = Math.round(((current - previous) / previous) * 100);
    return inverse ? -change : change;
  }

  /**
   * Page views over time with hourly granularity for today
   */
  async getPageViewsOverTime(period = 'week', customStart?: string, customEnd?: string) {
    const dateFilter = this.getDateFilter(period, customStart, customEnd);
    const pageViews = await this.prisma.pageView.findMany({
      where: { createdAt: dateFilter },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    const isHourly = period === 'today';

    pageViews.forEach((pv) => {
      const key = isHourly
        ? pv.createdAt.toISOString().slice(0, 13) + ':00'
        : pv.createdAt.toISOString().split('T')[0];
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, views]) => ({ date, views }));
  }

  /**
   * Top pages with engagement metrics
   */
  async getTopPages(period = 'week', limit = 10) {
    const dateFilter = this.getDateFilter(period);
    const pages = await this.prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: dateFilter },
      _count: { path: true },
      _avg: { duration: true, scrollDepth: true },
      orderBy: { _count: { path: 'desc' } },
      take: limit,
    });

    const totalViews = pages.reduce((sum, p) => sum + p._count.path, 0);

    return pages.map((p) => ({
      path: p.path,
      views: p._count.path,
      percentage: totalViews > 0 ? Math.round((p._count.path / totalViews) * 100) : 0,
      avgDuration: Math.round(p._avg?.duration || 0),
      avgScrollDepth: Math.round(p._avg?.scrollDepth || 0),
    }));
  }

  /**
   * Entry pages (landing pages)
   */
  async getEntryPages(period = 'week', limit = 10) {
    const dateFilter = this.getDateFilter(period);
    const entries = await this.prisma.analyticsSession.groupBy({
      by: ['landingPage'],
      where: { startedAt: dateFilter, landingPage: { not: null } },
      _count: { landingPage: true },
      orderBy: { _count: { landingPage: 'desc' } },
      take: limit,
    });

    return entries.map((e) => ({
      path: e.landingPage,
      entries: e._count.landingPage,
    }));
  }

  /**
   * Exit pages
   */
  async getExitPages(period = 'week', limit = 10) {
    const dateFilter = this.getDateFilter(period);
    const exits = await this.prisma.analyticsSession.groupBy({
      by: ['exitPage'],
      where: { startedAt: dateFilter, exitPage: { not: null } },
      _count: { exitPage: true },
      orderBy: { _count: { exitPage: 'desc' } },
      take: limit,
    });

    return exits.map((e) => ({
      path: e.exitPage,
      exits: e._count.exitPage,
    }));
  }

  /**
   * Traffic sources breakdown with categorization
   */
  async getTrafficSources(period = 'week', limit = 10) {
    const dateFilter = this.getDateFilter(period);

    // Get by traffic source type
    const byType = await this.prisma.analyticsSession.groupBy({
      by: ['trafficSource'],
      where: { startedAt: dateFilter },
      _count: { trafficSource: true },
    });

    // Get by referrer domain
    const byReferrer = await this.prisma.analyticsSession.groupBy({
      by: ['refererDomain'],
      where: { startedAt: dateFilter, refererDomain: { not: null } },
      _count: { refererDomain: true },
      orderBy: { _count: { refererDomain: 'desc' } },
      take: limit,
    });

    // Get by UTM source
    const byUtm = await this.prisma.analyticsSession.groupBy({
      by: ['utmSource'],
      where: { startedAt: dateFilter, utmSource: { not: null } },
      _count: { utmSource: true },
      orderBy: { _count: { utmSource: 'desc' } },
      take: limit,
    });

    const totalSessions = byType.reduce((sum, t) => sum + t._count.trafficSource, 0);

    return {
      byType: byType.map((t) => ({
        source: t.trafficSource || 'direct',
        sessions: t._count.trafficSource,
        percentage: totalSessions > 0 ? Math.round((t._count.trafficSource / totalSessions) * 100) : 0,
      })),
      byReferrer: byReferrer.map((r) => ({
        domain: r.refererDomain,
        sessions: r._count.refererDomain,
      })),
      byUtm: byUtm.map((u) => ({
        source: u.utmSource,
        sessions: u._count.utmSource,
      })),
    };
  }

  /**
   * UTM Campaign analytics
   */
  async getCampaignAnalytics(period = 'week') {
    const dateFilter = this.getDateFilter(period);

    const campaigns = await this.prisma.utmCampaign.groupBy({
      by: ['campaign', 'source', 'medium'],
      where: { createdAt: dateFilter, campaign: { not: null } },
      _count: { campaign: true },
      orderBy: { _count: { campaign: 'desc' } },
      take: 20,
    });

    return campaigns.map((c) => ({
      campaign: c.campaign,
      source: c.source,
      medium: c.medium,
      sessions: c._count.campaign,
    }));
  }

  /**
   * Geographic analytics - combines data from sessions and pageviews
   */
  async getGeographicData(period = 'week') {
    const dateFilter = this.getDateFilter(period);

    // Query both sessions and pageviews for country data
    const [sessionsByCountry, pageViewsByCountry, sessionsByCity, pageViewsByCity] = await Promise.all([
      this.prisma.analyticsSession.groupBy({
        by: ['country'],
        where: { startedAt: dateFilter, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 20,
      }),
      this.prisma.pageView.groupBy({
        by: ['country'],
        where: { createdAt: dateFilter, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 20,
      }),
      this.prisma.analyticsSession.groupBy({
        by: ['city', 'country'],
        where: { startedAt: dateFilter, city: { not: null } },
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 20,
      }),
      this.prisma.pageView.groupBy({
        by: ['city', 'country'],
        where: { createdAt: dateFilter, city: { not: null } },
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 20,
      }),
    ]);

    // Merge country data from both sources
    const countryMap = new Map<string, number>();
    sessionsByCountry.forEach(c => {
      if (c.country) countryMap.set(c.country, (countryMap.get(c.country) || 0) + c._count.country);
    });
    pageViewsByCountry.forEach(c => {
      if (c.country) countryMap.set(c.country, (countryMap.get(c.country) || 0) + c._count.country);
    });

    const totalSessions = Array.from(countryMap.values()).reduce((sum, count) => sum + count, 0);
    const countries = Array.from(countryMap.entries())
      .map(([country, sessions]) => ({
        country,
        sessions,
        percentage: totalSessions > 0 ? Math.round((sessions / totalSessions) * 100) : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20);

    // Merge city data from both sources
    const cityMap = new Map<string, { city: string; country: string; sessions: number }>();
    [...sessionsByCity, ...pageViewsByCity].forEach(c => {
      if (c.city && c.country) {
        const key = `${c.city}-${c.country}`;
        const existing = cityMap.get(key);
        if (existing) {
          existing.sessions += c._count.city;
        } else {
          cityMap.set(key, { city: c.city, country: c.country, sessions: c._count.city });
        }
      }
    });

    const cities = Array.from(cityMap.values())
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20);

    return { countries, cities };
  }

  /**
   * Device and browser analytics
   */
  async getDeviceBreakdown(period = 'week') {
    const dateFilter = this.getDateFilter(period);

    const [devices, browsers, os, screenSizes] = await Promise.all([
      this.prisma.analyticsSession.groupBy({
        by: ['device'],
        where: { startedAt: dateFilter, device: { not: null } },
        _count: { device: true },
      }),
      this.prisma.analyticsSession.groupBy({
        by: ['browser'],
        where: { startedAt: dateFilter, browser: { not: null } },
        _count: { browser: true },
        orderBy: { _count: { browser: 'desc' } },
        take: 10,
      }),
      this.prisma.analyticsSession.groupBy({
        by: ['os'],
        where: { startedAt: dateFilter, os: { not: null } },
        _count: { os: true },
        orderBy: { _count: { os: 'desc' } },
        take: 10,
      }),
      this.prisma.analyticsSession.groupBy({
        by: ['screenWidth', 'screenHeight'],
        where: { startedAt: dateFilter, screenWidth: { not: null } },
        _count: { screenWidth: true },
        orderBy: { _count: { screenWidth: 'desc' } },
        take: 10,
      }),
    ]);

    const totalDevices = devices.reduce((sum, d) => sum + d._count.device, 0);
    const totalBrowsers = browsers.reduce((sum, b) => sum + b._count.browser, 0);

    return {
      devices: devices.map((d) => ({
        device: d.device || 'Unknown',
        count: d._count.device,
        percentage: totalDevices > 0 ? Math.round((d._count.device / totalDevices) * 100) : 0,
      })),
      browsers: browsers.map((b) => ({
        browser: b.browser || 'Unknown',
        count: b._count.browser,
        percentage: totalBrowsers > 0 ? Math.round((b._count.browser / totalBrowsers) * 100) : 0,
      })),
      operatingSystems: os.map((o) => ({
        os: o.os || 'Unknown',
        count: o._count.os,
      })),
      screenSizes: screenSizes.map((s) => ({
        width: s.screenWidth,
        height: s.screenHeight,
        count: s._count.screenWidth,
      })),
    };
  }

  async getBrowserBreakdown(period = 'week') {
    const dateFilter = this.getDateFilter(period);
    const browsers = await this.prisma.analyticsSession.groupBy({
      by: ['browser'],
      where: { startedAt: dateFilter, browser: { not: null } },
      _count: { browser: true },
      orderBy: { _count: { browser: 'desc' } },
      take: 10,
    });
    const total = browsers.reduce((sum, b) => sum + b._count.browser, 0);
    return browsers.map((b) => ({
      browser: b.browser || 'Unknown',
      count: b._count.browser,
      percentage: total > 0 ? Math.round((b._count.browser / total) * 100) : 0,
    }));
  }

  /**
   * Real-time analytics
   */
  async getRealTimeStats() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const [activeVisitors, recentPages, activeByPage, activeByCountry] = await Promise.all([
      this.prisma.analyticsSession.count({
        where: { isActive: true, startedAt: { gte: fiveMinutesAgo } },
      }),
      this.prisma.pageView.findMany({
        where: { createdAt: { gte: fiveMinutesAgo } },
        select: { path: true, createdAt: true, device: true, country: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.pageView.groupBy({
        by: ['path'],
        where: { createdAt: { gte: thirtyMinutesAgo } },
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 10,
      }),
      this.prisma.analyticsSession.groupBy({
        by: ['country'],
        where: { startedAt: { gte: thirtyMinutesAgo }, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
    ]);

    // Get pageviews per minute for the last 30 minutes
    const pageViewsPerMinute: { minute: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const start = new Date(Date.now() - (i + 1) * 60 * 1000);
      const end = new Date(Date.now() - i * 60 * 1000);
      const count = await this.prisma.pageView.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      pageViewsPerMinute.push({
        minute: start.toISOString().slice(11, 16),
        count,
      });
    }

    return {
      activeVisitors,
      recentPages,
      activeByPage: activeByPage.map((p) => ({ path: p.path, count: p._count.path })),
      activeByCountry: activeByCountry.map((c) => ({ country: c.country, count: c._count.country })),
      pageViewsPerMinute,
    };
  }

  /**
   * Event analytics
   */
  async getEventAnalytics(period = 'week', limit = 20) {
    const dateFilter = this.getDateFilter(period);

    const [byCategory, topEvents, recentEvents] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['category'],
        where: { createdAt: dateFilter },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['category', 'action', 'label'],
        where: { createdAt: dateFilter },
        _count: { action: true },
        _sum: { value: true },
        orderBy: { _count: { action: 'desc' } },
        take: limit,
      }),
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: dateFilter },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return {
      totalEvents: recentEvents.length,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count.category,
      })),
      topEvents: topEvents.map((e) => ({
        category: e.category,
        action: e.action,
        label: e.label,
        count: e._count.action,
        totalValue: e._sum.value || 0,
      })),
      recentEvents: recentEvents.slice(0, 20),
    };
  }

  /**
   * Web Vitals performance metrics
   */
  async getWebVitals(period = 'week') {
    const dateFilter = this.getDateFilter(period);

    const vitals = await this.prisma.webVital.groupBy({
      by: ['metric'],
      where: { createdAt: dateFilter },
      _avg: { value: true },
      _count: { metric: true },
    });

    // Get rating distribution for each metric
    const ratingDistribution = await Promise.all(
      ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'].map(async (metric) => {
        const ratings = await this.prisma.webVital.groupBy({
          by: ['rating'],
          where: { createdAt: dateFilter, metric },
          _count: { rating: true },
        });
        return { metric, ratings };
      })
    );

    // Get vitals by page
    const byPage = await this.prisma.webVital.groupBy({
      by: ['path', 'metric'],
      where: { createdAt: dateFilter },
      _avg: { value: true },
      orderBy: { _avg: { value: 'desc' } },
      take: 50,
    });

    return {
      averages: vitals.map((v) => ({
        metric: v.metric,
        value: Math.round((v._avg.value || 0) * 100) / 100,
        count: v._count.metric,
      })),
      ratingDistribution: ratingDistribution.map((r) => ({
        metric: r.metric,
        good: r.ratings.find((x) => x.rating === 'good')?._count.rating || 0,
        needsImprovement: r.ratings.find((x) => x.rating === 'needs-improvement')?._count.rating || 0,
        poor: r.ratings.find((x) => x.rating === 'poor')?._count.rating || 0,
      })),
      byPage: byPage.map((p) => ({
        path: p.path,
        metric: p.metric,
        value: Math.round((p._avg.value || 0) * 100) / 100,
      })),
    };
  }

  // ============================================
  // GOALS & CONVERSIONS
  // ============================================

  /**
   * Get all analytics goals
   */
  async getGoals() {
    return this.prisma.analyticsGoal.findMany({
      include: { _count: { select: { conversions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new goal
   */
  async createGoal(data: {
    name: string;
    description?: string;
    type: string;
    target: string;
    targetValue?: number;
  }) {
    return this.prisma.analyticsGoal.create({ data });
  }

  /**
   * Get conversion analytics for goals
   */
  async getConversions(period = 'week', goalId?: string) {
    const dateFilter = this.getDateFilter(period);
    const where: any = { createdAt: dateFilter };
    if (goalId) where.goalId = goalId;

    const [conversions, byGoal, totalSessions] = await Promise.all([
      this.prisma.analyticsConversion.count({ where }),
      this.prisma.analyticsConversion.groupBy({
        by: ['goalId'],
        where,
        _count: { goalId: true },
        _sum: { value: true },
      }),
      this.prisma.analyticsSession.count({ where: { startedAt: dateFilter } }),
    ]);

    // Get goal names
    const goalIds = byGoal.map((g) => g.goalId);
    const goals = await this.prisma.analyticsGoal.findMany({
      where: { id: { in: goalIds } },
    });
    const goalMap = new Map(goals.map((g) => [g.id, g.name]));

    const conversionRate = totalSessions > 0 ? Math.round((conversions / totalSessions) * 100) : 0;

    return {
      totalConversions: conversions,
      conversionRate,
      totalValue: byGoal.reduce((sum, g) => sum + (g._sum.value || 0), 0),
      byGoal: byGoal.map((g) => ({
        goalId: g.goalId,
        goalName: goalMap.get(g.goalId) || 'Unknown',
        conversions: g._count.goalId,
        value: g._sum.value || 0,
      })),
    };
  }

  // ============================================
  // FUNNELS
  // ============================================

  /**
   * Get all funnels
   */
  async getFunnels() {
    return this.prisma.analyticsFunnel.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new funnel
   */
  async createFunnel(data: { name: string; description?: string; steps: any[] }) {
    return this.prisma.analyticsFunnel.create({
      data: { ...data, steps: data.steps },
    });
  }

  /**
   * Analyze funnel performance
   */
  async analyzeFunnel(funnelId: string, period = 'week') {
    const funnel = await this.prisma.analyticsFunnel.findUnique({ where: { id: funnelId } });
    if (!funnel) return null;

    const dateFilter = this.getDateFilter(period);
    const steps = funnel.steps as any[];
    const stepResults: { name: string; users: number; dropoff: number }[] = [];

    let previousUsers = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      let users = 0;

      if (step.type === 'pageview') {
        users = await this.prisma.pageView.count({
          where: { createdAt: dateFilter, path: { contains: step.target } },
        });
      } else if (step.type === 'event') {
        users = await this.prisma.analyticsEvent.count({
          where: { createdAt: dateFilter, action: step.target },
        });
      }

      const dropoff = i > 0 && previousUsers > 0
        ? Math.round(((previousUsers - users) / previousUsers) * 100)
        : 0;

      stepResults.push({ name: step.name, users, dropoff });
      previousUsers = users;
    }

    const overallConversion = stepResults[0]?.users > 0
      ? Math.round((stepResults[stepResults.length - 1]?.users / stepResults[0].users) * 100)
      : 0;

    return {
      funnel,
      steps: stepResults,
      overallConversion,
    };
  }

  // ============================================
  // COHORT ANALYSIS
  // ============================================

  /**
   * Cohort analysis - user retention by signup/first visit week
   */
  async getCohortAnalysis(period = 'month') {
    const weeks = period === 'year' ? 12 : period === 'quarter' ? 8 : 4;
    const cohorts: any[] = [];

    for (let w = weeks - 1; w >= 0; w--) {
      const cohortStart = new Date(Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
      const cohortEnd = new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);

      // Get users who first visited in this week
      const cohortVisitors = await this.prisma.analyticsSession.groupBy({
        by: ['visitorId'],
        where: {
          startedAt: { gte: cohortStart, lt: cohortEnd },
          visitorId: { not: null },
          isReturning: false,
        },
      });

      const visitorIds = cohortVisitors.map((v) => v.visitorId).filter(Boolean) as string[];
      const cohortSize = visitorIds.length;

      // Calculate retention for each subsequent week
      const retention: number[] = [];
      for (let r = 0; r <= weeks - w - 1; r++) {
        const retentionStart = new Date(cohortEnd.getTime() + r * 7 * 24 * 60 * 60 * 1000);
        const retentionEnd = new Date(cohortEnd.getTime() + (r + 1) * 7 * 24 * 60 * 60 * 1000);

        const returning = await this.prisma.analyticsSession.groupBy({
          by: ['visitorId'],
          where: {
            visitorId: { in: visitorIds },
            startedAt: { gte: retentionStart, lt: retentionEnd },
          },
        });

        retention.push(cohortSize > 0 ? Math.round((returning.length / cohortSize) * 100) : 0);
      }

      cohorts.push({
        week: cohortStart.toISOString().split('T')[0],
        size: cohortSize,
        retention,
      });
    }

    return cohorts;
  }

  // ============================================
  // SITE SEARCH ANALYTICS
  // ============================================

  /**
   * Get site search analytics
   */
  async getSiteSearchAnalytics(period = 'week', limit = 20) {
    const dateFilter = this.getDateFilter(period);

    const [topSearches, searches, searchesWithNoResults] = await Promise.all([
      this.prisma.siteSearch.groupBy({
        by: ['query'],
        where: { createdAt: dateFilter },
        _count: { query: true },
        orderBy: { _count: { query: 'desc' } },
        take: limit,
      }),
      this.prisma.siteSearch.count({ where: { createdAt: dateFilter } }),
      this.prisma.siteSearch.count({ where: { createdAt: dateFilter, resultsCount: 0 } }),
    ]);

    return {
      totalSearches: searches,
      uniqueSearches: topSearches.length,
      searchesWithNoResults,
      topSearches: topSearches.map((s) => ({
        query: s.query,
        count: s._count.query,
      })),
    };
  }

  // ============================================
  // E-COMMERCE ANALYTICS
  // ============================================

  /**
   * Get e-commerce analytics
   */
  async getEcommerceAnalytics(period = 'week') {
    const dateFilter = this.getDateFilter(period);

    const transactions = await this.prisma.analyticsTransaction.findMany({
      where: { createdAt: dateFilter },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.revenue, 0);
    const totalTransactions = transactions.length;
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Group by date
    const revenueByDate: Record<string, number> = {};
    transactions.forEach((t) => {
      const date = t.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + t.revenue;
    });

    // Get product performance
    const productCounts: Record<string, { revenue: number; quantity: number }> = {};
    transactions.forEach((t) => {
      const items = t.items as any[];
      items?.forEach((item) => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { revenue: 0, quantity: 0 };
        }
        productCounts[item.productId].revenue += item.price * item.quantity;
        productCounts[item.productId].quantity += item.quantity;
      });
    });

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTransactions,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      revenueByDate: Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
      })),
      topProducts: Object.entries(productCounts)
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    };
  }

  // ============================================
  // DATA EXPORT
  // ============================================

  /**
   * Export analytics data
   */
  async exportData(type: string, period = 'week', format: 'json' | 'csv' = 'json') {
    const dateFilter = this.getDateFilter(period);

    let data: any[] = [];

    switch (type) {
      case 'pageviews':
        data = await this.prisma.pageView.findMany({
          where: { createdAt: dateFilter },
          orderBy: { createdAt: 'desc' },
        });
        break;
      case 'sessions':
        data = await this.prisma.analyticsSession.findMany({
          where: { startedAt: dateFilter },
          orderBy: { startedAt: 'desc' },
        });
        break;
      case 'events':
        data = await this.prisma.analyticsEvent.findMany({
          where: { createdAt: dateFilter },
          orderBy: { createdAt: 'desc' },
        });
        break;
      case 'conversions':
        data = await this.prisma.analyticsConversion.findMany({
          where: { createdAt: dateFilter },
          include: { goal: true },
          orderBy: { createdAt: 'desc' },
        });
        break;
      case 'vitals':
        data = await this.prisma.webVital.findMany({
          where: { createdAt: dateFilter },
          orderBy: { createdAt: 'desc' },
        });
        break;
    }

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return data;
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
        return String(val).replace(/"/g, '""');
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  // ============================================
  // DATA CLEANUP & MAINTENANCE
  // ============================================

  /**
   * Cleanup old analytics data based on retention policy
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldData() {
    const retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS || '365', 10);
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
      const [pageViews, sessions, events, vitals] = await Promise.all([
        this.prisma.pageView.deleteMany({ where: { createdAt: { lt: cutoffDate } } }),
        this.prisma.analyticsSession.deleteMany({ where: { startedAt: { lt: cutoffDate } } }),
        this.prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: cutoffDate } } }),
        this.prisma.webVital.deleteMany({ where: { createdAt: { lt: cutoffDate } } }),
      ]);

      this.logger.log(
        `Analytics cleanup complete: ${pageViews.count} pageviews, ${sessions.count} sessions, ` +
        `${events.count} events, ${vitals.count} vitals deleted`
      );
    } catch (error) {
      this.logger.error('Analytics cleanup failed:', error);
    }
  }

  /**
   * Mark inactive sessions
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async markInactiveSessions() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    try {
      await this.prisma.analyticsSession.updateMany({
        where: { isActive: true, startedAt: { lt: thirtyMinutesAgo } },
        data: { isActive: false, endedAt: new Date() },
      });
    } catch (error) {
      this.logger.error('Failed to mark inactive sessions:', error);
    }
  }
}
