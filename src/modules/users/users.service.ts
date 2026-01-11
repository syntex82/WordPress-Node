/**
 * Users Service
 * Handles all user-related business logic
 *
 * SECURITY: All queries filter by demoInstanceId to isolate demo data
 */

import { Injectable, NotFoundException, ConflictException, ForbiddenException, Inject, Scope } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

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
   * - Filtered by demoInstanceId to isolate demo data
   * - Non-SUPER_ADMIN users cannot see SUPER_ADMIN accounts
   */
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const demoFilter = this.getDemoFilter();
    const currentUser = this.getCurrentUser();

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
   * Delete user
   * SECURITY: Only deletes users in current demo context
   */
  async remove(id: string) {
    const demoFilter = this.getDemoFilter();

    // Verify user exists and belongs to current context
    const user = await this.prisma.user.findFirst({
      where: { id, ...demoFilter },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
