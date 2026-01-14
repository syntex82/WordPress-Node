/**
 * AdsService Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AdsService } from './ads.service';
import { PrismaService } from '../../database/prisma.service';
import { FraudDetectionService } from './fraud-detection.service';
import { NotFoundException } from '@nestjs/common';

describe('AdsService', () => {
  let service: AdsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockZone = {
    id: 'zone-1',
    name: 'header-banner',
    position: 'header',
    format: '728x90',
    isActive: true,
    fallbackHtml: '<div>Fallback Ad</div>',
    placements: [],
  };

  const mockCampaign = {
    id: 'campaign-1',
    name: 'Test Campaign',
    status: 'active',
    type: 'cpc',
    bidAmount: 0.5,
    budget: 1000,
    dailyBudget: 100,
    spentToday: 10,
    totalSpent: 50,
    targetDevices: ['desktop', 'mobile'],
    targetCountries: ['US', 'UK'],
    targetPages: ['/blog/*'],
    advertiser: { id: 'adv-1', balance: 500, status: 'active' },
    ads: [],
  };

  const mockAd = {
    id: 'ad-1',
    name: 'Test Ad',
    type: 'banner',
    format: '728x90',
    status: 'active',
    headline: 'Great Product',
    description: 'Buy now!',
    imageUrl: 'https://example.com/ad.jpg',
    ctaText: 'Learn More',
    weight: 100,
    campaign: mockCampaign,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsService,
        {
          provide: PrismaService,
          useValue: {
            adZone: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
            },
            adPlacement: { findMany: jest.fn().mockResolvedValue([]) },
            adImpression: { create: jest.fn() },
            adClick: { create: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
            ad: { findUnique: jest.fn(), update: jest.fn() },
            adCampaign: { findUnique: jest.fn(), update: jest.fn() },
            advertiser: { update: jest.fn() },
            adTransaction: { create: jest.fn() },
            publisherEarnings: { upsert: jest.fn() },
            $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          },
        },
        {
          provide: FraudDetectionService,
          useValue: {
            analyzeClick: jest.fn().mockResolvedValue({
              isFraudulent: false,
              fraudScore: 0,
              action: 'allow',
              signals: [],
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AdsService>(AdsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdForZone', () => {
    it('should return fallback when zone has no active placements', async () => {
      (prisma.adZone.findUnique as jest.Mock).mockResolvedValue({
        ...mockZone,
        placements: [],
      });
      (prisma.adPlacement.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getAdForZone('zone-1', { device: 'desktop' });

      // Returns fallback HTML when no ads available
      expect(result).toHaveProperty('html', mockZone.fallbackHtml);
    });

    it('should return null for invalid zone', async () => {
      (prisma.adZone.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getAdForZone('invalid', {});
      expect(result).toBeNull();
    });

    it('should select ad based on weighted random selection', async () => {
      const placement = {
        id: 'placement-1',
        isActive: true,
        campaign: {
          ...mockCampaign,
          ads: [mockAd, { ...mockAd, id: 'ad-2', weight: 50 }],
        },
      };
      (prisma.adZone.findUnique as jest.Mock).mockResolvedValue({
        ...mockZone,
        placements: [placement],
      });
      (prisma.adPlacement.findMany as jest.Mock).mockResolvedValue([placement]);
      (prisma.ad.findUnique as jest.Mock).mockResolvedValue(mockAd);
      (prisma.adImpression.create as jest.Mock).mockResolvedValue({ id: 'imp-1' });

      const result = await service.getAdForZone('zone-1', { device: 'desktop' });

      expect(result).toHaveProperty('adId');
      expect(result).toHaveProperty('impressionId');
      expect(result).toHaveProperty('trackingUrl');
    });
  });

  describe('recordClick', () => {
    it('should record click and return target URL', async () => {
      (prisma.ad.findUnique as jest.Mock).mockResolvedValue({
        ...mockAd,
        campaign: { ...mockCampaign, targetUrl: 'https://example.com' },
      });
      (prisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        advertiser: { id: 'adv-1', balance: 500 },
      });
      (prisma.adClick.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adClick.create as jest.Mock).mockResolvedValue({ id: 'click-1' });

      const result = await service.recordClick('ad-1', 'imp-1', {
        path: '/blog/post',
        device: 'desktop',
      });

      expect(result).toHaveProperty('targetUrl', 'https://example.com');
      expect(prisma.adClick.create).toHaveBeenCalled();
    });

    it('should record click with fraud detection result', async () => {
      (prisma.ad.findUnique as jest.Mock).mockResolvedValue(mockAd);
      (prisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        advertiser: { id: 'adv-1', balance: 500 },
      });
      (prisma.adClick.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.adClick.create as jest.Mock).mockResolvedValue({ id: 'click-1' });

      await service.recordClick('ad-1', 'imp-1', { path: '/', sessionId: 'session-1' });

      // Fraud detection service is mocked to return isFraudulent: false
      expect(prisma.adClick.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isFraudulent: false }),
        })
      );
    });
  });
});

