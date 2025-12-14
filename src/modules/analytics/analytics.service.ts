/**
 * Analytics Service - Provides analytics data and statistics
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getDateFilter(period: string) {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    return { gte: startDate };
  }

  async getDashboardStats(period = 'week') {
    const dateFilter = this.getDateFilter(period);
    const [totalPageViews, uniqueVisitors, totalSessions, avgSessionDuration] = await Promise.all([
      this.prisma.pageView.count({ where: { createdAt: dateFilter } }),
      this.prisma.pageView.groupBy({ by: ['ipAddress'], where: { createdAt: dateFilter } }),
      this.prisma.analyticsSession.count({ where: { startedAt: dateFilter } }),
      this.prisma.analyticsSession.aggregate({
        where: { startedAt: dateFilter, duration: { gt: 0 } },
        _avg: { duration: true },
      }),
    ]);
    const bounceRate =
      totalSessions > 0
        ? await this.prisma.analyticsSession
            .count({ where: { startedAt: dateFilter, pageCount: 1 } })
            .then((bounces) => Math.round((bounces / totalSessions) * 100))
        : 0;
    return {
      pageViews: totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      sessions: totalSessions,
      avgDuration: Math.round(avgSessionDuration._avg?.duration || 0),
      bounceRate,
    };
  }

  async getPageViewsOverTime(period = 'week') {
    const dateFilter = this.getDateFilter(period);
    const pageViews = await this.prisma.pageView.findMany({
      where: { createdAt: dateFilter },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const grouped: Record<string, number> = {};
    pageViews.forEach((pv) => {
      const date = pv.createdAt.toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, views]) => ({ date, views }));
  }

  async getTopPages(period = 'week', limit = 10) {
    const dateFilter = this.getDateFilter(period);
    const pages = await this.prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: dateFilter },
      _count: { path: true },
      _avg: { duration: true },
      orderBy: { _count: { path: 'desc' } },
      take: limit,
    });
    return pages.map((p) => ({
      path: p.path,
      views: p._count.path,
      avgDuration: Math.round(p._avg?.duration || 0),
    }));
  }

  async getTrafficSources(period = 'week', limit = 10) {
    const dateFilter = this.getDateFilter(period);
    const sources = await this.prisma.pageView.groupBy({
      by: ['referer'],
      where: { createdAt: dateFilter, referer: { not: null } },
      _count: { referer: true },
      orderBy: { _count: { referer: 'desc' } },
      take: limit,
    });
    return sources.map((s) => ({ source: s.referer || 'Direct', visits: s._count.referer }));
  }

  async getDeviceBreakdown(period = 'week') {
    const dateFilter = this.getDateFilter(period);
    const devices = await this.prisma.pageView.groupBy({
      by: ['device'],
      where: { createdAt: dateFilter, device: { not: null } },
      _count: { device: true },
    });
    const total = devices.reduce((sum, d) => sum + d._count.device, 0);
    return devices.map((d) => ({
      device: d.device || 'Unknown',
      count: d._count.device,
      percentage: total > 0 ? Math.round((d._count.device / total) * 100) : 0,
    }));
  }

  async getBrowserBreakdown(period = 'week') {
    const dateFilter = this.getDateFilter(period);
    const browsers = await this.prisma.pageView.groupBy({
      by: ['browser'],
      where: { createdAt: dateFilter, browser: { not: null } },
      _count: { browser: true },
      orderBy: { _count: { browser: 'desc' } },
      take: 5,
    });
    const total = browsers.reduce((sum, b) => sum + b._count.browser, 0);
    return browsers.map((b) => ({
      browser: b.browser || 'Unknown',
      count: b._count.browser,
      percentage: total > 0 ? Math.round((b._count.browser / total) * 100) : 0,
    }));
  }

  async getRealTimeStats() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [activeVisitors, recentPages] = await Promise.all([
      this.prisma.analyticsSession.count({
        where: { isActive: true, startedAt: { gte: fiveMinutesAgo } },
      }),
      this.prisma.pageView.findMany({
        where: { createdAt: { gte: fiveMinutesAgo } },
        select: { path: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    return { activeVisitors, recentPages };
  }
}
