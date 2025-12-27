/**
 * Pages Service
 * Handles all page-related business logic
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreatePageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { PostStatus } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.page.create({
      data: {
        ...createPageDto,
        slug,
        authorId,
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
   */
  async findAll(page = 1, limit = 10, status?: PostStatus) {
    const skip = (page - 1) * limit;
    const where: any = {};

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
   */
  async findById(id: string) {
    const page = await this.prisma.page.findUnique({
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
   */
  async findBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({
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
