/**
 * Analytics Module
 * Comprehensive self-hosted analytics with real-time tracking
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsGateway } from './analytics.gateway';
import { PrismaModule } from '../../database/prisma.module';
import { FeatureGuard } from '../../common/guards/feature.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsGateway, FeatureGuard],
  exports: [AnalyticsService, AnalyticsGateway],
})
export class AnalyticsModule {}
