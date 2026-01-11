/**
 * Users Service
 * Handles all user-related business logic
 *
 * SECURITY: All queries filter by demoInstanceId to isolate demo data
 */

import { Injectable, NotFoundException, ConflictException, ForbiddenException, Inject, Scope, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs/promises';
import * as path from 'path';

interface DemoContext {
  isDemo: boolean;
  demoInstanceId: string | null;
}

// Role hierarchy (highest to lowest privilege)
const ROLE_HIERARCHY: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.EDITOR,
  UserRole.AUTHOR,
  UserRole.INSTRUCTOR,
  UserRole.STUDENT,
  UserRole.USER,
  UserRole.VIEWER,
];

@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * Get current user from request
   */
  private getCurrentUser() {
    return (this.request as any).user;
  }

  /**
   * Check if user is in demo mode
   */
  private isDemo(): boolean {
    const user = this.getCurrentUser();
    const demoContext = (this.request as any).demoContext as DemoContext | undefined;
    return !!(user?.isDemo || user?.demoId || demoContext?.isDemo);
  }

  /**
   * Get role level (lower = more privileged)
   */
  private getRoleLevel(role: UserRole): number {
    const index = ROLE_HIERARCHY.indexOf(role);
    return index === -1 ? 999 : index;
  }

  /**
   * Check if role1 is higher or equal to role2
   */
  private isRoleHigherOrEqual(role1: UserRole, role2: UserRole): boolean {
    return this.getRoleLevel(role1) <= this.getRoleLevel(role2);
  }

  /**
   * Get demo isolation filter for queries
   * Demo users only see demo data, real users only see real data
   */
  private getDemoFilter(): { demoInstanceId: string | null } {
    const user = this.getCurrentUser();
    const demoContext = (this.request as any).demoContext as DemoContext | undefined;

    // Check if demo user
    if (user?.isDemo || user?.demoId || demoContext?.isDemo) {
      return { demoInstanceId: user?.demoId || demoContext?.demoInstanceId || null };
    }

    // Real user - only see non-demo data
    return { demoInstanceId: null };
  }

  /**
   * Create a new user
   * Note: Password should already be hashed by the caller (AuthService)
   */
  async create(createUserDto: CreateUserDto) {
    const demoFilter = this.getDemoFilter();

    const existingUser = await this.prisma.user.findFirst({
      where: { email: createUserDto.email, ...demoFilter },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        demoInstanceId: demoFilter.demoInstanceId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find all users with pagination
   * SECURITY:
   * - SUPER_ADMIN sees ALL users (real + demo)
   * - ADMIN sees all real users + demo users in their context
   * - Demo users only see demo data
   * - Non-SUPER_ADMIN users cannot see SUPER_ADMIN accounts
   */
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const currentUser = this.getCurrentUser();

    // SUPER_ADMIN sees all users, no demo filter
    // ADMIN and below get demo isolation
    const demoFilter = currentUser?.role === UserRole.SUPER_ADMIN
      ? {}
      : this.getDemoFilter();

    // Role-based visibility filter:
    // - SUPER_ADMIN can see all users
    // - Other users cannot see SUPER_ADMIN accounts
    const roleFilter = currentUser?.role === UserRole.SUPER_ADMIN
      ? {}
      : { role: { not: UserRole.SUPER_ADMIN } };

    const where = {
      ...demoFilter,
      ...roleFilter,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find user by ID
   * SECURITY:
   * - Validates user belongs to current demo context
   * - Non-SUPER_ADMIN users cannot view SUPER_ADMIN accounts
   */
  async findById(id: string) {
    const demoFilter = this.getDemoFilter();
    const currentUser = this.getCurrentUser();

    const user = await this.prisma.user.findFirst({
      where: { id, ...demoFilter },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // SECURITY: Non-SUPER_ADMIN users cannot view SUPER_ADMIN accounts
    if (user.role === UserRole.SUPER_ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to view this user');
    }

    return user;
  }

  /**
   * Find user by email (used for auth - no demo filter for login)
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user
   * SECURITY:
   * - Only updates users in current demo context
   * - Demo users cannot change roles
   * - Users cannot assign roles higher than their own (except SUPER_ADMIN)
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    const demoFilter = this.getDemoFilter();
    const currentUser = this.getCurrentUser();

    // Verify user exists and belongs to current context
    const targetUser = await this.prisma.user.findFirst({
      where: { id, ...demoFilter },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // SECURITY: Demo users cannot change roles
    if (updateUserDto.role && this.isDemo()) {
      throw new ForbiddenException({
        message: 'Changing user roles is not allowed in demo mode',
        code: 'DEMO_ROLE_CHANGE_BLOCKED',
        suggestion: 'Upgrade to a full license to manage user roles',
      });
    }

    // SECURITY: Users cannot modify users with higher roles (applies to any update)
    if (currentUser) {
      const currentUserRole = currentUser.role as UserRole;
      const targetUserRole = targetUser.role as UserRole;

      // Prevent modifying users with higher roles than yourself (except SUPER_ADMIN)
      if (currentUserRole !== UserRole.SUPER_ADMIN) {
        if (!this.isRoleHigherOrEqual(currentUserRole, targetUserRole)) {
          throw new ForbiddenException({
            message: `You cannot modify users with a higher role (${targetUserRole}) than your own (${currentUserRole})`,
            code: 'ROLE_HIERARCHY_VIOLATION',
          });
        }
      }
    }

    // SECURITY: Role elevation protection (only when changing roles)
    if (updateUserDto.role && currentUser) {
      const currentUserRole = currentUser.role as UserRole;
      const newRole = updateUserDto.role as UserRole;

      // Only SUPER_ADMIN can assign SUPER_ADMIN role
      if (newRole === UserRole.SUPER_ADMIN && currentUserRole !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException({
          message: 'Only Super Admins can assign the Super Admin role',
          code: 'ROLE_ELEVATION_BLOCKED',
        });
      }

      // Users cannot assign roles higher than their own (except SUPER_ADMIN who can do anything)
      if (currentUserRole !== UserRole.SUPER_ADMIN) {
        if (!this.isRoleHigherOrEqual(currentUserRole, newRole)) {
          throw new ForbiddenException({
            message: `You cannot assign a role (${newRole}) higher than your own role (${currentUserRole})`,
            code: 'ROLE_ELEVATION_BLOCKED',
          });
        }
      }
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete user with comprehensive cleanup
   * SECURITY: Only deletes users in current demo context
   * CRITICAL: Ensures all related data is properly cleaned up to prevent orphaned records
   */
  async remove(id: string) {
    const demoFilter = this.getDemoFilter();
    const currentUser = this.getCurrentUser();

    // Verify user exists and belongs to current context
    const user = await this.prisma.user.findFirst({
      where: { id, ...demoFilter },
      include: {
        Media: true, // Get all media files for cleanup
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // SECURITY: Cannot delete SUPER_ADMIN unless you are a SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN && currentUser?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can delete Super Admin accounts');
    }

    // SECURITY: Cannot delete yourself
    if (currentUser && currentUser.id === id) {
      throw new ForbiddenException('You cannot delete your own account through this endpoint');
    }

    this.logger.log(`Deleting user ${id} (${user.email}) and all related data...`);

    // Perform cascading delete in a transaction
    // Note: Most relations have onDelete: Cascade in Prisma schema,
    // but we explicitly handle some for clarity and file cleanup
    return this.prisma.$transaction(async (tx) => {
      // 1. Clean up media files from filesystem
      if (user.Media && user.Media.length > 0) {
        this.logger.log(`Cleaning up ${user.Media.length} media files for user ${id}`);
        for (const media of user.Media) {
          await this.deleteMediaFile(media.path);
          // Also try to delete WebP version if it exists
          if (media.path.match(/\.(jpg|jpeg|png|gif)$/i)) {
            const webpPath = media.path.replace(/\.[^.]+$/, '.webp');
            await this.deleteMediaFile(webpPath);
          }
        }
      }

      // 2. Clean up avatar file if it's a local file
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        await this.deleteMediaFile(user.avatar);
      }

      // 3. Clean up cover image if it's a local file
      if (user.coverImage && user.coverImage.startsWith('/uploads/')) {
        await this.deleteMediaFile(user.coverImage);
      }

      // 4. The following are handled by Prisma cascade deletes (onDelete: Cascade):
      // - Sessions, Activity, TimelinePost, PostLike, PostComment, PostShare
      // - PostMention, UserBadge, UserFollow, Enrollment, LessonProgress
      // - QuizAttempt, Certificate, Notification, PasswordHistory
      // - Group (owned), GroupMember, GroupMessage, DirectMessage
      // - Conversation, Media, Post, Page, Course (instructed)
      // - CustomTheme, Developer, Project, HiringRequest, Subscription
      // - DeveloperReview, MarketplacePluginRating, MarketplaceThemeRating
      // - UserInteraction, UserSubscription

      // 5. The following are set to NULL by Prisma (onDelete: SetNull):
      // - Backup (createdById), PageView (userId), RecommendationClick (userId)
      // - SecurityEvent (userId), UpdateHistory (initiatedBy)
      // - EmailLog (recipientId), EmailTemplate (createdById)
      // - MarketplacePlugin (approvedById, submittedById)
      // - MarketplaceTheme (approvedById, submittedById)

      // 6. Delete the user (cascades to all related data)
      const deletedUser = await tx.user.delete({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      this.logger.log(`Successfully deleted user ${id} (${deletedUser.email}) and all related data`);

      return {
        success: true,
        deletedUser,
        message: 'User and all related data deleted successfully',
      };
    });
  }

  /**
   * Helper method to safely delete a media file
   */
  private async deleteMediaFile(filePath: string): Promise<void> {
    try {
      // Convert URL path to filesystem path
      const relativePath = filePath.replace(/^\/uploads\//, '');
      const fullPath = path.join(this.uploadsDir, relativePath);

      await fs.unlink(fullPath);
      this.logger.debug(`Deleted file: ${fullPath}`);
    } catch (error: any) {
      // File might not exist or be inaccessible - log but don't fail
      if (error.code !== 'ENOENT') {
        this.logger.warn(`Failed to delete file ${filePath}: ${error.message}`);
      }
    }
  }
}
