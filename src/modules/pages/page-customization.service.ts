/**
 * Page Customization Service
 * Handles CRUD operations for page-specific theme customizations
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePageCustomizationDto } from './dto/create-page-customization.dto';
import { UpdatePageCustomizationDto } from './dto/update-page-customization.dto';

@Injectable()
export class PageCustomizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all page customizations
   */
  async findAll() {
    return this.prisma.pageCustomization.findMany({
      include: {
        page: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get page customization by ID
   */
  async findById(id: string) {
    const customization = await this.prisma.pageCustomization.findUnique({
      where: { id },
      include: {
        page: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!customization) {
      throw new NotFoundException('Page customization not found');
    }

    return customization;
  }

  /**
   * Get customization by page ID
   */
  async findByPageId(pageId: string) {
    return this.prisma.pageCustomization.findUnique({
      where: { pageId },
      include: {
        page: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  /**
   * Create page customization
   */
  async create(dto: CreatePageCustomizationDto) {
    // Verify page exists
    const page = await this.prisma.page.findUnique({
      where: { id: dto.pageId },
    });

    if (!page) {
      throw new BadRequestException('Page not found');
    }

    // Check if customization already exists
    const existing = await this.prisma.pageCustomization.findUnique({
      where: { pageId: dto.pageId },
    });

    if (existing) {
      throw new BadRequestException('Customization already exists for this page');
    }

    return this.prisma.pageCustomization.create({
      data: {
        pageId: dto.pageId,
        layout: dto.layout || 'default',
        showHeader: dto.showHeader ?? true,
        showFooter: dto.showFooter ?? true,
        showSidebar: dto.showSidebar ?? false,
        customCSS: dto.customCSS,
        backgroundColor: dto.backgroundColor,
        textColor: dto.textColor,
        headerStyle: dto.headerStyle || 'default',
        footerStyle: dto.footerStyle || 'default',
        featuredImagePosition: dto.featuredImagePosition || 'top',
        customFields: dto.customFields,
      },
      include: {
        page: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  /**
   * Update page customization
   */
  async update(id: string, dto: UpdatePageCustomizationDto) {
    await this.findById(id);

    return this.prisma.pageCustomization.update({
      where: { id },
      data: {
        ...(dto.layout && { layout: dto.layout }),
        ...(dto.showHeader !== undefined && { showHeader: dto.showHeader }),
        ...(dto.showFooter !== undefined && { showFooter: dto.showFooter }),
        ...(dto.showSidebar !== undefined && { showSidebar: dto.showSidebar }),
        ...(dto.customCSS !== undefined && { customCSS: dto.customCSS }),
        ...(dto.backgroundColor && { backgroundColor: dto.backgroundColor }),
        ...(dto.textColor && { textColor: dto.textColor }),
        ...(dto.headerStyle && { headerStyle: dto.headerStyle }),
        ...(dto.footerStyle && { footerStyle: dto.footerStyle }),
        ...(dto.featuredImagePosition && { featuredImagePosition: dto.featuredImagePosition }),
        ...(dto.customFields && { customFields: dto.customFields }),
      },
      include: {
        page: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  /**
   * Delete page customization
   */
  async delete(id: string) {
    await this.findById(id);

    return this.prisma.pageCustomization.delete({
      where: { id },
    });
  }

  /**
   * Delete customization by page ID
   */
  async deleteByPageId(pageId: string) {
    return this.prisma.pageCustomization.deleteMany({
      where: { pageId },
    });
  }
}

