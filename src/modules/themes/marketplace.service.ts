/**
 * Theme Marketplace Service
 * Handles marketplace operations: submit, browse, download, install, rate themes
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ThemesService } from './themes.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as AdmZip from 'adm-zip';

interface SubmitThemeDto {
  name: string;
  description: string;
  longDescription?: string;
  version: string;
  author: string;
  authorEmail?: string;
  authorUrl?: string;
  category: string;
  tags?: string[];
  features?: string[];
  demoUrl?: string;
  repositoryUrl?: string;
  licenseType?: string;
}

interface MarketplaceQuery {
  category?: string;
  search?: string;
  status?: string;
  featured?: boolean;
  sortBy?: 'downloads' | 'rating' | 'newest' | 'name';
  page?: number;
  limit?: number;
}

@Injectable()
export class MarketplaceService {
  private uploadsDir: string;

  constructor(
    private prisma: PrismaService,
    private themesService: ThemesService,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'marketplace');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create marketplace uploads directory:', error);
    }
  }

  /**
   * Get all marketplace themes with filtering and pagination
   */
  async findAll(query: MarketplaceQuery) {
    const { category, search, status = 'approved', featured, sortBy = 'downloads', page = 1, limit = 20 } = query;

    const where: any = {};
    
    // Only show approved themes to non-admins
    if (status) {
      where.status = status;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (featured !== undefined) {
      where.isFeatured = featured;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Sorting
    let orderBy: any = {};
    switch (sortBy) {
      case 'downloads': orderBy = { downloads: 'desc' }; break;
      case 'rating': orderBy = { rating: 'desc' }; break;
      case 'newest': orderBy = { createdAt: 'desc' }; break;
      case 'name': orderBy = { name: 'asc' }; break;
      default: orderBy = { downloads: 'desc' };
    }

    const [themes, total] = await Promise.all([
      this.prisma.marketplaceTheme.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          submittedBy: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.marketplaceTheme.count({ where }),
    ]);

    return {
      themes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get featured themes
   */
  async getFeatured(limit = 6) {
    return this.prisma.marketplaceTheme.findMany({
      where: { status: 'approved', isFeatured: true },
      orderBy: { featuredOrder: 'asc' },
      take: limit,
      include: { submittedBy: { select: { id: true, name: true, avatar: true } } },
    });
  }

  /**
   * Get theme by ID
   */
  async findById(id: string) {
    const theme = await this.prisma.marketplaceTheme.findUnique({
      where: { id },
      include: {
        submittedBy: { select: { id: true, name: true, avatar: true } },
        ratings: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!theme) throw new NotFoundException('Theme not found');
    return theme;
  }

  /**
   * Get theme by slug
   */
  async findBySlug(slug: string) {
    const theme = await this.prisma.marketplaceTheme.findUnique({
      where: { slug },
      include: {
        submittedBy: { select: { id: true, name: true, avatar: true } },
        ratings: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!theme) throw new NotFoundException('Theme not found');
    return theme;
  }

  /**
   * Submit a new theme to the marketplace
   */
  async submitTheme(dto: SubmitThemeDto, file: Express.Multer.File, userId: string) {
    // Generate slug from name
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check for duplicate slug
    const existing = await this.prisma.marketplaceTheme.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Theme "${dto.name}" already exists in marketplace`);
    }

    // Validate the theme ZIP
    const validation = await this.themesService.validateTheme(file);
    if (!validation.valid) {
      throw new BadRequestException({ message: 'Invalid theme package', errors: validation.errors });
    }

    // Save the theme file
    const fileName = `${slug}-${Date.now()}.zip`;
    const filePath = path.join(this.uploadsDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    // Get file size
    const stats = await fs.stat(filePath);

    // Create marketplace theme entry
    const theme = await this.prisma.marketplaceTheme.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        longDescription: dto.longDescription,
        version: dto.version,
        author: dto.author,
        authorEmail: dto.authorEmail,
        authorUrl: dto.authorUrl,
        category: dto.category || 'blog',
        tags: dto.tags || [],
        features: dto.features || [],
        demoUrl: dto.demoUrl,
        repositoryUrl: dto.repositoryUrl,
        licenseType: dto.licenseType || 'GPL-2.0',
        downloadUrl: `/uploads/marketplace/${fileName}`,
        thumbnailUrl: validation.themeConfig?.thumbnail || null,
        fileSize: stats.size,
        status: 'pending',
        submittedById: userId,
      },
      include: { submittedBy: { select: { id: true, name: true } } },
    });

    return theme;
  }

  /**
   * Download/Install a theme from the marketplace
   */
  async installTheme(id: string) {
    const theme = await this.findById(id);

    if (theme.status !== 'approved') {
      throw new BadRequestException('This theme is not approved for installation');
    }

    if (!theme.downloadUrl) {
      throw new BadRequestException('Theme package not available');
    }

    // Get the theme file
    const filePath = path.join(process.cwd(), theme.downloadUrl);
    const fileBuffer = await fs.readFile(filePath);

    // Create a mock file for the themes service
    const mockFile: Express.Multer.File = {
      buffer: fileBuffer,
      originalname: `${theme.slug}.zip`,
      fieldname: 'file',
      encoding: '7bit',
      mimetype: 'application/zip',
      size: fileBuffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    // Install using the existing themes service
    const installed = await this.themesService.uploadTheme(mockFile);

    // Increment download count
    await this.prisma.marketplaceTheme.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });

    return installed;
  }

  /**
   * Rate a theme
   */
  async rateTheme(themeId: string, userId: string, rating: number, review?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Upsert the rating
    const ratingRecord = await this.prisma.marketplaceThemeRating.upsert({
      where: { themeId_userId: { themeId, userId } },
      update: { rating, review },
      create: { themeId, userId, rating, review },
    });

    // Recalculate average rating
    const stats = await this.prisma.marketplaceThemeRating.aggregate({
      where: { themeId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.marketplaceTheme.update({
      where: { id: themeId },
      data: { rating: stats._avg.rating || 0, ratingCount: stats._count.rating },
    });

    return ratingRecord;
  }

  /**
   * Approve a theme (admin only)
   */
  async approveTheme(id: string, approverId: string) {
    return this.prisma.marketplaceTheme.update({
      where: { id },
      data: { status: 'approved', approvedById: approverId, approvedAt: new Date() },
    });
  }

  /**
   * Reject a theme (admin only)
   */
  async rejectTheme(id: string, approverId: string, reason: string) {
    return this.prisma.marketplaceTheme.update({
      where: { id },
      data: { status: 'rejected', approvedById: approverId, rejectionReason: reason },
    });
  }

  /**
   * Feature/Unfeature a theme (admin only)
   */
  async setFeatured(id: string, featured: boolean, order?: number) {
    return this.prisma.marketplaceTheme.update({
      where: { id },
      data: { isFeatured: featured, featuredOrder: order },
    });
  }

  /**
   * Delete a theme from marketplace
   */
  async deleteTheme(id: string) {
    const theme = await this.findById(id);

    // Delete the file if exists
    if (theme.downloadUrl) {
      try {
        const filePath = path.join(process.cwd(), theme.downloadUrl);
        await fs.unlink(filePath);
      } catch {}
    }

    return this.prisma.marketplaceTheme.delete({ where: { id } });
  }

  /**
   * Get marketplace statistics
   */
  async getStats() {
    const [total, approved, pending, featured, totalDownloads] = await Promise.all([
      this.prisma.marketplaceTheme.count(),
      this.prisma.marketplaceTheme.count({ where: { status: 'approved' } }),
      this.prisma.marketplaceTheme.count({ where: { status: 'pending' } }),
      this.prisma.marketplaceTheme.count({ where: { isFeatured: true } }),
      this.prisma.marketplaceTheme.aggregate({ _sum: { downloads: true } }),
    ]);

    return { total, approved, pending, featured, totalDownloads: totalDownloads._sum.downloads || 0 };
  }

  /**
   * Get categories with counts
   */
  async getCategories() {
    const categories = await this.prisma.marketplaceTheme.groupBy({
      by: ['category'],
      where: { status: 'approved' },
      _count: { id: true },
    });

    return categories.map(c => ({ category: c.category, count: c._count.id }));
  }
}

