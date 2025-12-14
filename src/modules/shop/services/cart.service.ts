/**
 * Cart Service
 * Handles shopping cart operations for products and courses
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from '../dto/cart.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Get or create cart for user or session
  async getOrCreateCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new BadRequestException('User ID or Session ID is required');
    }

    const cartInclude = {
      items: {
        include: {
          product: { include: { category: true } },
          variant: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              featuredImage: true,
              priceAmount: true,
              priceType: true,
              instructor: { select: { id: true, name: true } },
            },
          },
        },
      },
    };

    // If user is logged in, prioritize finding by userId
    let cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: cartInclude,
    });

    if (!cart) {
      // Create cart with ONLY userId OR sessionId, not both (to avoid unique constraint issues)
      cart = await this.prisma.cart.create({
        data: userId ? { userId } : { sessionId },
        include: cartInclude,
      });
    }

    return this.calculateCartTotals(cart);
  }

  // Add item to cart
  async addToCart(dto: AddToCartDto, userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    // Validate product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not found or not available');
    }

    // Validate variant if provided
    if (dto.variantId) {
      const variant = product.variants.find(v => v.id === dto.variantId);
      if (!variant) {
        throw new NotFoundException('Variant not found');
      }
    }

    // Check if item already in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId || null,
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity },
      });
    } else {
      // Add new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getOrCreateCart(userId, sessionId);
  }

  // Add course to cart
  async addCourseToCart(courseId: string, userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    // Validate course exists and is published
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.status !== 'PUBLISHED') {
      throw new NotFoundException('Course not found or not available');
    }

    if (course.priceType === 'FREE') {
      throw new BadRequestException('Free courses cannot be added to cart. Enroll directly.');
    }

    // Check if user is already enrolled
    if (userId) {
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: { courseId_userId: { courseId, userId } },
      });
      if (existingEnrollment) {
        throw new BadRequestException('You are already enrolled in this course');
      }
    }

    // Check if course already in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, courseId },
    });

    if (existingItem) {
      throw new BadRequestException('Course is already in your cart');
    }

    // Add course to cart
    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        courseId,
        itemType: 'COURSE',
        quantity: 1, // Courses always have quantity 1
      },
    });

    return this.getOrCreateCart(userId, sessionId);
  }

  // Update cart item quantity
  async updateCartItem(itemId: string, dto: UpdateCartItemDto, userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: dto.quantity },
      });
    }

    return this.getOrCreateCart(userId, sessionId);
  }

  // Remove item from cart
  async removeFromCart(itemId: string, userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getOrCreateCart(userId, sessionId);
  }

  // Clear cart
  async clearCart(userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getOrCreateCart(userId, sessionId);
  }

  // Calculate cart totals
  private calculateCartTotals(cart: any) {
    let subtotal = new Decimal(0);
    const itemsWithTotals = cart.items.map((item: any) => {
      let price: Decimal;

      if (item.itemType === 'COURSE' && item.course) {
        // Course pricing
        price = item.course.priceAmount || new Decimal(0);
      } else if (item.product) {
        // Product pricing
        price = item.variant?.price || item.product.salePrice || item.product.price;
      } else {
        price = new Decimal(0);
      }

      const itemTotal = new Decimal(price).times(item.quantity);
      subtotal = subtotal.plus(itemTotal);

      return {
        ...item,
        price: new Decimal(price).toNumber(),
        itemTotal: itemTotal.toNumber(),
        name: item.course?.title || item.product?.name || 'Unknown Item',
        image: item.course?.featuredImage || item.product?.images?.[0] || null,
      };
    });

    return {
      ...cart,
      items: itemsWithTotals,
      subtotal: subtotal.toNumber(),
      itemCount: cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      hasCourses: cart.items.some((item: any) => item.itemType === 'COURSE'),
      hasProducts: cart.items.some((item: any) => item.itemType === 'PRODUCT'),
    };
  }
}

