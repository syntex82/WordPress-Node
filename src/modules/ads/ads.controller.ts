/**
 * Ads Controller - Self-hosted PPC Ad System API
 * Alternative to Google AdSense with full control
 */
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  Res,
  Headers,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AdsService } from './ads.service';

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('zone/:zoneId')
  async getAdForZone(
    @Param('zoneId') zoneId: string,
    @Query('device') device?: string,
    @Query('country') country?: string,
    @Query('path') path?: string,
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-visitor-id') visitorId?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const detectedDevice = device || this.detectDevice(userAgent);
    return this.adsService.getAdForZone(zoneId, {
      device: detectedDevice,
      country,
      path,
      sessionId,
      visitorId,
    });
  }

  @Get('zone/name/:zoneName')
  async getAdByZoneName(
    @Param('zoneName') zoneName: string,
    @Query('device') device?: string,
    @Query('country') country?: string,
    @Query('path') path?: string,
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-visitor-id') visitorId?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const detectedDevice = device || this.detectDevice(userAgent);
    return this.adsService.getAdsByZoneName(zoneName, {
      device: detectedDevice,
      country,
      path,
      sessionId,
      visitorId,
    });
  }

  @Get('zones')
  async getMultipleZones(
    @Query('names') names: string,
    @Query('device') device?: string,
    @Query('country') country?: string,
    @Query('path') path?: string,
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-visitor-id') visitorId?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const zoneNames = names.split(',').map(n => n.trim());
    const detectedDevice = device || this.detectDevice(userAgent);
    return this.adsService.getAdsForMultipleZones(zoneNames, {
      device: detectedDevice,
      country,
      path,
      sessionId,
      visitorId,
    });
  }

  @Get('click/:adId/:impressionId')
  async trackClick(
    @Param('adId') adId: string,
    @Param('impressionId') impressionId: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('path') path?: string,
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-visitor-id') visitorId?: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ) {
    const ip = forwardedFor?.split(',')[0] || req.ip;
    const device = this.detectDevice(userAgent);
    const browser = this.detectBrowser(userAgent);

    try {
      const result = await this.adsService.recordClick(adId, impressionId, {
        sessionId,
        visitorId,
        path: path || '/',
        device,
        browser,
        ip,
      });

      if (result.targetUrl) {
        return res.redirect(HttpStatus.FOUND, result.targetUrl);
      }
      return res.status(HttpStatus.OK).json({ success: true });
    } catch {
      return res.status(HttpStatus.NOT_FOUND).json({ error: 'Ad not found' });
    }
  }

  @Post('impression/:adId')
  async recordImpression(
    @Param('adId') adId: string,
    @Query('zoneId') zoneId?: string,
    @Query('path') path?: string,
    @Headers('x-session-id') sessionId?: string,
    @Headers('x-visitor-id') visitorId?: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('referer') referer?: string,
  ) {
    return this.adsService.recordImpression(adId, {
      sessionId,
      visitorId,
      path: path || '/',
      zoneId,
      device: this.detectDevice(userAgent),
      browser: this.detectBrowser(userAgent),
      referer,
    });
  }

  private detectDevice(userAgent?: string): string {
    if (!userAgent) return 'desktop';
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
      return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  private detectBrowser(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    if (/edg/i.test(userAgent)) return 'edge';
    if (/chrome/i.test(userAgent)) return 'chrome';
    if (/firefox/i.test(userAgent)) return 'firefox';
    if (/safari/i.test(userAgent)) return 'safari';
    if (/opera|opr/i.test(userAgent)) return 'opera';
    return 'other';
  }
}