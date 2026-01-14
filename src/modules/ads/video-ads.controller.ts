/**
 * Video Ads Controller
 * Endpoints for serving and tracking video ads
 */
import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Res,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { VideoAdsService, VideoAdRequest } from './video-ads.service';

@Controller('api/ads')
export class VideoAdsController {
  constructor(private readonly videoAdsService: VideoAdsService) {}

  /**
   * Get a video ad
   * GET /api/ads/video?position=pre-roll&zone=video-player
   */
  @Get('video')
  async getVideoAd(
    @Query('position') position: 'pre-roll' | 'mid-roll' | 'post-roll' | 'outstream' = 'pre-roll',
    @Query('zone') zoneId?: string,
    @Query('contentId') contentId?: string,
    @Query('duration') contentDuration?: string,
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-visitor-id') visitorId?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const request: VideoAdRequest = {
      position,
      zoneId,
      contentId,
      contentDuration: contentDuration ? parseInt(contentDuration) : undefined,
      sessionId,
      visitorId,
      device: this.detectDevice(userAgent),
    };

    const ad = await this.videoAdsService.getVideoAd(request);
    
    if (!ad) {
      return { noAd: true, message: 'No video ad available' };
    }

    return ad;
  }

  /**
   * Track video ad events
   * GET /api/ads/video/track/:adId/:impressionId?event=start
   */
  @Get('video/track/:adId/:impressionId')
  async trackEvent(
    @Param('adId') adId: string,
    @Param('impressionId') impressionId: string,
    @Query('event') event: string,
    @Res() res: Response,
  ) {
    await this.videoAdsService.trackEvent(adId, impressionId, event);
    
    // Return 1x1 transparent pixel (for tracking beacons)
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store');
    res.send(pixel);
  }

  /**
   * Get VAST XML for video ad (for VAST-compatible video players)
   * GET /api/ads/vast/:adId?impression=xxx
   */
  @Get('vast/:adId')
  async getVastXml(
    @Param('adId') adId: string,
    @Query('impression') impressionId: string,
    @Res() res: Response,
  ) {
    // This would generate VAST XML for third-party video players
    // VAST = Video Ad Serving Template (industry standard)
    
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const trackingBase = `${baseUrl}/api/ads/video/track/${adId}/${impressionId}`;

    const vastXml = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.0">
  <Ad id="${adId}">
    <InLine>
      <AdSystem>YourAdSystem</AdSystem>
      <AdTitle>Video Ad</AdTitle>
      <Impression><![CDATA[${trackingBase}?event=impression]]></Impression>
      <Creatives>
        <Creative>
          <Linear skipoffset="00:00:05">
            <Duration>00:00:30</Duration>
            <TrackingEvents>
              <Tracking event="start"><![CDATA[${trackingBase}?event=start]]></Tracking>
              <Tracking event="firstQuartile"><![CDATA[${trackingBase}?event=firstQuartile]]></Tracking>
              <Tracking event="midpoint"><![CDATA[${trackingBase}?event=midpoint]]></Tracking>
              <Tracking event="thirdQuartile"><![CDATA[${trackingBase}?event=thirdQuartile]]></Tracking>
              <Tracking event="complete"><![CDATA[${trackingBase}?event=complete]]></Tracking>
              <Tracking event="skip"><![CDATA[${trackingBase}?event=skip]]></Tracking>
            </TrackingEvents>
            <VideoClicks>
              <ClickThrough><![CDATA[${trackingBase}?event=click]]></ClickThrough>
            </VideoClicks>
            <MediaFiles>
              <MediaFile type="video/mp4" width="1920" height="1080">
                <![CDATA[VIDEO_URL_HERE]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(vastXml);
  }

  private detectDevice(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }
}

