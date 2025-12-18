/**
 * Content Module
 * Manages posts, pages, and custom content types
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { PostsService } from './services/posts.service';
import { PagesService } from './services/pages.service';
import { ContentTypesService } from './services/content-types.service';
import { PostsController } from './controllers/posts.controller';
import { PagesController } from './controllers/pages.controller';
import { ContentTypesController } from './controllers/content-types.controller';
import { PageCustomizationService } from '../pages/page-customization.service';
import { PostCustomizationService } from '../posts/post-customization.service';
import { PageCustomizationController } from './controllers/page-customization.controller';
import { PostCustomizationController } from './controllers/post-customization.controller';

@Module({
  imports: [PrismaModule],
  providers: [
    PostsService,
    PagesService,
    ContentTypesService,
    PageCustomizationService,
    PostCustomizationService,
  ],
  controllers: [
    PostsController,
    PagesController,
    ContentTypesController,
    PageCustomizationController,
    PostCustomizationController,
  ],
  exports: [
    PostsService,
    PagesService,
    ContentTypesService,
    PageCustomizationService,
    PostCustomizationService,
  ],
})
export class ContentModule {}
