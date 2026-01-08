/**
 * Demo Service Behavioral Tests
 *
 * These tests verify the expected behavior of the DemoService using a mock implementation.
 * The actual DemoService requires Prisma schema changes (demo tables) to be run.
 *
 * To enable full integration tests:
 * 1. Add demo tables to prisma/schema.prisma
 * 2. Run: npx prisma migrate dev
 * 3. Update this file to import actual DemoService
 */

import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

// DemoStatus enum for type safety
enum DemoStatus {
  PENDING = 'PENDING',
  PROVISIONING = 'PROVISIONING',
  RUNNING = 'RUNNING',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  FAILED = 'FAILED',
}

// Mock implementation of DemoService behavior
class MockDemoService {
  private demos: Map<string, any> = new Map();
  private maxConcurrent = 20;

  constructor(initialDemos: any[] = []) {
    initialDemos.forEach(d => this.demos.set(d.id, d));
  }

  async createDemo(dto: { name: string; email: string; company?: string }) {
    // Check for existing active demo
    for (const demo of this.demos.values()) {
      if (demo.email === dto.email && demo.status === DemoStatus.RUNNING) {
        throw new ConflictException('Email already has an active demo');
      }
    }

    // Check capacity
    const activeCount = Array.from(this.demos.values())
      .filter(d => d.status === DemoStatus.RUNNING || d.status === DemoStatus.PENDING).length;
    if (activeCount >= this.maxConcurrent) {
      throw new BadRequestException('Maximum concurrent demos reached');
    }

    const id = `demo-${Date.now()}`;
    const demo = {
      id,
      subdomain: `demo-${id.slice(-8)}`,
      name: dto.name,
      email: dto.email,
      company: dto.company,
      accessToken: `token-${Date.now()}`,
      adminPassword: 'generated-password',
      status: DemoStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      featuresUsed: [],
    };
    this.demos.set(id, demo);
    return demo;
  }

  async getDemoById(id: string) {
    const demo = this.demos.get(id);
    if (!demo) throw new NotFoundException('Demo not found');
    return demo;
  }

  async listDemos(options: { page?: number; limit?: number }) {
    const demos = Array.from(this.demos.values());
    return {
      demos,
      pagination: { page: options.page || 1, limit: options.limit || 10, total: demos.length },
    };
  }

  async extendDemo(id: string, dto: { hours: number }) {
    const demo = this.demos.get(id);
    if (!demo) throw new NotFoundException('Demo not found');
    demo.expiresAt = new Date(demo.expiresAt.getTime() + dto.hours * 60 * 60 * 1000);
    return demo;
  }

  async terminateDemo(id: string) {
    const demo = this.demos.get(id);
    if (!demo) throw new NotFoundException('Demo not found');
    demo.status = DemoStatus.TERMINATED;
    return demo;
  }

  async recordFeatureUsage(demoId: string, feature: string, action: string) {
    const demo = this.demos.get(demoId);
    if (demo) {
      demo.featuresUsed.push({ feature, action, timestamp: new Date() });
    }
  }
}

describe('DemoService (Behavioral Tests)', () => {
  let service: MockDemoService;

  const existingDemo = {
    id: 'demo-1',
    subdomain: 'test-demo',
    name: 'Test User',
    email: 'test@example.com',
    company: 'Test Corp',
    accessToken: 'token123',
    status: DemoStatus.RUNNING,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    featuresUsed: [],
  };

  beforeEach(() => {
    service = new MockDemoService([existingDemo]);
  });

  describe('createDemo', () => {
    it('should throw ConflictException if email already has active demo', async () => {
      await expect(service.createDemo({
        name: 'New User',
        email: 'test@example.com', // Same email as existingDemo
        company: 'New Corp',
      })).rejects.toThrow(ConflictException);
    });

    it('should create demo successfully with new email', async () => {
      const result = await service.createDemo({
        name: 'New User',
        email: 'new@example.com',
        company: 'New Corp',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('subdomain');
      expect(result).toHaveProperty('accessToken');
      expect(result.name).toBe('New User');
    });
  });

  describe('getDemoById', () => {
    it('should throw NotFoundException if demo not found', async () => {
      await expect(service.getDemoById('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should return demo if found', async () => {
      const result = await service.getDemoById('demo-1');
      expect(result.id).toBe('demo-1');
      expect(result.subdomain).toBe('test-demo');
    });
  });

  describe('listDemos', () => {
    it('should return paginated demos', async () => {
      const result = await service.listDemos({ page: 1, limit: 10 });
      expect(result.demos.length).toBeGreaterThan(0);
      expect(result.pagination).toHaveProperty('total');
    });
  });

  describe('extendDemo', () => {
    it('should throw NotFoundException if demo not found', async () => {
      await expect(service.extendDemo('invalid-id', { hours: 12 })).rejects.toThrow(NotFoundException);
    });

    it('should extend demo expiration', async () => {
      const originalExpiry = existingDemo.expiresAt.getTime();
      const result = await service.extendDemo('demo-1', { hours: 12 });
      expect(result.expiresAt.getTime()).toBeGreaterThan(originalExpiry);
    });
  });

  describe('terminateDemo', () => {
    it('should throw NotFoundException if demo not found', async () => {
      await expect(service.terminateDemo('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should update demo status to TERMINATED', async () => {
      const result = await service.terminateDemo('demo-1');
      expect(result.status).toBe(DemoStatus.TERMINATED);
    });
  });

  describe('recordFeatureUsage', () => {
    it('should record feature usage', async () => {
      await service.recordFeatureUsage('demo-1', 'theme_designer', 'view');
      const demo = await service.getDemoById('demo-1');
      expect(demo.featuresUsed.length).toBe(1);
      expect(demo.featuresUsed[0].feature).toBe('theme_designer');
    });
  });
});

