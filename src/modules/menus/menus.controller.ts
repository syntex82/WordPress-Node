/**
 * Menus Controller
 * Handles API endpoints for menu management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/menus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  /**
   * Create a new menu
   * POST /api/menus
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  /**
   * Get all menus
   * GET /api/menus
   */
  @Get()
  findAll() {
    return this.menusService.findAll();
  }

  /**
   * Get available links (pages and posts)
   * GET /api/menus/available-links
   */
  @Get('available-links')
  getAvailableLinks() {
    return this.menusService.getAvailableLinks();
  }

  /**
   * Get menu by location (public, for frontend)
   * GET /api/menus/location/:location
   */
  @Public()
  @Get('location/:location')
  findByLocation(@Param('location') location: string) {
    return this.menusService.findByLocation(location);
  }

  /**
   * Get menu by ID
   * GET /api/menus/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  /**
   * Update menu
   * PUT /api/menus/:id
   */
  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menusService.update(id, updateMenuDto);
  }

  /**
   * Delete menu
   * DELETE /api/menus/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }
}

