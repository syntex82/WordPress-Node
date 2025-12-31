/**
 * Notifications Service
 * Handles creating, retrieving, and managing user notifications
 */

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';

export interface CreateNotificationDto {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
  icon?: string;
  iconColor?: string;
  metadata?: Record<string, any>;
}

export interface NotificationQueryDto {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Create a new notification and send it in real-time
   */
  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type || 'INFO',
        title: dto.title,
        message: dto.message,
        link: dto.link,
        icon: dto.icon,
        iconColor: dto.iconColor,
        metadata: dto.metadata,
      },
    });

    // Send real-time notification
    this.notificationsGateway.sendNotificationToUser(dto.userId, notification);

    // Update unread count
    const unreadCount = await this.getUnreadCount(dto.userId);
    this.notificationsGateway.sendUnreadCountToUser(dto.userId, unreadCount);

    return notification;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulk(userIds: string[], notification: Omit<CreateNotificationDto, 'userId'>) {
    return this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: notification.type || 'INFO',
        title: notification.title,
        message: notification.message,
        link: notification.link,
        icon: notification.icon,
        iconColor: notification.iconColor,
        metadata: notification.metadata,
      })),
    });
  }

  /**
   * Notify all admins
   */
  async notifyAdmins(notification: Omit<CreateNotificationDto, 'userId'>) {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    return this.createBulk(
      admins.map((a) => a.id),
      notification,
    );
  }

  /**
   * Get notifications for a user
   */
  async findAll(userId: string, query: NotificationQueryDto = {}) {
    const { page = 1, limit = 20, unreadOnly = false, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) where.isRead = false;
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Delete a notification
   */
  async delete(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Delete all read notifications for a user
   */
  async deleteAllRead(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  }

  /**
   * Clear all notifications for a user
   */
  async clearAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }
}
