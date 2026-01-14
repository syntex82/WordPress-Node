/**
 * RtbService Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RtbService, BidRequest } from './rtb.service';
import { PrismaService } from '../../database/prisma.service';

describe('RtbService', () => {
  let service: RtbService;
  let prisma: jest.Mocked<PrismaService>;

  const mockCampaign = {
    id: 'campaign-1',
    name: 'Test Campaign',
    status: 'active',
    type: 'cpc',
    bidAmount: 0.50,
    budget: 1000,
    totalSpent: 100,
    targetDevices: ['desktop', 'mobile'],
    targetCountries: ['US'],
    targetPages: [],
    advertiser: { id: 'adv-1', balance: 500 },
    ads: [
      { id: 'ad-1', name: 'Ad 1', status: 'active', weight: 100, html: '<div>Ad</div>' },
      { id: 'ad-2', name: 'Ad 2', status: 'active', weight: 50, html: '<div>Ad 2</div>' },
    ],
  };

  const baseBidRequest: BidRequest = {
    id: 'req-1',
    zoneId: 'zone-1',
    site: { domain: 'example.com', page: '/blog/post' },
    device: { type: 'desktop', ua: 'Chrome/120', ip: '1.2.3.4' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RtbService,
        {
          provide: PrismaService,
          useValue: {
            adCampaign: {
              findMany: jest.fn(),
              fields: { budget: {} },
            },
          },
        },
      ],
    }).compile();

    service = module.get<RtbService>(RtbService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('conductAuction', () => {
    it('should return no winner when no eligible campaigns', async () => {
      (prisma.adCampaign.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.conductAuction(baseBidRequest);

      expect(result.winner).toBeNull();
      expect(result.allBids).toHaveLength(0);
    });

    it('should select winning bid from eligible campaigns', async () => {
      (prisma.adCampaign.findMany as jest.Mock).mockResolvedValue([mockCampaign]);

      const result = await service.conductAuction(baseBidRequest);

      expect(result.winner).not.toBeNull();
      expect(result.winner?.campaignId).toBe('campaign-1');
      expect(result.auctionId).toContain('auction-');
    });

    it('should apply second-price auction logic', async () => {
      const campaign2 = {
        ...mockCampaign,
        id: 'campaign-2',
        bidAmount: 0.30,
        ads: [{ id: 'ad-3', status: 'active', weight: 100 }],
      };
      (prisma.adCampaign.findMany as jest.Mock).mockResolvedValue([mockCampaign, campaign2]);

      const result = await service.conductAuction(baseBidRequest);

      expect(result.winner).not.toBeNull();
      expect(result.allBids.length).toBe(2);
      // Winner should pay second price + 0.01
      expect(result.winner?.price).toBeCloseTo(result.secondPrice + 0.01, 2);
    });

    it('should filter by device targeting', async () => {
      const tabletOnly = { ...mockCampaign, targetDevices: ['tablet'] };
      (prisma.adCampaign.findMany as jest.Mock).mockResolvedValue([tabletOnly]);

      const result = await service.conductAuction(baseBidRequest);

      // Desktop request should not match tablet-only campaign
      expect(result.winner).toBeNull();
    });

    it('should filter by country targeting', async () => {
      const ukOnly = { ...mockCampaign, targetCountries: ['UK'] };
      (prisma.adCampaign.findMany as jest.Mock).mockResolvedValue([ukOnly]);

      const requestWithGeo: BidRequest = {
        ...baseBidRequest,
        device: { ...baseBidRequest.device, geo: { country: 'US' } },
      };

      const result = await service.conductAuction(requestWithGeo);

      expect(result.winner).toBeNull();
    });

    it('should respect floor price', async () => {
      const lowBidCampaign = { ...mockCampaign, bidAmount: 0.10 };
      (prisma.adCampaign.findMany as jest.Mock).mockResolvedValue([lowBidCampaign]);

      const result = await service.conductAuction({
        ...baseBidRequest,
        floor: 0.50, // Floor higher than bid
      });

      expect(result.winner).toBeNull();
    });
  });

  describe('processBidRequest', () => {
    it('should return valid bid response format', async () => {
      (prisma.adCampaign.findMany as jest.Mock).mockResolvedValue([mockCampaign]);

      const response = await service.processBidRequest(baseBidRequest);

      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('bidRequestId', baseBidRequest.id);
      expect(response).toHaveProperty('seatBid');
      expect(response).toHaveProperty('currency', 'USD');
      expect(response).toHaveProperty('processingTime');
      expect(response.processingTime).toBeLessThan(1000);
    });

    it('should return empty seatBid when no winner', async () => {
      (prisma.adCampaign.findMany as jest.Mock).mockResolvedValue([]);

      const response = await service.processBidRequest(baseBidRequest);

      expect(response.seatBid).toHaveLength(0);
    });
  });
});

