import { Injectable } from '@nestjs/common';

export interface CustomizationPreset {
  id: string;
  name: string;
  description: string;
  category: 'page' | 'post' | 'both';
  settings: {
    layout?: string;
    backgroundColor?: string;
    textColor?: string;
    showHeader?: boolean;
    showFooter?: boolean;
    showSidebar?: boolean;
    customCSS?: string;
    [key: string]: any;
  };
}

@Injectable()
export class CustomizationPresetsService {
  private presets: CustomizationPreset[] = [
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and minimal design with no sidebar',
      category: 'both',
      settings: {
        layout: 'full-width',
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
    },
    {
      id: 'sidebar-right',
      name: 'Sidebar Right',
      description: 'Default layout with sidebar on the right',
      category: 'both',
      settings: {
        layout: 'sidebar-right',
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
    },
    {
      id: 'sidebar-left',
      name: 'Sidebar Left',
      description: 'Layout with sidebar on the left',
      category: 'both',
      settings: {
        layout: 'sidebar-left',
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
    },
    {
      id: 'dark-mode',
      name: 'Dark Mode',
      description: 'Dark theme with light text',
      category: 'both',
      settings: {
        layout: 'default',
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        customCSS: 'body { background-color: #1a1a1a; color: #ffffff; }',
      },
    },
    {
      id: 'blog-focused',
      name: 'Blog Focused',
      description: 'Optimized for blog posts with author and date',
      category: 'post',
      settings: {
        layout: 'full-width',
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        showAuthor: true,
        showDate: true,
        showCategory: true,
        showTags: true,
        showRelatedPosts: true,
        relatedPostsCount: 5,
      },
    },
    {
      id: 'landing-page',
      name: 'Landing Page',
      description: 'Full-width layout without header and footer',
      category: 'page',
      settings: {
        layout: 'full-width',
        showHeader: false,
        showFooter: false,
        showSidebar: false,
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
    },
    {
      id: 'product-showcase',
      name: 'Product Showcase',
      description: 'Minimal layout for product pages',
      category: 'page',
      settings: {
        layout: 'full-width',
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        backgroundColor: '#f8f9fa',
        textColor: '#000000',
      },
    },
    {
      id: 'course-page',
      name: 'Course Page',
      description: 'Optimized layout for course pages',
      category: 'page',
      settings: {
        layout: 'sidebar-right',
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
    },
  ];

  /**
   * Get all available presets
   */
  getAllPresets(): CustomizationPreset[] {
    return this.presets;
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: 'page' | 'post' | 'both'): CustomizationPreset[] {
    return this.presets.filter((p) => p.category === category || p.category === 'both');
  }

  /**
   * Get preset by ID
   */
  getPresetById(id: string): CustomizationPreset | undefined {
    return this.presets.find((p) => p.id === id);
  }

  /**
   * Get preset settings by ID
   */
  getPresetSettings(id: string): any | undefined {
    const preset = this.getPresetById(id);
    return preset?.settings;
  }

  /**
   * Add custom preset
   */
  addPreset(preset: Omit<CustomizationPreset, 'id'>): CustomizationPreset {
    const newPreset: CustomizationPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
    };
    this.presets.push(newPreset);
    return newPreset;
  }

  /**
   * Remove preset
   */
  removePreset(id: string): boolean {
    const index = this.presets.findIndex((p) => p.id === id);
    if (index > -1) {
      this.presets.splice(index, 1);
      return true;
    }
    return false;
  }
}
