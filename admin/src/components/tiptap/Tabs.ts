/**
 * Custom Tiptap Tabs Extension
 * Tabbed content for organizing information
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface TabsOptions {
  HTMLAttributes: Record<string, any>;
}

interface TabItem {
  title: string;
  content: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tabs: {
      setTabs: (options: {
        tabs: TabItem[];
        variant?: 'default' | 'pills' | 'underline';
      }) => ReturnType;
    };
  }
}

export const Tabs = Node.create<TabsOptions>({
  name: 'tabs',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      tabs: { 
        default: [
          { title: 'Tab 1', content: 'Content for tab 1' },
          { title: 'Tab 2', content: 'Content for tab 2' },
        ],
      },
      variant: { default: 'default' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tabs"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { tabs, variant } = HTMLAttributes;
    const tabsList = Array.isArray(tabs) ? tabs : JSON.parse(tabs || '[]');
    
    const variantStyles: Record<string, { container: string; tabBtn: string; tabBtnActive: string; panel: string }> = {
      default: {
        container: '',
        tabBtn: 'padding: 0.75rem 1.25rem; background: #f3f4f6; border: none; cursor: pointer; font-size: 0.875rem;',
        tabBtnActive: 'padding: 0.75rem 1.25rem; background: #7c3aed; color: white; border: none; cursor: pointer; font-size: 0.875rem;',
        panel: 'padding: 1.5rem; background: #f9fafb; border-radius: 0 0.5rem 0.5rem 0.5rem;',
      },
      pills: {
        container: 'display: flex; gap: 0.5rem; margin-bottom: 1rem;',
        tabBtn: 'padding: 0.5rem 1rem; background: #f3f4f6; border: none; cursor: pointer; font-size: 0.875rem; border-radius: 9999px;',
        tabBtnActive: 'padding: 0.5rem 1rem; background: #7c3aed; color: white; border: none; cursor: pointer; font-size: 0.875rem; border-radius: 9999px;',
        panel: 'padding: 1rem;',
      },
      underline: {
        container: 'display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 1rem;',
        tabBtn: 'padding: 0.75rem 1.25rem; background: transparent; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-size: 0.875rem;',
        tabBtnActive: 'padding: 0.75rem 1.25rem; background: transparent; border: none; border-bottom: 2px solid #7c3aed; margin-bottom: -2px; cursor: pointer; font-size: 0.875rem; color: #7c3aed; font-weight: 500;',
        panel: 'padding: 1rem;',
      },
    };

    const style = variantStyles[variant] || variantStyles.default;
    const tabId = `tabs-${Date.now()}`;

    const tabButtons = tabsList.map((tab: TabItem, index: number) => [
      'button',
      { 
        style: index === 0 ? style.tabBtnActive : style.tabBtn,
        'data-tab': `${tabId}-${index}`,
        type: 'button',
      },
      tab.title,
    ]);

    const tabPanels = tabsList.map((tab: TabItem, index: number) => [
      'div',
      { 
        style: `${style.panel} ${index === 0 ? '' : 'display: none;'}`,
        'data-panel': `${tabId}-${index}`,
      },
      tab.content,
    ]);

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'tabs',
        'data-variant': variant,
        class: `tabs tabs-${variant}`,
        style: 'margin: 1.5rem 0;',
      }),
      ['div', { style: style.container, class: 'tabs-nav' }, ...tabButtons],
      ['div', { class: 'tabs-panels' }, ...tabPanels],
    ];
  },

  addCommands() {
    return {
      setTabs:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              tabs: JSON.stringify(options.tabs),
            },
          });
        },
    };
  },
});

