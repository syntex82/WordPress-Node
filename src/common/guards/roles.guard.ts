/**
 * Roles Guard
 * Implements role-based access control for routes
 * Throws ForbiddenException when user lacks required roles
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

    this.logger.debug(
      `RolesGuard: User role = "${user.role}", Required roles = [${requiredRoles.join(', ')}]`,
    );

    // Check if user has one of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      const rolesList = requiredRoles.join(', ').toUpperCase();
      this.logger.warn(
        `RolesGuard: Access denied. User role "${user.role}" not in required roles [${rolesList}]`,
      );
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${rolesList}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
