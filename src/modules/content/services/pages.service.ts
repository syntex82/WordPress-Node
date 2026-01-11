/**
 * Pages Service
 * Handles all page-related business logic
 *
 * SECURITY: All queries filter by demoInstanceId to isolate demo data
 */

import { Injectable, NotFoundException, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../../database/prisma.service';
import { CreatePageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { PostStatus } from '@prisma/client';
import slugify from 'slugify';

@Injectable({ scope: Scope.REQUEST })
export class PagesService {
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
      const existing = await this.prisma.page.findUnique({
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
   * Create a new page
   */
  async create(createPageDto: CreatePageDto, authorId: string) {
    const slug = await this.generateSlug(createPageDto.title);
    const demoFilter = this.getDemoFilter();

    return this.prisma.page.create({
      data: {
        ...createPageDto,
        slug,
        authorId,
        demoInstanceId: demoFilter.demoInstanceId,
        publishedAt: createPageDto.status === PostStatus.PUBLISHED ? new Date() : null,
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
   * Find all pages with filters and pagination
   * SECURITY: Filtered by demoInstanceId to isolate demo data
   */
  async findAll(page = 1, limit = 10, status?: PostStatus) {
    const skip = (page - 1) * limit;
    const demoFilter = this.getDemoFilter();
    const where: any = { ...demoFilter };

    if (status) {
      where.status = status;
    }

    const [pages, total] = await Promise.all([
      this.prisma.page.findMany({
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
          parent: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.page.count({ where }),
    ]);

    return {
      data: pages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find page by ID
   * SECURITY: Validates page belongs to current demo context
   */
  async findById(id: string) {
    const demoFilter = this.getDemoFilter();

    const page = await this.prisma.page.findFirst({
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
        parent: true,
        children: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  /**
   * Find page by slug
   * SECURITY: Validates page belongs to current demo context
   */
  async findBySlug(slug: string) {
    const demoFilter = this.getDemoFilter();

    const page = await this.prisma.page.findFirst({
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

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  /**
   * Update page
   */
  async update(id: string, updatePageDto: UpdatePageDto) {
    const existingPage = await this.findById(id);

    const data: any = { ...updatePageDto };

    // Handle slug update - if slug is explicitly provided, validate uniqueness
    if (updatePageDto.slug && updatePageDto.slug !== existingPage.slug) {
      // Check if the new slug is already taken by another page
      const slugExists = await this.prisma.page.findFirst({
        where: {
          slug: updatePageDto.slug,
          id: { not: id },
        },
      });
      if (slugExists) {
        throw new Error(`Slug "${updatePageDto.slug}" is already in use`);
      }
      data.slug = updatePageDto.slug;
    } else if (
      updatePageDto.title &&
      updatePageDto.title !== existingPage.title &&
      !updatePageDto.slug
    ) {
      // Generate new slug only if title changed and no custom slug provided
      data.slug = await this.generateSlug(updatePageDto.title, id);
    } else {
      // Don't change slug if neither slug nor title changed
      delete data.slug;
    }

    if (updatePageDto.status === PostStatus.PUBLISHED) {
      const page = await this.prisma.page.findUnique({ where: { id } });
      if (page && !page.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    return this.prisma.page.update({
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
   * Delete page
   */
  async remove(id: string) {
    await this.findById(id);

    return this.prisma.page.delete({
      where: { id },
    });
  }
}
