/**
 * Content Module
 * Manages posts, pages, and custom content types
 */

import { Module } from '@nestjs/common';
import { PostsService } from './services/posts.service';
import { PagesService } from './services/pages.service';
import { ContentTypesService } from './services/content-types.service';
import { PostsController } from './controllers/posts.controller';
import { PagesController } from './controllers/pages.controller';
import { ContentTypesController } from './controllers/content-types.controller';

@Module({
  providers: [PostsService, PagesService, ContentTypesService],
  controllers: [PostsController, PagesController, ContentTypesController],
  exports: [PostsService, PagesService, ContentTypesService],
})
export class ContentModule {}
