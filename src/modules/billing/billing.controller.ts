/**
 * Billing Controller
 * 
 * Handles subscription and pricing API endpoints
 */

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, BillingCycle } from '@prisma/client';
import { IsString, IsEnum, IsOptional } from 'class-validator';

class SubscribeDto {
  @IsString()
  planName: string;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle = BillingCycle.MONTHLY;
}

@Controller('api/billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  /**
   * Get all available pricing plans (public)
   */
  @Get('plans')
  async getPlans() {
    const plans = await this.billingService.getPlans();
    return {
      plans: plans.map(p => ({
        ...p,
        monthlyPrice: Number(p.monthlyPrice),
        yearlyPrice: Number(p.yearlyPrice),
        storageGb: Number(p.storageGb),
        bandwidthGb: Number(p.bandwidthGb),
      })),
    };
  }

  /**
   * Get current user's subscription
   */
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@CurrentUser() user: any) {
    return this.billingService.getUserSubscription(user.id);
  }

  /**
   * Subscribe to a plan
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async subscribe(@CurrentUser() user: any, @Body() dto: SubscribeDto) {
    return this.billingService.subscribe(user.id, dto.planName, dto.billingCycle);
  }

  /**
   * Cancel subscription
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@CurrentUser() user: any) {
    return this.billingService.cancelSubscription(user.id);
  }

  /**
   * Check feature access
   */
  @Get('features/:feature')
  @UseGuards(JwtAuthGuard)
  async checkFeature(@CurrentUser() user: any, @Body('feature') feature: string) {
    const hasAccess = await this.billingService.hasFeature(user.id, feature as any);
    return { feature, hasAccess };
  }

  /**
   * Check resource limits
   */
  @Get('limits/:resource')
  @UseGuards(JwtAuthGuard)
  async checkLimits(@CurrentUser() user: any, @Body('resource') resource: string) {
    const limits = await this.billingService.canCreate(user.id, resource as any);
    return { resource, ...limits };
  }

  /**
   * Admin: Seed default plans
   */
  @Post('admin/seed-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async seedPlans() {
    await this.billingService.seedPlans();
    return { message: 'Plans seeded successfully' };
  }
}

