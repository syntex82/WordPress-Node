/**
 * Feed Service
 * Handles activity feed operations including following feed, discover feed, and activity creation
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityType } from '@prisma/client';

export interface FeedQueryDto {
  page?: number;
  limit?: number;
  type?: ActivityType;
  userId?: string; // Filter by specific user
}

export interface CreateActivityDto {
  userId: string;
  type: ActivityType;
  targetType?: string;
  targetId?: string;
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  isPublic?: boolean;
}

export interface CreateTimelinePostDto {
  content: string;
  imageUrl?: string;
  isPublic?: boolean;
}

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new activity
   */
  async createActivity(dto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        targetType: dto.targetType,
        targetId: dto.targetId,
        title: dto.title,
        description: dto.description,
        link: dto.link,
        imageUrl: dto.imageUrl,
        metadata: dto.metadata,
        isPublic: dto.isPublic ?? true,
      },
    });
  }

  /**
   * Get following feed - activities from users the current user follows
   */
  async getFollowingFeed(userId: string, query: FeedQueryDto = {}) {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    // Get list of users the current user follows
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // Include own activities in the feed
    followingIds.push(userId);

    const where: any = {
      userId: { in: followingIds },
      isPublic: true,
    };
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              headline: true,
            },
          },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + activities.length < total,
      },
    };
  }

  /**
   * Get discover feed - trending/recommended content from all users
   */
  async getDiscoverFeed(userId: string, query: FeedQueryDto = {}) {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    // Get users the current user already follows to exclude from recommendations
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // Also exclude own activities

    const where: any = {
      userId: { notIn: followingIds },
      isPublic: true,
    };
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              headline: true,
              followersCount: true,
            },
          },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + activities.length < total,
      },
    };
  }

  /**
   * Get user's own activity feed
   */
  async getUserActivities(userId: string, query: FeedQueryDto = {}) {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + activities.length < total,
      },
    };
  }

  /**
   * Get trending users based on recent follower growth
   */
  async getTrendingUsers(userId: string, limit = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingFollows = await this.prisma.userFollow.groupBy({
      by: ['followingId'],
      where: {
        createdAt: { gte: sevenDaysAgo },
        followingId: { not: userId },
      },
      _count: { followingId: true },
      orderBy: { _count: { followingId: 'desc' } },
      take: limit * 2,
    });

    const userIds = trendingFollows.map((t) => t.followingId);

    const alreadyFollowing = await this.prisma.userFollow.findMany({
      where: {
        followerId: userId,
        followingId: { in: userIds },
      },
      select: { followingId: true },
    });
    const followingSet = new Set(alreadyFollowing.map((f) => f.followingId));

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds.filter((id) => !followingSet.has(id)) },
        isPublic: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        headline: true,
        followersCount: true,
      },
      take: limit,
    });

    return users;
  }

  /**
   * Create a timeline post (status update)
   */
  async createTimelinePost(userId: string, dto: CreateTimelinePostDto) {
    // Get user info for the activity
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true },
    });

    const activity = await this.prisma.activity.create({
      data: {
        userId,
        type: 'STATUS_UPDATE',
        targetType: 'timeline',
        title: dto.content.substring(0, 100) + (dto.content.length > 100 ? '...' : ''),
        description: dto.content,
        imageUrl: dto.imageUrl,
        link: `/profile/${user?.username || userId}`,
        isPublic: dto.isPublic ?? true,
        metadata: {
          fullContent: dto.content,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            headline: true,
          },
        },
      },
    });

    return activity;
  }

  /**
   * Delete an activity by ID
   */
  async deleteActivity(activityId: string, userId: string) {
    return this.prisma.activity.deleteMany({
      where: { id: activityId, userId },
    });
  }
}
