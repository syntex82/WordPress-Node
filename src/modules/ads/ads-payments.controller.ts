/**
 * Ads Payments Controller
 * Handles advertiser payments and revenue tracking
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdsPaymentsService } from './ads-payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';

@Controller('api/ads/payments')
export class AdsPaymentsController {
  constructor(private readonly paymentsService: AdsPaymentsService) {}

  /**
   * Create checkout session for advertiser deposit
   * POST /api/ads/payments/deposit
   */
  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  async createDeposit(@Body() body: { advertiserId: string; amount: number }) {
    return this.paymentsService.createDepositCheckout(body.advertiserId, body.amount);
  }

  /**
   * Stripe webhook for ad payments
   * POST /api/ads/payments/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body required for webhook verification');
    }
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  /**
   * Get platform revenue stats (admin only)
   * GET /api/ads/payments/revenue
   */
  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getPlatformRevenue(@Query('days') days = 30) {
    return this.paymentsService.getPlatformRevenue(Number(days));
  }
}

