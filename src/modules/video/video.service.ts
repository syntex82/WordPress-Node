import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor() {
    this.logger.log('Video Service initialized (1-on-1 WebRTC only)');
  }

  /**
   * Get ICE server credentials for WebRTC peer-to-peer calls
   * Uses free public STUN servers - sufficient for most 1-on-1 connections
   */
  async getIceServers(): Promise<any[]> {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ];
  }
}
