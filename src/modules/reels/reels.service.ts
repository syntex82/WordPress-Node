/**
 * Reels Service
 * Business logic for short-form video content (TikTok/Instagram-style reels)
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReelDto, UpdateReelDto, CreateCommentDto, TrackViewDto } from './dto/create-reel.dto';

@Injectable()
export class ReelsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get reels feed with pagination
   */
  async getReels(page = 1, limit = 20, userId?: string, currentUserId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { isPublic: true };
    if (userId) {
      where.userId = userId;
    }

    const [reels, total] = await Promise.all([
      this.prisma.reel.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true, headline: true },
          },
          _count: { select: { likes: true, comments: true, views: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reel.count({ where }),
    ]);

    // Check if current user has liked each reel
    let reelsWithLikeStatus = reels;
    if (currentUserId) {
      const likedReels = await this.prisma.reelLike.findMany({
        where: { userId: currentUserId, reelId: { in: reels.map((r) => r.id) } },
        select: { reelId: true },
      });
      const likedReelIds = new Set(likedReels.map((l) => l.reelId));
      reelsWithLikeStatus = reels.map((reel) => ({
        ...reel,
        isLiked: likedReelIds.has(reel.id),
      }));
    }

    return {
      reels: reelsWithLikeStatus,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single reel by ID
   */
  async getReel(id: string, currentUserId?: string) {
    const reel = await this.prisma.reel.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true, headline: true } },
        hashtags: { include: { hashtag: true } },
        _count: { select: { likes: true, comments: true, views: true } },
      },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    let isLiked = false;
    if (currentUserId) {
      const like = await this.prisma.reelLike.findUnique({
        where: { reelId_userId: { reelId: id, userId: currentUserId } },
      });
      isLiked = !!like;
    }

    return { ...reel, isLiked };
  }

  /**
   * Create a new reel
   */
  async createReel(userId: string, dto: CreateReelDto) {
    const { hashtags, ...reelData } = dto;

    const reel = await this.prisma.reel.create({
      data: { ...reelData, userId, isPublic: dto.isPublic ?? true },
      include: {
        user: { select: { id: true, name: true, avatar: true, headline: true } },
      },
    });

    // Process hashtags
    if (hashtags && hashtags.length > 0) {
      await Promise.all(
        hashtags.map(async (tag) => {
          const normalizedTag = tag.toLowerCase().replace(/^#/, '');
          const hashtag = await this.prisma.hashtag.upsert({
            where: { tag: normalizedTag },
            create: { tag: normalizedTag, postCount: 1 },
            update: { postCount: { increment: 1 } },
          });
          return this.prisma.reelHashtag.create({
            data: { reelId: reel.id, hashtagId: hashtag.id },
          });
        }),
      );
    }

    return reel;
  }

  /**
   * Update a reel
   */
  async updateReel(id: string, userId: string, dto: UpdateReelDto) {
    const reel = await this.prisma.reel.findUnique({ where: { id }, select: { userId: true } });
    if (!reel) throw new NotFoundException('Reel not found');
    if (reel.userId !== userId) throw new ForbiddenException('Not authorized');

    return this.prisma.reel.update({
      where: { id },
      data: dto,
      include: { user: { select: { id: true, name: true, avatar: true, headline: true } } },
    });
  }

  /**
   * Delete a reel
   */
  async deleteReel(id: string, userId: string) {
    const reel = await this.prisma.reel.findUnique({ where: { id }, select: { userId: true } });
    if (!reel) throw new NotFoundException('Reel not found');
    if (reel.userId !== userId) throw new ForbiddenException('Not authorized');

    await this.prisma.reel.delete({ where: { id } });
    return { message: 'Reel deleted successfully' };
  }

  /**
   * Like a reel
   */
  async likeReel(reelId: string, userId: string) {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) throw new NotFoundException('Reel not found');

    const existing = await this.prisma.reelLike.findUnique({
      where: { reelId_userId: { reelId, userId } },
    });
    if (existing) return { message: 'Already liked' };

    await this.prisma.$transaction([
      this.prisma.reelLike.create({ data: { reelId, userId } }),
      this.prisma.reel.update({ where: { id: reelId }, data: { likesCount: { increment: 1 } } }),
    ]);
    return { message: 'Reel liked successfully' };
  }

  /**
   * Unlike a reel
   */
  async unlikeReel(reelId: string, userId: string) {
    const existing = await this.prisma.reelLike.findUnique({
      where: { reelId_userId: { reelId, userId } },
    });
    if (!existing) throw new NotFoundException('Like not found');

    await this.prisma.$transaction([
      this.prisma.reelLike.delete({ where: { reelId_userId: { reelId, userId } } }),
      this.prisma.reel.update({ where: { id: reelId }, data: { likesCount: { decrement: 1 } } }),
    ]);
    return { message: 'Reel unliked successfully' };
  }

  /**
   * Get comments for a reel
   */
  async getComments(reelId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.reelComment.findMany({
        where: { reelId, parentId: null },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          replies: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'asc' },
            take: 3,
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reelComment.count({ where: { reelId, parentId: null } }),
    ]);

    return { comments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Create a comment
   */
  async createComment(reelId: string, userId: string, dto: CreateCommentDto) {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) throw new NotFoundException('Reel not found');

    if (dto.parentId) {
      const parent = await this.prisma.reelComment.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.reelId !== reelId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.reelComment.create({
        data: { reelId, userId, content: dto.content, parentId: dto.parentId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.reel.update({ where: { id: reelId }, data: { commentsCount: { increment: 1 } } }),
    ]);

    return comment;
  }

  /**
   * Track a view
   */
  async trackView(reelId: string, userId: string | null, ipAddress: string, dto: TrackViewDto) {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) throw new NotFoundException('Reel not found');

    const existingView = await this.prisma.reelView.findFirst({
      where: userId ? { reelId, userId } : { reelId, ipAddress, userId: null },
    });

    if (existingView) {
      await this.prisma.reelView.update({
        where: { id: existingView.id },
        data: {
          watchTime: Math.max(existingView.watchTime, dto.watchTime),
          completed: existingView.completed || dto.completed || false,
        },
      });
    } else {
      await this.prisma.$transaction([
        this.prisma.reelView.create({
          data: {
            reelId,
            userId,
            ipAddress: userId ? null : ipAddress,
            watchTime: dto.watchTime,
            completed: dto.completed || false,
          },
        }),
        this.prisma.reel.update({ where: { id: reelId }, data: { viewsCount: { increment: 1 } } }),
      ]);
    }

    return { message: 'View tracked successfully' };
  }
}
