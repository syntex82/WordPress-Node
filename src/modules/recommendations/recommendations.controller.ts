/**
 * Recommendations Controller
 * Public API endpoints for fetching recommendations
 */
import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { RecommendationsService } from './recommendations.service';
import { RecommendationTrackingService } from './recommendation-tracking.service';
import { GetRecommendationsDto, TrackInteractionDto, TrackRecommendationClickDto } from './dto';

@Controller('api/recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly trackingService: RecommendationTrackingService,
  ) {}

  /**
   * Get related posts for a given post
   * GET /api/recommendations/posts/:postId
   */
  @Get('posts/:postId')
  async getRelatedPosts(
    @Param('postId') postId: string,
    @Query() query: GetRecommendationsDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id;
    return this.recommendationsService.getRelatedPosts(postId, query.limit || 6, userId);
  }

  /**
   * Get related pages for a given page
   * GET /api/recommendations/pages/:pageId
   */
  @Get('pages/:pageId')
  async getRelatedPages(@Param('pageId') pageId: string, @Query() query: GetRecommendationsDto) {
    return this.recommendationsService.getRelatedPages(pageId, query.limit || 6);
  }

  /**
   * Get related products for a given product
   * GET /api/recommendations/products/:productId
   */
  @Get('products/:productId')
  async getRelatedProducts(
    @Param('productId') productId: string,
    @Query() query: GetRecommendationsDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id;
    return this.recommendationsService.getRelatedProducts(productId, query.limit || 6, userId);
  }

  /**
   * Get related courses for a given course
   * GET /api/recommendations/courses/:courseId
   */
  @Get('courses/:courseId')
  async getRelatedCourses(
    @Param('courseId') courseId: string,
    @Query() query: GetRecommendationsDto,
  ) {
    return this.recommendationsService.getRelatedCourses(courseId, query.limit || 6);
  }

  /**
   * Get trending content
   * GET /api/recommendations/trending/:contentType
   */
  @Get('trending/:contentType')
  async getTrending(
    @Param('contentType') contentType: 'post' | 'product' | 'course',
    @Query() query: GetRecommendationsDto,
    @Query('days') days?: string,
  ) {
    const timeframeDays = days ? parseInt(days) : 7;
    return this.recommendationsService.getTrending(contentType, query.limit || 6, timeframeDays);
  }

  /**
   * Get popular content
   * GET /api/recommendations/popular/:contentType
   */
  @Get('popular/:contentType')
  async getPopular(
    @Param('contentType') contentType: 'post' | 'product' | 'course',
    @Query() query: GetRecommendationsDto,
  ) {
    return this.recommendationsService.getPopular(contentType, query.limit || 6);
  }

  /**
   * Get personalized recommendations for current user
   * GET /api/recommendations/personalized/:contentType
   */
  @Get('personalized/:contentType')
  async getPersonalized(
    @Param('contentType') contentType: 'post' | 'product' | 'course',
    @Query() query: GetRecommendationsDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id;
    if (!userId) {
      // Fall back to popular for anonymous users
      return this.recommendationsService.getPopular(contentType, query.limit || 6);
    }
    return this.recommendationsService.getPersonalized(userId, contentType, query.limit || 6);
  }

  /**
   * Track user interaction (view, click, etc.)
   * POST /api/recommendations/track
   */
  @Post('track')
  async trackInteraction(@Body() dto: TrackInteractionDto, @Req() req: Request) {
    const userId = (req as any).user?.id || dto.userId;
    // Ensure sessionId is a string or undefined, not an object
    const sessionId: string | undefined =
      typeof dto.sessionId === 'string'
        ? dto.sessionId
        : typeof req.sessionID === 'string'
          ? req.sessionID
          : undefined;

    return this.trackingService.trackInteraction({
      ...dto,
      userId,
      sessionId,
    });
  }

  /**
   * Track recommendation click
   * POST /api/recommendations/track-click
   */
  @Post('track-click')
  async trackClick(@Body() dto: TrackRecommendationClickDto, @Req() req: Request) {
    const userId = (req as any).user?.id || dto.userId;
    // Ensure sessionId is a string or undefined, not an object
    const sessionId: string | undefined =
      typeof dto.sessionId === 'string'
        ? dto.sessionId
        : typeof req.sessionID === 'string'
          ? req.sessionID
          : undefined;

    return this.trackingService.trackRecommendationClick({
      ...dto,
      userId,
      sessionId,
    });
  }

  /**
   * Collaborative filtering: "Users who viewed X also viewed Y"
   * GET /api/recommendations/also-viewed/:contentType/:contentId
   */
  @Get('also-viewed/:contentType/:contentId')
  async getAlsoViewed(
    @Param('contentType') contentType: 'post' | 'product' | 'course',
    @Param('contentId') contentId: string,
    @Query() query: GetRecommendationsDto,
  ) {
    return this.recommendationsService.getCollaborativeRecommendations(
      contentId,
      contentType,
      query.limit || 6,
    );
  }

  /**
   * Frequently bought together (for products)
   * GET /api/recommendations/bought-together/:productId
   */
  @Get('bought-together/:productId')
  async getFrequentlyBoughtTogether(
    @Param('productId') productId: string,
    @Query() query: GetRecommendationsDto,
  ) {
    return this.recommendationsService.getFrequentlyBoughtTogether(productId, query.limit || 4);
  }

  /**
   * Similar users recommendations
   * GET /api/recommendations/similar-users/:contentType
   */
  @Get('similar-users/:contentType')
  async getSimilarUsersRecommendations(
    @Param('contentType') contentType: 'post' | 'product' | 'course',
    @Query() query: GetRecommendationsDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id;
    if (!userId) {
      // Fall back to popular for anonymous users
      return this.recommendationsService.getPopular(contentType, query.limit || 6);
    }
    return this.recommendationsService.getSimilarUsersRecommendations(
      userId,
      contentType,
      query.limit || 6,
    );
  }
}
