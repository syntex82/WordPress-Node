/**
 * Marketplace Module
 * Developer marketplace for hiring freelance developers
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Controllers
import {
  DevelopersController,
  HiringRequestsController,
  ProjectsController,
  PaymentsController,
} from './controllers';

// Services
import {
  DevelopersService,
  HiringRequestsService,
  ProjectsService,
  MarketplacePaymentsService,
} from './services';

@Module({
  imports: [PrismaModule, ConfigModule, NotificationsModule],
  controllers: [
    DevelopersController,
    HiringRequestsController,
    ProjectsController,
    PaymentsController,
  ],
  providers: [
    DevelopersService,
    HiringRequestsService,
    ProjectsService,
    MarketplacePaymentsService,
  ],
  exports: [DevelopersService, HiringRequestsService, ProjectsService, MarketplacePaymentsService],
})
export class MarketplaceModule {}
