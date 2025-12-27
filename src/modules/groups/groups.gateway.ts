import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket Gateway for real-time group chat
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly in production
    credentials: true,
  },
  namespace: '/groups',
})
export class GroupsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track online users per group
  private onlineUsers: Map<string, Set<string>> = new Map(); // groupId -> Set of userIds
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds (supports multiple devices)
  private socketUsers: Map<string, any> = new Map(); // socketId -> user object

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from handshake
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Store user-socket mapping (supports multiple devices)
      this.socketUsers.set(client.id, user);
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(client.id);

      // Send current online users list to the newly connected client
      const onlineUserIds = Array.from(this.userSockets.keys());
      client.emit('users:online:list', { users: onlineUserIds });

      // Broadcast this user's online status to all other clients
      this.server.emit('user:online', { userId: user.id });

      console.log(
        `User ${user.name} connected to groups gateway (${onlineUserIds.length} users online, ${this.userSockets.get(user.id)!.size} devices)`,
      );
    } catch (error) {
      console.error('WebSocket authentication failed:', error.message);
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  async handleDisconnect(client: Socket) {
    const user = this.socketUsers.get(client.id);

    if (user) {
      this.socketUsers.delete(client.id);

      // Remove socket from user's set
      const userSocketSet = this.userSockets.get(user.id);
      if (userSocketSet) {
        userSocketSet.delete(client.id);

        // Only broadcast offline if user has no more connected sockets
        if (userSocketSet.size === 0) {
          // Remove user from all groups they were in
          this.onlineUsers.forEach((users, groupId) => {
            if (users.has(user.id)) {
              users.delete(user.id);
              // Notify group that user went offline
              this.server.to(`group:${groupId}`).emit('group:user:offline', {
                userId: user.id,
                userName: user.name,
              });
            }
          });

          this.userSockets.delete(user.id);

          // Broadcast offline status to all clients
          this.server.emit('user:offline', { userId: user.id });
          console.log(`User ${user.name} disconnected from groups gateway (now offline)`);
        } else {
          console.log(
            `User ${user.name} disconnected one device from groups (${userSocketSet.size} devices still connected)`,
          );
        }
      }
    }
  }

  /**
   * Join a group room
   */
  @SubscribeMessage('group:join')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    const user = this.socketUsers.get(client.id);

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { groupId } = data;

    // Verify user is a member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.isBanned) {
      return { error: 'You are not a member of this group' };
    }

    // Join the Socket.io room
    client.join(`group:${groupId}`);

    // Track online user
    if (!this.onlineUsers.has(groupId)) {
      this.onlineUsers.set(groupId, new Set());
    }
    this.onlineUsers.get(groupId)!.add(user.id);

    // Notify group that user came online
    this.server.to(`group:${groupId}`).emit('group:user:online', {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
    });

    // Send current online users to the joining user
    const onlineUserIds = Array.from(this.onlineUsers.get(groupId) || []);
    return { success: true, onlineUsers: onlineUserIds };
  }

  /**
   * Leave a group room
   */
  @SubscribeMessage('group:leave')
  async handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    const user = this.socketUsers.get(client.id);

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { groupId } = data;

    // Leave the Socket.io room
    client.leave(`group:${groupId}`);

    // Remove from online users
    if (this.onlineUsers.has(groupId)) {
      this.onlineUsers.get(groupId)!.delete(user.id);
    }

    // Notify group that user went offline
    this.server.to(`group:${groupId}`).emit('group:user:offline', {
      userId: user.id,
      userName: user.name,
    });

    return { success: true };
  }

  /**
   * Send a message to the group with optional media
   */
  @SubscribeMessage('group:message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      groupId: string;
      content: string;
      media?: Array<{
        url: string;
        type: 'image' | 'video';
        filename: string;
        size: number;
        mimeType: string;
      }>;
    },
  ) {
    const user = this.socketUsers.get(client.id);

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { groupId, content, media } = data;

    try {
      // Verify user is a member and not banned
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: user.id,
          },
        },
      });

      if (!membership || membership.isBanned) {
        return { error: 'You are not allowed to send messages in this group' };
      }

      // Save message to database with media
      const message = await this.prisma.groupMessage.create({
        data: {
          groupId,
          senderId: user.id,
          content,
          media: media && media.length > 0 ? media : [],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // Broadcast message to all group members
      this.server.to(`group:${groupId}`).emit('group:message:new', message);

      return { success: true, message };
    } catch (error) {
      console.error('Error sending group message:', error);
      return { error: error.message || 'Failed to send message' };
    }
  }

  /**
   * User started typing
   */
  @SubscribeMessage('group:typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    const user = this.socketUsers.get(client.id);

    if (!user) {
      return;
    }

    const { groupId } = data;

    // Broadcast to all group members except sender
    client.to(`group:${groupId}`).emit('group:typing', {
      userId: user.id,
      userName: user.name,
      isTyping: true,
    });
  }

  /**
   * User stopped typing
   */
  @SubscribeMessage('group:typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    const user = this.socketUsers.get(client.id);

    if (!user) {
      return;
    }

    const { groupId } = data;

    // Broadcast to all group members except sender
    client.to(`group:${groupId}`).emit('group:typing', {
      userId: user.id,
      userName: user.name,
      isTyping: false,
    });
  }

  /**
   * Delete a message
   */
  @SubscribeMessage('group:message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string; messageId: string },
  ) {
    const user = this.socketUsers.get(client.id);

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { groupId, messageId } = data;

    // Get the message
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
      include: { group: true },
    });

    if (!message) {
      return { error: 'Message not found' };
    }

    // Check if user owns the message or is group owner/moderator
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });

    const canDelete =
      message.senderId === user.id ||
      message.group.ownerId === user.id ||
      membership?.role === 'MODERATOR';

    if (!canDelete) {
      return { error: 'You cannot delete this message' };
    }

    // Delete the message
    await this.prisma.groupMessage.delete({ where: { id: messageId } });

    // Broadcast deletion to all group members
    this.server.to(`group:${groupId}`).emit('group:message:deleted', { messageId, groupId });

    return { success: true };
  }

  /**
   * Emit event when a new member joins the group (called from service)
   */
  emitMemberJoined(groupId: string, member: any) {
    this.server.to(`group:${groupId}`).emit('group:member:joined', member);
  }

  /**
   * Emit event when a member leaves the group (called from service)
   */
  emitMemberLeft(groupId: string, userId: string) {
    this.server.to(`group:${groupId}`).emit('group:member:left', { userId });
  }

  /**
   * User started a video call in group
   */
  @SubscribeMessage('group:video:start')
  async handleVideoStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string; roomUrl: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return;

    // Notify all group members that a video call is active
    this.server.to(`group:${data.groupId}`).emit('group:video:started', {
      groupId: data.groupId,
      roomUrl: data.roomUrl,
      startedBy: {
        id: user.id,
        name: user.name,
      },
    });

    return { success: true };
  }

  /**
   * User ended/left video call in group
   */
  @SubscribeMessage('group:video:end')
  async handleVideoEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return;

    this.server.to(`group:${data.groupId}`).emit('group:video:ended', {
      groupId: data.groupId,
      endedBy: user.id,
    });

    return { success: true };
  }
}
