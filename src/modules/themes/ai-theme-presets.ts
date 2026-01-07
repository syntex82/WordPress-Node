/**
 * AI Theme Generation Presets
 * Predefined, production-ready theme configurations for various industries
 */

import { ContentBlockType, IndustryType, ThemeFeatures } from './dto/generate-ai-theme.dto';

export type PresetCategory =
  | 'business'
  | 'creative'
  | 'ecommerce'
  | 'education'
  | 'lifestyle'
  | 'technology';

export interface AiThemePreset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  thumbnail: string;
  tags: string[];
  industry: IndustryType;
  style: 'modern' | 'minimal' | 'bold' | 'professional' | 'creative' | 'elegant' | 'playful';
  colorScheme: 'light' | 'dark' | 'auto';
  colors: PresetColors;
  typography: PresetTypography;
  layout: PresetLayout;
  spacing: PresetSpacing;
  borders: PresetBorders;
  features: ThemeFeatures;
  pages: PresetPage[];
  headerStyle: 'default' | 'sticky' | 'minimal' | 'centered' | 'mega';
  footerStyle: 'default' | 'minimal' | 'centered' | 'multicolumn';
}

export interface PresetColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  heading: string;
  link: string;
  linkHover: string;
  border: string;
  success?: string;
  warning?: string;
  error?: string;
}

export interface PresetTypography {
  headingFont: string;
  bodyFont: string;
  baseFontSize: number;
  lineHeight: number;
  headingWeight: number;
  headingLineHeight?: number;
}

export interface PresetLayout {
  sidebarPosition: 'left' | 'right' | 'none';
  contentWidth: number;
  headerStyle: 'default' | 'sticky' | 'minimal' | 'centered' | 'mega';
  footerStyle: 'default' | 'minimal' | 'centered' | 'multicolumn';
  containerMaxWidth?: number;
}

export interface PresetSpacing {
  sectionPadding: number;
  elementSpacing: number;
  containerPadding: number;
  blockGap?: number;
}

export interface PresetBorders {
  radius: number;
  width: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface PresetPage {
  name: string;
  slug: string;
  isHomePage: boolean;
  seo?: { title: string; description: string; keywords?: string };
  blocks: PresetBlock[];
}

export interface PresetBlock {
  type: ContentBlockType | string;
  props: Record<string, any>;
}

// ============================================
// UNSPLASH IMAGE LIBRARY
// ============================================

export const PRESET_IMAGES = {
  cyberpunk: {
    hero: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=1080&fit=crop',
    about: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=800&fit=crop',
    blog: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop',
    ],
  },
  lms: {
    hero: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&h=1080&fit=crop',
    courses: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
    ],
    instructors: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    ],
  },
  ecommerce: {
    hero: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=1080&fit=crop',
    products: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop',
    ],
  },
  corporate: {
    hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop',
    team: [
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    ],
    office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
  },
  portfolio: {
    hero: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1920&h=1080&fit=crop',
    projects: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=600&fit=crop',
    ],
  },
  saas: {
    hero: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&h=1080&fit=crop',
    features: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop',
  },
  restaurant: {
    hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop',
    food: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop',
    ],
  },
  healthcare: {
    hero: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&h=1080&fit=crop',
    doctors: [
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
    ],
  },
};

// ============================================
// PRESET 1: CYBERPUNK TECH BLOG
// ============================================

export const CYBERPUNK_TECH_BLOG: AiThemePreset = {
  id: 'cyberpunk-tech-blog',
  name: 'Cyberpunk Tech Blog',
  description: 'Dark futuristic theme with neon accents for technology blogs',
  category: 'technology',
  thumbnail: PRESET_IMAGES.cyberpunk.hero,
  tags: ['dark', 'futuristic', 'neon', 'tech', 'blog'],
  industry: 'technology',
  style: 'bold',
  colorScheme: 'dark',
  colors: {
    primary: '#00F0FF',
    secondary: '#FF00E5',
    accent: '#FFE600',
    background: '#0A0A0F',
    surface: '#12121A',
    text: '#E0E0E6',
    textMuted: '#8888A0',
    heading: '#FFFFFF',
    link: '#00F0FF',
    linkHover: '#FF00E5',
    border: '#2A2A3A',
    success: '#00FF88',
    warning: '#FFE600',
    error: '#FF4444',
  },
  typography: {
    headingFont: 'JetBrains Mono',
    bodyFont: 'Inter',
    baseFontSize: 16,
    lineHeight: 1.7,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1200,
    headerStyle: 'sticky',
    footerStyle: 'minimal',
    containerMaxWidth: 1400,
  },
  spacing: { sectionPadding: 80, elementSpacing: 24, containerPadding: 32, blockGap: 64 },
  borders: { radius: 12, width: 1, style: 'solid' },
  features: {
    darkMode: true,
    animations: true,
    responsiveImages: true,
    lazyLoading: true,
    stickyHeader: true,
    backToTop: true,
    socialSharing: true,
    newsletter: true,
  },
  headerStyle: 'sticky',
  footerStyle: 'minimal',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Cyberpunk Tech Blog | Future of Technology',
        description: 'Explore cutting-edge technology, AI, and digital innovation.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Exploring the Digital Frontier',
            subtitle:
              'Deep dives into AI, blockchain, cybersecurity, and emerging tech. Join 50,000+ enthusiasts.',
            backgroundImage: PRESET_IMAGES.cyberpunk.hero,
            ctaText: 'Start Reading',
            ctaUrl: '/blog',
            secondaryCtaText: 'Subscribe',
            secondaryCtaUrl: '/newsletter',
            alignment: 'center',
            overlayOpacity: 0.7,
            overlayColor: '#0A0A0F',
          },
        },
        {
          type: 'stats',
          props: {
            title: 'Join the Community',
            stats: [
              { value: '500+', label: 'Articles', icon: '📝' },
              { value: '50K+', label: 'Readers', icon: '👥' },
              { value: '15+', label: 'Writers', icon: '✍️' },
              { value: '99%', label: 'Satisfaction', icon: '⭐' },
            ],
            columns: 4,
          },
        },
        {
          type: 'blogPosts',
          props: {
            title: 'Latest Articles',
            subtitle: 'Fresh perspectives on emerging technologies',
            columns: 3,
            showExcerpt: true,
            showAuthor: true,
            posts: [
              {
                title: 'The Rise of Quantum Computing: What It Means for Cybersecurity',
                excerpt:
                  'Quantum computers threaten current encryption. Here is how the industry is preparing.',
                image: PRESET_IMAGES.cyberpunk.blog[0],
                date: 'January 15, 2024',
                author: 'Dr. Alex Chen',
                url: '/blog/quantum-computing',
                category: 'Cybersecurity',
                readTime: '8 min',
              },
              {
                title: 'Neural Interfaces: The Next Frontier',
                excerpt: 'Brain-computer interfaces are moving from sci-fi to reality.',
                image: PRESET_IMAGES.cyberpunk.blog[1],
                date: 'January 12, 2024',
                author: 'Maya Rodriguez',
                url: '/blog/neural-interfaces',
                category: 'AI',
                readTime: '10 min',
              },
              {
                title: 'Decentralized AI: Building Trustless ML Systems',
                excerpt: 'How blockchain and AI are converging to create transparent AI systems.',
                image: PRESET_IMAGES.cyberpunk.blog[2],
                date: 'January 10, 2024',
                author: 'James Wilson',
                url: '/blog/decentralized-ai',
                category: 'Blockchain',
                readTime: '7 min',
              },
            ],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Topics We Cover',
            subtitle: 'Deep technical analysis across the tech spectrum',
            columns: 4,
            features: [
              {
                icon: '🤖',
                title: 'Artificial Intelligence',
                description: 'ML, neural networks, and the path to AGI',
                link: '/topics/ai',
              },
              {
                icon: '🔐',
                title: 'Cybersecurity',
                description: 'Threat analysis and defense strategies',
                link: '/topics/security',
              },
              {
                icon: '⛓️',
                title: 'Blockchain & Web3',
                description: 'DeFi, smart contracts, decentralization',
                link: '/topics/blockchain',
              },
              {
                icon: '🚀',
                title: 'Emerging Tech',
                description: 'Quantum computing, AR/VR, innovations',
                link: '/topics/emerging',
              },
            ],
          },
        },
        {
          type: 'newsletter',
          props: {
            title: 'Get the Weekly Digest',
            subtitle: 'Join 25,000+ subscribers receiving curated tech insights',
            placeholder: 'Enter your email',
            buttonText: 'Subscribe',
            successMessage: 'Welcome! Check your inbox.',
            privacyText: 'No spam. Unsubscribe anytime.',
            backgroundColor: '#12121A',
          },
        },
      ],
    },
    {
      name: 'Blog',
      slug: 'blog',
      isHomePage: false,
      seo: {
        title: 'Blog | Cyberpunk Tech Blog',
        description: 'All articles on AI, cybersecurity, blockchain, and emerging technologies.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'The Archive',
            subtitle: 'All articles, insights, and deep dives',
            backgroundImage: PRESET_IMAGES.cyberpunk.about,
            alignment: 'center',
            overlayOpacity: 0.8,
          },
        },
        {
          type: 'blogPosts',
          props: {
            title: 'All Articles',
            columns: 3,
            showExcerpt: true,
            showAuthor: true,
            postsPerPage: 12,
            showCategories: true,
            filterCategories: ['All', 'AI', 'Cybersecurity', 'Blockchain', 'Emerging Tech'],
            posts: [],
          },
        },
      ],
    },
    {
      name: 'About',
      slug: 'about',
      isHomePage: false,
      seo: {
        title: 'About | Cyberpunk Tech Blog',
        description: 'Our mission to demystify complex technology.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'About Us',
            subtitle: 'Demystifying complex technology for the curious mind',
            backgroundImage: PRESET_IMAGES.cyberpunk.about,
            alignment: 'center',
            overlayOpacity: 0.8,
          },
        },
        {
          type: 'about',
          props: {
            title: 'Our Mission',
            subtitle: 'Making complex tech accessible',
            content:
              'We bridge the gap between cutting-edge research and practical understanding. Our team brings decades of experience from Google, Tesla, and MIT. Every article goes through rigorous fact-checking.',
            image: PRESET_IMAGES.cyberpunk.about,
            stats: [
              { value: '2019', label: 'Founded' },
              { value: '15+', label: 'Expert Writers' },
              { value: '500+', label: 'Articles' },
            ],
          },
        },
        {
          type: 'teamGrid',
          props: {
            title: 'Meet the Writers',
            subtitle: 'Industry experts sharing knowledge',
            members: [
              {
                name: 'Dr. Alex Chen',
                role: 'AI Research Lead',
                image: PRESET_IMAGES.corporate.team[0],
                bio: 'Former Google AI researcher',
                social: { twitter: '#', linkedin: '#' },
              },
              {
                name: 'Maya Rodriguez',
                role: 'Cybersecurity Editor',
                image: PRESET_IMAGES.corporate.team[1],
                bio: 'Ex-NSA security analyst',
                social: { twitter: '#' },
              },
            ],
          },
        },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      seo: {
        title: 'Contact | Cyberpunk Tech Blog',
        description: 'Get in touch for collaborations or inquiries.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Get in Touch',
            subtitle: 'We love hearing from readers',
            alignment: 'center',
            overlayOpacity: 0.8,
            backgroundImage: PRESET_IMAGES.cyberpunk.hero,
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Send a Message',
            subtitle: 'Story tips, collaborations, or just say hi',
            fields: [
              {
                type: 'text',
                name: 'name',
                label: 'Name',
                placeholder: 'John Doe',
                required: true,
              },
              {
                type: 'email',
                name: 'email',
                label: 'Email',
                placeholder: 'john@example.com',
                required: true,
              },
              {
                type: 'select',
                name: 'subject',
                label: 'Subject',
                options: ['General', 'Guest Post', 'Collaboration', 'Advertising'],
                required: true,
              },
              {
                type: 'textarea',
                name: 'message',
                label: 'Message',
                placeholder: 'Your message...',
                required: true,
                rows: 5,
              },
            ],
            submitText: 'Send',
            successMessage: 'Thanks! We will reply within 48 hours.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            title: 'Connect',
            email: 'hello@cyberpunktechblog.com',
            social: [
              { platform: 'twitter', url: '#', label: '@cyberpunktech' },
              { platform: 'github', url: '#', label: 'GitHub' },
            ],
          },
        },
      ],
    },
  ],
};

// ============================================
// PRESET 2: COMPLETE LMS PLATFORM
// ============================================

