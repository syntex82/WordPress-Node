/**
 * Custom Tiptap Testimonial/Quote Extension
 * Testimonials with quote, author, role, and avatar
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface TestimonialOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    testimonial: {
      setTestimonial: (options: {
        quote: string;
        author: string;
        role?: string;
        avatar?: string;
        variant?: 'default' | 'card' | 'bubble' | 'minimal';
      }) => ReturnType;
    };
  }
}

export const Testimonial = Node.create<TestimonialOptions>({
  name: 'testimonial',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      quote: { default: 'This is an amazing product!' },
      author: { default: 'John Doe' },
      role: { default: null },
      avatar: { default: null },
      variant: { default: 'default' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="testimonial"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { quote, author, role, avatar, variant } = HTMLAttributes;
    
    const variantStyles: Record<string, { container: string; quote: string }> = {
      default: {
        container: 'background: #f9fafb; border-left: 4px solid #7c3aed; padding: 1.5rem; border-radius: 0 0.5rem 0.5rem 0;',
        quote: 'font-size: 1.125rem; font-style: italic; color: #374151; margin: 0 0 1rem;',
      },
      card: {
        container: 'background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center;',
        quote: 'font-size: 1.125rem; font-style: italic; color: #374151; margin: 0 0 1.5rem;',
      },
      bubble: {
        container: 'background: #7c3aed; color: white; padding: 1.5rem; border-radius: 1rem 1rem 0 1rem; position: relative;',
        quote: 'font-size: 1rem; margin: 0; line-height: 1.6;',
      },
      minimal: {
        container: 'padding: 1rem 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;',
        quote: 'font-size: 1.25rem; font-style: italic; color: #1f2937; margin: 0 0 1rem;',
      },
    };

    const style = variantStyles[variant] || variantStyles.default;
    const isBubble = variant === 'bubble';
    const isCard = variant === 'card';

    const authorSection: any[] = [];
    
    if (avatar) {
      authorSection.push(['img', { 
        src: avatar, 
        alt: author,
        style: `width: 48px; height: 48px; border-radius: 50%; object-fit: cover; ${isCard ? 'margin: 0 auto 0.75rem;' : 'margin-right: 0.75rem;'}`,
      }]);
    }

    const authorInfo = [
      'div',
      { style: isCard ? 'text-align: center;' : '' },
      ['strong', { style: `display: block; color: ${isBubble ? 'white' : '#1f2937'};` }, author],
      role ? ['span', { style: `font-size: 0.875rem; color: ${isBubble ? 'rgba(255,255,255,0.8)' : '#6b7280'};` }, role] : '',
    ];

    authorSection.push(authorInfo);

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'testimonial',
        'data-variant': variant,
        class: `testimonial testimonial-${variant}`,
        style: `${style.container} margin: 1.5rem 0;`,
      }),
      ['div', { style: 'font-size: 2rem; color: #7c3aed; margin-bottom: 0.5rem;' }, '❝'],
      ['p', { style: style.quote }, quote],
      ['div', { style: `display: flex; align-items: center; ${isCard ? 'flex-direction: column;' : ''}` }, ...authorSection],
    ];
  },

  addCommands() {
    return {
      setTestimonial:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

