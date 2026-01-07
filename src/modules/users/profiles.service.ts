/**
 * Profiles Service
 * Handles user profile management, follows, badges, and activity
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface UpdateProfileDto {
  username?: string;
  name?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  about?: string;
  headline?: string;
  location?: string;
  website?: string;
  company?: string;
  jobTitle?: string;
  skills?: string[];
  interests?: string[];
  isPublic?: boolean;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
  };
}

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // Fields to select for public profile
  private publicProfileSelect = {
    id: true,
    username: true,
    name: true,
    avatar: true,
    coverImage: true,
    bio: true,
    about: true,
    headline: true,
    location: true,
    website: true,
    company: true,
    jobTitle: true,
    skills: true,
    interests: true,
    socialLinks: true,
    isPublic: true,
    followersCount: true,
    followingCount: true,
    postsCount: true,
    coursesCount: true,
    createdAt: true,
    role: true,
  };

  /**
   * Get public profile by username or ID
   * @param identifier - Username or user ID
   * @param viewerId - Optional ID of the viewing user (allows viewing own private profile)
   */
  async getPublicProfile(identifier: string, viewerId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { id: identifier }],
      },
      select: {
        ...this.publicProfileSelect,
        posts: {
          where: { status: 'PUBLISHED' },
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            featuredImage: true,
            createdAt: true,
          },
        },
        instructedCourses: {
          where: { status: 'PUBLISHED' },
          take: 4,
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            featuredImage: true,
            level: true,
            priceType: true,
            priceAmount: true,
          },
        },
        certificates: {
          take: 6,
          orderBy: { issuedAt: 'desc' },
          select: {
            id: true,
            issuedAt: true,
            course: {
              select: { title: true, slug: true },
            },
          },
        },
        UserBadge: {
          orderBy: { earnedAt: 'desc' },
          select: {
            id: true,
            earnedAt: true,
            Badge: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Allow viewing your own profile even if private
    const isOwnProfile = viewerId && user.id === viewerId;
    if (!user.isPublic && !isOwnProfile) {
      throw new ForbiddenException('This profile is private');
    }

    return user;
  }

  /**
   * Get own profile (for authenticated user)
   */
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...this.publicProfileSelect,
        email: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileDto) {
    // Check username uniqueness if being updated
    if (data.username) {
      const existing = await this.prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new ConflictException('Username is already taken');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: this.publicProfileSelect,
    });
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictException('You cannot follow yourself');
    }

    // Check if already following
    const existing = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      throw new ConflictException('Already following this user');
    }

    // Get both users for notification/activity
    const [follower, following] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: followerId },
        select: { name: true, username: true, avatar: true },
      }),
      this.prisma.user.findUnique({
        where: { id: followingId },
        select: { name: true, username: true },
      }),
    ]);

    // Create follow relationship, update counts, and create activity
    await this.prisma.$transaction([
      this.prisma.userFollow.create({
        data: { followerId, followingId },
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      }),
      // Create activity for the follower
      this.prisma.activity.create({
        data: {
          userId: followerId,
          type: 'STARTED_FOLLOWING',
          targetType: 'user',
          targetId: followingId,
          title: `Started following ${following?.name || 'a user'}`,
          link: `/profile/${following?.username || followingId}`,
          metadata: { followingId, followingName: following?.name },
        },
      }),
    ]);

    // Create notification for the followed user
    await this.notificationsService.create({
      userId: followingId,
      type: 'INFO',
      title: 'New Follower',
      message: `${follower?.name || 'Someone'} started following you`,
      link: `/profile/${follower?.username || followerId}`,
      icon: 'user-plus',
      iconColor: 'blue',
      metadata: { followerId, followerName: follower?.name, followerAvatar: follower?.avatar },
    });

    return { message: 'Successfully followed user' };
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string) {
    const existing = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Not following this user');
    }

    await this.prisma.$transaction([
      this.prisma.userFollow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { decrement: 1 } },
      }),
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Successfully unfollowed user' };
  }

  /**
   * Check if following
   */
  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    return { isFollowing: !!follow };
  }

  /**
   * Get followers list
   */
  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [followers, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              headline: true,
            },
          },
        },
      }),
      this.prisma.userFollow.count({ where: { followingId: userId } }),
    ]);

    return {
      data: followers.map((f) => ({ ...f.follower, followedAt: f.createdAt })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get following list
   */
  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [following, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              headline: true,
            },
          },
        },
      }),
      this.prisma.userFollow.count({ where: { followerId: userId } }),
    ]);

    return {
      data: following.map((f) => ({ ...f.following, followedAt: f.createdAt })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get user activity feed
   */
  async getActivity(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get recent posts, timeline posts, enrollments, certificates
    const [posts, timelinePosts, enrollments, certificates] = await Promise.all([
      this.prisma.post.findMany({
        where: { authorId: userId, status: 'PUBLISHED' },
        take: 10,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
        },
      }),
      this.prisma.timelinePost.findMany({
        where: { userId, isPublic: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          media: { select: { type: true }, take: 1 },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { userId },
        take: 10,
        orderBy: { enrolledAt: 'desc' },
        select: {
          id: true,
          enrolledAt: true,
          completedAt: true,
          course: { select: { title: true, slug: true } },
        },
      }),
      this.prisma.certificate.findMany({
        where: { userId },
        take: 10,
        orderBy: { issuedAt: 'desc' },
        select: {
          id: true,
          issuedAt: true,
          course: { select: { title: true, slug: true } },
        },
      }),
    ]);

    // Combine and sort by date
    const activities = [
      ...posts.map((p) => ({
        type: 'post_published',
        title: `Published "${p.title}"`,
        link: `/post/${p.slug}`,
        date: p.publishedAt,
      })),
      ...timelinePosts.map((tp) => {
        const hasMedia = tp.media && tp.media.length > 0;
        const mediaType = hasMedia ? tp.media[0].type : null;
        const contentPreview = tp.content
          ? tp.content.length > 50
            ? tp.content.substring(0, 50) + '...'
            : tp.content
          : mediaType === 'VIDEO'
            ? 'Shared a video'
            : hasMedia
              ? 'Shared a photo'
              : 'Shared an update';
        return {
          type: 'timeline_post',
          title: contentPreview,
          link: `/activity-feed`,
          date: tp.createdAt,
        };
      }),
      ...enrollments.map((e) => ({
        type: e.completedAt ? 'course_completed' : 'course_enrolled',
        title: e.completedAt ? `Completed "${e.course.title}"` : `Enrolled in "${e.course.title}"`,
        link: `/courses/${e.course.slug}`,
        date: e.completedAt || e.enrolledAt,
      })),
      ...certificates.map((c) => ({
        type: 'certificate_earned',
        title: `Earned certificate for "${c.course.title}"`,
        link: `/courses/${c.course.slug}`,
        date: c.issuedAt,
      })),
    ]
      .filter((a) => a.date !== null)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(skip, skip + limit);

    return { activities };
  }

  /**
   * Get user stats
   */
  async getStats(userId: string) {
    const [posts, courses, certificates, enrollments] = await Promise.all([
      this.prisma.post.count({ where: { authorId: userId, status: 'PUBLISHED' } }),
      this.prisma.course.count({ where: { instructorId: userId, status: 'PUBLISHED' } }),
      this.prisma.certificate.count({ where: { userId } }),
      this.prisma.enrollment.count({ where: { userId } }),
    ]);

    // Get completed courses
    const completedCourses = await this.prisma.enrollment.count({
      where: { userId, status: 'COMPLETED' },
    });

    return {
      postsPublished: posts,
      coursesCreated: courses,
      coursesEnrolled: enrollments,
      coursesCompleted: completedCourses,
      certificatesEarned: certificates,
    };
  }

  /**
   * Search users
   */
  async searchUsers(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          isPublic: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
            { headline: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          headline: true,
          followersCount: true,
        },
      }),
      this.prisma.user.count({
        where: {
          isPublic: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
            { headline: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get suggested users to follow based on interests, skills, and popular users
   */
  async getSuggestedUsers(userId: string, limit = 10) {
    // Get current user's interests and skills
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true, skills: true },
    });

    // Get users the current user already follows
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // Exclude self

    // Find users with similar interests/skills
    const suggestedUsers = await this.prisma.user.findMany({
      where: {
        id: { notIn: followingIds },
        isPublic: true,
        OR: [
          { interests: { hasSome: currentUser?.interests || [] } },
          { skills: { hasSome: currentUser?.skills || [] } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        headline: true,
        followersCount: true,
        interests: true,
        skills: true,
      },
      orderBy: { followersCount: 'desc' },
      take: limit,
    });

    // If not enough suggestions, fill with popular users
    if (suggestedUsers.length < limit) {
      const additionalUsers = await this.prisma.user.findMany({
        where: {
          id: { notIn: [...followingIds, ...suggestedUsers.map((u) => u.id)] },
          isPublic: true,
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          headline: true,
          followersCount: true,
          interests: true,
          skills: true,
        },
        orderBy: { followersCount: 'desc' },
        take: limit - suggestedUsers.length,
      });
      suggestedUsers.push(...additionalUsers);
    }

    // Calculate match score for each user
    return suggestedUsers
      .map((user) => {
        const sharedInterests = user.interests.filter((i) =>
          currentUser?.interests?.includes(i),
        ).length;
        const sharedSkills = user.skills.filter((s) => currentUser?.skills?.includes(s)).length;
        return {
          ...user,
          matchScore: sharedInterests + sharedSkills,
          sharedInterests,
          sharedSkills,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Get mutual connections (users who follow both users)
   */
  async getMutualConnections(userId: string, targetUserId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get followers of the current user
    const userFollowers = await this.prisma.userFollow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    const userFollowerIds = userFollowers.map((f) => f.followerId);

    // Get followers of the target user that are also followers of current user
    const [mutualFollows, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: {
          followingId: targetUserId,
          followerId: { in: userFollowerIds },
        },
        skip,
        take: limit,
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              headline: true,
            },
          },
        },
      }),
      this.prisma.userFollow.count({
        where: {
          followingId: targetUserId,
          followerId: { in: userFollowerIds },
        },
      }),
    ]);

    return {
      data: mutualFollows.map((f) => f.follower),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get mutual following (users that both users follow)
   */
  async getMutualFollowing(userId: string, targetUserId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get users the current user follows
    const userFollowing = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const userFollowingIds = userFollowing.map((f) => f.followingId);

    // Get users the target follows that current user also follows
    const [mutualFollows, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: {
          followerId: targetUserId,
          followingId: { in: userFollowingIds },
        },
        skip,
        take: limit,
        select: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              headline: true,
            },
          },
        },
      }),
      this.prisma.userFollow.count({
        where: {
          followerId: targetUserId,
          followingId: { in: userFollowingIds },
        },
      }),
    ]);

    return {
      data: mutualFollows.map((f) => f.following),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Check if users follow each other (mutual follow)
   */
  async checkMutualFollow(userId: string, targetUserId: string) {
    const [userFollowsTarget, targetFollowsUser] = await Promise.all([
      this.prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
      }),
      this.prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: targetUserId, followingId: userId } },
      }),
    ]);

    return {
      userFollowsTarget: !!userFollowsTarget,
      targetFollowsUser: !!targetFollowsUser,
      isMutual: !!userFollowsTarget && !!targetFollowsUser,
    };
  }
}
