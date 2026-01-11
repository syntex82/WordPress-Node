/**
 * Posts Service
 * Handles all post-related business logic
 *
 * SECURITY: All queries filter by demoInstanceId to isolate demo data
 */

import { Injectable, NotFoundException, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../../database/prisma.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostStatus } from '@prisma/client';
import slugify from 'slugify';

interface DemoContext {
  isDemo: boolean;
  demoInstanceId: string | null;
}

@Injectable({ scope: Scope.REQUEST })
export class PostsService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * Get demo isolation filter for queries
   */
  private getDemoFilter(): { demoInstanceId: string | null } {
    const user = (this.request as any).user;
    if (user?.isDemo || user?.demoId) {
      return { demoInstanceId: user?.demoId || user?.demoInstanceId || null };
    }
    return { demoInstanceId: null };
  }

  /**
   * Generate unique slug from title
   */
  private async generateSlug(title: string, excludeId?: string): Promise<string> {
    const slug = slugify(title, { lower: true, strict: true });
    let counter = 1;
    let uniqueSlug = slug;

    while (true) {
      const existing = await this.prisma.post.findUnique({
        where: { slug: uniqueSlug },
      });

      if (!existing || existing.id === excludeId) {
        break;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  /**
   * Create a new post
   */
  async create(createPostDto: CreatePostDto, authorId: string) {
    const slug = await this.generateSlug(createPostDto.title);
    const demoFilter = this.getDemoFilter();

    return this.prisma.post.create({
      data: {
        ...createPostDto,
        slug,
        authorId,
        demoInstanceId: demoFilter.demoInstanceId,
        publishedAt: createPostDto.status === PostStatus.PUBLISHED ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find all posts with filters and pagination
   * SECURITY: Filtered by demoInstanceId to isolate demo data
   */
  async findAll(page = 1, limit = 10, status?: PostStatus, authorId?: string) {
    const skip = (page - 1) * limit;
    const demoFilter = this.getDemoFilter();
    const where: any = { ...demoFilter };

    if (status) {
      where.status = status;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find post by ID
   * SECURITY: Validates post belongs to current demo context
   */
  async findById(id: string) {
    const demoFilter = this.getDemoFilter();

    const post = await this.prisma.post.findFirst({
      where: { id, ...demoFilter },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  /**
   * Find post by slug
   * SECURITY: Validates post belongs to current demo context
   */
  async findBySlug(slug: string) {
    const demoFilter = this.getDemoFilter();

    const post = await this.prisma.post.findFirst({
      where: { slug, ...demoFilter },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  /**
   * Update post
   */
  async update(id: string, updatePostDto: UpdatePostDto) {
    const existingPost = await this.findById(id);

    const data: any = { ...updatePostDto };

    // Handle slug update - if slug is explicitly provided, validate uniqueness
    if (updatePostDto.slug && updatePostDto.slug !== existingPost.slug) {
      // Check if the new slug is already taken by another post
      const slugExists = await this.prisma.post.findFirst({
        where: {
          slug: updatePostDto.slug,
          id: { not: id },
        },
      });
      if (slugExists) {
        throw new Error(`Slug "${updatePostDto.slug}" is already in use`);
      }
      data.slug = updatePostDto.slug;
    } else if (
      updatePostDto.title &&
      updatePostDto.title !== existingPost.title &&
      !updatePostDto.slug
    ) {
      // Generate new slug only if title changed and no custom slug provided
      data.slug = await this.generateSlug(updatePostDto.title, id);
    } else {
      // Don't change slug if neither slug nor title changed
      delete data.slug;
    }

    // Set publishedAt when status changes to PUBLISHED
    if (updatePostDto.status === PostStatus.PUBLISHED) {
      const post = await this.prisma.post.findUnique({ where: { id } });
      if (post && !post.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    return this.prisma.post.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete post
   */
  async remove(id: string) {
    await this.findById(id);

    return this.prisma.post.delete({
      where: { id },
    });
  }
}
