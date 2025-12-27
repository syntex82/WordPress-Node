/**
 * Updates Module
 * Handles system auto-updates, version management, and rollback functionality
 */

import { Module } from '@nestjs/common';
import { UpdatesController } from './updates.controller';
import { UpdatesService } from './updates.service';
import { VersionService } from './version.service';
import { MigrationService } from './migration.service';
import { PrismaService } from '../../database/prisma.service';
import { BackupModule } from '../backup/backup.module';

@Module({
  imports: [BackupModule],
  controllers: [UpdatesController],
  providers: [UpdatesService, VersionService, MigrationService, PrismaService],
  exports: [UpdatesService, VersionService],
})
export class UpdatesModule {}
