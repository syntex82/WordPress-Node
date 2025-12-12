/**
 * Public Module
 * Handles public-facing routes and theme rendering
 */

import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ContentModule } from '../content/content.module';
import { ThemesModule } from '../themes/themes.module';
import { ShopModule } from '../shop/shop.module';
import { LmsModule } from '../lms/lms.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ContentModule, ThemesModule, ShopModule, LmsModule, UsersModule],
  controllers: [PublicController],
})
export class PublicModule {}

