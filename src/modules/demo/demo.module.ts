import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { DemoController } from './demo.controller';
import { DemoRouterController } from './demo-router.controller';
import { DemoService } from './demo.service';
import { DemoProvisioningService } from './demo-provisioning.service';
import { DemoNotificationService } from './demo-notification.service';
import { DemoModeMiddleware } from './middleware/demo-mode.middleware';
import { SampleDataSeederService } from './sample-data-seeder.service';

@Module({
  imports: [PrismaModule, ConfigModule, ScheduleModule.forRoot()],
  controllers: [DemoController, DemoRouterController],
  providers: [
    DemoService,
    DemoProvisioningService,
    DemoNotificationService,
    SampleDataSeederService,
  ],
  exports: [DemoService, DemoNotificationService],
})
export class DemoModule {}

