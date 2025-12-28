/**
 * Course Ownership Guard
 * Verifies that the user is the course instructor or an admin
 * Used to protect course editing endpoints (modules, lessons, quizzes)
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CourseOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Admins and Editors have full access to all courses
    if (user.role === 'ADMIN' || user.role === 'EDITOR') {
      return true;
    }

    // Authors can access their own courses (checked below)

    // Get courseId from route params
    const courseId = request.params.courseId || request.params.id;

    if (!courseId) {
      // No courseId in route - allow (will be handled by service)
      return true;
    }

    // Fetch the course to check ownership
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if user is the course instructor
    if (course.instructorId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to edit this course. Only the course instructor can make changes.',
      );
    }

    // Store ownership info in request for use in controllers/services
    request.isCourseOwner = true;

    return true;
  }
}
