/**
 * Professional Services Controller
 * REST API endpoints for services and bookings
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServicesService } from './services.service';
import { BookingService } from './booking.service';
import { ServicesPaymentService } from './services-payment.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  CreateBookingDto,
  UpdateBookingStatusDto,
  ServiceCategory,
} from './dto';

@Controller('api/services')
export class ServicesController {
  constructor(
    private servicesService: ServicesService,
    private bookingService: BookingService,
    private paymentService: ServicesPaymentService,
  ) {}

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Get all active services
   * GET /api/services
   */
  @Get()
  async getServices(@Query('category') category?: ServiceCategory) {
    return this.servicesService.getActiveServices(category);
  }

  /**
   * Get featured services
   * GET /api/services/featured
   */
  @Get('featured')
  async getFeaturedServices(@Query('limit') limit?: string) {
    return this.servicesService.getFeaturedServices(limit ? parseInt(limit) : 4);
  }

  /**
   * Get service by slug
   * GET /api/services/:slug
   */
  @Get(':slug')
  async getService(@Param('slug') slug: string) {
    return this.servicesService.getServiceBySlug(slug);
  }

  // ==================== USER ENDPOINTS ====================

  /**
   * Create a booking
   * POST /api/services/bookings
   */
  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(req.user.id, dto);
  }

  /**
   * Get my bookings
   * GET /api/services/bookings/my
   */
  @Get('bookings/my')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(@Req() req: any) {
    return this.bookingService.getUserBookings(req.user.id);
  }

  /**
   * Get booking by ID
   * GET /api/services/bookings/:id
   */
  @Get('bookings/:id')
  @UseGuards(JwtAuthGuard)
  async getBooking(@Req() req: any, @Param('id') id: string) {
    return this.bookingService.getBookingById(id, req.user.id);
  }

  /**
   * Cancel booking
   * POST /api/services/bookings/:id/cancel
   */
  @Post('bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelBooking(@Req() req: any, @Param('id') id: string) {
    return this.bookingService.cancelBooking(id, req.user.id);
  }

  /**
   * Create payment checkout for booking
   * POST /api/services/bookings/:id/checkout
   */
  @Post('bookings/:id/checkout')
  @UseGuards(JwtAuthGuard)
  async createBookingCheckout(@Req() req: any, @Param('id') id: string) {
    return this.paymentService.createBookingCheckoutSession({
      bookingId: id,
      userId: req.user.id,
    });
  }

  /**
   * Stripe webhook for service payments
   * POST /api/services/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body required for webhook');
    }
    return this.paymentService.handleWebhook(req.rawBody, signature);
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all services (admin)
   * GET /api/services/admin/all
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllServices() {
    return this.servicesService.getAllServices();
  }

  /**
   * Create service (admin)
   * POST /api/services/admin
   */
  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createService(@Body() dto: CreateServiceDto) {
    return this.servicesService.createService(dto);
  }

  /**
   * Update service (admin)
   * PUT /api/services/admin/:id
   */
  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.updateService(id, dto);
  }

  /**
   * Delete service (admin)
   * DELETE /api/services/admin/:id
   */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteService(@Param('id') id: string) {
    return this.servicesService.deleteService(id);
  }

  /**
   * Get all bookings (admin)
   * GET /api/services/admin/bookings
   */
  @Get('admin/bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllBookings(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingService.getAllBookings({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /**
   * Get booking statistics (admin)
   * GET /api/services/admin/stats
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getBookingStats() {
    return this.bookingService.getBookingStats();
  }

  /**
   * Update booking status (admin)
   * PUT /api/services/admin/bookings/:id/status
   */
  @Put('admin/bookings/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateBookingStatus(id, dto);
  }
}

