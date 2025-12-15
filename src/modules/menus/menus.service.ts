/**
 * Menus Service
 * Handles all menu-related business logic
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMenuDto, CreateMenuItemDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuItemType } from '@prisma/client';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute the correct URL for a menu item based on its type
   * This ensures all consumers get the correct URL automatically
   */
  private computeMenuItemUrl(item: any): string {
    // Backend URL for pages/posts (rendered by NestJS)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    // Frontend URL for shop (React app)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    switch (item.type) {
      case 'PAGE':
        // Pages are served by the backend at /:slug
        if (item.page?.slug) {
          return `${backendUrl}/${item.page.slug}`;
        }
        // If page not linked but has a URL, prepend backend URL if it's a relative path
        if (item.url && item.url.startsWith('/')) {
          return `${backendUrl}${item.url}`;
        }
        return item.url || '#';
      case 'POST':
        // Posts are served by the backend at /post/:slug
        if (item.post?.slug) {
          return `${backendUrl}/post/${item.post.slug}`;
        }
        // If post not linked but has a URL, prepend backend URL if it's a relative path
        if (item.url && item.url.startsWith('/')) {
          return `${backendUrl}${item.url}`;
        }
        return item.url || '#';
      case 'HOME':
        // Home is the backend root
        return backendUrl;
      case 'SHOP':
        // Shop is in the frontend admin
        return `${frontendUrl}/admin/shop`;
      case 'PRODUCT':
        // Products are served at frontend /admin/shop/product/:slug
        if (item.product?.slug) return `${frontendUrl}/admin/shop/product/${item.product.slug}`;
        break;
      case 'CATEGORY':
        // Categories filter shop at frontend /admin/shop?category=:slug
        if (item.category?.slug) return `${frontendUrl}/admin/shop?category=${item.category.slug}`;
        break;
      case 'CUSTOM':
      default:
        // Use the stored URL for custom links
        return item.url || '#';
    }
    // Fallback to stored URL or #
    return item.url || '#';
  }

  /**
   * Process menu items to add computed URLs
   */
  private processMenuItems(items: any[]): any[] {
    return items.map((item) => ({
      ...item,
      url: this.computeMenuItemUrl(item),
      children: item.children ? this.processMenuItems(item.children) : [],
    }));
  }

  /**
   * Process menu to add computed URLs to all items
   */
  private processMenu(menu: any): any {
    if (!menu) return menu;
    return {
      ...menu,
      items: this.processMenuItems(menu.items || []),
    };
  }

  /**
   * Create a new menu
   */
  async create(createMenuDto: CreateMenuDto) {
    // Check if menu with same name or location exists
    const existing = await this.prisma.menu.findFirst({
      where: {
        OR: [{ name: createMenuDto.name }, { location: createMenuDto.location }],
      },
    });

    if (existing) {
      throw new ConflictException('A menu with this name or location already exists');
    }

    const { items, ...menuData } = createMenuDto;

    const menu = await this.prisma.menu.create({
      data: menuData,
    });

    // Create menu items if provided
    if (items && items.length > 0) {
      await this.createMenuItems(menu.id, items);
    }

    return this.findOne(menu.id);
  }

  /**
   * Create menu items
   */
  private async createMenuItems(menuId: string, items: CreateMenuItemDto[], parentId?: string) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await this.prisma.menuItem.create({
        data: {
          menuId,
          parentId: parentId || item.parentId,
          label: item.label,
          url: item.url,
          target: item.target || '_self',
          type: (item.type as MenuItemType) || MenuItemType.CUSTOM,
          pageId: item.pageId,
          postId: item.postId,
          order: item.order ?? i,
          cssClass: item.cssClass,
          icon: item.icon,
        },
      });
    }
  }

  /**
   * Get all menus
   */
  async findAll() {
    const menus = await this.prisma.menu.findMany({
      include: {
        items: {
          where: { parentId: null },
          orderBy: { order: 'asc' },
          include: {
            page: { select: { id: true, title: true, slug: true } },
            post: { select: { id: true, title: true, slug: true } },
            children: {
              orderBy: { order: 'asc' },
              include: {
                page: { select: { id: true, title: true, slug: true } },
                post: { select: { id: true, title: true, slug: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Process all menus to add computed URLs
    return menus.map((menu) => this.processMenu(menu));
  }

  /**
   * Get menu by ID
   */
  async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { order: 'asc' },
          include: {
            page: { select: { id: true, title: true, slug: true } },
            post: { select: { id: true, title: true, slug: true } },
            children: {
              orderBy: { order: 'asc' },
              include: {
                page: { select: { id: true, title: true, slug: true } },
                post: { select: { id: true, title: true, slug: true } },
              },
            },
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    // Process menu to add computed URLs
    return this.processMenu(menu);
  }

  /**
   * Get menu by location (for frontend rendering)
   */
  async findByLocation(location: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { location },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { order: 'asc' },
          include: {
            page: { select: { id: true, title: true, slug: true } },
            post: { select: { id: true, title: true, slug: true } },
            children: {
              orderBy: { order: 'asc' },
              include: {
                page: { select: { id: true, title: true, slug: true } },
                post: { select: { id: true, title: true, slug: true } },
              },
            },
          },
        },
      },
    });

    // Process menu to add computed URLs
    return this.processMenu(menu);
  }

  /**
   * Update menu
   */
  async update(id: string, updateMenuDto: UpdateMenuDto) {
    await this.findOne(id);

    const { items, ...menuData } = updateMenuDto;

    // Update menu data
    if (Object.keys(menuData).length > 0) {
      await this.prisma.menu.update({
        where: { id },
        data: menuData,
      });
    }

    // If items provided, replace all items
    if (items !== undefined) {
      // Delete existing items
      await this.prisma.menuItem.deleteMany({
        where: { menuId: id },
      });

      // Create new items
      if (items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          await this.prisma.menuItem.create({
            data: {
              menuId: id,
              parentId: item.parentId,
              label: item.label || '',
              url: item.url,
              target: item.target || '_self',
              type: (item.type as MenuItemType) || MenuItemType.CUSTOM,
              pageId: item.pageId,
              postId: item.postId,
              order: item.order ?? i,
              cssClass: item.cssClass,
              icon: item.icon,
            },
          });
        }
      }
    }

    return this.findOne(id);
  }

  /**
   * Delete menu
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.menu.delete({
      where: { id },
    });
  }

  /**
   * Get all pages, posts, products, and categories for menu item selection
   */
  async getAvailableLinks() {
    const [pages, posts, products, productCategories] = await Promise.all([
      this.prisma.page.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, slug: true },
        orderBy: { title: 'asc' },
      }),
      this.prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, slug: true },
        orderBy: { title: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.productCategory.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { pages, posts, products, productCategories };
  }
}
