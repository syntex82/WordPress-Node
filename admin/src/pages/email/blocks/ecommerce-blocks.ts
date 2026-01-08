/**
 * E-commerce Email Blocks
 * Product showcase, cart abandonment, order confirmation, discounts, sales
 */

export const ECOMMERCE_BLOCK_DEFAULTS = {
  productShowcase: {
    content: {
      productName: 'Amazing Product',
      productImage: '',
      price: '$99.99',
      originalPrice: '$149.99',
      description: 'Discover our best-selling product with premium quality and exceptional value.',
      buttonText: 'Shop Now',
      buttonLink: '#',
      badge: 'Best Seller',
      rating: 4.5,
      reviewCount: 128
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      borderRadius: 12,
      imagePosition: 'top', // top, left, right
      showBadge: true,
      showRating: true,
      showOriginalPrice: true,
      buttonColor: '#4F46E5',
      buttonTextColor: '#ffffff',
      accentColor: '#EF4444'
    }
  },

  productGrid: {
    content: {
      title: 'Featured Products',
      products: [
        { name: 'Product 1', image: '', price: '$49.99', link: '#' },
        { name: 'Product 2', image: '', price: '$59.99', link: '#' },
        { name: 'Product 3', image: '', price: '$39.99', link: '#' },
        { name: 'Product 4', image: '', price: '$79.99', link: '#' }
      ]
    },
    styles: {
      backgroundColor: '#f9fafb',
      padding: 32,
      columns: 2,
      gap: 16,
      productCardBg: '#ffffff',
      borderRadius: 8
    }
  },

  cartAbandonment: {
    content: {
      headline: 'You left something behind!',
      subheadline: "Your cart is waiting for you. Complete your order before these items sell out.",
      items: [
        { name: 'Product Name', image: '', price: '$99.99', quantity: 1 }
      ],
      buttonText: 'Complete Your Order',
      buttonLink: '#',
      urgencyText: 'Only 3 left in stock!',
      discountCode: '',
      discountText: ''
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      accentColor: '#EF4444',
      buttonColor: '#4F46E5',
      showUrgency: true,
      showDiscount: false
    }
  },

  orderConfirmation: {
    content: {
      headline: 'Order Confirmed! 🎉',
      orderNumber: '{{order.number}}',
      orderDate: '{{order.date}}',
      items: [
        { name: 'Product Name', quantity: 1, price: '$99.99' }
      ],
      subtotal: '{{order.subtotal}}',
      shipping: '{{order.shipping}}',
      tax: '{{order.tax}}',
      total: '{{order.total}}',
      shippingAddress: '{{order.shippingAddress}}',
      estimatedDelivery: '{{order.estimatedDelivery}}',
      trackingLink: '#'
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      accentColor: '#10B981',
      borderRadius: 12
    }
  },

  productRecommendations: {
    content: {
      title: 'You Might Also Like',
      subtitle: 'Based on your recent purchase',
      products: [
        { name: 'Recommended 1', image: '', price: '$49.99', link: '#' },
        { name: 'Recommended 2', image: '', price: '$59.99', link: '#' },
        { name: 'Recommended 3', image: '', price: '$39.99', link: '#' }
      ]
    },
    styles: {
      backgroundColor: '#f9fafb',
      padding: 32,
      columns: 3,
      buttonColor: '#4F46E5'
    }
  },

  discountCode: {
    content: {
      headline: 'Special Offer Just For You!',
      description: 'Use this exclusive code to save on your next purchase.',
      code: 'SAVE20',
      discount: '20% OFF',
      expiryText: 'Expires in 48 hours',
      buttonText: 'Shop Now',
      buttonLink: '#',
      terms: 'Valid on orders over $50. Cannot be combined with other offers.'
    },
    styles: {
      backgroundColor: '#4F46E5',
      textColor: '#ffffff',
      padding: 40,
      codeBackground: '#ffffff',
      codeColor: '#4F46E5',
      borderRadius: 12,
      showBorder: true,
      borderStyle: 'dashed'
    }
  },

  saleAnnouncement: {
    content: {
      preheadline: 'Limited Time Only',
      headline: 'SUMMER SALE',
      discount: 'UP TO 50% OFF',
      description: 'Shop our biggest sale of the season. Hundreds of items marked down.',
      buttonText: 'Shop the Sale',
      buttonLink: '#',
      countdownEnd: '',
      showCountdown: false
    },
    styles: {
      backgroundColor: '#EF4444',
      textColor: '#ffffff',
      padding: 48,
      backgroundImage: '',
      overlay: true,
      overlayOpacity: 0.7,
      textAlign: 'center'
    }
  }
};

