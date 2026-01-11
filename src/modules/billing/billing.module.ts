/**
 * Billing Module
 *
 * Handles subscription management and payment processing
 */

import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingSubscriptionGuard } from './guards/subscription.guard';

@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    PrismaService,
    BillingSubscriptionGuard,
  ],
  exports: [BillingService, BillingSubscriptionGuard],
})
export class BillingModule {}

