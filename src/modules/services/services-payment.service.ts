/**
 * Services Payment Service
 * Handles Stripe payments for professional services
 */

import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../settings/system-config.service';
import { BookingService } from './booking.service';
import Stripe from 'stripe';

@Injectable()
export class ServicesPaymentService implements OnModuleInit {
  private readonly logger = new Logger(ServicesPaymentService.name);
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private systemConfig: SystemConfigService,
    private bookingService: BookingService,
  ) {}

  async onModuleInit() {
    await this.initializeStripe();
  }

  private async initializeStripe(): Promise<void> {
    try {
      const config = await this.systemConfig.getStripeConfig();
      if (config.secretKey) {
        this.stripe = new Stripe(config.secretKey);
        this.logger.log('Stripe initialized for services payments');
      }
    } catch (_error) {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (secretKey) {
        this.stripe = new Stripe(secretKey);
      }
    }
  }

  /**
   * Create a checkout session for service booking
   */
  async createBookingCheckoutSession(params: {
    bookingId: string;
    userId: string;
    successUrl?: string;
    cancelUrl?: string;
  }) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const booking = await this.prisma.serviceBooking.findUnique({
      where: { id: params.bookingId },
      include: {
        service: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.userId !== params.userId) {
      throw new BadRequestException('Not authorized');
    }

    if (Number(booking.totalAmount) === 0) {
      throw new BadRequestException('Quote-based services require a price first');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Get or create customer
    const customers = await this.stripe.customers.list({
      email: booking.user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await this.stripe.customers.create({
        email: booking.user.email,
        name: booking.user.name,
        metadata: { userId: booking.userId },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(booking.totalAmount) * 100),
            product_data: {
              name: booking.service.name,
              description: booking.service.description.substring(0, 500),
            },
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl || `${baseUrl}/services/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl || `${baseUrl}/services/bookings/${booking.id}`,
      metadata: {
        type: 'service_booking',
        bookingId: booking.id,
        userId: booking.userId,
      },
    });

    // Store payment session ID on booking
    await this.prisma.serviceBooking.update({
      where: { id: booking.id },
      data: { paymentId: session.id },
    });

    return { sessionId: session.id, url: session.url };
  }

  /**
   * Handle successful service payment from webhook
   */
  async handlePaymentSuccess(session: Stripe.Checkout.Session) {
    const metadata = session.metadata || {};

    if (metadata.type !== 'service_booking') {
      return;
    }

    const bookingId = metadata.bookingId;
    if (!bookingId) {
      this.logger.error('Missing bookingId in service payment session');
      return;
    }

    // Update booking status to confirmed
    const booking = await this.prisma.serviceBooking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paymentId: session.payment_intent as string,
      },
      include: { service: true },
    });

    this.logger.log(`Service booking confirmed from payment: ${booking.id}`);
    return booking;
  }

  /**
   * Handle webhook events for services
   */
  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

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
      throw new BadRequestException('Webhook signature verification failed');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === 'service_booking') {
        await this.handlePaymentSuccess(session);
      }
    }

    return { received: true };
  }

  /**
   * Refund a service booking
   */
  async refundBooking(bookingId: string, reason?: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const booking = await this.prisma.serviceBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || !booking.paymentId) {
      throw new BadRequestException('Booking or payment not found');
    }

    // Create refund
    const refund = await this.stripe.refunds.create({
      payment_intent: booking.paymentId,
      reason: 'requested_by_customer',
      metadata: { bookingId, reason: reason || '' },
    });

    // Update booking status
    await this.prisma.serviceBooking.update({
      where: { id: bookingId },
      data: { status: 'REFUNDED' },
    });

    this.logger.log(`Booking ${bookingId} refunded: ${refund.id}`);
    return { refundId: refund.id, status: refund.status };
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }
}

