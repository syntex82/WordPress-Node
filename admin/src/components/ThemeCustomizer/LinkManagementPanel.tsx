/**
 * Link Management Panel - Advanced Version
 * Features: Drag-and-drop reordering, grouped views, visibility toggle, icons, downloads
 */

import { useState, useEffect } from 'react';
import {
  FiPlus, FiTrash2, FiEdit2, FiX, FiSave, FiLink2 as FiLink2Icon,
  FiMove, FiEye, FiEyeOff, FiCopy, FiDownload, FiCheckSquare, FiSquare,
  FiExternalLink, FiChevronDown, FiChevronRight, FiGlobe, FiNavigation,
  FiShare2, FiMousePointer, FiFolder
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { themeCustomizationApi, ThemeCustomizationLink } from '../../services/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LinkManagementPanelProps {
  themeId: string;
}

const LINK_TYPES = [
  { id: 'navigation', label: 'Navigation', icon: FiNavigation, color: 'blue', description: 'Main menu links' },
  { id: 'social', label: 'Social', icon: FiShare2, color: 'pink', description: 'Social media links' },
  { id: 'cta', label: 'Call to Action', icon: FiMousePointer, color: 'green', description: 'Action buttons' },
  { id: 'footer', label: 'Footer', icon: FiFolder, color: 'gray', description: 'Footer links' },
  { id: 'custom', label: 'Custom', icon: FiGlobe, color: 'purple', description: 'Custom links' },
];

const LINK_GROUPS = [
  { id: 'main-nav', label: 'Main Navigation', icon: '🧭', color: 'blue' },
  { id: 'social-links', label: 'Social Links', icon: '📱', color: 'pink' },
  { id: 'footer-links', label: 'Footer Links', icon: '📋', color: 'gray' },
  { id: 'cta-buttons', label: 'CTA Buttons', icon: '🎯', color: 'green' },
  { id: 'custom', label: 'Custom', icon: '✨', color: 'purple' },
];

const SOCIAL_ICONS: Record<string, string> = {
  facebook: '📘', twitter: '🐦', instagram: '📸', linkedin: '💼',
  youtube: '📺', tiktok: '🎵', github: '🐙', discord: '💬',
  pinterest: '📌', reddit: '🔴', whatsapp: '💚', telegram: '✈️',
};

