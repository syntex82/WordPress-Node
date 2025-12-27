/**
 * Recommendations Service
 * Main service for fetching recommendations for different content types
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RecommendationEngineService } from './recommendation-engine.service';

export interface RecommendationItem {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  score?: number;
  metadata?: Record<string, any>;
}

export interface RecommendationResult {
  items: RecommendationItem[];
  algorithm: string;
  sourceType: string;
  sourceId: string;
  cached: boolean;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private prisma: PrismaService,
    private engine: RecommendationEngineService,
  ) {}

  /**
   * Get related posts for a given post
   * @param userId - If provided, filters out posts the user has already viewed
   */
  async getRelatedPosts(postId: string, limit = 6, userId?: string): Promise<RecommendationResult> {
    try {
      // Check cache first (only use cache for anonymous users)
      if (!userId) {
        const cached = await this.getCachedRecommendations('post', postId, 'post', 'related');
        if (cached) {
          return { ...cached, cached: true };
        }
      }

      // Get the source post
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, title: true, authorId: true, customFields: true },
      });

      if (!post) {
        return this.emptyResult('post', postId, 'related');
      }

      // Use engine to get related posts (request extra if filtering by user)
      const requestLimit = userId ? limit + 10 : limit;
      let items = await this.engine.getRelatedPosts(post, requestLimit);

      // Filter out posts the user has already viewed
      if (userId && items.length > 0) {
        const viewedPosts = await this.prisma.userInteraction.findMany({
          where: {
            userId,
            contentType: 'post',
            interactionType: 'view',
          },
          select: { contentId: true },
          take: 100,
        });
        const viewedIds = new Set(viewedPosts.map((v) => v.contentId));
        items = items.filter((item) => !viewedIds.has(item.id)).slice(0, limit);
      }

      // Cache the results (only for anonymous users)
      if (!userId) {
        await this.cacheRecommendations('post', postId, 'post', 'related', items);
      }

      return {
        items,
        algorithm: 'related',
        sourceType: 'post',
        sourceId: postId,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get related posts for ${postId}:`, error);
      return this.emptyResult('post', postId, 'related');
    }
  }

  /**
   * Get related pages for a given page
   */
  async getRelatedPages(pageId: string, limit = 6): Promise<RecommendationResult> {
    try {
      const cached = await this.getCachedRecommendations('page', pageId, 'page', 'related');
      if (cached) {
        return { ...cached, cached: true };
      }

      const page = await this.prisma.page.findUnique({
        where: { id: pageId },
        select: { id: true, title: true, template: true },
      });

      if (!page) {
        return this.emptyResult('page', pageId, 'related');
      }

      const items = await this.engine.getRelatedPages(page, limit);
      await this.cacheRecommendations('page', pageId, 'page', 'related', items);

      return {
        items,
        algorithm: 'related',
        sourceType: 'page',
        sourceId: pageId,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get related pages for ${pageId}:`, error);
      return this.emptyResult('page', pageId, 'related');
    }
  }

  /**
   * Get related products for a given product
   */
  /**
   * Get related products for a given product
   * @param userId - If provided, filters out products the user has already viewed
   */
  async getRelatedProducts(
    productId: string,
    limit = 6,
    userId?: string,
  ): Promise<RecommendationResult> {
    try {
      // Check cache first (only use cache for anonymous users)
      if (!userId) {
        const cached = await this.getCachedRecommendations(
          'product',
          productId,
          'product',
          'related',
        );
        if (cached) {
          return { ...cached, cached: true };
        }
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, categoryId: true, tags: true },
      });

      if (!product) {
        return this.emptyResult('product', productId, 'related');
      }

      // Request extra items if filtering by user
      const requestLimit = userId ? limit + 10 : limit;
      let items = await this.engine.getRelatedProducts(product, requestLimit);

      // Filter out products the user has already viewed
      if (userId && items.length > 0) {
        const viewedProducts = await this.prisma.userInteraction.findMany({
          where: {
            userId,
            contentType: 'product',
            interactionType: { in: ['view', 'purchase'] },
          },
          select: { contentId: true },
          take: 100,
        });
        const viewedIds = new Set(viewedProducts.map((v) => v.contentId));
        items = items.filter((item) => !viewedIds.has(item.id)).slice(0, limit);
      }

      // Cache the results (only for anonymous users)
      if (!userId) {
        await this.cacheRecommendations('product', productId, 'product', 'related', items);
      }

      return {
        items,
        algorithm: 'related',
        sourceType: 'product',
        sourceId: productId,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get related products for ${productId}:`, error);
      return this.emptyResult('product', productId, 'related');
    }
  }

  /**
   * Get related courses for a given course
   */
  async getRelatedCourses(courseId: string, limit = 6): Promise<RecommendationResult> {
    try {
      const cached = await this.getCachedRecommendations('course', courseId, 'course', 'related');
      if (cached) {
        return { ...cached, cached: true };
      }

      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, category: true, level: true },
      });

      if (!course) {
        return this.emptyResult('course', courseId, 'related');
      }

      const items = await this.engine.getRelatedCourses(course, limit);
      await this.cacheRecommendations('course', courseId, 'course', 'related', items);

      return {
        items,
        algorithm: 'related',
        sourceType: 'course',
        sourceId: courseId,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get related courses for ${courseId}:`, error);
      return this.emptyResult('course', courseId, 'related');
    }
  }

  /**
   * Get trending content across all types
   */
  async getTrending(
    contentType: 'post' | 'product' | 'course',
    limit = 6,
    timeframeDays = 7,
  ): Promise<RecommendationResult> {
    try {
      const cacheKey = `trending_${timeframeDays}`;
      const cached = await this.getCachedRecommendations(
        'global',
        cacheKey,
        contentType,
        'trending',
      );
      if (cached) {
        return { ...cached, cached: true };
      }

      const items = await this.engine.getTrending(contentType, limit, timeframeDays);
      await this.cacheRecommendations('global', cacheKey, contentType, 'trending', items, 60); // 1 hour cache

      return {
        items,
        algorithm: 'trending',
        sourceType: 'global',
        sourceId: cacheKey,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get trending ${contentType}:`, error);
      return this.emptyResult('global', 'trending', 'trending');
    }
  }

  /**
   * Get popular content (all-time or recent)
   */
  async getPopular(
    contentType: 'post' | 'product' | 'course',
    limit = 6,
  ): Promise<RecommendationResult> {
    try {
      const cached = await this.getCachedRecommendations(
        'global',
        'popular',
        contentType,
        'popular',
      );
      if (cached) {
        return { ...cached, cached: true };
      }

      const items = await this.engine.getPopular(contentType, limit);
      await this.cacheRecommendations('global', 'popular', contentType, 'popular', items, 120); // 2 hour cache

      return {
        items,
        algorithm: 'popular',
        sourceType: 'global',
        sourceId: 'popular',
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get popular ${contentType}:`, error);
      return this.emptyResult('global', 'popular', 'popular');
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalized(
    userId: string,
    contentType: 'post' | 'product' | 'course',
    limit = 6,
  ): Promise<RecommendationResult> {
    try {
      // Personalized recommendations are not cached (user-specific)
      const items = await this.engine.getPersonalized(userId, contentType, limit);

      return {
        items,
        algorithm: 'personalized',
        sourceType: 'user',
        sourceId: userId,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get personalized ${contentType} for user ${userId}:`, error);
      // Fall back to popular
      return this.getPopular(contentType, limit);
    }
  }

  /**
   * Get cached recommendations
   */
  private async getCachedRecommendations(
    sourceType: string,
    sourceId: string,
    targetType: string,
    algorithm: string,
  ): Promise<RecommendationResult | null> {
    try {
      const cached = await this.prisma.recommendationCache.findUnique({
        where: {
          sourceType_sourceId_targetType_algorithm: {
            sourceType,
            sourceId,
            targetType,
            algorithm,
          },
        },
      });

      if (cached && cached.expiresAt > new Date()) {
        return {
          items: cached.recommendations as unknown as RecommendationItem[],
          algorithm,
          sourceType,
          sourceId,
          cached: true,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Cache recommendations
   */
  private async cacheRecommendations(
    sourceType: string,
    sourceId: string,
    targetType: string,
    algorithm: string,
    items: RecommendationItem[],
    durationMinutes = 30,
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      await this.prisma.recommendationCache.upsert({
        where: {
          sourceType_sourceId_targetType_algorithm: {
            sourceType,
            sourceId,
            targetType,
            algorithm,
          },
        },
        update: {
          recommendations: items as any,
          expiresAt,
        },
        create: {
          sourceType,
          sourceId,
          targetType,
          algorithm,
          recommendations: items as any,
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.warn('Failed to cache recommendations:', error);
    }
  }

  /**
   * Return empty result
   */
  private emptyResult(
    sourceType: string,
    sourceId: string,
    algorithm: string,
  ): RecommendationResult {
    return {
      items: [],
      algorithm,
      sourceType,
      sourceId,
      cached: false,
    };
  }

  /**
   * Clear recommendation cache
   */
  async clearCache(sourceType?: string, sourceId?: string): Promise<number> {
    const where: any = {};
    if (sourceType) where.sourceType = sourceType;
    if (sourceId) where.sourceId = sourceId;

    const result = await this.prisma.recommendationCache.deleteMany({ where });
    return result.count;
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    const result = await this.prisma.recommendationCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  /**
   * Collaborative filtering: "Users who viewed X also viewed Y"
   */
  async getCollaborativeRecommendations(
    contentId: string,
    contentType: string,
    limit = 6,
  ): Promise<RecommendationResult> {
    try {
      // Check cache first
      const cached = await this.getCachedRecommendations(
        contentType,
        contentId,
        contentType,
        'collaborative',
      );
      if (cached) {
        return { ...cached, cached: true };
      }

      const items = await this.engine.getCollaborativeRecommendations(
        contentId,
        contentType,
        limit,
      );

      // Cache for 30 minutes
      await this.cacheRecommendations(
        contentType,
        contentId,
        contentType,
        'collaborative',
        items,
        30,
      );

      return {
        items,
        algorithm: 'collaborative',
        sourceType: contentType,
        sourceId: contentId,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get collaborative recommendations: ${error.message}`);
      return this.emptyResult(contentType, contentId, 'collaborative');
    }
  }

  /**
   * Frequently bought together (for e-commerce)
   */
  async getFrequentlyBoughtTogether(productId: string, limit = 4): Promise<RecommendationResult> {
    try {
      // Check cache first
      const cached = await this.getCachedRecommendations(
        'product',
        productId,
        'product',
        'bought_together',
      );
      if (cached) {
        return { ...cached, cached: true };
      }

      const items = await this.engine.getFrequentlyBoughtTogether(productId, limit);

      // Cache for 1 hour (purchase patterns change slowly)
      await this.cacheRecommendations(
        'product',
        productId,
        'product',
        'bought_together',
        items,
        60,
      );

      return {
        items,
        algorithm: 'bought_together',
        sourceType: 'product',
        sourceId: productId,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get frequently bought together: ${error.message}`);
      return this.emptyResult('product', productId, 'bought_together');
    }
  }

  /**
   * Similar users recommendations
   */
  async getSimilarUsersRecommendations(
    userId: string,
    contentType: string,
    limit = 6,
  ): Promise<RecommendationResult> {
    try {
      // Check cache first (cache per user)
      const cached = await this.getCachedRecommendations(
        'user',
        userId,
        contentType,
        'similar_users',
      );
      if (cached) {
        return { ...cached, cached: true };
      }

      const items = await this.engine.getSimilarUserRecommendations(userId, contentType, limit);

      // Cache for 15 minutes (personalized, changes more frequently)
      await this.cacheRecommendations('user', userId, contentType, 'similar_users', items, 15);

      return {
        items,
        algorithm: 'similar_users',
        sourceType: 'user',
        sourceId: userId,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Failed to get similar users recommendations: ${error.message}`);
      return this.emptyResult('user', userId, 'similar_users');
    }
  }
}
