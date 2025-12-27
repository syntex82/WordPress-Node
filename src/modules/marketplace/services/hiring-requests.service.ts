/**
 * Hiring Requests Service
 * Handles hiring request workflow between clients and developers
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { HiringRequestStatus } from '@prisma/client';
import { CreateHiringRequestDto, UpdateHiringRequestStatusDto } from '../dto';

@Injectable()
export class HiringRequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new hiring request
   */
  async create(clientId: string, dto: CreateHiringRequestDto) {
    // Verify developer exists and is active
    const developer = await this.prisma.developer.findUnique({
      where: { id: dto.developerId },
      include: { user: true },
    });
    if (!developer) throw new NotFoundException('Developer not found');
    if (developer.status !== 'ACTIVE') throw new BadRequestException('Developer is not available');
    if (developer.userId === clientId) throw new BadRequestException('Cannot hire yourself');

    const request = await this.prisma.hiringRequest.create({
      data: {
        clientId,
        developerId: dto.developerId,
        title: dto.title,
        description: dto.description,
        requirements: dto.requirements,
        budgetType: dto.budgetType || 'fixed',
        budgetAmount: dto.budgetAmount,
        estimatedHours: dto.estimatedHours,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        status: 'PENDING',
      },
      include: {
        client: { select: { id: true, name: true, email: true, avatar: true } },
        developer: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // Notify developer
    await this.notificationsService.create({
      userId: developer.userId,
      type: 'MARKETPLACE',
      title: 'New Hiring Request',
      message: `You have a new hiring request: "${dto.title}"`,
      link: `/admin/marketplace/requests/${request.id}`,
    });

    return request;
  }

  /**
   * Get hiring request by ID
   */
  async findById(id: string, userId: string, isAdmin = false) {
    const request = await this.prisma.hiringRequest.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true, avatar: true } },
        developer: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        project: true,
      },
    });
    if (!request) throw new NotFoundException('Hiring request not found');

    // Check authorization
    if (!isAdmin && request.clientId !== userId && request.developer.userId !== userId) {
      throw new ForbiddenException('Not authorized to view this request');
    }

    return request;
  }

  /**
   * List hiring requests for a user
   */
  async findForUser(
    userId: string,
    role: 'client' | 'developer',
    filters: {
      status?: HiringRequestStatus;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, page = 1, limit = 10 } = filters;

    const where: any = {};
    if (role === 'client') {
      where.clientId = userId;
    } else {
      where.developer = { userId };
    }
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      this.prisma.hiringRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: { select: { id: true, name: true, avatar: true } },
          developer: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        },
      }),
      this.prisma.hiringRequest.count({ where }),
    ]);

    return { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Update hiring request status (developer accepts/rejects)
   */
  async updateStatus(
    id: string,
    userId: string,
    dto: UpdateHiringRequestStatusDto,
    isAdmin = false,
  ) {
    const request = await this.prisma.hiringRequest.findUnique({
      where: { id },
      include: { developer: true, client: true },
    });
    if (!request) throw new NotFoundException('Hiring request not found');

    // Authorization check
    const isDeveloper = request.developer.userId === userId;
    const isClient = request.clientId === userId;

    if (!isAdmin && !isDeveloper && !isClient) {
      throw new ForbiddenException('Not authorized');
    }

    // Validate status transitions
    const validTransitions = this.getValidTransitions(
      request.status as HiringRequestStatus,
      isDeveloper,
    );
    if (!validTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${request.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.hiringRequest.update({
      where: { id },
      data: {
        status: dto.status,
        responseMessage: dto.responseMessage,
        respondedAt: ['ACCEPTED', 'REJECTED'].includes(dto.status) ? new Date() : undefined,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        developer: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    // Notify the other party
    const notifyUserId = isDeveloper ? request.clientId : request.developer.userId;
    await this.notificationsService.create({
      userId: notifyUserId,
      type: 'MARKETPLACE',
      title: `Hiring Request ${dto.status}`,
      message: `Your hiring request "${request.title}" has been ${dto.status.toLowerCase()}`,
      link: `/admin/marketplace/requests/${id}`,
    });

    return updated;
  }

  private getValidTransitions(
    current: HiringRequestStatus,
    isDeveloper: boolean,
  ): HiringRequestStatus[] {
    const transitions: Record<HiringRequestStatus, HiringRequestStatus[]> = {
      PENDING: isDeveloper ? ['ACCEPTED', 'REJECTED'] : ['CANCELLED'],
      ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
      REJECTED: [],
      CANCELLED: [],
      IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
      COMPLETED: [],
      DISPUTED: [],
    };
    return transitions[current] || [];
  }
}
