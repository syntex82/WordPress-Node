import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface CreateRoomDto {
  roomName?: string;
  privacy?: 'public' | 'private';
  audioOnly?: boolean;
  enableRecording?: boolean;
}

@Controller('api/video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * Create a new video room for a call
   */
  @Post('room')
  async createRoom(@Body() dto: CreateRoomDto, @Req() req: any) {
    const room = await this.videoService.createRoom({
      roomName: dto.roomName,
      privacy: dto.privacy,
      audioOnly: dto.audioOnly,
      enableRecording: dto.enableRecording,
    });

    const embedInfo = this.videoService.getEmbedInfo(room.roomName);

    return {
      success: true,
      room: {
        ...room,
        ...embedInfo,
      },
    };
  }

  /**
   * Get room details and embed info
   */
  @Get('room/:roomName')
  async getRoom(@Param('roomName') roomName: string) {
    const room = await this.videoService.getRoom(roomName);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const embedInfo = this.videoService.getEmbedInfo(roomName);
    return {
      success: true,
      room: {
        ...room,
        ...embedInfo,
      },
    };
  }

  /**
   * Delete a room
   */
  @Delete('room/:roomName')
  async deleteRoom(@Param('roomName') roomName: string) {
    const deleted = await this.videoService.deleteRoom(roomName);
    return { success: deleted };
  }

  /**
   * Generate access token for private room
   */
  @Post('room/:roomName/token')
  async generateToken(@Param('roomName') roomName: string, @Req() req: any) {
    const user = req.user;
    const token = await this.videoService.generateAccessToken(
      roomName,
      user.id,
      user.name || user.email,
    );
    return { success: true, token };
  }

  /**
   * Get embed SDK info
   */
  @Get('embed-info')
  getEmbedInfo() {
    return {
      sdkUrl: 'https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js',
      domain: process.env.METERED_DOMAIN || 'wordpressnode.metered.live',
    };
  }
}