export const LMS_PLATFORM: AiThemePreset = {
  id: 'complete-lms-platform',
  name: 'Complete LMS Platform',
  description:
    'Learning management system with course grids, student dashboards, and progress tracking',
  category: 'education',
  thumbnail: PRESET_IMAGES.lms.hero,
  tags: ['education', 'courses', 'learning', 'lms', 'students'],
  industry: 'education',
  style: 'modern',
  colorScheme: 'light',
  colors: {
    primary: '#4F46E5',
    secondary: '#7C3AED',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#334155',
    textMuted: '#64748B',
    heading: '#0F172A',
    link: '#4F46E5',
    linkHover: '#4338CA',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    headingFont: 'Poppins',
    bodyFont: 'Inter',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 600,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1280,
    headerStyle: 'sticky',
    footerStyle: 'multicolumn',
    containerMaxWidth: 1440,
  },
  spacing: { sectionPadding: 80, elementSpacing: 24, containerPadding: 32, blockGap: 64 },
  borders: { radius: 16, width: 1, style: 'solid' },
  features: {
    darkMode: false,
    animations: true,
    responsiveImages: true,
    lazyLoading: true,
    stickyHeader: true,
    backToTop: true,
    newsletter: true,
  },
  headerStyle: 'sticky',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'LearnHub | Master New Skills Online',
        description:
          'Learn from world-class instructors with hands-on courses in technology, business, and creative skills.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Master New Skills, Transform Your Career',
            subtitle:
              'Join 500,000+ learners accessing 1,000+ courses from industry experts. Start learning today.',
            backgroundImage: PRESET_IMAGES.lms.hero,
            ctaText: 'Explore Courses',
            ctaUrl: '/courses',
            secondaryCtaText: 'Start Free Trial',
            secondaryCtaUrl: '/signup',
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        {
          type: 'stats',
          props: {
            title: 'Trusted by Learners Worldwide',
            stats: [
              { value: '500K+', label: 'Active Learners', icon: '👨‍🎓' },
              { value: '1,000+', label: 'Courses', icon: '📚' },
              { value: '200+', label: 'Expert Instructors', icon: '👨‍🏫' },
              { value: '4.8/5', label: 'Average Rating', icon: '⭐' },
            ],
            columns: 4,
          },
        },
        {
          type: 'courseGrid',
          props: {
            title: 'Featured Courses',
            subtitle: 'Start with our most popular courses',
            columns: 3,
            courses: [
              {
                title: 'Complete Web Development Bootcamp',
                instructor: 'Dr. Marcus Chen',
                image: PRESET_IMAGES.lms.courses[0],
                price: '$94.99',
                rating: 4.9,
                duration: '52 hours',
                students: '125,000+',
                url: '/courses/web-development',
                description: 'Learn HTML, CSS, JavaScript, React, Node.js and more.',
              },
              {
                title: 'Data Science & Machine Learning A-Z',
                instructor: 'Prof. Sarah Mitchell',
                image: PRESET_IMAGES.lms.courses[1],
                price: '$84.99',
                rating: 4.8,
                duration: '44 hours',
                students: '98,000+',
                url: '/courses/data-science',
                description: 'Master Python, statistics, ML, and deep learning.',
              },
              {
                title: 'Digital Marketing Masterclass',
                instructor: 'James Rodriguez',
                image: PRESET_IMAGES.lms.courses[2],
                price: '$79.99',
                rating: 4.7,
                duration: '38 hours',
                students: '76,000+',
                url: '/courses/digital-marketing',
                description: 'SEO, social media, email marketing, and paid ads.',
              },
            ],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Why Learn With Us',
            subtitle: 'Everything you need to succeed',
            columns: 4,
            features: [
              {
                icon: '🎯',
                title: 'Learn by Doing',
                description: 'Hands-on projects and real-world applications',
                link: '/features/projects',
              },
              {
                icon: '🎓',
                title: 'Get Certified',
                description: 'Earn certificates recognized by employers',
                link: '/features/certificates',
              },
              {
                icon: '👥',
                title: 'Community Support',
                description: 'Connect with peers and mentors',
                link: '/features/community',
              },
              {
                icon: '📱',
                title: 'Learn Anywhere',
                description: 'Mobile apps for iOS and Android',
                link: '/features/mobile',
              },
            ],
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Student Success Stories',
            subtitle: 'Hear from learners who transformed their careers',
            layout: 'grid',
            testimonials: [
              {
                quote:
                  'This platform helped me transition from marketing to data science. Within 6 months, I landed my dream job at a top tech company.',
                author: 'Emily Chen',
                role: 'Data Scientist',
                company: 'Google',
                avatar: PRESET_IMAGES.corporate.team[1],
                rating: 5,
              },
              {
                quote:
                  'The web development bootcamp was incredible. The projects gave me a portfolio that impressed employers.',
                author: 'Michael Torres',
                role: 'Frontend Developer',
                company: 'Stripe',
                avatar: PRESET_IMAGES.corporate.team[0],
                rating: 5,
              },
            ],
          },
        },
        {
          type: 'pricing',
          props: {
            title: 'Choose Your Learning Plan',
            subtitle: 'Invest in yourself with flexible options',
            plans: [
              {
                name: 'Free',
                price: '$0',
                period: '/month',
                description: 'Get started',
                features: [
                  'Access to 50+ free courses',
                  'Basic progress tracking',
                  'Community forums',
                ],
                ctaText: 'Start Free',
                ctaUrl: '/signup',
                featured: false,
              },
              {
                name: 'Pro',
                price: '$29',
                period: '/month',
                description: 'Most popular',
                features: [
                  'Unlimited course access',
                  'Certificates included',
                  'Project reviews',
                  'Priority support',
                  'Mobile offline access',
                ],
                ctaText: 'Start Pro Trial',
                ctaUrl: '/signup?plan=pro',
                featured: true,
              },
              {
                name: 'Teams',
                price: '$99',
                period: '/month',
                description: 'For organizations',
                features: [
                  'Everything in Pro',
                  'Team analytics',
                  'Custom learning paths',
                  'SSO integration',
                  'Dedicated success manager',
                ],
                ctaText: 'Contact Sales',
                ctaUrl: '/contact',
                featured: false,
              },
            ],
            billingToggle: true,
            annualDiscount: 20,
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Ready to Start Learning?',
            subtitle: 'Join 500,000+ learners and start your journey today',
            ctaText: 'Get Started Free',
            ctaUrl: '/signup',
            secondaryCtaText: 'Browse Courses',
            secondaryCtaUrl: '/courses',
            style: 'gradient',
            backgroundColor: '#4F46E5',
          },
        },
      ],
    },
    {
      name: 'Courses',
      slug: 'courses',
      isHomePage: false,
      seo: {
        title: 'Browse Courses | LearnHub',
        description: 'Explore 1,000+ courses in technology, business, design, and more.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Explore Our Course Library',
            subtitle: 'Find the perfect course to achieve your goals',
            backgroundImage: PRESET_IMAGES.lms.hero,
            alignment: 'center',
            overlayOpacity: 0.6,
          },
        },
        {
          type: 'courseGrid',
          props: {
            title: 'All Courses',
            subtitle: 'Browse by category or search for topics',
            columns: 4,
            showFilters: true,
            filterCategories: [
              'All',
              'Development',
              'Data Science',
              'Business',
              'Design',
              'Marketing',
            ],
            courses: [],
          },
        },
      ],
    },
    {
      name: 'Instructors',
      slug: 'instructors',
      isHomePage: false,
      seo: {
        title: 'Our Instructors | LearnHub',
        description: 'Learn from 200+ expert instructors with real-world experience.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Learn From the Best',
            subtitle: 'Our instructors bring real-world expertise to every lesson',
            backgroundImage: PRESET_IMAGES.lms.hero,
            alignment: 'center',
            overlayOpacity: 0.6,
          },
        },
        {
          type: 'teamGrid',
          props: {
            title: 'Featured Instructors',
            subtitle: 'Industry experts passionate about teaching',
            members: [
              {
                name: 'Dr. Marcus Chen',
                role: 'Web Development',
                image: PRESET_IMAGES.lms.instructors[0],
                bio: '15+ years at Google, teaching 125,000+ students',
                social: { twitter: '#', linkedin: '#' },
              },
              {
                name: 'Prof. Sarah Mitchell',
                role: 'Data Science',
                image: PRESET_IMAGES.lms.instructors[1],
                bio: 'PhD Stanford, Former ML Lead at Tesla',
                social: { linkedin: '#' },
              },
            ],
          },
        },
      ],
    },
    {
      name: 'Pricing',
      slug: 'pricing',
      isHomePage: false,
      seo: {
        title: 'Pricing | LearnHub',
        description: 'Flexible pricing plans for individuals and teams.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Simple, Transparent Pricing',
            subtitle: 'Choose the plan that fits your learning goals',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'pricing',
          props: {
            title: 'Choose Your Plan',
            plans: [
              {
                name: 'Free',
                price: '$0',
                period: '/month',
                features: ['50+ free courses', 'Basic tracking', 'Community access'],
                ctaText: 'Start Free',
                ctaUrl: '/signup',
                featured: false,
              },
              {
                name: 'Pro',
                price: '$29',
                period: '/month',
                features: [
                  'Unlimited courses',
                  'Certificates',
                  'Project reviews',
                  'Priority support',
                  'Offline access',
                ],
                ctaText: 'Start Trial',
                ctaUrl: '/signup?plan=pro',
                featured: true,
              },
              {
                name: 'Teams',
                price: '$99',
                period: '/month',
                features: [
                  'Everything in Pro',
                  'Team analytics',
                  'Custom paths',
                  'SSO',
                  'Success manager',
                ],
                ctaText: 'Contact Sales',
                ctaUrl: '/contact',
                featured: false,
              },
            ],
            billingToggle: true,
            annualDiscount: 20,
          },
        },
        {
          type: 'accordion',
          props: {
            title: 'Frequently Asked Questions',
            items: [
              {
                title: 'Can I switch plans anytime?',
                content: 'Yes! Upgrade or downgrade anytime. Changes take effect immediately.',
              },
              {
                title: 'What happens after my trial ends?',
                content:
                  'You will be charged for the selected plan unless you cancel before the trial ends.',
              },
              {
                title: 'Do you offer student discounts?',
                content: 'Yes! Students with a valid .edu email get 50% off Pro plans.',
              },
            ],
            allowMultiple: true,
          },
        },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      seo: { title: 'Contact | LearnHub', description: 'Get in touch with our support team.' },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'We are Here to Help',
            subtitle: 'Have questions? Our team is ready to assist',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Send Us a Message',
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              {
                type: 'select',
                name: 'topic',
                label: 'Topic',
                options: ['General', 'Billing', 'Technical', 'Enterprise'],
                required: true,
              },
              { type: 'textarea', name: 'message', label: 'Message', required: true, rows: 5 },
            ],
            submitText: 'Send Message',
            successMessage: 'Thanks! We typically respond within 24 hours.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            title: 'Other Ways to Reach Us',
            email: 'support@learnhub.com',
            phone: '+1 (800) 123-4567',
            hours: 'Monday - Friday: 9AM - 6PM EST',
          },
        },
      ],
    },
  ],
};

// ============================================
// PRESET 3: E-COMMERCE STORE
// ============================================

export const ECOMMERCE_STORE: AiThemePreset = {
  id: 'ecommerce-store',
  name: 'E-commerce Store',
  description: 'Full shopping experience with product grids, cart, and checkout pages',
  category: 'ecommerce',
  thumbnail: PRESET_IMAGES.ecommerce.hero,
  tags: ['shop', 'store', 'products', 'cart', 'retail'],
  industry: 'ecommerce',
  style: 'modern',
  colorScheme: 'light',
  colors: {
    primary: '#0F172A',
    secondary: '#334155',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#334155',
    textMuted: '#64748B',
    heading: '#0F172A',
    link: '#0F172A',
    linkHover: '#1E293B',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    headingFont: 'DM Sans',
    bodyFont: 'Inter',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1400,
    headerStyle: 'mega',
    footerStyle: 'multicolumn',
    containerMaxWidth: 1600,
  },
  spacing: { sectionPadding: 64, elementSpacing: 24, containerPadding: 32, blockGap: 48 },
  borders: { radius: 8, width: 1, style: 'solid' },
  features: {
    darkMode: false,
    animations: true,
    responsiveImages: true,
    lazyLoading: true,
    stickyHeader: true,
    backToTop: true,
    newsletter: true,
    searchBar: true,
  },
  headerStyle: 'mega',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'ModernShop | Premium Products for Modern Living',
        description: 'Shop curated premium products with free shipping on orders over $50.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Curated Products for Modern Living',
            subtitle:
              'Discover premium quality products with free shipping on orders over $50. New arrivals weekly.',
            backgroundImage: PRESET_IMAGES.ecommerce.hero,
            ctaText: 'Shop Now',
            ctaUrl: '/shop',
            secondaryCtaText: 'View Sale',
            secondaryCtaUrl: '/sale',
            alignment: 'left',
            overlayOpacity: 0.4,
          },
        },
        {
          type: 'productGrid',
          props: {
            title: 'Best Sellers',
            subtitle: 'Our most popular products this month',
            columns: 4,
            products: [
              {
                name: 'Premium Wireless Headphones',
                price: '$299.99',
                originalPrice: '$399.99',
                image: PRESET_IMAGES.ecommerce.products[0],
                description: 'Crystal-clear audio with noise cancellation',
                rating: 4.9,
                url: '/products/headphones',
                badge: 'Sale',
              },
              {
                name: 'Smart Fitness Watch Pro',
                price: '$249.99',
                image: PRESET_IMAGES.ecommerce.products[1],
                description: 'Track health with precision',
                rating: 4.8,
                url: '/products/watch',
                badge: 'New',
              },
              {
                name: 'Designer Sunglasses',
                price: '$179.99',
                image: PRESET_IMAGES.ecommerce.products[2],
                description: 'UV protection with style',
                rating: 4.7,
                url: '/products/sunglasses',
              },
              {
                name: 'Leather Travel Bag',
                price: '$349.99',
                image: PRESET_IMAGES.ecommerce.products[3],
                description: 'Handcrafted premium leather',
                rating: 4.9,
                url: '/products/bag',
              },
            ],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Why Shop With Us',
            columns: 4,
            features: [
              { icon: '🚚', title: 'Free Shipping', description: 'On orders over $50' },
              { icon: '↩️', title: 'Easy Returns', description: '30-day hassle-free returns' },
              { icon: '🔒', title: 'Secure Payment', description: 'SSL encrypted checkout' },
              { icon: '💬', title: '24/7 Support', description: 'Always here to help' },
            ],
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'What Our Customers Say',
            layout: 'grid',
            testimonials: [
              {
                quote:
                  'The quality exceeded my expectations. Fast shipping and beautiful packaging. Will definitely shop again!',
                author: 'Sarah M.',
                role: 'Verified Buyer',
                avatar: PRESET_IMAGES.corporate.team[1],
                rating: 5,
              },
              {
                quote:
                  'Best customer service I have experienced. They went above and beyond to help me find the perfect gift.',
                author: 'James T.',
                role: 'Verified Buyer',
                avatar: PRESET_IMAGES.corporate.team[0],
                rating: 5,
              },
            ],
          },
        },
        {
          type: 'newsletter',
          props: {
            title: 'Join Our Newsletter',
            subtitle:
              'Get 10% off your first order plus exclusive access to new arrivals and sales',
            placeholder: 'Enter your email',
            buttonText: 'Subscribe & Save',
            successMessage: 'Welcome! Check your inbox for your 10% discount code.',
            privacyText: 'By subscribing, you agree to our Privacy Policy.',
            backgroundColor: '#F8FAFC',
          },
        },
      ],
    },
    {
      name: 'Shop',
      slug: 'shop',
      isHomePage: false,
      seo: {
        title: 'Shop All Products | ModernShop',
        description: 'Browse our full collection of premium products.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Shop All Products',
            subtitle: 'Browse our curated collection',
            backgroundImage: PRESET_IMAGES.ecommerce.hero,
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        {
          type: 'productGrid',
          props: {
            title: 'All Products',
            columns: 4,
            showFilters: true,
            filterCategories: ['All', 'Electronics', 'Fashion', 'Home', 'Accessories'],
            sortOptions: ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'],
            products: [],
          },
        },
      ],
    },
    {
      name: 'About',
      slug: 'about',
      isHomePage: false,
      seo: {
        title: 'About Us | ModernShop',
        description: 'Our story of curating premium products for modern living.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Our Story',
            subtitle: 'Curating premium products since 2018',
            backgroundImage: PRESET_IMAGES.corporate.office,
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        {
          type: 'about',
          props: {
            title: 'Built on Quality',
            content:
              'ModernShop was founded with a simple mission: make premium products accessible to everyone. We partner with artisans and manufacturers who share our commitment to quality, sustainability, and fair practices.',
            image: PRESET_IMAGES.corporate.office,
            stats: [
              { value: '50K+', label: 'Happy Customers' },
              { value: '500+', label: 'Products' },
              { value: '4.9', label: 'Avg Rating' },
            ],
          },
        },
        {
          type: 'stats',
          props: {
            stats: [
              { value: '2018', label: 'Founded', icon: '📅' },
              { value: '50K+', label: 'Customers', icon: '👥' },
              { value: '15', label: 'Countries', icon: '🌍' },
              { value: '4.9/5', label: 'Rating', icon: '⭐' },
            ],
            columns: 4,
          },
        },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      seo: {
        title: 'Contact Us | ModernShop',
        description: 'Get in touch with our customer support team.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Contact Us',
            subtitle: 'We are here to help',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Send a Message',
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              { type: 'text', name: 'orderNumber', label: 'Order Number (optional)' },
              {
                type: 'select',
                name: 'topic',
                label: 'Topic',
                options: ['Order Status', 'Returns', 'Product Question', 'Other'],
                required: true,
              },
              { type: 'textarea', name: 'message', label: 'Message', required: true, rows: 5 },
            ],
            submitText: 'Send Message',
            successMessage: 'Thanks! We will respond within 24 hours.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            title: 'Customer Support',
            email: 'support@modernshop.com',
            phone: '+1 (800) 555-0123',
            hours: '9AM - 9PM EST, 7 days a week',
          },
        },
      ],
    },
  ],
};

// ============================================
// PRESET 4: CORPORATE BUSINESS
// ============================================

