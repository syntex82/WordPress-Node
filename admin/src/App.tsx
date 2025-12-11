/**
 * Main App Component
 * Handles routing and authentication state
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import PostEditor from './pages/PostEditor';
import Pages from './pages/Pages';
import PageEditor from './pages/PageEditor';
import Media from './pages/Media';
import Users from './pages/Users';
import Groups from './pages/Groups';
import GroupChat from './pages/GroupChat';
import ThemeBuilder from './pages/ThemeBuilder';
import ThemeDesigner from './pages/ThemeDesigner';
import MenuManager from './pages/MenuManager';
import Security from './pages/Security';
import Settings from './pages/Settings';
import Layout from './components/Layout';
// Shop admin pages
import ShopProducts from './pages/shop/Products';
import ShopProductEditor from './pages/shop/ProductEditor';
import ShopOrders from './pages/shop/Orders';
import ShopOrderDetail from './pages/shop/OrderDetail';
import ShopCategories from './pages/shop/Categories';
// Storefront pages (public)
import StorefrontShop from './pages/storefront/Shop';
import StorefrontProduct from './pages/storefront/ProductPage';
import StorefrontCart from './pages/storefront/Cart';
import StorefrontCheckout from './pages/storefront/Checkout';
import StorefrontOrderSuccess from './pages/storefront/OrderSuccess';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Toaster />
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Public Storefront Routes */}
          <Route path="/shop" element={<StorefrontShop />} />
          <Route path="/shop/product/:slug" element={<StorefrontProduct />} />
          <Route path="/shop/cart" element={<StorefrontCart />} />
          <Route path="/shop/checkout" element={<StorefrontCheckout />} />
          <Route path="/shop/order-success" element={<StorefrontOrderSuccess />} />

          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="posts" element={<Posts />} />
              <Route path="posts/new" element={<PostEditor />} />
              <Route path="posts/edit/:id" element={<PostEditor />} />
              <Route path="pages" element={<Pages />} />
              <Route path="pages/new" element={<PageEditor />} />
              <Route path="pages/edit/:id" element={<PageEditor />} />
              <Route path="media" element={<Media />} />
              <Route path="users" element={<Users />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:id/chat" element={<GroupChat />} />
              <Route path="theme-builder" element={<ThemeBuilder />} />
              <Route path="theme-designer" element={<ThemeDesigner />} />
              <Route path="menus" element={<MenuManager />} />
              {/* Shop routes */}
              <Route path="shop/products" element={<ShopProducts />} />
              <Route path="shop/products/new" element={<ShopProductEditor />} />
              <Route path="shop/products/:id" element={<ShopProductEditor />} />
              <Route path="shop/orders" element={<ShopOrders />} />
              <Route path="shop/orders/:id" element={<ShopOrderDetail />} />
              <Route path="shop/categories" element={<ShopCategories />} />
              <Route path="security/*" element={<Security />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

