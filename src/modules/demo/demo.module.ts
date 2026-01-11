import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
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
import { DemoContextService } from './demo-context.service';
import { DemoVerificationService } from './services/demo-verification.service';
import { EmailValidationService } from './services/email-validation.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    // JWT for generating demo user tokens
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
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
    DemoContextService,
    // Email verification for demo access
    DemoVerificationService,
    EmailValidationService,
  ],
  exports: [
    DemoService,
    DemoNotificationService,
    DemoConversionService,
    DemoAnalyticsService,
    DemoContextService,
    DemoVerificationService,
    EmailValidationService,
  ],
})
export class DemoModule {}

