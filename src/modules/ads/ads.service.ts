/**
 * Ads Service - Self-hosted PPC Ad Revenue System
 * Provides ad serving, click tracking, and revenue analytics
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FraudDetectionService } from './fraud-detection.service';
import { sanitizeAdHtml } from '../../utils/sanitize';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fraudDetection: FraudDetectionService,
  ) {}

  // ============================================
  // AD SERVING
  // ============================================

  async getAdForZone(zoneId: string, context: {
    device?: string;
    country?: string;
    path?: string;
    sessionId?: string;
    visitorId?: string;
  }) {
    const zone = await this.prisma.adZone.findUnique({ where: { id: zoneId } });
    if (!zone || !zone.isActive) {
      // Sanitize fallback HTML to prevent XSS
      return zone?.fallbackHtml ? { html: sanitizeAdHtml(zone.fallbackHtml) } : null;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Find eligible campaigns for this zone
    const placements = await this.prisma.adPlacement.findMany({
      where: {
        zoneId,
        isActive: true,
        campaign: {
          status: 'active',
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
      },
      include: {
        campaign: {
          include: {
            advertiser: true,
            ads: { where: { status: 'active' } },
          },
        },
      },
      orderBy: { priority: 'desc' },
    });

    // Filter by targeting and budget
    const eligiblePlacements = placements.filter(p => {
      const c = p.campaign;
      // Check budget
      if (c.spent >= c.budget) return false;
      if (c.dailyBudget && this.getDailySpend(c.id) >= c.dailyBudget) return false;
      // Check advertiser balance
      if (c.advertiser.balance <= 0) return false;
      // Check device targeting
      if (c.targetDevices && context.device) {
        const devices = c.targetDevices as string[];
        if (!devices.includes(context.device)) return false;
      }
      // Check country targeting
      if (c.targetCountries && context.country) {
        const countries = c.targetCountries as string[];
        if (!countries.includes(context.country)) return false;
      }
      // Check page targeting
      if (c.targetPages && context.path) {
        const pages = c.targetPages as string[];
        if (!pages.some(pattern => this.matchPath(context.path!, pattern))) return false;
      }
      // Check hour targeting
      if (c.targetHours) {
        const hours = c.targetHours as Array<{ start: number; end: number }>;
        if (!hours.some(h => currentHour >= h.start && currentHour <= h.end)) return false;
      }
      // Check day targeting
      if (c.targetDays) {
        const days = c.targetDays as number[];
        if (!days.includes(currentDay)) return false;
      }
      return true;
    });

    if (eligiblePlacements.length === 0) {
      // Sanitize fallback HTML to prevent XSS
      return zone.fallbackHtml ? { html: sanitizeAdHtml(zone.fallbackHtml) } : null;
    }

    // Select ad using weighted random (based on bid amount and priority)
    const selectedPlacement = this.selectWeightedRandom(eligiblePlacements);
    const campaign = selectedPlacement.campaign;
    const ad = this.selectAdVariant(campaign.ads);

    // Sanitize fallback HTML to prevent XSS
    if (!ad) return zone.fallbackHtml ? { html: sanitizeAdHtml(zone.fallbackHtml) } : null;

    // Record impression
    const impression = await this.recordImpression(ad.id, {
      sessionId: context.sessionId,
      visitorId: context.visitorId,
      path: context.path || '',
      zoneId,
      device: context.device,
      country: context.country,
    });

    // Calculate CPM cost if applicable (skip for house ads - they're FREE)
    if (campaign.type === 'cpm') {
      await this.chargeCpm(campaign.id, campaign.bidAmount);
    }

    return {
      adId: ad.id,
      impressionId: impression.id,
      type: ad.type,
      format: ad.format,
      headline: ad.headline,
      description: ad.description,
      imageUrl: ad.imageUrl,
      videoUrl: ad.videoUrl,
      // Sanitize HTML to prevent XSS attacks
      html: ad.html ? sanitizeAdHtml(ad.html) : null,
      ctaText: ad.ctaText,
      targetUrl: campaign.targetUrl,
      trackingUrl: `/api/ads/click/${ad.id}/${impression.id}`,
    };
  }

  async getAdsByZoneName(zoneName: string, context: any) {
    const zone = await this.prisma.adZone.findUnique({ where: { name: zoneName } });
    if (!zone) return null;
    return this.getAdForZone(zone.id, context);
  }

  async getAdsForMultipleZones(zoneNames: string[], context: any) {
    const results: Record<string, any> = {};
    for (const zoneName of zoneNames) {
      const zone = await this.prisma.adZone.findUnique({ where: { name: zoneName } });
      if (zone) {
        results[zoneName] = await this.getAdForZone(zone.id, context);
      }
    }
    return results;
  }

  private dailySpendCache: Map<string, { amount: number; date: string }> = new Map();

  private getDailySpend(campaignId: string): number {
    const today = new Date().toISOString().split('T')[0];
    const cached = this.dailySpendCache.get(campaignId);
    if (cached && cached.date === today) return cached.amount;
    return 0;
  }

  private matchPath(path: string, pattern: string): boolean {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
  }

  private selectWeightedRandom(placements: any[]) {
    const totalWeight = placements.reduce((sum, p) => 
      sum + (p.campaign.bidAmount * (p.priority + 1)), 0);
    let random = Math.random() * totalWeight;
    for (const p of placements) {
      random -= p.campaign.bidAmount * (p.priority + 1);
      if (random <= 0) return p;
    }
    return placements[0];
  }

  private selectAdVariant(ads: any[]) {
    if (ads.length === 0) return null;
    const totalWeight = ads.reduce((sum, ad) => sum + ad.weight, 0);
    let random = Math.random() * totalWeight;
    for (const ad of ads) {
      random -= ad.weight;
      if (random <= 0) return ad;
    }
    return ads[0];
  }

  // ============================================
  // IMPRESSION & CLICK TRACKING
  // ============================================

  async recordImpression(adId: string, data: {
    sessionId?: string;
    visitorId?: string;
    path: string;
    zoneId?: string;
    device?: string;
    browser?: string;
    country?: string;
    referer?: string;
  }) {
    const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw new NotFoundException('Ad not found');

    const impression = await this.prisma.adImpression.create({
      data: {
        adId,
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        path: data.path,
        zoneId: data.zoneId,
        device: data.device,
        browser: data.browser,
        country: data.country,
        referer: data.referer,
      },
    });

    await this.prisma.ad.update({
      where: { id: adId },
      data: { impressions: { increment: 1 } },
    });

    return impression;
  }

  async recordClick(adId: string, impressionId: string, data: {
    sessionId?: string;
    visitorId?: string;
    path: string;
    zoneId?: string;
    device?: string;
    browser?: string;
    country?: string;
    ip?: string;
  }) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      include: { campaign: { include: { advertiser: true } } },
    });
    if (!ad) throw new NotFoundException('Ad not found');

    // Fraud detection
    const fraud = await this.detectFraud(adId, data);

    const click = await this.prisma.adClick.create({
      data: {
        adId,
        impressionId,
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        path: data.path,
        zoneId: data.zoneId,
        device: data.device,
        browser: data.browser,
        country: data.country,
        ip: data.ip,
        cost: fraud.isFraud ? 0 : ad.campaign.bidAmount,
        isFraudulent: fraud.isFraud,
        fraudReason: fraud.reason,
      },
    });

    if (!fraud.isFraud) {
      // Charge for CPC (skip for house ads - they're FREE!)
      const isHouseAd = ad.campaign.type === 'house';
      if (ad.campaign.type === 'cpc' && !isHouseAd) {
        await this.chargeCpc(ad.campaign.id, ad.campaign.bidAmount);
      }

      await this.prisma.ad.update({
        where: { id: adId },
        data: { clicks: { increment: 1 } },
      });

      await this.prisma.adCampaign.update({
        where: { id: ad.campaign.id },
        data: { clicks: { increment: 1 } },
      });
    }

    return { click, targetUrl: ad.campaign.targetUrl };
  }

  private async detectFraud(adId: string, data: any): Promise<{ isFraud: boolean; reason?: string }> {
    try {
      const analysis = await this.fraudDetection.analyzeClick({
        adId,
        impressionId: data.impressionId,
        sessionId: data.sessionId,
        visitorId: data.visitorId,
        ip: data.ip,
        userAgent: data.userAgent,
        path: data.path,
        device: data.device,
      });

      if (analysis.action === 'block') {
        const reasons = analysis.signals.map(s => s.type).join(', ');
        this.logger.warn(`Blocked click on ad ${adId}: ${reasons} (score: ${analysis.fraudScore})`);
        return { isFraud: true, reason: reasons };
      }

      if (analysis.action === 'flag') {
        this.logger.debug(`Flagged click on ad ${adId}: score ${analysis.fraudScore}`);
      }

      return { isFraud: false };
    } catch (error) {
      this.logger.error(`Fraud detection failed: ${error}`);
      // Fall back to basic detection
      return this.basicFraudCheck(adId, data);
    }
  }

  private async basicFraudCheck(adId: string, data: any): Promise<{ isFraud: boolean; reason?: string }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (data.sessionId) {
      const recentClicks = await this.prisma.adClick.count({
        where: { adId, sessionId: data.sessionId, createdAt: { gte: fiveMinutesAgo } },
      });
      if (recentClicks >= 3) return { isFraud: true, reason: 'rapid_clicking' };
    }

    if (data.ip) {
      const ipClicks = await this.prisma.adClick.count({
        where: { adId, ip: data.ip, createdAt: { gte: fiveMinutesAgo } },
      });
      if (ipClicks >= 5) return { isFraud: true, reason: 'ip_abuse' };
    }

    return { isFraud: false };
  }

  private async chargeCpc(campaignId: string, amount: number) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
      include: { advertiser: true },
    });
    if (!campaign) return;

    await this.prisma.$transaction([
      this.prisma.adCampaign.update({
        where: { id: campaignId },
        data: { spent: { increment: amount } },
      }),
      this.prisma.advertiser.update({
        where: { id: campaign.advertiserId },
        data: {
          balance: { decrement: amount },
          totalSpent: { increment: amount },
        },
      }),
      this.prisma.adTransaction.create({
        data: {
          advertiserId: campaign.advertiserId,
          type: 'spend',
          amount: -amount,
          balance: campaign.advertiser.balance - amount,
          description: `CPC click on campaign: ${campaign.name}`,
          reference: campaignId,
        },
      }),
    ]);

    // Update daily spend cache
    const today = new Date().toISOString().split('T')[0];
    const cached = this.dailySpendCache.get(campaignId);
    this.dailySpendCache.set(campaignId, {
      date: today,
      amount: (cached?.date === today ? cached.amount : 0) + amount,
    });

    // Record publisher earnings
    await this.recordPublisherEarnings(amount);
  }

  private async chargeCpm(campaignId: string, cpmRate: number) {
    const amount = cpmRate / 1000; // CPM is per 1000 impressions
    await this.chargeCpc(campaignId, amount); // Reuse same logic
  }

  private async recordPublisherEarnings(amount: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.publisherEarnings.upsert({
      where: { date: today },
      create: { date: today, earnings: amount, impressions: 1 },
      update: { earnings: { increment: amount } },
    });
  }
}