/**
 * Users Service
 * Handles all user-related business logic
 *
 * SECURITY: All queries filter by demoInstanceId to isolate demo data
 */

import { Injectable, NotFoundException, ConflictException, Inject, Scope } from '@nestjs/common';
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

@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * Get demo isolation filter for queries
   * Demo users only see demo data, real users only see real data
   */
  private getDemoFilter(): { demoInstanceId: string | null } {
    const user = (this.request as any).user;
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
   * SECURITY: Filtered by demoInstanceId to isolate demo data
   */
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const demoFilter = this.getDemoFilter();

    const where = {
      ...demoFilter,
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
   * SECURITY: Validates user belongs to current demo context
   */
  async findById(id: string) {
    const demoFilter = this.getDemoFilter();

    const user = await this.prisma.user.findFirst({
      where: { id, ...demoFilter },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
   * SECURITY: Only updates users in current demo context
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    const demoFilter = this.getDemoFilter();

    // Verify user exists and belongs to current context
    const user = await this.prisma.user.findFirst({
      where: { id, ...demoFilter },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
