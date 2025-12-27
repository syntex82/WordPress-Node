/**
 * Recommendations Module
 * Provides content/product/course recommendations based on various algorithms
 */
import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsAdminController } from './recommendations-admin.controller';
import { RecommendationsService } from './recommendations.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { RecommendationTrackingService } from './recommendation-tracking.service';
import { RecommendationAnalyticsService } from './recommendation-analytics.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationsController, RecommendationsAdminController],
  providers: [
    RecommendationsService,
    RecommendationEngineService,
    RecommendationTrackingService,
    RecommendationAnalyticsService,
  ],
  exports: [RecommendationsService, RecommendationEngineService, RecommendationTrackingService],
})
export class RecommendationsModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecommendationsModule.name);
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Run cleanup every 6 hours
  private readonly CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

  constructor(
    private recommendationsService: RecommendationsService,
    private trackingService: RecommendationTrackingService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting scheduled recommendation cleanup tasks');

    // Run initial cleanup after 1 minute (let app start first)
    setTimeout(() => this.runCleanup(), 60 * 1000);

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private async runCleanup() {
    try {
      this.logger.log('Running scheduled recommendation cleanup...');

      // Clear expired cache
      const expiredCacheCount = await this.recommendationsService.clearExpiredCache();
      this.logger.log(`Cleared ${expiredCacheCount} expired cache entries`);

      // Cleanup old interactions (older than 30 days for views, 90 days for purchases)
      const interactionCount = await this.trackingService.cleanupOldInteractions();
      this.logger.log(`Cleaned up ${interactionCount} old interaction records`);

      // Cleanup old clicks (older than 90 days)
      const clickCount = await this.trackingService.cleanupOldClicks();
      this.logger.log(`Cleaned up ${clickCount} old click records`);
    } catch (error) {
      this.logger.error(`Scheduled cleanup failed: ${error.message}`);
    }
  }
}
