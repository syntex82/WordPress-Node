/**
 * Developers Service
 * Handles developer profile management and matching
 */

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateDeveloperDto, UpdateDeveloperDto, DeveloperStatus, DeveloperCategory } from '../dto';
import { Prisma } from '@prisma/client';

// User selection for developer queries - includes comprehensive user data
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  createdAt: true,
  accountLockedUntil: true,
  lastLoginAt: true,
  username: true,
};

@Injectable()
export class DevelopersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a developer application
   */
  async create(userId: string, dto: CreateDeveloperDto) {
    // Check if user already has a developer profile
    const existing = await this.prisma.developer.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new BadRequestException('Developer profile already exists');
    }

    // Generate slug from display name
    const baseSlug = dto.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.developer.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return this.prisma.developer.create({
      data: {
        userId,
        displayName: dto.displayName,
        slug,
        headline: dto.headline,
        bio: dto.bio,
        category: dto.category as any || 'FULLSTACK',
        skills: dto.skills || [],
        languages: dto.languages || [],
        frameworks: dto.frameworks || [],
        hourlyRate: dto.hourlyRate,
        minimumBudget: dto.minimumBudget,
        yearsOfExperience: dto.yearsOfExperience || 0,
        applicationNote: dto.applicationNote,
        websiteUrl: dto.websiteUrl,
        githubUrl: dto.githubUrl,
        linkedinUrl: dto.linkedinUrl,
        status: 'PENDING',
      },
      include: { user: { select: USER_SELECT } },
    });
  }

  /**
   * Update developer profile
   */
  async update(developerId: string, userId: string, dto: UpdateDeveloperDto, isAdmin = false) {
    const developer = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!developer) throw new NotFoundException('Developer not found');
    if (!isAdmin && developer.userId !== userId) throw new ForbiddenException('Not authorized');

    return this.prisma.developer.update({
      where: { id: developerId },
      data: {
        ...dto,
        category: dto.category as any,
        portfolio: dto.portfolio ? JSON.parse(JSON.stringify(dto.portfolio)) : undefined,
        education: dto.education ? JSON.parse(JSON.stringify(dto.education)) : undefined,
        certifications: dto.certifications ? JSON.parse(JSON.stringify(dto.certifications)) : undefined,
      },
      include: { user: { select: USER_SELECT } },
    });
  }

  /**
   * Get developer by ID
   */
  async findById(id: string) {
    const developer = await this.prisma.developer.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        reviews: { where: { isApproved: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!developer) throw new NotFoundException('Developer not found');
    return developer;
  }

  /**
   * Get developer by slug (for public profile)
   */
  async findBySlug(slug: string) {
    const developer = await this.prisma.developer.findUnique({
      where: { slug, status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        reviews: { where: { isApproved: true }, orderBy: { createdAt: 'desc' }, take: 10,
          include: { reviewer: { select: { id: true, name: true, avatar: true } } } },
      },
    });
    if (!developer) throw new NotFoundException('Developer not found');
    return developer;
  }

  /**
   * Get developer by user ID
   */
  async findByUserId(userId: string) {
    return this.prisma.developer.findUnique({
      where: { userId },
      include: { user: { select: USER_SELECT } },
    });
  }

  /**
   * List developers with filters
   */
  async findAll(filters: {
    status?: DeveloperStatus;
    category?: DeveloperCategory;
    skills?: string[];
    minRate?: number;
    maxRate?: number;
    minRating?: number;
    availability?: string;
    search?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, category, skills, minRate, maxRate, minRating, availability, search,
      sortBy = 'rating', page = 1, limit = 12 } = filters;

    const where: Prisma.DeveloperWhereInput = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (availability) where.availability = availability;
    if (minRating) where.rating = { gte: minRating };
    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate.gte = minRate;
      if (maxRate) where.hourlyRate.lte = maxRate;
    }
    if (skills?.length) where.skills = { hasSome: skills };
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.DeveloperOrderByWithRelationInput = {};
    if (sortBy === 'rating') orderBy.rating = 'desc';
    else if (sortBy === 'price_low') orderBy.hourlyRate = 'asc';
    else if (sortBy === 'price_high') orderBy.hourlyRate = 'desc';
    else if (sortBy === 'experience') orderBy.yearsOfExperience = 'desc';
    else if (sortBy === 'projects') orderBy.projectsCompleted = 'desc';
    else orderBy.createdAt = 'desc';

    const [developers, total] = await Promise.all([
      this.prisma.developer.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        include: { user: { select: USER_SELECT } },
      }),
      this.prisma.developer.count({ where }),
    ]);

    return { developers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Approve developer application (Admin)
   */
  async approve(developerId: string) {
    const developer = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!developer) throw new NotFoundException('Developer not found');
    if (developer.status !== 'PENDING') throw new BadRequestException('Developer is not pending approval');

    return this.prisma.developer.update({
      where: { id: developerId },
      data: { status: 'ACTIVE', isVerified: true, verifiedAt: new Date() },
    });
  }

  /**
   * Reject developer application (Admin)
   */
  async reject(developerId: string, reason: string) {
    const developer = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!developer) throw new NotFoundException('Developer not found');

    return this.prisma.developer.update({
      where: { id: developerId },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
  }

  /**
   * Suspend developer (Admin)
   */
  async suspend(developerId: string, reason: string) {
    return this.prisma.developer.update({
      where: { id: developerId },
      data: { status: 'SUSPENDED', suspensionReason: reason },
    });
  }

  /**
   * Reactivate developer (Admin)
   */
  async reactivate(developerId: string) {
    return this.prisma.developer.update({
      where: { id: developerId },
      data: { status: 'ACTIVE', suspensionReason: null },
    });
  }

  /**
   * Feature/unfeature developer (Admin)
   */
  async setFeatured(developerId: string, featured: boolean, daysUntil = 30) {
    return this.prisma.developer.update({
      where: { id: developerId },
      data: {
        isFeatured: featured,
        featuredUntil: featured ? new Date(Date.now() + daysUntil * 24 * 60 * 60 * 1000) : null,
      },
    });
  }

  /**
   * Get developer statistics (Admin)
   */
  async getStatistics() {
    const [total, pending, active, suspended, byCategory, topRated] = await Promise.all([
      this.prisma.developer.count(),
      this.prisma.developer.count({ where: { status: 'PENDING' } }),
      this.prisma.developer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.developer.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.developer.groupBy({ by: ['category'], _count: true }),
      this.prisma.developer.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { rating: 'desc' },
        take: 5,
        include: { user: { select: USER_SELECT } },
      }),
    ]);

    return { total, pending, active, suspended, byCategory, topRated };
  }

  /**
   * Update developer stats after project completion
   */
  async updateStats(developerId: string, projectRating: number, earnings: number) {
    const developer = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!developer) return;

    const newReviewCount = developer.reviewCount + 1;
    const newRating = ((developer.rating * developer.reviewCount) + projectRating) / newReviewCount;

    await this.prisma.developer.update({
      where: { id: developerId },
      data: {
        rating: newRating,
        reviewCount: newReviewCount,
        projectsCompleted: developer.projectsCompleted + 1,
        totalEarnings: { increment: earnings },
      },
    });
  }

  /**
   * Match developers for a project based on requirements
   */
  async matchDevelopers(requirements: {
    category?: DeveloperCategory;
    skills?: string[];
    budget?: number;
    budgetType?: string;
  }, limit = 10) {
    const where: Prisma.DeveloperWhereInput = { status: 'ACTIVE', availability: 'available' };
    if (requirements.category) where.category = requirements.category;
    if (requirements.skills?.length) where.skills = { hasSome: requirements.skills };
    if (requirements.budget && requirements.budgetType === 'hourly') {
      where.hourlyRate = { lte: requirements.budget };
    }

    const developers = await this.prisma.developer.findMany({
      where,
      orderBy: [{ rating: 'desc' }, { projectsCompleted: 'desc' }],
      take: limit,
      include: { user: { select: USER_SELECT } },
    });

    // Calculate match score
    return developers.map((dev) => {
      let score = dev.rating * 20; // Base score from rating
      if (requirements.skills?.length) {
        const matchedSkills = requirements.skills.filter((s) => dev.skills.includes(s));
        score += (matchedSkills.length / requirements.skills.length) * 30;
      }
      score += Math.min(dev.projectsCompleted, 10) * 2;
      return { ...dev, matchScore: Math.round(score) };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }
}

