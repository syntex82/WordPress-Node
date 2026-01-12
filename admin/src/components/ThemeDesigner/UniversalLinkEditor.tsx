/**
 * Universal Link Editor Modal for Theme Designer
 * Comprehensive link editing with support for all link types
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  FiLink, FiExternalLink, FiHash, FiMail, FiPhone, FiDownload,
  FiMaximize2, FiArrowDown, FiX, FiCheck, FiChevronDown, FiFile,
  FiMessageSquare, FiShare2, FiGlobe, FiHome, FiCode, FiAlertCircle,
  FiTrash2, FiEye, FiCopy, FiSearch
} from 'react-icons/fi';
import { 
  FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, 
  FaTiktok, FaWhatsapp, FaTelegram 
} from 'react-icons/fa';

// ============ Enhanced Link Types ============
export type EnhancedLinkType = 
  | 'none'
  | 'internal'     // Internal page navigation
  | 'external'     // External URL
  | 'anchor'       // Anchor link (same page)
  | 'email'        // mailto: link
  | 'phone'        // tel: link
  | 'sms'          // SMS link
  | 'download'     // File download
  | 'modal'        // Open modal/popup
  | 'scroll'       // Smooth scroll to section
  | 'social'       // Social media link
  | 'javascript';  // Custom JS action

export interface EnhancedLinkSettings {
  type: EnhancedLinkType;
  // URL-based links
  url?: string;
  newTab?: boolean;
  noFollow?: boolean;
  // Internal pages
  pageId?: string;
  pageSlug?: string;
  pageTitle?: string;
  // Anchor/scroll
  anchorId?: string;
  smoothScroll?: boolean;
  scrollOffset?: number;
  // Contact
  email?: string;
  emailSubject?: string;
  emailBody?: string;
  phone?: string;
  smsBody?: string;
  // Download
  downloadUrl?: string;
  downloadFilename?: string;
  // Modal
  modalId?: string;
  modalAction?: 'open' | 'close' | 'toggle';
  // Social
  socialPlatform?: string;
  socialUrl?: string;
  // JavaScript
  jsAction?: string;
  // Tracking
  trackClick?: boolean;
  trackLabel?: string;
  // Styling
  cursorStyle?: 'pointer' | 'default';
  hoverEffect?: 'underline' | 'highlight' | 'scale' | 'none';
}

// Default link settings
export const DEFAULT_LINK: EnhancedLinkSettings = {
  type: 'none',
  newTab: false,
  noFollow: false,
  smoothScroll: true,
  scrollOffset: 80,
  cursorStyle: 'pointer',
  hoverEffect: 'underline',
};

// ============ Link Type Configurations ============
interface LinkTypeConfig {
  id: EnhancedLinkType;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export const LINK_TYPE_CONFIGS: LinkTypeConfig[] = [
  { id: 'none', name: 'No Link', icon: <FiX size={16} />, description: 'Remove link', color: 'gray' },
  { id: 'internal', name: 'Page', icon: <FiHome size={16} />, description: 'Internal page', color: 'blue' },
  { id: 'external', name: 'External', icon: <FiExternalLink size={16} />, description: 'External URL', color: 'green' },
  { id: 'anchor', name: 'Anchor', icon: <FiHash size={16} />, description: 'Section on page', color: 'purple' },
  { id: 'scroll', name: 'Scroll To', icon: <FiArrowDown size={16} />, description: 'Smooth scroll', color: 'cyan' },
  { id: 'email', name: 'Email', icon: <FiMail size={16} />, description: 'Send email', color: 'yellow' },
  { id: 'phone', name: 'Phone', icon: <FiPhone size={16} />, description: 'Call number', color: 'orange' },
  { id: 'sms', name: 'SMS', icon: <FiMessageSquare size={16} />, description: 'Send text', color: 'pink' },
  { id: 'download', name: 'Download', icon: <FiDownload size={16} />, description: 'Download file', color: 'emerald' },
  { id: 'modal', name: 'Modal', icon: <FiMaximize2 size={16} />, description: 'Open popup', color: 'indigo' },
  { id: 'social', name: 'Social', icon: <FiShare2 size={16} />, description: 'Social link', color: 'rose' },
  { id: 'javascript', name: 'Custom', icon: <FiCode size={16} />, description: 'JavaScript', color: 'amber' },
];

// Social platforms
export const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: <FaFacebook />, urlPattern: 'https://facebook.com/' },
  { id: 'twitter', name: 'Twitter/X', icon: <FaTwitter />, urlPattern: 'https://twitter.com/' },
  { id: 'instagram', name: 'Instagram', icon: <FaInstagram />, urlPattern: 'https://instagram.com/' },
  { id: 'linkedin', name: 'LinkedIn', icon: <FaLinkedin />, urlPattern: 'https://linkedin.com/in/' },
  { id: 'youtube', name: 'YouTube', icon: <FaYoutube />, urlPattern: 'https://youtube.com/' },
  { id: 'tiktok', name: 'TikTok', icon: <FaTiktok />, urlPattern: 'https://tiktok.com/@' },
  { id: 'whatsapp', name: 'WhatsApp', icon: <FaWhatsapp />, urlPattern: 'https://wa.me/' },
  { id: 'telegram', name: 'Telegram', icon: <FaTelegram />, urlPattern: 'https://t.me/' },
];

// ============ URL Validation ============
export function validateUrl(url: string, type: EnhancedLinkType): { valid: boolean; message?: string } {
  if (!url && type !== 'none') {
    return { valid: false, message: 'URL is required' };
  }
  
  if (type === 'external') {
    try {
      new URL(url);
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return { valid: false, message: 'URL must start with http:// or https://' };
      }
      return { valid: true };
    } catch {
      return { valid: false, message: 'Invalid URL format' };
    }
  }
  
  if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(url)) {
      return { valid: false, message: 'Invalid email address' };
    }
    return { valid: true };
  }
  
  if (type === 'phone') {
    const phoneRegex = /^[\d\s\-+()]+$/;
    if (!phoneRegex.test(url)) {
      return { valid: false, message: 'Invalid phone number' };
    }
    return { valid: true };
  }
  
  if (type === 'anchor') {
    if (!url.startsWith('#')) {
      return { valid: false, message: 'Anchor must start with #' };
    }
    return { valid: true };
  }
  
  return { valid: true };
}

// ============ Generate Link Href ============
export function generateLinkHref(link: EnhancedLinkSettings): string {
  switch (link.type) {
    case 'none':
      return '#';
    case 'internal':
      return link.pageSlug ? `/${link.pageSlug}` : link.url || '#';
    case 'external':
      return link.url || '#';
    case 'anchor':
      return link.anchorId ? `#${link.anchorId}` : '#';
    case 'scroll':
      return link.anchorId ? `#${link.anchorId}` : '#';
    case 'email':
      let mailto = `mailto:${link.email || ''}`;
      const emailParams: string[] = [];
      if (link.emailSubject) emailParams.push(`subject=${encodeURIComponent(link.emailSubject)}`);
      if (link.emailBody) emailParams.push(`body=${encodeURIComponent(link.emailBody)}`);
      if (emailParams.length) mailto += `?${emailParams.join('&')}`;
      return mailto;
    case 'phone':
      return `tel:${(link.phone || '').replace(/\s/g, '')}`;
    case 'sms':
      return `sms:${(link.phone || '').replace(/\s/g, '')}${link.smsBody ? `?body=${encodeURIComponent(link.smsBody)}` : ''}`;
    case 'download':
      return link.downloadUrl || '#';
    case 'social':
      return link.socialUrl || '#';
    default:
      return '#';
  }
}

// ============ Universal Link Editor Modal ============
interface UniversalLinkEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: EnhancedLinkSettings;
  onSave: (link: EnhancedLinkSettings) => void;
  availablePages?: Array<{ id: string; title: string; slug: string }>;
  availableAnchors?: Array<{ id: string; name: string }>;
  availableModals?: Array<{ id: string; name: string }>;
}

export function UniversalLinkEditorModal({
  isOpen,
  onClose,
  link,
  onSave,
  availablePages = [],
  availableAnchors = [],
  availableModals = [],
}: UniversalLinkEditorModalProps) {
  const [editedLink, setEditedLink] = useState<EnhancedLinkSettings>(link);
  const [searchQuery, setSearchQuery] = useState('');
  const [validation, setValidation] = useState<{ valid: boolean; message?: string }>({ valid: true });

  useEffect(() => {
    setEditedLink(link);
  }, [link]);

  // Filter pages based on search
  const filteredPages = useMemo(() => {
    if (!searchQuery) return availablePages;
    const query = searchQuery.toLowerCase();
    return availablePages.filter(p =>
      p.title.toLowerCase().includes(query) || p.slug.toLowerCase().includes(query)
    );
  }, [availablePages, searchQuery]);

  const handleTypeChange = (type: EnhancedLinkType) => {
    setEditedLink({ ...editedLink, type });
    setValidation({ valid: true });
  };

  const handleSave = () => {
    // Validate before saving
    let urlToValidate = '';
    switch (editedLink.type) {
      case 'external': urlToValidate = editedLink.url || ''; break;
      case 'email': urlToValidate = editedLink.email || ''; break;
      case 'phone':
      case 'sms': urlToValidate = editedLink.phone || ''; break;
      case 'anchor':
      case 'scroll': urlToValidate = editedLink.anchorId ? `#${editedLink.anchorId}` : ''; break;
    }

    const result = validateUrl(urlToValidate, editedLink.type);
    setValidation(result);

    if (result.valid) {
      onSave(editedLink);
      onClose();
    }
  };

  const handleRemoveLink = () => {
    onSave({ ...DEFAULT_LINK, type: 'none' });
    onClose();
  };

  if (!isOpen) return null;

  const config = LINK_TYPE_CONFIGS.find(c => c.id === editedLink.type);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-${config?.color || 'gray'}-500/20 flex items-center justify-center text-${config?.color || 'gray'}-400`}>
              <FiLink size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Link Editor</h3>
              <p className="text-xs text-gray-400">Configure link behavior</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Link Type Selector */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Link Type</label>
            <div className="grid grid-cols-4 gap-2">
              {LINK_TYPE_CONFIGS.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all ${
                    editedLink.type === type.id
                      ? `bg-${type.color}-500/30 border-${type.color}-500 border-2 text-${type.color}-400`
                      : 'bg-gray-800 border-gray-700 border hover:bg-gray-700 text-gray-400'
                  }`}
                  title={type.description}
                >
                  {type.icon}
                  <span className="text-[10px] font-medium">{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific fields */}
          {editedLink.type === 'internal' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Search Pages</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by title or slug..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredPages.length > 0 ? (
                  filteredPages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => setEditedLink({ ...editedLink, pageId: page.id, pageSlug: page.slug, pageTitle: page.title })}
                      className={`w-full p-2 rounded-lg text-left flex items-center justify-between transition-colors ${
                        editedLink.pageId === page.id
                          ? 'bg-blue-500/20 border border-blue-500'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-sm text-white">{page.title}</span>
                      <span className="text-xs text-gray-500">/{page.slug}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    {searchQuery ? 'No pages found' : 'No pages available'}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Or enter URL manually</label>
                <input
                  type="text"
                  value={editedLink.url || ''}
                  onChange={e => setEditedLink({ ...editedLink, url: e.target.value })}
                  placeholder="/page-slug"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          )}

          {editedLink.type === 'external' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">External URL</label>
                <input
                  type="url"
                  value={editedLink.url || ''}
                  onChange={e => setEditedLink({ ...editedLink, url: e.target.value })}
                  placeholder="https://example.com"
                  className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white ${
                    !validation.valid ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {!validation.valid && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FiAlertCircle size={12} /> {validation.message}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editedLink.newTab || false}
                  onChange={e => setEditedLink({ ...editedLink, newTab: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                />
                Open in new tab
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editedLink.noFollow || false}
                  onChange={e => setEditedLink({ ...editedLink, noFollow: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                />
                Add nofollow (for SEO)
              </label>
            </div>
          )}

          {(editedLink.type === 'anchor' || editedLink.type === 'scroll') && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Select Section</label>
                {availableAnchors.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {availableAnchors.map(anchor => (
                      <button
                        key={anchor.id}
                        onClick={() => setEditedLink({ ...editedLink, anchorId: anchor.id })}
                        className={`w-full p-2 rounded-lg text-left flex items-center gap-2 transition-colors ${
                          editedLink.anchorId === anchor.id
                            ? 'bg-purple-500/20 border border-purple-500'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <FiHash size={14} className="text-purple-400" />
                        <span className="text-sm text-white">{anchor.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-800 rounded-lg p-3">
                    No sections with IDs found on this page
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Or enter anchor ID</label>
                <input
                  type="text"
                  value={editedLink.anchorId || ''}
                  onChange={e => setEditedLink({ ...editedLink, anchorId: e.target.value.replace('#', '') })}
                  placeholder="section-id"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              {editedLink.type === 'scroll' && (
                <>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedLink.smoothScroll !== false}
                      onChange={e => setEditedLink({ ...editedLink, smoothScroll: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500"
                    />
                    Smooth scrolling animation
                  </label>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Scroll Offset (px)</label>
                    <input
                      type="number"
                      value={editedLink.scrollOffset || 80}
                      onChange={e => setEditedLink({ ...editedLink, scrollOffset: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={200}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Account for fixed header height</p>
                  </div>
                </>
              )}
            </div>
          )}

          {editedLink.type === 'email' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email Address *</label>
                <input
                  type="email"
                  value={editedLink.email || ''}
                  onChange={e => setEditedLink({ ...editedLink, email: e.target.value })}
                  placeholder="contact@example.com"
                  className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white ${
                    !validation.valid ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Subject (optional)</label>
                <input
                  type="text"
                  value={editedLink.emailSubject || ''}
                  onChange={e => setEditedLink({ ...editedLink, emailSubject: e.target.value })}
                  placeholder="Inquiry from website"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Body (optional)</label>
                <textarea
                  value={editedLink.emailBody || ''}
                  onChange={e => setEditedLink({ ...editedLink, emailBody: e.target.value })}
                  placeholder="Pre-filled message..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                />
              </div>
            </div>
          )}

          {(editedLink.type === 'phone' || editedLink.type === 'sms') && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone Number *</label>
                <input
                  type="tel"
                  value={editedLink.phone || ''}
                  onChange={e => setEditedLink({ ...editedLink, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white ${
                    !validation.valid ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
              </div>
              {editedLink.type === 'sms' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Pre-filled Message (optional)</label>
                  <textarea
                    value={editedLink.smsBody || ''}
                    onChange={e => setEditedLink({ ...editedLink, smsBody: e.target.value })}
                    placeholder="Hello, I'm interested in..."
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {editedLink.type === 'download' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">File URL *</label>
                <input
                  type="url"
                  value={editedLink.downloadUrl || ''}
                  onChange={e => setEditedLink({ ...editedLink, downloadUrl: e.target.value })}
                  placeholder="https://example.com/file.pdf"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Filename (optional)</label>
                <input
                  type="text"
                  value={editedLink.downloadFilename || ''}
                  onChange={e => setEditedLink({ ...editedLink, downloadFilename: e.target.value })}
                  placeholder="document.pdf"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Custom filename for the download</p>
              </div>
            </div>
          )}

          {editedLink.type === 'modal' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Select Modal</label>
                {availableModals.length > 0 ? (
                  <div className="space-y-1">
                    {availableModals.map(modal => (
                      <button
                        key={modal.id}
                        onClick={() => setEditedLink({ ...editedLink, modalId: modal.id })}
                        className={`w-full p-2 rounded-lg text-left flex items-center gap-2 transition-colors ${
                          editedLink.modalId === modal.id
                            ? 'bg-indigo-500/20 border border-indigo-500'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <FiMaximize2 size={14} className="text-indigo-400" />
                        <span className="text-sm text-white">{modal.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-800 rounded-lg p-3">
                    No modals configured
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Or enter modal ID</label>
                <input
                  type="text"
                  value={editedLink.modalId || ''}
                  onChange={e => setEditedLink({ ...editedLink, modalId: e.target.value })}
                  placeholder="modal-id"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Action</label>
                <select
                  value={editedLink.modalAction || 'open'}
                  onChange={e => setEditedLink({ ...editedLink, modalAction: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="open">Open Modal</option>
                  <option value="close">Close Modal</option>
                  <option value="toggle">Toggle Modal</option>
                </select>
              </div>
            </div>
          )}

          {editedLink.type === 'social' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {SOCIAL_PLATFORMS.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => setEditedLink({ ...editedLink, socialPlatform: platform.id })}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        editedLink.socialPlatform === platform.id
                          ? 'bg-rose-500/30 border-rose-500 border text-rose-400'
                          : 'bg-gray-800 border-gray-700 border hover:bg-gray-700 text-gray-400'
                      }`}
                    >
                      {platform.icon}
                      <span className="text-[10px]">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Profile URL or Handle</label>
                <input
                  type="text"
                  value={editedLink.socialUrl || ''}
                  onChange={e => setEditedLink({ ...editedLink, socialUrl: e.target.value })}
                  placeholder="@username or full URL"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          )}

          {editedLink.type === 'javascript' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">JavaScript Action</label>
                <textarea
                  value={editedLink.jsAction || ''}
                  onChange={e => setEditedLink({ ...editedLink, jsAction: e.target.value })}
                  placeholder="alert('Hello World!');"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono resize-none"
                />
                <p className="text-[10px] text-yellow-500 mt-1 flex items-center gap-1">
                  <FiAlertCircle size={10} /> Use with caution. Invalid code may break the page.
                </p>
              </div>
            </div>
          )}

          {/* Tracking Options (for all link types except none) */}
          {editedLink.type !== 'none' && (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-white py-2">
                <FiEye size={12} />
                <span>Click Tracking</span>
                <FiChevronDown size={12} className="ml-auto transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2 space-y-2 pl-4 border-l border-gray-700">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedLink.trackClick || false}
                    onChange={e => setEditedLink({ ...editedLink, trackClick: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                  />
                  Enable click tracking
                </label>
                {editedLink.trackClick && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Tracking Label</label>
                    <input
                      type="text"
                      value={editedLink.trackLabel || ''}
                      onChange={e => setEditedLink({ ...editedLink, trackLabel: e.target.value })}
                      placeholder="button_click_hero"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Link Preview */}
          {editedLink.type !== 'none' && (
            <div className="bg-gray-800/50 rounded-lg p-3 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Link Preview</span>
                <button
                  onClick={() => navigator.clipboard.writeText(generateLinkHref(editedLink))}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <FiCopy size={10} /> Copy
                </button>
              </div>
              <code className="text-xs text-green-400 break-all">
                {generateLinkHref(editedLink)}
              </code>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={handleRemoveLink}
            className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm flex items-center gap-1.5 transition-colors"
          >
            <FiTrash2 size={14} /> Remove Link
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors"
            >
              <FiCheck size={14} /> Save Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Visual Link Indicator ============
interface LinkIndicatorProps {
  link?: EnhancedLinkSettings;
  onClick?: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
}

export function LinkIndicator({ link, onClick, position = 'top-right', size = 'sm' }: LinkIndicatorProps) {
  if (!link || link.type === 'none') return null;

  const config = LINK_TYPE_CONFIGS.find(c => c.id === link.type);

  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  const positionClasses = {
    'top-left': 'top-1 left-1',
    'top-right': 'top-1 right-1',
    'bottom-left': 'bottom-1 left-1',
    'bottom-right': 'bottom-1 right-1',
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/80 text-white',
    green: 'bg-green-500/80 text-white',
    purple: 'bg-purple-500/80 text-white',
    cyan: 'bg-cyan-500/80 text-white',
    yellow: 'bg-yellow-500/80 text-black',
    orange: 'bg-orange-500/80 text-white',
    pink: 'bg-pink-500/80 text-white',
    emerald: 'bg-emerald-500/80 text-white',
    indigo: 'bg-indigo-500/80 text-white',
    rose: 'bg-rose-500/80 text-white',
    amber: 'bg-amber-500/80 text-black',
    gray: 'bg-gray-500/80 text-white',
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`absolute ${positionClasses[position]} ${sizeClasses[size]} ${colorClasses[config?.color || 'gray']} rounded-full flex items-center justify-center shadow-lg z-20 hover:scale-110 transition-transform cursor-pointer`}
      title={`${config?.name}: ${generateLinkHref(link)}`}
    >
      <FiLink size={size === 'sm' ? 10 : size === 'md' ? 12 : 16} />
    </button>
  );
}

// ============ Clickable Link Wrapper ============
interface ClickableElementProps {
  link?: EnhancedLinkSettings;
  onEditLink: () => void;
  children: React.ReactNode;
  className?: string;
  showIndicator?: boolean;
  isDesignMode?: boolean;
}

export function ClickableElement({
  link,
  onEditLink,
  children,
  className = '',
  showIndicator = true,
  isDesignMode = true
}: ClickableElementProps) {
  const hasLink = link && link.type !== 'none';

  // In design mode, clicking opens the link editor
  if (isDesignMode) {
    return (
      <div
        className={`relative ${className} ${hasLink ? 'ring-1 ring-blue-400/30' : ''} cursor-pointer group`}
        onClick={onEditLink}
      >
        {children}
        {showIndicator && <LinkIndicator link={link} onClick={onEditLink} />}

        {/* Add link hint on hover if no link */}
        {!hasLink && (
          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-xs text-blue-400 bg-gray-900/90 px-2 py-1 rounded flex items-center gap-1">
              <FiLink size={12} /> Click to add link
            </span>
          </div>
        )}
      </div>
    );
  }

  // In preview/live mode, render as actual link
  if (hasLink) {
    const href = generateLinkHref(link!);
    const isExternal = link!.type === 'external' || link!.type === 'social';

    return (
      <a
        href={href}
        target={link!.newTab ? '_blank' : undefined}
        rel={link!.noFollow ? 'nofollow noopener' : isExternal ? 'noopener' : undefined}
        className={className}
        onClick={(e) => {
          // Handle special link types
          if (link!.type === 'scroll' && link!.anchorId) {
            e.preventDefault();
            const element = document.getElementById(link!.anchorId);
            if (element) {
              const offset = link!.scrollOffset || 80;
              const top = element.getBoundingClientRect().top + window.scrollY - offset;
              window.scrollTo({ top, behavior: link!.smoothScroll !== false ? 'smooth' : 'auto' });
            }
          }
          if (link!.type === 'javascript' && link!.jsAction) {
            e.preventDefault();
            try {
              // eslint-disable-next-line no-eval
              eval(link!.jsAction);
            } catch (err) {
              console.error('Link JS action error:', err);
            }
          }
        }}
        download={link!.type === 'download' ? link!.downloadFilename || true : undefined}
      >
        {children}
      </a>
    );
  }

  return <div className={className}>{children}</div>;
}

// ============ Design Mode Link Manager Panel ============
interface DesignerLinkManagerProps {
  blocks: Array<{
    id: string;
    name: string;
    type: string;
    link?: EnhancedLinkSettings;
  }>;
  onEditLink: (blockId: string) => void;
  onRemoveLink: (blockId: string) => void;
  selectedBlockId?: string;
}

export function DesignerLinkManager({
  blocks,
  onEditLink,
  onRemoveLink,
  selectedBlockId
}: DesignerLinkManagerProps) {
  const linkedBlocks = blocks.filter(b => b.link && b.link.type !== 'none');
  const [filter, setFilter] = useState<EnhancedLinkType | 'all'>('all');

  const filteredBlocks = filter === 'all'
    ? linkedBlocks
    : linkedBlocks.filter(b => b.link?.type === filter);

  // Count by type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    linkedBlocks.forEach(b => {
      const type = b.link?.type || 'none';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [linkedBlocks]);

  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FiLink size={16} /> Link Manager
          </h3>
          <span className="text-xs text-gray-400">{linkedBlocks.length} links</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1 mt-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            All ({linkedBlocks.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const config = LINK_TYPE_CONFIGS.find(c => c.id === type);
            return (
              <button
                key={type}
                onClick={() => setFilter(type as EnhancedLinkType)}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                  filter === type ? `bg-${config?.color}-500 text-white` : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {config?.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Links List */}
      <div className="max-h-64 overflow-y-auto">
        {filteredBlocks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FiLink className="mx-auto mb-2 opacity-50" size={24} />
            <p className="text-sm">No linked elements</p>
            <p className="text-xs mt-1">Click any element to add a link</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredBlocks.map(block => {
              const config = LINK_TYPE_CONFIGS.find(c => c.id === block.link?.type);
              const href = generateLinkHref(block.link!);

              return (
                <div
                  key={block.id}
                  className={`p-3 hover:bg-gray-700/50 transition-colors ${
                    selectedBlockId === block.id ? 'bg-blue-500/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center bg-${config?.color}-500/20 text-${config?.color}-400`}>
                        {config?.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{block.name}</div>
                        <div className="text-xs text-gray-500 truncate" title={href}>
                          {href.length > 40 ? href.slice(0, 40) + '...' : href}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => onEditLink(block.id)}
                        className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-white"
                        title="Edit link"
                      >
                        <FiLink size={12} />
                      </button>
                      <button
                        onClick={() => onRemoveLink(block.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                        title="Remove link"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

