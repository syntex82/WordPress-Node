/**
 * Professional Services Service
 * Manages service catalog and offerings
 */

import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto, UpdateServiceDto, ServiceCategory, DEFAULT_SERVICES } from './dto';

@Injectable()
export class ServicesService implements OnModuleInit {
  private readonly logger = new Logger(ServicesService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Seed default services if none exist
    const count = await this.prisma.professionalService.count();
    if (count === 0) {
      await this.seedDefaultServices();
    }
  }

  private async seedDefaultServices() {
    this.logger.log('Seeding default professional services...');
    
    for (const service of DEFAULT_SERVICES) {
      await this.prisma.professionalService.create({
        data: {
          name: service.name,
          slug: service.slug,
          description: service.description,
          category: service.category as any,
          priceType: service.priceType as any,
          hourlyRate: service.hourlyRate,
          fixedPrice: service.fixedPrice,
          minHours: service.minHours,
          features: service.features,
          deliverables: service.deliverables,
          isActive: true,
        },
      });
    }
    
    this.logger.log(`Seeded ${DEFAULT_SERVICES.length} default services`);
  }

  /**
   * Get all active services
   */
  async getActiveServices(category?: ServiceCategory) {
    const where: any = { isActive: true };
    if (category) where.category = category;

    return this.prisma.professionalService.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get service by slug
   */
  async getServiceBySlug(slug: string) {
    const service = await this.prisma.professionalService.findUnique({
      where: { slug },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string) {
    const service = await this.prisma.professionalService.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Create a new service (admin)
   */
  async createService(dto: CreateServiceDto) {
    return this.prisma.professionalService.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        category: dto.category as any,
        priceType: dto.priceType as any,
        hourlyRate: dto.hourlyRate,
        fixedPrice: dto.fixedPrice,
        minHours: dto.minHours,
        maxHours: dto.maxHours,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        features: dto.features || [],
        deliverables: dto.deliverables || [],
        image: dto.image,
      },
    });
  }

  /**
   * Update a service (admin)
   */
  async updateService(id: string, dto: UpdateServiceDto) {
    await this.getServiceById(id); // Verify exists

    return this.prisma.professionalService.update({
      where: { id },
      data: {
        ...dto,
        priceType: dto.priceType as any,
      },
    });
  }

  /**
   * Delete a service (admin)
   */
  async deleteService(id: string) {
    await this.getServiceById(id); // Verify exists

    return this.prisma.professionalService.delete({
      where: { id },
    });
  }

  /**
   * Get all services (admin)
   */
  async getAllServices() {
    return this.prisma.professionalService.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });
  }

  /**
   * Get featured services for homepage
   */
  async getFeaturedServices(limit: number = 4) {
    return this.prisma.professionalService.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: limit,
    });
  }
}

