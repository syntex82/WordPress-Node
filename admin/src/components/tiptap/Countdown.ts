/**
 * Custom Tiptap Countdown Timer Extension
 * Countdown to a specific date/time
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface CountdownOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    countdown: {
      setCountdown: (options: {
        targetDate: string;
        title?: string;
        variant?: 'default' | 'compact' | 'flip';
        expiredMessage?: string;
      }) => ReturnType;
    };
  }
}

export const Countdown = Node.create<CountdownOptions>({
  name: 'countdown',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      targetDate: { default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      title: { default: null },
      variant: { default: 'default' },
      expiredMessage: { default: 'Event has ended' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="countdown"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { targetDate, title, variant, expiredMessage } = HTMLAttributes;
    
    const variantStyles: Record<string, { container: string; unit: string; label: string }> = {
      default: {
        container: 'display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;',
        unit: 'background: #7c3aed; color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; min-width: 80px; text-align: center;',
        label: 'font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.25rem; opacity: 0.8;',
      },
      compact: {
        container: 'display: flex; justify-content: center; gap: 0.25rem;',
        unit: 'background: #1f2937; color: white; padding: 0.5rem 0.75rem; border-radius: 0.25rem; text-align: center;',
        label: 'display: none;',
      },
      flip: {
        container: 'display: flex; justify-content: center; gap: 0.75rem;',
        unit: 'background: linear-gradient(180deg, #1f2937 50%, #111827 50%); color: white; padding: 1.25rem 1rem; border-radius: 0.5rem; min-width: 70px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);',
        label: 'font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.5rem; color: #9ca3af;',
      },
    };

    const style = variantStyles[variant] || variantStyles.default;

    const timeUnits = ['days', 'hours', 'mins', 'secs'];
    const placeholderValues = ['00', '00', '00', '00'];

    const unitElements = timeUnits.map((unit, index) => [
      'div',
      { style: style.unit, 'data-unit': unit },
      ['div', { style: 'font-size: 1.75rem; font-weight: 700; font-variant-numeric: tabular-nums;' }, placeholderValues[index]],
      ['div', { style: style.label }, unit],
    ]);

    const children: any[] = [];

    if (title) {
      children.push(['h3', { style: 'text-align: center; margin: 0 0 1rem; font-size: 1.25rem; font-weight: 600; color: #1f2937;' }, title]);
    }

    children.push(['div', { style: style.container, class: 'countdown-units' }, ...unitElements]);

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'countdown',
        'data-target': targetDate,
        'data-variant': variant,
        'data-expired-message': expiredMessage,
        class: `countdown countdown-${variant}`,
        style: 'margin: 2rem 0; padding: 1.5rem; background: #f9fafb; border-radius: 0.75rem; text-align: center;',
      }),
      ...children,
      ['p', { style: 'margin: 1rem 0 0; font-size: 0.75rem; color: #9ca3af;' }, '(Countdown will be live when published)'],
    ];
  },

  addCommands() {
    return {
      setCountdown:
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

