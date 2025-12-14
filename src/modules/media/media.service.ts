/**
 * Media Service
 * Handles file upload, storage, and media metadata management
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MediaService {
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
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload file and create media record
   */
  async upload(file: Express.Multer.File, userId: string) {
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(this.uploadDir, filename);

    await fs.writeFile(filepath, file.buffer);

    // Extract image dimensions if it's an image (simplified)
    let width: number | undefined;
    let height: number | undefined;

    return this.prisma.media.create({
      data: {
        filename,
        originalName: file.originalname,
        path: `/uploads/${filename}`,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        uploadedById: userId,
      },
    });
  }

  /**
   * Find all media with pagination
   */
  async findAll(page = 1, limit = 20, mimeType?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

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
