/**
 * Marketplace Payments Controller
 * API endpoints for payments, payouts, and disputes
 */

import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole as _UserRole } from '@prisma/client';
import { MarketplacePaymentsService } from '../services/marketplace-payments.service';
import { DevelopersService } from '../services/developers.service';
import { RequestPayoutDto, ResolveDisputeDto } from '../dto';

@Controller('api/marketplace/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private paymentsService: MarketplacePaymentsService,
    private developersService: DevelopersService,
  ) {}

  /**
   * Request payout (developer)
   */
  @Post('payout/request')
  async requestPayout(@Request() req, @Body() dto: RequestPayoutDto) {
    const developer = await this.developersService.findByUserId(req.user.id);
    if (!developer) {
      return { error: 'Developer profile not found' };
    }
    return this.paymentsService.requestPayout(developer.id, dto.amount);
  }

  /**
   * Get my payouts (developer)
   */
  @Get('payout/my')
  async getMyPayouts(@Request() req) {
    const developer = await this.developersService.findByUserId(req.user.id);
    if (!developer) {
      return { payouts: [] };
    }
    return this.paymentsService.getDeveloperPayouts(developer.id);
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get financial statistics (admin)
   */
  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getFinancialStatistics() {
    return this.paymentsService.getFinancialStatistics();
  }

  /**
   * Process payout (admin)
   */
  @Post('payout/:id/process')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async processPayout(@Param('id') id: string) {
    return this.paymentsService.processPayout(id);
  }

  /**
   * Resolve dispute (admin)
   */
  @Patch('dispute/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async resolveDispute(@Request() req, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.paymentsService.resolveDispute(
      id,
      req.user.id,
      dto.resolution,
      dto.resolutionNotes,
      dto.refundAmount,
    );
  }
}
