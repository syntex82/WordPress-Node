/**
 * Plugins Module
 * Manages plugin installation, activation, and lifecycle
 */

import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { PluginsService } from './plugins.service';
import { PluginsController } from './plugins.controller';
import { PluginLoaderService } from './plugin-loader.service';
import { PluginMarketplaceService } from './plugin-marketplace.service';
import { PluginMarketplaceController } from './plugin-marketplace.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, forwardRef(() => EmailModule)],
  providers: [PluginsService, PluginLoaderService, PluginMarketplaceService],
  controllers: [PluginsController, PluginMarketplaceController],
  exports: [PluginsService, PluginLoaderService, PluginMarketplaceService],
})
export class PluginsModule {}
