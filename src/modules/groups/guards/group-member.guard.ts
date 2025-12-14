import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Guard to verify that the user is a member of the group
 */
@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.id || request.params.groupId;

    if (!user || !groupId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if user is a member of the group and not banned
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.isBanned) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Attach membership to request for later use
    request.groupMembership = membership;

    return true;
  }
}
