/**
 * Custom Tiptap Alert/Notification Extension
 * Supports info, warning, success, error variants
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface AlertOptions {
  HTMLAttributes: Record<string, any>;
}

export type AlertVariant = 'info' | 'warning' | 'success' | 'error';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    alert: {
      setAlert: (options: { variant: AlertVariant; title?: string; content: string }) => ReturnType;
    };
  }
}

export const Alert = Node.create<AlertOptions>({
  name: 'alert',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      variant: {
        default: 'info',
      },
      title: {
        default: null,
      },
      content: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="alert"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { variant, title, content } = HTMLAttributes;
    
    const variantStyles: Record<AlertVariant, { bg: string; border: string; icon: string }> = {
      info: { bg: '#e0f2fe', border: '#0ea5e9', icon: 'ℹ️' },
      warning: { bg: '#fef3c7', border: '#f59e0b', icon: '⚠️' },
      success: { bg: '#dcfce7', border: '#22c55e', icon: '✅' },
      error: { bg: '#fee2e2', border: '#ef4444', icon: '❌' },
    };

    const style = variantStyles[variant as AlertVariant] || variantStyles.info;

    const children: any[] = [
      ['span', { class: 'alert-icon', style: 'font-size: 1.25rem; margin-right: 0.75rem;' }, style.icon],
      ['div', { class: 'alert-content' },
        title ? ['strong', { class: 'alert-title', style: 'display: block; margin-bottom: 0.25rem;' }, title] : '',
        ['span', { class: 'alert-text' }, content],
      ],
    ];

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'alert',
        'data-variant': variant,
        class: `alert alert-${variant}`,
        style: `display: flex; align-items: flex-start; padding: 1rem; border-radius: 0.5rem; background-color: ${style.bg}; border-left: 4px solid ${style.border}; margin: 1rem 0;`,
      }),
      ...children,
    ];
  },

  addCommands() {
    return {
      setAlert:
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

