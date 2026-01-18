/**
 * Plugin Marketplace Service
 * Handles marketplace operations: submit, browse, download, install, rate plugins
 */

import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PluginsService } from './plugins.service';
import { EmailService } from '../email/email.service';
import * as path from 'path';
import * as fs from 'fs/promises';

interface SubmitPluginDto {
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
  repositoryUrl?: string;
  licenseType?: string;
}

interface SubmitPluginFiles {
  pluginFile: Express.Multer.File;
  iconFile?: Express.Multer.File;
}

interface MarketplaceQuery {
  category?: string;
  search?: string;
  status?: string;
  featured?: boolean;
  sortBy?: 'downloads' | 'rating' | 'newest' | 'name' | 'activeInstalls';
  page?: number;
  limit?: number;
}

@Injectable()
export class PluginMarketplaceService {
  private readonly logger = new Logger(PluginMarketplaceService.name);
  private uploadsDir: string;
  private iconsDir: string;

  constructor(
    private prisma: PrismaService,
    private pluginsService: PluginsService,
    private emailService: EmailService,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'plugin-marketplace');
    this.iconsDir = path.join(process.cwd(), 'uploads', 'plugin-marketplace', 'icons');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.iconsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create plugin marketplace uploads directory:', error);
    }
  }

  /**
   * Validate that a file path is within the uploads directory (prevent path traversal)
   */
  private validatePath(filePath: string, baseDir: string): string {
    const base = path.resolve(baseDir);
    const resolved = path.resolve(baseDir, filePath);

    if (!resolved.startsWith(base)) {
      throw new Error('Invalid file path: path traversal detected');
    }

    return resolved;
  }

  /**
   * Get all marketplace plugins with filtering and pagination
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

    let orderBy: any = {};
    switch (sortBy) {
      case 'downloads':
        orderBy = { downloads: 'desc' };
        break;
      case 'activeInstalls':
        orderBy = { activeInstalls: 'desc' };
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

    const [plugins, total] = await Promise.all([
      this.prisma.marketplacePlugin.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          submittedBy: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.marketplacePlugin.count({ where }),
    ]);

    return {
      plugins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get featured plugins
   */
  async getFeatured(limit = 6) {
    return this.prisma.marketplacePlugin.findMany({
      where: { status: 'approved', isFeatured: true },
      orderBy: { featuredOrder: 'asc' },
      take: limit,
      include: { submittedBy: { select: { id: true, name: true, avatar: true } } },
    });
  }

  /**
   * Get plugin by ID
   */
  async findById(id: string) {
    const plugin = await this.prisma.marketplacePlugin.findUnique({
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
    if (!plugin) throw new NotFoundException('Plugin not found');
    return plugin;
  }

  /**
   * Get plugin by slug
   */
  async findBySlug(slug: string) {
    const plugin = await this.prisma.marketplacePlugin.findUnique({
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
    if (!plugin) throw new NotFoundException('Plugin not found');
    return plugin;
  }

  /**
   * Submit a new plugin to the marketplace
   */
  async submitPlugin(dto: SubmitPluginDto, files: SubmitPluginFiles, userId: string) {
    const { pluginFile, iconFile } = files;

    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await this.prisma.marketplacePlugin.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Plugin "${dto.name}" already exists in marketplace`);
    }

    const validation = await this.pluginsService.validatePlugin(pluginFile);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid plugin package',
        errors: validation.errors,
      });
    }

    const fileName = `${slug}-${Date.now()}.zip`;
    // Validate path to prevent traversal
    const filePath = this.validatePath(fileName, this.uploadsDir);
    await fs.writeFile(filePath, pluginFile.buffer);

    const stats = await fs.stat(filePath);

    let iconUrl = validation.pluginConfig?.icon || null;
    if (iconFile) {
      const ext = path.extname(iconFile.originalname) || '.png';
      const iconName = `${slug}-${Date.now()}${ext}`;
      // Validate path to prevent traversal
      const iconPath = this.validatePath(iconName, this.iconsDir);
      await fs.writeFile(iconPath, iconFile.buffer);
      iconUrl = `/uploads/plugin-marketplace/icons/${iconName}`;
    }

    const plugin = await this.prisma.marketplacePlugin.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        longDescription: dto.longDescription,
        version: dto.version,
        author: dto.author,
        authorEmail: dto.authorEmail,
        authorUrl: dto.authorUrl,
        category: dto.category || 'utility',
        tags: dto.tags || [],
        features: dto.features || [],
        repositoryUrl: dto.repositoryUrl,
        licenseType: dto.licenseType || 'MIT',
        downloadUrl: `/uploads/plugin-marketplace/${fileName}`,
        iconUrl,
        fileSize: stats.size,
        status: 'pending',
        submittedById: userId,
      },
      include: { submittedBy: { select: { id: true, name: true } } },
    });

    return plugin;
  }

  /**
   * Install a plugin from the marketplace
   */
  async installPlugin(id: string) {
    const plugin = await this.findById(id);

    if (plugin.status !== 'approved') {
      throw new BadRequestException('This plugin is not approved for installation');
    }

    if (!plugin.downloadUrl) {
      throw new BadRequestException('Plugin package not available');
    }

    const filePath = path.join(process.cwd(), plugin.downloadUrl);
    const fileBuffer = await fs.readFile(filePath);

    const mockFile: Express.Multer.File = {
      buffer: fileBuffer,
      originalname: `${plugin.slug}.zip`,
      fieldname: 'file',
      encoding: '7bit',
      mimetype: 'application/zip',
      size: fileBuffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const installed = await this.pluginsService.uploadPlugin(mockFile);

    await this.prisma.marketplacePlugin.update({
      where: { id },
      data: {
        downloads: { increment: 1 },
        activeInstalls: { increment: 1 },
      },
    });

    return installed;
  }

  /**
   * Rate a plugin
   */
  async ratePlugin(pluginId: string, userId: string, rating: number, review?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const ratingRecord = await this.prisma.marketplacePluginRating.upsert({
      where: { pluginId_userId: { pluginId, userId } },
      update: { rating, review },
      create: { pluginId, userId, rating, review },
    });

    const stats = await this.prisma.marketplacePluginRating.aggregate({
      where: { pluginId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.marketplacePlugin.update({
      where: { id: pluginId },
      data: { rating: stats._avg.rating || 0, ratingCount: stats._count.rating },
    });

    return ratingRecord;
  }

  /**
   * Approve a plugin (admin only)
   */
  async approvePlugin(id: string, approverId: string) {
    const plugin = await this.prisma.marketplacePlugin.update({
      where: { id },
      data: { status: 'approved', approvedById: approverId, approvedAt: new Date() },
      include: { submittedBy: { select: { id: true, name: true, email: true } } },
    });

    await this.sendApprovalEmail(plugin);
    return plugin;
  }

  /**
   * Reject a plugin (admin only)
   */
  async rejectPlugin(id: string, approverId: string, reason: string) {
    const plugin = await this.prisma.marketplacePlugin.update({
      where: { id },
      data: { status: 'rejected', approvedById: approverId, rejectionReason: reason },
      include: { submittedBy: { select: { id: true, name: true, email: true } } },
    });

    await this.sendRejectionEmail(plugin, reason);
    return plugin;
  }

  /**
   * Bulk approve plugins (admin only)
   */
  async bulkApprove(ids: string[], approverId: string) {
    const results = await Promise.allSettled(ids.map((id) => this.approvePlugin(id, approverId)));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { succeeded, failed, total: ids.length };
  }

  /**
   * Bulk reject plugins (admin only)
   */
  async bulkReject(ids: string[], approverId: string, reason: string) {
    const results = await Promise.allSettled(
      ids.map((id) => this.rejectPlugin(id, approverId, reason)),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { succeeded, failed, total: ids.length };
  }

  /**
   * Bulk delete plugins (admin only)
   */
  async bulkDelete(ids: string[]) {
    const results = await Promise.allSettled(ids.map((id) => this.deletePlugin(id)));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { succeeded, failed, total: ids.length };
  }

  /**
   * Feature/Unfeature a plugin (admin only)
   */
  async setFeatured(id: string, featured: boolean, order?: number) {
    return this.prisma.marketplacePlugin.update({
      where: { id },
      data: { isFeatured: featured, featuredOrder: order },
    });
  }

  /**
   * Delete a plugin from marketplace
   */
  async deletePlugin(id: string) {
    const plugin = await this.findById(id);

    if (plugin.downloadUrl) {
      try {
        const filePath = path.join(process.cwd(), plugin.downloadUrl);
        await fs.unlink(filePath);
      } catch {}
    }

    return this.prisma.marketplacePlugin.delete({ where: { id } });
  }

  /**
   * Get marketplace statistics
   */
  async getStats() {
    const [total, approved, pending, featured, totalDownloads, totalActiveInstalls] =
      await Promise.all([
        this.prisma.marketplacePlugin.count(),
        this.prisma.marketplacePlugin.count({ where: { status: 'approved' } }),
        this.prisma.marketplacePlugin.count({ where: { status: 'pending' } }),
        this.prisma.marketplacePlugin.count({ where: { isFeatured: true } }),
        this.prisma.marketplacePlugin.aggregate({ _sum: { downloads: true } }),
        this.prisma.marketplacePlugin.aggregate({ _sum: { activeInstalls: true } }),
      ]);

    return {
      total,
      approved,
      pending,
      featured,
      totalDownloads: totalDownloads._sum.downloads || 0,
      totalActiveInstalls: totalActiveInstalls._sum.activeInstalls || 0,
    };
  }

  /**
   * Get categories with counts
   */
  async getCategories() {
    const categories = await this.prisma.marketplacePlugin.groupBy({
      by: ['category'],
      where: { status: 'approved' },
      _count: { id: true },
    });

    return categories.map((c) => ({ category: c.category, count: c._count.id }));
  }

  private async sendApprovalEmail(plugin: any) {
    if (!plugin.submittedBy?.email) return;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Plugin Approved!</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            Hi ${plugin.submittedBy.name || 'Developer'},
          </p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            Great news! Your plugin <strong>"${plugin.name}"</strong> has been approved and is now live on the marketplace!
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0;"><strong>Plugin:</strong> ${plugin.name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Version:</strong> ${plugin.version}</p>
            <p style="margin: 0;"><strong>Category:</strong> ${plugin.category}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Users can now discover, install, and rate your plugin. Thank you for contributing to our marketplace!
          </p>
        </div>
      </div>
    `;

    try {
      await this.emailService.send({
        to: plugin.submittedBy.email,
        toName: plugin.submittedBy.name,
        subject: `🎉 Your plugin "${plugin.name}" has been approved!`,
        html,
        recipientId: plugin.submittedBy.id,
        metadata: { type: 'plugin_approved', pluginId: plugin.id },
      });
      this.logger.log(
        `Approval email sent to ${plugin.submittedBy.email} for plugin ${plugin.name}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send approval email: ${error.message}`);
    }
  }

  private async sendRejectionEmail(plugin: any, reason: string) {
    if (!plugin.submittedBy?.email) return;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Plugin Review Update</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            Hi ${plugin.submittedBy.name || 'Developer'},
          </p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            We've reviewed your plugin <strong>"${plugin.name}"</strong> and unfortunately, it wasn't approved at this time.
          </p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fcd34d;">
            <p style="margin: 0 0 10px 0; color: #92400e;"><strong>Reason:</strong></p>
            <p style="margin: 0; color: #92400e;">${reason}</p>
          </div>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            Please review the feedback and feel free to submit an updated version addressing the issues mentioned.
          </p>
        </div>
      </div>
    `;

    try {
      await this.emailService.send({
        to: plugin.submittedBy.email,
        toName: plugin.submittedBy.name,
        subject: `Plugin "${plugin.name}" - Review Update`,
        html,
        recipientId: plugin.submittedBy.id,
        metadata: { type: 'plugin_rejected', pluginId: plugin.id },
      });
      this.logger.log(
        `Rejection email sent to ${plugin.submittedBy.email} for plugin ${plugin.name}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send rejection email: ${error.message}`);
    }
  }
}
