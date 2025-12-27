/**
 * Marketplace Payments Service
 * Handles escrow, payouts, and financial transactions
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import Stripe from 'stripe';

@Injectable()
export class MarketplacePaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey);
    }
  }

  /**
   * Create escrow deposit (client pays into escrow)
   */
  async createEscrowDeposit(
    projectId: string,
    clientId: string,
    amount: number,
    paymentMethodId?: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { developer: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== clientId) throw new BadRequestException('Not authorized');

    let stripePaymentIntentId: string | undefined;

    // Create Stripe payment intent if configured
    if (this.stripe && paymentMethodId) {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        metadata: { projectId, type: 'escrow_deposit' },
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      });
      stripePaymentIntentId = paymentIntent.id;
    }

    // Create transaction record
    const transaction = await this.prisma.marketplaceTransaction.create({
      data: {
        projectId,
        type: 'ESCROW_DEPOSIT',
        amount,
        status: stripePaymentIntentId ? 'COMPLETED' : 'PENDING',
        stripePaymentIntentId,
        fromUserId: clientId,
        processedAt: stripePaymentIntentId ? new Date() : null,
      },
    });

    // Update project escrow amount
    await this.prisma.project.update({
      where: { id: projectId },
      data: { amountInEscrow: { increment: amount } },
    });

    // Notify developer
    await this.notificationsService.create({
      userId: project.developer.userId,
      type: 'MARKETPLACE',
      title: 'Escrow Deposit Received',
      message: `$${amount} has been deposited to escrow for "${project.title}"`,
      link: `/admin/marketplace/projects/${projectId}`,
    });

    return transaction;
  }

  /**
   * Release escrow to developer
   */
  async releaseEscrow(projectId: string, amount: number, _adminId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { developer: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (Number(project.amountInEscrow) < amount) {
      throw new BadRequestException('Insufficient escrow balance');
    }

    // Calculate platform fee
    const platformFee = amount * (project.platformFeePercent / 100);
    const developerAmount = amount - platformFee;

    // Create release transaction
    const transaction = await this.prisma.marketplaceTransaction.create({
      data: {
        projectId,
        type: 'ESCROW_RELEASE',
        amount: developerAmount,
        status: 'COMPLETED',
        toUserId: project.developer.userId,
        processedAt: new Date(),
        metadata: { platformFee, originalAmount: amount },
      },
    });

    // Create platform fee transaction
    await this.prisma.marketplaceTransaction.create({
      data: {
        projectId,
        type: 'PLATFORM_FEE',
        amount: platformFee,
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Update project
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        amountInEscrow: { decrement: amount },
        amountPaid: { increment: developerAmount },
      },
    });

    // Update developer earnings
    await this.prisma.developer.update({
      where: { id: project.developerId },
      data: { totalEarnings: { increment: developerAmount } },
    });

    // Notify developer
    await this.notificationsService.create({
      userId: project.developer.userId,
      type: 'MARKETPLACE',
      title: 'Payment Released',
      message: `$${developerAmount.toFixed(2)} has been released to your account`,
      link: `/admin/marketplace/projects/${projectId}`,
    });

    return transaction;
  }

  /**
   * Request payout (developer withdraws earnings)
   */
  async requestPayout(developerId: string, amount: number) {
    const developer = await this.prisma.developer.findUnique({ where: { id: developerId } });
    if (!developer) throw new NotFoundException('Developer not found');
    if (Number(developer.totalEarnings) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const payout = await this.prisma.developerPayout.create({
      data: { developerId, amount, status: 'PENDING' },
    });

    return payout;
  }

  /**
   * Process payout (Admin)
   */
  async processPayout(payoutId: string) {
    const payout = await this.prisma.developerPayout.findUnique({
      where: { id: payoutId },
      include: { developer: true },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'PENDING') throw new BadRequestException('Payout already processed');

    // Process via Stripe Connect if available
    let stripePayoutId: string | undefined;
    if (this.stripe && payout.developer.stripeConnectId) {
      try {
        const transfer = await this.stripe.transfers.create({
          amount: Math.round(Number(payout.amount) * 100),
          currency: 'usd',
          destination: payout.developer.stripeConnectId,
        });
        stripePayoutId = transfer.id;
      } catch (error) {
        await this.prisma.developerPayout.update({
          where: { id: payoutId },
          data: { status: 'FAILED', failureReason: error.message },
        });
        throw error;
      }
    }

    // Update payout status
    await this.prisma.developerPayout.update({
      where: { id: payoutId },
      data: { status: 'COMPLETED', stripePayoutId, processedAt: new Date() },
    });

    // Deduct from developer earnings
    await this.prisma.developer.update({
      where: { id: payout.developerId },
      data: { totalEarnings: { decrement: payout.amount } },
    });

    return payout;
  }

  /**
   * Create dispute
   */
  async createDispute(
    projectId: string,
    initiatorId: string,
    initiatorType: string,
    reason: string,
    description: string,
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const dispute = await this.prisma.projectDispute.create({
      data: { projectId, initiatorId, initiatorType, reason, description, status: 'OPEN' },
    });

    // Update project status
    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'ON_HOLD' },
    });

    return dispute;
  }

  /**
   * Resolve dispute (Admin)
   */
  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: string,
    notes: string,
    refundAmount?: number,
  ) {
    const dispute = await this.prisma.projectDispute.findUnique({
      where: { id: disputeId },
      include: { project: { include: { developer: true } } },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');

    // Process refund if applicable
    if (refundAmount && refundAmount > 0) {
      await this.prisma.marketplaceTransaction.create({
        data: {
          projectId: dispute.projectId,
          type: 'DISPUTE_RESOLUTION',
          amount: refundAmount,
          status: 'COMPLETED',
          toUserId:
            resolution === 'RESOLVED_CLIENT'
              ? dispute.project.clientId
              : dispute.project.developer.userId,
          processedAt: new Date(),
        },
      });
    }

    return this.prisma.projectDispute.update({
      where: { id: disputeId },
      data: {
        status: resolution as any,
        resolution: notes,
        resolvedById: adminId,
        resolvedAt: new Date(),
        refundAmount,
      },
    });
  }

  /**
   * Get transaction history for project
   */
  async getProjectTransactions(projectId: string) {
    return this.prisma.marketplaceTransaction.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get developer payouts
   */
  async getDeveloperPayouts(developerId: string) {
    return this.prisma.developerPayout.findMany({
      where: { developerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get financial statistics (Admin)
   */
  async getFinancialStatistics() {
    const [totalTransactions, totalEscrow, totalPaid, totalFees, pendingPayouts] =
      await Promise.all([
        this.prisma.marketplaceTransaction.count(),
        this.prisma.project.aggregate({ _sum: { amountInEscrow: true } }),
        this.prisma.project.aggregate({ _sum: { amountPaid: true } }),
        this.prisma.marketplaceTransaction.aggregate({
          where: { type: 'PLATFORM_FEE' },
          _sum: { amount: true },
        }),
        this.prisma.developerPayout.aggregate({
          where: { status: 'PENDING' },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

    return {
      totalTransactions,
      totalEscrow: totalEscrow._sum.amountInEscrow || 0,
      totalPaid: totalPaid._sum.amountPaid || 0,
      totalFees: totalFees._sum.amount || 0,
      pendingPayouts: {
        count: pendingPayouts._count,
        amount: pendingPayouts._sum.amount || 0,
      },
    };
  }
}
