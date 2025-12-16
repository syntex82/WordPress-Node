/**
 * Themes Module
 * Manages theme installation, activation, and rendering
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThemesService } from './themes.service';
import { ThemesController } from './themes.controller';
import { ThemeRendererService } from './theme-renderer.service';
import { ThemeEditorService } from './theme-editor.service';
import { ThemeEditorController } from './theme-editor.controller';
import { CustomThemesService } from './custom-themes.service';
import { CustomThemesController } from './custom-themes.controller';
import { AiThemeGeneratorService } from './ai-theme-generator.service';
import { ContentModule } from '../content/content.module';
import { SettingsModule } from '../settings/settings.module';
import { MenusModule } from '../menus/menus.module';

@Module({
  imports: [
    ContentModule,
    SettingsModule,
    MenusModule,
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
  ],
  controllers: [ThemesController, ThemeEditorController, CustomThemesController],
  exports: [
    ThemesService,
    ThemeRendererService,
    ThemeEditorService,
    CustomThemesService,
    AiThemeGeneratorService,
  ],
})
export class ThemesModule {}
