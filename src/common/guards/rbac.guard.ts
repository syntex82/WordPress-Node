/**
 * RBAC Guard - Hierarchical Role-Based Access Control
 * 
 * This guard enforces permissions based on:
 * 1. Role hierarchy (SUPER_ADMIN > ADMIN > EDITOR > AUTHOR > INSTRUCTOR > STUDENT > USER)
 * 2. Resource ownership (AUTHORS can only access their own content)
 * 3. Demo isolation (demo users can only see demo data)
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { 
  hasPermission, 
  isRoleHigherOrEqual,
  ResourceType, 
  ActionType,
  ROLE_HIERARCHY,
} from '../rbac/permissions';
import { PrismaService } from '../../database/prisma.service';

// Decorator metadata keys
export const RBAC_RESOURCE_KEY = 'rbac:resource';
export const RBAC_ACTION_KEY = 'rbac:action';
export const RBAC_OWNER_PARAM_KEY = 'rbac:ownerParam';

// Decorators for controllers
import { SetMetadata } from '@nestjs/common';

export const RbacResource = (resource: ResourceType) => 
  SetMetadata(RBAC_RESOURCE_KEY, resource);

export const RbacAction = (action: ActionType) => 
  SetMetadata(RBAC_ACTION_KEY, action);

export const RbacOwnerParam = (param: string) => 
  SetMetadata(RBAC_OWNER_PARAM_KEY, param);

// Combined decorator for convenience
export const Rbac = (resource: ResourceType, action: ActionType, ownerParam?: string) => {
  const decorators = [
    SetMetadata(RBAC_RESOURCE_KEY, resource),
    SetMetadata(RBAC_ACTION_KEY, action),
  ];
  if (ownerParam) {
    decorators.push(SetMetadata(RBAC_OWNER_PARAM_KEY, ownerParam));
  }
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    decorators.forEach(d => d(target, key, descriptor));
  };
};

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<ResourceType>(RBAC_RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const action = this.reflector.getAllAndOverride<ActionType>(RBAC_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no RBAC decorators, allow access (defer to other guards)
    if (!resource || !action) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const userRole = user.role as UserRole;

    // Check basic permission
    if (!hasPermission(userRole, resource, action)) {
      this.logger.warn(
        `RBAC: Access denied for ${user.email} (${userRole}) to ${action} ${resource}`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. You cannot ${action} ${resource}.`,
      );
    }

    // SUPER_ADMIN bypasses all further checks
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // ADMIN bypasses ownership checks but not demo isolation
    if (userRole === UserRole.ADMIN) {
      return this.checkDemoIsolation(user, request);
    }

    // Check ownership for owner-restricted actions
    const ownerParam = this.reflector.getAllAndOverride<string>(RBAC_OWNER_PARAM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (ownerParam) {
      const resourceId = request.params[ownerParam];
      if (resourceId) {
        const isOwner = await this.checkOwnership(user.id, resource, resourceId);
        if (!isOwner && !this.canAccessOthersContent(userRole, resource, action)) {
          this.logger.warn(
            `RBAC: Ownership check failed for ${user.email} accessing ${resource}:${resourceId}`,
          );
          throw new ForbiddenException('You can only access your own resources');
        }
      }
    }

    return this.checkDemoIsolation(user, request);
  }

  /**
   * Check if user owns the resource
   */
  private async checkOwnership(
    userId: string, 
    resource: ResourceType, 
    resourceId: string,
  ): Promise<boolean> {
    try {
      switch (resource) {
        case 'posts':
          const post = await this.prisma.post.findUnique({ 
            where: { id: resourceId }, 
            select: { authorId: true } 
          });
          return post?.authorId === userId;

        case 'pages':
          const page = await this.prisma.page.findUnique({ 
            where: { id: resourceId }, 
            select: { authorId: true } 
          });
          return page?.authorId === userId;
        
        case 'media':
          const media = await this.prisma.media.findUnique({
            where: { id: resourceId },
            select: { uploadedById: true }
          });
          return media?.uploadedById === userId;

        case 'courses':
          const course = await this.prisma.course.findUnique({
            where: { id: resourceId },
            select: { instructorId: true }
          });
          return course?.instructorId === userId;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Ownership check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if role can access others' content
   */
  private canAccessOthersContent(
    role: UserRole,
    resource: ResourceType,
    action: ActionType,
  ): boolean {
    // Editors can read/update all content
    if (role === UserRole.EDITOR) {
      return ['read', 'update'].includes(action) &&
        ['posts', 'pages', 'media', 'products', 'courses'].includes(resource);
    }
    return false;
  }

  /**
   * Check demo isolation - demo users can only access demo data
   */
  private checkDemoIsolation(user: any, request: any): boolean {
    // If user is a demo user, they can only access demo data
    // This is handled by demoInstanceId filtering in services
    if (user.isDemo || user.demoId || user.demoInstanceId) {
      // Mark request for service-level filtering
      request.demoContext = {
        isDemo: true,
        demoInstanceId: user.demoId || user.demoInstanceId,
      };
    }
    return true;
  }
}

