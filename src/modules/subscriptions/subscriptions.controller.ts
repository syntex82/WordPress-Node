import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Headers,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto, UpdatePlanDto, CreateCheckoutDto } from './dto/subscription.dto';

@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ==================== PUBLIC ROUTES ====================

  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getPlans(false);
  }

  @Get('plans/:slug')
  async getPlanBySlug(@Param('slug') slug: string) {
    return this.subscriptionsService.getPlanBySlug(slug);
  }

  // ==================== LICENSE PURCHASE (Public) ====================

  @Post('license/checkout')
  async createLicenseCheckout(@Body() dto: { email: string; successUrl?: string; cancelUrl?: string }) {
    return this.subscriptionsService.createLicenseCheckout(dto.email, dto.successUrl, dto.cancelUrl);
  }

  // ==================== WEBHOOK (Raw body required) ====================

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body not available. Ensure rawBody is enabled for this route.');
    }
    return this.subscriptionsService.handleWebhook(req.rawBody, signature);
  }

  // ==================== USER ROUTES ====================

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.subscriptionsService.getUserSubscription(userId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@Req() req: Request, @Body() dto: CreateCheckoutDto) {
    const userId = (req.user as any).id;
    return this.subscriptionsService.createCheckoutSession(userId, dto);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async getBillingPortal(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.subscriptionsService.createBillingPortalSession(userId);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.subscriptionsService.cancelSubscription(userId);
  }

  @Get('has-feature/:feature')
  @UseGuards(JwtAuthGuard)
  async hasFeature(@Req() req: Request, @Param('feature') feature: string) {
    const userId = (req.user as any).id;
    const hasIt = await this.subscriptionsService.hasFeature(userId, feature);
    return { feature, hasAccess: hasIt };
  }

  // ==================== ADMIN ROUTES ====================

  @Get('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminPlans(@Query('includeInactive') includeInactive: string) {
    return this.subscriptionsService.getPlans(includeInactive === 'true');
  }

  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Put('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Delete('admin/plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deletePlan(@Param('id') id: string) {
    return this.subscriptionsService.deletePlan(id);
  }

  @Post('admin/seed-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async seedDefaultPlans() {
    return this.subscriptionsService.seedDefaultPlans();
  }

  @Post('admin/activate-all-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async activateAllPlans() {
    return this.subscriptionsService.activateAllPlans();
  }

  @Get('admin/diagnostic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDiagnostic() {
    return this.subscriptionsService.getDiagnosticInfo();
  }

  @Post('admin/sync-stripe-prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async syncStripePrices() {
    return this.subscriptionsService.syncStripePrices();
  }

  @Post('admin/create-stripe-prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createStripePrices(
    @Body()
    dto: {
      plans: Array<{ slug: string; productId: string; monthlyPrice: number; yearlyPrice: number }>;
    },
  ) {
    return this.subscriptionsService.createStripePricesForProducts(dto.plans);
  }
}
