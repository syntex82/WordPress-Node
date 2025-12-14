/**
 * Checkout Controller
 * Handles checkout and payment endpoints
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  Headers,
  RawBodyRequest,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from '../services/stripe.service';
import { OrdersService } from '../services/orders.service';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateOrderDto, RefundOrderDto } from '../dto/order.dto';

@Controller('api/shop/checkout')
export class CheckoutController {
  constructor(
    private stripeService: StripeService,
    private ordersService: OrdersService,
  ) {}

  // Get Stripe publishable key
  @Get('config')
  getConfig() {
    return {
      publishableKey: this.stripeService.getPublishableKey(),
    };
  }

  // Create order and payment intent
  @Post('create-order')
  @UseGuards(OptionalJwtAuthGuard)
  async createOrderAndPayment(
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = (req as any).user?.id;
    const sessionId = req.cookies?.cart_session;

    console.log('Creating order for session:', sessionId, 'user:', userId);

    try {
      // Create order
      const order = await this.ordersService.createFromCart(dto, userId, sessionId);
      console.log('Order created:', order.id);

      // Create payment intent
      const paymentIntent = await this.stripeService.createPaymentIntent(order.id);
      console.log('Payment intent created:', paymentIntent.paymentIntentId);

      return {
        order,
        ...paymentIntent,
      };
    } catch (error: any) {
      console.error('Checkout error:', error.message, error.stack);
      throw error;
    }
  }

  // Create payment intent for existing order
  @Post('payment-intent/:orderId')
  @UseGuards(OptionalJwtAuthGuard)
  async createPaymentIntent(@Param('orderId') orderId: string) {
    return this.stripeService.createPaymentIntent(orderId);
  }

  // Stripe webhook handler
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body is required for webhook verification');
    }
    return this.stripeService.handleWebhook(req.rawBody, signature);
  }
}

// Admin refund controller
@Controller('api/shop/admin/refunds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RefundsController {
  constructor(private stripeService: StripeService) {}

  @Post(':orderId')
  @Roles(UserRole.ADMIN)
  async createRefund(@Param('orderId') orderId: string, @Body() dto: RefundOrderDto) {
    return this.stripeService.createRefund(orderId, dto.amount, dto.reason);
  }
}
