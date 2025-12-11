/**
 * Custom Tiptap Accordion/Collapsible Extension
 * Expandable sections with title and content
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface AccordionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    accordion: {
      setAccordion: (options: {
        title: string;
        content: string;
        defaultOpen?: boolean;
        variant?: 'default' | 'bordered' | 'filled';
      }) => ReturnType;
    };
  }
}

export const Accordion = Node.create<AccordionOptions>({
  name: 'accordion',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      title: { default: 'Click to expand' },
      content: { default: 'Accordion content goes here.' },
      defaultOpen: { default: false },
      variant: { default: 'default' },
    };
  },

  parseHTML() {
    return [{ tag: 'details[data-type="accordion"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { title, content, defaultOpen, variant } = HTMLAttributes;
    
    const variantStyles: Record<string, { details: string; summary: string; content: string }> = {
      default: {
        details: 'border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;',
        summary: 'padding: 1rem; background: #f9fafb; cursor: pointer; font-weight: 500; display: flex; justify-content: space-between; align-items: center; list-style: none;',
        content: 'padding: 1rem; border-top: 1px solid #e5e7eb;',
      },
      bordered: {
        details: 'border: 2px solid #7c3aed; border-radius: 0.5rem; overflow: hidden;',
        summary: 'padding: 1rem; background: transparent; cursor: pointer; font-weight: 500; color: #7c3aed; display: flex; justify-content: space-between; align-items: center; list-style: none;',
        content: 'padding: 1rem; border-top: 2px solid #7c3aed;',
      },
      filled: {
        details: 'border-radius: 0.5rem; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);',
        summary: 'padding: 1rem; background: #7c3aed; color: white; cursor: pointer; font-weight: 500; display: flex; justify-content: space-between; align-items: center; list-style: none;',
        content: 'padding: 1rem; background: white;',
      },
    };

    const style = variantStyles[variant] || variantStyles.default;

    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'accordion',
        'data-variant': variant,
        class: `accordion accordion-${variant}`,
        style: `${style.details} margin: 0.75rem 0;`,
        open: defaultOpen ? 'open' : undefined,
      }),
      [
        'summary',
        { style: style.summary },
        ['span', {}, title],
        ['span', { style: 'font-size: 1.25rem; transition: transform 0.2s;' }, '▾'],
      ],
      ['div', { style: style.content }, content],
    ];
  },

  addCommands() {
    return {
      setAccordion:
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

