/**
 * Users Module
 * Manages user CRUD operations, profiles, and role-based permissions
 */

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';

@Module({
  providers: [UsersService, ProfilesService],
  controllers: [UsersController, ProfilesController],
  exports: [UsersService, ProfilesService],
})
export class UsersModule {}

