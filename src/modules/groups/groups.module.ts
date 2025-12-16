import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsGateway } from './groups.gateway';
import { PrismaModule } from '../../database/prisma.module';
import { GroupMemberGuard } from './guards/group-member.guard';
import { GroupOwnerGuard } from './guards/group-owner.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
        signOptions: {
          expiresIn: 604800, // 7 days in seconds
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsGateway, GroupMemberGuard, GroupOwnerGuard],
  exports: [GroupsService],
})
export class GroupsModule {}