export const CORPORATE_BUSINESS: AiThemePreset = {
  id: 'corporate-business',
  name: 'Corporate Business',
  description: 'Professional business theme with team sections, services, and contact forms',
  category: 'business',
  thumbnail: PRESET_IMAGES.corporate.hero,
  tags: ['business', 'corporate', 'professional', 'b2b', 'enterprise'],
  industry: 'agency',
  style: 'professional',
  colorScheme: 'light',
  colors: {
    primary: '#1E40AF',
    secondary: '#1E3A8A',
    accent: '#3B82F6',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#334155',
    textMuted: '#64748B',
    heading: '#0F172A',
    link: '#1E40AF',
    linkHover: '#1E3A8A',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 600,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1200,
    headerStyle: 'sticky',
    footerStyle: 'multicolumn',
    containerMaxWidth: 1400,
  },
  spacing: { sectionPadding: 80, elementSpacing: 24, containerPadding: 40, blockGap: 64 },
  borders: { radius: 8, width: 1, style: 'solid' },
  features: {
    darkMode: false,
    animations: true,
    responsiveImages: true,
    lazyLoading: true,
    stickyHeader: true,
    backToTop: true,
  },
  headerStyle: 'sticky',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Pinnacle Consulting | Strategic Business Solutions',
        description:
          'Transform your business with data-driven strategies and expert consulting from Pinnacle.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Strategic Solutions for Business Growth',
            subtitle:
              'Partner with industry experts to drive innovation, optimize operations, and accelerate your success.',
            backgroundImage: PRESET_IMAGES.corporate.hero,
            ctaText: 'Schedule Consultation',
            ctaUrl: '/contact',
            secondaryCtaText: 'Our Services',
            secondaryCtaUrl: '/services',
            alignment: 'left',
            overlayOpacity: 0.6,
          },
        },
        {
          type: 'stats',
          props: {
            title: 'Proven Results',
            stats: [
              { value: '$2B+', label: 'Revenue Generated', icon: '💰' },
              { value: '500+', label: 'Clients Served', icon: '🏢' },
              { value: '15+', label: 'Years Experience', icon: '📅' },
              { value: '98%', label: 'Client Retention', icon: '🎯' },
            ],
            columns: 4,
          },
        },
        {
          type: 'features',
          props: {
            title: 'Our Services',
            subtitle: 'Comprehensive solutions for every business challenge',
            columns: 3,
            features: [
              {
                icon: '📊',
                title: 'Strategy Consulting',
                description:
                  'Data-driven strategies that align with your goals and market position',
                link: '/services/strategy',
              },
              {
                icon: '⚙️',
                title: 'Operations Excellence',
                description:
                  'Streamline processes and maximize efficiency across your organization',
                link: '/services/operations',
              },
              {
                icon: '💡',
                title: 'Digital Transformation',
                description: 'Modernize your technology stack and embrace digital innovation',
                link: '/services/digital',
              },
            ],
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Client Success Stories',
            subtitle: 'Hear from leaders who transformed their businesses',
            layout: 'grid',
            testimonials: [
              {
                quote:
                  'Pinnacle helped us increase revenue by 40% in just one year. Their strategic insights were invaluable.',
                author: 'Jennifer Walsh',
                role: 'CEO',
                company: 'TechForward Inc.',
                avatar: PRESET_IMAGES.corporate.team[1],
                rating: 5,
              },
              {
                quote:
                  'The digital transformation roadmap they created has positioned us as industry leaders.',
                author: 'Robert Chen',
                role: 'CTO',
                company: 'GlobalScale',
                avatar: PRESET_IMAGES.corporate.team[0],
                rating: 5,
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Ready to Transform Your Business?',
            subtitle: 'Schedule a free consultation with our experts',
            ctaText: 'Get Started',
            ctaUrl: '/contact',
            style: 'gradient',
            backgroundColor: '#1E40AF',
          },
        },
      ],
    },
    {
      name: 'Services',
      slug: 'services',
      isHomePage: false,
      seo: {
        title: 'Our Services | Pinnacle Consulting',
        description: 'Strategy, operations, and digital transformation services.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Our Services',
            subtitle: 'Tailored solutions for your unique challenges',
            backgroundImage: PRESET_IMAGES.corporate.hero,
            alignment: 'center',
            overlayOpacity: 0.6,
          },
        },
        {
          type: 'features',
          props: {
            title: 'What We Offer',
            columns: 2,
            features: [
              {
                icon: '📊',
                title: 'Strategy Consulting',
                description:
                  'Market analysis, competitive positioning, growth strategies, and M&A advisory',
              },
              {
                icon: '⚙️',
                title: 'Operations Excellence',
                description:
                  'Process optimization, supply chain management, and performance improvement',
              },
              {
                icon: '💡',
                title: 'Digital Transformation',
                description: 'Technology roadmaps, system integration, and data analytics',
              },
              {
                icon: '👥',
                title: 'Organizational Development',
                description: 'Leadership coaching, culture transformation, and change management',
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Let us Discuss Your Needs',
            ctaText: 'Contact Us',
            ctaUrl: '/contact',
            style: 'centered',
            backgroundColor: '#1E40AF',
          },
        },
      ],
    },
    {
      name: 'About',
      slug: 'about',
      isHomePage: false,
      seo: {
        title: 'About Us | Pinnacle Consulting',
        description: 'Learn about our team of industry experts and our mission.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'About Pinnacle',
            subtitle: '15+ years of driving business success',
            backgroundImage: PRESET_IMAGES.corporate.office,
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        {
          type: 'about',
          props: {
            title: 'Our Story',
            content:
              'Founded in 2008, Pinnacle Consulting has grown from a boutique advisory firm to a global consultancy serving Fortune 500 companies. Our success is built on one principle: our clients success is our success.',
            image: PRESET_IMAGES.corporate.office,
            stats: [
              { value: '2008', label: 'Founded' },
              { value: '150+', label: 'Experts' },
              { value: '30', label: 'Countries' },
            ],
          },
        },
        {
          type: 'teamGrid',
          props: {
            title: 'Leadership Team',
            subtitle: 'Industry veterans dedicated to your success',
            members: [
              {
                name: 'Alexandra Rivers',
                role: 'CEO & Founder',
                image: PRESET_IMAGES.corporate.team[1],
                bio: 'Former McKinsey Partner with 20+ years in strategic consulting',
                social: { linkedin: '#' },
              },
              {
                name: 'Marcus Chen',
                role: 'Managing Partner',
                image: PRESET_IMAGES.corporate.team[0],
                bio: 'Led digital transformations for Fortune 100 companies',
                social: { linkedin: '#' },
              },
              {
                name: 'Sarah Williams',
                role: 'Head of Operations',
                image: PRESET_IMAGES.corporate.team[3],
                bio: 'Operations expert with Six Sigma Black Belt certification',
                social: { linkedin: '#' },
              },
            ],
          },
        },
        {
          type: 'timeline',
          props: {
            title: 'Our Journey',
            events: [
              {
                date: '2008',
                title: 'Founded',
                description: 'Started with 3 partners and a vision',
              },
              {
                date: '2012',
                title: 'First Fortune 500 Client',
                description: 'Established enterprise credibility',
              },
              {
                date: '2018',
                title: 'Global Expansion',
                description: 'Opened offices in Europe and Asia',
              },
              { date: '2024', title: 'Industry Leaders', description: '500+ clients worldwide' },
            ],
          },
        },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      seo: {
        title: 'Contact Us | Pinnacle Consulting',
        description: 'Schedule a consultation with our experts.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Let us Talk',
            subtitle: 'Schedule your free consultation today',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Request a Consultation',
            subtitle: 'Tell us about your business challenges',
            fields: [
              { type: 'text', name: 'name', label: 'Full Name', required: true },
              { type: 'email', name: 'email', label: 'Work Email', required: true },
              { type: 'text', name: 'company', label: 'Company', required: true },
              { type: 'text', name: 'title', label: 'Job Title', required: true },
              {
                type: 'select',
                name: 'interest',
                label: 'Area of Interest',
                options: [
                  'Strategy',
                  'Operations',
                  'Digital Transformation',
                  'Organizational Development',
                ],
                required: true,
              },
              {
                type: 'textarea',
                name: 'message',
                label: 'Tell Us About Your Challenges',
                required: true,
                rows: 5,
              },
            ],
            submitText: 'Request Consultation',
            successMessage: 'Thank you! A consultant will contact you within 24 hours.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            title: 'Our Offices',
            email: 'info@pinnacle-consulting.com',
            phone: '+1 (212) 555-0100',
            address: '350 Fifth Avenue, Suite 4500, New York, NY 10118',
          },
        },
      ],
    },
  ],
};

// ============================================
// PRESET 5: CREATIVE PORTFOLIO
// ============================================

export const CREATIVE_PORTFOLIO: AiThemePreset = {
  id: 'creative-portfolio',
  name: 'Creative Portfolio',
  description: 'Showcase creative work with stunning galleries and project displays',
  category: 'creative',
  thumbnail: PRESET_IMAGES.portfolio.hero,
  tags: ['portfolio', 'creative', 'designer', 'photographer', 'artist'],
  industry: 'portfolio',
  style: 'creative',
  colorScheme: 'light',
  colors: {
    primary: '#18181B',
    secondary: '#27272A',
    accent: '#F97316',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#3F3F46',
    textMuted: '#71717A',
    heading: '#18181B',
    link: '#18181B',
    linkHover: '#F97316',
    border: '#E4E4E7',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    baseFontSize: 17,
    lineHeight: 1.7,
    headingWeight: 500,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1400,
    headerStyle: 'minimal',
    footerStyle: 'minimal',
    containerMaxWidth: 1600,
  },
  spacing: { sectionPadding: 100, elementSpacing: 32, containerPadding: 48, blockGap: 80 },
  borders: { radius: 0, width: 1, style: 'solid' },
  features: {
    darkMode: true,
    animations: true,
    responsiveImages: true,
    lazyLoading: true,
    stickyHeader: false,
    backToTop: true,
  },
  headerStyle: 'minimal',
  footerStyle: 'minimal',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Elena Vasquez | Visual Designer & Art Director',
        description:
          'Award-winning visual designer creating memorable brand experiences for global clients.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Visual Designer & Art Director',
            subtitle:
              'Creating memorable brand experiences through thoughtful design. Based in New York, working globally.',
            backgroundImage: PRESET_IMAGES.portfolio.hero,
            ctaText: 'View Work',
            ctaUrl: '/work',
            secondaryCtaText: 'Get in Touch',
            secondaryCtaUrl: '/contact',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'projectGrid',
          props: {
            title: 'Selected Work',
            subtitle: 'A curated selection of recent projects',
            columns: 2,
            projects: [
              {
                title: 'Lumina Brand Identity',
                category: 'Branding',
                image: PRESET_IMAGES.portfolio.projects[0],
                url: '/work/lumina',
                description: 'Complete brand identity for a sustainable lighting company',
              },
              {
                title: 'Wanderlust Magazine',
                category: 'Editorial',
                image: PRESET_IMAGES.portfolio.projects[1],
                url: '/work/wanderlust',
                description: 'Art direction for travel and lifestyle publication',
              },
              {
                title: 'Horizon App Design',
                category: 'UI/UX',
                image: PRESET_IMAGES.portfolio.projects[2],
                url: '/work/horizon',
                description: 'Mobile app design for meditation and wellness',
              },
              {
                title: 'Artisan Coffee Co.',
                category: 'Packaging',
                image: PRESET_IMAGES.portfolio.projects[3],
                url: '/work/artisan',
                description: 'Packaging design for specialty coffee brand',
              },
            ],
          },
        },
        {
          type: 'about',
          props: {
            title: 'About',
            content:
              'With over 10 years of experience, I help brands tell their stories through thoughtful, purposeful design. My work spans brand identity, editorial design, packaging, and digital experiences. I believe great design is invisible – it simply feels right.',
            image: PRESET_IMAGES.corporate.team[1],
            stats: [
              { value: '10+', label: 'Years Experience' },
              { value: '100+', label: 'Projects Completed' },
              { value: '25+', label: 'Awards Won' },
            ],
          },
        },
        {
          type: 'clientLogos',
          props: {
            title: 'Clients & Collaborators',
            logos: [
              { name: 'Apple', url: '#' },
              { name: 'Nike', url: '#' },
              { name: 'Spotify', url: '#' },
              { name: 'Airbnb', url: '#' },
              { name: 'Google', url: '#' },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Let us Create Something Beautiful',
            subtitle: 'Available for select projects starting Q2 2024',
            ctaText: 'Start a Project',
            ctaUrl: '/contact',
            style: 'minimal',
          },
        },
      ],
    },
    {
      name: 'Work',
      slug: 'work',
      isHomePage: false,
      seo: {
        title: 'Work | Elena Vasquez',
        description: 'Portfolio of branding, editorial, and digital design projects.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Work',
            subtitle:
              'A collection of projects spanning brand identity, editorial, and digital design',
            alignment: 'center',
            overlayOpacity: 0.2,
          },
        },
        {
          type: 'projectGrid',
          props: {
            title: 'All Projects',
            columns: 3,
            showFilters: true,
            filterCategories: ['All', 'Branding', 'Editorial', 'UI/UX', 'Packaging'],
            projects: [],
          },
        },
      ],
    },
    {
      name: 'About',
      slug: 'about',
      isHomePage: false,
      seo: {
        title: 'About | Elena Vasquez',
        description: 'Learn about my design philosophy and background.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'About',
            subtitle: 'Designer, art director, and visual storyteller',
            alignment: 'center',
            overlayOpacity: 0.2,
          },
        },
        {
          type: 'about',
          props: {
            title: 'Hello, I am Elena',
            content:
              'I am a visual designer and art director based in New York City. For over a decade, I have been helping brands find their voice through thoughtful, purposeful design.\n\nMy approach combines strategic thinking with creative execution. I believe the best design solutions come from deep understanding – of the brand, the audience, and the problem we are solving.\n\nWhen I am not designing, you will find me exploring galleries, traveling to new places, or experimenting with film photography.',
            image: PRESET_IMAGES.corporate.team[1],
          },
        },
        {
          type: 'timeline',
          props: {
            title: 'Experience',
            events: [
              {
                date: '2023',
                title: 'Independent Studio',
                description: 'Launched my own design practice',
              },
              {
                date: '2018-2023',
                title: 'Pentagram',
                description: 'Senior Designer working on global brands',
              },
              {
                date: '2014-2018',
                title: 'IDEO',
                description: 'Designer focused on brand and digital',
              },
            ],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Services',
            columns: 3,
            features: [
              {
                icon: '✨',
                title: 'Brand Identity',
                description: 'Logo, visual systems, brand guidelines',
              },
              {
                icon: '📱',
                title: 'Digital Design',
                description: 'Websites, apps, digital experiences',
              },
              {
                icon: '📦',
                title: 'Packaging',
                description: 'Product packaging and retail design',
              },
            ],
          },
        },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      seo: {
        title: 'Contact | Elena Vasquez',
        description: 'Get in touch to discuss your project.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Let us Talk',
            subtitle: 'I am always interested in new projects and collaborations',
            alignment: 'center',
            overlayOpacity: 0.2,
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Start a Project',
            subtitle: 'Tell me about your vision',
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              {
                type: 'select',
                name: 'projectType',
                label: 'Project Type',
                options: [
                  'Brand Identity',
                  'Digital Design',
                  'Packaging',
                  'Art Direction',
                  'Other',
                ],
                required: true,
              },
              { type: 'text', name: 'budget', label: 'Budget Range' },
              {
                type: 'textarea',
                name: 'message',
                label: 'Tell me about your project',
                required: true,
                rows: 6,
              },
            ],
            submitText: 'Send Message',
            successMessage: 'Thank you! I will be in touch within 48 hours.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            title: 'Other Ways to Connect',
            email: 'hello@elenavasquez.com',
            social: [
              { platform: 'instagram', url: '#', label: '@elenavasquez' },
              { platform: 'dribbble', url: '#', label: 'Dribbble' },
              { platform: 'linkedin', url: '#', label: 'LinkedIn' },
            ],
          },
        },
      ],
    },
  ],
};

// ============================================
// PRESET 6: SAAS PRODUCT
// ============================================

