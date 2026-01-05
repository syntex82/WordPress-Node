/**
 * Optimized Image Controller
 * Serves optimized images (WebP, responsive sizes) without authentication
 * GET /img/:filename - Serves optimized version based on Accept header and width param
 */

import { Controller, Get, Param, Query, Res, Headers, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { MediaService } from './media.service';
import * as fs from 'fs';

@Controller('img')
export class OptimizedImageController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Serve optimized image
   * GET /img/:filename?w=640
   *
   * Features:
   * - Automatically serves WebP if browser supports it
   * - Serves responsive size based on ?w= parameter
   * - Long cache headers (1 year) for immutable images
   * - Falls back to original if optimized version not available
   */
  @Get(':filename')
  async serveOptimizedImage(
    @Param('filename') filename: string,
    @Query('w') width: string,
    @Headers('accept') acceptHeader: string,
    @Res() res: Response,
  ) {
    try {
      // Parse width parameter
      const requestedWidth = width ? parseInt(width, 10) : undefined;

      // Check if browser supports WebP
      const supportsWebP = acceptHeader?.includes('image/webp');

      // Get optimized path (WebP or responsive size)
      const { path: imagePath, contentType } = await this.mediaService.getOptimizedPath(
        filename,
        supportsWebP ? requestedWidth : undefined,
      );

      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new NotFoundException('Image not found');
      }

      // Set cache headers (1 year for immutable images)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Vary', 'Accept'); // Vary by Accept header for WebP negotiation
      res.setHeader('Content-Type', contentType);

      // Stream the file
      const stream = fs.createReadStream(imagePath);
      stream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Image not found');
    }
  }

  /**
   * Generate srcset URLs for an image
   * GET /img/:filename/srcset
   *
   * Returns JSON with srcset string for use in templates
   */
  @Get(':filename/srcset')
  async getSrcset(@Param('filename') filename: string) {
    const srcset = await this.mediaService.generateSrcset(filename);
    return { srcset, src: `/img/${filename}` };
  }
}

