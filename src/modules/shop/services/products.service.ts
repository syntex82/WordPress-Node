/**
 * Products Service
 * Handles product CRUD operations
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from '../dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async create(dto: CreateProductDto) {
    const slug = this.generateSlug(dto.name);

    // Check for existing slug
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Product with this name already exists');
    }

    // Check SKU uniqueness
    if (dto.sku) {
      const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (existingSku) {
        throw new ConflictException('SKU already exists');
      }
    }

    const { variants, tags, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug,
        price: dto.price,
        salePrice: dto.salePrice,
        costPrice: dto.costPrice,
        weight: dto.weight,
        variants: variants
          ? {
              create: variants.map((v, i) => ({
                ...v,
                price: v.price,
                salePrice: v.salePrice,
                options: v.options || {},
              })),
            }
          : undefined,
        tags: tags
          ? {
              connectOrCreate: tags.map((tag) => ({
                where: { slug: this.generateSlug(tag) },
                create: { name: tag, slug: this.generateSlug(tag) },
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        variants: true,
        tags: true,
      },
    });

    return product;
  }

  async findAll(query: ProductQueryDto) {
    const { search, status, categoryId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          variants: true,
          tags: true,
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        tags: true,
        reviews: { where: { isApproved: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true,
        tags: true,
        reviews: { where: { isApproved: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    const { variants, tags, ...productData } = dto;

    // Handle slug update if name changed
    let slug = existing.slug;
    if (dto.name && dto.name !== existing.name) {
      slug = this.generateSlug(dto.name);
    }

    // Delete existing variants and recreate
    if (variants) {
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        slug,
        variants: variants
          ? {
              create: variants.map((v) => ({ ...v, options: v.options || {} })),
            }
          : undefined,
        tags: tags
          ? {
              set: [],
              connectOrCreate: tags.map((tag) => ({
                where: { slug: this.generateSlug(tag) },
                create: { name: tag, slug: this.generateSlug(tag) },
              })),
            }
          : undefined,
      },
      include: { category: true, variants: true, tags: true },
    });

    return product;
  }

  async delete(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted successfully' };
  }

  // Get active products for frontend
  async getActiveProducts(query: ProductQueryDto) {
    return this.findAll({ ...query, status: 'ACTIVE' as any });
  }

  // Update stock
  async updateStock(id: string, quantity: number, variantId?: string) {
    if (variantId) {
      await this.prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: quantity } },
      });
    } else {
      await this.prisma.product.update({
        where: { id },
        data: { stock: { increment: quantity } },
      });
    }
  }
}
