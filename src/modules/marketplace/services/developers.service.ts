/**
 * Developers Service
 * Handles developer profile management and matching
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateDeveloperDto, UpdateDeveloperDto, DeveloperStatus } from '../dto';
import { Prisma, DeveloperCategory as PrismaDeveloperCategory } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// User selection for developer queries - includes comprehensive user data
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  coverImage: true,
  bio: true,
  headline: true,
  about: true,
  role: true,
  createdAt: true,
  accountLockedUntil: true,
  lastLoginAt: true,
  username: true,
};

/**
 * Helper to flatten user data into developer object for frontend compatibility
 * Ensures profileImage, coverImage, bio, and headline fall back to user's data
 */
function flattenDeveloperData(developer: any) {
  if (!developer) return null;
  return {
    ...developer,
    name: developer.user?.name || developer.displayName,
    username: developer.user?.username || developer.slug,
    avatar: developer.user?.avatar || developer.profileImage,
    profileImage: developer.profileImage || developer.user?.avatar,
    coverImage: developer.coverImage || developer.user?.coverImage,
    // Sync bio and headline from user profile if developer's own is empty
    bio: developer.bio || developer.user?.bio || developer.user?.about || '',
    headline: developer.headline || developer.user?.headline || '',
  };
}

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
    const baseSlug = dto.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.developer.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const developer = await this.prisma.developer.create({
      data: {
        id: uuidv4(),
        userId,
        displayName: dto.displayName,
        slug,
        headline: dto.headline,
        bio: dto.bio,
        category: (dto.category as any) || 'FULLSTACK',
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
        updatedAt: new Date(),
      },
      include: { user: { select: USER_SELECT } },
    });
    return flattenDeveloperData(developer);
  }

  /**
   * Update developer profile
   */
  async update(developerId: string, userId: string, dto: UpdateDeveloperDto, isAdmin = false) {
    const existing = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!existing) throw new NotFoundException('Developer not found');
    if (!isAdmin && existing.userId !== userId) throw new ForbiddenException('Not authorized');

    const developer = await this.prisma.developer.update({
      where: { id: developerId },
      data: {
        ...dto,
        category: dto.category as any,
        portfolio: dto.portfolio ? JSON.parse(JSON.stringify(dto.portfolio)) : undefined,
        education: dto.education ? JSON.parse(JSON.stringify(dto.education)) : undefined,
        certifications: dto.certifications
          ? JSON.parse(JSON.stringify(dto.certifications))
          : undefined,
      },
      include: { user: { select: USER_SELECT } },
    });
    return flattenDeveloperData(developer);
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
    return flattenDeveloperData(developer);
  }

  /**
   * Get developer by slug (for public profile)
   */
  async findBySlug(slug: string) {
    const developer = await this.prisma.developer.findUnique({
      where: { slug, status: 'ACTIVE' },
      include: {
        user: { select: USER_SELECT },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { reviewer: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });
    if (!developer) throw new NotFoundException('Developer not found');
    return flattenDeveloperData(developer);
  }

  /**
   * Get developer by user ID
   */
  async findByUserId(userId: string) {
    const developer = await this.prisma.developer.findUnique({
      where: { userId },
      include: { user: { select: USER_SELECT } },
    });
    return flattenDeveloperData(developer);
  }

  /**
   * List developers with filters
   */
  async findAll(filters: {
    status?: DeveloperStatus;
    category?: PrismaDeveloperCategory;
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
    const {
      status,
      category,
      skills,
      minRate,
      maxRate,
      minRating,
      availability,
      search,
      sortBy = 'rating',
      page = 1,
      limit = 12,
    } = filters;

    const where: Prisma.DeveloperWhereInput = {};
    if (status) where.status = status;
    if (category) where.category = category as PrismaDeveloperCategory;
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

    const [developersRaw, total] = await Promise.all([
      this.prisma.developer.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: USER_SELECT } },
      }),
      this.prisma.developer.count({ where }),
    ]);

    // Flatten user data into developer for frontend compatibility
    const developers = developersRaw.map(flattenDeveloperData);

    return { developers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Approve developer application (Admin)
   */
  async approve(developerId: string) {
    const existing = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!existing) throw new NotFoundException('Developer not found');
    if (existing.status !== 'PENDING')
      throw new BadRequestException('Developer is not pending approval');

    const developer = await this.prisma.developer.update({
      where: { id: developerId },
      data: { status: 'ACTIVE', isVerified: true, verifiedAt: new Date() },
      include: { user: { select: USER_SELECT } },
    });
    return flattenDeveloperData(developer);
  }

  /**
   * Reject developer application (Admin)
   */
  async reject(developerId: string, reason: string) {
    const existing = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!existing) throw new NotFoundException('Developer not found');

    const developer = await this.prisma.developer.update({
      where: { id: developerId },
      data: { status: 'REJECTED', rejectionReason: reason },
      include: { user: { select: USER_SELECT } },
    });
    return flattenDeveloperData(developer);
  }

  /**
   * Suspend developer (Admin)
   */
  async suspend(developerId: string, reason: string) {
    const developer = await this.prisma.developer.update({
      where: { id: developerId },
      data: { status: 'SUSPENDED', suspensionReason: reason },
      include: { user: { select: USER_SELECT } },
    });
    return flattenDeveloperData(developer);
  }

  /**
   * Reactivate developer (Admin)
   */
  async reactivate(developerId: string) {
    const developer = await this.prisma.developer.update({
      where: { id: developerId },
      data: { status: 'ACTIVE', suspensionReason: null },
      include: { user: { select: USER_SELECT } },
    });
    return flattenDeveloperData(developer);
  }

  /**
   * Feature/unfeature developer (Admin)
   */
  async setFeatured(developerId: string, featured: boolean, daysUntil = 30) {
    const developer = await this.prisma.developer.update({
      where: { id: developerId },
      data: {
        isFeatured: featured,
        featuredUntil: featured ? new Date(Date.now() + daysUntil * 24 * 60 * 60 * 1000) : null,
      },
      include: { user: { select: USER_SELECT } },
    });
    return flattenDeveloperData(developer);
  }

  /**
   * Delete developer (Admin)
   * Permanently removes the developer profile
   */
  async delete(developerId: string) {
    const existing = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!existing) throw new NotFoundException('Developer not found');

    try {
      // Delete the developer profile (cascades to related records)
      await this.prisma.developer.delete({
        where: { id: developerId },
      });

      return { success: true, message: 'Developer deleted successfully' };
    } catch (error: any) {
      console.error('Error deleting developer:', error);
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete developer: there are related records that must be deleted first',
        );
      }
      throw new BadRequestException(error.message || 'Failed to delete developer');
    }
  }

  /**
   * Admin: Update developer profile with extended fields
   */
  async adminUpdate(developerId: string, dto: {
    displayName?: string;
    headline?: string;
    bio?: string;
    profileImage?: string;
    category?: string;
    skills?: string[];
    languages?: string[];
    frameworks?: string[];
    tools?: string[];
    spokenLanguages?: string[];
    hourlyRate?: number;
    minimumBudget?: number;
    yearsOfExperience?: number;
    portfolio?: any[];
    education?: any[];
    certifications?: any[];
    availability?: string;
    availableHours?: number;
    timezone?: string;
    websiteUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    status?: DeveloperStatus;
    isVerified?: boolean;
    isFeatured?: boolean;
    rating?: number;
    reviewCount?: number;
  }) {
    const existing = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!existing) throw new NotFoundException('Developer not found');

    // Extract admin-only fields
    const { status, isVerified, isFeatured, rating, reviewCount, websiteUrl, githubUrl, linkedinUrl, ...profileData } = dto;

    const developer = await this.prisma.developer.update({
      where: { id: developerId },
      data: {
        ...profileData,
        category: profileData.category as PrismaDeveloperCategory,
        portfolio: profileData.portfolio ? JSON.parse(JSON.stringify(profileData.portfolio)) : undefined,
        education: profileData.education ? JSON.parse(JSON.stringify(profileData.education)) : undefined,
        certifications: profileData.certifications ? JSON.parse(JSON.stringify(profileData.certifications)) : undefined,
        websiteUrl,
        githubUrl,
        linkedinUrl,
        status: status as DeveloperStatus,
        isVerified,
        isFeatured,
        rating,
        reviewCount,
      },
      include: { user: { select: USER_SELECT } },
    });

    return flattenDeveloperData(developer);
  }

  /**
   * Admin: Create developer profile directly for a user (bypasses application)
   */
  async adminCreateDeveloper(dto: {
    userId: string;
    displayName: string;
    headline?: string;
    bio?: string;
    category?: PrismaDeveloperCategory;
    skills?: string[];
    languages?: string[];
    frameworks?: string[];
    hourlyRate: number;
    minimumBudget?: number;
    yearsOfExperience?: number;
    websiteUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    status?: DeveloperStatus;
    isVerified?: boolean;
    rating?: number;
    reviewCount?: number;
  }) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if user already has a developer profile
    const existing = await this.prisma.developer.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new BadRequestException('User already has a developer profile');
    }

    // Generate slug from display name
    const baseSlug = dto.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.developer.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const status = dto.status || DeveloperStatus.ACTIVE;
    const isVerified = dto.isVerified !== undefined ? dto.isVerified : status === DeveloperStatus.ACTIVE;

    const developer = await this.prisma.developer.create({
      data: {
        id: uuidv4(),
        userId: dto.userId,
        displayName: dto.displayName,
        slug,
        headline: dto.headline,
        bio: dto.bio,
        category: (dto.category || 'FULLSTACK') as PrismaDeveloperCategory,
        skills: dto.skills || [],
        languages: dto.languages || [],
        frameworks: dto.frameworks || [],
        hourlyRate: dto.hourlyRate,
        minimumBudget: dto.minimumBudget,
        yearsOfExperience: dto.yearsOfExperience || 0,
        rating: dto.rating || 0,
        reviewCount: dto.reviewCount || 0,
        websiteUrl: dto.websiteUrl,
        githubUrl: dto.githubUrl,
        linkedinUrl: dto.linkedinUrl,
        status,
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        updatedAt: new Date(),
      },
      include: { user: { select: USER_SELECT } },
    });
    return flattenDeveloperData(developer);
  }

  /**
   * Get all users who are not yet developers (for admin selection)
   */
  async getAvailableUsersForDeveloper(search?: string, limit = 20) {
    const developerUserIds = await this.prisma.developer.findMany({
      select: { userId: true },
    });
    const excludeIds = developerUserIds.map(d => d.userId);

    const where: Prisma.UserWhereInput = {
      id: { notIn: excludeIds },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: USER_SELECT,
      take: limit,
      orderBy: { name: 'asc' },
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
    const newRating = (developer.rating * developer.reviewCount + projectRating) / newReviewCount;

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
  async matchDevelopers(
    requirements: {
      category?: PrismaDeveloperCategory;
      skills?: string[];
      budget?: number;
      budgetType?: string;
    },
    limit = 10,
  ) {
    const where: Prisma.DeveloperWhereInput = { status: 'ACTIVE', availability: 'available' };
    if (requirements.category) where.category = requirements.category as PrismaDeveloperCategory;
    if (requirements.skills?.length) where.skills = { hasSome: requirements.skills };
    if (requirements.budget && requirements.budgetType === 'hourly') {
      where.hourlyRate = { lte: requirements.budget };
    }

    const developersRaw = await this.prisma.developer.findMany({
      where,
      orderBy: [{ rating: 'desc' }, { projectsCompleted: 'desc' }],
      take: limit,
      include: { user: { select: USER_SELECT } },
    });

    // Calculate match score and flatten user data
    return developersRaw
      .map((dev) => {
        let score = dev.rating * 20; // Base score from rating
        if (requirements.skills?.length) {
          const matchedSkills = requirements.skills.filter((s) => dev.skills.includes(s));
          score += (matchedSkills.length / requirements.skills.length) * 30;
        }
        score += Math.min(dev.projectsCompleted, 10) * 2;
        return {
          ...flattenDeveloperData(dev),
          matchScore: Math.round(score),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Get all unique skills from active developers
   */
  async getAllSkills(): Promise<{ skill: string; count: number }[]> {
    const developers = await this.prisma.developer.findMany({
      where: { status: 'ACTIVE' },
      select: { skills: true },
    });

    // Count skill occurrences
    const skillCounts = new Map<string, number>();
    for (const dev of developers) {
      for (const skill of dev.skills) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      }
    }

    // Convert to array and sort by count
    return Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get featured developers for homepage/landing
   */
  async getFeatured(limit = 6) {
    return this.prisma.developer.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ isFeatured: true }, { rating: { gte: 4.5 } }],
      },
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }, { projectsCompleted: 'desc' }],
      take: limit,
      include: { user: { select: USER_SELECT } },
    });
  }

  /**
   * Get developer count by experience level
   */
  async getExperienceLevels(): Promise<{ level: string; count: number }[]> {
    const developers = await this.prisma.developer.findMany({
      where: { status: 'ACTIVE' },
      select: { yearsOfExperience: true },
    });

    const levels = {
      'Entry Level (0-2 years)': 0,
      'Mid Level (3-5 years)': 0,
      'Senior (6-10 years)': 0,
      'Expert (10+ years)': 0,
    };

    for (const dev of developers) {
      const years = dev.yearsOfExperience;
      if (years <= 2) levels['Entry Level (0-2 years)']++;
      else if (years <= 5) levels['Mid Level (3-5 years)']++;
      else if (years <= 10) levels['Senior (6-10 years)']++;
      else levels['Expert (10+ years)']++;
    }

    return Object.entries(levels).map(([level, count]) => ({ level, count }));
  }

  /**
   * Get reviews for a developer
   */
  async getReviews(developerId: string, limit = 20) {
    return this.prisma.developerReview.findMany({
      where: { developerId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }
}
