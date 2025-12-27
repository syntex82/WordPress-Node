/**
 * JWT Strategy
 * Validates JWT tokens and extracts user information
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';

/**
 * Custom JWT extractor that checks Authorization header first, then cookies
 */
const tokenExtractor = (req: Request): string | null => {
  // First try Authorization header (for API calls from admin panel)
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Fall back to cookie (for SSR pages)
  if (req && req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production';
    super({
      jwtFromRequest: tokenExtractor,
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException();
      }

      const { password: _password, ...result } = user;
      void _password; // Intentionally unused
      return result;
    } catch (_error) {
      // User not found or other error - token is invalid
      throw new UnauthorizedException();
    }
  }
}
