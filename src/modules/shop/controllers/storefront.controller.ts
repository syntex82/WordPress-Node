/**
 * Storefront Controller
 * Public endpoints for the shop frontend
 */
import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CategoriesService } from '../services/categories.service';
import { ProductQueryDto } from '../dto/product.dto';

@Controller('api/shop/storefront')
export class StorefrontController {
  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
  ) {}

  // Get all active products
  @Get('products')
  getProducts(@Query() query: ProductQueryDto) {
    return this.productsService.getActiveProducts(query);
  }

  // Get product by slug
  @Get('products/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // Get all categories
  @Get('categories')
  getCategories() {
    return this.categoriesService.findAll();
  }

  // Get category tree
  @Get('categories/tree')
  getCategoryTree() {
    return this.categoriesService.findTree();
  }

  // Get category by slug with products
  @Get('categories/:slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  // Get featured products
  @Get('featured')
  async getFeaturedProducts() {
    const result = await this.productsService.getActiveProducts({ limit: 8 });
    return result.products;
  }

  // Get products on sale
  @Get('sale')
  async getSaleProducts() {
    // This would need a custom query - for now return active products
    const result = await this.productsService.getActiveProducts({ limit: 12 });
    return result.products.filter((p: any) => p.salePrice);
  }
}

