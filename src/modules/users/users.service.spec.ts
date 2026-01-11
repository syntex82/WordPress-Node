/**
 * Users Service Tests
 * Tests for role elevation protection and demo mode restrictions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { REQUEST } from '@nestjs/core';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;
  let mockRequest: any;

  const mockUser = (role: UserRole, isDemo = false, demoId: string | null = null) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role,
    isDemo,
    demoId,
  });

  const mockTargetUser = (role: UserRole) => ({
    id: 'target-user-456',
    email: 'target@example.com',
    name: 'Target User',
    role,
    demoInstanceId: null,
  });

  beforeEach(async () => {
    mockRequest = {
      user: mockUser(UserRole.ADMIN),
      demoContext: undefined,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  describe('Role Elevation Protection', () => {
    it('should allow SUPER_ADMIN to assign any role', async () => {
      mockRequest.user = mockUser(UserRole.SUPER_ADMIN);
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockTargetUser(UserRole.USER));
      prismaService.user.update = jest.fn().mockResolvedValue({ ...mockTargetUser(UserRole.SUPER_ADMIN) });

      await expect(
        service.update('target-user-456', { role: UserRole.SUPER_ADMIN }),
      ).resolves.toBeDefined();
    });

    it('should prevent ADMIN from assigning SUPER_ADMIN role', async () => {
      mockRequest.user = mockUser(UserRole.ADMIN);
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockTargetUser(UserRole.USER));

      await expect(
        service.update('target-user-456', { role: UserRole.SUPER_ADMIN }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent EDITOR from assigning ADMIN role', async () => {
      mockRequest.user = mockUser(UserRole.EDITOR);
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockTargetUser(UserRole.USER));

      await expect(
        service.update('target-user-456', { role: UserRole.ADMIN }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to assign EDITOR role', async () => {
      mockRequest.user = mockUser(UserRole.ADMIN);
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockTargetUser(UserRole.USER));
      prismaService.user.update = jest.fn().mockResolvedValue({ ...mockTargetUser(UserRole.EDITOR) });

      await expect(
        service.update('target-user-456', { role: UserRole.EDITOR }),
      ).resolves.toBeDefined();
    });

    it('should prevent modifying users with higher roles', async () => {
      mockRequest.user = mockUser(UserRole.EDITOR);
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockTargetUser(UserRole.ADMIN));

      await expect(
        service.update('target-user-456', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Demo Mode Restrictions', () => {
    it('should prevent demo users from changing roles', async () => {
      mockRequest.user = mockUser(UserRole.ADMIN, true, 'demo-instance-123');
      prismaService.user.findFirst = jest.fn().mockResolvedValue({
        ...mockTargetUser(UserRole.USER),
        demoInstanceId: 'demo-instance-123',
      });

      await expect(
        service.update('target-user-456', { role: UserRole.EDITOR }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow demo users to update non-role fields', async () => {
      mockRequest.user = mockUser(UserRole.ADMIN, true, 'demo-instance-123');
      prismaService.user.findFirst = jest.fn().mockResolvedValue({
        ...mockTargetUser(UserRole.USER),
        demoInstanceId: 'demo-instance-123',
      });
      prismaService.user.update = jest.fn().mockResolvedValue({
        ...mockTargetUser(UserRole.USER),
        name: 'Updated Name',
      });

      await expect(
        service.update('target-user-456', { name: 'Updated Name' }),
      ).resolves.toBeDefined();
    });
  });
});

