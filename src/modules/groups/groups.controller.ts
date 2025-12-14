import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupMemberGuard } from './guards/group-member.guard';
import { GroupOwnerGuard } from './guards/group-owner.guard';
import { GroupVisibility } from '@prisma/client';

@Controller('api/groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  /**
   * GET /api/groups - List all groups
   */
  @Get()
  async findAll(
    @Request() req,
    @Query('visibility') visibility?: GroupVisibility,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.groupsService.findAll(req.user.id, {
      visibility,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * POST /api/groups - Create a new group
   */
  @Post()
  async create(@Request() req, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto, req.user.id);
  }

  /**
   * GET /api/groups/:id - Get group details
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.groupsService.findOne(id, req.user.id);
  }

  /**
   * PATCH /api/groups/:id - Update group
   */
  @Patch(':id')
  @UseGuards(GroupOwnerGuard)
  async update(@Request() req, @Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(id, updateGroupDto, req.user.id, req.user.role);
  }

  /**
   * DELETE /api/groups/:id - Delete group
   */
  @Delete(':id')
  @UseGuards(GroupOwnerGuard)
  async remove(@Request() req, @Param('id') id: string) {
    return this.groupsService.remove(id, req.user.id, req.user.role);
  }

  /**
   * POST /api/groups/:id/join - Join a group
   */
  @Post(':id/join')
  async join(@Request() req, @Param('id') id: string) {
    return this.groupsService.join(id, req.user.id);
  }

  /**
   * POST /api/groups/:id/leave - Leave a group
   */
  @Post(':id/leave')
  @UseGuards(GroupMemberGuard)
  async leave(@Request() req, @Param('id') id: string) {
    return this.groupsService.leave(id, req.user.id);
  }

  /**
   * GET /api/groups/:id/messages - Get message history
   */
  @Get(':id/messages')
  @UseGuards(GroupMemberGuard)
  async getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.groupsService.getMessages(id, {
      limit: limit ? parseInt(limit) : undefined,
      before,
    });
  }

  /**
   * GET /api/groups/:id/members - Get group members
   */
  @Get(':id/members')
  @UseGuards(GroupMemberGuard)
  async getMembers(@Param('id') id: string) {
    return this.groupsService.getMembers(id);
  }

  /**
   * DELETE /api/groups/:id/members/:userId - Remove member
   */
  @Delete(':id/members/:userId')
  @UseGuards(GroupMemberGuard)
  async removeMember(@Request() req, @Param('id') id: string, @Param('userId') userId: string) {
    return this.groupsService.removeMember(id, userId, req.user.id, req.user.role);
  }

  /**
   * POST /api/groups/:id/ban/:userId - Ban user
   */
  @Post(':id/ban/:userId')
  @UseGuards(GroupOwnerGuard)
  async banUser(@Request() req, @Param('id') id: string, @Param('userId') userId: string) {
    return this.groupsService.banUser(id, userId, req.user.id, req.user.role);
  }

  /**
   * DELETE /api/groups/:id/messages/:messageId - Delete message
   */
  @Delete(':id/messages/:messageId')
  @UseGuards(GroupMemberGuard)
  async deleteMessage(
    @Request() req,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.groupsService.deleteMessage(id, messageId, req.user.id, req.user.role);
  }
}
