/**
 * Course Modules Service for LMS Curriculum
 * Manages course sections/modules that group lessons
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateModuleDto, UpdateModuleDto } from '../dto/module.dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new module for a course
   */
  async create(courseId: string, dto: CreateModuleDto) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    // Get the max order index for existing modules
    const maxOrder = await this.prisma.courseModule.aggregate({
      where: { courseId },
      _max: { orderIndex: true },
    });

    const orderIndex = dto.orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1;

    return this.prisma.courseModule.create({
      data: {
        ...dto,
        courseId,
        orderIndex,
      },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, title: true, type: true, orderIndex: true },
        },
        _count: { select: { lessons: true } },
      },
    });
  }

  /**
   * Get all modules for a course with their lessons
   */
  async findByCourse(courseId: string) {
    return this.prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
          include: {
            videoAsset: { select: { id: true, provider: true, url: true } },
            quiz: { select: { id: true, title: true } },
          },
        },
        _count: { select: { lessons: true } },
      },
    });
  }

  /**
   * Get a single module by ID
   */
  async findOne(id: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, instructorId: true } },
        lessons: {
          orderBy: { orderIndex: 'asc' },
          include: {
            videoAsset: true,
            quiz: { select: { id: true, title: true } },
          },
        },
        _count: { select: { lessons: true } },
      },
    });
    if (!module) throw new NotFoundException('Module not found');
    return module;
  }

  /**
   * Update a module
   */
  async update(id: string, dto: UpdateModuleDto) {
    await this.findOne(id);
    return this.prisma.courseModule.update({
      where: { id },
      data: dto,
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, title: true, type: true, orderIndex: true },
        },
        _count: { select: { lessons: true } },
      },
    });
  }

  /**
   * Delete a module (lessons become unassigned)
   */
  async delete(id: string) {
    const module = await this.findOne(id);

    // Unassign all lessons from this module
    await this.prisma.lesson.updateMany({
      where: { moduleId: id },
      data: { moduleId: null },
    });

    await this.prisma.courseModule.delete({ where: { id } });
    return { message: 'Module deleted successfully', lessonsUnassigned: module._count.lessons };
  }

  /**
   * Reorder modules within a course
   */
  async reorder(courseId: string, moduleIds: string[]) {
    const updates = moduleIds.map((id, index) =>
      this.prisma.courseModule.update({
        where: { id },
        data: { orderIndex: index },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.findByCourse(courseId);
  }

  /**
   * Move a lesson to a module (or unassign it)
   */
  async moveLessonToModule(lessonId: string, moduleId: string | null, orderIndex?: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // If moduleId provided, verify it exists and belongs to same course
    if (moduleId) {
      const module = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
      if (!module) throw new NotFoundException('Module not found');
      if (module.courseId !== lesson.courseId) {
        throw new NotFoundException('Module does not belong to the same course');
      }
    }

    // Calculate order index if not provided
    let newOrderIndex = orderIndex;
    if (newOrderIndex === undefined) {
      const maxOrder = await this.prisma.lesson.aggregate({
        where: { courseId: lesson.courseId, moduleId: moduleId ?? null },
        _max: { orderIndex: true },
      });
      newOrderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { moduleId, orderIndex: newOrderIndex },
      include: { module: { select: { id: true, title: true } } },
    });
  }
}
