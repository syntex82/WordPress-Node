/**
 * LMS Module - Learning Management System
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ConfigModule } from '@nestjs/config';

// Services
import { CoursesService } from './services/courses.service';
import { LessonsService } from './services/lessons.service';
import { QuizzesService } from './services/quizzes.service';
import { EnrollmentsService } from './services/enrollments.service';
import { ProgressService } from './services/progress.service';
import { CertificatesService } from './services/certificates.service';
import { CertificateGeneratorService } from './services/certificate-generator.service';

// Controllers
import { CoursesController } from './controllers/courses.controller';
import { LessonsController } from './controllers/lessons.controller';
import { QuizzesController } from './controllers/quizzes.controller';
import { EnrollmentsController } from './controllers/enrollments.controller';
import { LearningController } from './controllers/learning.controller';
import { CertificatesController } from './controllers/certificates.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [
    CoursesController,
    LessonsController,
    QuizzesController,
    EnrollmentsController,
    LearningController,
    CertificatesController,
  ],
  providers: [
    CoursesService,
    LessonsService,
    QuizzesService,
    EnrollmentsService,
    ProgressService,
    CertificatesService,
    CertificateGeneratorService,
  ],
  exports: [
    CoursesService,
    LessonsService,
    QuizzesService,
    EnrollmentsService,
    ProgressService,
    CertificatesService,
  ],
})
export class LmsModule {}
