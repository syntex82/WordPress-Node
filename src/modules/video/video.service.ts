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
  private readonly meteredDomain: string;
  private readonly meteredSecretKey: string | undefined;
  private readonly apiBase: string;

  constructor(private readonly httpService: HttpService) {
    this.meteredDomain = process.env.METERED_DOMAIN || 'wordpressnode.metered.live';
    this.meteredSecretKey = process.env.METERED_SECRET_KEY;
    this.apiBase = `https://${this.meteredDomain}/api/v1`;
    this.logger.log(`Metered Video Service initialized with domain: ${this.meteredDomain}`);
  }

  /**
   * Create a new Metered video room
   */
  async createRoom(options: CreateRoomOptions = {}): Promise<MeteredRoom> {
    if (!this.meteredSecretKey) {
      throw new BadRequestException('METERED_SECRET_KEY not configured');
    }

    const roomName = options.roomName || this.generateRoomName();

    // First check if room already exists
    const existingRoom = await this.getRoom(roomName);
    if (existingRoom) {
      this.logger.log(`Using existing Metered room: ${roomName}`);
      return existingRoom;
    }

    try {
      const roomConfig: any = {
        roomName,
        privacy: options.privacy || 'public',
        ejectAtRoomExp: options.ejectAtRoomExp || false,
        joinVideoOn: true,
        joinAudioOn: true,
        enableScreenSharing: true,
        enableChat: true,
      };

      // Add max participants for 1-on-1 calls
      if (options.maxParticipants) {
        roomConfig.maxParticipants = options.maxParticipants;
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiBase}/room?secretKey=${this.meteredSecretKey}`,
          roomConfig,
        ),
      );

      this.logger.log(`Created Metered room: ${roomName}`);
      const data = response.data as MeteredRoom;
      return {
        roomName: data.roomName,
        roomUrl: `https://${this.meteredDomain}/${data.roomName}`,
        _id: data._id,
      };
    } catch (error: any) {
      // If room already exists, try to get it
      if (error.response?.data?.message?.includes('already exist')) {
        const room = await this.getRoom(roomName);
        if (room) return room;
      }
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
        this.httpService.get(`${this.apiBase}/room/${roomName}?secretKey=${this.meteredSecretKey}`),
      );
      const data = response.data as any;
      return {
        roomName: data.roomName,
        roomUrl: `https://${this.meteredDomain}/${data.roomName}`,
        _id: data._id,
      };
    } catch (error: any) {
      // Metered API returns 400 for "room not found", not 404
      if (error.response?.status === 404 || error.response?.status === 400) {
        return null;
      }
      this.logger.error('getRoom error:', error.response?.data || error.message);
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
      const data = response.data as { token: string };
      return data.token;
    } catch (error: any) {
      this.logger.error('Failed to generate access token:', error.response?.data || error.message);
      throw new BadRequestException('Failed to generate access token');
    }
  }

  /**
   * Get the embed info for a room
   */
  getEmbedInfo(roomName: string) {
    return {
      roomUrl: `https://${this.meteredDomain}/${roomName}`,
      sdkUrl: 'https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js',
      domain: this.meteredDomain,
    };
  }

  /**
   * Get TURN/ICE server credentials for WebRTC
   */
  async getTurnCredentials(): Promise<any[]> {
    if (!this.meteredSecretKey) {
      this.logger.warn('METERED_SECRET_KEY not configured, using fallback STUN');
      return [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://${this.meteredDomain}/api/v1/turn/credentials?apiKey=${this.meteredSecretKey}`,
        ),
      );
      this.logger.log('Retrieved TURN credentials from Metered');
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get TURN credentials:', error.response?.data || error.message);
      // Return free STUN servers as fallback
      return [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
    }
  }

  /**
   * Create room for a group video call
   */
  async createGroupRoom(groupId: string): Promise<MeteredRoom> {
    return this.createRoom({
      roomName: `group-${groupId.substring(0, 8)}`,
      privacy: 'public',
    });
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
