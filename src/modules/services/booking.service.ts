/**
 * Booking Service
 * Handles service booking and scheduling
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { ServicesService } from './services.service';
import { CreateBookingDto, UpdateBookingStatusDto, BookingStatus, PriceType } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
    private emailService: EmailService,
  ) {}

  /**
   * Create a new booking
   */
  async createBooking(userId: string, dto: CreateBookingDto) {
    const service = await this.servicesService.getServiceById(dto.serviceId);

    if (!service.isActive) {
      throw new BadRequestException('This service is not currently available');
    }

    // Calculate total amount
    let totalAmount: Decimal;
    
    if (service.priceType === PriceType.FIXED || service.priceType === PriceType.SUBSCRIPTION) {
      totalAmount = service.fixedPrice || new Decimal(0);
    } else if (service.priceType === PriceType.HOURLY) {
      if (!dto.hours) {
        throw new BadRequestException('Hours required for hourly services');
      }
      if (service.minHours && dto.hours < service.minHours) {
        throw new BadRequestException(`Minimum ${service.minHours} hours required`);
      }
      if (service.maxHours && dto.hours > service.maxHours) {
        throw new BadRequestException(`Maximum ${service.maxHours} hours allowed`);
      }
      totalAmount = (service.hourlyRate || new Decimal(0)).mul(dto.hours);
    } else {
      // Quote-based - set to 0, will be updated after quote
      totalAmount = new Decimal(0);
    }

    const booking = await this.prisma.serviceBooking.create({
      data: {
        serviceId: dto.serviceId,
        userId,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        hours: dto.hours,
        totalAmount,
        notes: dto.notes,
        requirements: dto.requirements,
        status: service.priceType === PriceType.QUOTE ? 'PENDING' : 'PENDING',
      },
      include: {
        service: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Send confirmation email
    try {
      await this.sendBookingConfirmation(booking);
    } catch (error) {
      this.logger.warn('Failed to send booking confirmation:', error.message);
    }

    this.logger.log(`Booking created: ${booking.id} for service ${service.name}`);
    return booking;
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(userId: string) {
    return this.prisma.serviceBooking.findMany({
      where: { userId },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const booking = await this.prisma.serviceBooking.findFirst({
      where,
      include: {
        service: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  /**
   * Update booking status (admin)
   */
  async updateBookingStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.getBookingById(id);

    const updated = await this.prisma.serviceBooking.update({
      where: { id },
      data: {
        status: dto.status as any,
        notes: dto.notes ? `${booking.notes || ''}\n\n[Status Update]: ${dto.notes}` : booking.notes,
        completedDate: dto.status === BookingStatus.COMPLETED ? new Date() : booking.completedDate,
      },
      include: {
        service: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Send status update email
    try {
      await this.sendStatusUpdateEmail(updated);
    } catch (error) {
      this.logger.warn('Failed to send status update email:', error.message);
    }

    return updated;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, userId: string) {
    const booking = await this.getBookingById(id, userId);

    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Cannot cancel booking in current status');
    }

    return this.prisma.serviceBooking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Get all bookings (admin)
   */
  async getAllBookings(params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      this.prisma.serviceBooking.findMany({
        where,
        include: {
          service: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.serviceBooking.count({ where }),
    ]);

    return {
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get booking statistics (admin)
   */
  async getBookingStats() {
    const [total, pending, inProgress, completed, revenue] = await Promise.all([
      this.prisma.serviceBooking.count(),
      this.prisma.serviceBooking.count({ where: { status: 'PENDING' } }),
      this.prisma.serviceBooking.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.serviceBooking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.serviceBooking.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      totalRevenue: revenue._sum.totalAmount || 0,
    };
  }

  private async sendBookingConfirmation(booking: any) {
    const scheduledDate = booking.scheduledDate?.toDateString() || 'To be scheduled';
    const html = `
      <h1>Booking Confirmation</h1>
      <p>Hello ${booking.user.name},</p>
      <p>Your booking for <strong>${booking.service.name}</strong> has been received.</p>
      <p><strong>Booking ID:</strong> ${booking.id}</p>
      <p><strong>Scheduled Date:</strong> ${scheduledDate}</p>
      <p><strong>Total Amount:</strong> $${booking.totalAmount.toString()}</p>
      <p>We will contact you shortly to confirm the details.</p>
    `;

    await this.emailService.send({
      to: booking.user.email,
      toName: booking.user.name,
      subject: `Booking Confirmation: ${booking.service.name}`,
      html,
    });
  }

  private async sendStatusUpdateEmail(booking: any) {
    const html = `
      <h1>Booking Status Update</h1>
      <p>Hello ${booking.user.name},</p>
      <p>Your booking for <strong>${booking.service.name}</strong> has been updated.</p>
      <p><strong>Booking ID:</strong> ${booking.id}</p>
      <p><strong>New Status:</strong> ${booking.status}</p>
    `;

    await this.emailService.send({
      to: booking.user.email,
      toName: booking.user.name,
      subject: `Booking Update: ${booking.service.name}`,
      html,
    });
  }
}

