/**
 * Internationalization (i18n) Module
 * Handles multi-language support for NodePress CMS
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { I18nService } from './i18n.service';
import { I18nController } from './i18n.controller';
import { LanguagesController } from './languages.controller';
import { TranslationsController } from './translations.controller';
import { LanguageMiddleware } from './middleware/language.middleware';

@Module({
  imports: [PrismaModule],
  controllers: [I18nController, LanguagesController, TranslationsController],
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply language detection middleware to all routes
    consumer.apply(LanguageMiddleware).forRoutes('*');
  }
}

