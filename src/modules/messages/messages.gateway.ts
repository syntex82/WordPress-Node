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

  // Track online users and their sockets
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
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
      this.userSockets.set(user.id, client.id);

      // Broadcast online status
      this.server.emit('user:online', { userId: user.id });
      console.log(`User ${user.name} connected to messages gateway`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = this.socketUsers.get(client.id);
    if (user) {
      this.userSockets.delete(user.id);
      this.socketUsers.delete(client.id);
      this.server.emit('user:offline', { userId: user.id });
      console.log(`User ${user.name} disconnected from messages gateway`);
    }
  }

  @SubscribeMessage('dm:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const user = this.socketUsers.get(client.id);
    if (!user) return { error: 'Unauthorized' };

    const message = await this.messagesService.sendMessage(
      data.conversationId,
      user.id,
      data.content,
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

      // Send to recipient if online
      const recipientSocketId = this.userSockets.get(recipientId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('dm:message:new', message);
      }
    }

    return { success: true, message };
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
    const recipientSocketId = this.userSockets.get(recipientId);

    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('dm:typing', {
        conversationId: data.conversationId,
        userId: user.id,
        userName: user.name,
        isTyping: true,
      });
    }
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
    const recipientSocketId = this.userSockets.get(recipientId);

    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('dm:typing', {
        conversationId: data.conversationId,
        userId: user.id,
        userName: user.name,
        isTyping: false,
      });
    }
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
      const recipientSocketId = this.userSockets.get(recipientId);
      if (recipientSocketId) {
        this.server
          .to(recipientSocketId)
          .emit('dm:read', { conversationId: data.conversationId, readBy: user.id });
      }
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
      const recipientSocketId = this.userSockets.get(recipientId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('dm:message:deleted', {
          messageId: data.messageId,
          conversationId: data.conversationId,
        });
      }
    }

    return { success: true };
  }

  // Get list of online users
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
