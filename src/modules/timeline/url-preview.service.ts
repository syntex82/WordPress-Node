/**
 * URL Preview Service
 * Fetches Open Graph and meta data from URLs for link previews
 */

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

// Blocked IP ranges (private, loopback, link-local, etc.)
const BLOCKED_IP_PATTERNS = [
  /^127\./,                          // Loopback
  /^10\./,                           // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
  /^192\.168\./,                     // Private Class C
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-9])\./,  // Carrier-grade NAT
  /^192\.0\.0\./,                    // IETF Protocol Assignments
  /^192\.0\.2\./,                    // TEST-NET-1
  /^198\.51\.100\./,                 // TEST-NET-2
  /^203\.0\.113\./,                  // TEST-NET-3
  /^224\./,                          // Multicast
  /^240\./,                          // Reserved
  /^255\./,                          // Broadcast
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 unique local
  /^fe80:/i,                         // IPv6 link-local
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  'metadata.google.internal',        // GCP metadata
  '169.254.169.254',                 // AWS/Azure/GCP metadata
  'metadata.azure.com',
];

export interface UrlPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
}

@Injectable()
export class UrlPreviewService {
  private readonly timeout = 5000; // 5 second timeout
  private readonly maxContentLength = 1024 * 1024; // 1MB max

  /**
   * Check if an IP address is in a blocked range (SSRF protection)
   */
  private isBlockedIP(ip: string): boolean {
    return BLOCKED_IP_PATTERNS.some(pattern => pattern.test(ip));
  }

  /**
   * Validate URL is safe to fetch (SSRF protection)
   */
  private async validateUrlSafety(url: string): Promise<void> {
    const parsedUrl = new URL(url);

    // Check blocked hostnames
    const hostname = parsedUrl.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      throw new Error('URL hostname is not allowed');
    }

    // Check if hostname is an IP address
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      if (this.isBlockedIP(hostname)) {
        throw new Error('URL points to a blocked IP address');
      }
    } else {
      // Resolve hostname and check resolved IP
      try {
        const { address } = await dnsLookup(hostname);
        if (this.isBlockedIP(address)) {
          throw new Error('URL resolves to a blocked IP address');
        }
      } catch (err: any) {
        if (err.code === 'ENOTFOUND') {
          throw new Error('URL hostname could not be resolved');
        }
        throw err;
      }
    }
  }

  async fetchPreview(url: string): Promise<UrlPreviewData> {
    try {
      // Validate URL format
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol');
      }

      // SSRF protection: validate URL is safe to fetch
      await this.validateUrlSafety(url);

      // Fetch the page
      const response = await axios.get(url, {
        timeout: this.timeout,
        maxContentLength: this.maxContentLength,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NodePress/1.0; +https://nodepress.io)',
          Accept: 'text/html,application/xhtml+xml',
        },
        validateStatus: (status) => status < 400,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract Open Graph meta tags
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDescription = $('meta[property="og:description"]').attr('content');
      const ogImage = $('meta[property="og:image"]').attr('content');
      const ogSiteName = $('meta[property="og:site_name"]').attr('content');
      const ogType = $('meta[property="og:type"]').attr('content');

      // Fallback to Twitter Card meta tags
      const twitterTitle = $('meta[name="twitter:title"]').attr('content');
      const twitterDescription = $('meta[name="twitter:description"]').attr('content');
      const twitterImage = $('meta[name="twitter:image"]').attr('content');

      // Fallback to standard meta tags
      const metaDescription = $('meta[name="description"]').attr('content');
      const pageTitle = $('title').text();

      // Try to find any image on the page as a last resort
      let fallbackImage: string | undefined;
      const firstImg = $('img[src]').first().attr('src');
      if (firstImg) {
        fallbackImage = this.resolveUrl(firstImg, url);
      }

      // Resolve relative image URLs
      let imageUrl = ogImage || twitterImage || fallbackImage;
      if (imageUrl) {
        imageUrl = this.resolveUrl(imageUrl, url);
      }

      return {
        url,
        title: ogTitle || twitterTitle || pageTitle || parsedUrl.hostname,
        description: ogDescription || twitterDescription || metaDescription,
        image: imageUrl,
        siteName: ogSiteName || parsedUrl.hostname,
        type: ogType,
      };
    } catch (error) {
      console.error('Error fetching URL preview:', error.message);
      // Return minimal data on error
      try {
        const parsedUrl = new URL(url);
        return {
          url,
          title: parsedUrl.hostname,
          siteName: parsedUrl.hostname,
        };
      } catch {
        return { url };
      }
    }
  }

  private resolveUrl(relativeUrl: string, baseUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  /**
   * Check if a URL is a video embed (YouTube, Vimeo, etc.)
   */
  isVideoEmbed(url: string): boolean {
    const videoPatterns = [
      /youtube\.com\/watch/i,
      /youtu\.be\//i,
      /vimeo\.com\//i,
      /dailymotion\.com\//i,
      /twitch\.tv\//i,
    ];
    return videoPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Extract YouTube video ID
   */
  getYouTubeVideoId(url: string): string | null {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/i,
      /youtu\.be\/([^?]+)/i,
      /youtube\.com\/embed\/([^?]+)/i,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
}
