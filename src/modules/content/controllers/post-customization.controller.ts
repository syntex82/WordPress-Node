/**
 * Post Customization Controller
 * REST API endpoints for post customization
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
import { PostCustomizationService } from '../../posts/post-customization.service';
import { CreatePostCustomizationDto } from '../../posts/dto/create-post-customization.dto';
import { UpdatePostCustomizationDto } from '../../posts/dto/update-post-customization.dto';

@Controller('api/post-customizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostCustomizationController {
  constructor(private postCustomizationService: PostCustomizationService) {}

  /**
   * Get all post customizations
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findAll() {
    return this.postCustomizationService.findAll();
  }

  /**
   * Get post customization by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findById(@Param('id') id: string) {
    return this.postCustomizationService.findById(id);
  }

  /**
   * Get customization by post ID
   */
  @Get('post/:postId')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async findByPostId(@Param('postId') postId: string) {
    return this.postCustomizationService.findByPostId(postId);
  }

  /**
   * Create post customization
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePostCustomizationDto) {
    return this.postCustomizationService.create(dto);
  }

  /**
   * Update post customization
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(@Param('id') id: string, @Body() dto: UpdatePostCustomizationDto) {
    return this.postCustomizationService.update(id, dto);
  }

  /**
   * Delete post customization
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.postCustomizationService.delete(id);
  }
}
