import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ShippingService,
  CreateShippingMethodDto,
  UpdateShippingMethodDto,
} from '../services/shipping.service';

// Admin Controller - Protected
@Controller('api/shop/shipping')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateShippingMethodDto) {
    return this.shippingService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.shippingService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findOne(@Param('id') id: string) {
    return this.shippingService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateShippingMethodDto) {
    return this.shippingService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) {
    return this.shippingService.delete(id);
  }
}

// Public/Storefront Controller - For checkout
@Controller('api/shop/storefront/shipping')
export class StorefrontShippingController {
  constructor(private shippingService: ShippingService) {}

  // Get available shipping methods for a country
  @Get('methods')
  getAvailableMethods(@Query('country') country: string) {
    return this.shippingService.getAvailableForCountry(country || 'US');
  }

  // Get shipping rates with calculated costs
  @Get('rates')
  getShippingRates(@Query('country') country: string, @Query('subtotal') subtotal: string) {
    const parsedSubtotal = parseFloat(subtotal) || 0;
    return this.shippingService.getShippingRates(country || 'US', parsedSubtotal);
  }

  // Calculate shipping for specific method
  @Get('calculate/:methodId')
  calculateShipping(@Param('methodId') methodId: string, @Query('subtotal') subtotal: string) {
    const parsedSubtotal = parseFloat(subtotal) || 0;
    return this.shippingService.calculateShipping(methodId, parsedSubtotal);
  }
}
