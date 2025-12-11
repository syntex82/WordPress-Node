/**
 * Public Shop Page - Product Listing (Modern Design)
 */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { storefrontApi, Product, ProductCategory, menusApi, MenuItem } from '../../services/api';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categoryFilter = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadMenu();
  }, [page, categoryFilter, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data } = await storefrontApi.getProducts({
        page,
        limit: 12,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
      });
      setProducts(data.products);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await storefrontApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadMenu = async () => {
    try {
      // Try to get the 'shop' or 'header' menu
      const { data } = await menusApi.getByLocation('header');
      setMenuItems(data.items || []);
    } catch {
      // Fallback: try 'main' location
      try {
        const { data } = await menusApi.getByLocation('main');
        setMenuItems(data.items || []);
      } catch {
        console.log('No menu found for shop');
      }
    }
  };

  // URLs are now computed by the backend menus service
  // Just use item.url directly - it's automatically computed based on item type
  const getMenuItemUrl = (item: MenuItem): string => {
    return item.url || '#';
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    setSearchParams({ search, category: categoryFilter });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link to="/shop" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🛍️</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Shop</span>
              </Link>

              {/* Navigation Menu Items */}
              {menuItems.length > 0 && (
                <nav className="hidden md:flex items-center gap-6">
                  {menuItems.map((item) => (
                    <Link
                      key={item.id || item.label}
                      to={getMenuItemUrl(item)}
                      target={item.target || '_self'}
                      className="text-slate-600 hover:text-violet-600 font-medium transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            <div className="flex items-center gap-6">
              <Link to="/shop/cart" className="relative group">
                <div className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-full font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Cart
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Products</h1>
          <p className="text-xl text-white/80 mb-8">Find exactly what you're looking for</p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search products..."
                className="w-full px-6 py-4 rounded-full text-slate-900 shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30 text-lg"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-10">
          {/* Modern Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                Categories
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { setSearchParams({ search: searchQuery }); setPage(1); }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${!categoryFilter ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg shadow-violet-500/25' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    All Products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => { setSearchParams({ category: cat.slug, search: searchQuery }); setPage(1); }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${categoryFilter === cat.slug ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg shadow-violet-500/25' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <Link key={product.id} to={`/shop/product/${product.slug}`} className="group">
                      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300 hover:-translate-y-2">
                        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 relative overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                          {product.salePrice && (
                            <div className="absolute top-4 left-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                              SALE
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-semibold text-slate-900 text-lg mb-2 group-hover:text-violet-600 transition-colors">{product.name}</h3>
                          <div className="flex items-center gap-3">
                            {product.salePrice ? (
                              <>
                                <span className="text-2xl font-bold text-rose-500">${Number(product.salePrice).toFixed(2)}</span>
                                <span className="text-slate-400 line-through">${Number(product.price).toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-2xl font-bold text-slate-900">${Number(product.price).toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Modern Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-12">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-5 py-2.5 bg-white rounded-xl shadow-lg font-medium text-slate-600 hover:text-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl">
                      ← Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-xl font-medium transition-all ${p === page ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-5 py-2.5 bg-white rounded-xl shadow-lg font-medium text-slate-600 hover:text-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">🛍️</span>
              </div>
              <span className="text-xl font-bold">Shop</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} All rights reserved.
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Developed by <span className="text-violet-400 font-medium">Michael James Blenkinsop</span> — Lead Developer
              </p>
              <a href="mailto:m.blenkinsop@yahoo.co.uk" className="text-slate-500 text-xs hover:text-violet-400 transition-colors">
                m.blenkinsop@yahoo.co.uk
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

