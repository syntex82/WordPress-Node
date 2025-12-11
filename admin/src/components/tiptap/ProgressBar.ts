/**
 * Custom Tiptap Progress Bar Extension
 * Visual progress indicators with labels
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface ProgressBarOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    progressBar: {
      setProgressBar: (options: {
        label?: string;
        value: number;
        max?: number;
        showPercentage?: boolean;
        variant?: 'default' | 'striped' | 'gradient' | 'thin';
        color?: 'violet' | 'blue' | 'green' | 'red' | 'yellow';
      }) => ReturnType;
    };
  }
}

export const ProgressBar = Node.create<ProgressBarOptions>({
  name: 'progressBar',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      label: { default: null },
      value: { default: 50 },
      max: { default: 100 },
      showPercentage: { default: true },
      variant: { default: 'default' },
      color: { default: 'violet' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="progress"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { label, value, max, showPercentage, variant, color } = HTMLAttributes;
    const percentage = Math.round((value / max) * 100);
    
    const colors: Record<string, string> = {
      violet: '#7c3aed',
      blue: '#3b82f6',
      green: '#22c55e',
      red: '#ef4444',
      yellow: '#eab308',
    };

    const bgColor = colors[color] || colors.violet;

    const variantStyles: Record<string, string> = {
      default: `background: ${bgColor};`,
      striped: `background: repeating-linear-gradient(45deg, ${bgColor}, ${bgColor} 10px, ${bgColor}dd 10px, ${bgColor}dd 20px);`,
      gradient: `background: linear-gradient(90deg, ${bgColor}88, ${bgColor});`,
      thin: `background: ${bgColor};`,
    };

    const barStyle = variantStyles[variant] || variantStyles.default;
    const height = variant === 'thin' ? '4px' : '24px';

    const children: any[] = [];

    if (label) {
      children.push([
        'div',
        { style: 'display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;' },
        ['span', { style: 'font-weight: 500; color: #374151;' }, label],
        showPercentage ? ['span', { style: 'color: #6b7280;' }, `${percentage}%`] : '',
      ]);
    }

    children.push([
      'div',
      { 
        style: `background: #e5e7eb; border-radius: 9999px; overflow: hidden; height: ${height};`,
        role: 'progressbar',
        'aria-valuenow': value,
        'aria-valuemin': 0,
        'aria-valuemax': max,
      },
      ['div', { 
        style: `${barStyle} height: 100%; border-radius: 9999px; width: ${percentage}%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center;`,
      }, 
        variant !== 'thin' && showPercentage && !label ? ['span', { style: 'font-size: 0.75rem; font-weight: 600; color: white;' }, `${percentage}%`] : '',
      ],
    ]);

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'progress',
        'data-variant': variant,
        class: `progress progress-${variant}`,
        style: 'margin: 1rem 0;',
      }),
      ...children,
    ];
  },

  addCommands() {
    return {
      setProgressBar:
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