export const SAAS_PRODUCT: AiThemePreset = {
  id: 'saas-product',
  name: 'SaaS Product',
  description: 'Modern SaaS landing page with features, pricing, and integrations',
  category: 'technology',
  thumbnail: PRESET_IMAGES.saas.hero,
  tags: ['saas', 'startup', 'product', 'software', 'tech'],
  industry: 'technology',
  style: 'modern',
  colorScheme: 'light',
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#475569',
    textMuted: '#64748B',
    heading: '#0F172A',
    link: '#6366F1',
    linkHover: '#4F46E5',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1200,
    headerStyle: 'sticky',
    footerStyle: 'multicolumn',
    containerMaxWidth: 1400,
  },
  spacing: { sectionPadding: 80, elementSpacing: 24, containerPadding: 32, blockGap: 64 },
  borders: { radius: 12, width: 1, style: 'solid' },
  features: {
    darkMode: true,
    animations: true,
    responsiveImages: true,
    lazyLoading: true,
    stickyHeader: true,
    backToTop: true,
  },
  headerStyle: 'sticky',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'FlowSync | Team Collaboration Made Simple',
        description:
          'Streamline your team workflow with FlowSync. Real-time collaboration, smart automation, and powerful integrations.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Team Collaboration Made Simple',
            subtitle:
              'Streamline your workflow with real-time collaboration, smart automation, and powerful integrations. Join 10,000+ teams already using FlowSync.',
            backgroundImage: PRESET_IMAGES.saas.hero,
            ctaText: 'Start Free Trial',
            ctaUrl: '/signup',
            secondaryCtaText: 'Watch Demo',
            secondaryCtaUrl: '/demo',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'clientLogos',
          props: {
            title: 'Trusted by innovative teams',
            logos: [
              { name: 'Stripe' },
              { name: 'Notion' },
              { name: 'Figma' },
              { name: 'Linear' },
              { name: 'Vercel' },
            ],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Everything You Need to Work Better',
            subtitle: 'Powerful features designed for modern teams',
            columns: 3,
            features: [
              {
                icon: '⚡',
                title: 'Real-time Collaboration',
                description:
                  'Work together seamlessly with live cursors, comments, and instant updates',
                link: '/features/collaboration',
              },
              {
                icon: '🤖',
                title: 'Smart Automation',
                description: 'Automate repetitive tasks and focus on what matters most',
                link: '/features/automation',
              },
              {
                icon: '🔗',
                title: '100+ Integrations',
                description: 'Connect with your favorite tools including Slack, GitHub, and Jira',
                link: '/features/integrations',
              },
              {
                icon: '📊',
                title: 'Advanced Analytics',
                description: 'Get insights into team productivity and project progress',
                link: '/features/analytics',
              },
              {
                icon: '🔒',
                title: 'Enterprise Security',
                description: 'SOC 2 compliant with SSO, 2FA, and audit logs',
                link: '/features/security',
              },
              {
                icon: '📱',
                title: 'Mobile Apps',
                description: 'Stay connected on iOS and Android with full functionality',
                link: '/features/mobile',
              },
            ],
          },
        },
        {
          type: 'stats',
          props: {
            title: 'Trusted by Teams Worldwide',
            stats: [
              { value: '10K+', label: 'Teams', icon: '👥' },
              { value: '1M+', label: 'Tasks Completed', icon: '✅' },
              { value: '99.9%', label: 'Uptime', icon: '🔒' },
              { value: '4.9/5', label: 'Rating', icon: '⭐' },
            ],
            columns: 4,
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Loved by Teams',
            subtitle: 'See what our customers have to say',
            layout: 'grid',
            testimonials: [
              {
                quote:
                  'FlowSync transformed how our team works. We shipped 40% faster after switching.',
                author: 'Sarah Chen',
                role: 'Engineering Manager',
                company: 'TechCorp',
                avatar: PRESET_IMAGES.corporate.team[1],
                rating: 5,
              },
              {
                quote: 'The automation features alone save us 10+ hours per week. Game changer.',
                author: 'Mike Johnson',
                role: 'Product Lead',
                company: 'StartupXYZ',
                avatar: PRESET_IMAGES.corporate.team[0],
                rating: 5,
              },
            ],
          },
        },
        {
          type: 'pricing',
          props: {
            title: 'Simple, Transparent Pricing',
            subtitle: 'Start free, upgrade when you need to',
            plans: [
              {
                name: 'Free',
                price: '$0',
                period: '/month',
                description: 'For small teams',
                features: ['Up to 5 users', 'Basic features', '5GB storage', 'Community support'],
                ctaText: 'Get Started',
                ctaUrl: '/signup',
                featured: false,
              },
              {
                name: 'Pro',
                price: '$12',
                period: '/user/month',
                description: 'For growing teams',
                features: [
                  'Unlimited users',
                  'All features',
                  '100GB storage',
                  'Priority support',
                  'Advanced analytics',
                  'Custom integrations',
                ],
                ctaText: 'Start Free Trial',
                ctaUrl: '/signup?plan=pro',
                featured: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large organizations',
                features: [
                  'Everything in Pro',
                  'Unlimited storage',
                  'SSO & SAML',
                  'Dedicated support',
                  'Custom contracts',
                  'SLA guarantee',
                ],
                ctaText: 'Contact Sales',
                ctaUrl: '/contact',
                featured: false,
              },
            ],
            billingToggle: true,
            annualDiscount: 20,
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Ready to Transform Your Workflow?',
            subtitle: 'Start your free 14-day trial. No credit card required.',
            ctaText: 'Start Free Trial',
            ctaUrl: '/signup',
            secondaryCtaText: 'Talk to Sales',
            secondaryCtaUrl: '/contact',
            style: 'gradient',
            backgroundColor: '#6366F1',
          },
        },
      ],
    },
    {
      name: 'Features',
      slug: 'features',
      isHomePage: false,
      seo: {
        title: 'Features | FlowSync',
        description: 'Explore all FlowSync features for team collaboration.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Powerful Features for Modern Teams',
            subtitle: 'Everything you need to collaborate effectively',
            backgroundImage: PRESET_IMAGES.saas.features,
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        {
          type: 'features',
          props: {
            title: 'Core Features',
            columns: 2,
            features: [
              {
                icon: '⚡',
                title: 'Real-time Collaboration',
                description:
                  'Work together with live cursors, comments, and instant sync across all devices',
              },
              {
                icon: '🤖',
                title: 'Smart Automation',
                description:
                  'Create custom workflows that automate repetitive tasks and notifications',
              },
              {
                icon: '🔗',
                title: 'Integrations',
                description: 'Connect with 100+ tools including Slack, GitHub, Jira, and more',
              },
              {
                icon: '📊',
                title: 'Analytics Dashboard',
                description: 'Track team productivity, project progress, and identify bottlenecks',
              },
            ],
          },
        },
      ],
    },
    {
      name: 'Pricing',
      slug: 'pricing',
      isHomePage: false,
      seo: {
        title: 'Pricing | FlowSync',
        description: 'Simple, transparent pricing for teams of all sizes.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Pricing',
            subtitle: 'Choose the plan that fits your team',
            alignment: 'center',
            overlayOpacity: 0.2,
          },
        },
        {
          type: 'pricing',
          props: {
            title: 'Plans for Every Team',
            plans: [
              {
                name: 'Free',
                price: '$0',
                period: '/month',
                features: ['5 users', 'Basic features', '5GB storage'],
                ctaText: 'Get Started',
                ctaUrl: '/signup',
                featured: false,
              },
              {
                name: 'Pro',
                price: '$12',
                period: '/user/month',
                features: ['Unlimited users', 'All features', '100GB storage', 'Priority support'],
                ctaText: 'Start Trial',
                ctaUrl: '/signup?plan=pro',
                featured: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                features: ['Everything in Pro', 'SSO', 'Dedicated support', 'SLA'],
                ctaText: 'Contact Sales',
                ctaUrl: '/contact',
                featured: false,
              },
            ],
            billingToggle: true,
            annualDiscount: 20,
          },
        },
        {
          type: 'accordion',
          props: {
            title: 'Frequently Asked Questions',
            items: [
              {
                title: 'Can I try before I buy?',
                content:
                  'Yes! All paid plans include a 14-day free trial. No credit card required.',
              },
              {
                title: 'Can I change plans later?',
                content: 'Absolutely. Upgrade or downgrade anytime from your account settings.',
              },
              {
                title: 'What payment methods do you accept?',
                content:
                  'We accept all major credit cards, PayPal, and wire transfer for Enterprise plans.',
              },
            ],
            allowMultiple: true,
          },
        },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      seo: {
        title: 'Contact | FlowSync',
        description: 'Get in touch with our sales and support team.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Contact Us',
            subtitle: 'We would love to hear from you',
            alignment: 'center',
            overlayOpacity: 0.2,
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Get in Touch',
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Work Email', required: true },
              { type: 'text', name: 'company', label: 'Company' },
              {
                type: 'select',
                name: 'interest',
                label: 'I am interested in',
                options: ['Sales inquiry', 'Technical support', 'Partnership', 'Other'],
                required: true,
              },
              { type: 'textarea', name: 'message', label: 'Message', required: true, rows: 5 },
            ],
            submitText: 'Send Message',
            successMessage: 'Thanks! We will be in touch within 24 hours.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            title: 'Other Ways to Reach Us',
            email: 'hello@flowsync.io',
            social: [
              { platform: 'twitter', url: '#', label: '@flowsync' },
              { platform: 'linkedin', url: '#', label: 'LinkedIn' },
            ],
          },
        },
      ],
    },
  ],
};

// ============================================
// PRESET 7: RESTAURANT
// ============================================

export const RESTAURANT: AiThemePreset = {
  id: 'restaurant',
  name: 'Restaurant & Dining',
  description: 'Elegant restaurant theme with menu displays, reservations, and gallery',
  category: 'lifestyle',
  thumbnail: PRESET_IMAGES.restaurant.hero,
  tags: ['restaurant', 'food', 'dining', 'menu', 'reservations'],
  industry: 'restaurant',
  style: 'elegant',
  colorScheme: 'dark',
  colors: {
    primary: '#D4AF37',
    secondary: '#8B7355',
    accent: '#C9A962',
    background: '#1A1A1A',
    surface: '#242424',
    text: '#E5E5E5',
    textMuted: '#A0A0A0',
    heading: '#FFFFFF',
    link: '#D4AF37',
    linkHover: '#C9A962',
    border: '#333333',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Lato',
    baseFontSize: 17,
    lineHeight: 1.7,
    headingWeight: 500,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1200,
    headerStyle: 'sticky',
    footerStyle: 'centered',
    containerMaxWidth: 1400,
  },
  spacing: { sectionPadding: 100, elementSpacing: 32, containerPadding: 48, blockGap: 80 },
  borders: { radius: 0, width: 1, style: 'solid' },
  features: {
    darkMode: true,
    animations: true,
    responsiveImages: true,
    lazyLoading: true,
    stickyHeader: true,
    backToTop: true,
  },
  headerStyle: 'sticky',
  footerStyle: 'centered',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'La Maison | Fine French Dining',
        description:
          'Experience exquisite French cuisine in an elegant setting. Reservations now available.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'A Culinary Journey Awaits',
            subtitle:
              'Experience the art of French cuisine in the heart of the city. Seasonal ingredients, timeless techniques, unforgettable moments.',
            backgroundImage: PRESET_IMAGES.restaurant.hero,
            ctaText: 'Reserve a Table',
            ctaUrl: '/reservations',
            secondaryCtaText: 'View Menu',
            secondaryCtaUrl: '/menu',
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        {
          type: 'about',
          props: {
            title: 'Our Story',
            subtitle: 'A tradition of excellence since 1985',
            content:
              'For nearly four decades, La Maison has been a destination for those who appreciate the finer things in life. Our kitchen, led by Chef Jean-Pierre Dubois, celebrates the rich traditions of French cuisine while embracing modern techniques and local ingredients.',
            image: PRESET_IMAGES.restaurant.hero,
          },
        },
        {
          type: 'menuPreview',
          props: {
            title: 'Seasonal Highlights',
            subtitle: 'A taste of our current offerings',
            items: [
              {
                name: 'Foie Gras Terrine',
                description: 'With brioche toast and fig compote',
                price: '$32',
                image: PRESET_IMAGES.restaurant.food[0],
                category: 'Starters',
              },
              {
                name: 'Beef Bourguignon',
                description: 'Slow-braised beef with pearl onions and mushrooms',
                price: '$48',
                image: PRESET_IMAGES.restaurant.food[1],
                category: 'Mains',
              },
              {
                name: 'Tarte Tatin',
                description: 'Caramelized apple tart with vanilla ice cream',
                price: '$16',
                image: PRESET_IMAGES.restaurant.food[2],
                category: 'Desserts',
              },
            ],
            ctaText: 'View Full Menu',
            ctaUrl: '/menu',
          },
        },
        {
          type: 'gallery',
          props: { title: 'The Experience', images: PRESET_IMAGES.restaurant.food, columns: 3 },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Guest Reviews',
            layout: 'carousel',
            testimonials: [
              {
                quote: 'An extraordinary dining experience. Every dish was a masterpiece.',
                author: 'The New York Times',
                rating: 5,
              },
              {
                quote: 'The best French restaurant outside of Paris. Simply magnificent.',
                author: 'Michelin Guide',
                rating: 5,
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Reserve Your Table',
            subtitle: 'Join us for an unforgettable evening',
            ctaText: 'Make a Reservation',
            ctaUrl: '/reservations',
            style: 'elegant',
            backgroundColor: '#1A1A1A',
          },
        },
      ],
    },
    {
      name: 'Menu',
      slug: 'menu',
      isHomePage: false,
      seo: { title: 'Menu | La Maison', description: 'Explore our seasonal French cuisine menu.' },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Our Menu',
            subtitle: 'Seasonal ingredients, timeless techniques',
            backgroundImage: PRESET_IMAGES.restaurant.hero,
            alignment: 'center',
            overlayOpacity: 0.6,
          },
        },
        {
          type: 'menuSection',
          props: {
            title: 'Starters',
            items: [
              {
                name: 'French Onion Soup',
                description: 'Caramelized onions, gruyère crouton',
                price: '$14',
              },
              {
                name: 'Escargots de Bourgogne',
                description: 'Burgundy snails, garlic herb butter',
                price: '$18',
              },
              {
                name: 'Foie Gras Terrine',
                description: 'Brioche toast, fig compote',
                price: '$32',
              },
            ],
          },
        },
        {
          type: 'menuSection',
          props: {
            title: 'Main Courses',
            items: [
              {
                name: 'Beef Bourguignon',
                description: 'Slow-braised beef, pearl onions, mushrooms',
                price: '$48',
              },
              {
                name: 'Duck Confit',
                description: 'Crispy leg, lentils du Puy, orange glaze',
                price: '$42',
              },
              {
                name: 'Bouillabaisse',
                description: 'Provençal fish stew, rouille, gruyère toast',
                price: '$52',
              },
            ],
          },
        },
        {
          type: 'menuSection',
          props: {
            title: 'Desserts',
            items: [
              {
                name: 'Crème Brûlée',
                description: 'Vanilla bean, caramelized sugar',
                price: '$14',
              },
              {
                name: 'Tarte Tatin',
                description: 'Caramelized apple, vanilla ice cream',
                price: '$16',
              },
              {
                name: 'Chocolate Soufflé',
                description: 'Dark chocolate, crème anglaise',
                price: '$18',
              },
            ],
          },
        },
      ],
    },
    {
      name: 'Reservations',
      slug: 'reservations',
      isHomePage: false,
      seo: { title: 'Reservations | La Maison', description: 'Book your table at La Maison.' },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Reservations',
            subtitle: 'We look forward to welcoming you',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'reservationForm',
          props: {
            title: 'Book a Table',
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              { type: 'tel', name: 'phone', label: 'Phone', required: true },
              { type: 'date', name: 'date', label: 'Date', required: true },
              {
                type: 'select',
                name: 'time',
                label: 'Time',
                options: [
                  '6:00 PM',
                  '6:30 PM',
                  '7:00 PM',
                  '7:30 PM',
                  '8:00 PM',
                  '8:30 PM',
                  '9:00 PM',
                ],
                required: true,
              },
              {
                type: 'select',
                name: 'guests',
                label: 'Party Size',
                options: ['2 guests', '3 guests', '4 guests', '5 guests', '6 guests', '7+ guests'],
                required: true,
              },
              { type: 'textarea', name: 'notes', label: 'Special Requests', rows: 3 },
            ],
            submitText: 'Request Reservation',
            successMessage: 'Thank you! We will confirm your reservation within 24 hours.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            title: 'Contact Us',
            phone: '+1 (212) 555-0199',
            email: 'reservations@lamaison.com',
            address: '123 Madison Avenue, New York, NY 10016',
            hours: 'Tuesday - Sunday: 6PM - 11PM',
          },
        },
      ],
    },
    {
      name: 'About',
      slug: 'about',
      isHomePage: false,
      seo: { title: 'About | La Maison', description: 'Our story and culinary philosophy.' },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Our Story',
            subtitle: 'A tradition of excellence since 1985',
            backgroundImage: PRESET_IMAGES.restaurant.hero,
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        {
          type: 'about',
          props: {
            title: 'The Beginning',
            content:
              'La Maison was founded in 1985 by Chef Jean-Pierre Dubois, who brought his passion for French cuisine from Lyon to New York. What began as a small bistro has grown into one of the city most celebrated dining destinations.\n\nOur philosophy is simple: source the finest ingredients, honor traditional techniques, and create memorable experiences for every guest.',
            image: PRESET_IMAGES.restaurant.hero,
          },
        },
        {
          type: 'teamGrid',
          props: {
            title: 'Our Team',
            members: [
              {
                name: 'Jean-Pierre Dubois',
                role: 'Executive Chef & Founder',
                image: PRESET_IMAGES.corporate.team[0],
                bio: 'Trained at Le Cordon Bleu, 40+ years of culinary excellence',
              },
              {
                name: 'Marie Laurent',
                role: 'Pastry Chef',
                image: PRESET_IMAGES.corporate.team[1],
                bio: 'Award-winning pastry artist from Paris',
              },
            ],
          },
        },
      ],
    },
  ],
};

// ============================================
// PRESET 8: HEALTHCARE
// ============================================

