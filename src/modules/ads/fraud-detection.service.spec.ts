/**
 * FraudDetectionService Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { FraudDetectionService } from './fraud-detection.service';
import { PrismaService } from '../../database/prisma.service';

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudDetectionService,
        {
          provide: PrismaService,
          useValue: {
            adClick: {
              count: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FraudDetectionService>(FraudDetectionService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeClick', () => {
    const baseContext = {
      adId: 'ad-1',
      sessionId: 'session-1',
      visitorId: 'visitor-1',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      path: '/blog/post',
      device: 'desktop',
    };

    it('should allow normal clicks', async () => {
      (prisma.adClick.count as jest.Mock).mockResolvedValue(0);
      (prisma.adClick.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adClick.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.analyzeClick(baseContext);

      expect(result.isFraudulent).toBe(false);
      expect(result.action).toBe('allow');
      expect(result.fraudScore).toBeLessThan(50);
    });

    it('should detect bot user agents', async () => {
      (prisma.adClick.count as jest.Mock).mockResolvedValue(0);
      (prisma.adClick.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adClick.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.analyzeClick({
        ...baseContext,
        userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      });

      expect(result.fraudScore).toBeGreaterThanOrEqual(80);
      expect(result.action).toBe('block');
      expect(result.signals.some(s => s.type === 'bot_detection')).toBe(true);
    });

    it('should detect high click frequency', async () => {
      (prisma.adClick.count as jest.Mock).mockResolvedValue(10);
      (prisma.adClick.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adClick.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.analyzeClick(baseContext);

      expect(result.fraudScore).toBeGreaterThanOrEqual(50);
      expect(result.signals.some(s => s.type === 'high_frequency')).toBe(true);
    });

    it('should detect duplicate clicks on same impression', async () => {
      (prisma.adClick.count as jest.Mock).mockResolvedValue(0);
      (prisma.adClick.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-click' });
      (prisma.adClick.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.analyzeClick({
        ...baseContext,
        impressionId: 'imp-1',
      });

      expect(result.signals.some(s => s.type === 'duplicate_click')).toBe(true);
    });

    it('should flag missing user agent', async () => {
      (prisma.adClick.count as jest.Mock).mockResolvedValue(0);
      (prisma.adClick.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adClick.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.analyzeClick({
        ...baseContext,
        userAgent: undefined,
      });

      expect(result.fraudScore).toBeGreaterThan(0);
    });

    it('should detect device/user-agent mismatch', async () => {
      (prisma.adClick.count as jest.Mock).mockResolvedValue(0);
      (prisma.adClick.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adClick.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.analyzeClick({
        ...baseContext,
        device: 'mobile',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      });

      expect(result.signals.some(s => s.type === 'fingerprint_mismatch')).toBe(true);
    });

    it('should accumulate fraud score from multiple signals', async () => {
      // High frequency + suspicious IP
      (prisma.adClick.count as jest.Mock)
        .mockResolvedValueOnce(6) // high frequency
        .mockResolvedValueOnce(3); // fraudulent IP clicks
      (prisma.adClick.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adClick.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.analyzeClick({
        ...baseContext,
        userAgent: '', // short user agent
      });

      expect(result.signals.length).toBeGreaterThan(1);
      expect(result.fraudScore).toBeGreaterThanOrEqual(50);
    });
  });
});

