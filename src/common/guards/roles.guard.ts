/**
 * Roles Guard
 * Implements hierarchical role-based access control for routes
 *
 * Role Hierarchy (highest to lowest):
 * SUPER_ADMIN > ADMIN > EDITOR > AUTHOR > INSTRUCTOR > STUDENT > USER > VIEWER
 *
 * Higher roles automatically inherit access to lower-role endpoints
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { isRoleHigherOrEqual, getRoleLevel } from '../rbac/permissions';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // If no user is found, deny access
    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      throw new ForbiddenException('Authentication required to access this resource');
    }

    const userRole = user.role as UserRole;

    this.logger.debug(
      `RolesGuard: User role = "${userRole}", Required roles = [${requiredRoles.join(', ')}]`,
    );

    // SUPER_ADMIN has access to everything
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user has one of the required roles OR a higher role
    const hasRole = requiredRoles.some((requiredRole) => {
      // Exact match
      if (userRole === requiredRole) return true;

      // Hierarchical check: user's role is higher than required
      return isRoleHigherOrEqual(userRole, requiredRole);
    });

    if (!hasRole) {
      const rolesList = requiredRoles.join(', ').toUpperCase();
      this.logger.warn(
        `RolesGuard: Access denied. User role "${userRole}" not sufficient for [${rolesList}]`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${rolesList}. Your role: ${userRole}`,
      );
    }

    return true;
  }
}
