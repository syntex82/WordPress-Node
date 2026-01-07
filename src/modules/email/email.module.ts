/**
 * Email Module
 * Provides email sending, templates, and logging functionality
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { EmailService } from './email.service';
import { EmailTemplatesService } from './email-templates.service';
import { EmailLogsService } from './email-logs.service';
import { BulkEmailService } from './bulk-email.service';
import { EmailTemplatesSeederService } from './email-templates-seeder.service';
import { SystemEmailService } from './system-email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => SettingsModule)],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailTemplatesService,
    EmailLogsService,
    BulkEmailService,
    EmailTemplatesSeederService,
    SystemEmailService,
  ],
  exports: [
    EmailService,
    EmailTemplatesService,
    EmailLogsService,
    BulkEmailService,
    SystemEmailService,
  ],
})
export class EmailModule {}
