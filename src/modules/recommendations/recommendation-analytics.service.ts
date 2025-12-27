/**
 * Recommendation Analytics Service
 * Provides analytics and insights for recommendation performance
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RecommendationAnalyticsService {
  private readonly logger = new Logger(RecommendationAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get overall recommendation analytics
   */
  async getAnalytics(period: string, contentType?: string) {
    const startDate = this.getStartDate(period);
    const where: any = { createdAt: { gte: startDate } };

    if (contentType) {
      where.clickedType = contentType;
    }

    // Get total clicks
    const totalClicks = await this.prisma.recommendationClick.count({ where });

    // Get clicks by recommendation type
    const clicksByType = await this.prisma.recommendationClick.groupBy({
      by: ['recommendationType'],
      where,
      _count: { id: true },
    });

    // Get clicks by content type
    const clicksByContent = await this.prisma.recommendationClick.groupBy({
      by: ['clickedType'],
      where,
      _count: { id: true },
    });

    // Get total interactions
    const interactionWhere: any = { createdAt: { gte: startDate } };
    if (contentType) {
      interactionWhere.contentType = contentType;
    }
    const totalInteractions = await this.prisma.userInteraction.count({
      where: interactionWhere,
    });

    // Get interactions by type
    const interactionsByType = await this.prisma.userInteraction.groupBy({
      by: ['interactionType'],
      where: interactionWhere,
      _count: { id: true },
    });

    return {
      period,
      startDate,
      totalClicks,
      totalInteractions,
      clicksByRecommendationType: clicksByType.reduce(
        (acc, item) => {
          acc[item.recommendationType] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
      clicksByContentType: clicksByContent.reduce(
        (acc, item) => {
          acc[item.clickedType] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
      interactionsByType: interactionsByType.reduce(
        (acc, item) => {
          acc[item.interactionType] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Get click-through rates for recommendations
   */
  async getClickThroughRates(period: string) {
    const startDate = this.getStartDate(period);

    // Get views (impressions) - assuming views are tracked as interactions
    const impressions = await this.prisma.userInteraction.count({
      where: {
        createdAt: { gte: startDate },
        interactionType: 'view',
      },
    });

    // Get recommendation clicks
    const clicks = await this.prisma.recommendationClick.count({
      where: { createdAt: { gte: startDate } },
    });

    // Get CTR by recommendation type
    const clicksByType = await this.prisma.recommendationClick.groupBy({
      by: ['recommendationType'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    });

    return {
      period,
      totalImpressions: impressions,
      totalClicks: clicks,
      overallCTR: impressions > 0 ? (clicks / impressions) * 100 : 0,
      ctrByType: clicksByType.reduce(
        (acc, item) => {
          // Note: This is clicks per type, actual CTR would need impression tracking per type
          acc[item.recommendationType] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Get top performing recommendations
   */
  async getTopPerforming(period: string, limit: number) {
    const startDate = this.getStartDate(period);

    // Get top clicked content
    const topClicked = await this.prisma.recommendationClick.groupBy({
      by: ['clickedType', 'clickedId'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    // Enrich with content details
    const enriched = await Promise.all(
      topClicked.map(async (item) => {
        const contentDetails = await this.getContentDetails(item.clickedType, item.clickedId);
        return {
          contentType: item.clickedType,
          contentId: item.clickedId,
          clicks: item._count.id,
          ...contentDetails,
        };
      }),
    );

    return {
      period,
      topPerforming: enriched,
    };
  }

  /**
   * Get content details by type and ID
   */
  private async getContentDetails(contentType: string, contentId: string) {
    try {
      switch (contentType) {
        case 'post':
          const post = await this.prisma.post.findUnique({
            where: { id: contentId },
            select: { title: true, slug: true },
          });
          return post ? { title: post.title, slug: post.slug } : {};

        case 'product':
          const product = await this.prisma.product.findUnique({
            where: { id: contentId },
            select: { name: true, slug: true },
          });
          return product ? { title: product.name, slug: product.slug } : {};

        case 'course':
          const course = await this.prisma.course.findUnique({
            where: { id: contentId },
            select: { title: true, slug: true },
          });
          return course ? { title: course.title, slug: course.slug } : {};

        default:
          return {};
      }
    } catch {
      return {};
    }
  }

  /**
   * Get daily stats for a period
   * Uses Prisma's type-safe API instead of raw SQL to prevent injection
   */
  async getDailyStats(period: string, contentType?: string) {
    const startDate = this.getStartDate(period);

    // Build safe where clause for clicks
    const clickWhere: any = {
      createdAt: { gte: startDate },
    };
    if (contentType) {
      clickWhere.clickedType = contentType;
    }

    // Build safe where clause for interactions
    const interactionWhere: any = {
      createdAt: { gte: startDate },
    };
    if (contentType) {
      interactionWhere.contentType = contentType;
    }

    // Get clicks grouped by date using safe Prisma methods
    const clicks = await this.prisma.recommendationClick.findMany({
      where: clickWhere,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Get interactions grouped by date
    const interactions = await this.prisma.userInteraction.findMany({
      where: interactionWhere,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by date in JavaScript (safe from SQL injection)
    const clicksByDate = this.aggregateByDate(clicks);
    const interactionsByDate = this.aggregateByDate(interactions);

    return {
      period,
      startDate,
      clickStats: clicksByDate,
      interactionStats: interactionsByDate,
    };
  }

  /**
   * Aggregate records by date
   */
  private aggregateByDate(records: { createdAt: Date }[]): Array<{ date: string; count: number }> {
    const dateMap = new Map<string, number>();

    for (const record of records) {
      const dateStr = record.createdAt.toISOString().split('T')[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    }

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get conversion metrics (for e-commerce)
   */
  async getConversionMetrics(period: string) {
    const startDate = this.getStartDate(period);

    // Count recommendation clicks that led to purchases
    const recommendationPurchases = await this.prisma.userInteraction.count({
      where: {
        createdAt: { gte: startDate },
        interactionType: 'purchase',
        metadata: {
          path: ['fromRecommendation'],
          equals: true,
        },
      },
    });

    // Count total purchases
    const totalPurchases = await this.prisma.userInteraction.count({
      where: {
        createdAt: { gte: startDate },
        interactionType: 'purchase',
      },
    });

    // Count recommendation clicks
    const recommendationClicks = await this.prisma.recommendationClick.count({
      where: { createdAt: { gte: startDate } },
    });

    return {
      period,
      recommendationPurchases,
      totalPurchases,
      recommendationClicks,
      conversionRate:
        recommendationClicks > 0 ? (recommendationPurchases / recommendationClicks) * 100 : 0,
      recommendationContribution:
        totalPurchases > 0 ? (recommendationPurchases / totalPurchases) * 100 : 0,
    };
  }

  /**
   * Calculate start date based on period
   */
  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        now.setDate(now.getDate() - 1);
        break;
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        now.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
      default:
        now.setDate(now.getDate() - 7);
    }
    return now;
  }
}
