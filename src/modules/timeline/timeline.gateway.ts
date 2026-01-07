/**
 * Timeline Gateway
 * WebSocket gateway for real-time timeline updates
 * Handles new posts, likes, comments, and shares in real-time
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/timeline',
})
export class TimelineGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected users
  private userSockets: Map<string, Set<string>> = new Map();
  private socketUsers: Map<string, string> = new Map();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) throw new UnauthorizedException('No token provided');

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      });

      if (!user) throw new UnauthorizedException('User not found');

      // Track connection
      this.socketUsers.set(client.id, userId);
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join timeline room for global updates
      client.join('timeline:public');
      // Join user's personal room for targeted updates
      client.join(`user:${userId}`);

      console.log(`User ${user.name} connected to timeline gateway`);
    } catch (error) {
      console.error('Timeline WebSocket auth failed:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      this.socketUsers.delete(client.id);
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  /**
   * Subscribe to a specific hashtag's updates
   */
  @SubscribeMessage('subscribe:hashtag')
  handleSubscribeHashtag(client: Socket, hashtag: string) {
    const normalizedTag = hashtag.toLowerCase().replace('#', '');
    client.join(`hashtag:${normalizedTag}`);
    return { subscribed: normalizedTag };
  }

  /**
   * Unsubscribe from a hashtag
   */
  @SubscribeMessage('unsubscribe:hashtag')
  handleUnsubscribeHashtag(client: Socket, hashtag: string) {
    const normalizedTag = hashtag.toLowerCase().replace('#', '');
    client.leave(`hashtag:${normalizedTag}`);
    return { unsubscribed: normalizedTag };
  }

  /**
   * Broadcast a new post to all connected users
   */
  broadcastNewPost(post: any) {
    this.server.to('timeline:public').emit('post:new', post);

    // Also emit to specific hashtag rooms
    if (post.hashtags && post.hashtags.length > 0) {
      for (const hashtag of post.hashtags) {
        this.server.to(`hashtag:${hashtag.tag}`).emit('hashtag:new-post', {
          hashtag: hashtag.tag,
          post,
        });
      }
    }
  }

  /**
   * Broadcast post like update
   */
  broadcastPostLike(postId: string, likesCount: number, likedBy: any) {
    this.server.to('timeline:public').emit('post:liked', {
      postId,
      likesCount,
      likedBy,
    });
  }

  /**
   * Broadcast post unlike update
   */
  broadcastPostUnlike(postId: string, likesCount: number) {
    this.server.to('timeline:public').emit('post:unliked', {
      postId,
      likesCount,
    });
  }

  /**
   * Broadcast new comment
   */
  broadcastNewComment(postId: string, comment: any, commentsCount: number) {
    this.server.to('timeline:public').emit('post:commented', {
      postId,
      comment,
      commentsCount,
    });
  }

  /**
   * Broadcast post share
   */
  broadcastPostShare(originalPostId: string, sharesCount: number, sharedBy: any) {
    this.server.to('timeline:public').emit('post:shared', {
      originalPostId,
      sharesCount,
      sharedBy,
    });
  }

  /**
   * Send update to specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
