/**
 * Timeline Service
 * Handles CRUD operations for timeline posts with media support
 * Includes sharing, hashtags, mentions, and social features
 * Integrates with Activity Feed for social visibility
 */

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TimelineGateway } from './timeline.gateway';
import { FeedService } from '../feed/feed.service';
import { ActivityType } from '@prisma/client';

export interface CreatePostDto {
  content?: string;
  isPublic?: boolean;
  media?: {
    type: 'IMAGE' | 'VIDEO' | 'GIF';
    url: string;
    thumbnail?: string;
    altText?: string;
    width?: number;
    height?: number;
    duration?: number;
  }[];
}

export interface SharePostDto {
  comment?: string;
  isPublic?: boolean;
}

export interface UpdatePostDto {
  content?: string;
  isPublic?: boolean;
}

@Injectable()
export class TimelineService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TimelineGateway))
    private timelineGateway: TimelineGateway,
    @Inject(forwardRef(() => FeedService))
    private feedService: FeedService,
  ) {}

  private readonly userSelect = {
    id: true,
    name: true,
    username: true,
    avatar: true,
    headline: true,
  };

  private readonly postInclude = {
    user: {
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        headline: true,
      },
    },
    media: {
      orderBy: { order: 'asc' as const },
    },
    hashtags: {
      include: {
        hashtag: true,
      },
    },
    mentions: {
      include: {
        mentionedUser: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    },
    originalPost: {
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
        media: {
          orderBy: { order: 'asc' as const },
        },
      },
    },
    _count: {
      select: {
        likes: true,
        comments: true,
        shares: true,
      },
    },
  };

  /**
   * Extract hashtags from content
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex) || [];
    return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
  }

  /**
   * Extract mentions from content
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex) || [];
    return [...new Set(matches.map((mention) => mention.slice(1).toLowerCase()))];
  }

  /**
   * Process hashtags - create if not exist, link to post
   */
  private async processHashtags(postId: string, hashtags: string[]) {
    for (const tag of hashtags) {
      // Upsert hashtag
      const hashtag = await this.prisma.hashtag.upsert({
        where: { tag },
        create: { tag, postCount: 1 },
        update: { postCount: { increment: 1 } },
      });

      // Create link between post and hashtag
      await this.prisma.postHashtag.create({
        data: { postId, hashtagId: hashtag.id },
      });
    }
  }

  /**
   * Process mentions - create mention records and notify users
   */
  private async processMentions(
    postId: string,
    mentionerUserId: string,
    usernames: string[],
  ) {
    for (const username of usernames) {
      const user = await this.prisma.user.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } },
      });

      if (user && user.id !== mentionerUserId) {
        await this.prisma.postMention.create({
          data: {
            postId,
            mentionedUserId: user.id,
            mentionerUserId,
          },
        });

        // Create notification for mentioned user
        await this.prisma.notification.create({
          data: {
            userId: user.id,
            type: 'MENTION',
            title: 'You were mentioned in a post',
            message: `Someone mentioned you in their post`,
            link: `/timeline?post=${postId}`,
          },
        });
      }
    }
  }

  /**
   * Create a new timeline post
   */
  async createPost(userId: string, dto: CreatePostDto) {
    // Must have content or media
    if (!dto.content?.trim() && (!dto.media || dto.media.length === 0)) {
      throw new BadRequestException('Post must have content or media');
    }

    const content = dto.content?.trim() || null;

    try {
      const post = await this.prisma.timelinePost.create({
        data: {
          userId,
          content,
          isPublic: dto.isPublic ?? true,
          media: dto.media?.length
            ? {
                create: dto.media.map((m, index) => ({
                  type: m.type,
                  url: m.url,
                  thumbnail: m.thumbnail,
                  altText: m.altText,
                  width: m.width,
                  height: m.height,
                  duration: m.duration,
                  order: index,
                })),
              }
            : undefined,
        },
        include: this.postInclude,
      });

      // Process hashtags and mentions
      if (content) {
        const hashtags = this.extractHashtags(content);
        const mentions = this.extractMentions(content);

        if (hashtags.length > 0) {
          await this.processHashtags(post.id, hashtags);
        }
        if (mentions.length > 0) {
          await this.processMentions(post.id, userId, mentions);
        }
      }

      // Update user's post count
      await this.prisma.user.update({
        where: { id: userId },
        data: { postsCount: { increment: 1 } },
      });

      // Refetch post with all relations
      const updatedPost = await this.prisma.timelinePost.findUnique({
        where: { id: post.id },
        include: this.postInclude,
      });

      const formattedPost = await this.formatPost(updatedPost, userId);

      // Create activity for the feed (so followers see the post in their activity feed)
      if (updatedPost?.isPublic) {
        const user = updatedPost.user;
        const previewContent = content
          ? content.length > 100 ? content.substring(0, 100) + '...' : content
          : 'shared a post';

        await this.feedService.createActivity({
          userId,
          type: ActivityType.STATUS_UPDATE,
          targetType: 'TimelinePost',
          targetId: post.id,
          title: `${user.name || user.username} shared an update`,
          description: previewContent,
          link: `/profile/${user.username}`,
          imageUrl: dto.media?.[0]?.url,
          isPublic: true,
          metadata: {
            postId: post.id,
            hasMedia: dto.media && dto.media.length > 0,
            mediaCount: dto.media?.length || 0,
          },
        });

        // Broadcast new post to all connected users
        this.timelineGateway.broadcastNewPost(formattedPost);
      }

      return formattedPost;
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw new BadRequestException(error.message || 'Failed to create post');
    }
  }

  /**
   * Share a post (repost with optional comment)
   */
  async sharePost(userId: string, originalPostId: string, dto: SharePostDto) {
    // Check original post exists
    const originalPost = await this.prisma.timelinePost.findUnique({
      where: { id: originalPostId },
    });

    if (!originalPost) {
      throw new NotFoundException('Original post not found');
    }

    // Create the share post
    const post = await this.prisma.timelinePost.create({
      data: {
        userId,
        content: null,
        shareComment: dto.comment?.trim() || null,
        originalPostId,
        isPublic: dto.isPublic ?? true,
      },
      include: this.postInclude,
    });

    // Create share record
    await this.prisma.postShare.create({
      data: { postId: originalPostId, userId },
    });

    // Update share count on original post
    await this.prisma.timelinePost.update({
      where: { id: originalPostId },
      data: { sharesCount: { increment: 1 } },
    });

    // Get user info for broadcast
    const sharedByUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.userSelect,
    });

    // Broadcast share update
    this.timelineGateway.broadcastPostShare(
      originalPostId,
      originalPost.sharesCount + 1,
      sharedByUser,
    );

    // Notify original post author
    if (originalPost.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: originalPost.userId,
          type: 'POST_SHARED',
          title: 'Your post was shared',
          message: 'Someone shared your post',
          link: `/timeline?post=${post.id}`,
        },
      });
    }

    const formattedPost = await this.formatPost(post, userId);

    // Broadcast new shared post
    if (post.isPublic) {
      this.timelineGateway.broadcastNewPost(formattedPost);
    }

    return formattedPost;
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string, currentUserId?: string) {
    const post = await this.prisma.timelinePost.findUnique({
      where: { id: postId },
      include: this.postInclude,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return await this.formatPost(post, currentUserId);
  }

  /**
   * Get posts for a user's timeline (their own posts)
   */
  async getUserPosts(userId: string, currentUserId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const isOwner = userId === currentUserId;

    const where = {
      userId,
      ...(isOwner ? {} : { isPublic: true }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.timelinePost.findMany({
        where,
        include: this.postInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.timelinePost.count({ where }),
    ]);

    return {
      data: await Promise.all(posts.map((p) => this.formatPost(p, currentUserId))),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total,
      },
    };
  }

  /**
   * Get feed posts from followed users
   */
  async getFeedPosts(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get user's following list
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    // Include own posts in feed
    followingIds.push(userId);

    const where = {
      userId: { in: followingIds },
      isPublic: true,
    };

    const [posts, total] = await Promise.all([
      this.prisma.timelinePost.findMany({
        where,
        include: this.postInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.timelinePost.count({ where }),
    ]);

    return {
      data: await Promise.all(posts.map((p) => this.formatPost(p, userId))),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total,
      },
    };
  }

  /**
   * Get discover feed (public posts from all users)
   */
  async getDiscoverPosts(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = { isPublic: true };

    const [posts, total] = await Promise.all([
      this.prisma.timelinePost.findMany({
        where,
        include: this.postInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.timelinePost.count({ where }),
    ]);

    return {
      data: await Promise.all(posts.map((p) => this.formatPost(p, userId))),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total,
      },
    };
  }

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string) {
    const post = await this.prisma.timelinePost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.$transaction([
      this.prisma.postLike.create({
        data: { postId, userId },
      }),
      this.prisma.timelinePost.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    // Get user info and broadcast
    const likedByUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.userSelect,
    });
    this.timelineGateway.broadcastPostLike(postId, post.likesCount + 1, likedByUser);

    // Notify post author if not self-like
    if (post.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'POST_LIKED',
          title: 'Your post was liked',
          message: 'Someone liked your post',
          link: `/timeline?post=${postId}`,
        },
      });
    }

    return { success: true };
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string) {
    const like = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (!like) return { success: false };

    const post = await this.prisma.timelinePost.findUnique({ where: { id: postId } });

    await this.prisma.$transaction([
      this.prisma.postLike.delete({
        where: { postId_userId: { postId, userId } },
      }),
      this.prisma.timelinePost.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    // Broadcast unlike
    if (post) {
      this.timelineGateway.broadcastPostUnlike(postId, Math.max(0, post.likesCount - 1));
    }

    return { success: true };
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, userId: string, content: string, parentId?: string) {
    const post = await this.prisma.timelinePost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const [comment] = await this.prisma.$transaction([
      this.prisma.postComment.create({
        data: { postId, userId, content, parentId },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatar: true },
          },
        },
      }),
      this.prisma.timelinePost.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      }),
    ]);

    // Broadcast new comment
    this.timelineGateway.broadcastNewComment(postId, comment, post.commentsCount + 1);

    // Process mentions in comment
    const mentions = this.extractMentions(content);
    if (mentions.length > 0) {
      for (const username of mentions) {
        const mentionedUser = await this.prisma.user.findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
        });

        if (mentionedUser && mentionedUser.id !== userId) {
          await this.prisma.postMention.create({
            data: {
              postId,
              commentId: comment.id,
              mentionedUserId: mentionedUser.id,
              mentionerUserId: userId,
            },
          });

          await this.prisma.notification.create({
            data: {
              userId: mentionedUser.id,
              type: 'MENTION',
              title: 'You were mentioned in a comment',
              message: 'Someone mentioned you in a comment',
              link: `/timeline?post=${postId}`,
            },
          });
        }
      }
    }

    // Notify post author if not self-comment
    if (post.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'POST_COMMENT',
          title: 'New comment on your post',
          message: 'Someone commented on your post',
          link: `/timeline?post=${postId}`,
        },
      });
    }

    return comment;
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where: { postId, parentId: null },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatar: true },
          },
          replies: {
            include: {
              user: {
                select: { id: true, name: true, username: true, avatar: true },
              },
            },
            orderBy: { createdAt: 'asc' },
            take: 3,
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.postComment.count({ where: { postId, parentId: null } }),
    ]);

    return {
      data: comments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.timelinePost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Not authorized');

    try {
      // Also decrement user's post count
      await this.prisma.$transaction([
        this.prisma.timelinePost.delete({ where: { id: postId } }),
        this.prisma.user.update({
          where: { id: userId },
          data: { postsCount: { decrement: 1 } },
        }),
      ]);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting post:', error);
      throw new BadRequestException(error.message || 'Failed to delete post');
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit = 10) {
    const hashtags = await this.prisma.hashtag.findMany({
      orderBy: { postCount: 'desc' },
      take: limit,
    });

    return hashtags.map((h) => ({
      id: h.id,
      tag: h.tag,
      postCount: h.postCount,
    }));
  }

  /**
   * Get posts by hashtag
   */
  async getPostsByHashtag(tag: string, currentUserId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const normalizedTag = tag.toLowerCase().replace('#', '');

    const hashtag = await this.prisma.hashtag.findUnique({
      where: { tag: normalizedTag },
    });

    if (!hashtag) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0, hasMore: false },
        hashtag: { tag: normalizedTag, postCount: 0 },
      };
    }

    const where = {
      hashtags: { some: { hashtagId: hashtag.id } },
      isPublic: true,
    };

    const [posts, total] = await Promise.all([
      this.prisma.timelinePost.findMany({
        where,
        include: this.postInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.timelinePost.count({ where }),
    ]);

    return {
      data: await Promise.all(posts.map((p) => this.formatPost(p, currentUserId))),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total,
      },
      hashtag: { tag: normalizedTag, postCount: hashtag.postCount },
    };
  }

  /**
   * Search users for mention autocomplete
   */
  async searchUsersForMention(query: string, limit = 10) {
    if (!query || query.length < 2) return [];

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: this.userSelect,
      take: limit,
    });

    return users;
  }

  /**
   * Format post for response with like status, shares, and original post
   */
  private async formatPost(post: any, currentUserId?: string) {
    let isLiked = false;
    let isShared = false;

    if (currentUserId) {
      const [like, share] = await Promise.all([
        this.prisma.postLike.findUnique({
          where: { postId_userId: { postId: post.id, userId: currentUserId } },
        }),
        post.originalPostId
          ? null
          : this.prisma.postShare.findUnique({
              where: { postId_userId: { postId: post.id, userId: currentUserId } },
            }),
      ]);
      isLiked = !!like;
      isShared = !!share;
    }

    // Format hashtags
    const hashtags = (post.hashtags || []).map((ph: any) => ({
      id: ph.hashtag.id,
      tag: ph.hashtag.tag,
    }));

    // Format mentions
    const mentions = (post.mentions || []).map((pm: any) => ({
      id: pm.mentionedUser.id,
      username: pm.mentionedUser.username,
      name: pm.mentionedUser.name,
      avatar: pm.mentionedUser.avatar,
    }));

    // Format original post if this is a share
    let originalPost = null;
    if (post.originalPost) {
      originalPost = {
        id: post.originalPost.id,
        content: post.originalPost.content,
        createdAt: post.originalPost.createdAt,
        user: post.originalPost.user,
        media: post.originalPost.media || [],
      };
    }

    return {
      id: post.id,
      content: post.content,
      shareComment: post.shareComment,
      isPublic: post.isPublic,
      likesCount: post._count?.likes ?? post.likesCount,
      commentsCount: post._count?.comments ?? post.commentsCount,
      sharesCount: post._count?.shares ?? post.sharesCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user,
      media: post.media || [],
      hashtags,
      mentions,
      originalPost,
      isLiked,
      isShared,
    };
  }
}
