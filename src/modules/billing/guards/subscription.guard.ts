/**
 * Subscription Guard
 * 
 * Checks if user's subscription allows access to specific features
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BillingService } from '../billing.service';
import { UserRole } from '@prisma/client';
import { SetMetadata } from '@nestjs/common';

// Decorator keys
export const REQUIRES_FEATURE_KEY = 'billing:feature';
export const REQUIRES_PLAN_KEY = 'billing:plan';

// Decorators
export const RequiresFeature = (feature: string) => 
  SetMetadata(REQUIRES_FEATURE_KEY, feature);

export const RequiresPlan = (...plans: string[]) => 
  SetMetadata(REQUIRES_PLAN_KEY, plans);

@Injectable()
export class BillingSubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(BillingSubscriptionGuard.name);

  constructor(
    private reflector: Reflector,
    private billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(REQUIRES_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPlans = this.reflector.getAllAndOverride<string[]>(REQUIRES_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No restrictions
    if (!requiredFeature && !requiredPlans) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admins bypass all checks
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const subscription = await this.billingService.getUserSubscription(user.id);
    const plan = subscription?.plan;

    // Check feature access
    if (requiredFeature) {
      const hasFeature = await this.billingService.hasFeature(user.id, requiredFeature as any);
      if (!hasFeature) {
        this.logger.warn(`User ${user.email} lacks feature: ${requiredFeature}`);
        throw new ForbiddenException(
          `Your subscription does not include ${requiredFeature}. Please upgrade your plan.`
        );
      }
    }

    // Check plan requirement
    if (requiredPlans && requiredPlans.length > 0) {
      if (!plan || !requiredPlans.includes(plan.name)) {
        this.logger.warn(
          `User ${user.email} on plan ${plan?.name || 'free'} tried to access ${requiredPlans.join(', ')} feature`
        );
        throw new ForbiddenException(
          `This feature requires one of these plans: ${requiredPlans.join(', ')}. Please upgrade.`
        );
      }
    }

    return true;
  }
}

