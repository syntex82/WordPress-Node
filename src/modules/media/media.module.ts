/**
 * Media Module
 * Handles file uploads and media library management
 */

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PrismaModule } from '../../database/prisma.module';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { OptimizedImageController } from './optimized-image.controller';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        // Default 500MB for video uploads - can be overridden with MAX_FILE_SIZE env var
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000', 10),
      },
    }),
  ],
  providers: [MediaService],
  controllers: [MediaController, OptimizedImageController],
  exports: [MediaService],
})
export class MediaModule {}