export const HEALTHCARE: AiThemePreset = {
  id: 'healthcare',
  name: 'Healthcare & Medical',
  description: 'Professional healthcare theme with services, team, and appointment booking',
  category: 'business',
  thumbnail: PRESET_IMAGES.healthcare.hero,
  tags: ['healthcare', 'medical', 'clinic', 'doctor', 'hospital'],
  industry: 'healthcare',
  style: 'professional',
  colorScheme: 'light',
  colors: {
    primary: '#0891B2',
    secondary: '#0E7490',
    accent: '#06B6D4',
    background: '#FFFFFF',
    surface: '#F0FDFA',
    text: '#334155',
    textMuted: '#64748B',
    heading: '#0F172A',
    link: '#0891B2',
    linkHover: '#0E7490',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 600,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1200,
    headerStyle: 'sticky',
    footerStyle: 'multicolumn',
    containerMaxWidth: 1400,
  },
  spacing: { sectionPadding: 80, elementSpacing: 24, containerPadding: 40, blockGap: 64 },
  borders: { radius: 12, width: 1, style: 'solid' },
  features: {
    darkMode: false,
    animations: true,
    responsiveImages: true,
    lazyLoading: true,
    stickyHeader: true,
    backToTop: true,
  },
  headerStyle: 'sticky',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Wellness Medical Center | Comprehensive Healthcare',
        description:
          'Providing compassionate, comprehensive healthcare for you and your family. Book your appointment today.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Your Health, Our Priority',
            subtitle:
              'Comprehensive, compassionate healthcare for you and your family. Experience the difference of patient-centered care.',
            backgroundImage: PRESET_IMAGES.healthcare.hero,
            ctaText: 'Book Appointment',
            ctaUrl: '/appointments',
            secondaryCtaText: 'Our Services',
            secondaryCtaUrl: '/services',
            alignment: 'left',
            overlayOpacity: 0.4,
          },
        },
        {
          type: 'features',
          props: {
            title: 'Our Services',
            subtitle: 'Comprehensive care for every stage of life',
            columns: 3,
            features: [
              {
                icon: '🩺',
                title: 'Primary Care',
                description: 'Routine checkups, preventive care, and chronic disease management',
                link: '/services/primary-care',
              },
              {
                icon: '❤️',
                title: 'Cardiology',
                description: 'Heart health screenings, diagnostics, and treatment',
                link: '/services/cardiology',
              },
              {
                icon: '🦴',
                title: 'Orthopedics',
                description: 'Bone, joint, and muscle care from injury to recovery',
                link: '/services/orthopedics',
              },
              {
                icon: '🧠',
                title: 'Neurology',
                description: 'Brain and nervous system diagnosis and treatment',
                link: '/services/neurology',
              },
              {
                icon: '👶',
                title: 'Pediatrics',
                description: 'Specialized care for infants, children, and adolescents',
                link: '/services/pediatrics',
              },
              {
                icon: '🏥',
                title: 'Urgent Care',
                description: 'Walk-in care for non-emergency medical needs',
                link: '/services/urgent-care',
              },
            ],
          },
        },
        {
          type: 'stats',
          props: {
            title: 'Why Choose Us',
            stats: [
              { value: '25+', label: 'Years of Service', icon: '📅' },
              { value: '50+', label: 'Specialists', icon: '👨‍⚕️' },
              { value: '100K+', label: 'Patients Served', icon: '👥' },
              { value: '4.9/5', label: 'Patient Rating', icon: '⭐' },
            ],
            columns: 4,
          },
        },
        {
          type: 'teamGrid',
          props: {
            title: 'Meet Our Doctors',
            subtitle: 'Board-certified specialists dedicated to your care',
            members: [
              {
                name: 'Dr. Sarah Mitchell',
                role: 'Chief Medical Officer',
                image: PRESET_IMAGES.healthcare.doctors[0],
                bio: 'Board-certified internist with 20+ years experience',
                social: { linkedin: '#' },
              },
              {
                name: 'Dr. James Chen',
                role: 'Cardiologist',
                image: PRESET_IMAGES.healthcare.doctors[1],
                bio: 'Fellowship-trained at Johns Hopkins',
                social: { linkedin: '#' },
              },
              {
                name: 'Dr. Maria Santos',
                role: 'Pediatrician',
                image: PRESET_IMAGES.healthcare.doctors[2],
                bio: 'Specializing in developmental pediatrics',
                social: { linkedin: '#' },
              },
            ],
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Patient Stories',
            layout: 'grid',
            testimonials: [
              {
                quote:
                  'The care I received was exceptional. The doctors took time to listen and explain everything thoroughly.',
                author: 'Jennifer M.',
                role: 'Patient',
                rating: 5,
              },
              {
                quote:
                  'From scheduling to follow-up, every interaction was professional and caring. Highly recommend!',
                author: 'Robert T.',
                role: 'Patient',
                rating: 5,
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Ready to Take the Next Step?',
            subtitle: 'Schedule your appointment today and experience the difference',
            ctaText: 'Book Appointment',
            ctaUrl: '/appointments',
            secondaryCtaText: 'Call Us: (555) 123-4567',
            secondaryCtaUrl: 'tel:5551234567',
            style: 'gradient',
            backgroundColor: '#0891B2',
          },
        },
      ],
    },
    {
      name: 'Services',
      slug: 'services',
      isHomePage: false,
      seo: {
        title: 'Services | Wellness Medical Center',
        description: 'Comprehensive medical services for all your healthcare needs.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Our Services',
            subtitle: 'Comprehensive care for every stage of life',
            backgroundImage: PRESET_IMAGES.healthcare.hero,
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        {
          type: 'features',
          props: {
            title: 'Medical Services',
            columns: 2,
            features: [
              {
                icon: '🩺',
                title: 'Primary Care',
                description:
                  'Annual physicals, preventive screenings, chronic disease management, and wellness visits',
              },
              {
                icon: '❤️',
                title: 'Cardiology',
                description:
                  'EKG, echocardiograms, stress tests, and comprehensive heart health management',
              },
              {
                icon: '🦴',
                title: 'Orthopedics',
                description:
                  'Sports medicine, joint replacement, fracture care, and physical therapy',
              },
              {
                icon: '🧠',
                title: 'Neurology',
                description:
                  'Headache treatment, stroke care, epilepsy management, and cognitive assessments',
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Questions About Our Services?',
            ctaText: 'Contact Us',
            ctaUrl: '/contact',
            style: 'centered',
          },
        },
      ],
    },
    {
      name: 'Appointments',
      slug: 'appointments',
      isHomePage: false,
      seo: {
        title: 'Book Appointment | Wellness Medical Center',
        description: 'Schedule your appointment online.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Book an Appointment',
            subtitle: 'Schedule your visit online in minutes',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'appointmentForm',
          props: {
            title: 'Request an Appointment',
            subtitle: 'Fill out the form below and we will contact you to confirm',
            fields: [
              { type: 'text', name: 'name', label: 'Full Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              { type: 'tel', name: 'phone', label: 'Phone', required: true },
              { type: 'date', name: 'preferredDate', label: 'Preferred Date', required: true },
              {
                type: 'select',
                name: 'department',
                label: 'Department',
                options: [
                  'Primary Care',
                  'Cardiology',
                  'Orthopedics',
                  'Neurology',
                  'Pediatrics',
                  'Urgent Care',
                ],
                required: true,
              },
              {
                type: 'select',
                name: 'visitType',
                label: 'Visit Type',
                options: ['New Patient', 'Follow-up', 'Annual Physical', 'Urgent'],
                required: true,
              },
              {
                type: 'textarea',
                name: 'reason',
                label: 'Reason for Visit',
                required: true,
                rows: 4,
              },
            ],
            submitText: 'Request Appointment',
            successMessage:
              'Thank you! Our scheduling team will contact you within 24 hours to confirm your appointment.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            title: 'Need Immediate Assistance?',
            phone: '+1 (555) 123-4567',
            email: 'appointments@wellnessmedical.com',
            hours: 'Monday - Friday: 8AM - 6PM, Saturday: 9AM - 2PM',
          },
        },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      seo: {
        title: 'Contact | Wellness Medical Center',
        description: 'Get in touch with our team.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Contact Us',
            subtitle: 'We are here to help',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Send Us a Message',
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              { type: 'tel', name: 'phone', label: 'Phone' },
              {
                type: 'select',
                name: 'topic',
                label: 'Topic',
                options: ['General Inquiry', 'Billing', 'Medical Records', 'Feedback', 'Other'],
                required: true,
              },
              { type: 'textarea', name: 'message', label: 'Message', required: true, rows: 5 },
            ],
            submitText: 'Send Message',
            successMessage:
              'Thank you for contacting us. We will respond within 1-2 business days.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            title: 'Visit Us',
            address: '500 Health Center Drive, Suite 100, Medical City, MC 12345',
            phone: '+1 (555) 123-4567',
            email: 'info@wellnessmedical.com',
            hours: 'Monday - Friday: 8AM - 6PM, Saturday: 9AM - 2PM, Sunday: Closed',
          },
        },
        {
          type: 'map',
          props: { address: '500 Health Center Drive, Medical City, MC 12345', zoom: 15 },
        },
      ],
    },
  ],
};

// ============================================
// REAL ESTATE PRESET
// ============================================

const PRESET_IMAGES_REALESTATE = {
  hero: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=1080&fit=crop',
  about: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=1200&h=800&fit=crop',
  properties: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  ],
  agents: [
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  ],
};

const REAL_ESTATE: AiThemePreset = {
  id: 'real-estate',
  name: 'Luxury Real Estate',
  description:
    'Premium real estate agency theme with property listings, agent profiles, and elegant design',
  category: 'business',
  thumbnail: PRESET_IMAGES_REALESTATE.hero,
  tags: ['real estate', 'property', 'luxury', 'homes', 'agents', 'listings'],
  industry: 'realestate',
  style: 'elegant',
  colorScheme: 'light',
  colors: {
    primary: '#1E3A5F',
    secondary: '#C9A962',
    accent: '#8B7355',
    background: '#FDFCFA',
    surface: '#F7F5F2',
    text: '#2D3748',
    textMuted: '#718096',
    heading: '#1A202C',
    link: '#1E3A5F',
    linkHover: '#C9A962',
    border: '#E8E4DF',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Lato',
    baseFontSize: 17,
    lineHeight: 1.7,
    headingWeight: 600,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1280,
    headerStyle: 'sticky',
    footerStyle: 'multicolumn',
  },
  spacing: { sectionPadding: 80, elementSpacing: 32, containerPadding: 32 },
  borders: { radius: 4, width: 1 },
  features: { darkMode: false, animations: true, customFonts: true, lazyLoading: true },
  headerStyle: 'sticky',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Prestige Realty | Luxury Homes & Properties',
        description:
          'Find your dream home with our exclusive collection of luxury properties and expert agents.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Find Your Dream Home',
            subtitle: 'Exclusive luxury properties in the most desirable locations',
            backgroundImage: PRESET_IMAGES_REALESTATE.hero,
            ctaText: 'View Properties',
            ctaUrl: '/properties',
            alignment: 'center',
            overlayOpacity: 0.4,
          },
        },
        {
          type: 'propertySearch',
          props: {
            title: 'Search Properties',
            showFilters: true,
            filters: ['location', 'type', 'price', 'bedrooms'],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Why Choose Us',
            columns: 3,
            features: [
              {
                icon: '🏠',
                title: 'Premium Listings',
                description: 'Access to exclusive off-market properties',
              },
              {
                icon: '🤝',
                title: 'Expert Agents',
                description: '20+ years of combined experience',
              },
              {
                icon: '📊',
                title: 'Market Insights',
                description: 'Data-driven pricing and analysis',
              },
            ],
          },
        },
        {
          type: 'propertyGrid',
          props: {
            title: 'Featured Properties',
            properties: [
              {
                image: PRESET_IMAGES_REALESTATE.properties[0],
                title: 'Modern Villa',
                price: '$2,450,000',
                beds: 5,
                baths: 4,
                sqft: 4500,
                location: 'Beverly Hills, CA',
              },
              {
                image: PRESET_IMAGES_REALESTATE.properties[1],
                title: 'Waterfront Estate',
                price: '$3,200,000',
                beds: 6,
                baths: 5,
                sqft: 5800,
                location: 'Malibu, CA',
              },
              {
                image: PRESET_IMAGES_REALESTATE.properties[2],
                title: 'Contemporary Home',
                price: '$1,850,000',
                beds: 4,
                baths: 3,
                sqft: 3200,
                location: 'Santa Monica, CA',
              },
            ],
          },
        },
        {
          type: 'teamGrid',
          props: {
            title: 'Our Top Agents',
            members: [
              {
                name: 'Victoria Sterling',
                role: 'Luxury Specialist',
                image: PRESET_IMAGES_REALESTATE.agents[0],
              },
              {
                name: 'Marcus Chen',
                role: 'Commercial Expert',
                image: PRESET_IMAGES_REALESTATE.agents[1],
              },
              {
                name: 'Elena Rodriguez',
                role: 'Residential Agent',
                image: PRESET_IMAGES_REALESTATE.agents[2],
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Ready to Find Your Perfect Home?',
            ctaText: 'Schedule Consultation',
            ctaUrl: '/contact',
            style: 'gradient',
          },
        },
      ],
    },
    {
      name: 'Properties',
      slug: 'properties',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Our Properties',
            subtitle: 'Browse our exclusive listings',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        { type: 'propertySearch', props: { showFilters: true } },
        { type: 'propertyGrid', props: { showPagination: true, itemsPerPage: 9 } },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Contact Us',
            subtitle: 'Let us help you find your dream home',
            alignment: 'center',
          },
        },
        {
          type: 'contactForm',
          props: {
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              { type: 'tel', name: 'phone', label: 'Phone' },
              {
                type: 'select',
                name: 'interest',
                label: 'Interest',
                options: ['Buying', 'Selling', 'Renting', 'Investment'],
              },
              { type: 'textarea', name: 'message', label: 'Message', rows: 4 },
            ],
            submitText: 'Send Inquiry',
          },
        },
        {
          type: 'contactInfo',
          props: {
            phone: '+1 (555) 123-4567',
            email: 'info@prestigerealty.com',
            address: '100 Luxury Lane, Beverly Hills, CA 90210',
          },
        },
      ],
    },
  ],
};

// ============================================
// FITNESS / GYM PRESET
// ============================================

const PRESET_IMAGES_FITNESS = {
  hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop',
  about: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&h=800&fit=crop',
  classes: [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&h=600&fit=crop',
  ],
  trainers: [
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop',
  ],
};

const FITNESS_GYM: AiThemePreset = {
  id: 'fitness-gym',
  name: 'Power Fitness',
  description:
    'High-energy fitness and gym theme with bold colors, class schedules, and trainer profiles',
  category: 'lifestyle',
  thumbnail: PRESET_IMAGES_FITNESS.hero,
  tags: ['fitness', 'gym', 'workout', 'training', 'health', 'sports'],
  industry: 'fitness',
  style: 'bold',
  colorScheme: 'dark',
  colors: {
    primary: '#FF4D4D',
    secondary: '#00D9FF',
    accent: '#FFD700',
    background: '#0D0D0D',
    surface: '#1A1A1A',
    text: '#E5E5E5',
    textMuted: '#999999',
    heading: '#FFFFFF',
    link: '#FF4D4D',
    linkHover: '#00D9FF',
    border: '#333333',
  },
  typography: {
    headingFont: 'Oswald',
    bodyFont: 'Open Sans',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1400,
    headerStyle: 'sticky',
    footerStyle: 'default',
  },
  spacing: { sectionPadding: 80, elementSpacing: 24, containerPadding: 24 },
  borders: { radius: 8, width: 2 },
  features: { darkMode: true, animations: true, customFonts: true, parallax: true },
  headerStyle: 'sticky',
  footerStyle: 'default',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Power Fitness | Transform Your Body',
        description:
          'Premium fitness center with expert trainers, group classes, and state-of-the-art equipment.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'TRANSFORM YOUR BODY',
            subtitle: 'Unleash your potential with world-class training',
            backgroundImage: PRESET_IMAGES_FITNESS.hero,
            ctaText: 'Start Free Trial',
            ctaUrl: '/membership',
            alignment: 'center',
            overlayOpacity: 0.6,
          },
        },
        {
          type: 'stats',
          props: {
            stats: [
              { value: '10K+', label: 'Active Members' },
              { value: '50+', label: 'Classes Weekly' },
              { value: '25', label: 'Expert Trainers' },
              { value: '24/7', label: 'Open Access' },
            ],
            columns: 4,
          },
        },
        {
          type: 'features',
          props: {
            title: 'OUR PROGRAMS',
            columns: 3,
            features: [
              {
                icon: '💪',
                title: 'Strength Training',
                description: 'Build muscle and increase power',
                image: PRESET_IMAGES_FITNESS.classes[0],
              },
              {
                icon: '🏃',
                title: 'HIIT Classes',
                description: 'High-intensity interval training',
                image: PRESET_IMAGES_FITNESS.classes[1],
              },
              {
                icon: '🧘',
                title: 'Yoga & Recovery',
                description: 'Balance and flexibility',
                image: PRESET_IMAGES_FITNESS.classes[2],
              },
            ],
          },
        },
        {
          type: 'pricing',
          props: {
            title: 'MEMBERSHIP PLANS',
            plans: [
              {
                name: 'Basic',
                price: '$29',
                period: '/month',
                features: ['Gym Access', 'Locker Room', 'Free WiFi'],
                ctaText: 'Get Started',
              },
              {
                name: 'Pro',
                price: '$59',
                period: '/month',
                features: [
                  'All Basic Features',
                  'Unlimited Classes',
                  'Personal Training Session',
                  'Nutrition Plan',
                ],
                popular: true,
                ctaText: 'Get Started',
              },
              {
                name: 'Elite',
                price: '$99',
                period: '/month',
                features: ['All Pro Features', 'Private Locker', 'Spa Access', 'Guest Passes'],
                ctaText: 'Get Started',
              },
            ],
          },
        },
        {
          type: 'teamGrid',
          props: {
            title: 'MEET OUR TRAINERS',
            members: [
              {
                name: 'Jake Powers',
                role: 'Head Trainer',
                image: PRESET_IMAGES_FITNESS.trainers[0],
              },
              {
                name: 'Sarah Chen',
                role: 'Yoga Instructor',
                image: PRESET_IMAGES_FITNESS.trainers[1],
              },
              {
                name: 'Mike Strong',
                role: 'Strength Coach',
                image: PRESET_IMAGES_FITNESS.trainers[2],
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'START YOUR TRANSFORMATION TODAY',
            ctaText: 'Join Now - First Week Free',
            ctaUrl: '/membership',
            style: 'gradient',
            backgroundColor: '#FF4D4D',
          },
        },
      ],
    },
    {
      name: 'Classes',
      slug: 'classes',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'FITNESS CLASSES',
            subtitle: '50+ classes weekly for all fitness levels',
            alignment: 'center',
          },
        },
        {
          type: 'schedule',
          props: {
            title: 'Class Schedule',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          },
        },
      ],
    },
    {
      name: 'Membership',
      slug: 'membership',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'JOIN THE MOVEMENT',
            subtitle: 'Choose the plan that fits your goals',
            alignment: 'center',
          },
        },
        { type: 'pricing', props: { showComparison: true } },
        {
          type: 'faq',
          props: {
            title: 'Common Questions',
            items: [
              {
                question: 'Can I freeze my membership?',
                answer: 'Yes, you can freeze for up to 3 months per year.',
              },
              {
                question: 'Is there a cancellation fee?',
                answer: 'No, you can cancel anytime with 30 days notice.',
              },
            ],
          },
        },
      ],
    },
  ],
};

