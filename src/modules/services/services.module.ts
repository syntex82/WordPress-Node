/**
 * Professional Services Module
 * Handles consulting, development, training, and support services
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { BookingService } from './booking.service';
import { ServicesPaymentService } from './services-payment.service';
import { EmailModule } from '../email/email.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, ConfigModule, EmailModule, SettingsModule],
  controllers: [ServicesController],
  providers: [ServicesService, BookingService, ServicesPaymentService],
  exports: [ServicesService, BookingService, ServicesPaymentService],
})
export class ServicesModule {}

