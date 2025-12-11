/**
 * Analytics Plugin
 * Tracks page views and provides analytics data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  /**
   * Called when plugin is activated
   */
  onActivate: async () => {
    console.log('Analytics Plugin activated');
  },

  /**
   * Called when plugin is deactivated
   */
  onDeactivate: async () => {
    console.log('Analytics Plugin deactivated');
  },

  /**
   * Track a page view
   */
  trackPageView: async (path, userId, ipAddress, userAgent, referer) => {
    try {
      await prisma.pageView.create({
        data: {
          path,
          userId,
          ipAddress,
          userAgent,
          referer,
        },
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  },

  /**
   * Get analytics stats
   */
  getStats: async (startDate, endDate) => {
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalViews, uniqueVisitors, topPages] = await Promise.all([
      // Total page views
      prisma.pageView.count({ where }),

      // Unique visitors (by IP)
      prisma.pageView.groupBy({
        by: ['ipAddress'],
        where,
        _count: true,
      }),

      // Top pages
      prisma.pageView.groupBy({
        by: ['path'],
        where,
        _count: {
          path: true,
        },
        orderBy: {
          _count: {
            path: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
      topPages: topPages.map(p => ({
        path: p.path,
        views: p._count.path,
      })),
    };
  },

  /**
   * Register custom API routes
   */
  registerRoutes: (app) => {
    // This would be called by the main app to register plugin routes
    // For now, this is a placeholder showing the concept
    console.log('Analytics routes would be registered here');
  },
};

