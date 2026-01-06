/**
 * URL Preview Service
 * Fetches Open Graph and meta data from URLs for link previews
 */

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

  async fetchPreview(url: string): Promise<UrlPreviewData> {
    try {
      // Validate URL
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol');
      }

      // Fetch the page
      const response = await axios.get(url, {
        timeout: this.timeout,
        maxContentLength: this.maxContentLength,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NodePress/1.0; +https://nodepress.io)',
          'Accept': 'text/html,application/xhtml+xml',
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
    return videoPatterns.some(pattern => pattern.test(url));
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

