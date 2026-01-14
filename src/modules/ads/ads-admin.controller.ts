/**
 * Ads Admin Controller - Manage Advertisers, Campaigns, Ads & Zones
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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdsAdminService } from './ads-admin.service';
import { HouseAdsService } from './house-ads.service';
import {
  CreateAdvertiserDto,
  UpdateAdvertiserDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateAdDto,
  UpdateAdDto,
  CreateZoneDto,
  UpdateZoneDto,
  CreatePlacementDto,
  CreateHouseAdDto,
  UpdateHouseAdDto,
} from './dto';

@Controller('admin/ads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdsAdminController {
  constructor(
    private readonly adsAdminService: AdsAdminService,
    private readonly houseAdsService: HouseAdsService,
  ) {}

  // ADVERTISERS
  @Get('advertisers')
  async listAdvertisers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adsAdminService.listAdvertisers({ page, limit, status, search });
  }

  @Get('advertisers/:id')
  async getAdvertiser(@Param('id') id: string) {
    return this.adsAdminService.getAdvertiser(id);
  }

  @Post('advertisers')
  async createAdvertiser(@Body() dto: CreateAdvertiserDto) {
    return this.adsAdminService.createAdvertiser(dto);
  }

  @Put('advertisers/:id')
  async updateAdvertiser(@Param('id') id: string, @Body() dto: UpdateAdvertiserDto) {
    return this.adsAdminService.updateAdvertiser(id, dto);
  }

  @Delete('advertisers/:id')
  async deleteAdvertiser(@Param('id') id: string) {
    return this.adsAdminService.deleteAdvertiser(id);
  }

  @Post('advertisers/:id/credit')
  async addCredit(@Param('id') id: string, @Body() body: { amount: number; description?: string }) {
    return this.adsAdminService.addCredit(id, body.amount, body.description);
  }

  // CAMPAIGNS
  @Get('campaigns')
  async listCampaigns(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('advertiserId') advertiserId?: string,
  ) {
    return this.adsAdminService.listCampaigns({ page, limit, status, advertiserId });
  }

  @Get('campaigns/:id')
  async getCampaign(@Param('id') id: string) {
    return this.adsAdminService.getCampaign(id);
  }

  @Post('campaigns')
  async createCampaign(@Body() dto: CreateCampaignDto) {
    return this.adsAdminService.createCampaign(dto);
  }

  @Put('campaigns/:id')
  async updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.adsAdminService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  async deleteCampaign(@Param('id') id: string) {
    return this.adsAdminService.deleteCampaign(id);
  }

  @Put('campaigns/:id/status')
  async updateCampaignStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.adsAdminService.updateCampaignStatus(id, body.status);
  }

  // ADS
  @Get('ads')
  async listAds(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('campaignId') campaignId?: string,
    @Query('status') status?: string,
  ) {
    return this.adsAdminService.listAds({ page, limit, campaignId, status });
  }

  @Get('ads/:id')
  async getAd(@Param('id') id: string) {
    return this.adsAdminService.getAd(id);
  }

  @Post('ads')
  async createAd(@Body() dto: CreateAdDto) {
    return this.adsAdminService.createAd(dto);
  }

  @Put('ads/:id')
  async updateAd(@Param('id') id: string, @Body() dto: UpdateAdDto) {
    return this.adsAdminService.updateAd(id, dto);
  }

  @Delete('ads/:id')
  async deleteAd(@Param('id') id: string) {
    return this.adsAdminService.deleteAd(id);
  }

  // ZONES
  @Get('zones')
  async listZones() {
    return this.adsAdminService.listZones();
  }

  @Get('zones/:id')
  async getZone(@Param('id') id: string) {
    return this.adsAdminService.getZone(id);
  }

  @Post('zones')
  async createZone(@Body() dto: CreateZoneDto) {
    return this.adsAdminService.createZone(dto);
  }

  @Put('zones/:id')
  async updateZone(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.adsAdminService.updateZone(id, dto);
  }

  @Delete('zones/:id')
  async deleteZone(@Param('id') id: string) {
    return this.adsAdminService.deleteZone(id);
  }

  // PLACEMENTS
  @Post('placements')
  async createPlacement(@Body() dto: CreatePlacementDto) {
    return this.adsAdminService.createPlacement(dto);
  }

  @Delete('placements/:id')
  async deletePlacement(@Param('id') id: string) {
    return this.adsAdminService.deletePlacement(id);
  }

  // ANALYTICS
  @Get('stats/overview')
  async getOverviewStats() {
    return this.adsAdminService.getOverviewStats();
  }

  @Get('stats/top-performers')
  async getTopPerformers(@Query('days') days = 30) {
    return this.adsAdminService.getTopPerformers(Number(days));
  }

  @Get('stats/ad/:id')
  async getAdStats(@Param('id') id: string, @Query('days') days = 30) {
    return this.adsAdminService.getAdStats(id, Number(days));
  }

  @Get('stats/campaign/:id')
  async getCampaignStats(@Param('id') id: string, @Query('days') days = 30) {
    return this.adsAdminService.getCampaignStats(id, Number(days));
  }

  @Get('stats/earnings')
  async getPublisherEarnings(@Query('days') days = 30) {
    return this.adsAdminService.getPublisherEarnings(Number(days));
  }

  // ============ HOUSE ADS - YOUR OWN FREE ADS ============

  /**
   * List your house ads
   * GET /admin/ads/house
   */
  @Get('house')
  async listHouseAds() {
    return this.houseAdsService.list();
  }

  /**
   * Create a house ad - FREE, no payment!
   * POST /admin/ads/house
   */
  @Post('house')
  async createHouseAd(@Body() dto: CreateHouseAdDto) {
    return this.houseAdsService.create(dto);
  }

  /**
   * Update a house ad
   * PUT /admin/ads/house/:id
   */
  @Put('house/:id')
  async updateHouseAd(@Param('id') id: string, @Body() dto: UpdateHouseAdDto) {
    return this.houseAdsService.update(id, dto);
  }

  /**
   * Delete a house ad
   * DELETE /admin/ads/house/:id
   */
  @Delete('house/:id')
  async deleteHouseAd(@Param('id') id: string) {
    return this.houseAdsService.delete(id);
  }
}

