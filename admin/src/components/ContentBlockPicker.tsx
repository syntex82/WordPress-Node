/**
 * Content Block Picker Modal
 * Allows users to browse and insert various content blocks into the editor
 */

import { useState } from 'react';
import {
  FiX, FiAlertCircle, FiTarget, FiMinus, FiCreditCard, FiMessageCircle,
  FiChevronDown, FiColumns, FiBarChart2, FiClock, FiShare2, FiBookOpen,
  FiZap, FiSquare, FiImage, FiVideo, FiMusic, FiYoutube
} from 'react-icons/fi';

export interface BlockDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: 'media' | 'layout' | 'interactive' | 'social' | 'content';
}

export const CONTENT_BLOCKS: BlockDefinition[] = [
  // Media blocks
  { id: 'image', name: 'Image', description: 'Add an image with caption', icon: FiImage, category: 'media' },
  { id: 'video', name: 'Video', description: 'Embed a video file', icon: FiVideo, category: 'media' },
  { id: 'audio', name: 'Audio', description: 'Add an audio player', icon: FiMusic, category: 'media' },
  { id: 'youtube', name: 'YouTube', description: 'Embed a YouTube video', icon: FiYoutube, category: 'media' },
  
  // Layout blocks
  { id: 'divider', name: 'Divider', description: 'Add a section separator', icon: FiMinus, category: 'layout' },
  { id: 'card', name: 'Card', description: 'Card with image and content', icon: FiCreditCard, category: 'layout' },
  { id: 'accordion', name: 'Accordion', description: 'Collapsible content section', icon: FiChevronDown, category: 'layout' },
  { id: 'tabs', name: 'Tabs', description: 'Tabbed content panels', icon: FiColumns, category: 'layout' },
  
  // Interactive blocks
  { id: 'button', name: 'Button', description: 'Clickable call-to-action', icon: FiSquare, category: 'interactive' },
  { id: 'cta', name: 'CTA Section', description: 'Full-width call-to-action', icon: FiTarget, category: 'interactive' },
  { id: 'alert', name: 'Alert Box', description: 'Notification or warning', icon: FiAlertCircle, category: 'interactive' },
  { id: 'progress', name: 'Progress Bar', description: 'Visual progress indicator', icon: FiBarChart2, category: 'interactive' },
  { id: 'countdown', name: 'Countdown', description: 'Countdown timer', icon: FiClock, category: 'interactive' },
  
  // Social blocks
  { id: 'social', name: 'Social Embed', description: 'Twitter, Instagram, Facebook', icon: FiShare2, category: 'social' },
  { id: 'testimonial', name: 'Testimonial', description: 'Quote with author', icon: FiMessageCircle, category: 'social' },
  
  // Content blocks
  { id: 'toc', name: 'Table of Contents', description: 'Auto-generated from headings', icon: FiBookOpen, category: 'content' },
  { id: 'icon', name: 'Icon Block', description: 'Icon with optional text', icon: FiZap, category: 'content' },
];

const CATEGORIES = [
  { id: 'all', name: 'All Blocks' },
  { id: 'media', name: 'Media' },
  { id: 'layout', name: 'Layout' },
  { id: 'interactive', name: 'Interactive' },
  { id: 'social', name: 'Social' },
  { id: 'content', name: 'Content' },
];

interface ContentBlockPickerProps {
  onSelect: (blockId: string) => void;
  onClose: () => void;
}

export default function ContentBlockPicker({ onSelect, onClose }: ContentBlockPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBlocks = CONTENT_BLOCKS.filter(block => {
    const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Insert Content Block</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <FiX size={24} />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b space-y-3">
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Block Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredBlocks.map(block => (
              <button
                key={block.id}
                onClick={() => onSelect(block.id)}
                className="flex items-start gap-3 p-4 border rounded-lg hover:border-violet-400 hover:bg-violet-50 transition-all text-left group"
              >
                <div className="p-2 bg-violet-100 rounded-lg text-violet-600 group-hover:bg-violet-200">
                  <block.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800">{block.name}</div>
                  <div className="text-xs text-gray-500 truncate">{block.description}</div>
                </div>
              </button>
            ))}
          </div>

          {filteredBlocks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No blocks found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

