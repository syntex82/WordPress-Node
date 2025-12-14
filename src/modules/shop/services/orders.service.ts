/**
 * Orders Service
 * Handles order management
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from '../dto/order.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // Generate unique order number
  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${year}${month}-${random}`;
  }

  // Create order from cart
  async createFromCart(dto: CreateOrderDto, userId?: string, sessionId?: string) {
    // Get cart with products and courses
    const cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            course: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Separate product and course items
    const productItems = cart.items.filter((item) => item.itemType === 'PRODUCT' && item.product);
    const courseItems = cart.items.filter((item) => item.itemType === 'COURSE' && item.course);

    // Calculate totals
    let subtotal = new Decimal(0);
    const orderItems = productItems.map((item) => {
      const price = item.variant?.price || item.product!.salePrice || item.product!.price;
      const total = new Decimal(price).times(item.quantity);
      subtotal = subtotal.plus(total);

      return {
        product: { connect: { id: item.productId! } },
        variant: item.variantId ? { connect: { id: item.variantId } } : undefined,
        name: item.product!.name + (item.variant ? ` - ${item.variant.name}` : ''),
        sku: item.variant?.sku || item.product!.sku,
        price,
        quantity: item.quantity,
        total,
        options: item.variant?.options ?? undefined,
      };
    });

    // Add course prices to subtotal
    for (const item of courseItems) {
      if (item.course?.priceAmount) {
        subtotal = subtotal.plus(item.course.priceAmount);
      }
    }

    // Get shipping cost
    let shipping = new Decimal(0);
    if (dto.shippingMethod) {
      const shippingMethod = await this.prisma.shippingMethod.findUnique({
        where: { id: dto.shippingMethod },
      });
      if (shippingMethod) {
        shipping =
          shippingMethod.freeAbove && subtotal.gte(shippingMethod.freeAbove)
            ? new Decimal(0)
            : shippingMethod.cost;
      }
    }

    // Apply coupon if provided
    let discount = new Decimal(0);
    let couponCode: string | null = null;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive) {
        if (coupon.type === 'PERCENTAGE') {
          discount = subtotal.times(coupon.value).dividedBy(100);
        } else if (coupon.type === 'FIXED') {
          discount = coupon.value;
        } else if (coupon.type === 'FREE_SHIPPING') {
          shipping = new Decimal(0);
        }
        if (coupon.maxDiscount && discount.gt(coupon.maxDiscount)) {
          discount = new Decimal(coupon.maxDiscount.toString());
        }
        couponCode = coupon.code;
        await this.prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    // Calculate tax (simple example - 10%)
    const taxRate = new Decimal(0.1);
    const tax = subtotal.minus(discount).times(taxRate);
    const total = subtotal.plus(shipping).plus(tax).minus(discount);

    // Create order with default billing address if not provided
    const defaultAddress = {
      firstName: '',
      lastName: '',
      address1: '',
      city: '',
      postalCode: '',
      country: '',
    };

    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        userId,
        email: dto.email,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        couponCode,
        couponDiscount: discount.gt(0) ? discount : null,
        billingAddress: (dto.billingAddress || defaultAddress) as any,
        shippingAddress: dto.shippingAddress as any,
        shippingMethod: dto.shippingMethod,
        customerNote: dto.customerNote,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Update product stock
    for (const item of productItems) {
      if (item.product?.trackStock) {
        if (item.variantId) {
          await this.prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else if (item.productId) {
          await this.prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    }

    // Create course enrollments for purchased courses
    if (userId && courseItems.length > 0) {
      for (const item of courseItems) {
        if (item.courseId) {
          // Check if already enrolled
          const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: { courseId_userId: { courseId: item.courseId, userId } },
          });

          if (!existingEnrollment) {
            await this.prisma.enrollment.create({
              data: {
                courseId: item.courseId,
                userId,
                status: 'ACTIVE',
                paymentId: order.id, // Link to order
              },
            });
          }
        }
      }
    }

    // Clear cart
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return {
      ...order,
      coursesEnrolled: courseItems.map((item) => item.course?.title).filter(Boolean),
    };
  }

  // Get all orders with pagination
  async findAll(query: OrderQueryDto) {
    const { status, paymentStatus, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, payments: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // Get single order
  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, payments: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // Get order by order number
  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: true } }, payments: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // Get user orders
  async findByUser(userId: string, query: OrderQueryDto) {
    return this.findAll({ ...query, search: undefined });
  }

  // Update order status
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const updateData: any = { status: dto.status };
    if (dto.trackingNumber) updateData.trackingNumber = dto.trackingNumber;
    if (dto.adminNote) updateData.adminNote = dto.adminNote;
    if (dto.status === 'SHIPPED') updateData.shippedAt = new Date();
    if (dto.status === 'DELIVERED') updateData.deliveredAt = new Date();

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true, payments: true },
    });
  }

  // Cancel order
  async cancel(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    // Restore stock
    for (const item of order.items) {
      if (item.variantId) {
        await this.prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: true, payments: true },
    });
  }

  // Get order statistics
  async getStats() {
    const [totalOrders, totalRevenue, pendingOrders, todayOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID' } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingOrders,
      todayOrders,
    };
  }
}
