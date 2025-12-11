/**
 * Custom Tiptap Divider/Separator Extension
 * Supports different styles: solid, dashed, dotted, gradient, fancy
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface DividerOptions {
  HTMLAttributes: Record<string, any>;
}

export type DividerStyle = 'solid' | 'dashed' | 'dotted' | 'gradient' | 'fancy';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    divider: {
      setDivider: (options?: { style?: DividerStyle; width?: string }) => ReturnType;
    };
  }
}

export const Divider = Node.create<DividerOptions>({
  name: 'divider',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      style: { default: 'solid' },
      width: { default: '100%' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="divider"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { style: dividerStyle, width } = HTMLAttributes;
    
    const styleMap: Record<DividerStyle, string> = {
      solid: `border-top: 2px solid #e5e7eb; margin: 2rem auto;`,
      dashed: `border-top: 2px dashed #9ca3af; margin: 2rem auto;`,
      dotted: `border-top: 3px dotted #9ca3af; margin: 2rem auto;`,
      gradient: `height: 3px; background: linear-gradient(90deg, transparent, #7c3aed, transparent); margin: 2rem auto; border: none;`,
      fancy: `height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent); margin: 2rem auto; border: none; position: relative;`,
    };

    const css = styleMap[dividerStyle as DividerStyle] || styleMap.solid;

    if (dividerStyle === 'fancy') {
      return [
        'div',
        mergeAttributes(this.options.HTMLAttributes, {
          'data-type': 'divider',
          'data-style': dividerStyle,
          style: `width: ${width}; text-align: center; margin: 2rem auto;`,
        }),
        ['hr', { style: `${css} width: 100%;` }],
        ['span', { 
          style: 'display: inline-block; position: relative; top: -0.75rem; background: white; padding: 0 1rem; color: #9ca3af; font-size: 1.25rem;' 
        }, '✦'],
      ];
    }

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'divider',
        'data-style': dividerStyle,
        style: `width: ${width}; ${css}`,
      }),
    ];
  },

  addCommands() {
    return {
      setDivider:
        (options = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

