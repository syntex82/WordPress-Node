/**
 * Demo Analytics Service
 * Provides comprehensive analytics and metrics for demo conversions
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

export interface DemoUserDetail {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date | null;
  sessionCount: number;
  totalTimeSpent: number; // minutes
  requestCount: number;
  featuresUsed: string[];
  topFeatures: { feature: string; count: number }[];
  postsCreated: number;
  pagesCreated: number;
  upgradeRequested: boolean;
  engagementScore: number;
  isOnMailingList: boolean;
}

export interface DemoSession {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null;
  pagesViewed: number;
  actionsCount: number;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  createdAt: Date;
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

export interface DemoListFilters {
  status?: 'active' | 'expired' | 'all';
  segment?: 'high_engagement' | 'low_engagement' | 'upgrade_requested' | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'lastAccessedAt' | 'engagementScore' | 'sessionCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable()
export class DemoAnalyticsService {
  private readonly logger = new Logger(DemoAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get overall conversion metrics from DemoInstance table
   */
  async getConversionMetrics(): Promise<ConversionMetrics> {
    const now = new Date();

    // Count demos by status from DemoInstance table
    const totalDemos = await this.prisma.demoInstance.count();

    const activeDemos = await this.prisma.demoInstance.count({
      where: {
        status: 'RUNNING',
        expiresAt: { gt: now },
      },
    });

    const expiredDemos = await this.prisma.demoInstance.count({
      where: {
        OR: [
          { status: 'EXPIRED' },
          { status: 'TERMINATED' },
          { expiresAt: { lte: now } },
        ],
      },
    });

    // Count conversions based on upgradeRequested flag (since there's no CONVERTED status)
    const conversions = await this.prisma.demoInstance.count({
      where: { upgradeRequested: true },
    });

    // Count upgrade requests (inquiries)
    const inquiries = await this.prisma.demoInstance.count({
      where: { upgradeRequested: true },
    });

    // Get page view counts from DemoFeatureUsage
    const pageViews = await this.prisma.demoFeatureUsage.count({
      where: { feature: 'page_view' },
    });

    // Get CTA click counts
    const ctaClicks = await this.prisma.demoFeatureUsage.count({
      where: { feature: { contains: 'click' } },
    });

    // Get specific click types
    const hostingerClicks = await this.prisma.demoFeatureUsage.count({
      where: { feature: 'hostinger_click' },
    });

    const customDevClicks = await this.prisma.demoFeatureUsage.count({
      where: { feature: 'custom_dev_click' },
    });

    // Email stats from settings (keeping this as settings might still track emails)
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
   * Delete a demo instance and all related data
   */
  async deleteDemo(id: string): Promise<void> {
    const demo = await this.prisma.demoInstance.findUnique({
      where: { id },
    });

    if (!demo) {
      throw new NotFoundException(`Demo instance ${id} not found`);
    }

    // Delete in order of dependencies
    await this.prisma.$transaction(async (tx) => {
      // Delete related feature usage
      await tx.demoFeatureUsage.deleteMany({ where: { demoInstanceId: id } });

      // Delete related access logs
      await tx.demoAccessLog.deleteMany({ where: { demoInstanceId: id } });

      // Delete related sessions
      await tx.demoSession.deleteMany({ where: { demoInstanceId: id } });

      // Delete related login attempts
      await tx.demoLoginAttempt.deleteMany({ where: { demoInstanceId: id } });

      // Finally delete the demo instance itself
      await tx.demoInstance.delete({ where: { id } });
    });

    this.logger.log(`Deleted demo instance: ${id} (${demo.email})`);
  }

  /**
   * Bulk delete demo instances
   */
  async bulkDeleteDemos(ids: string[]): Promise<number> {
    let deleted = 0;
    for (const id of ids) {
      try {
        await this.deleteDemo(id);
        deleted++;
      } catch (error) {
        this.logger.warn(`Failed to delete demo ${id}: ${error.message}`);
      }
    }
    return deleted;
  }

  /**
   * Get recent demo activities (legacy method for backward compatibility)
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

  /**
   * Get detailed demo users list with filtering and pagination
   */
  async getDemoUsers(filters: DemoListFilters = {}): Promise<{
    users: DemoUserDetail[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      status = 'all',
      segment = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const now = new Date();
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status === 'active') {
      where.expiresAt = { gt: now };
      where.status = { not: 'TERMINATED' };
    } else if (status === 'expired') {
      where.OR = [
        { expiresAt: { lte: now } },
        { status: 'EXPIRED' },
        { status: 'TERMINATED' },
      ];
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (segment === 'upgrade_requested') {
      where.upgradeRequested = true;
    }

    // Get total count
    const total = await this.prisma.demoInstance.count({ where });

    // Get demo instances with related data
    const demos = await this.prisma.demoInstance.findMany({
      where,
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        featureUsage: true,
        _count: {
          select: {
            sessions: true,
            accessLogs: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    // Check mailing list status for each user
    const emails = demos.map(d => d.email);
    const mailingListSubscribers = await this.prisma.marketingSubscriber.findMany({
      where: {
        email: { in: emails },
        isSubscribed: true,
      },
      select: { email: true },
    });
    const subscribedEmails = new Set(mailingListSubscribers.map(s => s.email));

    // Transform to DemoUserDetail
    const users: DemoUserDetail[] = demos.map(demo => {
      // Calculate total time spent from sessions
      const totalTimeSpent = demo.sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;

      // Get feature usage stats
      const featureMap = new Map<string, number>();
      demo.featureUsage.forEach(f => {
        featureMap.set(f.feature, (featureMap.get(f.feature) || 0) + 1);
      });
      const topFeatures = Array.from(featureMap.entries())
        .map(([feature, count]) => ({ feature, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(demo, totalTimeSpent);

      // Get posts/pages created from JSON fields
      const actionsPerformed = demo.actionsPerformed as any || {};
      const postsCreated = actionsPerformed.postsCreated || 0;
      const pagesCreated = actionsPerformed.pagesCreated || 0;

      return {
        id: demo.id,
        email: demo.email,
        name: demo.name,
        company: demo.company,
        phone: demo.phone,
        status: this.getDemoStatus(demo),
        createdAt: demo.createdAt,
        expiresAt: demo.expiresAt,
        lastAccessedAt: demo.lastAccessedAt,
        sessionCount: demo._count.sessions,
        totalTimeSpent: Math.round(totalTimeSpent),
        requestCount: demo.requestCount,
        featuresUsed: Array.from(featureMap.keys()),
        topFeatures,
        postsCreated,
        pagesCreated,
        upgradeRequested: demo.upgradeRequested,
        engagementScore,
        isOnMailingList: subscribedEmails.has(demo.email),
      };
    });

    // Apply segment filter after calculation
    let filteredUsers = users;
    if (segment === 'high_engagement') {
      filteredUsers = users.filter(u => u.engagementScore >= 70);
    } else if (segment === 'low_engagement') {
      filteredUsers = users.filter(u => u.engagementScore < 30);
    }

    return {
      users: filteredUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get detailed info for a single demo user
   */
  async getDemoUserDetail(demoId: string): Promise<DemoUserDetail | null> {
    const demo = await this.prisma.demoInstance.findUnique({
      where: { id: demoId },
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
        },
        featureUsage: true,
        loginAttempts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            sessions: true,
            accessLogs: true,
          },
        },
      },
    });

    if (!demo) return null;

    const totalTimeSpent = demo.sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;

    const featureMap = new Map<string, number>();
    demo.featureUsage.forEach(f => {
      featureMap.set(f.feature, (featureMap.get(f.feature) || 0) + 1);
    });
    const topFeatures = Array.from(featureMap.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const engagementScore = this.calculateEngagementScore(demo, totalTimeSpent);
    const actionsPerformed = demo.actionsPerformed as any || {};

    // Check mailing list
    const subscriber = await this.prisma.marketingSubscriber.findFirst({
      where: { email: demo.email, isSubscribed: true },
    });

    return {
      id: demo.id,
      email: demo.email,
      name: demo.name,
      company: demo.company,
      phone: demo.phone,
      status: this.getDemoStatus(demo),
      createdAt: demo.createdAt,
      expiresAt: demo.expiresAt,
      lastAccessedAt: demo.lastAccessedAt,
      sessionCount: demo._count.sessions,
      totalTimeSpent: Math.round(totalTimeSpent),
      requestCount: demo.requestCount,
      featuresUsed: Array.from(featureMap.keys()),
      topFeatures,
      postsCreated: actionsPerformed.postsCreated || 0,
      pagesCreated: actionsPerformed.pagesCreated || 0,
      upgradeRequested: demo.upgradeRequested,
      engagementScore,
      isOnMailingList: !!subscriber,
    };
  }

  /**
   * Get sessions for a demo user
   */
  async getDemoSessions(demoId: string): Promise<DemoSession[]> {
    const sessions = await this.prisma.demoSession.findMany({
      where: { demoInstanceId: demoId },
      orderBy: { startedAt: 'desc' },
    });

    return sessions.map(s => ({
      id: s.id,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      duration: s.duration,
      pagesViewed: s.pagesViewed,
      actionsCount: s.actionsCount,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
    }));
  }

  /**
   * Get login attempts for a demo user
   */
  async getLoginAttempts(demoId: string): Promise<LoginAttempt[]> {
    const attempts = await this.prisma.demoLoginAttempt.findMany({
      where: { demoInstanceId: demoId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return attempts.map(a => ({
      id: a.id,
      email: a.email,
      success: a.success,
      failureReason: a.failureReason,
      ipAddress: a.ipAddress,
      createdAt: a.createdAt,
    }));
  }

  /**
   * Extend demo expiration
   */
  async extendDemo(demoId: string, hours: number): Promise<void> {
    const demo = await this.prisma.demoInstance.findUnique({
      where: { id: demoId },
    });

    if (!demo) {
      throw new NotFoundException('Demo not found');
    }

    const newExpiry = new Date(demo.expiresAt);
    newExpiry.setHours(newExpiry.getHours() + hours);

    await this.prisma.demoInstance.update({
      where: { id: demoId },
      data: {
        expiresAt: newExpiry,
        status: 'RUNNING',
      },
    });

    this.logger.log(`Extended demo ${demoId} by ${hours} hours`);
  }

  /**
   * Reset demo access (regenerate token)
   */
  async resetDemoAccess(demoId: string): Promise<string> {
    const newToken = this.generateAccessToken();

    await this.prisma.demoInstance.update({
      where: { id: demoId },
      data: { accessToken: newToken },
    });

    this.logger.log(`Reset access token for demo ${demoId}`);
    return newToken;
  }

  /**
   * Add user to marketing list
   */
  async addToMailingList(demoId: string, listId?: string): Promise<void> {
    const demo = await this.prisma.demoInstance.findUnique({
      where: { id: demoId },
    });

    if (!demo) {
      throw new NotFoundException('Demo not found');
    }

    // Get or create default demo users list
    let targetListId = listId;
    if (!targetListId) {
      let defaultList = await this.prisma.marketingList.findFirst({
        where: { type: 'AUTO_DEMO_USERS' },
      });

      if (!defaultList) {
        defaultList = await this.prisma.marketingList.create({
          data: {
            name: 'Demo Users',
            description: 'Automatically populated list of demo users',
            type: 'AUTO_DEMO_USERS',
          },
        });
      }
      targetListId = defaultList.id;
    }

    // Check if already subscribed
    const existing = await this.prisma.marketingSubscriber.findFirst({
      where: { email: demo.email, listId: targetListId },
    });

    if (existing) {
      if (!existing.isSubscribed) {
        await this.prisma.marketingSubscriber.update({
          where: { id: existing.id },
          data: { isSubscribed: true, unsubscribedAt: null },
        });
      }
      return;
    }

    // Calculate engagement score
    const sessions = await this.prisma.demoSession.findMany({
      where: { demoInstanceId: demoId },
    });
    const totalTimeSpent = sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
    const engagementScore = this.calculateEngagementScore(demo, totalTimeSpent);

    await this.prisma.marketingSubscriber.create({
      data: {
        email: demo.email,
        name: demo.name,
        company: demo.company,
        phone: demo.phone,
        source: 'demo',
        sourceId: demoId,
        engagementScore,
        sessionCount: sessions.length,
        totalTimeSpent: Math.round(totalTimeSpent),
        lastActivityAt: demo.lastAccessedAt,
        listId: targetListId,
      },
    });

    this.logger.log(`Added ${demo.email} to mailing list ${targetListId}`);
  }

  /**
   * Remove user from marketing list
   */
  async removeFromMailingList(demoId: string): Promise<void> {
    const demo = await this.prisma.demoInstance.findUnique({
      where: { id: demoId },
    });

    if (!demo) {
      throw new NotFoundException('Demo not found');
    }

    await this.prisma.marketingSubscriber.updateMany({
      where: { email: demo.email },
      data: {
        isSubscribed: false,
        unsubscribedAt: new Date(),
        unsubscribeReason: 'Admin removed',
      },
    });

    this.logger.log(`Removed ${demo.email} from mailing lists`);
  }

  /**
   * Get all marketing lists
   */
  async getMarketingLists(): Promise<any[]> {
    const lists = await this.prisma.marketingList.findMany({
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return lists.map(l => ({
      id: l.id,
      name: l.name,
      description: l.description,
      type: l.type,
      subscriberCount: l._count.subscribers,
      isActive: l.isActive,
      createdAt: l.createdAt,
    }));
  }

  /**
   * Bulk add users to mailing list
   */
  async bulkAddToMailingList(demoIds: string[], listId?: string): Promise<number> {
    let added = 0;
    for (const demoId of demoIds) {
      try {
        await this.addToMailingList(demoId, listId);
        added++;
      } catch (e) {
        this.logger.warn(`Failed to add demo ${demoId} to mailing list: ${e.message}`);
      }
    }
    return added;
  }

  /**
   * Export demo users for marketing
   */
  async exportDemoUsers(filters: DemoListFilters = {}): Promise<any[]> {
    const { users } = await this.getDemoUsers({ ...filters, limit: 10000 });

    return users.map(u => ({
      email: u.email,
      name: u.name,
      company: u.company,
      phone: u.phone,
      status: u.status,
      engagementScore: u.engagementScore,
      sessionCount: u.sessionCount,
      totalTimeSpent: u.totalTimeSpent,
      featuresUsed: u.featuresUsed.join(', '),
      createdAt: u.createdAt.toISOString(),
      lastAccessedAt: u.lastAccessedAt?.toISOString() || '',
    }));
  }

  // Helper methods
  private getDemoStatus(demo: any): string {
    if (demo.upgradeRequested) return 'converted';
    if (demo.status === 'TERMINATED') return 'terminated';
    if (demo.status === 'EXPIRED' || new Date(demo.expiresAt) <= new Date()) return 'expired';
    if (demo.status === 'PAUSED') return 'paused';
    return 'active';
  }

  private calculateEngagementScore(demo: any, totalTimeSpent: number): number {
    let score = 0;

    // Time spent (max 30 points)
    score += Math.min(30, totalTimeSpent / 2);

    // Request count (max 20 points)
    score += Math.min(20, demo.requestCount / 50);

    // Features used (max 25 points)
    const featuresUsed = demo.featureUsage?.length || 0;
    score += Math.min(25, featuresUsed * 2);

    // Upgrade requested (25 points)
    if (demo.upgradeRequested) score += 25;

    return Math.round(Math.min(100, score));
  }

  private generateAccessToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}

