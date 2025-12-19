/**
 * Recommendation Tracking Service
 * Tracks user interactions and recommendation clicks for analytics
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TrackInteractionDto, TrackRecommendationClickDto } from './dto';

@Injectable()
export class RecommendationTrackingService {
  private readonly logger = new Logger(RecommendationTrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track a user interaction (view, click, purchase, etc.)
   */
  async trackInteraction(dto: TrackInteractionDto): Promise<{ success: boolean }> {
    try {
      await this.prisma.userInteraction.create({
        data: {
          contentType: dto.contentType,
          contentId: dto.contentId,
          interactionType: dto.interactionType,
          userId: dto.userId,
          sessionId: dto.sessionId,
          metadata: dto.metadata || {},
        },
      });
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to track interaction:', error);
      return { success: false };
    }
  }

  /**
   * Track a click on a recommendation
   */
  async trackRecommendationClick(dto: TrackRecommendationClickDto): Promise<{ success: boolean }> {
    try {
      await this.prisma.recommendationClick.create({
        data: {
          sourceType: dto.sourceType,
          sourceId: dto.sourceId,
          recommendationType: dto.recommendationType,
          clickedType: dto.clickedType,
          clickedId: dto.clickedId,
          position: dto.position,
          userId: dto.userId,
          sessionId: dto.sessionId,
        },
      });

      // Also track as a general interaction
      await this.trackInteraction({
        contentType: dto.clickedType,
        contentId: dto.clickedId,
        interactionType: 'recommendation_click',
        userId: dto.userId,
        sessionId: dto.sessionId,
        metadata: {
          sourceType: dto.sourceType,
          sourceId: dto.sourceId,
          recommendationType: dto.recommendationType,
          position: dto.position,
        },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to track recommendation click:', error);
      return { success: false };
    }
  }

  /**
   * Get user's recent interactions
   */
  async getUserInteractions(
    userId: string,
    contentType?: string,
    limit = 50,
  ): Promise<any[]> {
    const where: any = { userId };
    if (contentType) {
      where.contentType = contentType;
    }

    return this.prisma.userInteraction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get interaction count for content
   */
  async getInteractionCount(contentType: string, contentId: string): Promise<number> {
    return this.prisma.userInteraction.count({
      where: { contentType, contentId },
    });
  }

  /**
   * Get interaction breakdown by type
   */
  async getInteractionBreakdown(
    contentType: string,
    contentId: string,
  ): Promise<Record<string, number>> {
    const interactions = await this.prisma.userInteraction.groupBy({
      by: ['interactionType'],
      where: { contentType, contentId },
      _count: { interactionType: true },
    });

    const breakdown: Record<string, number> = {};
    interactions.forEach(i => {
      breakdown[i.interactionType] = i._count.interactionType;
    });
    return breakdown;
  }

  /**
   * Clean up old interaction data (for privacy/performance)
   */
  async cleanupOldInteractions(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.userInteraction.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        // Keep purchase/enroll interactions longer
        interactionType: { notIn: ['purchase', 'enroll'] },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old interactions`);
    return result.count;
  }

  /**
   * Clean up old recommendation click data
   */
  async cleanupOldClicks(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.recommendationClick.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    this.logger.log(`Cleaned up ${result.count} old recommendation clicks`);
    return result.count;
  }
}

