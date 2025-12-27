import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../settings/system-config.service';
import { CreatePlanDto, UpdatePlanDto, CreateCheckoutDto } from './dto/subscription.dto';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private systemConfig: SystemConfigService,
  ) {
    this.initStripe();
  }

  private async initStripe() {
    try {
      const config = await this.systemConfig.getStripeConfig();
      if (config?.secretKey) {
        this.stripe = new Stripe(config.secretKey);
      }
    } catch {
      console.log('Stripe not configured for subscriptions');
    }
  }

  private async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      await this.initStripe();
    }
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    return this.stripe;
  }

  // ==================== PLANS ====================

  async getPlans(includeInactive = false) {
    return this.prisma.subscriptionPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async getPlanBySlug(slug: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(dto: CreatePlanDto) {
    return this.prisma.subscriptionPlan.create({
      data: {
        ...dto,
        features: dto.features || [],
      },
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.getPlanById(id);
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: dto,
    });
  }

  async deletePlan(id: string) {
    // Check if plan has active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });
    if (activeSubscriptions > 0) {
      throw new BadRequestException('Cannot delete plan with active subscriptions');
    }
    return this.prisma.subscriptionPlan.delete({ where: { id } });
  }

  // ==================== SUBSCRIPTIONS ====================

  async getUserSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutDto) {
    const stripe = await this.getStripe();
    const plan = await this.getPlanById(dto.planId);

    // Get or create Stripe customer
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let customerId: string;
    const existingSub = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSub?.stripeCustomerId) {
      customerId = existingSub.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    // Get the appropriate price ID
    const priceId =
      dto.billingCycle === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new BadRequestException(`No Stripe price configured for ${dto.billingCycle} billing`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        dto.successUrl ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        dto.cancelUrl ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/subscription/canceled`,
      metadata: {
        userId,
        planId: plan.id,
        billingCycle: dto.billingCycle,
      },
      subscription_data: {
        metadata: {
          userId,
          planId: plan.id,
        },
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async createBillingPortalSession(userId: string) {
    const stripe = await this.getStripe();
    const subscription = await this.getUserSubscription(userId);

    if (!subscription?.stripeCustomerId) {
      throw new BadRequestException('No active subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/settings`,
    });

    return { url: session.url };
  }

  async cancelSubscription(userId: string) {
    const stripe = await this.getStripe();
    const subscription = await this.getUserSubscription(userId);

    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    // Cancel at period end (user keeps access until end of billing period)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
    });
  }

  // ==================== STRIPE WEBHOOKS ====================

  async handleWebhook(payload: Buffer, signature: string) {
    const stripe = await this.getStripe();
    const config = await this.systemConfig.getStripeConfig();

    if (!config?.webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
    } catch (_err) {
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { userId, planId, billingCycle } = session.metadata || {};
    if (!userId || !planId) return;

    const stripe = await this.getStripe();
    const stripeSubscription = (await stripe.subscriptions.retrieve(
      session.subscription as string,
    )) as Stripe.Subscription;

    const periodStart = (stripeSubscription as any).current_period_start;
    const periodEnd = (stripeSubscription as any).current_period_end;

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: 'ACTIVE',
        billingCycle: billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: session.customer as string,
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
      },
      update: {
        planId,
        status: 'ACTIVE',
        billingCycle: billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: session.customer as string,
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const { userId } = stripeSubscription.metadata || {};
    if (!userId) return;

    const periodStart = (stripeSubscription as any).current_period_start;
    const periodEnd = (stripeSubscription as any).current_period_end;

    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      trialing: 'TRIALING',
      paused: 'PAUSED',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE_EXPIRED',
    };

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: (statusMap[stripeSubscription.status] || 'ACTIVE') as any,
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const { userId } = stripeSubscription.metadata || {};
    if (!userId) return;

    await this.prisma.subscription.update({
      where: { userId },
      data: { status: 'CANCELED', canceledAt: new Date() },
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' },
      });
    }
  }

  // ==================== FEATURE CHECKS ====================

  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return false;
    const features = subscription.plan.features as string[];
    return features.includes(feature);
  }

  async checkLimit(
    userId: string,
    limitType: 'users' | 'storage' | 'projects' | 'courses' | 'products',
    currentCount: number,
  ): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return false;

    const plan = subscription.plan;
    const limits: Record<string, number | null> = {
      users: plan.maxUsers,
      storage: plan.maxStorageMb,
      projects: plan.maxProjects,
      courses: plan.maxCourses,
      products: plan.maxProducts,
    };

    const limit = limits[limitType];
    if (limit === null) return true; // Unlimited
    return currentCount < limit;
  }

  // ==================== SEED DEFAULT PLANS ====================

  async seedDefaultPlans() {
    const existingPlans = await this.prisma.subscriptionPlan.count();
    if (existingPlans > 0) return { message: 'Plans already exist' };

    const plans = [
      {
        name: 'Free',
        slug: 'free',
        description: 'Perfect for getting started',
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxUsers: 1,
        maxStorageMb: 100,
        maxProjects: 1,
        maxCourses: 1,
        maxProducts: 5,
        features: ['basic_cms', 'media_library'],
        isActive: true,
        displayOrder: 0,
      },
      {
        name: 'Pro',
        slug: 'pro',
        description: 'For professionals and small teams',
        monthlyPrice: 19,
        yearlyPrice: 190,
        maxUsers: 5,
        maxStorageMb: 10240,
        maxProjects: 10,
        maxCourses: 10,
        maxProducts: 100,
        features: ['basic_cms', 'media_library', 'video_calls', 'lms', 'ecommerce', 'analytics'],
        isActive: true,
        isFeatured: true,
        badgeText: 'Most Popular',
        displayOrder: 1,
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'For growing businesses',
        monthlyPrice: 49,
        yearlyPrice: 490,
        maxUsers: 25,
        maxStorageMb: 102400,
        maxCourses: null,
        maxProducts: null,
        features: [
          'basic_cms',
          'media_library',
          'video_calls',
          'lms',
          'ecommerce',
          'analytics',
          'api_access',
          'priority_support',
          'custom_domain',
        ],
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Custom solutions for large organizations',
        monthlyPrice: 199,
        yearlyPrice: 1990,
        maxUsers: null,
        maxStorageMb: null,
        features: [
          'basic_cms',
          'media_library',
          'video_calls',
          'lms',
          'ecommerce',
          'analytics',
          'api_access',
          'priority_support',
          'custom_domain',
          'sla',
          'dedicated_support',
          'custom_integrations',
        ],
        isActive: true,
        badgeText: 'Best Value',
        displayOrder: 3,
      },
    ];

    for (const plan of plans) {
      await this.prisma.subscriptionPlan.create({ data: plan });
    }

    return { message: 'Default plans created', count: plans.length };
  }

  /**
   * Activate all existing plans (fix for plans created without isActive)
   */
  async activateAllPlans() {
    const result = await this.prisma.subscriptionPlan.updateMany({
      data: { isActive: true },
    });
    return { message: 'All plans activated', count: result.count };
  }

  /**
   * Get the site's current subscription (for the primary admin/owner)
   * In a single-tenant setup, this returns the first admin's subscription
   * In a multi-tenant setup, this would be based on the domain/tenant
   */
  async getSiteSubscription() {
    // Find the first admin user (site owner)
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });

    if (!admin) {
      return null;
    }

    // Get their subscription
    return this.prisma.subscription.findUnique({
      where: { userId: admin.id },
      include: { plan: true },
    });
  }

  /**
   * Check if the site has access to a specific feature
   */
  async siteHasFeature(feature: string): Promise<boolean> {
    const subscription = await this.getSiteSubscription();
    if (!subscription || subscription.status !== 'ACTIVE') {
      return false;
    }
    const features = (subscription.plan?.features as string[]) || [];
    return features.includes(feature);
  }

  /**
   * Get site subscription status for public display
   */
  async getSiteSubscriptionStatus() {
    const subscription = await this.getSiteSubscription();
    const plans = await this.getPlans();

    return {
      hasActiveSubscription: subscription?.status === 'ACTIVE',
      currentPlan: subscription?.plan || null,
      currentPlanTier: subscription?.plan?.name || 'Free',
      availablePlans: plans,
    };
  }
}
