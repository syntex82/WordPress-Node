/**
 * Video Ads Service
 * Handles pre-roll, mid-roll, post-roll, and outstream video ads
 * Supports VAST/VPAID for third-party video ad networks
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface VideoAdRequest {
  zoneId?: string;
  contentId?: string;       // The video content being watched
  contentDuration?: number; // Duration of main video in seconds
  position: 'pre-roll' | 'mid-roll' | 'post-roll' | 'outstream';
  playerWidth?: number;
  playerHeight?: number;
  sessionId?: string;
  visitorId?: string;
  device?: string;
  country?: string;
}

export interface VideoAdResponse {
  adId: string;
  impressionId: string;
  type: 'video';
  videoUrl: string;
  duration: number;          // Ad duration in seconds
  skipAfter?: number;        // Can skip after X seconds (null = not skippable)
  clickUrl: string;
  trackingUrls: {
    impression: string;
    start: string;
    firstQuartile: string;   // 25%
    midpoint: string;        // 50%
    thirdQuartile: string;   // 75%
    complete: string;        // 100%
    skip: string;
    click: string;
    pause: string;
    resume: string;
    mute: string;
    unmute: string;
    fullscreen: string;
  };
  companionAds?: Array<{     // Banner ads shown alongside video
    imageUrl: string;
    width: number;
    height: number;
    clickUrl: string;
  }>;
  vastUrl?: string;          // For VAST-compatible players
}

@Injectable()
export class VideoAdsService {
  private readonly logger = new Logger(VideoAdsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a video ad for the specified position
   */
  async getVideoAd(request: VideoAdRequest): Promise<VideoAdResponse | null> {
    // Find active video campaigns
    const campaigns = await this.prisma.adCampaign.findMany({
      where: {
        status: 'active',
        type: { in: ['cpv', 'cpcv', 'video'] }, // Cost per view, cost per completed view, or video type
        ads: {
          some: {
            type: 'video',
            status: 'active',
            videoUrl: { not: null },
          },
        },
      },
      include: {
        ads: {
          where: { type: 'video', status: 'active' },
        },
        placements: request.zoneId ? {
          where: { zoneId: request.zoneId, isActive: true },
        } : undefined,
      },
      orderBy: { bidAmount: 'desc' },
    });

    // Filter by zone placement if specified
    let eligibleCampaigns = campaigns;
    if (request.zoneId) {
      eligibleCampaigns = campaigns.filter(c => c.placements && c.placements.length > 0);
    }

    if (eligibleCampaigns.length === 0) {
      return null;
    }

    // Select best campaign (highest bidder)
    const campaign = eligibleCampaigns[0];
    const ad = campaign.ads[0];

    // Record impression
    const impression = await this.prisma.adImpression.create({
      data: {
        adId: ad.id,
        sessionId: request.sessionId,
        visitorId: request.visitorId,
        path: `video:${request.position}`,
        zoneId: request.zoneId,
        device: request.device,
        country: request.country,
      },
    });

    const baseTrackingUrl = `/api/ads/video/track/${ad.id}/${impression.id}`;

    return {
      adId: ad.id,
      impressionId: impression.id,
      type: 'video',
      videoUrl: ad.videoUrl!,
      duration: 30, // Default 30 seconds
      skipAfter: 5,  // Skip after 5 seconds
      clickUrl: `${baseTrackingUrl}?event=click`,
      trackingUrls: {
        impression: `${baseTrackingUrl}?event=impression`,
        start: `${baseTrackingUrl}?event=start`,
        firstQuartile: `${baseTrackingUrl}?event=firstQuartile`,
        midpoint: `${baseTrackingUrl}?event=midpoint`,
        thirdQuartile: `${baseTrackingUrl}?event=thirdQuartile`,
        complete: `${baseTrackingUrl}?event=complete`,
        skip: `${baseTrackingUrl}?event=skip`,
        click: `${baseTrackingUrl}?event=click`,
        pause: `${baseTrackingUrl}?event=pause`,
        resume: `${baseTrackingUrl}?event=resume`,
        mute: `${baseTrackingUrl}?event=mute`,
        unmute: `${baseTrackingUrl}?event=unmute`,
        fullscreen: `${baseTrackingUrl}?event=fullscreen`,
      },
      vastUrl: `/api/ads/vast/${ad.id}?impression=${impression.id}`,
    };
  }

  /**
   * Track video ad events (start, quartiles, complete, skip, etc.)
   */
  async trackEvent(adId: string, impressionId: string, event: string, data?: any) {
    this.logger.debug(`Video ad event: ${event} for ad ${adId}`);

    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      include: { campaign: true },
    });
    if (!ad) return { success: false };

    // Store event in analytics
    await this.prisma.adClick.create({
      data: {
        adId,
        impressionId,
        path: `video:${event}`,
        cost: 0, // Will be set on billable events
      },
    });

    // Charge for completed views (CPCV)
    if (event === 'complete' && ad.campaign.type === 'cpcv') {
      await this.chargeForView(ad.campaign.id, ad.campaign.bidAmount);
    }

    // Charge for views (CPV) - typically at start or 50%
    if (event === 'midpoint' && ad.campaign.type === 'cpv') {
      await this.chargeForView(ad.campaign.id, ad.campaign.bidAmount);
    }

    return { success: true };
  }

  private async chargeForView(campaignId: string, amount: number) {
    await this.prisma.$transaction([
      this.prisma.adCampaign.update({
        where: { id: campaignId },
        data: { spent: { increment: amount } },
      }),
    ]);
  }
}

