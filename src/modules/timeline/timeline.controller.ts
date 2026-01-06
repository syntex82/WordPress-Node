/**
 * Timeline Controller
 * API endpoints for timeline posts with rich media
 * Includes sharing, hashtags, and mentions
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TimelineService, CreatePostDto, SharePostDto, UpdatePostDto } from './timeline.service';

@Controller('api/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  /**
   * Create a new timeline post
   */
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createPost(@Request() req, @Body() dto: CreatePostDto) {
    return this.timelineService.createPost(req.user.id, dto);
  }

  /**
   * Get feed posts (from followed users)
   */
  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getFeedPosts(
      req.user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get discover feed (public posts from all users)
   */
  @Get('discover')
  @UseGuards(JwtAuthGuard)
  async getDiscover(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getDiscoverPosts(
      req.user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get posts for a specific user
   */
  @Get('users/:userId/posts')
  @UseGuards(JwtAuthGuard)
  async getUserPosts(
    @Request() req,
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getUserPosts(
      userId,
      req.user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get a single post
   */
  @Get('posts/:id')
  @UseGuards(JwtAuthGuard)
  async getPost(@Request() req, @Param('id') id: string) {
    return this.timelineService.getPost(id, req.user.id);
  }

  /**
   * Like a post
   */
  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(@Request() req, @Param('id') id: string) {
    return this.timelineService.likePost(id, req.user.id);
  }

  /**
   * Unlike a post
   */
  @Delete('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  async unlikePost(@Request() req, @Param('id') id: string) {
    return this.timelineService.unlikePost(id, req.user.id);
  }

  /**
   * Add a comment to a post
   */
  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.timelineService.addComment(id, req.user.id, body.content, body.parentId);
  }

  /**
   * Get comments for a post
   */
  @Get('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  async getComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getComments(id, parseInt(page || '1'), parseInt(limit || '20'));
  }

  /**
   * Update a post
   */
  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(@Request() req, @Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.timelineService.updatePost(id, req.user.id, dto);
  }

  /**
   * Delete a post
   */
  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  async deletePost(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'EDITOR';
    return this.timelineService.deletePost(id, req.user.id, isAdmin);
  }

  /**
   * Share a post (repost with optional comment)
   */
  @Post('posts/:id/share')
  @UseGuards(JwtAuthGuard)
  async sharePost(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: SharePostDto,
  ) {
    return this.timelineService.sharePost(req.user.id, id, dto);
  }

  /**
   * Get trending hashtags
   */
  @Get('hashtags/trending')
  @UseGuards(JwtAuthGuard)
  async getTrendingHashtags(@Query('limit') limit?: string) {
    return this.timelineService.getTrendingHashtags(parseInt(limit || '10'));
  }

  /**
   * Get posts by hashtag
   */
  @Get('hashtags/:tag')
  @UseGuards(JwtAuthGuard)
  async getPostsByHashtag(
    @Request() req,
    @Param('tag') tag: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getPostsByHashtag(
      tag,
      req.user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Search users for mention autocomplete
   */
  @Get('mentions/search')
  @UseGuards(JwtAuthGuard)
  async searchUsersForMention(@Query('q') query: string) {
    return this.timelineService.searchUsersForMention(query);
  }
}
