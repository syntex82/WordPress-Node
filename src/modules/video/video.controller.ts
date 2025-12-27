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
  type?: 'chat' | 'group';
  targetId?: string; // conversationId or groupId
}

@Controller('api/video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * Create a video room for 1-to-1 chat
   */
  @Post('room/chat/:conversationId')
  async createChatRoom(@Param('conversationId') conversationId: string, @Req() req: any) {
    const roomName = `chat-${conversationId.substring(0, 8)}`;
    const room = await this.videoService.createRoom({
      roomName,
      maxParticipants: 2, // 1-on-1 call
    });
    const embedInfo = this.videoService.getEmbedInfo(room.roomName);
    const turnCredentials = await this.videoService.getTurnCredentials();

    return {
      success: true,
      room: { ...room, ...embedInfo },
      iceServers: turnCredentials,
    };
  }

  /**
   * Create a video room for group call
   */
  @Post('room/group/:groupId')
  async createGroupRoom(@Param('groupId') groupId: string, @Req() req: any) {
    const roomName = `group-${groupId.substring(0, 8)}`;
    const room = await this.videoService.createRoom({ roomName });
    const embedInfo = this.videoService.getEmbedInfo(room.roomName);
    const turnCredentials = await this.videoService.getTurnCredentials();

    return {
      success: true,
      room: { ...room, ...embedInfo },
      iceServers: turnCredentials,
    };
  }

  /**
   * Create a new video room for a call (generic)
   */
  @Post('room')
  async createRoom(@Body() dto: CreateRoomDto, @Req() req: any) {
    const room = await this.videoService.createRoom({
      roomName: dto.roomName,
      privacy: dto.privacy,
    });

    const embedInfo = this.videoService.getEmbedInfo(room.roomName);
    const turnCredentials = await this.videoService.getTurnCredentials();

    return {
      success: true,
      room: { ...room, ...embedInfo },
      iceServers: turnCredentials,
    };
  }

  /**
   * Get TURN/ICE server credentials
   */
  @Get('turn-credentials')
  async getTurnCredentials() {
    const iceServers = await this.videoService.getTurnCredentials();
    return { success: true, iceServers };
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

