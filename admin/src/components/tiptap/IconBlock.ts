/**
 * Custom Tiptap Icon Block Extension
 * Icons with optional text and styling
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface IconBlockOptions {
  HTMLAttributes: Record<string, any>;
}

// Common icon set (emoji-based for simplicity, can be replaced with icon library)
export const ICON_SET = {
  check: '✓',
  cross: '✗',
  star: '★',
  heart: '❤️',
  fire: '🔥',
  rocket: '🚀',
  lightbulb: '💡',
  target: '🎯',
  trophy: '🏆',
  clock: '⏰',
  calendar: '📅',
  mail: '✉️',
  phone: '📞',
  location: '📍',
  user: '👤',
  settings: '⚙️',
  lock: '🔒',
  unlock: '🔓',
  warning: '⚠️',
  info: 'ℹ️',
  dollar: '💵',
  gift: '🎁',
  thumbsup: '👍',
  sparkles: '✨',
  bolt: '⚡',
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iconBlock: {
      setIconBlock: (options: {
        icon: keyof typeof ICON_SET | string;
        text?: string;
        size?: 'sm' | 'md' | 'lg' | 'xl';
        color?: string;
        variant?: 'inline' | 'stacked' | 'badge';
      }) => ReturnType;
    };
  }
}

export const IconBlock = Node.create<IconBlockOptions>({
  name: 'iconBlock',

  group: 'block',

  inline: false,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      icon: { default: 'star' },
      text: { default: null },
      size: { default: 'md' },
      color: { default: '#7c3aed' },
      variant: { default: 'inline' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="icon-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { icon, text, size, color, variant } = HTMLAttributes;
    const iconChar = ICON_SET[icon as keyof typeof ICON_SET] || icon;
    
    const sizes: Record<string, { icon: string; text: string }> = {
      sm: { icon: '1rem', text: '0.875rem' },
      md: { icon: '1.5rem', text: '1rem' },
      lg: { icon: '2rem', text: '1.125rem' },
      xl: { icon: '3rem', text: '1.25rem' },
    };

    const sizeStyle = sizes[size] || sizes.md;

    const variantStyles: Record<string, { container: string; icon: string }> = {
      inline: {
        container: 'display: inline-flex; align-items: center; gap: 0.5rem;',
        icon: `font-size: ${sizeStyle.icon}; line-height: 1;`,
      },
      stacked: {
        container: 'display: flex; flex-direction: column; align-items: center; gap: 0.5rem; text-align: center;',
        icon: `font-size: ${sizeStyle.icon}; line-height: 1;`,
      },
      badge: {
        container: `display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: ${color}15; border-radius: 9999px;`,
        icon: `font-size: ${sizeStyle.icon}; line-height: 1;`,
      },
    };

    const style = variantStyles[variant] || variantStyles.inline;

    const children: any[] = [
      ['span', { style: style.icon, class: 'icon-emoji' }, iconChar],
    ];

    if (text) {
      children.push([
        'span',
        { style: `font-size: ${sizeStyle.text}; color: #374151;` },
        text,
      ]);
    }

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'icon-block',
        'data-icon': icon,
        'data-variant': variant,
        class: `icon-block icon-block-${variant}`,
        style: `${style.container} margin: 0.5rem 0;`,
      }),
      ...children,
    ];
  },

  addCommands() {
    return {
      setIconBlock:
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

