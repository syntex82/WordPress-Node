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
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Convert Decimal fields to numbers for JSON serialization
    return plans.map((plan) => ({
      ...plan,
      monthlyPrice: plan.monthlyPrice ? Number(plan.monthlyPrice) : 0,
      yearlyPrice: plan.yearlyPrice ? Number(plan.yearlyPrice) : 0,
    }));
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return {
      ...plan,
      monthlyPrice: plan.monthlyPrice ? Number(plan.monthlyPrice) : 0,
      yearlyPrice: plan.yearlyPrice ? Number(plan.yearlyPrice) : 0,
    };
  }

  async getPlanBySlug(slug: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return {
      ...plan,
      monthlyPrice: plan.monthlyPrice ? Number(plan.monthlyPrice) : 0,
      yearlyPrice: plan.yearlyPrice ? Number(plan.yearlyPrice) : 0,
    };
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
      throw new BadRequestException(
        `No Stripe price configured for ${plan.name} plan (${dto.billingCycle} billing). ` +
          `Please configure Stripe Price IDs in Admin > Settings > Subscription Plans. ` +
          `You need to create products in Stripe Dashboard first and copy the Price IDs.`,
      );
    }

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      throw new BadRequestException(
        `Invalid Stripe Price ID format for ${plan.name} plan. ` +
          `Price IDs should start with "price_". Current value: "${priceId}"`,
      );
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

  /**
   * Create a one-time license purchase checkout session for NodePress
   * Price: £299 for lifetime access to the source code
   */
  async createLicenseCheckout(email: string, successUrl?: string, cancelUrl?: string) {
    const stripe = await this.getStripe();

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: 29900, // £299 in pence
            product_data: {
              name: 'NodePress CMS License',
              description: 'Lifetime access to NodePress CMS source code with 1 year of updates and support',
              images: ['https://nodepress.co.uk/images/nodepress-icon.svg'],
            },
          },
          quantity: 1,
        },
      ],
      success_url:
        successUrl ||
        `${process.env.FRONTEND_URL || 'https://nodepress.co.uk'}/license-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${process.env.FRONTEND_URL || 'https://nodepress.co.uk'}/#pricing`,
      metadata: {
        type: 'license_purchase',
        email,
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
    const stripe = await this.getStripe();

    // Get subscription from Stripe
    if (!session.subscription) return;
    const stripeSubscription = (await stripe.subscriptions.retrieve(
      session.subscription as string,
    )) as Stripe.Subscription;

    // Try to get userId from metadata, or find user by customer email
    let userId = session.metadata?.userId || stripeSubscription.metadata?.userId;

    if (!userId && session.customer_email) {
      const user = await this.prisma.user.findUnique({
        where: { email: session.customer_email },
      });
      if (user) userId = user.id;
    }

    // If still no user, try to find by customer ID
    if (!userId && session.customer) {
      const existingSub = await this.prisma.subscription.findFirst({
        where: { stripeCustomerId: session.customer as string },
      });
      if (existingSub) userId = existingSub.userId;
    }

    if (!userId) {
      console.warn('Webhook: Could not determine userId for checkout session', session.id);
      return;
    }

    // Determine plan from metadata or from the product
    let planId = session.metadata?.planId || stripeSubscription.metadata?.planId;

    if (!planId) {
      // Try to find plan by matching Stripe price ID
      const priceId = stripeSubscription.items.data[0]?.price?.id;
      if (priceId) {
        const plan = await this.prisma.subscriptionPlan.findFirst({
          where: {
            OR: [{ stripePriceIdMonthly: priceId }, { stripePriceIdYearly: priceId }],
          },
        });
        if (plan) planId = plan.id;
      }
    }

    // If still no plan, try to match by product name
    if (!planId) {
      const productId = stripeSubscription.items.data[0]?.price?.product as string;
      if (productId) {
        const product = await stripe.products.retrieve(productId);
        const planName = product.name?.toLowerCase();
        if (planName) {
          const plan = await this.prisma.subscriptionPlan.findFirst({
            where: {
              slug: { in: ['pro', 'business', 'enterprise'] },
              name: { contains: planName, mode: 'insensitive' },
            },
          });
          if (plan) planId = plan.id;
        }
      }
    }

    if (!planId) {
      console.warn('Webhook: Could not determine planId for checkout session', session.id);
      return;
    }

    const periodStart = (stripeSubscription as any).current_period_start;
    const periodEnd = (stripeSubscription as any).current_period_end;

    // Determine billing cycle from subscription interval
    const interval = stripeSubscription.items.data[0]?.price?.recurring?.interval;
    const billingCycle = interval === 'year' ? 'YEARLY' : 'MONTHLY';

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: 'ACTIVE',
        billingCycle,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: session.customer as string,
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
      },
      update: {
        planId,
        status: 'ACTIVE',
        billingCycle,
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
        description: 'Viewer Account - Perfect for learners and community members',
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxUsers: 1,
        maxStorageMb: 100,
        maxProjects: 0,
        maxCourses: 0, // Can enroll, not create
        maxProducts: 0,
        features: [
          'Enroll in free courses',
          'Access community groups',
          'Send & receive messages',
          'View public content',
          'Personal profile',
          'Course certificates',
        ],
        isActive: true,
        displayOrder: 0,
      },
      {
        name: 'Pro',
        slug: 'pro',
        description: 'Author & Editor Account - Create content and teach',
        monthlyPrice: 29,
        yearlyPrice: 290,
        maxUsers: 5,
        maxStorageMb: 10240,
        maxProjects: 10,
        maxCourses: 10,
        maxProducts: 50,
        features: [
          'Everything in Free',
          'Create & publish blog posts',
          'Create & sell courses (LMS)',
          'Create & manage groups',
          'Advanced messaging features',
          'Media library (10GB storage)',
          'Course analytics',
          'Student management',
          'Custom certificates',
          'Priority email support',
        ],
        isActive: true,
        isFeatured: true,
        badgeText: 'Most Popular',
        displayOrder: 1,
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'Admin Account - Full platform control',
        monthlyPrice: 99,
        yearlyPrice: 990,
        maxUsers: 25,
        maxStorageMb: 102400,
        maxCourses: null,
        maxProducts: null,
        features: [
          'Everything in Pro',
          'Full admin dashboard access',
          'Manage all users & roles',
          'eCommerce & product sales',
          'Advanced analytics & reports',
          'SEO management tools',
          'Plugin & theme management',
          'Unlimited courses & products',
          'API access',
          'Custom domain support',
          '100GB storage',
          'Priority support',
        ],
        isActive: true,
        badgeText: 'Full Control',
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
          'Everything in Business',
          'Unlimited users & storage',
          'White-label branding',
          'Custom integrations',
          'Dedicated account manager',
          'SLA guarantee (99.9% uptime)',
          'On-boarding & training',
          'Custom feature development',
          'Phone & video support',
        ],
        isActive: true,
        badgeText: 'Enterprise',
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

  /**
   * Get diagnostic information for troubleshooting Stripe issues
   */
  async getDiagnosticInfo() {
    // Get all plans with their Stripe configuration
    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    // Check Stripe configuration
    let stripeConfigured = false;
    let stripeError: string | null = null;

    try {
      const stripe = await this.getStripe();
      stripeConfigured = !!stripe;
    } catch (error: any) {
      stripeError = error.message;
    }

    // Check each plan's Stripe configuration
    const planDiagnostics = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      isActive: plan.isActive,
      monthlyPrice: Number(plan.monthlyPrice),
      yearlyPrice: Number(plan.yearlyPrice),
      hasMonthlyPriceId: !!plan.stripePriceIdMonthly,
      hasYearlyPriceId: !!plan.stripePriceIdYearly,
      monthlyPriceIdValid: plan.stripePriceIdMonthly?.startsWith('price_') ?? false,
      yearlyPriceIdValid: plan.stripePriceIdYearly?.startsWith('price_') ?? false,
      issues: [] as string[],
    }));

    // Identify issues for each plan
    for (const diag of planDiagnostics) {
      if (diag.monthlyPrice > 0 && !diag.hasMonthlyPriceId) {
        diag.issues.push('Missing Stripe monthly price ID');
      }
      if (diag.yearlyPrice > 0 && !diag.hasYearlyPriceId) {
        diag.issues.push('Missing Stripe yearly price ID');
      }
      if (diag.hasMonthlyPriceId && !diag.monthlyPriceIdValid) {
        diag.issues.push('Invalid monthly price ID format (should start with "price_")');
      }
      if (diag.hasYearlyPriceId && !diag.yearlyPriceIdValid) {
        diag.issues.push('Invalid yearly price ID format (should start with "price_")');
      }
    }

    return {
      stripe: {
        configured: stripeConfigured,
        error: stripeError,
      },
      plans: planDiagnostics,
      summary: {
        totalPlans: plans.length,
        activePlans: plans.filter((p) => p.isActive).length,
        plansWithIssues: planDiagnostics.filter((p) => p.issues.length > 0).length,
        paidPlansWithoutStripe: planDiagnostics.filter(
          (p) =>
            (p.monthlyPrice > 0 || p.yearlyPrice > 0) &&
            !p.hasMonthlyPriceId &&
            !p.hasYearlyPriceId,
        ).length,
      },
      instructions: [
        'To fix Stripe issues:',
        '1. Go to Stripe Dashboard > Products and create products for each paid plan',
        '2. Copy the Price IDs (price_xxx) for monthly and yearly prices',
        '3. Update each plan via Admin > Settings > Subscription or API',
        '4. Test with Stripe test cards (4242 4242 4242 4242)',
      ],
    };
  }

  /**
   * Sync prices from Stripe - fetches all prices and matches them to plans by product ID
   */
  async syncStripePrices() {
    const stripe = await this.getStripe();

    // Fetch all prices from Stripe
    const prices = await stripe.prices.list({ limit: 100, active: true });

    // Get all plans
    const plans = await this.prisma.subscriptionPlan.findMany();

    const updates: Array<{ planName: string; monthlyPriceId?: string; yearlyPriceId?: string }> =
      [];

    for (const plan of plans) {
      if (!plan.stripeProductId) continue;

      // Find prices for this product
      const productPrices = prices.data.filter((p) => p.product === plan.stripeProductId);

      let monthlyPriceId: string | undefined;
      let yearlyPriceId: string | undefined;

      for (const price of productPrices) {
        if (price.recurring?.interval === 'month') {
          monthlyPriceId = price.id;
        } else if (price.recurring?.interval === 'year') {
          yearlyPriceId = price.id;
        }
      }

      if (monthlyPriceId || yearlyPriceId) {
        await this.prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: {
            ...(monthlyPriceId && { stripePriceIdMonthly: monthlyPriceId }),
            ...(yearlyPriceId && { stripePriceIdYearly: yearlyPriceId }),
          },
        });
        updates.push({ planName: plan.name, monthlyPriceId, yearlyPriceId });
      }
    }

    return {
      message: 'Synced prices from Stripe',
      updates,
      totalPricesFound: prices.data.length,
    };
  }

  /**
   * Create Stripe prices for products and update plans
   * Supports both: 1 product with 2 prices, or 2 products with 1 price each
   */
  async createStripePricesForProducts(
    planConfigs: Array<{
      slug: string;
      monthlyProductId?: string;
      yearlyProductId?: string;
      productId?: string;
      monthlyPrice: number;
      yearlyPrice: number;
    }>,
  ) {
    const stripe = await this.getStripe();
    const results: Array<{
      slug: string;
      monthlyPriceId?: string;
      yearlyPriceId?: string;
      error?: string;
    }> = [];

    for (const config of planConfigs) {
      try {
        const plan = await this.prisma.subscriptionPlan.findUnique({
          where: { slug: config.slug },
        });

        if (!plan) {
          results.push({ slug: config.slug, error: 'Plan not found' });
          continue;
        }

        let monthlyPriceId: string | undefined;
        let yearlyPriceId: string | undefined;

        // Handle monthly price
        const monthlyProductId = config.monthlyProductId || config.productId;
        if (monthlyProductId && config.monthlyPrice > 0) {
          const monthlyPrice = await stripe.prices.create({
            product: monthlyProductId,
            unit_amount: Math.round(config.monthlyPrice * 100),
            currency: 'gbp',
            recurring: { interval: 'month' },
          });
          monthlyPriceId = monthlyPrice.id;
        }

        // Handle yearly price
        const yearlyProductId = config.yearlyProductId || config.productId;
        if (yearlyProductId && config.yearlyPrice > 0) {
          const yearlyPrice = await stripe.prices.create({
            product: yearlyProductId,
            unit_amount: Math.round(config.yearlyPrice * 100),
            currency: 'gbp',
            recurring: { interval: 'year' },
          });
          yearlyPriceId = yearlyPrice.id;
        }

        // Update plan with price IDs
        await this.prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: {
            ...(monthlyPriceId && { stripePriceIdMonthly: monthlyPriceId }),
            ...(yearlyPriceId && { stripePriceIdYearly: yearlyPriceId }),
          },
        });

        results.push({
          slug: config.slug,
          monthlyPriceId,
          yearlyPriceId,
        });
      } catch (error: any) {
        results.push({ slug: config.slug, error: error.message });
      }
    }

    return { message: 'Created Stripe prices', results };
  }
}
