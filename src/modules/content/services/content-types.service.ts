/**
 * Content Types Service
 * Manages custom content type definitions
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateContentTypeDto } from '../dto/create-content-type.dto';
import { UpdateContentTypeDto } from '../dto/update-content-type.dto';
import slugify from 'slugify';

@Injectable()
export class ContentTypesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new content type
   */
  async create(createContentTypeDto: CreateContentTypeDto) {
    const slug = slugify(createContentTypeDto.name, { lower: true, strict: true });

    const existing = await this.prisma.contentType.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Content type with this name already exists');
    }

    return this.prisma.contentType.create({
      data: {
        ...createContentTypeDto,
        slug,
      },
    });
  }

  /**
   * Find all content types
   */
  async findAll() {
    return this.prisma.contentType.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find content type by ID
   */
  async findById(id: string) {
    const contentType = await this.prisma.contentType.findUnique({
      where: { id },
    });

    if (!contentType) {
      throw new NotFoundException('Content type not found');
    }

    return contentType;
  }

  /**
   * Update content type
   */
  async update(id: string, updateContentTypeDto: UpdateContentTypeDto) {
    await this.findById(id);

    return this.prisma.contentType.update({
      where: { id },
      data: updateContentTypeDto,
    });
  }

  /**
   * Delete content type
   */
  async remove(id: string) {
    await this.findById(id);

    return this.prisma.contentType.delete({
      where: { id },
    });
  }
}
