/**
 * Posts Service
 * Handles all post-related business logic
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostStatus } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.post.create({
      data: {
        ...createPostDto,
        slug,
        authorId,
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
   */
  async findAll(page = 1, limit = 10, status?: PostStatus, authorId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

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
   */
  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
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
   */
  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
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
    await this.findById(id);

    const data: any = { ...updatePostDto };

    // Generate new slug if title changed
    if (updatePostDto.title) {
      data.slug = await this.generateSlug(updatePostDto.title, id);
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
