/**
 * Shop Module
 * E-commerce functionality with Stripe payments
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { EmailModule } from '../email/email.module';

// Services
import { ProductsService } from './services/products.service';
import { CategoriesService } from './services/categories.service';
import { CartService } from './services/cart.service';
import { OrdersService } from './services/orders.service';
import { StripeService } from './services/stripe.service';
import { ShippingService } from './services/shipping.service';

// Controllers
import { ProductsController } from './controllers/products.controller';
import { CategoriesController } from './controllers/categories.controller';
import { CartController } from './controllers/cart.controller';
import {
  AdminOrdersController,
  OrdersController,
  UserOrdersController,
} from './controllers/orders.controller';
import { CheckoutController, RefundsController } from './controllers/checkout.controller';
import { StorefrontController } from './controllers/storefront.controller';
import {
  ShippingController,
  StorefrontShippingController,
} from './controllers/shipping.controller';
import { FeatureGuard } from '../../common/guards/feature.guard';

@Module({
  imports: [PrismaModule, ConfigModule, EmailModule],
  controllers: [
    // Admin controllers
    ProductsController,
    CategoriesController,
    AdminOrdersController,
    RefundsController,
    ShippingController,
    // Public controllers
    CartController,
    OrdersController,
    UserOrdersController,
    CheckoutController,
    StorefrontController,
    StorefrontShippingController,
  ],
  providers: [
    ProductsService,
    CategoriesService,
    CartService,
    OrdersService,
    StripeService,
    ShippingService,
    FeatureGuard,
  ],
  exports: [
    ProductsService,
    CategoriesService,
    CartService,
    OrdersService,
    StripeService,
    ShippingService,
  ],
})
export class ShopModule {}
