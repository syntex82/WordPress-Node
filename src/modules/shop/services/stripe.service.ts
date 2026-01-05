/**
 * Stripe Payment Service
 * Handles Stripe payment integration
 * Reads configuration from database first, falls back to environment variables
 */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { SystemConfigService } from '../../settings/system-config.service';
import { SystemEmailService } from '../../email/system-email.service';
import { EmailService } from '../../email/email.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private systemConfig: SystemConfigService,
    private systemEmailService: SystemEmailService,
    private emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.initializeStripe();
  }

  /**
   * Initialize Stripe with configuration from DB or env
   */
  private async initializeStripe(): Promise<void> {
    try {
      const config = await this.systemConfig.getStripeConfig();
      const secretKey = config.secretKey;

      if (secretKey) {
        this.stripe = new Stripe(secretKey);
        this.logger.log(
          `Stripe initialized: ${secretKey.substring(0, 10)}... (${config.isLiveMode ? 'LIVE' : 'TEST'} mode)`,
        );
      } else {
        this.logger.warn('Stripe secret key not configured');
      }
    } catch (_error) {
      // Database not ready yet, try env fallback
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (secretKey) {
        this.stripe = new Stripe(secretKey);
        this.logger.log(`Stripe initialized from env: ${secretKey.substring(0, 10)}...`);
      } else {
        this.logger.warn('Stripe not configured (no DB or env config)');
      }
    }
  }

  /**
   * Reload Stripe configuration (call after settings change)
   */
  async reloadConfig(): Promise<void> {
    this.stripe = null;
    await this.initializeStripe();
  }

  // Create payment intent for order
  async createPaymentIntent(orderId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Order is already paid');
    }

    try {
      // Create Stripe customer for the order (optional - skip if restricted key doesn't have permission)
      let stripeCustomerId: string | undefined;
      try {
        if (order.email) {
          const customer = await this.stripe.customers.create({
            email: order.email,
            metadata: { orderId: order.id, userId: order.userId || 'guest' },
          });
          stripeCustomerId = customer.id;
        }
      } catch (customerError: any) {
        console.warn('Could not create Stripe customer:', customerError.message);
        // Continue without customer - not critical
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(Number(order.total) * 100), // Convert to cents
        currency: order.currency.toLowerCase(),
        customer: stripeCustomerId,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: order.currency,
          stripePaymentIntentId: paymentIntent.id,
          stripeCustomerId,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error('Stripe error:', error.message);
      throw new BadRequestException(`Stripe error: ${error.message}`);
    }
  }

  // Handle Stripe webhook events
  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    // Get webhook secret from DB first, then env fallback
    let webhookSecret: string;
    try {
      const config = await this.systemConfig.getStripeConfig();
      webhookSecret = config.webhookSecret;
    } catch {
      webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    }

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (_err) {
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;
    }

    return { received: true };
  }

  // Handle successful payment
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) return;

    // Update payment record
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        stripeChargeId: paymentIntent.latest_charge as string,
      },
    });

    // Get order with items to process course enrollments
    const order = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true, images: true, sku: true } },
            course: { select: { title: true, featuredImage: true } },
          },
        },
      },
    });

    if (!order) return;

    // Fetch user if order has userId
    const user = order.userId
      ? await this.prisma.user.findUnique({
          where: { id: order.userId },
          select: { id: true, name: true, email: true },
        })
      : null;

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    });

    // Send order confirmation email (non-blocking)
    try {
      const email = user?.email || order.email;
      // Parse billing address for name (shippingAddress is JSON)
      const billingAddress = order.billingAddress as { name?: string } | null;
      const shippingAddr = order.shippingAddress as {
        name?: string;
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      } | null;
      const name = user?.name || billingAddress?.name || 'Customer';
      const userId = user?.id || order.id;

      if (email) {
        const siteContext = await this.emailService.getSiteContext();
        await this.systemEmailService.sendOrderConfirmationEmail({
          to: email,
          toName: name,
          userId,
          firstName: name.split(' ')[0] || name,
          order: {
            number: order.orderNumber,
            date: new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            items: order.items.map((item) => ({
              name: item.product?.name || item.course?.title || item.name,
              quantity: item.quantity,
              total: Number(item.total).toFixed(2),
              image: item.product?.images?.[0] || item.course?.featuredImage || undefined,
              sku: item.product?.sku || undefined,
            })),
            subtotal: Number(order.subtotal).toFixed(2),
            shipping: Number(order.shipping) > 0 ? Number(order.shipping).toFixed(2) : undefined,
            tax: Number(order.tax) > 0 ? Number(order.tax).toFixed(2) : undefined,
            total: Number(order.total).toFixed(2),
            shippingAddress: shippingAddr
              ? {
                  name: shippingAddr.name || name,
                  street: shippingAddr.street || '',
                  city: shippingAddr.city || '',
                  state: shippingAddr.state || '',
                  zip: shippingAddr.zip || '',
                  country: shippingAddr.country || '',
                }
              : undefined,
          },
          orderUrl: `${siteContext.frontendUrl}/account/orders/${order.id}`,
        });
      }
    } catch (error) {
      this.logger.error('Failed to send order confirmation email:', error);
      // Don't fail payment processing if email fails
    }

    // Enroll user in purchased courses after payment succeeds
    if (order.userId) {
      const courseItems = order.items.filter((item) => item.courseId);
      for (const item of courseItems) {
        if (item.courseId) {
          // Check if already enrolled
          const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: { courseId_userId: { courseId: item.courseId, userId: order.userId } },
          });

          if (!existingEnrollment) {
            await this.prisma.enrollment.create({
              data: {
                courseId: item.courseId,
                userId: order.userId,
                status: 'ACTIVE',
                paymentId: order.id,
              },
            });
          }
        }
      }
    }
  }

  // Handle failed payment
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'FAILED' },
    });
  }

  // Handle refund
  private async handleRefund(charge: Stripe.Charge) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripeChargeId: charge.id },
    });

    if (!payment) return;

    const refundedAmount = charge.amount_refunded / 100;
    const isFullRefund = charge.refunded;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundedAmount,
        refundedAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        status: isFullRefund ? 'REFUNDED' : undefined,
      },
    });
  }

  // Create refund
  async createRefund(orderId: string, amount?: number, reason?: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId, status: 'PAID' },
    });

    if (!payment || !payment.stripePaymentIntentId) {
      throw new NotFoundException('No paid payment found for this order');
    }

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: payment.stripePaymentIntentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    if (reason) {
      refundParams.reason = 'requested_by_customer';
      refundParams.metadata = { reason };
    }

    const refund = await this.stripe.refunds.create(refundParams);

    // Update payment record
    const refundedAmount = refund.amount / 100;
    const isFullRefund = refundedAmount >= Number(payment.amount);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundedAmount,
        refundReason: reason,
        refundedAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        status: isFullRefund ? 'REFUNDED' : undefined,
      },
    });

    return { success: true, refundId: refund.id, amount: refundedAmount };
  }

  // Get Stripe publishable key for frontend
  async getPublishableKey(): Promise<string> {
    try {
      const config = await this.systemConfig.getStripeConfig();
      return config.publishableKey;
    } catch {
      return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || '';
    }
  }

  // Check if Stripe is configured
  isConfigured(): boolean {
    return this.stripe !== null;
  }
}