// ============================================
// NON-PROFIT PRESET
// ============================================

const PRESET_IMAGES_NONPROFIT = {
  hero: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1920&h=1080&fit=crop',
  cause: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=800&fit=crop',
  impact: [
    'https://images.unsplash.com/photo-1469571486292-b53601016701?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1593113598332-cd59a0c3a9b1?w=800&h=600&fit=crop',
  ],
};

const NONPROFIT: AiThemePreset = {
  id: 'nonprofit-charity',
  name: 'Hope Foundation',
  description:
    'Inspiring nonprofit theme with donation integration, impact stories, and volunteer sign-up',
  category: 'business',
  thumbnail: PRESET_IMAGES_NONPROFIT.hero,
  tags: ['nonprofit', 'charity', 'donate', 'volunteer', 'cause', 'foundation'],
  industry: 'nonprofit',
  style: 'modern',
  colorScheme: 'light',
  colors: {
    primary: '#2D8C3C',
    secondary: '#F5A623',
    accent: '#E74C3C',
    background: '#FFFFFF',
    surface: '#F8FAF8',
    text: '#333333',
    textMuted: '#666666',
    heading: '#1A1A1A',
    link: '#2D8C3C',
    linkHover: '#F5A623',
    border: '#E0E0E0',
  },
  typography: {
    headingFont: 'Merriweather',
    bodyFont: 'Source Sans Pro',
    baseFontSize: 17,
    lineHeight: 1.75,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1200,
    headerStyle: 'default',
    footerStyle: 'multicolumn',
  },
  spacing: { sectionPadding: 64, elementSpacing: 24, containerPadding: 24 },
  borders: { radius: 12, width: 1 },
  features: { darkMode: false, animations: true, customFonts: true },
  headerStyle: 'default',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Hope Foundation | Making a Difference Together',
        description: 'Join us in our mission to create positive change in communities worldwide.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Together We Can Make a Difference',
            subtitle: 'Join our mission to create lasting change in communities worldwide',
            backgroundImage: PRESET_IMAGES_NONPROFIT.hero,
            ctaText: 'Donate Now',
            ctaUrl: '/donate',
            secondaryCtaText: 'Learn More',
            secondaryCtaUrl: '/about',
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        {
          type: 'stats',
          props: {
            title: 'Our Impact',
            stats: [
              { value: '50K+', label: 'Lives Changed' },
              { value: '100+', label: 'Communities Served' },
              { value: '$5M+', label: 'Funds Raised' },
              { value: '2K+', label: 'Active Volunteers' },
            ],
            columns: 4,
          },
        },
        {
          type: 'features',
          props: {
            title: 'Our Programs',
            columns: 3,
            features: [
              {
                icon: '📚',
                title: 'Education',
                description: 'Providing access to quality education for underprivileged children',
                image: PRESET_IMAGES_NONPROFIT.impact[0],
              },
              {
                icon: '🏥',
                title: 'Healthcare',
                description: 'Bringing medical care to remote communities',
                image: PRESET_IMAGES_NONPROFIT.impact[1],
              },
              {
                icon: '🌱',
                title: 'Environment',
                description: 'Protecting ecosystems and promoting sustainability',
                image: PRESET_IMAGES_NONPROFIT.impact[2],
              },
            ],
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Stories of Hope',
            testimonials: [
              {
                quote:
                  'Thanks to the foundation, my children can now attend school and dream of a better future.',
                author: 'Maria S.',
                role: 'Program Beneficiary',
              },
              {
                quote: 'Volunteering here has been the most rewarding experience of my life.',
                author: 'David K.',
                role: 'Volunteer',
              },
            ],
          },
        },
        {
          type: 'donationForm',
          props: {
            title: 'Make a Donation',
            amounts: [25, 50, 100, 250, 500],
            customAmount: true,
            recurring: true,
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Ready to Get Involved?',
            subtitle: 'Join our community of changemakers',
            ctaText: 'Become a Volunteer',
            ctaUrl: '/volunteer',
            style: 'gradient',
            backgroundColor: '#2D8C3C',
          },
        },
      ],
    },
    {
      name: 'Donate',
      slug: 'donate',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Support Our Mission',
            subtitle: 'Every contribution makes a difference',
            alignment: 'center',
          },
        },
        { type: 'donationForm', props: { showImpact: true } },
      ],
    },
    {
      name: 'Volunteer',
      slug: 'volunteer',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Become a Volunteer',
            subtitle: 'Share your time and talents to help others',
            alignment: 'center',
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Volunteer Application',
            fields: [
              { type: 'text', name: 'name', label: 'Full Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              { type: 'tel', name: 'phone', label: 'Phone' },
              {
                type: 'select',
                name: 'interest',
                label: 'Area of Interest',
                options: [
                  'Education',
                  'Healthcare',
                  'Environment',
                  'Administration',
                  'Fundraising',
                ],
              },
              {
                type: 'textarea',
                name: 'motivation',
                label: 'Why do you want to volunteer?',
                rows: 4,
              },
            ],
            submitText: 'Submit Application',
          },
        },
      ],
    },
  ],
};

// ============================================
// TRAVEL / TOURISM PRESET
// ============================================

const PRESET_IMAGES_TRAVEL = {
  hero: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&h=1080&fit=crop',
  destinations: [
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&h=600&fit=crop',
  ],
};

const TRAVEL_TOURISM: AiThemePreset = {
  id: 'travel-tourism',
  name: 'Wanderlust Travel',
  description:
    'Adventure-inspiring travel theme with destination showcases, tour packages, and booking integration',
  category: 'lifestyle',
  thumbnail: PRESET_IMAGES_TRAVEL.hero,
  tags: ['travel', 'tourism', 'adventure', 'vacation', 'destinations', 'tours'],
  industry: 'travel',
  style: 'modern',
  colorScheme: 'light',
  colors: {
    primary: '#0077B6',
    secondary: '#00B4D8',
    accent: '#FB8500',
    background: '#FFFFFF',
    surface: '#F0F7FA',
    text: '#2B2D42',
    textMuted: '#6C757D',
    heading: '#14213D',
    link: '#0077B6',
    linkHover: '#FB8500',
    border: '#DEE2E6',
  },
  typography: {
    headingFont: 'Montserrat',
    bodyFont: 'Open Sans',
    baseFontSize: 16,
    lineHeight: 1.7,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1400,
    headerStyle: 'sticky',
    footerStyle: 'multicolumn',
  },
  spacing: { sectionPadding: 80, elementSpacing: 32, containerPadding: 24 },
  borders: { radius: 16, width: 1 },
  features: {
    darkMode: false,
    animations: true,
    customFonts: true,
    parallax: true,
    lazyLoading: true,
  },
  headerStyle: 'sticky',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Wanderlust Travel | Discover Your Next Adventure',
        description: "Curated travel experiences to the world's most breathtaking destinations.",
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Discover Your Next Adventure',
            subtitle: "Curated travel experiences to the world's most breathtaking destinations",
            backgroundImage: PRESET_IMAGES_TRAVEL.hero,
            ctaText: 'Explore Destinations',
            ctaUrl: '/destinations',
            alignment: 'center',
            overlayOpacity: 0.3,
          },
        },
        {
          type: 'searchBar',
          props: {
            placeholder: 'Where do you want to go?',
            filters: ['destination', 'dates', 'travelers'],
          },
        },
        {
          type: 'gallery',
          props: {
            title: 'Popular Destinations',
            layout: 'masonry',
            images: PRESET_IMAGES_TRAVEL.destinations.map((img, i) => ({
              src: img,
              alt: ['Tropical Paradise', 'Beach Resort', 'Mountain Views', 'Cultural Experience'][
                i
              ],
              caption: ['Maldives', 'Bali', 'Swiss Alps', 'Morocco'][i],
            })),
          },
        },
        {
          type: 'features',
          props: {
            title: 'Why Travel With Us',
            columns: 4,
            features: [
              { icon: '✈️', title: 'Curated Trips', description: 'Hand-picked experiences' },
              { icon: '🛡️', title: 'Safe Travel', description: 'Your safety is our priority' },
              { icon: '💰', title: 'Best Prices', description: 'Price match guarantee' },
              { icon: '🎯', title: 'Local Experts', description: 'Authentic experiences' },
            ],
          },
        },
        {
          type: 'tourPackages',
          props: {
            title: 'Featured Tours',
            packages: [
              {
                title: 'Bali Escape',
                duration: '7 days',
                price: '$1,299',
                image: PRESET_IMAGES_TRAVEL.destinations[1],
              },
              {
                title: 'Swiss Adventure',
                duration: '10 days',
                price: '$2,499',
                image: PRESET_IMAGES_TRAVEL.destinations[2],
              },
              {
                title: 'Morocco Discovery',
                duration: '8 days',
                price: '$1,799',
                image: PRESET_IMAGES_TRAVEL.destinations[3],
              },
            ],
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Traveler Stories',
            testimonials: [
              {
                quote: "The best vacation we've ever had! Every detail was perfectly planned.",
                author: 'The Johnson Family',
                rating: 5,
              },
            ],
          },
        },
        {
          type: 'newsletter',
          props: {
            title: 'Get Travel Inspiration',
            subtitle: 'Subscribe for exclusive deals and travel tips',
            buttonText: 'Subscribe',
          },
        },
      ],
    },
    {
      name: 'Destinations',
      slug: 'destinations',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Explore Destinations',
            subtitle: 'Find your perfect getaway',
            alignment: 'center',
          },
        },
        {
          type: 'destinationGrid',
          props: { showFilters: true, filters: ['continent', 'type', 'budget'] },
        },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Plan Your Trip',
            subtitle: 'Let our travel experts help you',
            alignment: 'center',
          },
        },
        {
          type: 'contactForm',
          props: {
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              { type: 'text', name: 'destination', label: 'Desired Destination' },
              { type: 'date', name: 'travelDate', label: 'Travel Date' },
              { type: 'number', name: 'travelers', label: 'Number of Travelers' },
              {
                type: 'textarea',
                name: 'message',
                label: 'Tell us about your dream trip',
                rows: 4,
              },
            ],
            submitText: 'Request Quote',
          },
        },
      ],
    },
  ],
};

// ============================================
// FASHION / CLOTHING PRESET
// ============================================

const PRESET_IMAGES_FASHION = {
  hero: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop',
  collections: [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop',
  ],
};

const FASHION: AiThemePreset = {
  id: 'fashion-boutique',
  name: 'Luxe Fashion',
  description:
    'High-end fashion boutique theme with elegant typography and stunning product showcases',
  category: 'ecommerce',
  thumbnail: PRESET_IMAGES_FASHION.hero,
  tags: ['fashion', 'clothing', 'boutique', 'luxury', 'style', 'apparel'],
  industry: 'ecommerce',
  style: 'elegant',
  colorScheme: 'light',
  colors: {
    primary: '#1A1A1A',
    secondary: '#C9A96E',
    accent: '#E8D5C4',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    text: '#333333',
    textMuted: '#888888',
    heading: '#000000',
    link: '#1A1A1A',
    linkHover: '#C9A96E',
    border: '#EEEEEE',
  },
  typography: {
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Karla',
    baseFontSize: 15,
    lineHeight: 1.8,
    headingWeight: 500,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1440,
    headerStyle: 'minimal',
    footerStyle: 'multicolumn',
  },
  spacing: { sectionPadding: 100, elementSpacing: 40, containerPadding: 32 },
  borders: { radius: 0, width: 1 },
  features: { darkMode: false, animations: true, customFonts: true, lazyLoading: true },
  headerStyle: 'minimal',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Luxe Fashion | Contemporary Designer Collection',
        description: 'Discover our curated collection of contemporary designer fashion.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'NEW SEASON',
            subtitle: 'Contemporary collection',
            backgroundImage: PRESET_IMAGES_FASHION.hero,
            ctaText: 'Shop Now',
            ctaUrl: '/collections',
            alignment: 'center',
            overlayOpacity: 0.2,
            minHeight: '100vh',
          },
        },
        {
          type: 'productGrid',
          props: {
            title: 'Featured Collection',
            layout: 'elegant',
            products: PRESET_IMAGES_FASHION.collections.map((img, i) => ({
              image: img,
              name: ['Silk Blouse', 'Tailored Coat', 'Evening Dress', 'Designer Suit'][i],
              price: ['$295', '$450', '$580', '$695'][i],
            })),
          },
        },
        {
          type: 'splitContent',
          props: {
            title: 'Crafted with Care',
            description:
              'Each piece in our collection is carefully selected for quality, sustainability, and timeless style.',
            image: PRESET_IMAGES_FASHION.collections[0],
            ctaText: 'Our Story',
            ctaUrl: '/about',
          },
        },
        {
          type: 'newsletter',
          props: {
            title: 'Join Our World',
            subtitle: 'Be the first to know about new arrivals and exclusive offers',
            buttonText: 'Subscribe',
            minimal: true,
          },
        },
      ],
    },
    {
      name: 'Collections',
      slug: 'collections',
      isHomePage: false,
      blocks: [
        { type: 'hero', props: { title: 'Collections', alignment: 'center', minHeight: '40vh' } },
        { type: 'productGrid', props: { showFilters: true, showSort: true } },
      ],
    },
  ],
};

// ============================================
// LEGAL / LAW FIRM PRESET
// ============================================

const PRESET_IMAGES_LEGAL = {
  hero: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=1080&fit=crop',
  team: [
    'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
  ],
};

