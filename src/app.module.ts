/**
 * Root application module
 * Imports all feature modules and configures global providers
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContentModule } from './modules/content/content.module';
import { MediaModule } from './modules/media/media.module';
import { ThemesModule } from './modules/themes/themes.module';
import { PluginsModule } from './modules/plugins/plugins.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PublicModule } from './modules/public/public.module';
import { SecurityModule } from './modules/security/security.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MenusModule } from './modules/menus/menus.module';
import { ShopModule } from './modules/shop/shop.module';
import { LmsModule } from './modules/lms/lms.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SeoModule } from './modules/seo/seo.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    // Configuration module - loads .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Serve static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'admin', 'dist'),
      serveRoot: '/admin',
      exclude: ['/api*', '/uploads*'],
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ContentModule,
    MediaModule,
    ThemesModule,
    PluginsModule,
    SettingsModule,
    PublicModule,
    SecurityModule,
    GroupsModule,
    MenusModule,
    ShopModule,
    LmsModule,
    AnalyticsModule,
    SeoModule,
    MessagesModule,
  ],
})
export class AppModule {}
