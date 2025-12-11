/**
 * Optional JWT Auth Guard
 * Allows both authenticated and unauthenticated requests
 * If a valid JWT is present, the user is attached to the request
 * If no JWT or invalid JWT, the request continues without a user
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Call the parent canActivate to attempt JWT validation
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Don't throw an error if authentication fails
    // Just return null/undefined for the user
    return user || null;
  }
}

