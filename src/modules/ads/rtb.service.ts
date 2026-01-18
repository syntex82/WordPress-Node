/**
 * Real-Time Bidding (RTB) Service
 * Implements OpenRTB-compatible auction system
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Escape special regex characters to prevent ReDoS attacks
 * Only allows * as a wildcard (converted to .*)
 */
function escapeRegexPattern(pattern: string): string {
  // First escape all special regex characters except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Then convert * to .*
  return escaped.replace(/\*/g, '.*');
}

export interface BidRequest {
  id: string;
  zoneId: string;
  site: {
    domain: string;
    page: string;
    categories?: string[];
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    ua?: string;
    ip?: string;
    geo?: { country?: string; region?: string; city?: string };
  };
  user?: {
    id?: string;
    segments?: string[];
  };
  floor?: number; // Minimum bid price
  timeout?: number; // Max response time in ms
}

export interface Bid {
  id: string;
  campaignId: string;
  adId: string;
  price: number;
  currency: string;
  adMarkup?: string;
  advertiserDomain?: string;
  categories?: string[];
}

export interface BidResponse {
  id: string;
  bidRequestId: string;
  seatBid: Array<{
    seat: string;
    bids: Bid[];
  }>;
  currency: string;
  processingTime: number;
}

export interface AuctionResult {
  winner: Bid | null;
  secondPrice: number;
  allBids: Bid[];
  auctionId: string;
}

@Injectable()
export class RtbService {
  private readonly logger = new Logger(RtbService.name);
  private readonly DEFAULT_TIMEOUT = 100; // 100ms
  private readonly DEFAULT_CURRENCY = 'USD';

  constructor(private readonly prisma: PrismaService) {}

  async conductAuction(request: BidRequest): Promise<AuctionResult> {
    const startTime = Date.now();
    const timeout = request.timeout || this.DEFAULT_TIMEOUT;

    // Get eligible campaigns for this zone
    const eligibleCampaigns = await this.getEligibleCampaigns(request);

    // Collect bids from all eligible campaigns
    const bids: Bid[] = [];
    for (const campaign of eligibleCampaigns) {
      const bid = await this.generateBid(campaign, request);
      if (bid && bid.price >= (request.floor || 0)) {
        bids.push(bid);
      }
    }

    // Run second-price auction
    const result = this.runSecondPriceAuction(bids, request.id);

    const processingTime = Date.now() - startTime;
    this.logger.debug(`Auction completed in ${processingTime}ms with ${bids.length} bids`);

    return result;
  }

  async processBidRequest(request: BidRequest): Promise<BidResponse> {
    const startTime = Date.now();
    const result = await this.conductAuction(request);

    const seatBids = result.winner
      ? [{ seat: result.winner.campaignId, bids: [result.winner] }]
      : [];

    return {
      id: `resp-${Date.now()}`,
      bidRequestId: request.id,
      seatBid: seatBids,
      currency: this.DEFAULT_CURRENCY,
      processingTime: Date.now() - startTime,
    };
  }

  private async getEligibleCampaigns(request: BidRequest) {
    const now = new Date();
    
    return this.prisma.adCampaign.findMany({
      where: {
        status: 'active',
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        advertiser: { status: 'active', balance: { gt: 0 } },
        placements: { some: { zoneId: request.zoneId, isActive: true } },
      },
      include: {
        ads: { where: { status: 'active' } },
        advertiser: { select: { id: true, balance: true } },
      },
    });
  }

  private async generateBid(campaign: any, request: BidRequest): Promise<Bid | null> {
    // Check targeting rules
    if (!this.matchesTargeting(campaign, request)) return null;

    // Select best ad from campaign
    const ad = this.selectBestAd(campaign.ads, request);
    if (!ad) return null;

    // Calculate bid price with adjustments
    const basePrice = campaign.bidAmount;
    const adjustedPrice = this.calculateAdjustedBid(basePrice, campaign, request);

    return {
      id: `bid-${Date.now()}-${campaign.id}`,
      campaignId: campaign.id,
      adId: ad.id,
      price: adjustedPrice,
      currency: this.DEFAULT_CURRENCY,
      adMarkup: ad.html || undefined,
      advertiserDomain: campaign.advertiser?.website,
    };
  }

  private matchesTargeting(campaign: any, request: BidRequest): boolean {
    // Device targeting
    if (campaign.targetDevices?.length > 0) {
      if (!campaign.targetDevices.includes(request.device.type)) return false;
    }
    // Country targeting
    if (campaign.targetCountries?.length > 0 && request.device.geo?.country) {
      if (!campaign.targetCountries.includes(request.device.geo.country)) return false;
    }
    // Page targeting (with regex escaping to prevent ReDoS)
    if (campaign.targetPages?.length > 0) {
      const matches = campaign.targetPages.some((pattern: string) => {
        const regex = new RegExp(escapeRegexPattern(pattern));
        return regex.test(request.site.page);
      });
      if (!matches) return false;
    }
    return true;
  }

  private selectBestAd(ads: any[], request: BidRequest): any {
    if (!ads.length) return null;
    // Weighted random selection
    const totalWeight = ads.reduce((sum, ad) => sum + (ad.weight || 1), 0);
    let random = Math.random() * totalWeight;
    for (const ad of ads) {
      random -= ad.weight || 1;
      if (random <= 0) return ad;
    }
    return ads[0];
  }

  private calculateAdjustedBid(basePrice: number, campaign: any, request: BidRequest): number {
    let price = basePrice;
    // Premium for mobile (higher engagement)
    if (request.device.type === 'mobile') price *= 1.1;
    // Discount for tablet
    if (request.device.type === 'tablet') price *= 0.95;
    return Math.round(price * 1000) / 1000;
  }

  private runSecondPriceAuction(bids: Bid[], requestId: string): AuctionResult {
    if (bids.length === 0) {
      return { winner: null, secondPrice: 0, allBids: [], auctionId: `auction-${requestId}` };
    }
    const sorted = [...bids].sort((a, b) => b.price - a.price);
    const winner = { ...sorted[0] };
    const secondPrice = sorted.length > 1 ? sorted[1].price : sorted[0].price * 0.9;
    winner.price = Math.round((secondPrice + 0.01) * 1000) / 1000;
    return { winner, secondPrice, allBids: sorted, auctionId: `auction-${requestId}` };
  }
}