const LAW_FIRM: AiThemePreset = {
  id: 'law-firm',
  name: 'Sterling Law',
  description:
    'Professional law firm theme with practice areas, attorney profiles, and consultation booking',
  category: 'business',
  thumbnail: PRESET_IMAGES_LEGAL.hero,
  tags: ['law', 'legal', 'attorney', 'lawyer', 'firm', 'consultation'],
  industry: 'finance',
  style: 'professional',
  colorScheme: 'light',
  colors: {
    primary: '#1B3A4B',
    secondary: '#8B7355',
    accent: '#C4A962',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#333333',
    textMuted: '#666666',
    heading: '#1B3A4B',
    link: '#1B3A4B',
    linkHover: '#8B7355',
    border: '#E0E0E0',
  },
  typography: {
    headingFont: 'Libre Baskerville',
    bodyFont: 'Source Sans Pro',
    baseFontSize: 17,
    lineHeight: 1.75,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1200,
    headerStyle: 'default',
    footerStyle: 'multicolumn',
  },
  spacing: { sectionPadding: 80, elementSpacing: 32, containerPadding: 32 },
  borders: { radius: 4, width: 1 },
  features: { darkMode: false, animations: false, customFonts: true },
  headerStyle: 'default',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Sterling Law | Experienced Legal Representation',
        description:
          'Trusted legal counsel for individuals and businesses. Over 50 years of combined experience.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Experienced Legal Representation',
            subtitle: 'Protecting your rights and interests with integrity and dedication',
            backgroundImage: PRESET_IMAGES_LEGAL.hero,
            ctaText: 'Free Consultation',
            ctaUrl: '/contact',
            alignment: 'left',
            overlayOpacity: 0.6,
          },
        },
        {
          type: 'features',
          props: {
            title: 'Practice Areas',
            columns: 3,
            features: [
              {
                icon: '⚖️',
                title: 'Corporate Law',
                description: 'Business formation, contracts, and transactions',
              },
              {
                icon: '🏠',
                title: 'Real Estate',
                description: 'Property transactions and disputes',
              },
              {
                icon: '👨‍👩‍👧',
                title: 'Family Law',
                description: 'Divorce, custody, and family matters',
              },
              { icon: '📋', title: 'Estate Planning', description: 'Wills, trusts, and probate' },
              { icon: '💼', title: 'Employment Law', description: 'Workplace rights and disputes' },
              { icon: '🚗', title: 'Personal Injury', description: 'Accident and injury claims' },
            ],
          },
        },
        {
          type: 'stats',
          props: {
            stats: [
              { value: '50+', label: 'Years Combined Experience' },
              { value: '5000+', label: 'Cases Handled' },
              { value: '98%', label: 'Client Satisfaction' },
              { value: '24/7', label: 'Emergency Support' },
            ],
            columns: 4,
          },
        },
        {
          type: 'teamGrid',
          props: {
            title: 'Our Attorneys',
            members: [
              {
                name: 'James Sterling',
                role: 'Managing Partner',
                image: PRESET_IMAGES_LEGAL.team[0],
                bio: 'Corporate law specialist with 25 years experience',
              },
              {
                name: 'Robert Chen',
                role: 'Senior Partner',
                image: PRESET_IMAGES_LEGAL.team[1],
                bio: 'Real estate and business litigation',
              },
              {
                name: 'Sarah Mitchell',
                role: 'Partner',
                image: PRESET_IMAGES_LEGAL.team[2],
                bio: 'Family law and estate planning',
              },
            ],
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Client Testimonials',
            testimonials: [
              {
                quote:
                  'Sterling Law handled my case with professionalism and achieved an excellent outcome.',
                author: 'Michael T.',
                role: 'Business Owner',
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Need Legal Assistance?',
            subtitle: 'Schedule a free consultation with our experienced attorneys',
            ctaText: 'Contact Us Today',
            ctaUrl: '/contact',
            style: 'solid',
            backgroundColor: '#1B3A4B',
          },
        },
      ],
    },
    {
      name: 'Practice Areas',
      slug: 'practice-areas',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Practice Areas',
            subtitle: 'Comprehensive legal services',
            alignment: 'center',
          },
        },
        { type: 'features', props: { layout: 'detailed', showLinks: true } },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Contact Us',
            subtitle: 'Schedule your free consultation',
            alignment: 'center',
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Request Consultation',
            fields: [
              { type: 'text', name: 'name', label: 'Full Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              { type: 'tel', name: 'phone', label: 'Phone', required: true },
              {
                type: 'select',
                name: 'area',
                label: 'Practice Area',
                options: [
                  'Corporate Law',
                  'Real Estate',
                  'Family Law',
                  'Estate Planning',
                  'Employment Law',
                  'Personal Injury',
                ],
                required: true,
              },
              {
                type: 'textarea',
                name: 'description',
                label: 'Brief Description of Your Matter',
                rows: 4,
                required: true,
              },
            ],
            submitText: 'Request Consultation',
            disclaimer:
              'Your information is confidential and protected by attorney-client privilege.',
          },
        },
        {
          type: 'contactInfo',
          props: {
            address: '500 Legal Plaza, Suite 1000, New York, NY 10001',
            phone: '+1 (555) 123-4567',
            email: 'contact@sterlinglaw.com',
            hours: 'Monday - Friday: 9AM - 6PM',
          },
        },
      ],
    },
  ],
};

// ============================================
// EDUCATION / SCHOOL PRESET
// ============================================

const PRESET_IMAGES_EDUCATION = {
  hero: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&h=1080&fit=crop',
  campus: [
    'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop',
  ],
  faculty: [
    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
  ],
};

const EDUCATION_SCHOOL: AiThemePreset = {
  id: 'education-school',
  name: 'Bright Academy',
  description:
    'Modern educational institution theme with program listings, faculty profiles, and enrollment features',
  category: 'education',
  thumbnail: PRESET_IMAGES_EDUCATION.hero,
  tags: ['education', 'school', 'university', 'academy', 'learning', 'enrollment'],
  industry: 'education',
  style: 'modern',
  colorScheme: 'light',
  colors: {
    primary: '#2563EB',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#334155',
    textMuted: '#64748B',
    heading: '#0F172A',
    link: '#2563EB',
    linkHover: '#10B981',
    border: '#E2E8F0',
  },
  typography: {
    headingFont: 'Poppins',
    bodyFont: 'Inter',
    baseFontSize: 16,
    lineHeight: 1.7,
    headingWeight: 600,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1280,
    headerStyle: 'mega',
    footerStyle: 'multicolumn',
  },
  spacing: { sectionPadding: 64, elementSpacing: 24, containerPadding: 24 },
  borders: { radius: 12, width: 1 },
  features: { darkMode: false, animations: true, customFonts: true, breadcrumbs: true },
  headerStyle: 'mega',
  footerStyle: 'multicolumn',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Bright Academy | Excellence in Education',
        description:
          'Empowering students to achieve their full potential through innovative education.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Shape Your Future',
            subtitle: "World-class education that prepares you for tomorrow's challenges",
            backgroundImage: PRESET_IMAGES_EDUCATION.hero,
            ctaText: 'Apply Now',
            ctaUrl: '/admissions',
            secondaryCtaText: 'Virtual Tour',
            secondaryCtaUrl: '/tour',
            alignment: 'center',
            overlayOpacity: 0.4,
          },
        },
        {
          type: 'stats',
          props: {
            stats: [
              { value: '95%', label: 'Graduation Rate' },
              { value: '50+', label: 'Programs' },
              { value: '18:1', label: 'Student-Faculty Ratio' },
              { value: '100+', label: 'Partner Companies' },
            ],
            columns: 4,
          },
        },
        {
          type: 'features',
          props: {
            title: 'Our Programs',
            columns: 3,
            features: [
              {
                icon: '💻',
                title: 'Technology',
                description: 'Computer Science, Data Science, Cybersecurity',
                image: PRESET_IMAGES_EDUCATION.campus[0],
              },
              {
                icon: '📈',
                title: 'Business',
                description: 'MBA, Finance, Marketing, Entrepreneurship',
                image: PRESET_IMAGES_EDUCATION.campus[1],
              },
              {
                icon: '🎨',
                title: 'Arts & Design',
                description: 'Fine Arts, Graphic Design, Architecture',
                image: PRESET_IMAGES_EDUCATION.campus[2],
              },
            ],
          },
        },
        {
          type: 'gallery',
          props: {
            title: 'Campus Life',
            layout: 'grid',
            images: PRESET_IMAGES_EDUCATION.campus.map((img, i) => ({
              src: img,
              alt: ['Library', 'Student Center', 'Sports Complex'][i],
            })),
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Student Success Stories',
            testimonials: [
              {
                quote: 'Bright Academy gave me the skills and network to launch my career.',
                author: 'Emma Chen',
                role: 'Class of 2023, Software Engineer at Google',
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Ready to Begin Your Journey?',
            ctaText: 'Schedule a Visit',
            ctaUrl: '/visit',
            secondaryCtaText: 'Download Brochure',
            secondaryCtaUrl: '/brochure',
            style: 'gradient',
          },
        },
      ],
    },
    {
      name: 'Programs',
      slug: 'programs',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Academic Programs',
            subtitle: 'Find the right program for your goals',
            alignment: 'center',
          },
        },
        {
          type: 'programList',
          props: { showFilters: true, filters: ['department', 'degree', 'format'] },
        },
      ],
    },
    {
      name: 'Admissions',
      slug: 'admissions',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Admissions',
            subtitle: 'Start your application today',
            alignment: 'center',
          },
        },
        {
          type: 'timeline',
          props: {
            title: 'Application Process',
            steps: [
              { title: 'Submit Application', description: 'Complete the online application' },
              { title: 'Documents', description: 'Upload transcripts and essays' },
              { title: 'Interview', description: 'Virtual or in-person interview' },
              { title: 'Decision', description: 'Receive admission decision' },
            ],
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Request Information',
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              {
                type: 'select',
                name: 'program',
                label: 'Program of Interest',
                options: ['Undergraduate', 'Graduate', 'Professional', 'Online'],
              },
              { type: 'textarea', name: 'questions', label: 'Questions', rows: 3 },
            ],
            submitText: 'Request Info',
          },
        },
      ],
    },
  ],
};

// ============================================
// AUTOMOTIVE PRESET
// ============================================

const PRESET_IMAGES_AUTO = {
  hero: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&h=1080&fit=crop',
  vehicles: [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
  ],
};

const AUTOMOTIVE: AiThemePreset = {
  id: 'automotive-dealer',
  name: 'Elite Motors',
  description:
    'Premium automotive dealership theme with vehicle inventory, financing calculators, and appointment scheduling',
  category: 'business',
  thumbnail: PRESET_IMAGES_AUTO.hero,
  tags: ['automotive', 'cars', 'dealership', 'vehicles', 'auto', 'motors'],
  industry: 'general',
  style: 'bold',
  colorScheme: 'dark',
  colors: {
    primary: '#DC2626',
    secondary: '#1E40AF',
    accent: '#F59E0B',
    background: '#0F0F0F',
    surface: '#1A1A1A',
    text: '#E5E5E5',
    textMuted: '#A3A3A3',
    heading: '#FFFFFF',
    link: '#DC2626',
    linkHover: '#F59E0B',
    border: '#333333',
  },
  typography: {
    headingFont: 'Rajdhani',
    bodyFont: 'Roboto',
    baseFontSize: 16,
    lineHeight: 1.6,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1400,
    headerStyle: 'sticky',
    footerStyle: 'default',
  },
  spacing: { sectionPadding: 80, elementSpacing: 32, containerPadding: 24 },
  borders: { radius: 8, width: 2 },
  features: { darkMode: true, animations: true, customFonts: true, lazyLoading: true },
  headerStyle: 'sticky',
  footerStyle: 'default',
  pages: [
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Elite Motors | Premium Auto Dealership',
        description: 'Discover our collection of premium new and pre-owned vehicles.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'DRIVE YOUR DREAM',
            subtitle: 'Premium vehicles. Unmatched service.',
            backgroundImage: PRESET_IMAGES_AUTO.hero,
            ctaText: 'View Inventory',
            ctaUrl: '/inventory',
            alignment: 'center',
            overlayOpacity: 0.5,
          },
        },
        { type: 'vehicleSearch', props: { filters: ['make', 'model', 'year', 'price'] } },
        {
          type: 'vehicleGrid',
          props: {
            title: 'Featured Vehicles',
            vehicles: [
              {
                image: PRESET_IMAGES_AUTO.vehicles[0],
                make: 'Porsche',
                model: '911 Carrera',
                year: 2024,
                price: '$115,000',
                mileage: 'New',
              },
              {
                image: PRESET_IMAGES_AUTO.vehicles[1],
                make: 'BMW',
                model: 'M4 Competition',
                year: 2024,
                price: '$89,900',
                mileage: 'New',
              },
              {
                image: PRESET_IMAGES_AUTO.vehicles[2],
                make: 'Mercedes',
                model: 'AMG GT',
                year: 2023,
                price: '$142,000',
                mileage: '5,200 mi',
              },
            ],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Why Elite Motors',
            columns: 4,
            features: [
              { icon: '✓', title: 'Certified Pre-Owned', description: '150-point inspection' },
              { icon: '💰', title: 'Best Financing', description: 'Competitive rates' },
              { icon: '🔧', title: 'Service Center', description: 'Expert technicians' },
              { icon: '🚗', title: 'Trade-In', description: 'Top dollar for your vehicle' },
            ],
          },
        },
        {
          type: 'testimonials',
          props: {
            title: 'Customer Reviews',
            testimonials: [
              {
                quote:
                  "The best car buying experience I've ever had. Professional and transparent.",
                author: 'James R.',
                rating: 5,
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Ready for a Test Drive?',
            ctaText: 'Schedule Appointment',
            ctaUrl: '/contact',
            style: 'gradient',
            backgroundColor: '#DC2626',
          },
        },
      ],
    },
    {
      name: 'Inventory',
      slug: 'inventory',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Our Inventory',
            subtitle: 'Find your perfect vehicle',
            alignment: 'center',
          },
        },
        { type: 'vehicleSearch', props: { advanced: true } },
        { type: 'vehicleGrid', props: { showPagination: true, itemsPerPage: 12 } },
      ],
    },
    {
      name: 'Contact',
      slug: 'contact',
      isHomePage: false,
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'Contact Us',
            subtitle: 'Visit our showroom or schedule a test drive',
            alignment: 'center',
          },
        },
        {
          type: 'contactForm',
          props: {
            title: 'Schedule Test Drive',
            fields: [
              { type: 'text', name: 'name', label: 'Name', required: true },
              { type: 'email', name: 'email', label: 'Email', required: true },
              { type: 'tel', name: 'phone', label: 'Phone', required: true },
              { type: 'text', name: 'vehicle', label: 'Vehicle of Interest' },
              { type: 'date', name: 'preferredDate', label: 'Preferred Date' },
              { type: 'textarea', name: 'message', label: 'Additional Notes', rows: 3 },
            ],
            submitText: 'Schedule Test Drive',
          },
        },
        {
          type: 'contactInfo',
          props: {
            address: '1000 Auto Mile, Motor City, MC 12345',
            phone: '+1 (555) 888-9999',
            email: 'sales@elitemotors.com',
            hours: 'Monday - Saturday: 9AM - 8PM, Sunday: 11AM - 5PM',
          },
        },
      ],
    },
  ],
};

// ============================================
// 17. CYBERPUNK NEON - Futuristic Tech Platform
// ============================================

const PRESET_IMAGES_CYBERPUNK = {
  hero: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1920&h=1080&fit=crop', // Cyberpunk city
  cityNight: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=800&fit=crop', // Tech/neon
  digitalMarket: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=800&fit=crop', // Retro tech
  learning: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&h=800&fit=crop', // Matrix/code
  dataStream: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=800&fit=crop', // Data visualization
  about: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&h=800&fit=crop', // Robot/future
  products: [
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600&h=600&fit=crop', // VR headset
    'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&h=600&fit=crop', // Neon tech
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=600&fit=crop', // Gaming
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop', // Data
  ],
  courses: [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop', // Code matrix
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop', // Cybersecurity
    'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600&h=400&fit=crop', // AI
  ],
  blog: [
    'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&h=500&fit=crop', // Neon signs
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=500&fit=crop', // Code
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop', // Earth data
  ],
  team: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&h=600&fit=crop', // Holographic
};

