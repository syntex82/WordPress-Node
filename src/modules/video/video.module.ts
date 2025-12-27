import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { PrismaModule } from '../../database/prisma.module';
import { FeatureGuard } from '../../common/guards/feature.guard';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [VideoController],
  providers: [VideoService, FeatureGuard],
  exports: [VideoService],
})
export class VideoModule {}
