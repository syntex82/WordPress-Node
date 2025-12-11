/**
 * Custom Tiptap Card Extension
 * Cards with image, title, description, and optional button
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface CardOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    card: {
      setCard: (options: {
        image?: string;
        title: string;
        description: string;
        buttonText?: string;
        buttonUrl?: string;
        variant?: 'default' | 'elevated' | 'bordered' | 'horizontal';
      }) => ReturnType;
    };
  }
}

export const Card = Node.create<CardOptions>({
  name: 'card',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      image: { default: null },
      title: { default: 'Card Title' },
      description: { default: 'Card description goes here.' },
      buttonText: { default: null },
      buttonUrl: { default: null },
      variant: { default: 'default' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="card"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { image, title, description, buttonText, buttonUrl, variant } = HTMLAttributes;
    
    const variantStyles: Record<string, string> = {
      default: 'background: #ffffff; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);',
      elevated: 'background: #ffffff; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.15);',
      bordered: 'background: #ffffff; border-radius: 0.75rem; overflow: hidden; border: 2px solid #e5e7eb;',
      horizontal: 'background: #ffffff; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: stretch;',
    };

    const isHorizontal = variant === 'horizontal';
    const cardStyle = variantStyles[variant] || variantStyles.default;

    const children: any[] = [];

    if (image) {
      children.push([
        'div',
        { style: isHorizontal ? 'width: 200px; flex-shrink: 0;' : '' },
        ['img', { 
          src: image, 
          alt: title,
          style: `width: 100%; height: ${isHorizontal ? '100%' : '200px'}; object-fit: cover; display: block;` 
        }],
      ]);
    }

    const contentChildren: any[] = [
      ['h3', { style: 'margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 600; color: #1f2937;' }, title],
      ['p', { style: 'margin: 0; color: #6b7280; font-size: 0.875rem; line-height: 1.5;' }, description],
    ];

    if (buttonText && buttonUrl) {
      contentChildren.push([
        'a',
        {
          href: buttonUrl,
          style: 'display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #7c3aed; color: white; border-radius: 0.375rem; text-decoration: none; font-size: 0.875rem; font-weight: 500;',
        },
        buttonText,
      ]);
    }

    children.push([
      'div',
      { style: 'padding: 1.25rem; flex: 1;' },
      ...contentChildren,
    ]);

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'card',
        'data-variant': variant,
        class: `card card-${variant}`,
        style: `${cardStyle} margin: 1rem 0; max-width: ${isHorizontal ? '100%' : '400px'};`,
      }),
      ...children,
    ];
  },

  addCommands() {
    return {
      setCard:
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

