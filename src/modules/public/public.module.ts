/**
 * Public Module
 * Handles public-facing routes and theme rendering
 */

import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ContentModule } from '../content/content.module';
import { ThemesModule } from '../themes/themes.module';

@Module({
  imports: [ContentModule, ThemesModule],
  controllers: [PublicController],
})
export class PublicModule {}

