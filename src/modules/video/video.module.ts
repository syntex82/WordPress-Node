import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { PrismaModule } from '../../database/prisma.module';
import { FeatureGuard } from '../../common/guards/feature.guard';

@Module({
  imports: [PrismaModule],
  controllers: [VideoController],
  providers: [VideoService, FeatureGuard],
  exports: [VideoService],
})
export class VideoModule {}
