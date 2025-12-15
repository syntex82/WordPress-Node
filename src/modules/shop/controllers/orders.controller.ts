/**
 * Orders Controller
 * Admin and user endpoints for order management
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from '../dto/order.dto';

// Admin Orders Controller
@Controller('api/shop/admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminOrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  getStats() {
    return this.ordersService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN)
  cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }
}

// Public Orders Controller (for checkout)
@Controller('api/shop/orders')
@UseGuards(OptionalJwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
    @Res({ passthrough: true }) _res: Response,
  ) {
    const userId = (req as any).user?.id;
    const sessionId = req.cookies?.cart_session;
    return this.ordersService.createFromCart(dto, userId, sessionId);
  }

  @Get('lookup/:orderNumber')
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}

// User Orders Controller (for logged-in users)
@Controller('api/shop/my-orders')
@UseGuards(JwtAuthGuard)
export class UserOrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findMyOrders(@Req() req: Request, @Query() query: OrderQueryDto) {
    const userId = (req as any).user.id;
    return this.ordersService.findByUser(userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
