import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { EmailModule } from '../email/email.module';
import { ThemesModule } from '../themes/themes.module';
import { DemoController } from './demo.controller';
import { DemoRouterController } from './demo-router.controller';
import { DemoAnalyticsController } from './demo-analytics.controller';
import { DemoService } from './demo.service';
import { DemoProvisioningService } from './demo-provisioning.service';
import { DemoNotificationService } from './demo-notification.service';
import { DemoConversionService } from './demo-conversion.service';
import { DemoAnalyticsService } from './demo-analytics.service';
import { DemoFollowupScheduler } from './demo-followup.scheduler';
import { DemoModeMiddleware } from './middleware/demo-mode.middleware';
import { SampleDataSeederService } from './sample-data-seeder.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    forwardRef(() => EmailModule),
    forwardRef(() => ThemesModule),
  ],
  controllers: [DemoController, DemoRouterController, DemoAnalyticsController],
  providers: [
    DemoService,
    DemoProvisioningService,
    DemoNotificationService,
    DemoConversionService,
    DemoAnalyticsService,
    DemoFollowupScheduler,
    SampleDataSeederService,
  ],
  exports: [DemoService, DemoNotificationService, DemoConversionService, DemoAnalyticsService],
})
export class DemoModule {}

