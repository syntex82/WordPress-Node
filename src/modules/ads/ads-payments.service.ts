/**
 * Ads Payments Service
 * Handles advertiser deposits and your revenue collection
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../settings/system-config.service';
import Stripe from 'stripe';

@Injectable()
export class AdsPaymentsService {
  private readonly logger = new Logger(AdsPaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: SystemConfigService,
  ) {
    this.initStripe();
  }

  private async initStripe() {
    const stripeConfig = await this.config.getStripeConfig();
    if (stripeConfig.secretKey) {
      this.stripe = new Stripe(stripeConfig.secretKey);
    }
  }

  /**
   * Create checkout session for advertiser to add funds
   * Money goes directly to YOUR Stripe account
   */
  async createDepositCheckout(advertiserId: string, amount: number) {
    if (!this.stripe) {
      throw new BadRequestException('Payment system not configured');
    }
    if (amount < 10) {
      throw new BadRequestException('Minimum deposit is $10');
    }

    const advertiser = await this.prisma.advertiser.findUnique({
      where: { id: advertiserId },
      include: { user: true },
    });
    if (!advertiser) throw new BadRequestException('Advertiser not found');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Ad Account Deposit',
            description: `Add $${amount} to your advertising balance`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/advertiser/deposit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/advertiser/deposit/cancel`,
      customer_email: advertiser.contactEmail,
      metadata: {
        type: 'ad_deposit',
        advertiserId,
        amount: amount.toString(),
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  /**
   * Handle Stripe webhook - credit advertiser account when payment succeeds
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) throw new BadRequestException('Stripe not configured');

    const webhookSecret = await this.config.get('stripe_webhook_secret');
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.type === 'ad_deposit') {
        await this.creditAdvertiserAccount(
          session.metadata.advertiserId,
          parseFloat(session.metadata.amount),
          session.payment_intent as string,
        );
      }
    }

    return { received: true };
  }

  /**
   * Credit advertiser account after successful payment
   */
  private async creditAdvertiserAccount(advertiserId: string, amount: number, paymentId: string) {
    const advertiser = await this.prisma.advertiser.findUnique({ where: { id: advertiserId } });
    if (!advertiser) {
      this.logger.error(`Advertiser ${advertiserId} not found for payment ${paymentId}`);
      return;
    }

    await this.prisma.$transaction([
      this.prisma.advertiser.update({
        where: { id: advertiserId },
        data: { balance: { increment: amount } },
      }),
      this.prisma.adTransaction.create({
        data: {
          advertiserId,
          type: 'deposit',
          amount,
          balance: advertiser.balance + amount,
          description: 'Stripe payment',
          reference: paymentId,
        },
      }),
    ]);

    this.logger.log(`Credited $${amount} to advertiser ${advertiserId}`);
  }

  /**
   * Get your total platform revenue
   */
  async getPlatformRevenue(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalDeposits, totalSpent, earnings] = await Promise.all([
      this.prisma.adTransaction.aggregate({
        where: { type: 'deposit', createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.adTransaction.aggregate({
        where: { type: 'spend', createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.publisherEarnings.aggregate({
        where: { date: { gte: startDate } },
        _sum: { earnings: true },
      }),
    ]);

    return {
      depositsReceived: totalDeposits._sum.amount || 0,
      adSpend: Math.abs(totalSpent._sum.amount || 0),
      totalEarnings: earnings._sum.earnings || 0,
      period: `${days} days`,
    };
  }
}

