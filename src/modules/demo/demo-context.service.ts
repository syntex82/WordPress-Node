/**
 * Demo Context Service
 * 
 * Provides request-scoped Prisma client with demo data isolation.
 * Extracts demo context from JWT token and applies filters.
 * 
 * SECURITY CRITICAL: This service ensures demo users cannot access real data.
 */

import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { createDemoFilteredPrisma, DemoFilteredPrisma } from './prisma-demo-extension';

interface DemoJwtPayload {
  isDemo?: boolean;
  demoId?: string;
  demoInstanceId?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class DemoContextService {
  private _filteredPrisma: DemoFilteredPrisma | null = null;
  private _demoInstanceId: string | null = null;
  private _isDemo: boolean = false;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly prisma: PrismaService,
  ) {
    this.initializeFromRequest();
  }

  /**
   * Extract demo context from request (JWT payload or cookie)
   */
  private initializeFromRequest() {
    const user = (this.request as any).user as DemoJwtPayload | undefined;
    
    // Check JWT payload first
    if (user?.isDemo && user?.demoId) {
      this._isDemo = true;
      this._demoInstanceId = user.demoId;
      return;
    }

    // Fallback to cookie
    const demoCookie = this.request.cookies?.demo_mode;
    if (demoCookie) {
      try {
        const demoInfo = JSON.parse(demoCookie);
        if (demoInfo?.id) {
          this._isDemo = true;
          this._demoInstanceId = demoInfo.id;
        }
      } catch {
        // Invalid cookie, not demo mode
      }
    }
  }

  /**
   * Check if current request is in demo mode
   */
  get isDemo(): boolean {
    return this._isDemo;
  }

  /**
   * Get current demo instance ID (null for real users)
   */
  get demoInstanceId(): string | null {
    return this._demoInstanceId;
  }

  /**
   * Get Prisma client with demo filtering applied
   * 
   * Demo users: Only see data where demoInstanceId matches their demo
   * Real users: Only see data where demoInstanceId is null
   */
  get db(): DemoFilteredPrisma {
    if (!this._filteredPrisma) {
      this._filteredPrisma = createDemoFilteredPrisma(
        this.prisma,
        this._demoInstanceId,
      );
    }
    return this._filteredPrisma;
  }

  /**
   * Get unfiltered Prisma client (USE WITH CAUTION)
   * Only for operations that need to access all data (e.g., admin cleanup)
   */
  get unfilteredDb(): PrismaService {
    return this.prisma;
  }

  /**
   * Validate that a record belongs to the current demo context
   */
  validateAccess(record: { demoInstanceId?: string | null }): boolean {
    if (!record.demoInstanceId && !this._demoInstanceId) {
      return true; // Real user, real data
    }
    return record.demoInstanceId === this._demoInstanceId;
  }

  /**
   * Throw if record doesn't belong to current demo context
   */
  assertAccess(record: { demoInstanceId?: string | null }, message?: string): void {
    if (!this.validateAccess(record)) {
      throw new Error(message || 'Access denied: Record does not belong to this demo');
    }
  }
}

