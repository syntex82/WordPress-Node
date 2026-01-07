/**
 * Feed Controller
 * Handles HTTP requests for activity feed operations
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FeedService, CreateTimelinePostDto } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityType } from '@prisma/client';

@Controller('api/feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /**
   * Get following feed - activities from users the current user follows
   * GET /api/feed/following
   */
  @Get('following')
  async getFollowingFeed(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: ActivityType,
  ) {
    return this.feedService.getFollowingFeed(req.user.id, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
      type,
    });
  }

  /**
   * Get discover feed - trending/recommended content
   * GET /api/feed/discover
   */
  @Get('discover')
  async getDiscoverFeed(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: ActivityType,
  ) {
    return this.feedService.getDiscoverFeed(req.user.id, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
      type,
    });
  }

  /**
   * Get trending users to follow
   * GET /api/feed/trending-users
   */
  @Get('trending-users')
  async getTrendingUsers(@Request() req, @Query('limit') limit?: string) {
    return this.feedService.getTrendingUsers(req.user.id, parseInt(limit || '10'));
  }

  /**
   * Get my activities
   * GET /api/feed/my-activities
   */
  @Get('my-activities')
  async getMyActivities(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: ActivityType,
  ) {
    return this.feedService.getUserActivities(req.user.id, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
      type,
    });
  }

  /**
   * Create a timeline post (status update)
   * POST /api/feed/posts
   */
  @Post('posts')
  async createTimelinePost(@Request() req, @Body() dto: CreateTimelinePostDto) {
    return this.feedService.createTimelinePost(req.user.id, dto);
  }

  /**
   * Delete an activity
   * DELETE /api/feed/activities/:id
   */
  @Delete('activities/:id')
  async deleteActivity(@Request() req, @Param('id') id: string) {
    return this.feedService.deleteActivity(id, req.user.id);
  }
}
