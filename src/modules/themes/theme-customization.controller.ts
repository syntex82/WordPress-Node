import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ThemeCustomizationService } from './theme-customization.service';
import {
  CreateThemeCustomizationImageDto,
  UpdateThemeCustomizationImageDto,
} from './dto/create-theme-customization-image.dto';
import {
  CreateThemeCustomizationBlockDto,
  UpdateThemeCustomizationBlockDto,
} from './dto/create-theme-customization-block.dto';
import {
  CreateThemeCustomizationLinkDto,
  UpdateThemeCustomizationLinkDto,
} from './dto/create-theme-customization-link.dto';

@Controller('api/theme-customization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ThemeCustomizationController {
  constructor(private service: ThemeCustomizationService) {}

  // ============ IMAGE ENDPOINTS ============

  @Post('images/:themeId')
  @Roles('ADMIN', 'EDITOR')
  createImage(@Param('themeId') themeId: string, @Body() dto: CreateThemeCustomizationImageDto) {
    return this.service.createImage(themeId, dto);
  }

  @Get('images/:themeId')
  getImages(@Param('themeId') themeId: string, @Query('type') type?: string) {
    return this.service.getImages(themeId, type);
  }

  @Get('images/detail/:id')
  getImage(@Param('id') id: string) {
    return this.service.getImage(id);
  }

  @Put('images/:id')
  @Roles('ADMIN', 'EDITOR')
  updateImage(@Param('id') id: string, @Body() dto: UpdateThemeCustomizationImageDto) {
    return this.service.updateImage(id, dto);
  }

  @Delete('images/:id')
  @Roles('ADMIN', 'EDITOR')
  deleteImage(@Param('id') id: string) {
    return this.service.deleteImage(id);
  }

  @Post('images/:themeId/reorder')
  @Roles('ADMIN', 'EDITOR')
  reorderImages(@Param('themeId') themeId: string, @Body() body: { imageIds: string[] }) {
    return this.service.reorderImages(themeId, body.imageIds);
  }

  // ============ BLOCK ENDPOINTS ============

  @Post('blocks/:themeId')
  @Roles('ADMIN', 'EDITOR')
  createBlock(@Param('themeId') themeId: string, @Body() dto: CreateThemeCustomizationBlockDto) {
    return this.service.createBlock(themeId, dto);
  }

  @Get('blocks/:themeId')
  getBlocks(@Param('themeId') themeId: string, @Query('type') type?: string) {
    return this.service.getBlocks(themeId, type);
  }

  @Get('blocks/detail/:id')
  getBlock(@Param('id') id: string) {
    return this.service.getBlock(id);
  }

  @Put('blocks/:id')
  @Roles('ADMIN', 'EDITOR')
  updateBlock(@Param('id') id: string, @Body() dto: UpdateThemeCustomizationBlockDto) {
    return this.service.updateBlock(id, dto);
  }

  @Delete('blocks/:id')
  @Roles('ADMIN', 'EDITOR')
  deleteBlock(@Param('id') id: string) {
    return this.service.deleteBlock(id);
  }

  @Post('blocks/:themeId/reorder')
  @Roles('ADMIN', 'EDITOR')
  reorderBlocks(@Param('themeId') themeId: string, @Body() body: { blockIds: string[] }) {
    return this.service.reorderBlocks(themeId, body.blockIds);
  }

  // ============ LINK ENDPOINTS ============

  @Post('links/:themeId')
  @Roles('ADMIN', 'EDITOR')
  createLink(@Param('themeId') themeId: string, @Body() dto: CreateThemeCustomizationLinkDto) {
    return this.service.createLink(themeId, dto);
  }

  @Get('links/:themeId')
  getLinks(
    @Param('themeId') themeId: string,
    @Query('type') type?: string,
    @Query('group') group?: string,
  ) {
    return this.service.getLinks(themeId, type, group);
  }

  @Get('links/detail/:id')
  getLink(@Param('id') id: string) {
    return this.service.getLink(id);
  }

  @Put('links/:id')
  @Roles('ADMIN', 'EDITOR')
  updateLink(@Param('id') id: string, @Body() dto: UpdateThemeCustomizationLinkDto) {
    return this.service.updateLink(id, dto);
  }

  @Delete('links/:id')
  @Roles('ADMIN', 'EDITOR')
  deleteLink(@Param('id') id: string) {
    return this.service.deleteLink(id);
  }

  @Post('links/:themeId/reorder')
  @Roles('ADMIN', 'EDITOR')
  reorderLinks(@Param('themeId') themeId: string, @Body() body: { linkIds: string[] }) {
    return this.service.reorderLinks(themeId, body.linkIds);
  }
}
