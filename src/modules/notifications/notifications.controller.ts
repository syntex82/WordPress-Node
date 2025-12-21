/**
 * Notifications Controller
 * API endpoints for notification management
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService, NotificationQueryDto } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationType } from '@prisma/client';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * Get all notifications for the current user
   * GET /api/notifications
   */
  @Get()
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: NotificationType,
  ) {
    const query: NotificationQueryDto = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      unreadOnly: unreadOnly === 'true',
      type,
    };
    return this.notificationsService.findAll(req.user.id, query);
  }

  /**
   * Get unread count
   * GET /api/notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  /**
   * Mark a notification as read
   * POST /api/notifications/:id/read
   */
  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    await this.notificationsService.markAsRead(id, req.user.id);
    return { success: true };
  }

  /**
   * Mark all notifications as read
   * POST /api/notifications/read-all
   */
  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.notificationsService.delete(id, req.user.id);
    return { success: true };
  }

  /**
   * Delete all read notifications
   * DELETE /api/notifications/read
   */
  @Delete('clear/read')
  async deleteAllRead(@Request() req: any) {
    await this.notificationsService.deleteAllRead(req.user.id);
    return { success: true };
  }

  /**
   * Clear all notifications
   * DELETE /api/notifications/all
   */
  @Delete('clear/all')
  async clearAll(@Request() req: any) {
    await this.notificationsService.clearAll(req.user.id);
    return { success: true };
  }
}

