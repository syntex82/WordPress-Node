/**
 * Notifications Gateway
 * WebSocket gateway for real-time notifications
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected users: userId -> Set of socketIds (supports multiple devices)
  private userSockets: Map<string, Set<string>> = new Map();
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

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

      // Track user's socket connection
      this.socketUsers.set(client.id, userId);
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user's notification room
      client.join(`user:${userId}`);

      console.log(`User ${user.name} connected to notifications gateway`);
    } catch (error) {
      console.error('Notifications WebSocket auth failed:', error.message);
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
   * Send a notification to a specific user in real-time
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Send updated unread count to a user
   */
  sendUnreadCountToUser(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('notification:unread-count', { count });
  }

  /**
   * Check if user is currently connected
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
