import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupVisibility, GroupMemberRole, UserRole } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all groups (public + user's groups)
   */
  async findAll(userId: string, params?: { visibility?: GroupVisibility; search?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { visibility: GroupVisibility.PUBLIC },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    };

    if (params?.visibility) {
      where.visibility = params.visibility;
    }

    if (params?.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get group by ID
   */
  async findOne(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is a member
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
        },
      },
    });

    // If group is private and user is not a member, deny access
    if (group.visibility === GroupVisibility.PRIVATE && !membership) {
      throw new ForbiddenException('This group is private');
    }

    return {
      ...group,
      isMember: !!membership,
      memberRole: membership?.role,
      isBanned: membership?.isBanned,
    };
  }

  /**
   * Create a new group
   */
  async create(createGroupDto: CreateGroupDto, userId: string) {
    // Check if slug is already taken
    const existing = await this.prisma.group.findUnique({
      where: { slug: createGroupDto.slug },
    });

    if (existing) {
      throw new BadRequestException('A group with this slug already exists');
    }

    // Create group and add creator as owner member
    const group = await this.prisma.group.create({
      data: {
        ...createGroupDto,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: GroupMemberRole.OWNER,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return group;
  }

  /**
   * Update a group
   */
  async update(id: string, updateGroupDto: UpdateGroupDto, userId: string, userRole: UserRole) {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only owner or admin can update
    if (group.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the group owner can update this group');
    }

    return this.prisma.group.update({
      where: { id },
      data: updateGroupDto,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Delete a group
   */
  async remove(id: string, userId: string, userRole: UserRole) {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only owner or admin can delete
    if (group.ownerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the group owner can delete this group');
    }

    return this.prisma.group.delete({
      where: { id },
    });
  }

  /**
   * Join a group
   */
  async join(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if already a member
    const existing = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (existing) {
      if (existing.isBanned) {
        throw new ForbiddenException('You are banned from this group');
      }
      throw new BadRequestException('You are already a member of this group');
    }

    // For now, only allow joining public groups
    if (group.visibility === GroupVisibility.PRIVATE) {
      throw new ForbiddenException('This group is private. You need an invitation to join.');
    }

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: GroupMemberRole.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Leave a group
   */
  async leave(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Cannot leave if you're the owner
    if (group.ownerId === userId) {
      throw new BadRequestException('Group owner cannot leave the group. Transfer ownership or delete the group instead.');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this group');
    }

    return this.prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  /**
   * Get group messages with pagination
   */
  async getMessages(groupId: string, params?: { limit?: number; before?: string }) {
    const limit = params?.limit || 50;

    const where: any = { groupId };

    if (params?.before) {
      where.id = { lt: params.before };
    }

    const messages = await this.prisma.groupMessage.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return messages.reverse(); // Return in chronological order
  }

  /**
   * Get group members
   */
  async getMembers(groupId: string) {
    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });
  }

  /**
   * Remove a member from the group
   */
  async removeMember(groupId: string, userId: string, requesterId: string, requesterRole: UserRole) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check permissions: owner, moderator, or admin
    const requesterMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: requesterId,
        },
      },
    });

    const canRemove =
      requesterRole === UserRole.ADMIN ||
      group.ownerId === requesterId ||
      (requesterMembership && requesterMembership.role === GroupMemberRole.MODERATOR);

    if (!canRemove) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    // Cannot remove the owner
    if (group.ownerId === userId) {
      throw new BadRequestException('Cannot remove the group owner');
    }

    return this.prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  /**
   * Ban a user from the group
   */
  async banUser(groupId: string, userId: string, requesterId: string, requesterRole: UserRole) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only owner or admin can ban
    if (group.ownerId !== requesterId && requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the group owner can ban users');
    }

    // Cannot ban the owner
    if (group.ownerId === userId) {
      throw new BadRequestException('Cannot ban the group owner');
    }

    return this.prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      data: {
        isBanned: true,
      },
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(groupId: string, messageId: string, userId: string, userRole: UserRole) {
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
      include: {
        group: true,
      },
    });

    if (!message || message.groupId !== groupId) {
      throw new NotFoundException('Message not found');
    }

    // Check permissions: sender (within 5 minutes), owner, or admin
    const canDelete =
      userRole === UserRole.ADMIN ||
      message.group.ownerId === userId ||
      (message.senderId === userId && Date.now() - message.createdAt.getTime() < 5 * 60 * 1000);

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }

    return this.prisma.groupMessage.delete({
      where: { id: messageId },
    });
  }
}
