/**
 * Optional JWT Auth Guard
 * Allows both authenticated and unauthenticated requests
 * If a valid JWT is present, the user is attached to the request
 * If no JWT or invalid JWT, the request continues without a user
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      return true; // Allow unauthenticated requests
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production';
      const payload = this.jwtService.verify(token, { secret });

      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          demoInstanceId: true,
        },
      });

      if (user) {
        (request as any).user = {
          ...user,
          isDemo: payload.isDemo || false,
          demoId: payload.demoId || payload.demoInstanceId || null,
          demoInstanceId: payload.demoInstanceId || payload.demoId || null,
        };
      }
    } catch {
      // Ignore errors - allow request without user
    }

    return true; // Always allow the request
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (request.cookies && request.cookies.access_token) {
      return request.cookies.access_token;
    }
    return null;
  }
}
