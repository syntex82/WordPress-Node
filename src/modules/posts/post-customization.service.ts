/**
 * Post Customization Service
 * Handles CRUD operations for post-specific theme customizations
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePostCustomizationDto } from './dto/create-post-customization.dto';
import { UpdatePostCustomizationDto } from './dto/update-post-customization.dto';

@Injectable()
export class PostCustomizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all post customizations
   */
  async findAll() {
    return this.prisma.postCustomization.findMany({
      include: {
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get post customization by ID
   */
  async findById(id: string) {
    const customization = await this.prisma.postCustomization.findUnique({
      where: { id },
      include: {
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!customization) {
      throw new NotFoundException('Post customization not found');
    }

    return customization;
  }

  /**
   * Get customization by post ID
   */
  async findByPostId(postId: string) {
    return this.prisma.postCustomization.findUnique({
      where: { postId },
      include: {
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  /**
   * Create post customization
   */
  async create(dto: CreatePostCustomizationDto) {
    // Verify post exists
    const post = await this.prisma.post.findUnique({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    // Check if customization already exists
    const existing = await this.prisma.postCustomization.findUnique({
      where: { postId: dto.postId },
    });

    if (existing) {
      throw new BadRequestException('Customization already exists for this post');
    }

    return this.prisma.postCustomization.create({
      data: {
        postId: dto.postId,
        layout: dto.layout || 'default',
        showHeader: dto.showHeader ?? true,
        showFooter: dto.showFooter ?? true,
        showSidebar: dto.showSidebar ?? false,
        showAuthor: dto.showAuthor ?? true,
        showDate: dto.showDate ?? true,
        showCategory: dto.showCategory ?? true,
        showTags: dto.showTags ?? true,
        showRelatedPosts: dto.showRelatedPosts ?? true,
        relatedPostsCount: dto.relatedPostsCount || 3,
        customCSS: dto.customCSS,
        backgroundColor: dto.backgroundColor,
        textColor: dto.textColor,
        featuredImagePosition: dto.featuredImagePosition || 'top',
        customFields: dto.customFields,
      },
      include: {
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  /**
   * Update post customization
   */
  async update(id: string, dto: UpdatePostCustomizationDto) {
    await this.findById(id);

    return this.prisma.postCustomization.update({
      where: { id },
      data: {
        ...(dto.layout && { layout: dto.layout }),
        ...(dto.showHeader !== undefined && { showHeader: dto.showHeader }),
        ...(dto.showFooter !== undefined && { showFooter: dto.showFooter }),
        ...(dto.showSidebar !== undefined && { showSidebar: dto.showSidebar }),
        ...(dto.showAuthor !== undefined && { showAuthor: dto.showAuthor }),
        ...(dto.showDate !== undefined && { showDate: dto.showDate }),
        ...(dto.showCategory !== undefined && { showCategory: dto.showCategory }),
        ...(dto.showTags !== undefined && { showTags: dto.showTags }),
        ...(dto.showRelatedPosts !== undefined && { showRelatedPosts: dto.showRelatedPosts }),
        ...(dto.relatedPostsCount && { relatedPostsCount: dto.relatedPostsCount }),
        ...(dto.customCSS !== undefined && { customCSS: dto.customCSS }),
        ...(dto.backgroundColor && { backgroundColor: dto.backgroundColor }),
        ...(dto.textColor && { textColor: dto.textColor }),
        ...(dto.featuredImagePosition && { featuredImagePosition: dto.featuredImagePosition }),
        ...(dto.customFields && { customFields: dto.customFields }),
      },
      include: {
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  /**
   * Delete post customization
   */
  async delete(id: string) {
    await this.findById(id);

    return this.prisma.postCustomization.delete({
      where: { id },
    });
  }

  /**
   * Delete customization by post ID
   */
  async deleteByPostId(postId: string) {
    return this.prisma.postCustomization.deleteMany({
      where: { postId },
    });
  }
}

