import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(userId1: string, userId2: string) {
    if (userId1 === userId2) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    // Normalize order to ensure consistent lookup
    const [p1, p2] = [userId1, userId2].sort();

    // Try to find existing conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: p1, participant2Id: p2 },
          { participant1Id: p2, participant2Id: p1 },
        ],
      },
      include: {
        participant1: { select: { id: true, name: true, email: true, avatar: true } },
        participant2: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { participant1Id: p1, participant2Id: p2 },
        include: {
          participant1: { select: { id: true, name: true, email: true, avatar: true } },
          participant2: { select: { id: true, name: true, email: true, avatar: true } },
        },
      });
    }

    return conversation;
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: { select: { id: true, name: true, email: true, avatar: true } },
        participant2: { select: { id: true, name: true, email: true, avatar: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.prisma.directMessage.count({
          where: { conversationId: conv.id, senderId: { not: userId }, isRead: false },
        });
        const otherUser = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
        return {
          ...conv,
          otherUser,
          unreadCount,
          lastMessage: conv.messages[0] || null,
        };
      }),
    );

    return conversationsWithUnread;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return messages.reverse();
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: senderId }, { participant2Id: senderId }],
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.directMessage.create({
      data: { conversationId, senderId, content },
      include: { sender: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.directMessage.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Get total unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      select: { id: true },
    });
    
    return this.prisma.directMessage.count({
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: userId },
        isRead: false,
      },
    });
  }
}

