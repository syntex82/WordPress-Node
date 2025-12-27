/**
 * Projects Service
 * Handles project management between clients and developers
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SystemConfigService } from '../../settings/system-config.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectStatus,
  LogHoursDto,
  CreateProjectReviewDto,
} from '../dto';
import { DevelopersService } from './developers.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private developersService: DevelopersService,
    private systemConfig: SystemConfigService,
  ) {}

  /**
   * Create a new project
   */
  async create(clientId: string, dto: CreateProjectDto) {
    const developer = await this.prisma.developer.findUnique({ where: { id: dto.developerId } });
    if (!developer) throw new NotFoundException('Developer not found');
    if (developer.status !== 'ACTIVE') throw new BadRequestException('Developer is not active');

    // Get platform fee from system config (default 10%)
    const platformFeePercent = await this.systemConfig.getPlatformFeePercent();
    const platformFee = dto.totalBudget * (platformFeePercent / 100);

    const project = await this.prisma.project.create({
      data: {
        clientId,
        developerId: dto.developerId,
        title: dto.title,
        description: dto.description,
        requirements: dto.requirements,
        budgetType: dto.budgetType || 'fixed',
        totalBudget: dto.totalBudget,
        hourlyRate: dto.hourlyRate,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        milestones: dto.milestones || [],
        platformFeePercent,
        platformFee,
        status: 'DRAFT',
      },
      include: {
        client: { select: { id: true, name: true, email: true, avatar: true } },
        developer: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    // Notify developer
    await this.notificationsService.create({
      userId: developer.userId,
      type: 'MARKETPLACE',
      title: 'New Project Created',
      message: `A new project "${dto.title}" has been created with you`,
      link: `/admin/marketplace/projects/${project.id}`,
    });

    return project;
  }

  /**
   * Create project from accepted hiring request
   */
  async createFromHiringRequest(hiringRequestId: string) {
    const request = await this.prisma.hiringRequest.findUnique({
      where: { id: hiringRequestId },
      include: { developer: true },
    });
    if (!request) throw new NotFoundException('Hiring request not found');
    if (request.status !== 'ACCEPTED')
      throw new BadRequestException('Request must be accepted first');
    if (request.projectId) throw new BadRequestException('Project already created');

    // Get platform fee from system config (default 10%)
    const platformFeePercent = await this.systemConfig.getPlatformFeePercent();
    const platformFee = Number(request.budgetAmount) * (platformFeePercent / 100);

    const project = await this.prisma.project.create({
      data: {
        clientId: request.clientId,
        developerId: request.developerId,
        title: request.title,
        description: request.description,
        requirements: request.requirements,
        budgetType: request.budgetType,
        totalBudget: request.budgetAmount,
        hourlyRate: request.budgetType === 'hourly' ? request.budgetAmount : null,
        deadline: request.deadline,
        platformFeePercent,
        platformFee,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    });

    // Link project to hiring request
    await this.prisma.hiringRequest.update({
      where: { id: hiringRequestId },
      data: { projectId: project.id, status: 'IN_PROGRESS' },
    });

    return project;
  }

  /**
   * Get project by ID
   */
  async findById(id: string, userId: string, isAdmin = false) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true, avatar: true } },
        developer: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        transactions: { orderBy: { createdAt: 'desc' } },
        messages: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    if (!isAdmin && project.clientId !== userId && project.developer.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    return project;
  }

  /**
   * Update project
   */
  async update(id: string, userId: string, dto: UpdateProjectDto, isAdmin = false) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { developer: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const isClient = project.clientId === userId;
    const isDeveloper = project.developer.userId === userId;
    if (!isAdmin && !isClient && !isDeveloper) throw new ForbiddenException('Not authorized');

    return this.prisma.project.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        requirements: dto.requirements,
        progress: dto.progress,
        status: dto.status as any,
        milestones: dto.milestones,
        deliverables: dto.deliverables,
      },
    });
  }

  /**
   * Log hours for hourly projects (developer only)
   */
  async logHours(projectId: string, userId: string, dto: LogHoursDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { developer: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.developer.userId !== userId)
      throw new ForbiddenException('Only developer can log hours');
    if (project.budgetType !== 'hourly') throw new BadRequestException('Not an hourly project');

    return this.prisma.project.update({
      where: { id: projectId },
      data: { hoursLogged: { increment: dto.hours } },
    });
  }

  /**
   * Complete project
   */
  async complete(projectId: string, userId: string, isAdmin = false) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { developer: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (!isAdmin && project.clientId !== userId)
      throw new ForbiddenException('Only client can complete');
    if (project.status !== 'ACTIVE') throw new BadRequestException('Project is not active');

    return this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'COMPLETED', completedAt: new Date(), progress: 100 },
    });
  }

  /**
   * Add review for completed project
   */
  async addReview(projectId: string, userId: string, dto: CreateProjectReviewDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { developer: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.status !== 'COMPLETED') throw new BadRequestException('Project must be completed');

    const isClient = project.clientId === userId;
    const isDeveloper = project.developer.userId === userId;
    if (!isClient && !isDeveloper) throw new ForbiddenException('Not authorized');

    const updateData: any = {};
    if (isClient) {
      updateData.clientRating = dto.rating;
      updateData.clientReview = dto.review;
      // Update developer stats
      await this.developersService.updateStats(
        project.developerId,
        dto.rating,
        Number(project.amountPaid),
      );
      // Create developer review
      await this.prisma.developerReview.create({
        data: {
          developerId: project.developerId,
          reviewerId: userId,
          projectId,
          overallRating: dto.rating,
          content: dto.review,
          isVerified: true,
        },
      });
    } else {
      updateData.developerRating = dto.rating;
      updateData.developerReview = dto.review;
    }

    return this.prisma.project.update({ where: { id: projectId }, data: updateData });
  }

  /**
   * List projects for user
   */
  async findForUser(
    userId: string,
    role: 'client' | 'developer',
    filters: {
      status?: ProjectStatus;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, page = 1, limit = 10 } = filters;

    const where: any = {};
    if (role === 'client') where.clientId = userId;
    else where.developer = { userId };
    if (status) where.status = status;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: { select: { id: true, name: true, avatar: true } },
          developer: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { projects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Send message in project
   */
  async sendMessage(projectId: string, senderId: string, content: string, attachments?: string[]) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { developer: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const isClient = project.clientId === senderId;
    const isDeveloper = project.developer.userId === senderId;
    if (!isClient && !isDeveloper) throw new ForbiddenException('Not authorized');

    const message = await this.prisma.projectMessage.create({
      data: { projectId, senderId, content, attachments: attachments || [] },
    });

    // Notify the other party
    const recipientId = isClient ? project.developer.userId : project.clientId;
    await this.notificationsService.create({
      userId: recipientId,
      type: 'MARKETPLACE',
      title: 'New Project Message',
      message: `New message in project "${project.title}"`,
      link: `/admin/marketplace/projects/${projectId}`,
    });

    return message;
  }

  /**
   * Get project statistics (Admin)
   */
  async getStatistics() {
    const [total, active, completed, totalValue, avgValue] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.project.count({ where: { status: 'COMPLETED' } }),
      this.prisma.project.aggregate({ _sum: { totalBudget: true } }),
      this.prisma.project.aggregate({ _avg: { totalBudget: true } }),
    ]);

    return {
      total,
      active,
      completed,
      totalValue: totalValue._sum.totalBudget || 0,
      avgValue: avgValue._avg.totalBudget || 0,
    };
  }
}
