/**
 * Marketplace Module
 * Developer marketplace for hiring freelance developers
 * Plugin and theme purchases
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { LicensingModule } from '../licensing/licensing.module';

// Controllers
import {
  DevelopersController,
  HiringRequestsController,
  ProjectsController,
  PaymentsController,
} from './controllers';
import { MarketplacePurchaseController } from './marketplace-purchase.controller';

// Services
import {
  DevelopersService,
  HiringRequestsService,
  ProjectsService,
  MarketplacePaymentsService,
} from './services';
import { MarketplacePurchaseService } from './marketplace-purchase.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    NotificationsModule,
    EmailModule,
    forwardRef(() => LicensingModule),
  ],
  controllers: [
    DevelopersController,
    HiringRequestsController,
    ProjectsController,
    PaymentsController,
    MarketplacePurchaseController,
  ],
  providers: [
    DevelopersService,
    HiringRequestsService,
    ProjectsService,
    MarketplacePaymentsService,
    MarketplacePurchaseService,
  ],
  exports: [
    DevelopersService,
    HiringRequestsService,
    ProjectsService,
    MarketplacePaymentsService,
    MarketplacePurchaseService,
  ],
})
export class MarketplaceModule {}
