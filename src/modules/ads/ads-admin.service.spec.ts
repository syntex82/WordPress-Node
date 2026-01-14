/**
 * AdsAdminService Unit Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AdsAdminService } from './ads-admin.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdsAdminService', () => {
  let service: AdsAdminService;
  let prisma: jest.Mocked<PrismaService>;

  const mockAdvertiser = {
    id: 'adv-1',
    companyName: 'Test Company',
    contactEmail: 'test@company.com',
    balance: 500,
    status: 'active',
    campaigns: [],
    createdAt: new Date(),
  };

  const mockCampaign = {
    id: 'campaign-1',
    advertiserId: 'adv-1',
    name: 'Test Campaign',
    type: 'cpc',
    status: 'active',
    budget: 1000,
    dailyBudget: 100,
    bidAmount: 0.5,
    totalSpent: 50,
    advertiser: mockAdvertiser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsAdminService,
        {
          provide: PrismaService,
          useValue: {
            advertiser: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            adCampaign: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            ad: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            adZone: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            adPlacement: { create: jest.fn(), delete: jest.fn() },
            adTransaction: { create: jest.fn() },
            adImpression: { count: jest.fn(), groupBy: jest.fn() },
            adClick: { count: jest.fn(), groupBy: jest.fn(), aggregate: jest.fn() },
            publisherEarnings: { findMany: jest.fn() },
            $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
          },
        },
      ],
    }).compile();

    service = module.get<AdsAdminService>(AdsAdminService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Advertisers', () => {
    it('should list advertisers with pagination', async () => {
      (prisma.advertiser.findMany as jest.Mock).mockResolvedValue([mockAdvertiser]);
      (prisma.advertiser.count as jest.Mock).mockResolvedValue(1);

      const result = await service.listAdvertisers({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result.items).toHaveLength(1);
    });

    it('should create advertiser', async () => {
      (prisma.advertiser.create as jest.Mock).mockResolvedValue(mockAdvertiser);

      const result = await service.createAdvertiser({
        companyName: 'Test Company',
        contactEmail: 'test@company.com',
      });

      expect(result.companyName).toBe('Test Company');
    });

    it('should throw NotFoundException for invalid advertiser', async () => {
      (prisma.advertiser.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getAdvertiser('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should add credit to advertiser balance', async () => {
      (prisma.advertiser.findUnique as jest.Mock).mockResolvedValue(mockAdvertiser);
      (prisma.advertiser.update as jest.Mock).mockResolvedValue({
        ...mockAdvertiser,
        balance: 600,
      });
      (prisma.adTransaction.create as jest.Mock).mockResolvedValue({});

      const result = await service.addCredit('adv-1', 100, 'Manual deposit');

      expect(result.balance).toBe(600);
    });
  });

  describe('Campaigns', () => {
    it('should create campaign', async () => {
      (prisma.adCampaign.create as jest.Mock).mockResolvedValue(mockCampaign);

      const result = await service.createCampaign({
        advertiserId: 'adv-1',
        name: 'New Campaign',
        type: 'cpc',
        budget: 1000,
        bidAmount: 0.5,
      });

      expect(result).toEqual(mockCampaign);
      expect(prisma.adCampaign.create).toHaveBeenCalled();
    });

    it('should update campaign status', async () => {
      (prisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign);
      (prisma.adCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'paused',
      });

      const result = await service.updateCampaignStatus('campaign-1', 'paused');

      expect(result.status).toBe('paused');
    });
  });
});

