/**
 * Custom Tiptap Button/CTA Extension
 * Supports multiple button styles: primary, secondary, outline, ghost
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface ButtonOptions {
  HTMLAttributes: Record<string, any>;
}

export type ButtonStyle = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    button: {
      setButton: (options: {
        text: string;
        url: string;
        style?: ButtonStyle;
        size?: ButtonSize;
        fullWidth?: boolean;
      }) => ReturnType;
    };
  }
}

export const Button = Node.create<ButtonOptions>({
  name: 'button',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      text: { default: 'Click me' },
      url: { default: '#' },
      style: { default: 'primary' },
      size: { default: 'md' },
      fullWidth: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="button"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { text, url, style, size, fullWidth } = HTMLAttributes;

    const styleMap: Record<ButtonStyle, string> = {
      primary: 'background: #7c3aed; color: white; border: 2px solid #7c3aed;',
      secondary: 'background: #1f2937; color: white; border: 2px solid #1f2937;',
      outline: 'background: transparent; color: #7c3aed; border: 2px solid #7c3aed;',
      ghost: 'background: transparent; color: #7c3aed; border: 2px solid transparent;',
    };

    const sizeMap: Record<ButtonSize, string> = {
      sm: 'padding: 0.5rem 1rem; font-size: 0.875rem;',
      md: 'padding: 0.75rem 1.5rem; font-size: 1rem;',
      lg: 'padding: 1rem 2rem; font-size: 1.125rem;',
    };

    const buttonStyle = styleMap[style as ButtonStyle] || styleMap.primary;
    const buttonSize = sizeMap[size as ButtonSize] || sizeMap.md;
    const widthStyle = fullWidth ? 'width: 100%; text-align: center;' : '';

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'button',
        'data-style': style,
        'data-size': size,
        class: 'button-wrapper',
        style: 'margin: 1rem 0;',
      }),
      [
        'a',
        {
          href: url,
          class: `btn btn-${style}`,
          style: `display: inline-block; ${buttonStyle} ${buttonSize} ${widthStyle} font-weight: 600; text-decoration: none; border-radius: 0.5rem; transition: all 0.2s; cursor: pointer;`,
        },
        text,
      ],
    ];
  },

  addCommands() {
    return {
      setButton:
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

