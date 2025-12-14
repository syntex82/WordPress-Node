/**
 * Posts Controller
 * Handles HTTP requests for post management
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
  Query,
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole, PostStatus } from '@prisma/client';

@Controller('api/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Create new post
   * POST /api/posts
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: any) {
    return this.postsService.create(createPostDto, user.id);
  }

  /**
   * Get all posts with filters
   * GET /api/posts
   */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PostStatus,
    @Query('authorId') authorId?: string,
  ) {
    return this.postsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
      authorId,
    );
  }

  /**
   * Get post by ID
   * GET /api/posts/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  /**
   * Get post by slug
   * GET /api/posts/slug/:slug
   */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  /**
   * Update post
   * PATCH /api/posts/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  /**
   * Delete post
   * DELETE /api/posts/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
