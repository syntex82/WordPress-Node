/**
 * Plan Guard
 * Ensures user has one of the required subscription plans
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
import { REQUIRED_PLAN_KEY } from '../decorators/subscription.decorator';
import { UserRole } from '@prisma/client';

// Plan hierarchy for "minimum plan" checks
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  pro: 1,
  business: 2,
  enterprise: 3,
};

@Injectable()
export class PlanGuard implements CanActivate {
  private readonly logger = new Logger(PlanGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(REQUIRED_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no plan requirement, allow access
    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('PlanGuard: No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // Admins bypass plan checks
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });

    // Treat no subscription as "free" plan
    const userPlan = subscription?.plan?.slug || 'free';
    const userPlanLevel = PLAN_HIERARCHY[userPlan] ?? 0;

    // Check if subscription is active (if they have one)
    if (subscription) {
      const activeStatuses = ['ACTIVE', 'TRIALING'];
      if (!activeStatuses.includes(subscription.status)) {
        throw new ForbiddenException(
          `Your subscription is ${subscription.status.toLowerCase()}. Please update your payment method.`,
        );
      }
    }

    // Check if user's plan meets the minimum required
    const minRequiredLevel = Math.min(...requiredPlans.map((p) => PLAN_HIERARCHY[p] ?? 999));

    if (userPlanLevel < minRequiredLevel) {
      const requiredPlanNames = requiredPlans.join(' or ');
      this.logger.debug(
        `PlanGuard: User ${user.id} on ${userPlan} plan, requires ${requiredPlanNames}`,
      );
      throw new ForbiddenException(
        `This feature requires a ${requiredPlanNames} plan or higher. Your current plan: ${userPlan}.`,
      );
    }

    // Attach subscription to request for later use
    if (subscription) {
      request.subscription = subscription;
    }

    return true;
  }
}
