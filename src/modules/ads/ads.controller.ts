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

@Controller('api/ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  /**
   * Serve the ad loader script
   * This script auto-loads ads into elements with data-ad-zone attribute
   */
  @Get('loader.js')
  async getLoaderScript(@Res() res: Response) {
    const script = `
(function() {
  'use strict';

  function secureRandomId(prefix) {
    var arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return prefix + Array.from(arr, function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  var sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = secureRandomId('sess_');
    sessionStorage.setItem('sessionId', sessionId);
  }

  var visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = secureRandomId('vis_');
    localStorage.setItem('visitorId', visitorId);
  }

  function getDeviceType() {
    var ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  function loadAd(element) {
    var zoneName = element.getAttribute('data-ad-zone');
    var zoneId = element.getAttribute('data-ad-zone-id');
    var format = element.getAttribute('data-format') || 'banner';

    if (!zoneName && !zoneId) return;

    var endpoint = zoneId ? '/api/ads/zone/' + zoneId : '/api/ads/zone/name/' + zoneName;
    var params = new URLSearchParams({
      path: window.location.pathname,
      device: getDeviceType()
    });

    fetch(endpoint + '?' + params.toString(), {
      headers: {
        'x-session-id': sessionId,
        'x-visitor-id': visitorId
      }
    })
    .then(function(response) { return response.json(); })
    .then(function(ad) {
      if (!ad || !ad.adId) {
        element.style.display = 'none';
        return;
      }

      element.classList.add('ad-loaded');

      if (ad.html) {
        element.innerHTML = ad.html;
      } else if (ad.type === 'banner' && ad.imageUrl) {
        var link = document.createElement('a');
        link.href = ad.trackingUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer sponsored';
        var img = document.createElement('img');
        img.src = ad.imageUrl;
        img.alt = ad.headline || 'Advertisement';
        img.style.maxWidth = '100%';
        link.appendChild(img);
        element.appendChild(link);
      } else if (ad.type === 'text' || ad.type === 'native') {
        var link = document.createElement('a');
        link.href = ad.trackingUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer sponsored';
        link.className = 'ad-native';
        if (ad.imageUrl) {
          var img = document.createElement('img');
          img.src = ad.imageUrl;
          img.alt = '';
          link.appendChild(img);
        }
        if (ad.headline) {
          var h4 = document.createElement('h4');
          h4.textContent = ad.headline;
          link.appendChild(h4);
        }
        if (ad.description) {
          var p = document.createElement('p');
          p.textContent = ad.description;
          link.appendChild(p);
        }
        if (ad.ctaText) {
          var btn = document.createElement('span');
          btn.className = 'ad-cta';
          btn.textContent = ad.ctaText;
          link.appendChild(btn);
        }
        element.appendChild(link);
      }
    })
    .catch(function(err) {
      console.warn('Ad load failed:', err);
      element.style.display = 'none';
    });
  }

  function init() {
    var adElements = document.querySelectorAll('[data-ad-zone], [data-ad-zone-id]');
    adElements.forEach(loadAd);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for dynamic loading
  window.NodePressAds = { loadAd: loadAd, reload: init };
})();
`;
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(script);
  }

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