// Sortable Link Card Component
function SortableLinkCard({
  link,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  onToggleActive
}: {
  link: ThemeCustomizationLink;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (link: ThemeCustomizationLink) => void;
  onDelete: (id: string) => void;
  onDuplicate: (link: ThemeCustomizationLink) => void;
  onToggleVisibility: (link: ThemeCustomizationLink) => void;
  onToggleActive: (link: ThemeCustomizationLink) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const typeInfo = LINK_TYPES.find(t => t.id === link.type) || LINK_TYPES[4];
  const groupInfo = LINK_GROUPS.find(g => g.id === link.group) || LINK_GROUPS[4];
  const TypeIcon = typeInfo.icon;

  // Get social icon if it's a social link using URL hostname parsing
  const getSocialIcon = () => {
    if (link.type !== 'social') return null;
    try {
      const url = new URL(link.url);
      const hostname = url.hostname.toLowerCase();
      for (const [platform, icon] of Object.entries(SOCIAL_ICONS)) {
        // Check if hostname contains the platform name (e.g., twitter.com, facebook.com)
        if (hostname.includes(platform)) return icon;
      }
    } catch {
      // Invalid URL, fall through to default
    }
    return '🔗';
  };

  const socialIcon = getSocialIcon();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-4 rounded-xl transition-all border-2 ${
        isDragging
          ? 'bg-indigo-900/50 border-indigo-500 shadow-2xl scale-[1.02]'
          : isSelected
            ? 'bg-gray-700/80 border-indigo-500'
            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
      } ${!link.isVisible ? 'opacity-60' : ''}`}
    >
      {/* Selection */}
      <button onClick={() => onSelect(link.id)} className="flex-shrink-0 text-gray-400 hover:text-indigo-400">
        {isSelected ? <FiCheckSquare size={20} className="text-indigo-400" /> : <FiSquare size={20} />}
      </button>

      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-white">
        <FiMove size={18} />
      </div>

      {/* Position Badge */}
      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 flex-shrink-0">
        {index + 1}
      </div>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        link.type === 'social' ? 'bg-pink-500/20' :
        link.type === 'cta' ? 'bg-green-500/20' :
        link.type === 'navigation' ? 'bg-blue-500/20' : 'bg-gray-700'
      }`}>
        {socialIcon ? (
          <span className="text-xl">{socialIcon}</span>
        ) : (
          <TypeIcon size={20} className={`text-${typeInfo.color}-400`} />
        )}
      </div>

      {/* Link Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-white font-semibold truncate">{link.label}</h4>
          {link.isActive && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Active</span>
          )}
          {!link.isVisible && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-600 text-gray-300 flex items-center gap-1">
              <FiEyeOff size={10} /> Hidden
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm">
          <span className="text-gray-400 truncate max-w-[200px]">{link.url}</span>
          {link.target === '_blank' && (
            <FiExternalLink size={12} className="text-gray-500 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Group & Type Badges */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <span className={`px-2 py-1 text-xs rounded-lg bg-${typeInfo.color}-500/20 text-${typeInfo.color}-300 capitalize`}>
          {link.type}
        </span>
        <span className="px-2 py-1 text-xs rounded-lg bg-gray-700 text-gray-300 flex items-center gap-1">
          <span>{groupInfo.icon}</span>
          <span className="hidden lg:inline">{groupInfo.label}</span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onToggleActive(link)}
          className={`p-2 rounded-lg transition-colors ${link.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          title={link.isActive ? 'Deactivate' : 'Set as active'}
        >
          <FiMousePointer size={16} />
        </button>
        <button
          onClick={() => onToggleVisibility(link)}
          className={`p-2 rounded-lg transition-colors ${link.isVisible ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          title={link.isVisible ? 'Hide' : 'Show'}
        >
          {link.isVisible ? <FiEye size={16} /> : <FiEyeOff size={16} />}
        </button>
        <button onClick={() => onDuplicate(link)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300" title="Duplicate">
          <FiCopy size={16} />
        </button>
        <button onClick={() => onEdit(link)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white" title="Edit">
          <FiEdit2 size={16} />
        </button>
        <button onClick={() => onDelete(link.id)} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white" title="Delete">
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function LinkManagementPanel({ themeId }: LinkManagementPanelProps) {
  const [links, setLinks] = useState<ThemeCustomizationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<ThemeCustomizationLink | null>(null);
  const [editData, setEditData] = useState<Partial<ThemeCustomizationLink>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [viewMode, setViewMode] = useState<'all' | 'grouped'>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [newLink, setNewLink] = useState<Partial<ThemeCustomizationLink>>({
    name: '',
    type: 'navigation',
    label: '',
    url: '',
    target: '_self',
    group: 'main-nav',
    isVisible: true,
    isActive: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadLinks();
  }, [themeId]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const response = await themeCustomizationApi.getLinks(themeId, undefined, undefined);
      setLinks(response.data.sort((a: ThemeCustomizationLink, b: ThemeCustomizationLink) => a.position - b.position));
    } catch (err: any) {
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex(l => l.id === active.id);
    const newIndex = links.findIndex(l => l.id === over.id);

    const newLinks = arrayMove(links, oldIndex, newIndex);
    setLinks(newLinks);

    try {
      await Promise.all(
        newLinks.map((link, idx) =>
          themeCustomizationApi.updateLink(link.id, { position: idx })
        )
      );
      toast.success('Order updated');
    } catch (err) {
      toast.error('Failed to update order');
      loadLinks();
    }
  };

  const handleAddLink = async () => {
    if (!newLink.name || !newLink.label || !newLink.url) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const response = await themeCustomizationApi.createLink(themeId, {
        ...newLink,
        position: links.length,
      });
      setLinks([...links, response.data]);
      setNewLink({ name: '', type: 'navigation', label: '', url: '', target: '_self', group: 'main-nav', isVisible: true, isActive: false });
      setShowAddModal(false);
      toast.success('Link added');
    } catch (err) {
      toast.error('Failed to add link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    try {
      await themeCustomizationApi.deleteLink(id);
      setLinks(links.filter(l => l.id !== id));
      setSelectedIds(selectedIds.filter(sid => sid !== id));
      toast.success('Link deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} links?`)) return;

    try {
      await Promise.all(selectedIds.map(id => themeCustomizationApi.deleteLink(id)));
      setLinks(links.filter(l => !selectedIds.includes(l.id)));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} links deleted`);
    } catch (err) {
      toast.error('Failed to delete some links');
    }
  };

  const handleDuplicate = async (link: ThemeCustomizationLink) => {
    try {
      const response = await themeCustomizationApi.createLink(themeId, {
        name: `${link.name} (Copy)`,
        type: link.type,
        label: `${link.label} (Copy)`,
        url: link.url,
        target: link.target,
        group: link.group,
        isVisible: true,
        isActive: false,
        position: links.length,
      });
      setLinks([...links, response.data]);
      toast.success('Link duplicated');
    } catch (err) {
      toast.error('Failed to duplicate');
    }
  };

  const handleToggleVisibility = async (link: ThemeCustomizationLink) => {
    try {
      const response = await themeCustomizationApi.updateLink(link.id, { isVisible: !link.isVisible });
      setLinks(links.map(l => l.id === link.id ? response.data : l));
      toast.success(link.isVisible ? 'Link hidden' : 'Link visible');
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const handleToggleActive = async (link: ThemeCustomizationLink) => {
    try {
      const response = await themeCustomizationApi.updateLink(link.id, { isActive: !link.isActive });
      setLinks(links.map(l => l.id === link.id ? response.data : l));
      toast.success(link.isActive ? 'Link deactivated' : 'Link activated');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingLink) return;
    try {
      const response = await themeCustomizationApi.updateLink(editingLink.id, editData);
      setLinks(links.map(l => l.id === editingLink.id ? response.data : l));
      setEditingLink(null);
      setEditData({});
      toast.success('Link updated');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleExport = () => {
    const exportData = { links, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `links-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Links exported');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]);
  };

  const filteredLinks = filterGroup ? links.filter(l => l.group === filterGroup) : links;

  // Group links by group
  const groupedLinks = LINK_GROUPS.reduce((acc, group) => {
    acc[group.id] = filteredLinks.filter(l => l.group === group.id);
    return acc;
  }, {} as Record<string, ThemeCustomizationLink[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 transition-all"
          >
            <FiPlus size={20} />
            Add Link
          </button>

          <div className="h-8 w-px bg-gray-700 mx-2" />

          <button
            onClick={() => setFilterGroup('')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterGroup === '' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({links.length})
          </button>
          {LINK_GROUPS.map(group => {
            const count = links.filter(l => l.group === group.id).length;
            if (count === 0) return null;
            return (
              <button
                key={group.id}
                onClick={() => setFilterGroup(group.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                  filterGroup === group.id ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{group.icon}</span>
                <span className="hidden sm:inline">{group.label}</span>
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <span className="text-indigo-400 text-sm">{selectedIds.length} selected</span>
              <button onClick={handleBulkDelete} className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white" title="Delete Selected">
                <FiTrash2 size={18} />
              </button>
              <div className="w-px h-6 bg-gray-600 mx-1" />
            </>
          )}
          <button onClick={handleExport} className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white" title="Export Links">
            <FiDownload size={18} />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'all' ? 'grouped' : 'all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${viewMode === 'grouped' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            {viewMode === 'grouped' ? 'Grouped' : 'All'}
          </button>
        </div>
      </div>

      {/* Links List */}
      {filteredLinks.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-700">
          <FiLink2Icon className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No links yet</h3>
          <p className="text-gray-500 mb-6">Add your first link to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium inline-flex items-center gap-2"
          >
            <FiPlus size={20} /> Add Your First Link
          </button>
        </div>
      ) : viewMode === 'grouped' ? (
        // Grouped View
        <div className="space-y-4">
          {LINK_GROUPS.map(group => {
            const groupLinks = groupedLinks[group.id];
            if (groupLinks.length === 0) return null;
            const isCollapsed = collapsedGroups.includes(group.id);

            return (
              <div key={group.id} className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{group.icon}</span>
                    <h3 className="text-white font-semibold">{group.label}</h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300">{groupLinks.length}</span>
                  </div>
                  {isCollapsed ? <FiChevronRight size={20} className="text-gray-400" /> : <FiChevronDown size={20} className="text-gray-400" />}
                </button>

                {!isCollapsed && (
                  <div className="p-4 pt-0 space-y-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={groupLinks.map(l => l.id)} strategy={verticalListSortingStrategy}>
                        {groupLinks.map((link, index) => (
                          <SortableLinkCard
                            key={link.id}
                            link={link}
                            index={index}
                            isSelected={selectedIds.includes(link.id)}
                            onSelect={toggleSelect}
                            onEdit={(l) => { setEditingLink(l); setEditData(l); }}
                            onDelete={handleDeleteLink}
                            onDuplicate={handleDuplicate}
                            onToggleVisibility={handleToggleVisibility}
                            onToggleActive={handleToggleActive}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // All Links View
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredLinks.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredLinks.map((link, index) => (
                <SortableLinkCard
                  key={link.id}
                  link={link}
                  index={index}
                  isSelected={selectedIds.includes(link.id)}
                  onSelect={toggleSelect}
                  onEdit={(l) => { setEditingLink(l); setEditData(l); }}
                  onDelete={handleDeleteLink}
                  onDuplicate={handleDuplicate}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add Link</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Link Type Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Link Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {LINK_TYPES.map(type => {
                    const TypeIcon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setNewLink({ ...newLink, type: type.id })}
                        className={`p-3 rounded-xl text-center transition-all ${
                          newLink.type === type.id
                            ? 'bg-indigo-600 ring-2 ring-indigo-400'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <TypeIcon size={20} className="mx-auto mb-1" />
                        <span className="text-xs text-white">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Label */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Internal Name *</label>
                  <input
                    type="text"
                    value={newLink.name || ''}
                    onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                    placeholder="e.g., home-link"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Display Label *</label>
                  <input
                    type="text"
                    value={newLink.label || ''}
                    onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                    placeholder="e.g., Home"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL *</label>
                <input
                  type="text"
                  value={newLink.url || ''}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="e.g., /home or https://example.com"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Group & Target */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Group</label>
                  <select
                    value={newLink.group || 'main-nav'}
                    onChange={(e) => setNewLink({ ...newLink, group: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {LINK_GROUPS.map(group => (
                      <option key={group.id} value={group.id}>{group.icon} {group.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Open In</label>
                  <select
                    value={newLink.target || '_self'}
                    onChange={(e) => setNewLink({ ...newLink, target: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="_self">Same Window</option>
                    <option value="_blank">New Window</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium">
                Cancel
              </button>
              <button onClick={handleAddLink} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium flex items-center gap-2">
                <FiPlus size={18} /> Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Link Modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Edit Link</h2>
                <button onClick={() => setEditingLink(null)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Internal Name</label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Display Label</label>
                  <input
                    type="text"
                    value={editData.label || ''}
                    onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL</label>
                <input
                  type="text"
                  value={editData.url || ''}
                  onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select
                    value={editData.type || ''}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {LINK_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Group</label>
                  <select
                    value={editData.group || ''}
                    onChange={(e) => setEditData({ ...editData, group: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {LINK_GROUPS.map(group => (
                      <option key={group.id} value={group.id}>{group.icon} {group.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Open In</label>
                <select
                  value={editData.target || '_self'}
                  onChange={(e) => setEditData({ ...editData, target: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="_self">Same Window</option>
                  <option value="_blank">New Window</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button onClick={() => setEditingLink(null)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium flex items-center gap-2">
                <FiSave size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

