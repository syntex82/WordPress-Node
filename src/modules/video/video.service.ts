import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface MeteredRoom {
  roomName: string;
  roomUrl: string;
  _id: string;
}

interface CreateRoomOptions {
  roomName?: string;
  privacy?: 'public' | 'private';
  audioOnly?: boolean;
  enableRecording?: boolean;
  enableComposition?: boolean;
  maxParticipants?: number;
  ejectAtRoomExp?: boolean;
}

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly meteredDomain = process.env.METERED_DOMAIN || 'wordpressnode.metered.live';
  private readonly meteredSecretKey = process.env.METERED_SECRET_KEY;
  private readonly apiBase = 'https://wordpressnode.metered.live/api/v1';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Create a new Metered video room
   */
  async createRoom(options: CreateRoomOptions = {}): Promise<MeteredRoom> {
    if (!this.meteredSecretKey) {
      throw new BadRequestException('METERED_SECRET_KEY not configured');
    }

    const roomName = options.roomName || this.generateRoomName();
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiBase}/room?secretKey=${this.meteredSecretKey}`,
          {
            roomName,
            privacy: options.privacy || 'public',
            audioOnly: options.audioOnly || false,
            enableRecording: options.enableRecording || false,
            enableComposition: options.enableComposition || false,
            maxParticipants: options.maxParticipants || 10,
            ejectAtRoomExp: options.ejectAtRoomExp || false,
            // Enable camera/mic by default
            joinVideoOn: true,
            joinAudioOn: true,
            enableScreenSharing: true,
            enableChat: true,
          },
        ),
      );

      this.logger.log(`Created Metered room: ${roomName}`);
      return {
        roomName: response.data.roomName,
        roomUrl: `${this.meteredDomain}/${response.data.roomName}`,
        _id: response.data._id,
      };
    } catch (error) {
      this.logger.error('Failed to create Metered room:', error.response?.data || error.message);
      throw new BadRequestException('Failed to create video room');
    }
  }

  /**
   * Get room details
   */
  async getRoom(roomName: string): Promise<MeteredRoom | null> {
    if (!this.meteredSecretKey) {
      throw new BadRequestException('METERED_SECRET_KEY not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiBase}/room/${roomName}?secretKey=${this.meteredSecretKey}`,
        ),
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName: string): Promise<boolean> {
    if (!this.meteredSecretKey) {
      throw new BadRequestException('METERED_SECRET_KEY not configured');
    }

    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.apiBase}/room/${roomName}?secretKey=${this.meteredSecretKey}`,
        ),
      );
      this.logger.log(`Deleted Metered room: ${roomName}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to delete room:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Generate access token for private rooms
   */
  async generateAccessToken(roomName: string, userId: string, userName: string): Promise<string> {
    if (!this.meteredSecretKey) {
      throw new BadRequestException('METERED_SECRET_KEY not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiBase}/room/${roomName}/token?secretKey=${this.meteredSecretKey}`,
          {
            userId,
            userName,
            isAdmin: false,
          },
        ),
      );
      return response.data.token;
    } catch (error) {
      this.logger.error('Failed to generate access token:', error.response?.data || error.message);
      throw new BadRequestException('Failed to generate access token');
    }
  }

  /**
   * Get the embed info for a room
   */
  getEmbedInfo(roomName: string) {
    return {
      roomUrl: `${this.meteredDomain}/${roomName}`,
      sdkUrl: 'https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js',
      domain: this.meteredDomain,
    };
  }

  private generateRoomName(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'call-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

