/**
 * Projects Controller
 * API endpoints for marketplace projects
 */

import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ProjectsService } from '../services/projects.service';
import { MarketplacePaymentsService } from '../services/marketplace-payments.service';
import { CreateProjectDto, UpdateProjectDto, LogHoursDto, CreateProjectReviewDto, ProjectStatus } from '../dto';

@Controller('api/marketplace/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private paymentsService: MarketplacePaymentsService,
  ) {}

  /**
   * Create a new project
   */
  @Post()
  async create(@Request() req, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, dto);
  }

  // NOTE: Static routes (my/*, admin/*) MUST come before :id routes

  /**
   * List my projects as client
   */
  @Get('my/client')
  async getMyClientProjects(
    @Request() req,
    @Query('status') status?: ProjectStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projectsService.findForUser(req.user.id, 'client', {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  /**
   * List my projects as developer
   */
  @Get('my/developer')
  async getMyDeveloperProjects(
    @Request() req,
    @Query('status') status?: ProjectStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projectsService.findForUser(req.user.id, 'developer', {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get project statistics (admin)
   */
  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getStatistics() {
    return this.projectsService.getStatistics();
  }

  /**
   * Get project by ID - MUST be after all static routes (my/*, admin/*)
   */
  @Get(':id')
  async findById(@Request() req, @Param('id') id: string) {
    return this.projectsService.findById(id, req.user.id, req.user.role === 'ADMIN');
  }

  /**
   * Update project
   */
  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, req.user.id, dto, req.user.role === 'ADMIN');
  }

  /**
   * Log hours (developer)
   */
  @Post(':id/log-hours')
  async logHours(@Request() req, @Param('id') id: string, @Body() dto: LogHoursDto) {
    return this.projectsService.logHours(id, req.user.id, dto);
  }

  /**
   * Complete project (client)
   */
  @Post(':id/complete')
  async complete(@Request() req, @Param('id') id: string) {
    return this.projectsService.complete(id, req.user.id, req.user.role === 'ADMIN');
  }

  /**
   * Add review
   */
  @Post(':id/review')
  async addReview(@Request() req, @Param('id') id: string, @Body() dto: CreateProjectReviewDto) {
    return this.projectsService.addReview(id, req.user.id, dto);
  }

  /**
   * Send message
   */
  @Post(':id/messages')
  async sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { content: string; attachments?: string[] },
  ) {
    return this.projectsService.sendMessage(id, req.user.id, body.content, body.attachments);
  }

  /**
   * Deposit to escrow (client)
   */
  @Post(':id/escrow/deposit')
  async depositEscrow(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { amount: number; paymentMethodId?: string },
  ) {
    return this.paymentsService.createEscrowDeposit(id, req.user.id, body.amount, body.paymentMethodId);
  }

  /**
   * Get project transactions
   */
  @Get(':id/transactions')
  async getTransactions(@Request() req, @Param('id') id: string) {
    // Verify access first
    await this.projectsService.findById(id, req.user.id, req.user.role === 'ADMIN');
    return this.paymentsService.getProjectTransactions(id);
  }

  /**
   * Create dispute
   */
  @Post(':id/dispute')
  async createDispute(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { reason: string; description: string },
  ) {
    const project = await this.projectsService.findById(id, req.user.id, false);
    const initiatorType = project.clientId === req.user.id ? 'client' : 'developer';
    return this.paymentsService.createDispute(id, req.user.id, initiatorType, body.reason, body.description);
  }

  /**
   * Release escrow (admin)
   */
  @Post(':id/escrow/release')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async releaseEscrow(@Request() req, @Param('id') id: string, @Body('amount') amount: number) {
    return this.paymentsService.releaseEscrow(id, amount, req.user.id);
  }
}

