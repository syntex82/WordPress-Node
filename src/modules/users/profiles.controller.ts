/**
 * Profiles Controller
 * Handles profile viewing, editing, and social features
 */

import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProfilesService, UpdateProfileDto } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('api/profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  /**
   * Get my profile
   * GET /api/profiles/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req) {
    return this.profilesService.getMyProfile(req.user.id);
  }

  /**
   * Update my profile
   * PUT /api/profiles/me
   */
  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(@Request() req, @Body() data: UpdateProfileDto) {
    console.log('📝 Profile update request:', { userId: req.user.id, data });
    const result = await this.profilesService.updateProfile(req.user.id, data);
    console.log('✅ Profile updated:', { avatar: result.avatar, coverImage: result.coverImage });
    return result;
  }

  /**
   * Get my stats
   * GET /api/profiles/me/stats
   */
  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@Request() req) {
    return this.profilesService.getStats(req.user.id);
  }

  /**
   * Get my activity
   * GET /api/profiles/me/activity
   */
  @Get('me/activity')
  @UseGuards(JwtAuthGuard)
  async getMyActivity(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.profilesService.getActivity(
      req.user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get my followers
   * GET /api/profiles/me/followers
   */
  @Get('me/followers')
  @UseGuards(JwtAuthGuard)
  async getMyFollowers(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.profilesService.getFollowers(
      req.user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get my following
   * GET /api/profiles/me/following
   */
  @Get('me/following')
  @UseGuards(JwtAuthGuard)
  async getMyFollowing(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.profilesService.getFollowing(
      req.user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get suggested users to follow
   * GET /api/profiles/me/suggested
   */
  @Get('me/suggested')
  @UseGuards(JwtAuthGuard)
  async getSuggestedUsers(@Request() req, @Query('limit') limit?: string) {
    return this.profilesService.getSuggestedUsers(req.user.id, parseInt(limit || '10'));
  }

  /**
   * Search users
   * GET /api/profiles/search
   */
  @Get('search')
  async searchUsers(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.profilesService.searchUsers(
      query || '',
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get public profile by username or ID
   * GET /api/profiles/:identifier
   */
  @Get(':identifier')
  @UseGuards(OptionalJwtAuthGuard)
  async getPublicProfile(@Request() req, @Param('identifier') identifier: string) {
    const viewerId = req.user?.id;
    return this.profilesService.getPublicProfile(identifier, viewerId);
  }

  /**
   * Get user stats
   * GET /api/profiles/:identifier/stats
   */
  @Get(':identifier/stats')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserStats(@Request() req, @Param('identifier') identifier: string) {
    const viewerId = req.user?.id;
    const profile = await this.profilesService.getPublicProfile(identifier, viewerId);
    return this.profilesService.getStats(profile.id);
  }

  /**
   * Get user activity
   * GET /api/profiles/:identifier/activity
   */
  @Get(':identifier/activity')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserActivity(
    @Request() req,
    @Param('identifier') identifier: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const viewerId = req.user?.id;
    const profile = await this.profilesService.getPublicProfile(identifier, viewerId);
    return this.profilesService.getActivity(
      profile.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Check if following user
   * GET /api/profiles/:identifier/following-status
   */
  @Get(':identifier/following-status')
  @UseGuards(JwtAuthGuard)
  async getFollowingStatus(@Request() req, @Param('identifier') identifier: string) {
    const profile = await this.profilesService.getPublicProfile(identifier, req.user.id);
    return this.profilesService.isFollowing(req.user.id, profile.id);
  }

  /**
   * Follow a user
   * POST /api/profiles/:identifier/follow
   */
  @Post(':identifier/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(@Request() req, @Param('identifier') identifier: string) {
    const profile = await this.profilesService.getPublicProfile(identifier, req.user.id);
    return this.profilesService.followUser(req.user.id, profile.id);
  }

  /**
   * Unfollow a user
   * DELETE /api/profiles/:identifier/follow
   */
  @Delete(':identifier/follow')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(@Request() req, @Param('identifier') identifier: string) {
    const profile = await this.profilesService.getPublicProfile(identifier, req.user.id);
    return this.profilesService.unfollowUser(req.user.id, profile.id);
  }

  /**
   * Get user followers
   * GET /api/profiles/:identifier/followers
   */
  @Get(':identifier/followers')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserFollowers(
    @Request() req,
    @Param('identifier') identifier: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const viewerId = req.user?.id;
    const profile = await this.profilesService.getPublicProfile(identifier, viewerId);
    return this.profilesService.getFollowers(
      profile.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get user following
   * GET /api/profiles/:identifier/following
   */
  @Get(':identifier/following')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserFollowing(
    @Request() req,
    @Param('identifier') identifier: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const viewerId = req.user?.id;
    const profile = await this.profilesService.getPublicProfile(identifier, viewerId);
    return this.profilesService.getFollowing(
      profile.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get mutual connections with a user
   * GET /api/profiles/:identifier/mutual-connections
   */
  @Get(':identifier/mutual-connections')
  @UseGuards(JwtAuthGuard)
  async getMutualConnections(
    @Request() req,
    @Param('identifier') identifier: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const profile = await this.profilesService.getPublicProfile(identifier, req.user.id);
    return this.profilesService.getMutualConnections(
      req.user.id,
      profile.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Get mutual following with a user
   * GET /api/profiles/:identifier/mutual-following
   */
  @Get(':identifier/mutual-following')
  @UseGuards(JwtAuthGuard)
  async getMutualFollowing(
    @Request() req,
    @Param('identifier') identifier: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const profile = await this.profilesService.getPublicProfile(identifier, req.user.id);
    return this.profilesService.getMutualFollowing(
      req.user.id,
      profile.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  /**
   * Check mutual follow status
   * GET /api/profiles/:identifier/mutual-status
   */
  @Get(':identifier/mutual-status')
  @UseGuards(JwtAuthGuard)
  async getMutualStatus(@Request() req, @Param('identifier') identifier: string) {
    const profile = await this.profilesService.getPublicProfile(identifier, req.user.id);
    return this.profilesService.checkMutualFollow(req.user.id, profile.id);
  }
}
