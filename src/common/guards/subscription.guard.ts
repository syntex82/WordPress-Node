/**
 * Subscription Guard
 * Ensures user has an active subscription (any paid plan)
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { REQUIRES_SUBSCRIPTION_KEY } from '../decorators/subscription.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresSubscription = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no subscription requirement, allow access
    if (!requiresSubscription) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('SubscriptionGuard: No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // SUPER_ADMIN and ADMIN bypass subscription checks
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });

    if (!subscription) {
      this.logger.debug(`SubscriptionGuard: No subscription for user ${user.id}`);
      throw new ForbiddenException(
        'A paid subscription is required to access this feature. Please upgrade your plan.',
      );
    }

    // Check if subscription is active
    const activeStatuses = ['ACTIVE', 'TRIALING'];
    if (!activeStatuses.includes(subscription.status)) {
      this.logger.debug(`SubscriptionGuard: Inactive subscription status ${subscription.status}`);
      throw new ForbiddenException(
        `Your subscription is ${subscription.status.toLowerCase()}. Please update your payment method.`,
      );
    }

    // Check if it's a paid plan (not free)
    if (Number(subscription.plan.monthlyPrice) === 0) {
      throw new ForbiddenException(
        'A paid subscription is required to access this feature. Please upgrade your plan.',
      );
    }

    // Attach subscription to request for later use
    request.subscription = subscription;

    return true;
  }
}
