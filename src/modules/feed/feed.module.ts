/**
 * Feed Module
 * Handles activity feed operations and social features
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
