/**
 * Billing Service
 * 
 * Manages subscriptions, pricing plans, and usage tracking
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole, SubscriptionStatus, BillingCycle } from '@prisma/client';

// Default pricing plans to seed
export const DEFAULT_PRICING_PLANS = [
  {
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for personal blogs and getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxPosts: 10,
    maxPages: 5,
    maxProducts: 0,
    maxCourses: 0,
    maxStudents: 0,
    storageGb: 0.5,
    bandwidthGb: 5,
    hasEcommerce: false,
    hasLms: false,
    hasAi: false,
    hasPrioritySupport: false,
    hasCustomDomain: false,
    hasWhiteLabel: false,
    hasApi: false,
    hasAnalytics: false,
    hasSeo: true,
    hasMultilingual: false,
    allowedRoles: ['USER', 'AUTHOR'],
    sortOrder: 0,
  },
  {
    name: 'starter',
    displayName: 'Starter',
    description: 'Great for small businesses and growing blogs',
    monthlyPrice: 19,
    yearlyPrice: 190, // ~2 months free
    maxUsers: 3,
    maxPosts: 100,
    maxPages: 25,
    maxProducts: 25,
    maxCourses: 0,
    maxStudents: 0,
    storageGb: 5,
    bandwidthGb: 50,
    hasEcommerce: true,
    hasLms: false,
    hasAi: false,
    hasPrioritySupport: false,
    hasCustomDomain: true,
    hasWhiteLabel: false,
    hasApi: true,
    hasAnalytics: true,
    hasSeo: true,
    hasMultilingual: false,
    allowedRoles: ['USER', 'AUTHOR', 'EDITOR'],
    sortOrder: 1,
  },
  {
    name: 'professional',
    displayName: 'Professional',
    description: 'For established businesses and content creators',
    monthlyPrice: 49,
    yearlyPrice: 490, // ~2 months free
    maxUsers: 10,
    maxPosts: -1, // unlimited
    maxPages: -1,
    maxProducts: 500,
    maxCourses: 10,
    maxStudents: 500,
    storageGb: 25,
    bandwidthGb: 250,
    hasEcommerce: true,
    hasLms: true,
    hasAi: true,
    hasPrioritySupport: true,
    hasCustomDomain: true,
    hasWhiteLabel: false,
    hasApi: true,
    hasAnalytics: true,
    hasSeo: true,
    hasMultilingual: true,
    allowedRoles: ['USER', 'AUTHOR', 'EDITOR', 'INSTRUCTOR'],
    isPopular: true,
    sortOrder: 2,
  },
  {
    name: 'business',
    displayName: 'Business',
    description: 'Advanced features for growing organizations',
    monthlyPrice: 99,
    yearlyPrice: 990,
    maxUsers: 25,
    maxPosts: -1,
    maxPages: -1,
    maxProducts: -1,
    maxCourses: 50,
    maxStudents: 2500,
    storageGb: 100,
    bandwidthGb: 1000,
    hasEcommerce: true,
    hasLms: true,
    hasAi: true,
    hasPrioritySupport: true,
    hasCustomDomain: true,
    hasWhiteLabel: true,
    hasApi: true,
    hasAnalytics: true,
    hasSeo: true,
    hasMultilingual: true,
    allowedRoles: ['USER', 'AUTHOR', 'EDITOR', 'INSTRUCTOR', 'ADMIN'],
    sortOrder: 3,
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Unlimited access with dedicated support and SLA',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    maxUsers: -1,
    maxPosts: -1,
    maxPages: -1,
    maxProducts: -1,
    maxCourses: -1,
    maxStudents: -1,
    storageGb: 500,
    bandwidthGb: 5000,
    hasEcommerce: true,
    hasLms: true,
    hasAi: true,
    hasPrioritySupport: true,
    hasCustomDomain: true,
    hasWhiteLabel: true,
    hasApi: true,
    hasAnalytics: true,
    hasSeo: true,
    hasMultilingual: true,
    allowedRoles: ['USER', 'AUTHOR', 'EDITOR', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
    sortOrder: 4,
  },
];

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Seed default pricing plans
   */
  async seedPlans(): Promise<void> {
    for (const plan of DEFAULT_PRICING_PLANS) {
      await this.prisma.pricingPlan.upsert({
        where: { name: plan.name },
        update: plan,
        create: plan,
      });
    }
    this.logger.log('Pricing plans seeded successfully');
  }

  /**
   * Get all active pricing plans
   */
  async getPlans() {
    return this.prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get user's subscription
   */
  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      // Return free plan by default
      const freePlan = await this.prisma.pricingPlan.findUnique({
        where: { name: 'free' },
      });
      return { plan: freePlan, status: 'FREE' as const };
    }

    return subscription;
  }

  /**
   * Subscribe user to a plan
   */
  async subscribe(
    userId: string,
    planName: string,
    billingCycle: BillingCycle = BillingCycle.MONTHLY,
  ) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { name: planName },
    });

    if (!plan) {
      throw new NotFoundException(`Plan "${planName}" not found`);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === BillingCycle.YEARLY ? 12 : 1));

    return this.prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        billingCycle,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId: plan.id,
        billingCycle,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      include: { plan: true },
    });
  }

  /**
   * Check if user has access to a feature
   */
  async hasFeature(userId: string, feature: keyof typeof featureMap): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    const plan = subscription.plan;

    if (!plan) return false;

    const featureKey = featureMap[feature];
    return (plan as any)[featureKey] ?? false;
  }

  /**
   * Check if user can create more of a resource type
   */
  async canCreate(userId: string, resourceType: 'posts' | 'pages' | 'products' | 'courses'): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
  }> {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      // Free plan limits
      const freeLimits = { posts: 10, pages: 5, products: 0, courses: 0 };
      return { allowed: freeLimits[resourceType] > 0, remaining: freeLimits[resourceType], limit: freeLimits[resourceType] };
    }

    const plan = subscription.plan;
    const limitMap = {
      posts: { limit: plan.maxPosts, used: subscription.postsUsed },
      pages: { limit: plan.maxPages, used: subscription.pagesUsed },
      products: { limit: plan.maxProducts, used: subscription.productsUsed },
      courses: { limit: plan.maxCourses, used: subscription.coursesUsed },
    };

    const { limit, used } = limitMap[resourceType];

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1 };
    }

    const remaining = Math.max(0, limit - used);
    return { allowed: remaining > 0, remaining, limit };
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(userId: string, resourceType: 'posts' | 'pages' | 'products' | 'courses'): Promise<void> {
    const fieldMap = {
      posts: 'postsUsed',
      pages: 'pagesUsed',
      products: 'productsUsed',
      courses: 'coursesUsed',
    };

    await this.prisma.userSubscription.updateMany({
      where: { userId },
      data: { [fieldMap[resourceType]]: { increment: 1 } },
    });
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string) {
    return this.prisma.userSubscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
      include: { plan: true },
    });
  }
}

// Feature mapping for hasFeature check
const featureMap = {
  ecommerce: 'hasEcommerce',
  lms: 'hasLms',
  ai: 'hasAi',
  prioritySupport: 'hasPrioritySupport',
  customDomain: 'hasCustomDomain',
  whiteLabel: 'hasWhiteLabel',
  api: 'hasApi',
  analytics: 'hasAnalytics',
  seo: 'hasSeo',
  multilingual: 'hasMultilingual',
} as const;

