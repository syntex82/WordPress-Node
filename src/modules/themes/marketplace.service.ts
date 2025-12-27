/**
 * Theme Marketplace Service
 * Handles marketplace operations: submit, browse, download, install, rate themes
 */

import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ThemesService } from './themes.service';
import { EmailService } from '../email/email.service';
import * as path from 'path';
import * as fs from 'fs/promises';

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

interface SubmitThemeFiles {
  themeFile: Express.Multer.File;
  thumbnailFile?: Express.Multer.File;
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
  private readonly logger = new Logger(MarketplaceService.name);
  private uploadsDir: string;
  private thumbnailsDir: string;

  constructor(
    private prisma: PrismaService,
    private themesService: ThemesService,
    private emailService: EmailService,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'marketplace');
    this.thumbnailsDir = path.join(process.cwd(), 'uploads', 'marketplace', 'thumbnails');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.thumbnailsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create marketplace uploads directory:', error);
    }
  }

  /**
   * Get all marketplace themes with filtering and pagination
   */
  async findAll(query: MarketplaceQuery) {
    const {
      category,
      search,
      status = 'approved',
      featured,
      sortBy = 'downloads',
      page = 1,
      limit = 20,
    } = query;

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
      case 'downloads':
        orderBy = { downloads: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      default:
        orderBy = { downloads: 'desc' };
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
        ratings: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
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
        ratings: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!theme) throw new NotFoundException('Theme not found');
    return theme;
  }

  /**
   * Submit a new theme to the marketplace
   */
  async submitTheme(dto: SubmitThemeDto, files: SubmitThemeFiles, userId: string) {
    const { themeFile, thumbnailFile } = files;

    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check for duplicate slug
    const existing = await this.prisma.marketplaceTheme.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Theme "${dto.name}" already exists in marketplace`);
    }

    // Validate the theme ZIP
    const validation = await this.themesService.validateTheme(themeFile);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid theme package',
        errors: validation.errors,
      });
    }

    // Save the theme file
    const fileName = `${slug}-${Date.now()}.zip`;
    const filePath = path.join(this.uploadsDir, fileName);
    await fs.writeFile(filePath, themeFile.buffer);

    // Get file size
    const stats = await fs.stat(filePath);

    // Handle thumbnail upload
    let thumbnailUrl = validation.themeConfig?.thumbnail || null;
    if (thumbnailFile) {
      const ext = path.extname(thumbnailFile.originalname) || '.jpg';
      const thumbnailName = `${slug}-${Date.now()}${ext}`;
      const thumbnailPath = path.join(this.thumbnailsDir, thumbnailName);
      await fs.writeFile(thumbnailPath, thumbnailFile.buffer);
      thumbnailUrl = `/uploads/marketplace/thumbnails/${thumbnailName}`;
    }

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
        thumbnailUrl,
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
    const theme = await this.prisma.marketplaceTheme.update({
      where: { id },
      data: { status: 'approved', approvedById: approverId, approvedAt: new Date() },
      include: { submittedBy: { select: { id: true, name: true, email: true } } },
    });

    // Send approval notification email
    await this.sendApprovalEmail(theme);

    return theme;
  }

  /**
   * Reject a theme (admin only)
   */
  async rejectTheme(id: string, approverId: string, reason: string) {
    const theme = await this.prisma.marketplaceTheme.update({
      where: { id },
      data: { status: 'rejected', approvedById: approverId, rejectionReason: reason },
      include: { submittedBy: { select: { id: true, name: true, email: true } } },
    });

    // Send rejection notification email
    await this.sendRejectionEmail(theme, reason);

    return theme;
  }

  /**
   * Bulk approve themes (admin only)
   */
  async bulkApprove(ids: string[], approverId: string) {
    const results = await Promise.allSettled(ids.map((id) => this.approveTheme(id, approverId)));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { succeeded, failed, total: ids.length };
  }

  /**
   * Bulk reject themes (admin only)
   */
  async bulkReject(ids: string[], approverId: string, reason: string) {
    const results = await Promise.allSettled(
      ids.map((id) => this.rejectTheme(id, approverId, reason)),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { succeeded, failed, total: ids.length };
  }

  /**
   * Bulk delete themes (admin only)
   */
  async bulkDelete(ids: string[]) {
    const results = await Promise.allSettled(ids.map((id) => this.deleteTheme(id)));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { succeeded, failed, total: ids.length };
  }

  /**
   * Send approval email notification
   */
  private async sendApprovalEmail(theme: any) {
    if (!theme.submittedBy?.email) return;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Theme Approved!</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            Hi ${theme.submittedBy.name || 'Developer'},
          </p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            Great news! Your theme <strong>"${theme.name}"</strong> has been approved and is now live on the marketplace!
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0;"><strong>Theme:</strong> ${theme.name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Version:</strong> ${theme.version}</p>
            <p style="margin: 0;"><strong>Category:</strong> ${theme.category}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Users can now discover, install, and rate your theme. Thank you for contributing to our marketplace!
          </p>
        </div>
      </div>
    `;

    try {
      await this.emailService.send({
        to: theme.submittedBy.email,
        toName: theme.submittedBy.name,
        subject: `🎉 Your theme "${theme.name}" has been approved!`,
        html,
        recipientId: theme.submittedBy.id,
        metadata: { type: 'theme_approved', themeId: theme.id },
      });
      this.logger.log(`Approval email sent to ${theme.submittedBy.email} for theme ${theme.name}`);
    } catch (error) {
      this.logger.error(`Failed to send approval email: ${error.message}`);
    }
  }

  /**
   * Send rejection email notification
   */
  private async sendRejectionEmail(theme: any, reason: string) {
    if (!theme.submittedBy?.email) return;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Theme Review Update</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            Hi ${theme.submittedBy.name || 'Developer'},
          </p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            We've reviewed your theme <strong>"${theme.name}"</strong> and unfortunately, it wasn't approved at this time.
          </p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fcd34d;">
            <p style="margin: 0 0 10px 0; color: #92400e;"><strong>Reason:</strong></p>
            <p style="margin: 0; color: #92400e;">${reason}</p>
          </div>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            Please review the feedback and feel free to submit an updated version addressing the issues mentioned.
          </p>
          <p style="color: #64748b; font-size: 14px;">
            If you have questions, please reach out to our support team.
          </p>
        </div>
      </div>
    `;

    try {
      await this.emailService.send({
        to: theme.submittedBy.email,
        toName: theme.submittedBy.name,
        subject: `Theme "${theme.name}" - Review Update`,
        html,
        recipientId: theme.submittedBy.id,
        metadata: { type: 'theme_rejected', themeId: theme.id },
      });
      this.logger.log(`Rejection email sent to ${theme.submittedBy.email} for theme ${theme.name}`);
    } catch (error) {
      this.logger.error(`Failed to send rejection email: ${error.message}`);
    }
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

    return {
      total,
      approved,
      pending,
      featured,
      totalDownloads: totalDownloads._sum.downloads || 0,
    };
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

    return categories.map((c) => ({ category: c.category, count: c._count.id }));
  }
}
