/**
 * Course Placeholder Image Service
 * Generates default course thumbnail images with the site logo
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as dns from 'dns';
import * as http from 'http';
import * as https from 'https';

// Blocked IP ranges for SSRF protection
const BLOCKED_IP_RANGES = [
  /^127\./,                          // Loopback
  /^10\./,                           // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
  /^192\.168\./,                     // Private Class C
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  /^224\./,                          // Multicast
  /^240\./,                          // Reserved
  /^255\./,                          // Broadcast
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 unique local
  /^fe80:/i,                         // IPv6 link-local
  /^localhost$/i,                    // localhost hostname
];

@Injectable()
export class CoursePlaceholderService {
  private readonly uploadsDir: string;
  private readonly cacheDir: string;

  constructor(private prisma: PrismaService) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.cacheDir = path.join(this.uploadsDir, 'placeholders');

    // Ensure placeholders directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Get or generate the default course placeholder image
   */
  async getCoursePlaceholder(): Promise<string> {
    const placeholderPath = path.join(this.cacheDir, 'course-default.png');

    // Check if cached placeholder exists
    if (fs.existsSync(placeholderPath)) {
      return '/uploads/placeholders/course-default.png';
    }

    // Generate new placeholder
    await this.generatePlaceholder(placeholderPath);
    return '/uploads/placeholders/course-default.png';
  }

  /**
   * Generate placeholder image with site logo
   */
  private async generatePlaceholder(outputPath: string): Promise<void> {
    const width = 800;
    const height = 450;

    // Get site logo from settings or theme customization
    const logoUrl = await this.getSiteLogo();

    // Create gradient background
    const svgBackground = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)"/>
        <text x="${width / 2}" y="${height - 40}" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)">
          NodePress LMS
        </text>
      </svg>
    `;

    let baseImage = sharp(Buffer.from(svgBackground));

    // If we have a logo, overlay it in the center
    if (logoUrl) {
      try {
        const logoBuffer = await this.fetchImage(logoUrl);
        if (logoBuffer) {
          // Resize logo to fit nicely (max 200px width, maintain aspect ratio)
          const resizedLogo = await sharp(logoBuffer)
            .resize(200, 150, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();

          const logoMeta = await sharp(resizedLogo).metadata();
          const logoWidth = logoMeta.width || 200;
          const logoHeight = logoMeta.height || 150;

          // Center the logo
          const left = Math.floor((width - logoWidth) / 2);
          const top = Math.floor((height - logoHeight) / 2) - 20;

          baseImage = baseImage.composite([{ input: resizedLogo, left, top }]);
        }
      } catch (error) {
        console.log('Could not overlay logo, using text fallback:', error.message);
        // Add fallback text if logo fails
        baseImage = await this.addFallbackText(width, height);
      }
    } else {
      // No logo - add course icon/text
      baseImage = await this.addFallbackText(width, height);
    }

    await baseImage.png().toFile(outputPath);
  }

  /**
   * Create image with fallback text (graduation cap emoji alternative)
   */
  private async addFallbackText(width: number, height: number): Promise<sharp.Sharp> {
    const svg = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)"/>
        <text x="${width / 2}" y="${height / 2 - 20}" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="72" fill="white">
          📚
        </text>
        <text x="${width / 2}" y="${height / 2 + 50}" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="28" fill="white" font-weight="bold">
          Course
        </text>
        <text x="${width / 2}" y="${height - 40}" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.7)">
          NodePress LMS
        </text>
      </svg>
    `;
    return sharp(Buffer.from(svg));
  }

  /**
   * Get site logo URL from settings or theme
   */
  private async getSiteLogo(): Promise<string | null> {
    // Try to get logo from settings
    const logoSetting = await this.prisma.setting.findFirst({
      where: { key: { in: ['site_logo', 'logo', 'logo_url'] } },
    });

    if (logoSetting?.value) {
      const value = logoSetting.value as any;
      return typeof value === 'string' ? value : value.url || null;
    }

    // Try to get logo from active theme customization
    const activeTheme = await this.prisma.theme.findFirst({
      where: { isActive: true },
      include: { customizationImages: { where: { type: 'logo' } } },
    });

    if (activeTheme?.customizationImages?.[0]?.url) {
      return activeTheme.customizationImages[0].url;
    }

    return null;
  }

  /**
   * Check if an IP address is blocked (private/reserved ranges)
   */
  private isBlockedIP(ip: string): boolean {
    return BLOCKED_IP_RANGES.some(pattern => pattern.test(ip));
  }

  /**
   * Create a safe DNS lookup function that validates resolved IPs
   */
  private createSafeLookup(): typeof dns.lookup {
    return ((hostname: string, options: any, callback: any) => {
      const cb = typeof options === 'function' ? options : callback;
      const opts = typeof options === 'function' ? {} : options;

      dns.lookup(hostname, opts, (err, address, family) => {
        if (err) {
          cb(err, address, family);
          return;
        }

        // Check if resolved IP is blocked
        if (this.isBlockedIP(address)) {
          cb(new Error(`Blocked IP address: ${address}`), address, family);
          return;
        }

        cb(null, address, family);
      });
    }) as typeof dns.lookup;
  }

  /**
   * Fetch image from URL or local path
   */
  private async fetchImage(url: string): Promise<Buffer | null> {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Parse URL and validate hostname
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(url);
        } catch {
          console.log('Invalid URL:', url);
          return null;
        }

        // Block localhost and private hostnames
        const hostname = parsedUrl.hostname.toLowerCase();
        if (this.isBlockedIP(hostname)) {
          console.log('Blocked hostname:', hostname);
          return null;
        }

        // Create HTTP agents with custom lookup to validate IP at connection time
        const safeLookup = this.createSafeLookup();
        const httpAgent = new http.Agent({ lookup: safeLookup } as any);
        const httpsAgent = new https.Agent({ lookup: safeLookup } as any);

        // SSRF protection: Custom DNS lookup validates IP addresses at connection time
        const response = await fetch(url, {
          agent: parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent,
          timeout: 10000,
        } as any);
        if (!response.ok) return null;
        return Buffer.from(await response.arrayBuffer());
      } else {
        // Local file - validate path to prevent traversal
        const baseDir = process.cwd();
        const localPath = path.resolve(baseDir, url.replace(/^\//, ''));
        // Ensure path stays within project directory
        if (!localPath.startsWith(baseDir + path.sep)) {
          console.log('Path traversal attempt blocked:', url);
          return null;
        }
        if (fs.existsSync(localPath)) {
          return fs.readFileSync(localPath);
        }
      }
    } catch (error) {
      console.log('Failed to fetch image:', error.message);
    }
    return null;
  }

  /**
   * Regenerate placeholder (e.g., when logo changes)
   */
  async regeneratePlaceholder(): Promise<string> {
    const placeholderPath = path.join(this.cacheDir, 'course-default.png');

    // Delete existing
    if (fs.existsSync(placeholderPath)) {
      fs.unlinkSync(placeholderPath);
    }

    return this.getCoursePlaceholder();
  }
}
