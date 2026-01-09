/**
 * Media Service
 * Handles file upload, storage, and media metadata management
 * Includes automatic WebP conversion and responsive image generation
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

// Dynamic import for sharp (optional dependency)
let sharp: any = null;
try {
  sharp = require('sharp');
} catch {
  console.warn(
    'Sharp not installed - image optimization disabled. Install with: npm install sharp',
  );
}

// Responsive image breakpoints
const RESPONSIVE_SIZES = [320, 640, 960, 1280, 1920];
const WEBP_QUALITY = 80;

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
   * Automatically generates WebP and responsive versions for images
   * Returns WebP URL for images (optimized) or original URL for other files
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

    // Extract image dimensions and generate optimized versions
    let width: number | undefined;
    let height: number | undefined;
    let webpGenerated = false;
    let webpFilename = '';

    const isImage = file.mimetype.startsWith('image/') && !file.mimetype.includes('svg');

    if (isImage && sharp) {
      try {
        // Get original dimensions
        const metadata = await sharp(file.buffer).metadata();
        width = metadata.width;
        height = metadata.height;

        // Generate WebP version
        webpFilename = filename.replace(/\.[^.]+$/, '.webp');
        const webpPath = path.join(this.uploadDir, webpFilename);
        await sharp(file.buffer).webp({ quality: WEBP_QUALITY }).toFile(webpPath);
        webpGenerated = true;
        this.logger.log(`🖼️ WebP generated: ${webpFilename}`);

        // Generate responsive sizes (only for images larger than the target)
        if (width && width > 640) {
          await this.generateResponsiveSizes(file.buffer, filename);
        }
      } catch (error) {
        this.logger.warn(`Image optimization failed: ${error.message}`);
      }
    }

    // Use WebP URL for images if generated, otherwise original
    const originalUrl = `/uploads/${filename}`;
    const url = webpGenerated ? `/uploads/${webpFilename}` : originalUrl;

    const media = await this.prisma.media.create({
      data: {
        filename,
        originalName: file.originalname,
        path: originalUrl, // Store original path in DB
        mimeType: webpGenerated ? 'image/webp' : file.mimetype,
        size: file.size,
        width,
        height,
        uploadedById: userId,
      },
    });

    // Return with optimized url field for frontend
    return {
      ...media,
      url, // Return WebP URL for images
      originalUrl, // Also provide original URL if needed
    };
  }

  /**
   * Generate responsive image sizes
   */
  private async generateResponsiveSizes(buffer: Buffer, originalFilename: string) {
    if (!sharp) return;

    const baseName = originalFilename.replace(/\.[^.]+$/, '');
    const responsiveDir = path.join(this.uploadDir, 'responsive');

    // Ensure responsive directory exists
    try {
      await fs.mkdir(responsiveDir, { recursive: true });
    } catch {
      // Directory exists
    }

    for (const size of RESPONSIVE_SIZES) {
      try {
        const resizedFilename = `${baseName}-${size}w.webp`;
        const resizedPath = path.join(responsiveDir, resizedFilename);

        await sharp(buffer)
          .resize(size, null, { withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(resizedPath);
      } catch (error) {
        // Skip sizes that fail (e.g., image smaller than target)
      }
    }
  }

  /**
   * Get optimized image path (WebP if available)
   */
  async getOptimizedPath(
    filename: string,
    width?: number,
  ): Promise<{ path: string; contentType: string }> {
    // Try responsive size first
    if (width && sharp) {
      const targetSize =
        RESPONSIVE_SIZES.find((s) => s >= width) || RESPONSIVE_SIZES[RESPONSIVE_SIZES.length - 1];
      const baseName = filename.replace(/\.[^.]+$/, '');
      const responsivePath = path.join(
        this.uploadDir,
        'responsive',
        `${baseName}-${targetSize}w.webp`,
      );

      if (fsSync.existsSync(responsivePath)) {
        return { path: responsivePath, contentType: 'image/webp' };
      }
    }

    // Try WebP version
    const webpFilename = filename.replace(/\.[^.]+$/, '.webp');
    const webpPath = path.join(this.uploadDir, webpFilename);

    if (fsSync.existsSync(webpPath)) {
      return { path: webpPath, contentType: 'image/webp' };
    }

    // Fall back to original
    const originalPath = path.join(this.uploadDir, filename);
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === '.png'
        ? 'image/png'
        : ext === '.gif'
          ? 'image/gif'
          : ext === '.svg'
            ? 'image/svg+xml'
            : 'image/jpeg';

    return { path: originalPath, contentType };
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

  /**
   * Generate srcset string for responsive images
   * Returns srcset attribute value for use in <img> tags
   */
  async generateSrcset(filename: string): Promise<string> {
    const baseName = filename.replace(/\.[^.]+$/, '');
    const responsiveDir = path.join(this.uploadDir, 'responsive');
    const srcsetParts: string[] = [];

    for (const size of RESPONSIVE_SIZES) {
      const responsiveFilename = `${baseName}-${size}w.webp`;
      const responsivePath = path.join(responsiveDir, responsiveFilename);

      if (fsSync.existsSync(responsivePath)) {
        srcsetParts.push(`/uploads/responsive/${responsiveFilename} ${size}w`);
      }
    }

    // If no responsive versions, return empty string
    if (srcsetParts.length === 0) {
      return '';
    }

    return srcsetParts.join(', ');
  }
}
