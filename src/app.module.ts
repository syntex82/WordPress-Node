/**
 * Root application module
 * Imports all feature modules and configures global providers
 * Optimized for horizontal scaling with Redis caching and job queues
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Infrastructure modules
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { HealthModule } from './infrastructure/health/health.module';

// Feature modules
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
import { EmailModule } from './modules/email/email.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // Configuration module - loads .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true, // Cache env vars for performance
    }),

    // Serve static files for admin SPA
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'admin', 'dist'),
      serveRoot: '/admin',
      exclude: ['/api/{*path}', '/uploads/{*path}', '/health/{*path}'],
      serveStaticOptions: {
        fallthrough: true,
      },
    }),

    // Infrastructure modules (order matters - Redis before Queue)
    PrismaModule,
    RedisModule,
    StorageModule,
    QueueModule.forRoot(),
    HealthModule,

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
    EmailModule,
    NotificationsModule,
  ],
})
export class AppModule {}
