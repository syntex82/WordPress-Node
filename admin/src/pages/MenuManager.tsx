/**
 * Menu Manager
 * Create and manage navigation menus
 */

import { useEffect, useState } from 'react';
import { menusApi, Menu, MenuItem } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiSave, FiLink, FiFile, FiFileText,
  FiHome, FiChevronDown, FiChevronUp, FiMove, FiX, FiShoppingBag, FiGrid, FiShoppingCart
} from 'react-icons/fi';

// Menu locations
const MENU_LOCATIONS = [
  { id: 'header', name: 'Header Navigation' },
  { id: 'footer', name: 'Footer Navigation' },
  { id: 'sidebar', name: 'Sidebar Menu' },
];

// Menu item types
const ITEM_TYPES = [
  { id: 'CUSTOM', name: 'Custom Link', icon: FiLink },
  { id: 'PAGE', name: 'Page', icon: FiFile },
  { id: 'POST', name: 'Post', icon: FiFileText },
  { id: 'HOME', name: 'Home', icon: FiHome },
  { id: 'SHOP', name: 'Shop', icon: FiShoppingCart },
  { id: 'PRODUCT', name: 'Product', icon: FiShoppingBag },
  { id: 'CATEGORY', name: 'Category', icon: FiGrid },
];

export default function MenuManager() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [availablePosts, setAvailablePosts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuLocation, setNewMenuLocation] = useState('header');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // New item form state
  const [newItem, setNewItem] = useState<Partial<MenuItem & { productId?: string; categoryId?: string }>>({
    label: '', url: '', type: 'CUSTOM', target: '_self',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menusRes, linksRes] = await Promise.all([
        menusApi.getAll(),
        menusApi.getAvailableLinks(),
      ]);
      setMenus(menusRes.data);
      setAvailablePages(linksRes.data.pages);
      setAvailablePosts(linksRes.data.posts);
      setAvailableProducts(linksRes.data.products || []);
      setAvailableCategories(linksRes.data.productCategories || []);
      if (menusRes.data.length > 0 && !selectedMenu) {
        selectMenu(menusRes.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  const selectMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setMenuItems(menu.items || []);
  };

  const handleCreateMenu = async () => {
    if (!newMenuName.trim()) { toast.error('Please enter a menu name'); return; }
    try {
      const res = await menusApi.create({ name: newMenuName, location: newMenuLocation });
      setMenus([...menus, res.data]);
      selectMenu(res.data);
      setShowCreateModal(false);
      setNewMenuName('');
      toast.success('Menu created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create menu');
    }
  };

  const handleDeleteMenu = async () => {
    if (!selectedMenu) return;
    if (!confirm('Are you sure you want to delete this menu?')) return;
    try {
      await menusApi.delete(selectedMenu.id);
      const remaining = menus.filter(m => m.id !== selectedMenu.id);
      setMenus(remaining);
      setSelectedMenu(remaining.length > 0 ? remaining[0] : null);
      setMenuItems(remaining.length > 0 ? remaining[0].items : []);
      toast.success('Menu deleted');
    } catch (error) {
      toast.error('Failed to delete menu');
    }
  };

  const handleSaveMenu = async () => {
    if (!selectedMenu) return;
    setSaving(true);
    try {
      const itemsToSave = menuItems.map((item, index) => ({
        label: item.label,
        url: item.url,
        target: item.target || '_self',
        type: item.type,
        pageId: item.pageId,
        postId: item.postId,
        order: index,
        cssClass: item.cssClass,
        icon: item.icon,
      }));
      await menusApi.update(selectedMenu.id, { items: itemsToSave });
      toast.success('Menu saved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.label?.trim()) { toast.error('Please enter a label'); return; }
    if (newItem.type === 'CUSTOM' && !newItem.url?.trim()) {
      toast.error('Please enter a URL'); return;
    }
    const item: MenuItem = {
      id: `temp-${Date.now()}`,
      label: newItem.label || '',
      url: newItem.url || '',
      type: (newItem.type as any) || 'CUSTOM',
      target: newItem.target || '_self',
      pageId: newItem.pageId,
      postId: newItem.postId,
      order: menuItems.length,
    };
    // Set URL from selected page/post/product/category
    if (item.type === 'PAGE' && item.pageId) {
      const page = availablePages.find(p => p.id === item.pageId);
      if (page) item.url = `/${page.slug}`;
    } else if (item.type === 'POST' && item.postId) {
      const post = availablePosts.find(p => p.id === item.postId);
      if (post) item.url = `/blog/${post.slug}`;
    } else if (item.type === 'HOME') {
      item.url = '/';
    } else if (item.type === 'SHOP') {
      item.url = '/shop';
    } else if (item.type === 'PRODUCT' && newItem.productId) {
      const product = availableProducts.find(p => p.id === newItem.productId);
      if (product) item.url = `/shop/product/${product.slug}`;
    } else if (item.type === 'CATEGORY' && newItem.categoryId) {
      const category = availableCategories.find(c => c.id === newItem.categoryId);
      if (category) item.url = `/shop?category=${category.slug}`;
    }
    setMenuItems([...menuItems, item]);
    setShowAddItemModal(false);
    setNewItem({ label: '', url: '', type: 'CUSTOM', target: '_self' });
  };

  const handleRemoveItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<MenuItem>) => {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], ...updates };
    setMenuItems(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const items = [...menuItems];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    setMenuItems(items);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= menuItems.length) return;
    const items = [...menuItems];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    setMenuItems(items);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Menu Manager</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiPlus /> Create Menu
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu List */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Menus</h2>
          {menus.length === 0 ? (
            <p className="text-gray-500 text-sm">No menus yet. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {menus.map(menu => (
                <button
                  key={menu.id}
                  onClick={() => selectMenu(menu)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedMenu?.id === menu.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{menu.name}</div>
                  <div className="text-xs text-gray-500">{menu.location}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu Editor */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow">
          {selectedMenu ? (
            <div>
              <div className="flex justify-between items-center p-4 border-b">
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedMenu.name}</h2>
                  <p className="text-sm text-gray-500">Location: {selectedMenu.location}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteMenu}
                    className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiTrash2 /> Delete
                  </button>
                  <button
                    onClick={handleSaveMenu}
                    disabled={saving}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FiSave /> {saving ? 'Saving...' : 'Save Menu'}
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-700">Menu Items</h3>
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <FiPlus /> Add Item
                  </button>
                </div>

                {menuItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No menu items yet.</p>
                    <p className="text-sm">Click "Add Item" to add links to this menu.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {menuItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border ${
                          draggedIndex === index ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="cursor-move text-gray-400 hover:text-gray-600">
                          <FiMove />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => handleUpdateItem(index, { label: e.target.value })}
                            className="font-medium bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                          />
                          <div className="text-xs text-gray-500">{item.url || 'No URL'}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveItem(index, 'up')} disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <FiChevronUp />
                          </button>
                          <button onClick={() => moveItem(index, 'down')} disabled={index === menuItems.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <FiChevronDown />
                          </button>
                          <button onClick={() => handleRemoveItem(index)}
                            className="p-1 text-red-400 hover:text-red-600">
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Select a menu or create a new one
            </div>
          )}
        </div>
      </div>

      {/* Create Menu Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Menu</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menu Name</label>
                <input
                  type="text"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="e.g., Main Navigation"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={newMenuLocation}
                  onChange={(e) => setNewMenuLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {MENU_LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button onClick={handleCreateMenu}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Menu Item</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {ITEM_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setNewItem({ ...newItem, type: type.id as any, pageId: undefined, postId: undefined })}
                      className={`flex flex-col items-center p-2 rounded-lg border ${
                        newItem.type === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <type.icon className="w-5 h-5 mb-1" />
                      <span className="text-xs">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  value={newItem.label || ''}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  placeholder="Menu item text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {newItem.type === 'CUSTOM' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="text"
                    value={newItem.url || ''}
                    onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                    placeholder="https://example.com or /page"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              {newItem.type === 'PAGE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Page</label>
                  <select
                    value={newItem.pageId || ''}
                    onChange={(e) => {
                      const page = availablePages.find(p => p.id === e.target.value);
                      setNewItem({ ...newItem, pageId: e.target.value, label: newItem.label || page?.title || '' });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a page...</option>
                    {availablePages.map(page => (
                      <option key={page.id} value={page.id}>{page.title}</option>
                    ))}
                  </select>
                </div>
              )}
              {newItem.type === 'POST' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Post</label>
                  <select
                    value={newItem.postId || ''}
                    onChange={(e) => {
                      const post = availablePosts.find(p => p.id === e.target.value);
                      setNewItem({ ...newItem, postId: e.target.value, label: newItem.label || post?.title || '' });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a post...</option>
                    {availablePosts.map(post => (
                      <option key={post.id} value={post.id}>{post.title}</option>
                    ))}
                  </select>
                </div>
              )}
              {newItem.type === 'PRODUCT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                  <select
                    value={newItem.productId || ''}
                    onChange={(e) => {
                      const product = availableProducts.find(p => p.id === e.target.value);
                      setNewItem({ ...newItem, productId: e.target.value, label: newItem.label || product?.name || '' });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a product...</option>
                    {availableProducts.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {newItem.type === 'CATEGORY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
                  <select
                    value={newItem.categoryId || ''}
                    onChange={(e) => {
                      const category = availableCategories.find(c => c.id === e.target.value);
                      setNewItem({ ...newItem, categoryId: e.target.value, label: newItem.label || category?.name || '' });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category...</option>
                    {availableCategories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Open in</label>
                <select
                  value={newItem.target || '_self'}
                  onChange={(e) => setNewItem({ ...newItem, target: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="_self">Same window</option>
                  <option value="_blank">New tab</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

