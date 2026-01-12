/**
 * Licensing Module
 * Handles software license generation, validation, and activation
 * for NodePress CMS independent revenue streams
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { LicensingService } from './licensing.service';
import { LicensingController } from './licensing.controller';
import { LicenseKeyGenerator } from './license-key-generator.service';
import { LicenseValidationService } from './license-validation.service';
import { LicensingPaymentService } from './licensing-payment.service';
import { EmailModule } from '../email/email.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, ConfigModule, EmailModule, SettingsModule],
  controllers: [LicensingController],
  providers: [
    LicensingService,
    LicenseKeyGenerator,
    LicenseValidationService,
    LicensingPaymentService,
  ],
  exports: [LicensingService, LicenseValidationService, LicenseKeyGenerator, LicensingPaymentService],
})
export class LicensingModule {}

