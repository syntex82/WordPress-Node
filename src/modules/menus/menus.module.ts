/**
 * Menus Module
 * Provides menu management functionality
 */

import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [MenusController],
  providers: [MenusService, PrismaService],
  exports: [MenusService],
})
export class MenusModule {}