const CYBERPUNK_NEON: AiThemePreset = {
  id: 'cyberpunk-neon',
  name: 'Neon District',
  description:
    'A futuristic cyberpunk theme with neon glows, glassmorphism, dark aesthetics, and holographic UI elements. Perfect for tech startups, gaming platforms, and futuristic digital experiences.',
  thumbnail: PRESET_IMAGES_CYBERPUNK.hero,
  category: 'creative',
  industry: 'technology',
  style: 'bold',
  colorScheme: 'dark',
  tags: [
    'cyberpunk',
    'neon',
    'futuristic',
    'dark',
    'gaming',
    'tech',
    'glassmorphism',
    'holographic',
    'sci-fi',
    'dystopian',
  ],
  colors: {
    primary: '#00f0ff', // Electric cyan
    secondary: '#ff00ff', // Magenta/pink
    accent: '#9d00ff', // Purple
    background: '#0a0a0f', // Deep black
    surface: '#12121a', // Carbon dark
    text: '#e0e0e8', // Light gray
    textMuted: '#6b6b80', // Muted purple-gray
    heading: '#ffffff', // Pure white
    link: '#00f0ff', // Cyan
    linkHover: '#ff00ff', // Magenta on hover
    border: '#2a2a3a', // Dark border
  },
  typography: {
    headingFont: 'Orbitron',
    bodyFont: 'Rajdhani',
    baseFontSize: 16,
    lineHeight: 1.7,
    headingWeight: 700,
  },
  layout: {
    sidebarPosition: 'none',
    contentWidth: 1400,
    headerStyle: 'sticky',
    footerStyle: 'default',
  },
  spacing: { sectionPadding: 100, elementSpacing: 40, containerPadding: 32 },
  borders: { radius: 16, width: 1 },
  features: {
    darkMode: true,
    animations: true,
    customFonts: true,
    parallax: true,
    lazyLoading: true,
  },
  headerStyle: 'sticky',
  footerStyle: 'default',
  pages: [
    // PAGE 1 — HOME / LANDING PAGE
    {
      name: 'Home',
      slug: 'home',
      isHomePage: true,
      seo: {
        title: 'Neon District | Build. Learn. Sell. Connect — In the Future',
        description:
          'A futuristic digital platform for creators, learners, and innovators. Enter the cyberpunk ecosystem.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'BUILD. LEARN. SELL. CONNECT.',
            subtitle:
              'Enter the digital frontier. A futuristic ecosystem for creators, innovators, and dreamers.',
            backgroundImage: PRESET_IMAGES_CYBERPUNK.hero,
            ctaText: 'Explore Platform',
            ctaSecondaryText: 'Join Now',
            ctaUrl: '/shop',
            ctaSecondaryUrl: '/register',
            alignment: 'center',
            overlayOpacity: 0.7,
            overlayColor:
              'linear-gradient(135deg, rgba(0,240,255,0.1) 0%, rgba(157,0,255,0.2) 50%, rgba(255,0,255,0.1) 100%)',
            style: 'cyberpunk',
            glitchAnimation: true,
            neonGrid: true,
          },
        },
        {
          type: 'features',
          props: {
            title: 'Platform Capabilities',
            subtitle: 'Everything you need in one futuristic ecosystem',
            columns: 4,
            style: 'holographic-cards',
            glowEffect: true,
            features: [
              {
                icon: '🛒',
                title: 'Digital Shop',
                description:
                  'Sell digital products, NFTs, and premium content with secure blockchain payments.',
                iconColor: '#00f0ff',
              },
              {
                icon: '🎓',
                title: 'eLearning Hub',
                description:
                  'Create and sell courses with our advanced LMS. Video, quizzes, and certifications.',
                iconColor: '#ff00ff',
              },
              {
                icon: '📝',
                title: 'Neural Blog',
                description:
                  'Share your thoughts with a cyberpunk-styled blog. Markdown, code blocks, and more.',
                iconColor: '#9d00ff',
              },
              {
                icon: '💬',
                title: 'Community Hub',
                description:
                  'Real-time messaging, forums, and social features. Connect with your audience.',
                iconColor: '#00a0ff',
              },
            ],
          },
        },
        {
          type: 'stats',
          props: {
            title: 'Platform Metrics',
            style: 'neon-counters',
            stats: [
              { value: '50K+', label: 'Active Users', icon: '👤' },
              { value: '10K+', label: 'Digital Products', icon: '📦' },
              { value: '500+', label: 'Courses', icon: '🎓' },
              { value: '99.9%', label: 'Uptime', icon: '⚡' },
            ],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Why Choose Neon District?',
            subtitle: 'Built for the future. Powered by innovation.',
            columns: 3,
            style: 'glass-panels',
            features: [
              {
                icon: '⚡',
                title: 'Real-time Everything',
                description:
                  'Live updates, instant notifications, and real-time collaboration powered by WebSockets.',
              },
              {
                icon: '🔒',
                title: 'Secure Payments',
                description:
                  'Stripe, crypto, and custom payment gateways. PCI-compliant and secure.',
              },
              {
                icon: '🧩',
                title: 'Modular Architecture',
                description: 'Headless CMS, API-first design. Build anything you can imagine.',
              },
              {
                icon: '🚀',
                title: 'Blazing Fast',
                description:
                  'Edge caching, lazy loading, and optimized delivery. Sub-second load times.',
              },
              {
                icon: '🎨',
                title: 'Fully Customizable',
                description:
                  'Theme editor, custom CSS, and component library. Make it truly yours.',
              },
              {
                icon: '📱',
                title: 'Mobile-First',
                description: 'Responsive design that looks stunning on every device.',
              },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Ready to Enter the Future?',
            subtitle: 'Join thousands of creators building on Neon District',
            ctaText: 'Get Started Free',
            ctaUrl: '/register',
            style: 'neon-frame',
            backgroundColor: 'transparent',
            borderGlow: true,
            glowColor: '#00f0ff',
          },
        },
        {
          type: 'footer',
          props: {
            style: 'cyberpunk',
            neonDivider: true,
            socialLinks: [
              { platform: 'twitter', url: '#', glowColor: '#00f0ff' },
              { platform: 'discord', url: '#', glowColor: '#7289da' },
              { platform: 'github', url: '#', glowColor: '#ffffff' },
            ],
            copyright: '© 2024 Neon District. All rights reserved. Built in the future.',
          },
        },
      ],
    },
    // PAGE 2 — SHOP (E-COMMERCE)
    {
      name: 'Shop',
      slug: 'shop',
      isHomePage: false,
      seo: {
        title: 'Digital Market District | Neon District',
        description:
          'Browse our cyberpunk digital marketplace. VR gear, software, and digital assets.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'DIGITAL MARKET DISTRICT',
            subtitle: 'Premium digital products, software, and virtual assets',
            backgroundImage: PRESET_IMAGES_CYBERPUNK.digitalMarket,
            alignment: 'center',
            overlayOpacity: 0.8,
            style: 'warehouse',
            neonTitle: true,
          },
        },
        {
          type: 'shopFilters',
          props: {
            style: 'cyberpunk-sidebar',
            filters: ['category', 'price', 'rating', 'type'],
            glowingToggles: true,
          },
        },
        {
          type: 'productGrid',
          props: {
            title: 'Featured Products',
            style: 'glassmorphic-cards',
            neonBorders: true,
            hoverGlow: true,
            products: [
              {
                image: PRESET_IMAGES_CYBERPUNK.products[0],
                name: 'Neural VR Headset Pro',
                price: '$499',
                rating: 4.9,
                category: 'Hardware',
                badge: 'Hot',
              },
              {
                image: PRESET_IMAGES_CYBERPUNK.products[1],
                name: 'Holographic Display Kit',
                price: '$299',
                rating: 4.8,
                category: 'Hardware',
                badge: 'New',
              },
              {
                image: PRESET_IMAGES_CYBERPUNK.products[2],
                name: 'CyberDeck Gaming Suite',
                price: '$149',
                rating: 4.7,
                category: 'Software',
              },
              {
                image: PRESET_IMAGES_CYBERPUNK.products[3],
                name: 'Data Viz Pro License',
                price: '$79',
                rating: 4.9,
                category: 'Software',
              },
            ],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Secure Shopping',
            columns: 4,
            style: 'icon-row',
            features: [
              { icon: '🔐', title: 'Encrypted Checkout', description: 'End-to-end encryption' },
              {
                icon: '⚡',
                title: 'Instant Delivery',
                description: 'Digital products delivered instantly',
              },
              { icon: '💳', title: 'Multiple Payment', description: 'Cards, crypto, and more' },
              { icon: '🔄', title: '30-Day Guarantee', description: 'Full refund, no questions' },
            ],
          },
        },
      ],
    },
    // PAGE 3 — E-LEARNING / LMS
    {
      name: 'Learn',
      slug: 'learn',
      isHomePage: false,
      seo: {
        title: 'Neural Academy | Learn Skills for the Future',
        description:
          'Master cutting-edge skills with our cyberpunk learning platform. Coding, AI, cybersecurity, and more.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'NEURAL ACADEMY',
            subtitle: 'Learn skills for the future. Master technology. Shape tomorrow.',
            backgroundImage: PRESET_IMAGES_CYBERPUNK.learning,
            alignment: 'center',
            overlayOpacity: 0.75,
            style: 'holographic-classroom',
            glitchSubtitle: true,
          },
        },
        {
          type: 'courseGrid',
          props: {
            title: 'Featured Courses',
            style: 'neon-cards',
            progressBars: true,
            skillIndicators: true,
            courses: [
              {
                image: PRESET_IMAGES_CYBERPUNK.courses[0],
                title: 'Advanced Python & AI',
                instructor: 'Dr. Sarah Chen',
                level: 'Advanced',
                duration: '40 hours',
                price: '$199',
                students: 2847,
                rating: 4.9,
                progress: 0,
                avatar: '👩‍💻',
              },
              {
                image: PRESET_IMAGES_CYBERPUNK.courses[1],
                title: 'Cybersecurity Mastery',
                instructor: 'Marcus Blackwell',
                level: 'Intermediate',
                duration: '35 hours',
                price: '$179',
                students: 1923,
                rating: 4.8,
                progress: 0,
                avatar: '🔐',
              },
              {
                image: PRESET_IMAGES_CYBERPUNK.courses[2],
                title: 'Machine Learning Ops',
                instructor: 'Dr. Aiko Tanaka',
                level: 'Advanced',
                duration: '50 hours',
                price: '$249',
                students: 1456,
                rating: 4.9,
                progress: 0,
                avatar: '🤖',
              },
            ],
          },
        },
        {
          type: 'features',
          props: {
            title: 'Learning Features',
            columns: 4,
            style: 'glass-panels',
            features: [
              {
                icon: '🎬',
                title: 'HD Video Lessons',
                description: 'Crystal clear video with neon-framed player',
              },
              {
                icon: '📊',
                title: 'Progress Tracking',
                description: 'Glowing checkpoints and completion stats',
              },
              {
                icon: '🏆',
                title: 'Certifications',
                description: 'Earn verified digital certificates',
              },
              { icon: '💬', title: 'Live Q&A', description: 'Real-time instructor support' },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Start Your Journey',
            subtitle: 'Access all courses with Premium membership',
            ctaText: 'Enroll Now',
            ctaUrl: '/register',
            style: 'neon-pulse',
            glowAnimation: true,
          },
        },
      ],
    },
    // PAGE 4 — BLOG
    {
      name: 'Blog',
      slug: 'blog',
      isHomePage: false,
      seo: {
        title: 'Neural Feed | Digital Journal',
        description: 'Tech insights, tutorials, and cyberpunk stories from the digital frontier.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'NEURAL FEED',
            subtitle: 'Digital Journal • Tech Insights • Future Visions',
            backgroundImage: PRESET_IMAGES_CYBERPUNK.dataStream,
            alignment: 'center',
            overlayOpacity: 0.8,
            style: 'data-stream',
            scanlineEffect: true,
          },
        },
        {
          type: 'blogGrid',
          props: {
            style: 'masonry-neon',
            glitchHover: true,
            neonTags: true,
            posts: [
              {
                image: PRESET_IMAGES_CYBERPUNK.blog[0],
                title: 'The Future of Human-AI Collaboration',
                excerpt:
                  'How artificial intelligence is reshaping creative workflows and what it means for the next decade.',
                category: 'AI',
                date: 'Dec 15, 2024',
                readTime: '8 min',
                author: 'Alex Nova',
              },
              {
                image: PRESET_IMAGES_CYBERPUNK.blog[1],
                title: 'Building Secure Systems in 2025',
                excerpt:
                  'Essential cybersecurity practices for modern applications. From zero-trust to quantum-safe encryption.',
                category: 'Security',
                date: 'Dec 12, 2024',
                readTime: '12 min',
                author: 'Marcus Black',
              },
              {
                image: PRESET_IMAGES_CYBERPUNK.blog[2],
                title: 'The Metaverse Economy',
                excerpt:
                  'Understanding digital ownership, virtual real estate, and the economics of virtual worlds.',
                category: 'Web3',
                date: 'Dec 10, 2024',
                readTime: '10 min',
                author: 'Jade Sterling',
              },
            ],
          },
        },
        {
          type: 'blogCategories',
          props: {
            style: 'neon-chips',
            categories: ['All', 'AI', 'Security', 'Web3', 'Tutorials', 'News', 'Reviews'],
          },
        },
        {
          type: 'newsletter',
          props: {
            title: 'Subscribe to Neural Feed',
            subtitle: 'Get the latest tech insights delivered to your inbox',
            style: 'cyberpunk-terminal',
            placeholder: 'enter@your.email',
            buttonText: 'Subscribe',
            glowInput: true,
          },
        },
      ],
    },
    // PAGE 5 — ABOUT / PLATFORM HUB
    {
      name: 'About',
      slug: 'about',
      isHomePage: false,
      seo: {
        title: 'About Neon District | Built for Scalability. Powered by Innovation.',
        description: 'Learn about our mission to build the future of digital platforms.',
      },
      blocks: [
        {
          type: 'hero',
          props: {
            title: 'BUILT FOR SCALABILITY',
            subtitle: 'Powered by Innovation. Designed for the Future.',
            backgroundImage: PRESET_IMAGES_CYBERPUNK.about,
            alignment: 'center',
            overlayOpacity: 0.75,
            style: 'vision-statement',
          },
        },
        {
          type: 'content',
          props: {
            style: 'glass-panel',
            title: 'Our Vision',
            content:
              'We believe technology should empower creators, not limit them. Neon District was built from the ground up to be the most flexible, powerful, and beautiful platform for digital entrepreneurs. Our mission is to democratize access to professional-grade tools that were once only available to large corporations.',
            image: PRESET_IMAGES_CYBERPUNK.team,
            imagePosition: 'right',
            neonAccents: true,
          },
        },
        {
          type: 'features',
          props: {
            title: 'Platform Architecture',
            subtitle: 'Enterprise-grade technology for everyone',
            columns: 2,
            style: 'tech-specs',
            features: [
              {
                icon: '🧩',
                title: 'Modular CMS',
                description:
                  'Headless architecture with flexible content modeling. Build any type of content structure you need.',
              },
              {
                icon: '🛒',
                title: 'Integrated E-commerce',
                description:
                  'Shop + LMS + Blog in one unified system. Sell products, courses, and subscriptions seamlessly.',
              },
              {
                icon: '⚡',
                title: 'Real-time Features',
                description:
                  'WebSocket-powered live updates, notifications, and collaboration tools built-in.',
              },
              {
                icon: '🔒',
                title: 'Enterprise Security',
                description:
                  'SOC 2 compliant, encrypted at rest and in transit, with role-based access control.',
              },
            ],
          },
        },
        {
          type: 'stats',
          props: {
            title: 'By the Numbers',
            style: 'holographic-counters',
            stats: [
              { value: '99.99%', label: 'Uptime SLA' },
              { value: '<50ms', label: 'API Response' },
              { value: '180+', label: 'Countries' },
              { value: '24/7', label: 'Support' },
            ],
          },
        },
        {
          type: 'cta',
          props: {
            title: 'Start Building Your Future',
            subtitle: 'Join the next generation of digital creators',
            ctaText: 'Get Started',
            ctaSecondaryText: 'Contact Sales',
            ctaUrl: '/register',
            ctaSecondaryUrl: '/contact',
            style: 'neon-frame-large',
            glowRings: true,
            borderAnimation: true,
          },
        },
      ],
    },
  ],
};

// ============================================
// EXPORT ALL PRESETS
// ============================================

export const AI_THEME_PRESETS: AiThemePreset[] = [
  CYBERPUNK_TECH_BLOG,
  LMS_PLATFORM,
  ECOMMERCE_STORE,
  CORPORATE_BUSINESS,
  CREATIVE_PORTFOLIO,
  SAAS_PRODUCT,
  RESTAURANT,
  HEALTHCARE,
  REAL_ESTATE,
  FITNESS_GYM,
  NONPROFIT,
  TRAVEL_TOURISM,
  FASHION,
  LAW_FIRM,
  EDUCATION_SCHOOL,
  AUTOMOTIVE,
  CYBERPUNK_NEON,
];

export const getPresetById = (id: string): AiThemePreset | undefined => {
  return AI_THEME_PRESETS.find((preset) => preset.id === id);
};

export const getPresetsByCategory = (category: PresetCategory): AiThemePreset[] => {
  return AI_THEME_PRESETS.filter((preset) => preset.category === category);
};

export const getPresetsByIndustry = (industry: IndustryType): AiThemePreset[] => {
  return AI_THEME_PRESETS.filter((preset) => preset.industry === industry);
};

export const searchPresets = (query: string): AiThemePreset[] => {
  const lowerQuery = query.toLowerCase();
  return AI_THEME_PRESETS.filter(
    (preset) =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery) ||
      preset.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
};
