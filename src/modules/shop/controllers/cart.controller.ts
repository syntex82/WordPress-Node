/**
 * Cart Controller
 * Public endpoints for shopping cart
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { AddToCartDto, UpdateCartItemDto, ApplyCouponDto } from '../dto/cart.dto';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/shop/cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  private getCartIdentifiers(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    let sessionId = req.cookies?.cart_session;

    if (!userId && !sessionId) {
      sessionId = uuidv4();
      res.cookie('cart_session', sessionId, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax',
      });
    }

    return { userId, sessionId };
  }

  @Get()
  async getCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { userId, sessionId } = this.getCartIdentifiers(req, res);
    return this.cartService.getOrCreateCart(userId, sessionId);
  }

  @Post('add')
  async addToCart(
    @Body() dto: AddToCartDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { userId, sessionId } = this.getCartIdentifiers(req, res);
    return this.cartService.addToCart(dto, userId, sessionId);
  }

  @Put('item/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { userId, sessionId } = this.getCartIdentifiers(req, res);
    return this.cartService.updateCartItem(itemId, dto, userId, sessionId);
  }

  @Delete('item/:itemId')
  async removeItem(
    @Param('itemId') itemId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { userId, sessionId } = this.getCartIdentifiers(req, res);
    return this.cartService.removeFromCart(itemId, userId, sessionId);
  }

  @Delete('clear')
  async clearCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { userId, sessionId } = this.getCartIdentifiers(req, res);
    return this.cartService.clearCart(userId, sessionId);
  }
}

