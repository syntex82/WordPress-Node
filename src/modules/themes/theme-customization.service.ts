import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateThemeCustomizationImageDto,
  UpdateThemeCustomizationImageDto,
} from './dto/create-theme-customization-image.dto';
import {
  CreateThemeCustomizationBlockDto,
  UpdateThemeCustomizationBlockDto,
} from './dto/create-theme-customization-block.dto';
import {
  CreateThemeCustomizationLinkDto,
  UpdateThemeCustomizationLinkDto,
} from './dto/create-theme-customization-link.dto';

@Injectable()
export class ThemeCustomizationService {
  constructor(private prisma: PrismaService) {}

  // ============ IMAGE MANAGEMENT ============

  async createImage(themeId: string, dto: CreateThemeCustomizationImageDto) {
    // Verify theme exists
    const theme = await this.prisma.theme.findUnique({ where: { id: themeId } });
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    return this.prisma.themeCustomizationImage.create({
      data: {
        themeId,
        ...dto,
      },
    });
  }

  async getImages(themeId: string, type?: string) {
    const where: any = { themeId };
    if (type) where.type = type;

    return this.prisma.themeCustomizationImage.findMany({
      where,
      orderBy: { position: 'asc' },
    });
  }

  async getImage(id: string) {
    const image = await this.prisma.themeCustomizationImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }

  async updateImage(id: string, dto: UpdateThemeCustomizationImageDto) {
    await this.getImage(id); // Validate exists
    return this.prisma.themeCustomizationImage.update({
      where: { id },
      data: dto,
    });
  }

  async deleteImage(id: string) {
    await this.getImage(id);
    return this.prisma.themeCustomizationImage.delete({ where: { id } });
  }

  async reorderImages(themeId: string, imageIds: string[]) {
    const updates = imageIds.map((id, index) =>
      this.prisma.themeCustomizationImage.update({
        where: { id },
        data: { position: index },
      }),
    );
    return Promise.all(updates);
  }

  // ============ CONTENT BLOCK MANAGEMENT ============

  async createBlock(themeId: string, dto: CreateThemeCustomizationBlockDto) {
    const theme = await this.prisma.theme.findUnique({ where: { id: themeId } });
    if (!theme) throw new NotFoundException('Theme not found');

    return this.prisma.themeCustomizationBlock.create({
      data: {
        themeId,
        ...dto,
      },
    });
  }

  async getBlocks(themeId: string, type?: string) {
    const where: any = { themeId };
    if (type) where.type = type;

    return this.prisma.themeCustomizationBlock.findMany({
      where,
      orderBy: { position: 'asc' },
    });
  }

  async getBlock(id: string) {
    const block = await this.prisma.themeCustomizationBlock.findUnique({ where: { id } });
    if (!block) throw new NotFoundException('Block not found');
    return block;
  }

  async updateBlock(id: string, dto: UpdateThemeCustomizationBlockDto) {
    await this.getBlock(id);
    return this.prisma.themeCustomizationBlock.update({
      where: { id },
      data: dto,
    });
  }

  async deleteBlock(id: string) {
    await this.getBlock(id);
    return this.prisma.themeCustomizationBlock.delete({ where: { id } });
  }

  async reorderBlocks(themeId: string, blockIds: string[]) {
    const updates = blockIds.map((id, index) =>
      this.prisma.themeCustomizationBlock.update({
        where: { id },
        data: { position: index },
      }),
    );
    return Promise.all(updates);
  }

  // ============ LINK MANAGEMENT ============

  async createLink(themeId: string, dto: CreateThemeCustomizationLinkDto) {
    const theme = await this.prisma.theme.findUnique({ where: { id: themeId } });
    if (!theme) throw new NotFoundException('Theme not found');

    return this.prisma.themeCustomizationLink.create({
      data: {
        themeId,
        ...dto,
      },
    });
  }

  async getLinks(themeId: string, type?: string, group?: string) {
    const where: any = { themeId };
    if (type) where.type = type;
    if (group) where.group = group;

    return this.prisma.themeCustomizationLink.findMany({
      where,
      orderBy: { position: 'asc' },
    });
  }

  async getLink(id: string) {
    const link = await this.prisma.themeCustomizationLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException('Link not found');
    return link;
  }

  async updateLink(id: string, dto: UpdateThemeCustomizationLinkDto) {
    await this.getLink(id);
    return this.prisma.themeCustomizationLink.update({
      where: { id },
      data: dto,
    });
  }

  async deleteLink(id: string) {
    await this.getLink(id);
    return this.prisma.themeCustomizationLink.delete({ where: { id } });
  }

  async reorderLinks(themeId: string, linkIds: string[]) {
    const updates = linkIds.map((id, index) =>
      this.prisma.themeCustomizationLink.update({
        where: { id },
        data: { position: index },
      }),
    );
    return Promise.all(updates);
  }
}
