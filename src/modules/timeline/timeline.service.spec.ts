/**
 * Timeline Service Tests
 * Tests for timeline post CRUD operations and social features
 * Including sharing, hashtags, mentions, and WebSocket broadcasting
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TimelineService } from './timeline.service';
import { TimelineGateway } from './timeline.gateway';
import { PrismaService } from '../../database/prisma.service';
import { FeedService } from '../feed/feed.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TimelineService', () => {
  let service: TimelineService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    username: 'testuser',
    avatar: null,
  };

  const mockPost = {
    id: 'post-1',
    content: 'Test post content',
    isPublic: true,
    userId: 'user-1',
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    media: [],
    _count: { likes: 0, comments: 0 },
  };

  const mockTimelineGateway = {
    broadcastNewPost: jest.fn(),
    broadcastPostLike: jest.fn(),
    broadcastPostUnlike: jest.fn(),
    broadcastNewComment: jest.fn(),
    broadcastPostShare: jest.fn(),
  };

  const mockFeedService = {
    createActivity: jest.fn(),
  };

  const mockPrismaService = {
    timelinePost: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    postMedia: {
      createMany: jest.fn(),
    },
    postLike: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    postComment: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    postShare: {
      create: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    postHashtag: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    postMention: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    hashtag: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    userFollow: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TimelineGateway, useValue: mockTimelineGateway },
        { provide: FeedService, useValue: mockFeedService },
      ],
    }).compile();

    service = module.get<TimelineService>(TimelineService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a post without media', async () => {
      const dto = { content: 'Hello world!', isPublic: true };
      const createdPost = { ...mockPost, content: 'Hello world!' };
      mockPrismaService.timelinePost.create.mockResolvedValue(createdPost);
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(createdPost);
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-1', postsCount: 1 });
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);
      mockPrismaService.postShare.findUnique.mockResolvedValue(null);

      const result = await service.createPost('user-1', dto);

      expect(mockPrismaService.timelinePost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Hello world!',
            isPublic: true,
            userId: 'user-1',
          }),
        }),
      );
      // Result is formatted with isLiked field
      expect(result.id).toBe('post-1');
      expect(result.isLiked).toBe(false);
    });

    it('should create a post with media', async () => {
      const dto = {
        content: 'Check out this image!',
        isPublic: true,
        media: [{ type: 'IMAGE' as const, url: 'https://example.com/image.jpg' }],
      };
      const createdPost = { ...mockPost, id: 'post-2', content: 'Check out this image!' };
      mockPrismaService.timelinePost.create.mockResolvedValue(createdPost);
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(createdPost);
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-1', postsCount: 1 });
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);
      mockPrismaService.postShare.findUnique.mockResolvedValue(null);

      const result = await service.createPost('user-1', dto);

      // Media is created via nested create in Prisma, not createMany
      expect(mockPrismaService.timelinePost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Check out this image!',
            media: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({
                  type: 'IMAGE',
                  url: 'https://example.com/image.jpg',
                }),
              ]),
            }),
          }),
        }),
      );
      expect(result.id).toBe('post-2');
    });
  });

  describe('getPost', () => {
    it('should return a post by id', async () => {
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);

      const result = await service.getPost('post-1', 'user-2');

      expect(result).toBeDefined();
      expect(result.id).toBe('post-1');
    });

    it('should throw NotFoundException for non-existent post', async () => {
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(null);

      await expect(service.getPost('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should return private post (no access control on getPost)', async () => {
      // Note: getPost doesn't enforce privacy - that's handled at the feed level
      mockPrismaService.timelinePost.findUnique.mockResolvedValue({
        ...mockPost,
        isPublic: false,
        userId: 'other-user',
      });
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);

      const result = await service.getPost('post-1', 'user-1');
      expect(result.id).toBe('post-1');
    });
  });

  describe('likePost', () => {
    it('should like a post', async () => {
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.postLike.create.mockResolvedValue({ postId: 'post-1', userId: 'user-1' });
      mockPrismaService.timelinePost.update.mockResolvedValue({ ...mockPost, likesCount: 1 });

      const result = await service.likePost('post-1', 'user-1');

      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException for non-existent post', async () => {
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(null);

      await expect(service.likePost('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlikePost', () => {
    it('should unlike a post', async () => {
      mockPrismaService.postLike.findUnique.mockResolvedValue({ postId: 'post-1', userId: 'user-1' });
      mockPrismaService.postLike.delete.mockResolvedValue({ postId: 'post-1', userId: 'user-1' });
      mockPrismaService.timelinePost.update.mockResolvedValue({ ...mockPost, likesCount: 0 });

      const result = await service.unlikePost('post-1', 'user-1');

      expect(result).toEqual({ success: true });
    });

    it('should return success: false if not liked', async () => {
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);

      const result = await service.unlikePost('post-1', 'user-1');

      expect(result).toEqual({ success: false });
    });
  });

  describe('addComment', () => {
    it('should add a comment to a post', async () => {
      const mockComment = {
        id: 'comment-1',
        postId: 'post-1',
        userId: 'user-1',
        content: 'Great post!',
        createdAt: new Date(),
        user: mockUser,
      };
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.postComment.create.mockResolvedValue(mockComment);
      mockPrismaService.timelinePost.update.mockResolvedValue({ ...mockPost, commentsCount: 1 });
      mockPrismaService.$transaction.mockResolvedValue([mockComment, { ...mockPost, commentsCount: 1 }]);

      const result = await service.addComment('post-1', 'user-1', 'Great post!');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent post', async () => {
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(null);

      await expect(service.addComment('non-existent', 'user-1', 'Comment')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePost', () => {
    it('should delete a post owned by user', async () => {
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.timelinePost.delete.mockResolvedValue(mockPost);

      const result = await service.deletePost('post-1', 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockPrismaService.timelinePost.delete).toHaveBeenCalledWith({ where: { id: 'post-1' } });
    });

    it('should throw NotFoundException for non-existent post', async () => {
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(null);

      await expect(service.deletePost('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for post not owned by user', async () => {
      mockPrismaService.timelinePost.findUnique.mockResolvedValue({
        ...mockPost,
        userId: 'other-user',
      });

      await expect(service.deletePost('post-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserPosts', () => {
    it('should return user posts with pagination', async () => {
      mockPrismaService.timelinePost.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.timelinePost.count.mockResolvedValue(1);
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);

      const result = await service.getUserPosts('user-1', 'user-2', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('getFeedPosts', () => {
    it('should return feed posts from followed users', async () => {
      mockPrismaService.userFollow.findMany.mockResolvedValue([{ followingId: 'user-2' }]);
      mockPrismaService.timelinePost.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.timelinePost.count.mockResolvedValue(1);
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);

      const result = await service.getFeedPosts('user-1', 1, 20);

      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });
  });

  describe('getDiscoverPosts', () => {
    it('should return public posts for discover feed', async () => {
      mockPrismaService.timelinePost.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.timelinePost.count.mockResolvedValue(1);
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);

      const result = await service.getDiscoverPosts('user-1', 1, 20);

      expect(result.data).toBeDefined();
      expect(result.meta.total).toBe(1);
    });
  });

  describe('sharePost', () => {
    it('should share a post successfully', async () => {
      const sharedPost = {
        ...mockPost,
        id: 'post-2',
        originalPostId: 'post-1',
        shareComment: 'Check this out!',
      };
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.postShare.findUnique.mockResolvedValue(null);
      mockPrismaService.timelinePost.create.mockResolvedValue(sharedPost);
      mockPrismaService.postShare.upsert.mockResolvedValue({
        postId: 'post-1',
        userId: 'user-2',
      });
      mockPrismaService.timelinePost.update.mockResolvedValue({
        ...mockPost,
        sharesCount: 1,
      });

      const result = await service.sharePost('user-2', 'post-1', { comment: 'Check this out!' });

      expect(result).toBeDefined();
      expect(mockPrismaService.timelinePost.create).toHaveBeenCalled();
      expect(mockTimelineGateway.broadcastPostShare).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent post', async () => {
      mockPrismaService.timelinePost.findUnique.mockResolvedValue(null);

      await expect(service.sharePost('user-1', 'non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchUsersForMention', () => {
    it('should search users by name or username', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John Doe', username: 'johndoe', avatar: null },
        { id: 'user-2', name: 'Jane Doe', username: 'janedoe', avatar: null },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.searchUsersForMention('doe');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ username: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });

    it('should return empty array for short queries', async () => {
      const result = await service.searchUsersForMention('a');

      expect(result).toEqual([]);
      expect(mockPrismaService.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getTrendingHashtags', () => {
    it('should return trending hashtags', async () => {
      const mockHashtags = [
        { id: 'h1', tag: 'trending', postCount: 100 },
        { id: 'h2', tag: 'popular', postCount: 50 },
      ];
      mockPrismaService.hashtag.findMany.mockResolvedValue(mockHashtags);

      const result = await service.getTrendingHashtags(10);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.hashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { postCount: 'desc' },
          take: 10,
        }),
      );
    });
  });

  describe('getPostsByHashtag', () => {
    it('should return posts with a specific hashtag', async () => {
      const mockHashtag = { id: 'h1', tag: 'test', postCount: 5 };
      mockPrismaService.hashtag.findUnique.mockResolvedValue(mockHashtag);
      mockPrismaService.timelinePost.findMany.mockResolvedValue([mockPost]);
      mockPrismaService.timelinePost.count.mockResolvedValue(1);
      mockPrismaService.postLike.findUnique.mockResolvedValue(null);

      const result = await service.getPostsByHashtag('test', 'user-1', 1, 20);

      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it('should return empty result for non-existent hashtag', async () => {
      mockPrismaService.hashtag.findUnique.mockResolvedValue(null);

      const result = await service.getPostsByHashtag('nonexistent', 'user-1', 1, 20);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });
});

