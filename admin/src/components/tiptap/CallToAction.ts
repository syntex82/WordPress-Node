/**
 * Custom Tiptap Call-to-Action (CTA) Extension
 * Full-width CTA sections with heading, description, and button
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface CTAOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callToAction: {
      setCTA: (options: {
        heading: string;
        description: string;
        buttonText: string;
        buttonUrl: string;
        variant?: 'primary' | 'secondary' | 'gradient';
        align?: 'left' | 'center' | 'right';
      }) => ReturnType;
    };
  }
}

export const CallToAction = Node.create<CTAOptions>({
  name: 'callToAction',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      heading: { default: 'Ready to get started?' },
      description: { default: 'Join thousands of satisfied customers today.' },
      buttonText: { default: 'Get Started' },
      buttonUrl: { default: '#' },
      variant: { default: 'primary' },
      align: { default: 'center' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="cta"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { heading, description, buttonText, buttonUrl, variant, align } = HTMLAttributes;
    
    const variants: Record<string, { bg: string; text: string; btnBg: string; btnText: string }> = {
      primary: { bg: '#7c3aed', text: '#ffffff', btnBg: '#ffffff', btnText: '#7c3aed' },
      secondary: { bg: '#1f2937', text: '#ffffff', btnBg: '#f59e0b', btnText: '#1f2937' },
      gradient: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', btnBg: '#ffffff', btnText: '#667eea' },
    };

    const style = variants[variant] || variants.primary;
    const isGradient = variant === 'gradient';

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'cta',
        'data-variant': variant,
        class: `cta cta-${variant}`,
        style: `${isGradient ? 'background' : 'background-color'}: ${style.bg}; color: ${style.text}; padding: 3rem 2rem; border-radius: 1rem; text-align: ${align}; margin: 2rem 0;`,
      }),
      ['h2', { style: 'margin: 0 0 1rem; font-size: 1.75rem; font-weight: 700;' }, heading],
      ['p', { style: 'margin: 0 0 1.5rem; font-size: 1.125rem; opacity: 0.9;' }, description],
      ['a', {
        href: buttonUrl,
        style: `display: inline-block; padding: 0.875rem 2rem; background-color: ${style.btnBg}; color: ${style.btnText}; font-weight: 600; border-radius: 0.5rem; text-decoration: none; transition: transform 0.2s;`,
      }, buttonText],
    ];
  },

  addCommands() {
    return {
      setCTA:
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

