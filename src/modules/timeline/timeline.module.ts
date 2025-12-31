/**
 * Timeline Module
 * Handles timeline posts with rich media support
 * Includes WebSocket gateway for real-time updates
 */

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { TimelineGateway } from './timeline.gateway';
import { PrismaModule } from '../../database/prisma.module';
import { FeedModule } from '../feed/feed.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => FeedModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TimelineController],
  providers: [TimelineService, TimelineGateway],
  exports: [TimelineService, TimelineGateway],
})
export class TimelineModule {}

