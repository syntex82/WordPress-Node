/**
 * Ads Admin Service - Manage Advertisers, Campaigns, Ads & Zones
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
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
} from './dto';

@Injectable()
export class AdsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // ADVERTISERS
  // ============================================

  async listAdvertisers(params: { page: number; limit: number; status?: string; search?: string }) {
    const { page, limit, status, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.advertiser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { campaigns: true } } },
      }),
      this.prisma.advertiser.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getAdvertiser(id: string) {
    const advertiser = await this.prisma.advertiser.findUnique({
      where: { id },
      include: {
        campaigns: { orderBy: { createdAt: 'desc' }, take: 10 },
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!advertiser) throw new NotFoundException('Advertiser not found');
    return advertiser;
  }

  async createAdvertiser(dto: CreateAdvertiserDto) {
    return this.prisma.advertiser.create({ data: dto });
  }

  async updateAdvertiser(id: string, dto: UpdateAdvertiserDto) {
    return this.prisma.advertiser.update({ where: { id }, data: dto });
  }

  async deleteAdvertiser(id: string) {
    return this.prisma.advertiser.delete({ where: { id } });
  }

  async addCredit(id: string, amount: number, description?: string) {
    const advertiser = await this.prisma.advertiser.findUnique({ where: { id } });
    if (!advertiser) throw new NotFoundException('Advertiser not found');

    const [updated] = await this.prisma.$transaction([
      this.prisma.advertiser.update({
        where: { id },
        data: { balance: { increment: amount } },
      }),
      this.prisma.adTransaction.create({
        data: {
          advertiserId: id,
          type: 'deposit',
          amount,
          balance: advertiser.balance + amount,
          description: description || 'Credit added by admin',
        },
      }),
    ]);
    return updated;
  }

  // ============================================
  // CAMPAIGNS
  // ============================================

  async listCampaigns(params: { page: number; limit: number; status?: string; advertiserId?: string }) {
    const { page, limit, status, advertiserId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (advertiserId) where.advertiserId = advertiserId;

    const [items, total] = await Promise.all([
      this.prisma.adCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          advertiser: { select: { companyName: true } },
          _count: { select: { ads: true } },
        },
      }),
      this.prisma.adCampaign.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getCampaign(id: string) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id },
      include: {
        advertiser: true,
        ads: true,
        placements: { include: { zone: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(dto: CreateCampaignDto) {
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.adCampaign.create({ data });
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.adCampaign.update({ where: { id }, data });
  }

  async deleteCampaign(id: string) {
    return this.prisma.adCampaign.delete({ where: { id } });
  }

  async updateCampaignStatus(id: string, status: string) {
    return this.prisma.adCampaign.update({ where: { id }, data: { status } });
  }

  // ============================================
  // ADS
  // ============================================

  async listAds(params: { page: number; limit: number; campaignId?: string; status?: string }) {
    const { page, limit, campaignId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (campaignId) where.campaignId = campaignId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { campaign: { select: { name: true, advertiser: { select: { companyName: true } } } } },
      }),
      this.prisma.ad.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getAd(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: { campaign: { include: { advertiser: true } } },
    });
    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }

  async createAd(dto: CreateAdDto) {
    const { campaignId, ...adData } = dto;
    return this.prisma.ad.create({
      data: {
        ...adData,
        weight: dto.weight || 1,
        campaign: { connect: { id: campaignId } },
      },
    });
  }

  async updateAd(id: string, dto: UpdateAdDto) {
    return this.prisma.ad.update({ where: { id }, data: dto });
  }

  async deleteAd(id: string) {
    return this.prisma.ad.delete({ where: { id } });
  }

  // ============================================
  // ZONES
  // ============================================

  async listZones() {
    return this.prisma.adZone.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { placements: true } } },
    });
  }

  async getZone(id: string) {
    const zone = await this.prisma.adZone.findUnique({
      where: { id },
      include: { placements: { include: { campaign: true } } },
    });
    if (!zone) throw new NotFoundException('Zone not found');
    return zone;
  }

  async createZone(dto: CreateZoneDto) {
    return this.prisma.adZone.create({ data: dto });
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    return this.prisma.adZone.update({ where: { id }, data: dto });
  }

  async deleteZone(id: string) {
    return this.prisma.adZone.delete({ where: { id } });
  }

  // ============================================
  // PLACEMENTS
  // ============================================

  async createPlacement(dto: CreatePlacementDto) {
    return this.prisma.adPlacement.create({
      data: { ...dto, priority: dto.priority || 0, isActive: dto.isActive ?? true },
    });
  }

  async deletePlacement(id: string) {
    return this.prisma.adPlacement.delete({ where: { id } });
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getAdStats(adId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [impressions, clicks, conversions] = await Promise.all([
      this.prisma.adImpression.count({ where: { adId, createdAt: { gte: startDate } } }),
      this.prisma.adClick.count({ where: { adId, createdAt: { gte: startDate }, isFraudulent: false } }),
      this.prisma.adConversion.count({ where: { adId, createdAt: { gte: startDate } } }),
    ]);

    return { impressions, clicks, conversions, ctr: impressions > 0 ? (clicks / impressions) * 100 : 0 };
  }

  async getCampaignStats(campaignId: string, days = 30) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
      include: { ads: { select: { id: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const adIds = campaign.ads.map(a => a.id);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [impressions, clicks, fraudClicks, revenue] = await Promise.all([
      this.prisma.adImpression.count({ where: { adId: { in: adIds }, createdAt: { gte: startDate } } }),
      this.prisma.adClick.count({ where: { adId: { in: adIds }, createdAt: { gte: startDate }, isFraudulent: false } }),
      this.prisma.adClick.count({ where: { adId: { in: adIds }, createdAt: { gte: startDate }, isFraudulent: true } }),
      this.prisma.adClick.aggregate({ where: { adId: { in: adIds }, createdAt: { gte: startDate }, isFraudulent: false }, _sum: { cost: true } }),
    ]);

    return {
      impressions,
      clicks,
      fraudClicks,
      spent: revenue._sum.cost || 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      remainingBudget: campaign.budget - campaign.spent,
    };
  }

  async getPublisherEarnings(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const earnings = await this.prisma.publisherEarnings.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'desc' },
    });

    const total = earnings.reduce((sum, e) => sum + e.earnings, 0);
    return { earnings, total, days };
  }

  async getOverviewStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalAdvertisers,
      activeCampaigns,
      totalAds,
      totalZones,
      todayImpressions,
      todayClicks,
      todayRevenue,
    ] = await Promise.all([
      this.prisma.advertiser.count({ where: { status: 'active' } }),
      this.prisma.adCampaign.count({ where: { status: 'active' } }),
      this.prisma.ad.count({ where: { status: 'active' } }),
      this.prisma.adZone.count({ where: { isActive: true } }),
      this.prisma.adImpression.count({ where: { createdAt: { gte: today } } }),
      this.prisma.adClick.count({ where: { createdAt: { gte: today }, isFraudulent: false } }),
      this.prisma.adClick.aggregate({
        where: { createdAt: { gte: today }, isFraudulent: false },
        _sum: { cost: true },
      }),
    ]);

    return {
      totalAdvertisers,
      activeCampaigns,
      totalAds,
      totalZones,
      todayImpressions,
      todayClicks,
      todayRevenue: todayRevenue._sum.cost || 0,
      ctr: todayImpressions > 0 ? todayClicks / todayImpressions : 0,
    };
  }

  async getTopPerformers(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topAds = await this.prisma.ad.findMany({
      where: { clicks: { gt: 0 } },
      orderBy: { clicks: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        impressions: true,
        clicks: true,
      },
    });

    const topCampaigns = await this.prisma.adCampaign.findMany({
      where: { spent: { gt: 0 } },
      orderBy: { spent: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        impressions: true,
        clicks: true,
        spent: true,
      },
    });

    return {
      topAds: topAds.map((ad) => ({
        ...ad,
        ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
        revenue: 0,
      })),
      topCampaigns: topCampaigns.map((c) => ({
        ...c,
        ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
        revenue: c.spent,
      })),
    };
  }
}

