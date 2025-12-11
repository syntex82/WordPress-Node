import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UserRole } from '@prisma/client';

/**
 * Guard to verify that the user is the owner of the group or an admin
 */
@Injectable()
export class GroupOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.id || request.params.groupId;

    if (!user || !groupId) {
      throw new ForbiddenException('Access denied');
    }

    // Admins can do anything
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user is the owner of the group
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (!group || group.ownerId !== user.id) {
      throw new ForbiddenException('Only the group owner can perform this action');
    }

    return true;
  }
}

