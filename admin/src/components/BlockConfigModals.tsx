/**
 * Block Configuration Modals
 * Modal forms for configuring various content blocks before insertion
 */

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { AlertVariant } from './tiptap/Alert';
import { ButtonStyle, ButtonSize } from './tiptap/Button';
import { DividerStyle } from './tiptap/Divider';
import { SocialPlatform } from './tiptap/SocialEmbed';

interface ModalProps {
  onClose: () => void;
}

// Alert Configuration Modal
interface AlertModalProps extends ModalProps {
  onInsert: (data: { variant: AlertVariant; title?: string; content: string }) => void;
}

export function AlertConfigModal({ onInsert, onClose }: AlertModalProps) {
  const [variant, setVariant] = useState<AlertVariant>('info');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const variants: { id: AlertVariant; label: string; color: string }[] = [
    { id: 'info', label: 'Info', color: '#0ea5e9' },
    { id: 'success', label: 'Success', color: '#22c55e' },
    { id: 'warning', label: 'Warning', color: '#f59e0b' },
    { id: 'error', label: 'Error', color: '#ef4444' },
  ];

  return (
    <ConfigModalWrapper title="Add Alert Box" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="grid grid-cols-4 gap-2">
            {variants.map(v => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                className={`p-2 rounded-lg border-2 text-sm font-medium ${
                  variant === v.id ? 'border-violet-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: `${v.color}20`, color: v.color }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" placeholder="Alert title..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Alert message..." />
        </div>
        <button
          onClick={() => content && onInsert({ variant, title: title || undefined, content })}
          disabled={!content}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
        >
          Insert Alert
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// Button Configuration Modal
interface ButtonModalProps extends ModalProps {
  onInsert: (data: { text: string; url: string; style: ButtonStyle; size: ButtonSize; fullWidth: boolean }) => void;
}

export function ButtonConfigModal({ onInsert, onClose }: ButtonModalProps) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState<ButtonStyle>('primary');
  const [size, setSize] = useState<ButtonSize>('md');
  const [fullWidth, setFullWidth] = useState(false);

  const styles: ButtonStyle[] = ['primary', 'secondary', 'outline', 'ghost'];
  const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

  return (
    <ConfigModalWrapper title="Add Button" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Button Text *</label>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" placeholder="Click me" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
          <div className="flex gap-2">
            {styles.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${style === s ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
          <div className="flex gap-2">
            {sizes.map(s => (
              <button key={s} onClick={() => setSize(s)}
                className={`px-3 py-1.5 rounded-lg text-sm uppercase ${size === s ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={fullWidth} onChange={(e) => setFullWidth(e.target.checked)} />
          <span className="text-sm text-gray-700">Full width</span>
        </label>
        <button onClick={() => text && url && onInsert({ text, url, style, size, fullWidth })}
          disabled={!text || !url}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
          Insert Button
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// Divider Configuration Modal
interface DividerModalProps extends ModalProps {
  onInsert: (data: { style: DividerStyle }) => void;
}

export function DividerConfigModal({ onInsert, onClose }: DividerModalProps) {
  const [style, setStyle] = useState<DividerStyle>('solid');
  const styles: DividerStyle[] = ['solid', 'dashed', 'dotted', 'gradient', 'fancy'];

  return (
    <ConfigModalWrapper title="Add Divider" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
          <div className="space-y-2">
            {styles.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className={`w-full p-3 rounded-lg border-2 text-left capitalize ${style === s ? 'border-violet-500 bg-violet-50' : 'border-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => onInsert({ style })}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
          Insert Divider
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// CTA Configuration Modal
interface CTAModalProps extends ModalProps {
  onInsert: (data: { heading: string; description: string; buttonText: string; buttonUrl: string; variant: string }) => void;
}

export function CTAConfigModal({ onInsert, onClose }: CTAModalProps) {
  const [heading, setHeading] = useState('Ready to get started?');
  const [description, setDescription] = useState('Join thousands of satisfied customers today.');
  const [buttonText, setButtonText] = useState('Get Started');
  const [buttonUrl, setButtonUrl] = useState('#');
  const [variant, setVariant] = useState('primary');

  return (
    <ConfigModalWrapper title="Add CTA Section" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
          <input type="text" value={heading} onChange={(e) => setHeading(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
            <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
            <input type="text" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
          <div className="flex gap-2">
            {['primary', 'secondary', 'gradient'].map(v => (
              <button key={v} onClick={() => setVariant(v)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${variant === v ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => onInsert({ heading, description, buttonText, buttonUrl, variant })}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
          Insert CTA
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// Social Embed Configuration Modal
interface SocialModalProps extends ModalProps {
  onInsert: (data: { platform: SocialPlatform; url: string }) => void;
}

export function SocialConfigModal({ onInsert, onClose }: SocialModalProps) {
  const [platform, setPlatform] = useState<SocialPlatform>('twitter');
  const [url, setUrl] = useState('');

  return (
    <ConfigModalWrapper title="Add Social Embed" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
          <div className="flex gap-2">
            {(['twitter', 'instagram', 'facebook'] as SocialPlatform[]).map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className={`px-4 py-2 rounded-lg text-sm capitalize ${platform === p ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Post URL *</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" placeholder="https://twitter.com/..." />
        </div>
        <button onClick={() => url && onInsert({ platform, url })} disabled={!url}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
          Insert Embed
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// Card Configuration Modal
interface CardModalProps extends ModalProps {
  onInsert: (data: { title: string; description: string; image?: string; buttonText?: string; buttonUrl?: string; variant: string }) => void;
}

export function CardConfigModal({ onInsert, onClose }: CardModalProps) {
  const [title, setTitle] = useState('Card Title');
  const [description, setDescription] = useState('Card description goes here.');
  const [image, setImage] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [variant, setVariant] = useState('default');

  return (
    <ConfigModalWrapper title="Add Card" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
          <input type="text" value={image} onChange={(e) => setImage(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
            <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
            <input type="text" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
          <div className="flex gap-2 flex-wrap">
            {['default', 'elevated', 'bordered', 'horizontal'].map(v => (
              <button key={v} onClick={() => setVariant(v)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${variant === v ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => title && description && onInsert({ title, description, image: image || undefined, buttonText: buttonText || undefined, buttonUrl: buttonUrl || undefined, variant })}
          disabled={!title || !description}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
          Insert Card
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// Testimonial Configuration Modal
interface TestimonialModalProps extends ModalProps {
  onInsert: (data: { quote: string; author: string; role?: string; avatar?: string; variant: string }) => void;
}

export function TestimonialConfigModal({ onInsert, onClose }: TestimonialModalProps) {
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [variant, setVariant] = useState('default');

  return (
    <ConfigModalWrapper title="Add Testimonial" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quote *</label>
          <textarea value={quote} onChange={(e) => setQuote(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="What they said..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg" placeholder="CEO, Company" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
          <input type="text" value={avatar} onChange={(e) => setAvatar(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
          <div className="flex gap-2 flex-wrap">
            {['default', 'card', 'bubble', 'minimal'].map(v => (
              <button key={v} onClick={() => setVariant(v)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${variant === v ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => quote && author && onInsert({ quote, author, role: role || undefined, avatar: avatar || undefined, variant })}
          disabled={!quote || !author}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
          Insert Testimonial
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// Accordion Configuration Modal
interface AccordionModalProps extends ModalProps {
  onInsert: (data: { title: string; content: string; defaultOpen: boolean; variant: string }) => void;
}

export function AccordionConfigModal({ onInsert, onClose }: AccordionModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [variant, setVariant] = useState('default');

  return (
    <ConfigModalWrapper title="Add Accordion" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" placeholder="Click to expand" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Hidden content..." />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={defaultOpen} onChange={(e) => setDefaultOpen(e.target.checked)} />
          <span className="text-sm text-gray-700">Open by default</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
          <div className="flex gap-2">
            {['default', 'bordered', 'filled'].map(v => (
              <button key={v} onClick={() => setVariant(v)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${variant === v ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => title && content && onInsert({ title, content, defaultOpen, variant })}
          disabled={!title || !content}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
          Insert Accordion
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// Progress Bar Configuration Modal
interface ProgressModalProps extends ModalProps {
  onInsert: (data: { label?: string; value: number; variant: string; color: string }) => void;
}

export function ProgressConfigModal({ onInsert, onClose }: ProgressModalProps) {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState(50);
  const [variant, setVariant] = useState('default');
  const [color, setColor] = useState('violet');

  return (
    <ConfigModalWrapper title="Add Progress Bar" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" placeholder="Progress" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value: {value}%</label>
          <input type="range" min="0" max="100" value={value} onChange={(e) => setValue(Number(e.target.value))}
            className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex gap-2">
            {['violet', 'blue', 'green', 'red', 'yellow'].map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-gray-800' : 'border-transparent'}`}
                style={{ backgroundColor: c === 'violet' ? '#7c3aed' : c === 'blue' ? '#3b82f6' : c === 'green' ? '#22c55e' : c === 'red' ? '#ef4444' : '#eab308' }} />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
          <div className="flex gap-2">
            {['default', 'striped', 'gradient', 'thin'].map(v => (
              <button key={v} onClick={() => setVariant(v)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${variant === v ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => onInsert({ label: label || undefined, value, variant, color })}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
          Insert Progress Bar
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// Countdown Configuration Modal
interface CountdownModalProps extends ModalProps {
  onInsert: (data: { targetDate: string; title?: string; variant: string }) => void;
}

export function CountdownConfigModal({ onInsert, onClose }: CountdownModalProps) {
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [variant, setVariant] = useState('default');

  return (
    <ConfigModalWrapper title="Add Countdown" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" placeholder="Event starts in..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Date & Time *</label>
          <input type="datetime-local" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
          <div className="flex gap-2">
            {['default', 'compact', 'flip'].map(v => (
              <button key={v} onClick={() => setVariant(v)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${variant === v ? 'bg-violet-600 text-white' : 'bg-gray-100'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => targetDate && onInsert({ targetDate: new Date(targetDate).toISOString(), title: title || undefined, variant })}
          disabled={!targetDate}
          className="w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
          Insert Countdown
        </button>
      </div>
    </ConfigModalWrapper>
  );
}

// Wrapper component for modal styling
function ConfigModalWrapper({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export { ConfigModalWrapper };

