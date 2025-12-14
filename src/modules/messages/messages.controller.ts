import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private messagesGateway: MessagesGateway,
  ) {}

  /**
   * Get all conversations for the current user
   */
  @Get('conversations')
  async getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.id);
  }

  /**
   * Start or get a conversation with a user
   */
  @Post('conversations')
  async startConversation(@Request() req, @Body() body: { userId: string }) {
    return this.messagesService.getOrCreateConversation(req.user.id, body.userId);
  }

  /**
   * Get messages for a conversation
   */
  @Get('conversations/:id/messages')
  async getMessages(
    @Request() req,
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getMessages(
      conversationId,
      req.user.id,
      cursor,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  /**
   * Send a message (HTTP fallback, prefer WebSocket)
   */
  @Post('conversations/:id/messages')
  async sendMessage(
    @Request() req,
    @Param('id') conversationId: string,
    @Body() body: { content: string },
  ) {
    return this.messagesService.sendMessage(conversationId, req.user.id, body.content);
  }

  /**
   * Mark conversation as read
   */
  @Post('conversations/:id/read')
  async markAsRead(@Request() req, @Param('id') conversationId: string) {
    await this.messagesService.markAsRead(conversationId, req.user.id);
    return { success: true };
  }

  /**
   * Get total unread count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.messagesService.getUnreadCount(req.user.id);
    return { count };
  }

  /**
   * Get online users
   */
  @Get('online-users')
  async getOnlineUsers() {
    return { users: this.messagesGateway.getOnlineUsers() };
  }
}
