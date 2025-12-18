/**
 * Page Customization Controller
 * REST API endpoints for page customization
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageCustomizationService } from '../../pages/page-customization.service';
import { CreatePageCustomizationDto } from '../../pages/dto/create-page-customization.dto';
import { UpdatePageCustomizationDto } from '../../pages/dto/update-page-customization.dto';

@Controller('api/page-customizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PageCustomizationController {
  constructor(private pageCustomizationService: PageCustomizationService) {}

  /**
   * Get all page customizations
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findAll() {
    return this.pageCustomizationService.findAll();
  }

  /**
   * Get page customization by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findById(@Param('id') id: string) {
    return this.pageCustomizationService.findById(id);
  }

  /**
   * Get customization by page ID
   */
  @Get('page/:pageId')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findByPageId(@Param('pageId') pageId: string) {
    return this.pageCustomizationService.findByPageId(pageId);
  }

  /**
   * Create page customization
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePageCustomizationDto) {
    return this.pageCustomizationService.create(dto);
  }

  /**
   * Update page customization
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePageCustomizationDto,
  ) {
    return this.pageCustomizationService.update(id, dto);
  }

  /**
   * Delete page customization
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.pageCustomizationService.delete(id);
  }
}

