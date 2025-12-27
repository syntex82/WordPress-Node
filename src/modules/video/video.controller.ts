import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureGuard } from '../../common/guards/feature.guard';
import {
  RequiresFeature,
  SUBSCRIPTION_FEATURES,
} from '../../common/decorators/subscription.decorator';

@Controller('api/video')
@UseGuards(JwtAuthGuard, FeatureGuard)
@RequiresFeature(SUBSCRIPTION_FEATURES.VIDEO_CALLS)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * Get ICE server credentials for 1-on-1 WebRTC video calls
   * Works for both direct messages and group member calls
   */
  @Get('ice-servers')
  async getIceServers() {
    const iceServers = await this.videoService.getIceServers();
    return {
      success: true,
      iceServers,
      info: 'Video calls are 1-on-1 only. Select a user to call.',
    };
  }

  /**
   * Start a video call (returns ICE servers for WebRTC)
   * Used by both chat and group contexts
   */
  @Post('call')
  async startCall() {
    const iceServers = await this.videoService.getIceServers();
    return {
      success: true,
      iceServers,
      type: 'one-on-one',
      message: 'Video calls connect you directly with one other person.',
    };
  }
}
