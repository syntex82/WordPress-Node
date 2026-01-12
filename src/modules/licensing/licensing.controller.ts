/**
 * Licensing Controller
 * REST API endpoints for license management
 */

import {
  Controller,
  Get,
  Post,
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
import { LicensingService } from './licensing.service';
import { LicenseValidationService } from './license-validation.service';
import { LicensingPaymentService } from './licensing-payment.service';
import {
  CreateLicenseDto,
  ActivateLicenseDto,
  ValidateLicenseDto,
  DeactivateLicenseDto,
  TransferLicenseDto,
  LicenseTier,
  LICENSE_TIER_CONFIG,
} from './dto';

@Controller('api/licensing')
export class LicensingController {
  constructor(
    private licensingService: LicensingService,
    private validationService: LicenseValidationService,
    private paymentService: LicensingPaymentService,
  ) {}

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Validate a license key (public - used by NodePress installations)
   * POST /api/licensing/validate
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateLicense(@Body() dto: ValidateLicenseDto) {
    return this.validationService.validateLicense(dto.licenseKey, dto.domain);
  }

  /**
   * Activate license on a domain (public - used by NodePress installations)
   * POST /api/licensing/activate
   */
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activateLicense(@Body() dto: ActivateLicenseDto) {
    return this.licensingService.activateLicense(dto);
  }

  /**
   * Deactivate license from a domain
   * POST /api/licensing/deactivate
   */
  @Post('deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateLicense(@Body() dto: DeactivateLicenseDto) {
    return this.licensingService.deactivateLicense(dto.licenseKey, dto.domain);
  }

  /**
   * Get license tiers and pricing (public)
   * GET /api/licensing/tiers
   */
  @Get('tiers')
  async getLicenseTiers() {
    return this.paymentService.getLicensePricing();
  }

  /**
   * Create checkout session for license purchase (public)
   * POST /api/licensing/checkout
   */
  @Post('checkout')
  async createCheckout(
    @Body() body: { tier: LicenseTier; email: string; customerName?: string; companyName?: string },
  ) {
    return this.paymentService.createCheckoutSession({
      tier: body.tier,
      email: body.email,
      customerName: body.customerName,
      companyName: body.companyName,
    });
  }

  /**
   * Stripe webhook for license payments
   * POST /api/licensing/webhook
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

  // ==================== USER ENDPOINTS ====================

  /**
   * Get my licenses (authenticated user)
   * GET /api/licensing/my-licenses
   */
  @Get('my-licenses')
  @UseGuards(JwtAuthGuard)
  async getMyLicenses(@Req() req: any) {
    return this.licensingService.getLicensesByEmail(req.user.email);
  }

  /**
   * Create renewal checkout for existing license
   * POST /api/licensing/renew-checkout
   */
  @Post('renew-checkout')
  @UseGuards(JwtAuthGuard)
  async createRenewalCheckout(@Body('licenseKey') licenseKey: string) {
    return this.paymentService.createRenewalCheckoutSession(licenseKey);
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Create a new license (admin only)
   * POST /api/licensing/admin/create
   */
  @Post('admin/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createLicense(@Body() dto: CreateLicenseDto) {
    return this.licensingService.createLicense(dto);
  }

  /**
   * List all licenses (admin only)
   * GET /api/licensing/admin/list
   */
  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listLicenses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tier') tier?: LicenseTier,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.licensingService.listLicenses({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      tier,
      status,
      search,
    });
  }

  /**
   * Get license statistics (admin only)
   * GET /api/licensing/admin/stats
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getLicenseStats() {
    return this.licensingService.getLicenseStats();
  }

  /**
   * Get license by key (admin only)
   * GET /api/licensing/admin/:licenseKey
   */
  @Get('admin/:licenseKey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getLicense(@Param('licenseKey') licenseKey: string) {
    return this.licensingService.getLicenseByKey(licenseKey);
  }

  /**
   * Transfer license to new owner (admin only)
   * POST /api/licensing/admin/transfer
   */
  @Post('admin/transfer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async transferLicense(@Body() dto: TransferLicenseDto) {
    return this.licensingService.transferLicense(
      dto.licenseKey,
      dto.newEmail,
      dto.newCustomerName,
    );
  }

  /**
   * Renew license (admin only)
   * POST /api/licensing/admin/renew/:licenseKey
   */
  @Post('admin/renew/:licenseKey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async renewLicense(
    @Param('licenseKey') licenseKey: string,
    @Body('years') years?: number,
  ) {
    return this.licensingService.renewLicense(licenseKey, years);
  }

  /**
   * Revoke license (admin only)
   * POST /api/licensing/admin/revoke/:licenseKey
   */
  @Post('admin/revoke/:licenseKey')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async revokeLicense(
    @Param('licenseKey') licenseKey: string,
    @Body('reason') reason?: string,
  ) {
    return this.licensingService.revokeLicense(licenseKey, reason);
  }

  /**
   * Get all licenses (admin)
   * GET /api/licensing/admin/licenses
   */
  @Get('admin/licenses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllLicenses() {
    return this.licensingService.getAllLicenses();
  }

  /**
   * Revoke license by ID (admin)
   * POST /api/licensing/admin/licenses/:id/revoke
   */
  @Post('admin/licenses/:id/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async revokeLicenseById(@Param('id') id: string) {
    return this.licensingService.revokeLicenseById(id);
  }
}

