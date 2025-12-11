/**
 * Content Types Controller
 * Handles HTTP requests for custom content type management
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ContentTypesService } from '../services/content-types.service';
import { CreateContentTypeDto } from '../dto/create-content-type.dto';
import { UpdateContentTypeDto } from '../dto/update-content-type.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/content-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentTypesController {
  constructor(private readonly contentTypesService: ContentTypesService) {}

  /**
   * Create new content type (Admin only)
   * POST /api/content-types
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createContentTypeDto: CreateContentTypeDto) {
    return this.contentTypesService.create(createContentTypeDto);
  }

  /**
   * Get all content types
   * GET /api/content-types
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findAll() {
    return this.contentTypesService.findAll();
  }

  /**
   * Get content type by ID
   * GET /api/content-types/:id
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findOne(@Param('id') id: string) {
    return this.contentTypesService.findById(id);
  }

  /**
   * Update content type (Admin only)
   * PATCH /api/content-types/:id
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateContentTypeDto: UpdateContentTypeDto) {
    return this.contentTypesService.update(id, updateContentTypeDto);
  }

  /**
   * Delete content type (Admin only)
   * DELETE /api/content-types/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.contentTypesService.remove(id);
  }
}

