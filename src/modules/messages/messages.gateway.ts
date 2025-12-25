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
import { MessagesService } from './messages.service';

/**
 * WebSocket Gateway for real-time direct messaging
 */
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track online users and their sockets (supports multiple devices per user)
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketUsers: Map<string, any> = new Map(); // socketId -> user object

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) throw new UnauthorizedException('No token provided');

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, avatar: true },
      });

      if (!user) throw new UnauthorizedException('User not found');

      this.socketUsers.set(client.id, user);

      // Add socket to user's set of sockets (supports multiple devices)
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(client.id);

      // Send current online users list to the newly connected client
      const onlineUserIds = Array.from(this.userSockets.keys());
      client.emit('users:online:list', { users: onlineUserIds });

      // Broadcast this user's online status to all other clients
      this.server.emit('user:online', { userId: user.id });
      console.log(`User ${user.name} connected to messages gateway (${onlineUserIds.length} users online, ${this.userSockets.get(user.id)!.size} devices)`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error.message);
      client.disconnect();
    }
  }

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
          this.userSockets.delete(user.id);
          this.server.emit('user:offline', { userId: user.id });
          console.log(`User ${user.name} disconnected from messages gateway (now offline)`);
        } else {
          console.log(`User ${user.name} disconnected one device (${userSocketSet.size} devices still connected)`);
        }
      }
    }
  }

  @SubscribeMessage('dm:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      media?: Array<{ url: string; type: 'image' | 'video'; filename: string; size: number; mimeType: string }>;
    },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    try {
      const message = await this.messagesService.sendMessage(
        data.conversationId,
        user.id,
        data.content,
        data.media,
      );

      // Get conversation to find recipient
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversationId },
      });

      if (conversation) {
        const recipientId =
          conversation.participant1Id === user.id
            ? conversation.participant2Id
            : conversation.participant1Id;

        // Send to sender
        client.emit('dm:message:new', message);

        // Send to recipient if online (all their devices)
        this.emitToUser(recipientId, 'dm:message:new', message);
      }

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: error.message || 'Failed to send message' };
    }
  }

  @SubscribeMessage('dm:typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });
    if (!conversation) return;

    const recipientId =
      conversation.participant1Id === user.id
        ? conversation.participant2Id
        : conversation.participant1Id;

    this.emitToUser(recipientId, 'dm:typing', {
      conversationId: data.conversationId,
      userId: user.id,
      userName: user.name,
      isTyping: true,
    });
  }

  @SubscribeMessage('dm:typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });
    if (!conversation) return;

    const recipientId =
      conversation.participant1Id === user.id
        ? conversation.participant2Id
        : conversation.participant1Id;

    this.emitToUser(recipientId, 'dm:typing', {
      conversationId: data.conversationId,
      userId: user.id,
      userName: user.name,
      isTyping: false,
    });
  }

  @SubscribeMessage('dm:read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return;

    await this.messagesService.markAsRead(data.conversationId, user.id);

    // Notify the other user that messages were read
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });
    if (conversation) {
      const recipientId =
        conversation.participant1Id === user.id
          ? conversation.participant2Id
          : conversation.participant1Id;
      this.emitToUser(recipientId, 'dm:read', { conversationId: data.conversationId, readBy: user.id });
    }
  }

  @SubscribeMessage('dm:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    // Verify user owns the message
    const message = await this.prisma.directMessage.findUnique({
      where: { id: data.messageId },
    });

    if (!message || message.senderId !== user.id) {
      return { error: 'Cannot delete this message' };
    }

    // Delete the message
    await this.prisma.directMessage.delete({ where: { id: data.messageId } });

    // Notify both users
    client.emit('dm:message:deleted', {
      messageId: data.messageId,
      conversationId: data.conversationId,
    });

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });
    if (conversation) {
      const recipientId =
        conversation.participant1Id === user.id
          ? conversation.participant2Id
          : conversation.participant1Id;
      this.emitToUser(recipientId, 'dm:message:deleted', {
        messageId: data.messageId,
        conversationId: data.conversationId,
      });
    }

    return { success: true };
  }

  // ==================== VIDEO CALL SIGNALING ====================

  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; conversationId: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    if (!this.isUserOnline(data.targetUserId)) {
      client.emit('call:error', { message: 'User is offline' });
      return { error: 'User is offline' };
    }

    // Send call request to target user (all their devices)
    this.emitToUser(data.targetUserId, 'call:incoming', {
      callerId: user.id,
      callerName: user.name,
      callerAvatar: user.avatar,
      conversationId: data.conversationId,
    });

    return { success: true };
  }

  @SubscribeMessage('call:accept')
  async handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callerId: string; conversationId: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    this.emitToUser(data.callerId, 'call:accepted', {
      acceptedBy: user.id,
      acceptedByName: user.name,
      conversationId: data.conversationId,
    });

    return { success: true };
  }

  @SubscribeMessage('call:reject')
  async handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callerId: string; reason?: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    this.emitToUser(data.callerId, 'call:rejected', {
      rejectedBy: user.id,
      reason: data.reason || 'Call declined',
    });

    return { success: true };
  }

  @SubscribeMessage('call:end')
  async handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    this.emitToUser(data.targetUserId, 'call:ended', {
      endedBy: user.id,
    });

    return { success: true };
  }

  @SubscribeMessage('call:offer')
  async handleCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; offer: RTCSessionDescriptionInit },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    this.emitToUser(data.targetUserId, 'call:offer', {
      callerId: user.id,
      offer: data.offer,
    });

    return { success: true };
  }

  @SubscribeMessage('call:answer')
  async handleCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; answer: RTCSessionDescriptionInit },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    this.emitToUser(data.targetUserId, 'call:answer', {
      answererId: user.id,
      answer: data.answer,
    });

    return { success: true };
  }

  @SubscribeMessage('call:ice-candidate')
  async handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; candidate: RTCIceCandidateInit },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    this.emitToUser(data.targetUserId, 'call:ice-candidate', {
      fromUserId: user.id,
      candidate: data.candidate,
    });

    return { success: true };
  }

  /**
   * Handle client request for online users list
   * Useful for reconnection scenarios where the client needs to refresh the list
   */
  @SubscribeMessage('users:request:list')
  handleRequestOnlineUsers(@ConnectedSocket() client: Socket) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    const onlineUserIds = Array.from(this.userSockets.keys());
    client.emit('users:online:list', { users: onlineUserIds });
    console.log(`User ${user.name} requested online users list (${onlineUserIds.length} users online)`);
    return { success: true, count: onlineUserIds.length };
  }

  /**
   * Handle ping request from client to verify connection is alive
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };
    return { pong: true, timestamp: Date.now() };
  }

  // Get list of online users
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Helper to emit to all sockets of a user (supports multiple devices)
  private emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}
