/**
 * Feature Guard Tests
 * Tests for subscription feature checking with SUPER_ADMIN bypass
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureGuard } from './feature.guard';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

describe('FeatureGuard', () => {
  let guard: FeatureGuard;
  let reflector: jest.Mocked<Reflector>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockExecutionContext = (user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            subscription: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    guard = module.get<FeatureGuard>(FeatureGuard);
    reflector = module.get(Reflector);
    prismaService = module.get(PrismaService);
  });

  describe('Admin Role Bypass', () => {
    it('should allow SUPER_ADMIN to bypass feature checks', async () => {
      reflector.getAllAndOverride.mockReturnValue(['premium_feature']);
      const context = mockExecutionContext({ id: 'user-1', role: UserRole.SUPER_ADMIN });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaService.subscription.findUnique).not.toHaveBeenCalled();
    });

    it('should allow ADMIN to bypass feature checks', async () => {
      reflector.getAllAndOverride.mockReturnValue(['premium_feature']);
      const context = mockExecutionContext({ id: 'user-1', role: UserRole.ADMIN });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaService.subscription.findUnique).not.toHaveBeenCalled();
    });

    it('should check subscription for EDITOR role', async () => {
      reflector.getAllAndOverride.mockReturnValue(['premium_feature']);
      const context = mockExecutionContext({ id: 'user-1', role: UserRole.EDITOR });
      prismaService.subscription.findUnique = jest.fn().mockResolvedValue({
        status: 'ACTIVE',
        plan: { features: ['premium_feature'] },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prismaService.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { plan: true },
      });
    });
  });

  describe('No Features Required', () => {
    it('should allow access when no features are required', async () => {
      reflector.getAllAndOverride.mockReturnValue(null);
      const context = mockExecutionContext({ id: 'user-1', role: UserRole.USER });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when empty features array', async () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const context = mockExecutionContext({ id: 'user-1', role: UserRole.USER });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Feature Check Failures', () => {
    it('should deny access when user has no subscription', async () => {
      reflector.getAllAndOverride.mockReturnValue(['premium_feature']);
      const context = mockExecutionContext({ id: 'user-1', role: UserRole.USER });
      prismaService.subscription.findUnique = jest.fn().mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when subscription is inactive', async () => {
      reflector.getAllAndOverride.mockReturnValue(['premium_feature']);
      const context = mockExecutionContext({ id: 'user-1', role: UserRole.USER });
      prismaService.subscription.findUnique = jest.fn().mockResolvedValue({
        status: 'CANCELED',
        plan: { features: ['premium_feature'] },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access when plan lacks required features', async () => {
      reflector.getAllAndOverride.mockReturnValue(['premium_feature', 'enterprise_feature']);
      const context = mockExecutionContext({ id: 'user-1', role: UserRole.USER });
      prismaService.subscription.findUnique = jest.fn().mockResolvedValue({
        status: 'ACTIVE',
        plan: { features: ['basic_feature'] },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });
});

