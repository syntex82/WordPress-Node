/**
 * Custom Tiptap Table of Contents Extension
 * Auto-generated navigation from headings
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface TableOfContentsOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContents: {
      setTableOfContents: (options?: {
        title?: string;
        variant?: 'default' | 'boxed' | 'sidebar';
        levels?: number[];
      }) => ReturnType;
    };
  }
}

export const TableOfContents = Node.create<TableOfContentsOptions>({
  name: 'tableOfContents',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      title: { default: 'Table of Contents' },
      variant: { default: 'default' },
      levels: { default: [2, 3] }, // H2 and H3 by default
    };
  },

  parseHTML() {
    return [{ tag: 'nav[data-type="toc"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { title, variant } = HTMLAttributes;
    
    const variantStyles: Record<string, { nav: string; title: string; list: string }> = {
      default: {
        nav: 'background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.25rem;',
        title: 'font-size: 1rem; font-weight: 600; color: #1f2937; margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.5rem;',
        list: 'list-style: none; padding: 0; margin: 0;',
      },
      boxed: {
        nav: 'background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 2px solid #c4b5fd; border-radius: 0.75rem; padding: 1.5rem;',
        title: 'font-size: 1.125rem; font-weight: 600; color: #7c3aed; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.5rem;',
        list: 'list-style: none; padding: 0; margin: 0;',
      },
      sidebar: {
        nav: 'border-left: 3px solid #7c3aed; padding-left: 1rem;',
        title: 'font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.75rem;',
        list: 'list-style: none; padding: 0; margin: 0;',
      },
    };

    const style = variantStyles[variant] || variantStyles.default;

    // The actual TOC list items would be generated dynamically on the frontend
    // This is a placeholder that shows the structure
    return [
      'nav',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'toc',
        'data-variant': variant,
        class: `toc toc-${variant}`,
        style: `${style.nav} margin: 1.5rem 0;`,
        'aria-label': 'Table of contents',
      }),
      ['div', { style: style.title }, 
        ['span', { style: 'font-size: 1.25em;' }, '📑'],
        title,
      ],
      ['ol', { style: `${style.list}`, class: 'toc-list' },
        ['li', { style: 'padding: 0.375rem 0; border-bottom: 1px dashed #e5e7eb;' },
          ['a', { href: '#', style: 'color: #6b7280; text-decoration: none; font-size: 0.875rem;' }, 
            ['span', { style: 'color: #9ca3af; margin-right: 0.5rem;' }, '1.'],
            'Section Heading',
          ],
        ],
        ['li', { style: 'padding: 0.375rem 0 0.375rem 1rem; border-bottom: 1px dashed #e5e7eb;' },
          ['a', { href: '#', style: 'color: #9ca3af; text-decoration: none; font-size: 0.8125rem;' }, 
            ['span', { style: 'color: #d1d5db; margin-right: 0.5rem;' }, '1.1'],
            'Subsection',
          ],
        ],
      ],
      ['p', { style: 'font-size: 0.75rem; color: #9ca3af; margin: 0.75rem 0 0; font-style: italic;' }, 
        '(Auto-generated from headings when published)',
      ],
    ];
  },

  addCommands() {
    return {
      setTableOfContents:
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

