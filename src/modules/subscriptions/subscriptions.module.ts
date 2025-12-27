import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaModule } from '../../database/prisma.module';
import { SystemConfigService } from '../settings/system-config.service';
import { EncryptionService } from '../settings/encryption.service';
import { SubscriptionGuard, FeatureGuard, PlanGuard } from '../../common/guards';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SystemConfigService,
    EncryptionService,
    // Subscription guards - can be used by other modules
    SubscriptionGuard,
    FeatureGuard,
    PlanGuard,
  ],
  exports: [SubscriptionsService, SubscriptionGuard, FeatureGuard, PlanGuard],
})
export class SubscriptionsModule {}
