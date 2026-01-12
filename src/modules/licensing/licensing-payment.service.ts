/**
 * Licensing Payment Service
 * Handles Stripe payments for NodePress licenses
 */

import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../settings/system-config.service';
import { LicensingService } from './licensing.service';
import { LicenseTier, LICENSE_TIER_CONFIG } from './dto';
import Stripe from 'stripe';

@Injectable()
export class LicensingPaymentService implements OnModuleInit {
  private readonly logger = new Logger(LicensingPaymentService.name);
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private systemConfig: SystemConfigService,
    private licensingService: LicensingService,
  ) {}

  async onModuleInit() {
    await this.initializeStripe();
  }

  private async initializeStripe(): Promise<void> {
    try {
      const config = await this.systemConfig.getStripeConfig();
      if (config.secretKey) {
        this.stripe = new Stripe(config.secretKey);
        this.logger.log('Stripe initialized for licensing payments');
      }
    } catch (_error) {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (secretKey) {
        this.stripe = new Stripe(secretKey);
        this.logger.log('Stripe initialized from env for licensing');
      }
    }
  }

  /**
   * Create a checkout session for license purchase
   */
  async createCheckoutSession(params: {
    tier: LicenseTier;
    email: string;
    customerName?: string;
    companyName?: string;
    successUrl?: string;
    cancelUrl?: string;
  }) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const tierConfig = LICENSE_TIER_CONFIG[params.tier];
    if (!tierConfig) {
      throw new BadRequestException('Invalid license tier');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Create or get customer
    const customers = await this.stripe.customers.list({
      email: params.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.customerName,
        metadata: {
          companyName: params.companyName || '',
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tierConfig.price * 100, // Convert to cents
            product_data: {
              name: `NodePress ${tierConfig.name} License`,
              description: `${tierConfig.maxSites === -1 ? 'Unlimited' : tierConfig.maxSites} site(s), ${tierConfig.lifetime ? 'Lifetime' : '1 Year'} updates`,
              metadata: {
                tier: params.tier,
              },
            },
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl || `${baseUrl}/license/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl || `${baseUrl}/pricing`,
      metadata: {
        type: 'license_purchase',
        tier: params.tier,
        email: params.email,
        customerName: params.customerName || '',
        companyName: params.companyName || '',
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Handle successful license payment from webhook
   */
  async handlePaymentSuccess(session: Stripe.Checkout.Session) {
    const metadata = session.metadata || {};
    
    if (metadata.type !== 'license_purchase') {
      return; // Not a license purchase
    }

    const tier = metadata.tier as LicenseTier;
    const email = metadata.email;

    if (!tier || !email) {
      this.logger.error('Missing metadata in license payment session');
      return;
    }

    // Create the license
    const license = await this.licensingService.createLicense({
      email,
      tier,
      customerName: metadata.customerName,
      companyName: metadata.companyName,
      orderId: session.id,
    });

    this.logger.log(`License created from payment: ${license.id} (${tier}) for ${email}`);
    return license;
  }

  /**
   * Handle webhook events for licensing
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

    // Handle checkout session completed for license purchases
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === 'license_purchase') {
        await this.handlePaymentSuccess(session);
      }
    }

    return { received: true };
  }

  /**
   * Get license pricing for display
   */
  getLicensePricing() {
    return Object.entries(LICENSE_TIER_CONFIG).map(([tier, config]) => ({
      tier,
      name: config.name,
      price: config.price,
      maxSites: config.maxSites === -1 ? 'Unlimited' : config.maxSites,
      features: config.features,
      lifetime: config.lifetime,
    }));
  }

  /**
   * Create a license renewal checkout session
   */
  async createRenewalCheckoutSession(licenseKey: string, successUrl?: string, cancelUrl?: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const license = await this.prisma.license.findUnique({
      where: { licenseKey },
    });

    if (!license) {
      throw new BadRequestException('License not found');
    }

    const tierConfig = LICENSE_TIER_CONFIG[license.tier as LicenseTier];
    if (tierConfig.lifetime) {
      throw new BadRequestException('Lifetime licenses do not need renewal');
    }

    // Renewal is 80% of original price
    const renewalPrice = Math.round(tierConfig.price * 0.8);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: license.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: renewalPrice * 100,
            product_data: {
              name: `NodePress ${tierConfig.name} License Renewal`,
              description: '1 Year extension',
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${baseUrl}/license/renewal-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/account/licenses`,
      metadata: {
        type: 'license_renewal',
        licenseKey,
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }
}

