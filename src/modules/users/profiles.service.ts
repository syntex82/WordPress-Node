/**
 * Profiles Service
 * Handles user profile management, follows, badges, and activity
 */

import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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
  constructor(private prisma: PrismaService) {}

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
   */
  async getPublicProfile(identifier: string) {
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
        badges: {
          orderBy: { earnedAt: 'desc' },
          select: {
            id: true,
            earnedAt: true,
            badge: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isPublic) {
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

    // Create follow relationship and update counts
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
    ]);

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

    // Get recent posts, enrollments, certificates
    const [posts, enrollments, certificates] = await Promise.all([
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
      ...enrollments.map((e) => ({
        type: e.completedAt ? 'course_completed' : 'course_enrolled',
        title: e.completedAt
          ? `Completed "${e.course.title}"`
          : `Enrolled in "${e.course.title}"`,
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
}

