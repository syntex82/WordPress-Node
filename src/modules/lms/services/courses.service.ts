/**
 * Courses Service for LMS Module
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from '../dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateCourseDto, instructorId: string) {
    const slug = this.generateSlug(dto.title);
    
    // Check for slug collision
    let finalSlug = slug;
    let counter = 1;
    while (await this.prisma.course.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter++}`;
    }

    return this.prisma.course.create({
      data: {
        ...dto,
        slug: finalSlug,
        instructorId,
        priceAmount: dto.priceAmount ? dto.priceAmount : null,
        whatYouLearn: dto.whatYouLearn || [],
        requirements: dto.requirements || [],
      },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
  }

  async findAll(query: CourseQueryDto) {
    const { search, category, level, priceType, status, instructorId, page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (level) where.level = level;
    if (priceType) where.priceType = priceType;
    if (status) where.status = status;
    if (instructorId) where.instructorId = instructorId;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: { select: { id: true, name: true, avatar: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findPublished(query: CourseQueryDto) {
    return this.findAll({ ...query, status: 'PUBLISHED' as any });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, avatar: true, bio: true } },
        lessons: { orderBy: { orderIndex: 'asc' } },
        quizzes: { include: { _count: { select: { questions: true } } } },
        _count: { select: { lessons: true, enrollments: true, quizzes: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: { select: { id: true, name: true, avatar: true, bio: true } },
        lessons: { orderBy: { orderIndex: 'asc' }, select: {
          id: true, title: true, type: true, estimatedMinutes: true, isPreview: true, orderIndex: true
        }},
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, userId: string, isAdmin: boolean) {
    const course = await this.findOne(id);
    if (!isAdmin && course.instructorId !== userId) {
      throw new ForbiddenException('Not authorized to update this course');
    }
    return this.prisma.course.update({
      where: { id },
      data: {
        ...dto,
        priceAmount: dto.priceAmount !== undefined ? dto.priceAmount : undefined,
        whatYouLearn: dto.whatYouLearn || undefined,
        requirements: dto.requirements || undefined,
      },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
    });
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const course = await this.findOne(id);
    if (!isAdmin && course.instructorId !== userId) {
      throw new ForbiddenException('Not authorized to delete this course');
    }
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Course deleted successfully' };
  }

  async getCategories() {
    const courses = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED', category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return courses.map(c => c.category).filter(Boolean);
  }
}

