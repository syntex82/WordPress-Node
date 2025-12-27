import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CustomizationPresetsService } from '../services/customization-presets.service';

@Controller('api/customizations/presets')
export class CustomizationPresetsController {
  constructor(private readonly presetsService: CustomizationPresetsService) {}

  /**
   * Get all presets
   */
  @Get()
  getAllPresets() {
    return this.presetsService.getAllPresets();
  }

  /**
   * Get presets by category
   */
  @Get('category/:category')
  getPresetsByCategory(@Param('category') category: 'page' | 'post' | 'both') {
    return this.presetsService.getPresetsByCategory(category);
  }

  /**
   * Get preset by ID
   */
  @Get(':id')
  getPresetById(@Param('id') id: string) {
    const preset = this.presetsService.getPresetById(id);
    if (!preset) {
      return { error: 'Preset not found' };
    }
    return preset;
  }

  /**
   * Get preset settings by ID
   */
  @Get(':id/settings')
  getPresetSettings(@Param('id') id: string) {
    const settings = this.presetsService.getPresetSettings(id);
    if (!settings) {
      return { error: 'Preset not found' };
    }
    return settings;
  }

  /**
   * Add custom preset (Admin/Editor only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  addPreset(
    @Body()
    data: {
      name: string;
      description: string;
      category: 'page' | 'post' | 'both';
      settings: any;
    },
  ) {
    return this.presetsService.addPreset(data);
  }

  /**
   * Remove custom preset (Admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removePreset(@Param('id') id: string) {
    const success = this.presetsService.removePreset(id);
    if (!success) {
      return { error: 'Preset not found' };
    }
    return { message: 'Preset removed successfully' };
  }
}
