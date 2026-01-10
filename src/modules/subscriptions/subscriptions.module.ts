import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { LicenseEmailService } from './license-email.service';
import { LicenseDownloadController } from './license-download.controller';
import { PrismaModule } from '../../database/prisma.module';
import { SystemConfigService } from '../settings/system-config.service';
import { EncryptionService } from '../settings/encryption.service';
import { SubscriptionGuard, FeatureGuard, PlanGuard } from '../../common/guards';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SubscriptionsController, LicenseDownloadController],
  providers: [
    SubscriptionsService,
    LicenseEmailService,
    SystemConfigService,
    EncryptionService,
    // Subscription guards - can be used by other modules
    SubscriptionGuard,
    FeatureGuard,
    PlanGuard,
  ],
  exports: [SubscriptionsService, LicenseEmailService, SubscriptionGuard, FeatureGuard, PlanGuard],
})
export class SubscriptionsModule implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionsModule.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async onModuleInit() {
    try {
      // Auto-seed default subscription plans if none exist
      const result = await this.subscriptionsService.seedDefaultPlans();
      if (result.count) {
        this.logger.log(`Seeded ${result.count} default subscription plans`);
      }
    } catch (error) {
      this.logger.warn('Could not seed subscription plans:', error.message);
    }
  }
}
