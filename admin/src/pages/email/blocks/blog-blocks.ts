/**
 * Blog/Content Email Blocks
 * Featured articles, blog summaries, author bios, related posts, newsletter signup
 */

export const BLOG_BLOCK_DEFAULTS = {
  featuredArticle: {
    content: {
      category: 'Technology',
      title: 'The Future of AI in Web Development',
      excerpt: 'Discover how artificial intelligence is revolutionizing the way we build and design websites. From automated code generation to intelligent user experiences.',
      image: '',
      author: 'Jane Smith',
      authorAvatar: '',
      publishDate: 'January 8, 2026',
      readTime: '5 min read',
      buttonText: 'Read Article',
      buttonLink: '#',
      featured: true
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 0,
      borderRadius: 16,
      imageHeight: 240,
      showCategory: true,
      showAuthor: true,
      showReadTime: true,
      categoryColor: '#8B5CF6',
      layout: 'stacked' // stacked, horizontal
    }
  },

  blogSummary: {
    content: {
      category: 'Tutorial',
      title: 'Getting Started with Next.js',
      excerpt: 'A comprehensive guide to building modern React applications with Next.js framework.',
      image: '',
      publishDate: 'January 7, 2026',
      readTime: '8 min read',
      buttonText: 'Continue Reading →',
      buttonLink: '#'
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 24,
      borderRadius: 12,
      showImage: true,
      imagePosition: 'left', // left, right, top
      imageWidth: 120,
      borderBottom: true,
      borderColor: '#E5E7EB'
    }
  },

  authorBio: {
    content: {
      name: 'Sarah Williams',
      avatar: '',
      role: 'Senior Tech Writer',
      bio: 'Sarah has been writing about technology for over 10 years. She specializes in making complex topics accessible to everyone.',
      email: 'sarah@example.com',
      website: '',
      socialLinks: {
        twitter: '',
        linkedin: '',
        github: ''
      },
      buttonText: 'View All Articles',
      buttonLink: '#',
      articleCount: 45
    },
    styles: {
      backgroundColor: '#F9FAFB',
      padding: 32,
      borderRadius: 16,
      avatarSize: 80,
      layout: 'horizontal', // horizontal, vertical
      showSocial: true,
      showArticleCount: true,
      accentColor: '#4F46E5'
    }
  },

  relatedPosts: {
    content: {
      title: 'You Might Also Enjoy',
      posts: [
        { title: 'Building Responsive Layouts', category: 'CSS', image: '', link: '#', readTime: '4 min' },
        { title: 'JavaScript Best Practices', category: 'JavaScript', image: '', link: '#', readTime: '6 min' },
        { title: 'Introduction to TypeScript', category: 'TypeScript', image: '', link: '#', readTime: '5 min' }
      ]
    },
    styles: {
      backgroundColor: '#ffffff',
      padding: 32,
      columns: 3,
      showImages: true,
      showCategory: true,
      cardStyle: 'minimal', // minimal, card, bordered
      accentColor: '#4F46E5'
    }
  },

  newsletterSignup: {
    content: {
      headline: 'Stay Updated',
      subheadline: 'Get the latest articles and tips delivered straight to your inbox.',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
      privacyText: 'We respect your privacy. Unsubscribe at any time.',
      incentive: 'Free ebook with subscription!',
      showIncentive: true,
      frequency: 'Weekly digest'
    },
    styles: {
      backgroundColor: '#4F46E5',
      textColor: '#ffffff',
      padding: 48,
      borderRadius: 16,
      inputStyle: 'pill', // pill, square, underline
      buttonColor: '#ffffff',
      buttonTextColor: '#4F46E5',
      layout: 'stacked', // stacked, inline
      showFrequency: true
    }
  }
};

