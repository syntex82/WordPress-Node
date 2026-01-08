/**
 * Demo Analytics Service
 * Provides analytics and metrics for demo conversions
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface ConversionMetrics {
  totalDemos: number;
  activeDemos: number;
  expiredDemos: number;
  conversions: number;
  conversionRate: number;
  pageViews: number;
  ctaClicks: number;
  inquiries: number;
  hostingerClicks: number;
  customDevClicks: number;
  emailsSent: number;
  emailsOpened: number;
  unsubscribes: number;
}

export interface DemoActivity {
  demoId: string;
  email: string;
  name: string;
  company: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  postsCreated: number;
  pagesCreated: number;
  hoursUsed: number;
  lastActivity: Date;
  converted: boolean;
}

export interface TimeSeriesData {
  date: string;
  demos: number;
  conversions: number;
  pageViews: number;
}

@Injectable()
export class DemoAnalyticsService {
  private readonly logger = new Logger(DemoAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get overall conversion metrics
   */
  async getConversionMetrics(): Promise<ConversionMetrics> {
    const now = new Date();

    // Get demo counts from settings
    const demoSettings = await this.prisma.setting.findMany({
      where: { key: { startsWith: 'demo_' } },
    });

    let totalDemos = 0;
    let activeDemos = 0;
    let expiredDemos = 0;
    let conversions = 0;

    for (const setting of demoSettings) {
      if (setting.key.startsWith('demo_') && !setting.key.includes('_view') && !setting.key.includes('_click')) {
        try {
          const data = JSON.parse(String(setting.value));
          totalDemos++;
          if (data.converted) conversions++;
          else if (new Date(data.expiresAt) > now) activeDemos++;
          else expiredDemos++;
        } catch (e) {}
      }
    }

    // Get event counts
    const events = await this.prisma.setting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'conversion_view_' } },
          { key: { startsWith: 'conversion_click_' } },
          { key: { startsWith: 'upgrade_inquiry_' } },
        ],
      },
    });

    let pageViews = 0;
    let ctaClicks = 0;
    let inquiries = 0;
    let hostingerClicks = 0;
    let customDevClicks = 0;

    for (const event of events) {
      if (event.key.startsWith('conversion_view_')) pageViews++;
      else if (event.key.startsWith('conversion_click_')) {
        ctaClicks++;
        try {
          const data = JSON.parse(String(event.value));
          if (data.action === 'hostinger_click' || data.target === 'hostinger') hostingerClicks++;
          if (data.action === 'custom_dev_click' || data.target === 'calendly') customDevClicks++;
        } catch (e) {}
      }
      else if (event.key.startsWith('upgrade_inquiry_')) inquiries++;
    }

    // Get email stats
    const emailStats = await this.prisma.setting.findMany({
      where: { key: { startsWith: 'demo_email_' } },
    });

    const emailsSent = emailStats.length;
    const emailsOpened = emailStats.filter(e => {
      try { return JSON.parse(String(e.value)).opened; } catch { return false; }
    }).length;

    const unsubscribes = await this.prisma.setting.count({
      where: { key: { startsWith: 'unsubscribe_' } },
    });

    return {
      totalDemos,
      activeDemos,
      expiredDemos,
      conversions,
      conversionRate: totalDemos > 0 ? Math.round((conversions / totalDemos) * 100) : 0,
      pageViews,
      ctaClicks,
      inquiries,
      hostingerClicks,
      customDevClicks,
      emailsSent,
      emailsOpened,
      unsubscribes,
    };
  }

  /**
   * Get recent demo activities
   */
  async getRecentDemos(limit = 20): Promise<DemoActivity[]> {
    const demoSettings = await this.prisma.setting.findMany({
      where: { 
        key: { startsWith: 'demo_' },
        NOT: [
          { key: { contains: '_view' } },
          { key: { contains: '_click' } },
          { key: { contains: '_email' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return demoSettings.map(s => {
      try {
        const data = JSON.parse(String(s.value));
        return {
          demoId: s.key.replace('demo_', ''),
          email: data.email || '',
          name: data.name || '',
          company: data.company || '',
          status: data.converted ? 'converted' : new Date(data.expiresAt) > new Date() ? 'active' : 'expired',
          createdAt: new Date(data.createdAt || s.createdAt),
          expiresAt: new Date(data.expiresAt),
          postsCreated: data.postsCreated || 0,
          pagesCreated: data.pagesCreated || 0,
          hoursUsed: data.hoursUsed || 0,
          lastActivity: new Date(data.lastActivity || s.updatedAt),
          converted: data.converted || false,
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean) as DemoActivity[];
  }
}

