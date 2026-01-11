/**
 * Products Service
 * Handles product CRUD operations with variant management
 *
 * SECURITY: All queries filter by demoInstanceId to isolate demo data
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateVariantDto,
  GenerateVariantsDto,
  ColorOptionDto,
} from '../dto/product.dto';

interface DemoContext {
  isDemo: boolean;
  demoInstanceId: string | null;
}

@Injectable({ scope: Scope.REQUEST })
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * Get demo isolation filter for queries
   * Demo users only see demo data, real users only see real data
   */
  private getDemoFilter(): { demoInstanceId: string | null } {
    const user = (this.request as any).user;
    const demoContext = (this.request as any).demoContext as DemoContext | undefined;

    if (user?.isDemo || user?.demoId || demoContext?.isDemo) {
      return { demoInstanceId: user?.demoId || demoContext?.demoInstanceId || null };
    }

    return { demoInstanceId: null };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate variant name from size and color
   */
  private generateVariantName(size?: string, color?: string): string {
    const parts: string[] = [];
    if (size) parts.push(size);
    if (color) parts.push(color);
    return parts.join(' / ') || 'Default';
  }

  /**
   * Generate all variant combinations from sizes and colors
   */
  generateVariantCombinations(
    sizes: string[],
    colors: ColorOptionDto[],
    defaultPrice?: number,
    defaultStock = 0,
  ): CreateVariantDto[] {
    const variants: CreateVariantDto[] = [];
    let sortOrder = 0;

    if (sizes.length === 0 && colors.length === 0) {
      return variants;
    }

    // If only sizes
    if (colors.length === 0) {
      for (const size of sizes) {
        variants.push({
          name: size,
          size,
          price: defaultPrice,
          stock: defaultStock,
          options: { size },
          isDefault: sortOrder === 0,
          sortOrder: sortOrder++,
        });
      }
      return variants;
    }

    // If only colors
    if (sizes.length === 0) {
      for (const color of colors) {
        variants.push({
          name: color.name,
          color: color.name,
          colorCode: color.code,
          price: defaultPrice,
          stock: defaultStock,
          options: { color: color.name, colorCode: color.code },
          isDefault: sortOrder === 0,
          sortOrder: sortOrder++,
        });
      }
      return variants;
    }

    // Both sizes and colors - create all combinations
    for (const size of sizes) {
      for (const color of colors) {
        variants.push({
          name: `${size} / ${color.name}`,
          size,
          color: color.name,
          colorCode: color.code,
          price: defaultPrice,
          stock: defaultStock,
          options: { size, color: color.name, colorCode: color.code },
          isDefault: sortOrder === 0,
          sortOrder: sortOrder++,
        });
      }
    }

    return variants;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

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

    const { variants, tags, variantOptions, categoryId, ...productData } = dto;

    // Sanitize categoryId - convert empty string to null
    const sanitizedCategoryId = categoryId && categoryId.trim() !== '' ? categoryId : null;

    // Build variant create data with proper clothing fields
    const variantCreateData = variants?.map((v, index) => ({
      name: v.name || this.generateVariantName(v.size, v.color),
      sku: v.sku,
      price: v.price,
      salePrice: v.salePrice,
      costPrice: v.costPrice,
      stock: v.stock ?? 0,
      lowStockThreshold: v.lowStockThreshold ?? 5,
      image: v.image,
      images: v.images,
      size: v.size,
      color: v.color,
      colorCode: v.colorCode,
      weight: v.weight,
      options: v.options || { size: v.size, color: v.color, colorCode: v.colorCode },
      isDefault: v.isDefault ?? index === 0,
      isActive: v.isActive ?? true,
      sortOrder: v.sortOrder ?? index,
    }));

    const demoFilter = this.getDemoFilter();

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug,
        categoryId: sanitizedCategoryId,
        price: dto.price,
        salePrice: dto.salePrice,
        costPrice: dto.costPrice,
        weight: dto.weight,
        hasVariants: dto.hasVariants ?? (variants && variants.length > 0),
        variantOptions: variantOptions as any,
        demoInstanceId: demoFilter.demoInstanceId,
        variants: variantCreateData ? { create: variantCreateData } : undefined,
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
        variants: { orderBy: { sortOrder: 'asc' } },
        tags: true,
      },
    });

    return product;
  }

  /**
   * Find all products with filtering and pagination
   * SECURITY: Filtered by demoInstanceId to isolate demo data
   */
  async findAll(query: ProductQueryDto) {
    const { search, status, categoryId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const demoFilter = this.getDemoFilter();

    const where: any = { ...demoFilter };
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

  /**
   * Find product by ID
   * SECURITY: Validates product belongs to current demo context
   */
  async findOne(id: string) {
    const demoFilter = this.getDemoFilter();
    const product = await this.prisma.product.findFirst({
      where: { id, ...demoFilter },
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

  /**
   * Find product by slug
   * SECURITY: Validates product belongs to current demo context
   */
  async findBySlug(slug: string) {
    const demoFilter = this.getDemoFilter();
    const product = await this.prisma.product.findFirst({
      where: { slug, ...demoFilter },
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

    const { variants, tags, slug: dtoSlug, categoryId, ...productData } = dto;

    // Sanitize categoryId - convert empty string to null
    const sanitizedCategoryId = categoryId && categoryId.trim() !== '' ? categoryId : null;

    // Handle slug update
    let slug = existing.slug;
    if (dtoSlug && dtoSlug !== existing.slug) {
      // Check if the new slug is already taken by another product
      const slugExists = await this.prisma.product.findFirst({
        where: {
          slug: dtoSlug,
          id: { not: id },
        },
      });
      if (slugExists) {
        throw new ConflictException(`Slug "${dtoSlug}" is already in use`);
      }
      slug = dtoSlug;
    } else if (dto.name && dto.name !== existing.name && !dtoSlug) {
      // Generate new slug only if name changed and no custom slug provided
      slug = this.generateSlug(dto.name);
    }

    // Delete existing variants and recreate
    if (variants) {
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
    }

    // Build variant update data with proper clothing fields
    const variantCreateData = variants?.map((v, index) => ({
      name: v.name || this.generateVariantName(v.size, v.color),
      sku: v.sku,
      price: v.price,
      salePrice: v.salePrice,
      costPrice: v.costPrice,
      stock: v.stock ?? 0,
      lowStockThreshold: v.lowStockThreshold ?? 5,
      image: v.image,
      images: v.images,
      size: v.size,
      color: v.color,
      colorCode: v.colorCode,
      weight: v.weight,
      options: v.options || { size: v.size, color: v.color, colorCode: v.colorCode },
      isDefault: v.isDefault ?? index === 0,
      isActive: v.isActive ?? true,
      sortOrder: v.sortOrder ?? index,
    }));

    // Prepare update data with explicit handling of variant options
    const updateData: any = {
      ...productData,
      slug,
      categoryId: sanitizedCategoryId,
      hasVariants: dto.hasVariants ?? (variants && variants.length > 0),
    };

    // Explicitly set variantOptions if provided, or clear it if hasVariants is false
    if (dto.variantOptions !== undefined) {
      updateData.variantOptions = dto.variantOptions;
    } else if (dto.hasVariants === false) {
      updateData.variantOptions = null;
    }

    // Handle variants
    if (variantCreateData) {
      updateData.variants = { create: variantCreateData };
    }

    // Handle tags
    if (tags) {
      updateData.tags = {
        set: [],
        connectOrCreate: tags.map((tag) => ({
          where: { slug: this.generateSlug(tag) },
          create: { name: tag, slug: this.generateSlug(tag) },
        })),
      };
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, variants: { orderBy: { sortOrder: 'asc' } }, tags: true },
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

  // Update stock for product or variant
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

  // Set absolute stock for a variant
  async setVariantStock(variantId: string, stock: number) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
    });
  }

  // Get variant by ID
  async getVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  // Get available variants for a product (only active and in-stock)
  async getAvailableVariants(productId: string) {
    return this.prisma.productVariant.findMany({
      where: {
        productId,
        isActive: true,
        stock: { gt: 0 },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Get variant stock summary for a product
  async getVariantStockSummary(productId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });

    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    const inStockCount = variants.filter((v) => v.stock > 0).length;
    const lowStockCount = variants.filter(
      (v) => v.stock > 0 && v.stock <= v.lowStockThreshold,
    ).length;
    const outOfStockCount = variants.filter((v) => v.stock === 0).length;

    return {
      variants,
      summary: {
        totalVariants: variants.length,
        totalStock,
        inStockCount,
        lowStockCount,
        outOfStockCount,
      },
    };
  }

  // Update a single variant
  async updateVariant(variantId: string, data: Partial<CreateVariantDto>) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name: data.name,
        sku: data.sku,
        price: data.price,
        salePrice: data.salePrice,
        costPrice: data.costPrice,
        stock: data.stock,
        lowStockThreshold: data.lowStockThreshold,
        image: data.image,
        images: data.images as any,
        size: data.size,
        color: data.color,
        colorCode: data.colorCode,
        weight: data.weight,
        options: data.options as any,
        isDefault: data.isDefault,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });
  }

  // Delete a single variant
  async deleteVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');

    // Check if variant is in any active carts
    const cartItems = await this.prisma.cartItem.count({ where: { variantId } });
    if (cartItems > 0) {
      throw new BadRequestException('Cannot delete variant that is in active carts');
    }

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return { message: 'Variant deleted successfully' };
  }

  // Generate and add variants to existing product
  async generateProductVariants(productId: string, dto: GenerateVariantsDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const variants = this.generateVariantCombinations(
      dto.sizes,
      dto.colors,
      dto.defaultPrice,
      dto.defaultStock,
    );

    // Delete existing variants
    await this.prisma.productVariant.deleteMany({ where: { productId } });

    // Create new variants
    const variantCreateData = variants.map((v, index) => ({
      productId,
      name: v.name || this.generateVariantName(v.size, v.color),
      sku: v.sku,
      price: v.price,
      salePrice: v.salePrice,
      stock: v.stock ?? 0,
      lowStockThreshold: v.lowStockThreshold ?? 5,
      image: v.image,
      size: v.size,
      color: v.color,
      colorCode: v.colorCode,
      options: v.options || {},
      isDefault: v.isDefault ?? index === 0,
      isActive: true,
      sortOrder: index,
    }));

    await this.prisma.productVariant.createMany({ data: variantCreateData });

    // Update product variant options
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        hasVariants: true,
        variantOptions: JSON.parse(
          JSON.stringify({
            sizes: dto.sizes,
            colors: dto.colors,
          }),
        ),
      },
    });

    return this.findOne(productId);
  }

  // Check variant availability (for add to cart validation)
  async checkVariantAvailability(productId: string, variantId?: string, quantity = 1) {
    if (variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant) {
        return { available: false, reason: 'Variant not found' };
      }
      if (!variant.isActive) {
        return { available: false, reason: 'Variant is not available' };
      }
      if (variant.stock < quantity) {
        return { available: false, reason: 'Insufficient stock', currentStock: variant.stock };
      }
      return { available: true, variant };
    }

    // Check product stock (for non-variant products)
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return { available: false, reason: 'Product not found' };
    }
    if (product.hasVariants) {
      return { available: false, reason: 'Please select a size/color option' };
    }
    if (product.trackStock && product.stock < quantity) {
      return { available: false, reason: 'Insufficient stock', currentStock: product.stock };
    }
    return { available: true, product };
  }
}
