/**
 * House Ads Service
 * Manage YOUR OWN ads - no payment required
 * Perfect for promoting your own products, newsletter, affiliate links, etc.
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateHouseAdDto, UpdateHouseAdDto } from './dto';

@Injectable()
export class HouseAdsService {
  private readonly logger = new Logger(HouseAdsService.name);
  
  // Special advertiser ID for house ads (created on first use)
  private readonly HOUSE_ADVERTISER_NAME = '__HOUSE_ADS__';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create the house ads "advertiser" (internal system account)
   */
  private async getHouseAdvertiser() {
    let advertiser = await this.prisma.advertiser.findFirst({
      where: { companyName: this.HOUSE_ADVERTISER_NAME },
    });

    if (!advertiser) {
      advertiser = await this.prisma.advertiser.create({
        data: {
          companyName: this.HOUSE_ADVERTISER_NAME,
          contactEmail: 'house-ads@internal',
          status: 'active',
          balance: 999999999, // Unlimited balance - it's your site!
        },
      });
      this.logger.log('Created house ads internal advertiser');
    }

    return advertiser;
  }

  /**
   * Create a house ad - FREE, no payment needed
   */
  async create(dto: CreateHouseAdDto) {
    const advertiser = await this.getHouseAdvertiser();

    // Create a campaign for this house ad
    const campaign = await this.prisma.adCampaign.create({
      data: {
        advertiserId: advertiser.id,
        name: `House: ${dto.name}`,
        type: 'house', // Special type - never charged
        status: 'active',
        budget: 0, // No budget needed
        bidAmount: dto.priority || 100, // Priority used as bid for ordering
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        targetUrl: dto.targetUrl,
      },
    });

    // Create the ad
    const ad = await this.prisma.ad.create({
      data: {
        campaignId: campaign.id,
        name: dto.name,
        type: dto.type,
        format: dto.format,
        headline: dto.headline,
        description: dto.description,
        imageUrl: dto.imageUrl,
        html: dto.html,
        ctaText: dto.ctaText || 'Learn More',
        status: 'active',
        weight: dto.priority || 100,
      },
    });

    // Create placements for specified zones
    if (dto.zones?.length) {
      await Promise.all(
        dto.zones.map((zoneId) =>
          this.prisma.adPlacement.create({
            data: {
              campaignId: campaign.id,
              zoneId,
              priority: dto.priority || 100,
              isActive: true,
            },
          }),
        ),
      );
    }

    return { campaign, ad, message: 'House ad created - runs for FREE!' };
  }

  /**
   * List all house ads
   */
  async list() {
    const advertiser = await this.prisma.advertiser.findFirst({
      where: { companyName: this.HOUSE_ADVERTISER_NAME },
    });

    if (!advertiser) return { ads: [], total: 0 };

    const campaigns = await this.prisma.adCampaign.findMany({
      where: { advertiserId: advertiser.id },
      include: {
        ads: true,
        placements: { include: { zone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ads: campaigns.map((c) => ({
        id: c.id,
        name: c.name.replace('House: ', ''),
        ad: c.ads[0],
        zones: c.placements.map((p) => p.zone),
        targetUrl: c.targetUrl,
        status: c.status,
        impressions: c.impressions || 0,
        clicks: c.clicks || 0,
        ctr: c.impressions > 0
          ? ((c.clicks / c.impressions) * 100).toFixed(2)
          : '0.00',
        createdAt: c.createdAt,
      })),
      total: campaigns.length,
    };
  }

  /**
   * Update a house ad
   */
  async update(campaignId: string, dto: UpdateHouseAdDto) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
      include: { ads: true },
    });
    if (!campaign) throw new NotFoundException('House ad not found');

    // Update campaign
    await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: {
        name: dto.name ? `House: ${dto.name}` : undefined,
        targetUrl: dto.targetUrl,
        status: dto.isActive === false ? 'paused' : dto.isActive === true ? 'active' : undefined,
        bidAmount: dto.priority,
      },
    });

    // Update ad if exists
    if (campaign.ads[0]) {
      await this.prisma.ad.update({
        where: { id: campaign.ads[0].id },
        data: {
          name: dto.name,
          headline: dto.headline,
          description: dto.description,
          imageUrl: dto.imageUrl,
          html: dto.html,
          ctaText: dto.ctaText,
          weight: dto.priority,
        },
      });
    }

    return { success: true };
  }

  /**
   * Delete a house ad
   */
  async delete(campaignId: string) {
    await this.prisma.adCampaign.delete({ where: { id: campaignId } });
    return { success: true };
  }
}

