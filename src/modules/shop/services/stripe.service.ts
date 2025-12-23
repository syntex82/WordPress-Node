/**
 * Stripe Payment Service
 * Handles Stripe payment integration
 * Reads configuration from database first, falls back to environment variables
 */
import { Injectable, BadRequestException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { SystemConfigService } from '../../settings/system-config.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private systemConfig: SystemConfigService,
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
        this.logger.log(`Stripe initialized: ${secretKey.substring(0, 10)}... (${config.isLiveMode ? 'LIVE' : 'TEST'} mode)`);
      } else {
        this.logger.warn('Stripe secret key not configured');
      }
    } catch (error) {
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

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    });
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
