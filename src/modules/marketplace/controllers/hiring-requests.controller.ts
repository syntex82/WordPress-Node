/**
 * Hiring Requests Controller
 * API endpoints for hiring requests
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { HiringRequestsService } from '../services/hiring-requests.service';
import { ProjectsService } from '../services/projects.service';
import { CreateHiringRequestDto, UpdateHiringRequestStatusDto, HiringRequestStatus } from '../dto';

@Controller('api/marketplace/hiring-requests')
@UseGuards(JwtAuthGuard)
export class HiringRequestsController {
  constructor(
    private hiringRequestsService: HiringRequestsService,
    private projectsService: ProjectsService,
  ) {}

  /**
   * Create a new hiring request
   */
  @Post()
  async create(@Request() req, @Body() dto: CreateHiringRequestDto) {
    return this.hiringRequestsService.create(req.user.id, dto);
  }

  // NOTE: Static routes (my/*, admin/*) MUST come before :id routes

  /**
   * List my hiring requests as client
   */
  @Get('my/client')
  async getMyClientRequests(
    @Request() req,
    @Query('status') status?: HiringRequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hiringRequestsService.findForUser(req.user.id, 'client', {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  /**
   * List my hiring requests as developer
   */
  @Get('my/developer')
  async getMyDeveloperRequests(
    @Request() req,
    @Query('status') status?: HiringRequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hiringRequestsService.findForUser(req.user.id, 'developer', {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * List all hiring requests (admin)
   */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async adminFindAll(
    @Query('status') status?: HiringRequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // For admin, we need a different approach - list all
    return this.hiringRequestsService.findForUser('', 'client', {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /**
   * Get hiring request by ID - MUST be after all static routes (my/*, admin/*)
   */
  @Get(':id')
  async findById(@Request() req, @Param('id') id: string) {
    return this.hiringRequestsService.findById(id, req.user.id, req.user.role === 'ADMIN');
  }

  /**
   * Update hiring request status
   */
  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateHiringRequestStatusDto,
  ) {
    return this.hiringRequestsService.updateStatus(id, req.user.id, dto, req.user.role === 'ADMIN');
  }

  /**
   * Accept hiring request (developer)
   */
  @Post(':id/accept')
  async accept(@Request() req, @Param('id') id: string, @Body('message') message?: string) {
    return this.hiringRequestsService.updateStatus(id, req.user.id, {
      status: HiringRequestStatus.ACCEPTED,
      responseMessage: message,
    });
  }

  /**
   * Reject hiring request (developer)
   */
  @Post(':id/reject')
  async reject(@Request() req, @Param('id') id: string, @Body('message') message?: string) {
    return this.hiringRequestsService.updateStatus(id, req.user.id, {
      status: HiringRequestStatus.REJECTED,
      responseMessage: message,
    });
  }

  /**
   * Cancel hiring request (client)
   */
  @Post(':id/cancel')
  async cancel(@Request() req, @Param('id') id: string) {
    return this.hiringRequestsService.updateStatus(id, req.user.id, {
      status: HiringRequestStatus.CANCELLED,
    });
  }

  /**
   * Convert accepted request to project
   */
  @Post(':id/create-project')
  async createProject(@Request() req, @Param('id') id: string) {
    // Verify the user is the client
    const request = await this.hiringRequestsService.findById(
      id,
      req.user.id,
      req.user.role === 'ADMIN',
    );
    if (request.clientId !== req.user.id && req.user.role !== 'ADMIN') {
      return { error: 'Only the client can create a project' };
    }
    return this.projectsService.createFromHiringRequest(id);
  }
}
