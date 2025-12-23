import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Media type interface
interface MediaAttachment {
  url: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  mimeType: string;
}

// Multer storage configuration for message media
const messageMediaStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'messages'),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter for images and videos
const mediaFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

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
   * Send a message with optional media (HTTP fallback, prefer WebSocket)
   */
  @Post('conversations/:id/messages')
  async sendMessage(
    @Request() req,
    @Param('id') conversationId: string,
    @Body() body: { content: string; media?: MediaAttachment[] },
  ) {
    return this.messagesService.sendMessage(conversationId, req.user.id, body.content, body.media);
  }

  /**
   * Upload media files for messages
   */
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: messageMediaStorage,
      fileFilter: mediaFileFilter,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
    }),
  )
  async uploadMedia(@UploadedFiles() files: Express.Multer.File[]) {
    const media: MediaAttachment[] = files.map((file) => ({
      url: `/uploads/messages/${file.filename}`,
      type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    }));
    return { media };
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

  /**
   * Delete a message (HTTP fallback, prefer WebSocket)
   */
  @Delete('conversations/:conversationId/messages/:messageId')
  async deleteMessage(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.deleteMessage(conversationId, messageId, req.user.id);
  }
}
