/**
 * Settings Module
 * Manages global site settings and system configuration
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { EncryptionService } from './encryption.service';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';
import { SetupWizardController } from './setup-wizard.controller';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [SettingsService, EncryptionService, SystemConfigService],
  controllers: [SettingsController, SystemConfigController, SetupWizardController],
  exports: [SettingsService, EncryptionService, SystemConfigService],
})
export class SettingsModule {}
