/**
 * Themes Module
 * Manages theme installation, activation, and rendering
 */

import { Module } from '@nestjs/common';
import { ThemesService } from './themes.service';
import { ThemesController } from './themes.controller';
import { ThemeRendererService } from './theme-renderer.service';
import { ThemeEditorService } from './theme-editor.service';
import { ThemeEditorController } from './theme-editor.controller';
import { ContentModule } from '../content/content.module';
import { SettingsModule } from '../settings/settings.module';
import { MenusModule } from '../menus/menus.module';

@Module({
  imports: [ContentModule, SettingsModule, MenusModule],
  providers: [ThemesService, ThemeRendererService, ThemeEditorService],
  controllers: [ThemesController, ThemeEditorController],
  exports: [ThemesService, ThemeRendererService, ThemeEditorService],
})
export class ThemesModule {}

