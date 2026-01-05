/**
 * Public Module
 * Handles public-facing routes and theme rendering
 */

import { Module, forwardRef } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ContentModule } from '../content/content.module';
import { ThemesModule } from '../themes/themes.module';
import { ShopModule } from '../shop/shop.module';
import { LmsModule } from '../lms/lms.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { PluginsModule } from '../plugins/plugins.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SeoModule } from '../seo/seo.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    ContentModule,
    ThemesModule,
    ShopModule,
    LmsModule,
    UsersModule,
    AuthModule,
    forwardRef(() => RecommendationsModule),
    forwardRef(() => MarketplaceModule),
    forwardRef(() => PluginsModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => SeoModule),
    forwardRef(() => MediaModule),
  ],
  controllers: [PublicController],
})
export class PublicModule {}
