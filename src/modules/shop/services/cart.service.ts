/**
 * Cart Service
 * Handles shopping cart operations
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

    let cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, sessionId },
        include: {
          items: {
            include: {
              product: { include: { category: true } },
              variant: true,
            },
          },
        },
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
      const price = item.variant?.price || item.product.salePrice || item.product.price;
      const itemTotal = new Decimal(price).times(item.quantity);
      subtotal = subtotal.plus(itemTotal);
      return { ...item, price, itemTotal: itemTotal.toNumber() };
    });

    return {
      ...cart,
      items: itemsWithTotals,
      subtotal: subtotal.toNumber(),
      itemCount: cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    };
  }
}

