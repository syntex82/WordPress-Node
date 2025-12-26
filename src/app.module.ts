/**
 * Root application module
 * Imports all feature modules and configures global providers
 * Optimized for horizontal scaling with Redis caching and job queues
 */

import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';

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
import { BackupModule } from './modules/backup/backup.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { UpdatesModule } from './modules/updates/updates.module';
import { VideoModule } from './modules/video/video.module';

// Check if admin dist exists
const adminDistPath = join(process.cwd(), 'admin', 'dist');
const adminDistExists = existsSync(join(adminDistPath, 'index.html'));

if (!adminDistExists) {
  const logger = new Logger('AppModule');
  logger.warn('⚠️ Admin panel not built! The /admin route will not work.');
  logger.warn('   Run: cd admin && npm install && npm run build');
}

// Build static module imports conditionally
const staticModules = adminDistExists
  ? [
      ServeStaticModule.forRoot({
        rootPath: adminDistPath,
        serveRoot: '/admin',
        exclude: ['/api/{*path}', '/uploads/{*path}', '/health/{*path}'],
        serveStaticOptions: {
          fallthrough: true,
        },
      }),
    ]
  : [];

@Module({
  imports: [
    // Configuration module - loads .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true, // Cache env vars for performance
    }),

    // Serve static files for admin SPA (only if built)
    ...staticModules,

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
    BackupModule,
    RecommendationsModule,
    MarketplaceModule,
    UpdatesModule,
    VideoModule,
  ],
})
export class AppModule {}
