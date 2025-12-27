/**
 * Recommendation Engine Service
 * Contains the core recommendation algorithms
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RecommendationItem } from './recommendations.service';

@Injectable()
export class RecommendationEngineService {
  private readonly logger = new Logger(RecommendationEngineService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get related posts based on same author or similar content
   */
  async getRelatedPosts(
    post: { id: string; title: string; authorId: string; customFields: any },
    limit: number,
  ): Promise<RecommendationItem[]> {
    // Get posts by same author first, then fill with recent posts
    const relatedPosts = await this.prisma.post.findMany({
      where: {
        id: { not: post.id },
        status: 'PUBLISHED',
        OR: [
          { authorId: post.authorId }, // Same author
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    // If not enough, fill with recent published posts
    if (relatedPosts.length < limit) {
      const additionalPosts = await this.prisma.post.findMany({
        where: {
          id: { notIn: [post.id, ...relatedPosts.map((p) => p.id)] },
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          publishedAt: true,
          author: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: limit - relatedPosts.length,
      });
      relatedPosts.push(...additionalPosts);
    }

    return relatedPosts.map((p, idx) => ({
      id: p.id,
      type: 'post',
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || undefined,
      image: p.featuredImage || undefined,
      score: 1 - idx * 0.1, // Decrease score by position
      metadata: { author: p.author?.name },
    }));
  }

  /**
   * Get related pages based on template similarity
   */
  async getRelatedPages(
    page: { id: string; title: string; template?: string | null },
    limit: number,
  ): Promise<RecommendationItem[]> {
    const relatedPages = await this.prisma.page.findMany({
      where: {
        id: { not: page.id },
        status: 'PUBLISHED',
        ...(page.template ? { template: page.template } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    // Fill with other pages if needed
    if (relatedPages.length < limit) {
      const additionalPages = await this.prisma.page.findMany({
        where: {
          id: { notIn: [page.id, ...relatedPages.map((p) => p.id)] },
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          featuredImage: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit - relatedPages.length,
      });
      relatedPages.push(...additionalPages);
    }

    return relatedPages.map((p, idx) => ({
      id: p.id,
      type: 'page',
      title: p.title,
      slug: p.slug,
      image: p.featuredImage || undefined,
      score: 1 - idx * 0.1,
    }));
  }

  /**
   * Get related products based on category and tags
   */
  async getRelatedProducts(
    product: { id: string; name: string; categoryId?: string | null; tags?: any },
    limit: number,
  ): Promise<RecommendationItem[]> {
    const conditions: any[] = [];

    if (product.categoryId) {
      conditions.push({ categoryId: product.categoryId });
    }

    const relatedProducts = await this.prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: 'ACTIVE',
        ...(conditions.length > 0 ? { OR: conditions } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        images: true,
        price: true,
        salePrice: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Fill with other products if needed
    if (relatedProducts.length < limit) {
      const additionalProducts = await this.prisma.product.findMany({
        where: {
          id: { notIn: [product.id, ...relatedProducts.map((p) => p.id)] },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          images: true,
          price: true,
          salePrice: true,
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit - relatedProducts.length,
      });
      relatedProducts.push(...additionalProducts);
    }

    return relatedProducts.map((p, idx) => ({
      id: p.id,
      type: 'product',
      title: p.name,
      slug: p.slug,
      excerpt: p.description ? p.description.substring(0, 150) : undefined,
      image: Array.isArray(p.images) && p.images.length > 0 ? String(p.images[0]) : undefined,
      score: 1 - idx * 0.1,
      metadata: {
        price: p.price,
        salePrice: p.salePrice,
        category: p.category?.name,
      },
    }));
  }

  /**
   * Get related courses based on category and level
   */
  async getRelatedCourses(
    course: { id: string; title: string; category?: string | null; level?: string | null },
    limit: number,
  ): Promise<RecommendationItem[]> {
    const conditions: any[] = [];

    if (course.category) {
      conditions.push({ category: course.category });
    }
    if (course.level) {
      conditions.push({ level: course.level });
    }

    const relatedCourses = await this.prisma.course.findMany({
      where: {
        id: { not: course.id },
        status: 'PUBLISHED',
        ...(conditions.length > 0 ? { OR: conditions } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        featuredImage: true,
        priceAmount: true,
        category: true,
        level: true,
        instructor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Fill with other courses if needed
    if (relatedCourses.length < limit) {
      const additionalCourses = await this.prisma.course.findMany({
        where: {
          id: { notIn: [course.id, ...relatedCourses.map((c) => c.id)] },
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          featuredImage: true,
          priceAmount: true,
          category: true,
          level: true,
          instructor: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit - relatedCourses.length,
      });
      relatedCourses.push(...additionalCourses);
    }

    return relatedCourses.map((c, idx) => ({
      id: c.id,
      type: 'course',
      title: c.title,
      slug: c.slug,
      excerpt: c.description ? c.description.substring(0, 150) : undefined,
      image: c.featuredImage || undefined,
      score: 1 - idx * 0.1,
      metadata: {
        price: c.priceAmount,
        category: c.category,
        level: c.level,
        instructor: (c as any).instructor?.name,
      },
    }));
  }

  /**
   * Get trending content based on recent interactions
   */
  async getTrending(
    contentType: 'post' | 'product' | 'course',
    limit: number,
    timeframeDays: number,
  ): Promise<RecommendationItem[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframeDays);

    // Get interaction counts grouped by content
    const interactions = await this.prisma.userInteraction.groupBy({
      by: ['contentId'],
      where: {
        contentType,
        createdAt: { gte: startDate },
      },
      _count: { contentId: true },
      orderBy: { _count: { contentId: 'desc' } },
      take: limit,
    });

    if (interactions.length === 0) {
      // Fall back to recent content
      return this.getRecent(contentType, limit);
    }

    const contentIds = interactions.map((i) => i.contentId);
    return this.fetchContentByIds(contentType, contentIds, interactions);
  }

  /**
   * Get popular content (all-time)
   */
  async getPopular(
    contentType: 'post' | 'product' | 'course',
    limit: number,
  ): Promise<RecommendationItem[]> {
    // Get interaction counts
    const interactions = await this.prisma.userInteraction.groupBy({
      by: ['contentId'],
      where: { contentType },
      _count: { contentId: true },
      orderBy: { _count: { contentId: 'desc' } },
      take: limit,
    });

    if (interactions.length === 0) {
      return this.getRecent(contentType, limit);
    }

    const contentIds = interactions.map((i) => i.contentId);
    return this.fetchContentByIds(contentType, contentIds, interactions);
  }

  /**
   * Get personalized recommendations based on user history
   */
  async getPersonalized(
    userId: string,
    contentType: 'post' | 'product' | 'course',
    limit: number,
  ): Promise<RecommendationItem[]> {
    // Get user's recent interactions
    const userInteractions = await this.prisma.userInteraction.findMany({
      where: { userId, contentType },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { contentId: true },
    });

    if (userInteractions.length === 0) {
      // No history - return trending
      return this.getTrending(contentType, limit, 7);
    }

    const viewedIds = userInteractions.map((i) => i.contentId);

    // Find content similar to what user has interacted with
    // For now, just return content the user hasn't seen
    return this.getContentNotViewed(contentType, viewedIds, limit);
  }

  /**
   * Get recent content
   */
  private async getRecent(
    contentType: 'post' | 'product' | 'course',
    limit: number,
  ): Promise<RecommendationItem[]> {
    switch (contentType) {
      case 'post':
        const posts = await this.prisma.post.findMany({
          where: { status: 'PUBLISHED' },
          select: { id: true, title: true, slug: true, excerpt: true, featuredImage: true },
          orderBy: { publishedAt: 'desc' },
          take: limit,
        });
        return posts.map((p, idx) => ({
          id: p.id,
          type: 'post',
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt || undefined,
          image: p.featuredImage || undefined,
          score: 1 - idx * 0.1,
        }));

      case 'product':
        const products = await this.prisma.product.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            images: true,
            price: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return products.map((p, idx) => ({
          id: p.id,
          type: 'product',
          title: p.name,
          slug: p.slug,
          excerpt: p.description ? p.description.substring(0, 150) : undefined,
          image: Array.isArray(p.images) && p.images.length > 0 ? String(p.images[0]) : undefined,
          score: 1 - idx * 0.1,
          metadata: { price: p.price },
        }));

      case 'course':
        const courses = await this.prisma.course.findMany({
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            featuredImage: true,
            priceAmount: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return courses.map((c, idx) => ({
          id: c.id,
          type: 'course',
          title: c.title,
          slug: c.slug,
          excerpt: c.description ? c.description.substring(0, 150) : undefined,
          image: c.featuredImage || undefined,
          score: 1 - idx * 0.1,
          metadata: { price: c.priceAmount },
        }));

      default:
        return [];
    }
  }

  /**
   * Fetch content by IDs with scores from interactions
   */
  private async fetchContentByIds(
    contentType: string,
    contentIds: string[],
    interactions: Array<{ contentId: string; _count: { contentId: number } }>,
  ): Promise<RecommendationItem[]> {
    const scoreMap = new Map(interactions.map((i) => [i.contentId, i._count.contentId]));
    const maxScore = Math.max(...interactions.map((i) => i._count.contentId));

    switch (contentType) {
      case 'post':
        const posts = await this.prisma.post.findMany({
          where: { id: { in: contentIds }, status: 'PUBLISHED' },
          select: { id: true, title: true, slug: true, excerpt: true, featuredImage: true },
        });
        return posts
          .map((p) => ({
            id: p.id,
            type: 'post',
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt || undefined,
            image: p.featuredImage || undefined,
            score: (scoreMap.get(p.id) || 0) / maxScore,
          }))
          .sort((a, b) => (b.score || 0) - (a.score || 0));

      case 'product':
        const products = await this.prisma.product.findMany({
          where: { id: { in: contentIds }, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            images: true,
            price: true,
          },
        });
        return products
          .map((p) => ({
            id: p.id,
            type: 'product',
            title: p.name,
            slug: p.slug,
            excerpt: p.description ? p.description.substring(0, 150) : undefined,
            image: Array.isArray(p.images) && p.images.length > 0 ? String(p.images[0]) : undefined,
            score: (scoreMap.get(p.id) || 0) / maxScore,
            metadata: { price: p.price },
          }))
          .sort((a, b) => (b.score || 0) - (a.score || 0));

      case 'course':
        const courses2 = await this.prisma.course.findMany({
          where: { id: { in: contentIds }, status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            featuredImage: true,
            priceAmount: true,
          },
        });
        return courses2
          .map((c) => ({
            id: c.id,
            type: 'course',
            title: c.title,
            slug: c.slug,
            excerpt: c.description ? c.description.substring(0, 150) : undefined,
            image: c.featuredImage || undefined,
            score: (scoreMap.get(c.id) || 0) / maxScore,
            metadata: { price: c.priceAmount },
          }))
          .sort((a, b) => (b.score || 0) - (a.score || 0));

      default:
        return [];
    }
  }

  /**
   * Fetch content by IDs without scores (simpler version)
   */
  private async fetchContentByIdsSimple(
    contentType: string,
    contentIds: string[],
  ): Promise<RecommendationItem[]> {
    switch (contentType) {
      case 'post':
        const posts = await this.prisma.post.findMany({
          where: { id: { in: contentIds }, status: 'PUBLISHED' },
          select: { id: true, title: true, slug: true, excerpt: true, featuredImage: true },
        });
        return posts.map((p, idx) => ({
          id: p.id,
          type: 'post',
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt || undefined,
          image: p.featuredImage || undefined,
          score: 1 - idx * 0.05,
        }));

      case 'product':
        const products = await this.prisma.product.findMany({
          where: { id: { in: contentIds }, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            images: true,
            price: true,
          },
        });
        return products.map((p, idx) => ({
          id: p.id,
          type: 'product',
          title: p.name,
          slug: p.slug,
          excerpt: p.description ? p.description.substring(0, 150) : undefined,
          image: Array.isArray(p.images) && p.images.length > 0 ? String(p.images[0]) : undefined,
          score: 1 - idx * 0.05,
          metadata: { price: p.price },
        }));

      case 'course':
        const courses = await this.prisma.course.findMany({
          where: { id: { in: contentIds }, status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            featuredImage: true,
            priceAmount: true,
          },
        });
        return courses.map((c, idx) => ({
          id: c.id,
          type: 'course',
          title: c.title,
          slug: c.slug,
          excerpt: c.description ? c.description.substring(0, 150) : undefined,
          image: c.featuredImage || undefined,
          score: 1 - idx * 0.05,
          metadata: { price: c.priceAmount },
        }));

      default:
        return [];
    }
  }

  /**
   * Get content not yet viewed by user
   */
  private async getContentNotViewed(
    contentType: string,
    viewedIds: string[],
    limit: number,
  ): Promise<RecommendationItem[]> {
    switch (contentType) {
      case 'post':
        const posts = await this.prisma.post.findMany({
          where: { id: { notIn: viewedIds }, status: 'PUBLISHED' },
          select: { id: true, title: true, slug: true, excerpt: true, featuredImage: true },
          orderBy: { publishedAt: 'desc' },
          take: limit,
        });
        return posts.map((p, idx) => ({
          id: p.id,
          type: 'post',
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt || undefined,
          image: p.featuredImage || undefined,
          score: 1 - idx * 0.1,
        }));

      case 'product':
        const products = await this.prisma.product.findMany({
          where: { id: { notIn: viewedIds }, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            images: true,
            price: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return products.map((p, idx) => ({
          id: p.id,
          type: 'product',
          title: p.name,
          slug: p.slug,
          excerpt: p.description ? p.description.substring(0, 150) : undefined,
          image: Array.isArray(p.images) && p.images.length > 0 ? String(p.images[0]) : undefined,
          score: 1 - idx * 0.1,
          metadata: { price: p.price },
        }));

      case 'course':
        const courses3 = await this.prisma.course.findMany({
          where: { id: { notIn: viewedIds }, status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            featuredImage: true,
            priceAmount: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return courses3.map((c, idx) => ({
          id: c.id,
          type: 'course',
          title: c.title,
          slug: c.slug,
          excerpt: c.description ? c.description.substring(0, 150) : undefined,
          image: c.featuredImage || undefined,
          score: 1 - idx * 0.1,
          metadata: { price: c.priceAmount },
        }));

      default:
        return [];
    }
  }

  /**
   * Collaborative filtering: "Users who viewed X also viewed Y"
   * Finds content that was viewed by users who also viewed the current content
   */
  async getCollaborativeRecommendations(
    contentId: string,
    contentType: string,
    limit: number,
  ): Promise<RecommendationItem[]> {
    try {
      // Step 1: Find users who interacted with this content
      const usersWhoViewed = await this.prisma.userInteraction.findMany({
        where: {
          contentId,
          contentType,
          interactionType: { in: ['view', 'click'] },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
        take: 100, // Limit to avoid performance issues
      });

      const userIds = usersWhoViewed.map((u) => u.userId).filter((id): id is string => id !== null);

      if (userIds.length === 0) {
        // Fall back to popular content
        return this.getPopular(contentType as 'post' | 'product' | 'course', limit);
      }

      // Step 2: Find other content these users also viewed
      const otherInteractions = await this.prisma.userInteraction.groupBy({
        by: ['contentId'],
        where: {
          userId: { in: userIds },
          contentType,
          contentId: { not: contentId },
          interactionType: { in: ['view', 'click', 'purchase'] },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit * 2,
      });

      if (otherInteractions.length === 0) {
        return this.getPopular(contentType as 'post' | 'product' | 'course', limit);
      }

      // Step 3: Fetch content details
      const contentIds = otherInteractions.map((i) => i.contentId);
      const items = await this.fetchContentByIdsSimple(contentType, contentIds);

      // Calculate scores based on co-occurrence
      const maxCount = otherInteractions[0]?._count?.id || 1;
      return items.slice(0, limit).map((item) => {
        const interaction = otherInteractions.find((i) => i.contentId === item.id);
        const score = interaction ? interaction._count.id / maxCount : 0.5;
        return { ...item, score: Math.max(0.1, score) };
      });
    } catch (error) {
      this.logger.error(`Collaborative filtering failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Frequently Bought Together: Products often purchased in the same order
   * For e-commerce recommendations
   */
  async getFrequentlyBoughtTogether(
    productId: string,
    limit: number,
  ): Promise<RecommendationItem[]> {
    try {
      // Step 1: Find users who purchased this product
      const purchasers = await this.prisma.userInteraction.findMany({
        where: {
          contentId: productId,
          contentType: 'product',
          interactionType: 'purchase',
          userId: { not: null },
        },
        select: { userId: true, sessionId: true, createdAt: true },
        take: 500,
      });

      if (purchasers.length === 0) {
        return this.getRelatedProductsById(productId, limit);
      }

      // Build list of user/session combos
      const purchaseKeys = purchasers.map((p) => ({
        userId: p.userId,
        sessionId: p.sessionId,
        date: p.createdAt,
      }));

      // Step 2: Find other products purchased by these users within 30 min window
      const coPurchasePromises = purchaseKeys.map(async (pk) => {
        const windowStart = new Date(pk.date.getTime() - 30 * 60 * 1000);
        const windowEnd = new Date(pk.date.getTime() + 30 * 60 * 1000);

        const orConditions: any[] = [];
        if (pk.userId) {
          orConditions.push({ userId: pk.userId });
        }
        if (pk.sessionId) {
          orConditions.push({ sessionId: pk.sessionId });
        }

        if (orConditions.length === 0) return [];

        return this.prisma.userInteraction.findMany({
          where: {
            OR: orConditions,
            contentType: 'product',
            contentId: { not: productId },
            interactionType: 'purchase',
            createdAt: { gte: windowStart, lte: windowEnd },
          },
          select: { contentId: true },
        });
      });

      const allCoPurchases = await Promise.all(coPurchasePromises);
      const flatCoPurchases = allCoPurchases.flat();

      if (flatCoPurchases.length === 0) {
        return this.getRelatedProductsById(productId, limit);
      }

      // Step 3: Count co-occurrence
      const countMap = new Map<string, number>();
      flatCoPurchases.forEach((p) => {
        countMap.set(p.contentId, (countMap.get(p.contentId) || 0) + 1);
      });

      // Sort by frequency
      const sortedIds = Array.from(countMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      // Step 4: Fetch product details
      const products = await this.prisma.product.findMany({
        where: { id: { in: sortedIds }, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          images: true,
        },
      });

      const maxCount = Math.max(...countMap.values()) || 1;
      return sortedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined)
        .map((p) => ({
          id: p.id,
          type: 'product' as const,
          title: p.name,
          slug: p.slug,
          excerpt: p.description ? p.description.substring(0, 150) : undefined,
          image: (p.images as string[])?.[0] || undefined,
          score: (countMap.get(p.id) || 0) / maxCount,
          metadata: { price: p.price, algorithm: 'frequently_bought_together' },
        }));
    } catch (error) {
      this.logger.error(`Frequently bought together failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Helper to fetch related products by ID (used as fallback)
   */
  private async getRelatedProductsById(
    productId: string,
    limit: number,
  ): Promise<RecommendationItem[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true },
    });

    const related = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        status: 'ACTIVE',
        ...(product?.categoryId ? { categoryId: product.categoryId } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        images: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return related.map((p, idx) => ({
      id: p.id,
      type: 'product' as const,
      title: p.name,
      slug: p.slug,
      excerpt: p.description ? p.description.substring(0, 150) : undefined,
      image: (p.images as string[])?.[0] || undefined,
      score: 1 - idx * 0.1,
      metadata: { price: p.price },
    }));
  }

  /**
   * Similar users: Find content from users with similar behavior
   */
  async getSimilarUserRecommendations(
    userId: string,
    contentType: string,
    limit: number,
  ): Promise<RecommendationItem[]> {
    try {
      // Get user's interaction history
      const userHistory = await this.prisma.userInteraction.findMany({
        where: { userId, contentType },
        select: { contentId: true },
        take: 50,
      });

      if (userHistory.length === 0) {
        return this.getPopular(contentType as 'post' | 'product' | 'course', limit);
      }

      const userContentIds = userHistory.map((h) => h.contentId);

      // Find users with similar interactions
      const similarUsers = await this.prisma.userInteraction.groupBy({
        by: ['userId'],
        where: {
          contentId: { in: userContentIds },
          userId: { not: userId },
          NOT: { userId: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      });

      const similarUserIds = similarUsers
        .map((u) => u.userId)
        .filter((id): id is string => id !== null);

      if (similarUserIds.length === 0) {
        return this.getPopular(contentType as 'post' | 'product' | 'course', limit);
      }

      // Get content those similar users interacted with
      const recommendations = await this.prisma.userInteraction.groupBy({
        by: ['contentId'],
        where: {
          userId: { in: similarUserIds },
          contentType,
          contentId: { notIn: userContentIds },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit * 2,
      });

      const contentIds = recommendations.map((r) => r.contentId);
      const items = await this.fetchContentByIdsSimple(contentType, contentIds);

      const maxCount = recommendations[0]?._count?.id || 1;
      return items.slice(0, limit).map((item) => {
        const rec = recommendations.find((r) => r.contentId === item.id);
        return {
          ...item,
          score: rec ? rec._count.id / maxCount : 0.5,
          metadata: { ...item.metadata, algorithm: 'similar_users' },
        };
      });
    } catch (error) {
      this.logger.error(`Similar users recommendation failed: ${error.message}`);
      return [];
    }
  }
}
