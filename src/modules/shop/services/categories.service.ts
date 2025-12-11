/**
 * Product Categories Service
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async create(dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);
    
    const existing = await this.prisma.productCategory.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.productCategory.create({
      data: { ...dto, slug },
      include: { parent: true, children: true },
    });
  }

  async findAll() {
    return this.prisma.productCategory.findMany({
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findTree() {
    const categories = await this.prisma.productCategory.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: { where: { status: 'ACTIVE' }, take: 10 },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        products: { where: { status: 'ACTIVE' } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.productCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    let slug = existing.slug;
    if (dto.name && dto.name !== existing.name) {
      slug = this.generateSlug(dto.name);
    }

    return this.prisma.productCategory.update({
      where: { id },
      data: { ...dto, slug },
      include: { parent: true, children: true },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { children: true, products: true },
    });
    if (!existing) throw new NotFoundException('Category not found');

    // Move children to parent
    if (existing.children.length > 0) {
      await this.prisma.productCategory.updateMany({
        where: { parentId: id },
        data: { parentId: existing.parentId },
      });
    }

    // Remove category from products
    await this.prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await this.prisma.productCategory.delete({ where: { id } });
    return { message: 'Category deleted successfully' };
  }
}

