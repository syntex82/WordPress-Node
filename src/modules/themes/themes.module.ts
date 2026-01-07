/**
 * Themes Module
 * Manages theme installation, activation, and rendering
 */

import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { ThemesService } from './themes.service';
import { ThemesController } from './themes.controller';
import { ThemeRendererService } from './theme-renderer.service';
import { ThemeEditorService } from './theme-editor.service';
import { ThemeEditorController } from './theme-editor.controller';
import { CustomThemesService } from './custom-themes.service';
import { CustomThemesController } from './custom-themes.controller';
import { AiThemeGeneratorService } from './ai-theme-generator.service';
import { CustomizationRendererService } from './customization-renderer.service';
import { ThemeCustomizationService } from './theme-customization.service';
import { ThemeCustomizationController } from './theme-customization.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { VisualEditorService } from './visual-editor.service';
import { VisualEditorController } from './visual-editor.controller';
import { VisualEditorGateway } from './visual-editor.gateway';
import { ContentModule } from '../content/content.module';
import { SettingsModule } from '../settings/settings.module';
import { MenusModule } from '../menus/menus.module';
import { EmailModule } from '../email/email.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    PrismaModule,
    ContentModule,
    SettingsModule,
    MenusModule,
    EmailModule,
    SubscriptionsModule,
    // JWT for preview token generation
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' }, // Short-lived preview tokens
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    ThemesService,
    ThemeRendererService,
    ThemeEditorService,
    CustomThemesService,
    AiThemeGeneratorService,
    CustomizationRendererService,
    ThemeCustomizationService,
    MarketplaceService,
    VisualEditorService,
    VisualEditorGateway,
  ],
  controllers: [
    ThemesController,
    ThemeEditorController,
    CustomThemesController,
    ThemeCustomizationController,
    MarketplaceController,
    VisualEditorController,
  ],
  exports: [
    ThemesService,
    ThemeRendererService,
    ThemeEditorService,
    CustomThemesService,
    AiThemeGeneratorService,
    CustomizationRendererService,
    ThemeCustomizationService,
    MarketplaceService,
    VisualEditorService,
    VisualEditorGateway,
  ],
})
export class ThemesModule {}
