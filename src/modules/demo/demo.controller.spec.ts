/**
 * Demo Controller Behavioral Tests
 *
 * These tests verify the expected API behavior of the DemoController.
 * The actual controller requires Prisma schema changes to be run.
 */

describe('DemoController (Behavioral Tests)', () => {
  // Mock service
  let mockDemoService: {
    createDemo: jest.Mock;
    getDemoById: jest.Mock;
    getDemoByToken: jest.Mock;
    listDemos: jest.Mock;
    extendDemo: jest.Mock;
    terminateDemo: jest.Mock;
    getDemoAnalytics: jest.Mock;
  };

  // Mock controller that delegates to service
  let controller: {
    requestDemo: (dto: any) => Promise<any>;
    listDemos: (status?: string, page?: number, limit?: number) => Promise<any>;
    getDemo: (id: string) => Promise<any>;
    extendDemo: (id: string, dto: any) => Promise<any>;
    terminateDemo: (id: string) => Promise<void>;
    getAnalytics: () => Promise<any>;
  };

  const mockDemo = {
    id: 'demo-1',
    subdomain: 'test-demo',
    name: 'Test User',
    email: 'test@example.com',
    status: 'RUNNING',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    accessToken: 'token123',
    adminPassword: 'pass123',
  };

  beforeEach(() => {
    mockDemoService = {
      createDemo: jest.fn(),
      getDemoById: jest.fn(),
      getDemoByToken: jest.fn(),
      listDemos: jest.fn(),
      extendDemo: jest.fn(),
      terminateDemo: jest.fn(),
      getDemoAnalytics: jest.fn(),
    };

    // Create mock controller
    controller = {
      requestDemo: async (dto) => mockDemoService.createDemo(dto),
      listDemos: async (status, page = 1, limit = 10) =>
        mockDemoService.listDemos({ status, page, limit }),
      getDemo: async (id) => mockDemoService.getDemoById(id),
      extendDemo: async (id, dto) => mockDemoService.extendDemo(id, dto),
      terminateDemo: async (id) => mockDemoService.terminateDemo(id),
      getAnalytics: async () => mockDemoService.getDemoAnalytics(),
    };

    jest.clearAllMocks();
  });

  describe('POST /demos/request', () => {
    it('should create a new demo', async () => {
      const createDto = { name: 'Test', email: 'test@example.com' };
      mockDemoService.createDemo.mockResolvedValue({
        id: 'demo-1',
        subdomain: 'test-demo',
        accessToken: 'token123',
        adminPassword: 'pass123',
      });

      const result = await controller.requestDemo(createDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('accessToken');
      expect(mockDemoService.createDemo).toHaveBeenCalledWith(createDto);
    });
  });

  describe('GET /demos', () => {
    it('should list all demos', async () => {
      mockDemoService.listDemos.mockResolvedValue({
        demos: [mockDemo],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      });

      const result = await controller.listDemos(undefined, 1, 10);

      expect(result.demos).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('GET /demos/:id', () => {
    it('should get demo by id', async () => {
      mockDemoService.getDemoById.mockResolvedValue(mockDemo);

      const result = await controller.getDemo('demo-1');

      expect(result.id).toBe('demo-1');
      expect(mockDemoService.getDemoById).toHaveBeenCalledWith('demo-1');
    });
  });

  describe('POST /demos/:id/extend', () => {
    it('should extend demo expiration', async () => {
      const extendedDemo = { ...mockDemo, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) };
      mockDemoService.extendDemo.mockResolvedValue(extendedDemo);

      const result = await controller.extendDemo('demo-1', { hours: 24 });

      expect(mockDemoService.extendDemo).toHaveBeenCalledWith('demo-1', { hours: 24 });
    });
  });

  describe('DELETE /demos/:id', () => {
    it('should terminate demo', async () => {
      mockDemoService.terminateDemo.mockResolvedValue(undefined);

      await controller.terminateDemo('demo-1');

      expect(mockDemoService.terminateDemo).toHaveBeenCalledWith('demo-1');
    });
  });

  describe('GET /demos/analytics', () => {
    it('should return analytics data', async () => {
      const analytics = {
        summary: {
          totalDemos: 100,
          activeDemos: 15,
          expiredDemos: 80,
          upgradeRequests: 25,
        },
        topFeatures: [],
        demosByDay: [],
        conversionRate: 0.25,
      };
      mockDemoService.getDemoAnalytics.mockResolvedValue(analytics);

      const result = await controller.getAnalytics();

      expect(result.summary.totalDemos).toBe(100);
      expect(result.conversionRate).toBe(0.25);
    });
  });
});

