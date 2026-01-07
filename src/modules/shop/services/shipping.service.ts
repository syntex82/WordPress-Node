import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateShippingMethodDto {
  name: string;
  description?: string;
  cost: number;
  freeAbove?: number;
  minDays?: number;
  maxDays?: number;
  countries?: string;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateShippingMethodDto extends Partial<CreateShippingMethodDto> {}

export interface ShippingZoneDto {
  name: string;
  countries: string[];
  methods: {
    name: string;
    cost: number;
    freeAbove?: number;
    minDays?: number;
    maxDays?: number;
  }[];
}

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  // CRUD Operations
  async create(dto: CreateShippingMethodDto) {
    return this.prisma.shippingMethod.create({
      data: {
        name: dto.name,
        description: dto.description,
        cost: new Decimal(dto.cost),
        freeAbove: dto.freeAbove ? new Decimal(dto.freeAbove) : null,
        minDays: dto.minDays,
        maxDays: dto.maxDays,
        countries: dto.countries,
        isActive: dto.isActive ?? true,
        priority: dto.priority ?? 0,
      },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.shippingMethod.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { priority: 'asc' },
    });
  }

  async findOne(id: string) {
    const method = await this.prisma.shippingMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Shipping method not found');
    return method;
  }

  async update(id: string, dto: UpdateShippingMethodDto) {
    await this.findOne(id);
    return this.prisma.shippingMethod.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        cost: dto.cost !== undefined ? new Decimal(dto.cost) : undefined,
        freeAbove:
          dto.freeAbove !== undefined
            ? dto.freeAbove
              ? new Decimal(dto.freeAbove)
              : null
            : undefined,
        minDays: dto.minDays,
        maxDays: dto.maxDays,
        countries: dto.countries,
        isActive: dto.isActive,
        priority: dto.priority,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.shippingMethod.delete({ where: { id } });
  }

  // Get shipping methods available for a specific country
  async getAvailableForCountry(countryCode: string) {
    const allMethods = await this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });

    return allMethods.filter((method) => {
      if (!method.countries) return true; // Available for all countries
      const countryCodes = method.countries.split(',').map((c) => c.trim().toUpperCase());
      return countryCodes.includes(countryCode.toUpperCase());
    });
  }

  // Calculate shipping cost based on cart subtotal
  async calculateShipping(methodId: string, subtotal: number) {
    const method = await this.findOne(methodId);

    // Check if free shipping applies
    if (method.freeAbove && subtotal >= Number(method.freeAbove)) {
      return {
        method,
        originalCost: Number(method.cost),
        finalCost: 0,
        isFree: true,
        freeShippingApplied: true,
      };
    }

    return {
      method,
      originalCost: Number(method.cost),
      finalCost: Number(method.cost),
      isFree: false,
      freeShippingApplied: false,
    };
  }

  // Get shipping rates for checkout (with calculated costs)
  async getShippingRates(countryCode: string, subtotal: number) {
    const methods = await this.getAvailableForCountry(countryCode);

    return Promise.all(
      methods.map(async (method) => {
        const calculation = await this.calculateShipping(method.id, subtotal);
        return {
          id: method.id,
          name: method.name,
          description: method.description,
          cost: calculation.finalCost,
          originalCost: calculation.originalCost,
          isFree: calculation.isFree,
          freeAbove: method.freeAbove ? Number(method.freeAbove) : null,
          minDays: method.minDays,
          maxDays: method.maxDays,
          estimatedDelivery: this.formatDeliveryEstimate(method.minDays, method.maxDays),
        };
      }),
    );
  }

  private formatDeliveryEstimate(minDays?: number | null, maxDays?: number | null): string {
    if (!minDays && !maxDays) return 'Varies';
    if (minDays && maxDays) return `${minDays}-${maxDays} business days`;
    if (minDays) return `${minDays}+ business days`;
    if (maxDays) return `Up to ${maxDays} business days`;
    return 'Varies';
  }
}
