/**
 * Feature Guard
 * Ensures user's subscription includes the required features
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
import { REQUIRED_FEATURES_KEY } from '../decorators/subscription.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class FeatureGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(REQUIRED_FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no features required, allow access
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('FeatureGuard: No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // Admins and Super Admins bypass feature checks
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });

    if (!subscription) {
      this.logger.debug(`FeatureGuard: No subscription for user ${user.id}`);
      throw new ForbiddenException(
        `This feature requires a subscription with: ${requiredFeatures.join(', ')}. Please upgrade your plan.`,
      );
    }

    // Check if subscription is active
    const activeStatuses = ['ACTIVE', 'TRIALING'];
    if (!activeStatuses.includes(subscription.status)) {
      throw new ForbiddenException(
        `Your subscription is ${subscription.status.toLowerCase()}. Please update your payment method.`,
      );
    }

    // Check if plan has all required features
    const planFeatures = (subscription.plan.features as string[]) || [];
    const missingFeatures = requiredFeatures.filter((f) => !planFeatures.includes(f));

    if (missingFeatures.length > 0) {
      this.logger.debug(
        `FeatureGuard: User ${user.id} missing features: ${missingFeatures.join(', ')}`,
      );
      throw new ForbiddenException(
        `Your plan does not include: ${missingFeatures.join(', ')}. Please upgrade to access this feature.`,
      );
    }

    // Attach subscription to request for later use
    request.subscription = subscription;

    return true;
  }
}
