/**
 * Media Service
 * Handles file upload, storage, and media metadata management
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
      this.logger.log(`📁 Upload directory ready: ${this.uploadDir}`);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`📁 Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Sanitize filename to prevent path traversal and special characters
   */
  private sanitizeFilename(filename: string): string {
    // Remove path separators and special characters
    return filename
      .replace(/[/\\:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 200); // Limit length
  }

  /**
   * Upload file and create media record
   */
  async upload(file: Express.Multer.File, userId: string) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Invalid file upload - no file data received');
    }

    const sanitizedName = this.sanitizeFilename(file.originalname);
    const filename = `${Date.now()}-${sanitizedName}`;
    const filepath = path.join(this.uploadDir, filename);

    try {
      await fs.writeFile(filepath, file.buffer);
      this.logger.log(`📤 File uploaded: ${filename} (${file.size} bytes)`);
    } catch (error) {
      this.logger.error(`Failed to write file: ${error.message}`);
      throw new BadRequestException('Failed to save file to disk');
    }

    // Extract image dimensions if it's an image (simplified)
    let width: number | undefined;
    let height: number | undefined;

    const url = `/uploads/${filename}`;

    const media = await this.prisma.media.create({
      data: {
        filename,
        originalName: file.originalname,
        path: url,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        uploadedById: userId,
      },
    });

    // Return with url field for frontend compatibility
    return {
      ...media,
      url,
    };
  }

  /**
   * Find all media with pagination - filtered by user unless admin viewing all
   */
  async findAll(page = 1, limit = 20, mimeType?: string, userId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Filter by user if userId provided
    if (userId) {
      where.uploadedById = userId;
    }

    if (mimeType) {
      where.mimeType = { contains: mimeType };
    }

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data: media,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get storage usage for a specific user
   */
  async getUserStorageStats(userId: string) {
    const stats = await this.prisma.media.aggregate({
      where: { uploadedById: userId },
      _sum: { size: true },
      _count: { id: true },
    });

    return {
      userId,
      totalSize: stats._sum.size || 0,
      fileCount: stats._count.id || 0,
    };
  }

  /**
   * Get storage usage for all users (admin only)
   */
  async getAllUsersStorageStats() {
    // Get all users with their media stats
    const usersWithMedia = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        Media: {
          select: {
            size: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate totals
    const userStats = usersWithMedia.map((user) => {
      const totalSize = user.Media.reduce((sum, media) => sum + media.size, 0);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        fileCount: user.Media.length,
        totalSize,
      };
    });

    // Filter to only users with media and sort by storage used
    const usersWithStorage = userStats
      .filter((u) => u.fileCount > 0)
      .sort((a, b) => b.totalSize - a.totalSize);

    // Calculate grand totals
    const grandTotal = usersWithStorage.reduce(
      (acc, user) => ({
        totalSize: acc.totalSize + user.totalSize,
        totalFiles: acc.totalFiles + user.fileCount,
      }),
      { totalSize: 0, totalFiles: 0 },
    );

    return {
      users: usersWithStorage,
      totals: {
        totalUsers: usersWithStorage.length,
        totalSize: grandTotal.totalSize,
        totalFiles: grandTotal.totalFiles,
      },
    };
  }

  /**
   * Find media by ID
   */
  async findById(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  /**
   * Update media metadata
   */
  async update(id: string, alt?: string, caption?: string) {
    await this.findById(id);

    return this.prisma.media.update({
      where: { id },
      data: { alt, caption },
    });
  }

  /**
   * Delete media
   */
  async remove(id: string) {
    const media = await this.findById(id);

    // Delete file from filesystem
    const filepath = path.join(process.cwd(), media.path);
    try {
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    return this.prisma.media.delete({
      where: { id },
    });
  }
}
