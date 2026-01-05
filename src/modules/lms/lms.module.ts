/**
 * LMS Module - Learning Management System
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';

// Services
import { CoursesService } from './services/courses.service';
import { LessonsService } from './services/lessons.service';
import { ModulesService } from './services/modules.service';
import { QuizzesService } from './services/quizzes.service';
import { EnrollmentsService } from './services/enrollments.service';
import { ProgressService } from './services/progress.service';
import { CertificatesService } from './services/certificates.service';
import { CertificateGeneratorService } from './services/certificate-generator.service';
import { CertificateTemplateService } from './services/certificate-template.service';
import { CoursePlaceholderService } from './services/course-placeholder.service';

// Controllers
import { CoursesController, PublicCoursesController } from './controllers/courses.controller';
import { LessonsController } from './controllers/lessons.controller';
import { ModulesController } from './controllers/modules.controller';
import { QuizzesController } from './controllers/quizzes.controller';
import { EnrollmentsController } from './controllers/enrollments.controller';
import { LearningController } from './controllers/learning.controller';
import { CertificatesController } from './controllers/certificates.controller';
import { CertificateTemplatesController } from './controllers/certificate-templates.controller';

// Guards
import { CourseOwnershipGuard } from './guards/course-ownership.guard';
import { FeatureGuard } from '../../common/guards/feature.guard';

@Module({
  imports: [PrismaModule, ConfigModule, EmailModule],
  controllers: [
    CoursesController,
    PublicCoursesController,
    LessonsController,
    ModulesController,
    QuizzesController,
    EnrollmentsController,
    LearningController,
    CertificatesController,
    CertificateTemplatesController,
  ],
  providers: [
    CoursesService,
    LessonsService,
    ModulesService,
    QuizzesService,
    EnrollmentsService,
    ProgressService,
    CertificatesService,
    CertificateGeneratorService,
    CertificateTemplateService,
    CoursePlaceholderService,
    CourseOwnershipGuard,
    FeatureGuard,
  ],
  exports: [
    CoursesService,
    LessonsService,
    ModulesService,
    QuizzesService,
    EnrollmentsService,
    ProgressService,
    CertificatesService,
    CertificateTemplateService,
    CoursePlaceholderService,
  ],
})
export class LmsModule {}
