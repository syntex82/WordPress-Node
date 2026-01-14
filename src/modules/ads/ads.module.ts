/**
 * Ads Module - Self-hosted PPC Ad Revenue System
 * Complete alternative to Google AdSense
 */
import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AdsController } from './ads.controller';
import { AdsAdminController } from './ads-admin.controller';
import { AdsPaymentsController } from './ads-payments.controller';
import { VideoAdsController } from './video-ads.controller';
import { RtbController } from './rtb.controller';
import { AdsService } from './ads.service';
import { AdsAdminService } from './ads-admin.service';
import { AdsPaymentsService } from './ads-payments.service';
import { HouseAdsService } from './house-ads.service';
import { VideoAdsService } from './video-ads.service';
import { FraudDetectionService } from './fraud-detection.service';
import { RtbService } from './rtb.service';
import { PrismaModule } from '../../database/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), forwardRef(() => SettingsModule)],
  controllers: [AdsController, AdsAdminController, AdsPaymentsController, VideoAdsController, RtbController],
  providers: [
    AdsService,
    AdsAdminService,
    AdsPaymentsService,
    HouseAdsService,
    VideoAdsService,
    FraudDetectionService,
    RtbService,
  ],
  exports: [
    AdsService,
    AdsAdminService,
    AdsPaymentsService,
    HouseAdsService,
    VideoAdsService,
    FraudDetectionService,
    RtbService,
  ],
})
export class AdsModule {}

