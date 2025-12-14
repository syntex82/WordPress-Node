/**
 * Main App Component
 * Handles routing and authentication state with role-based access control
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
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
import ProtectedRoute from './components/ProtectedRoute';
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
// LMS admin pages
import LmsAdminDashboard from './pages/lms/AdminDashboard';
import LmsCourses from './pages/lms/Courses';
import LmsCourseEditor from './pages/lms/CourseEditor';
import LmsCourseCategories from './pages/lms/CourseCategories';
import LmsLessons from './pages/lms/Lessons';
import LmsQuizzes from './pages/lms/Quizzes';
import LmsQuizQuestions from './pages/lms/QuizQuestions';
// LMS student pages
import LmsCourseCatalog from './pages/lms/CourseCatalog';
import LmsCourseLanding from './pages/lms/CourseLanding';
import LmsLearningPlayer from './pages/lms/LearningPlayer';
import LmsStudentDashboard from './pages/lms/StudentDashboard';
import LmsQuizPlayer from './pages/lms/QuizPlayer';
import LmsCertificate from './pages/lms/Certificate';
// Profile pages
import MyProfile from './pages/profile/MyProfile';
import PublicProfile from './pages/profile/PublicProfile';
// Analytics
import Analytics from './pages/Analytics';
// SEO
import Seo from './pages/Seo';
// Messages
import Messages from './pages/Messages';
// Theme Customizer
import ThemeCustomizer from './pages/ThemeCustomizer';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Toaster />
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public Storefront Routes */}
          <Route path="/shop" element={<StorefrontShop />} />
          <Route path="/shop/product/:slug" element={<StorefrontProduct />} />
          <Route path="/shop/cart" element={<StorefrontCart />} />
          <Route path="/cart" element={<StorefrontCart />} />
          <Route path="/shop/checkout" element={<StorefrontCheckout />} />
          <Route path="/checkout" element={<StorefrontCheckout />} />
          <Route path="/shop/order-success" element={<StorefrontOrderSuccess />} />
          <Route path="/order-success" element={<StorefrontOrderSuccess />} />

          {/* Public LMS Routes */}
          <Route path="/lms/catalog" element={<LmsCourseCatalog />} />
          <Route path="/lms/course/:slug" element={<LmsCourseLanding />} />

          {/* Public Profile Routes */}
          <Route path="/u/:identifier" element={<PublicProfile />} />

          {/* Theme Customizer - Full screen experience, outside Layout */}
          {isAuthenticated && (
            <Route path="/customize" element={<ProtectedRoute feature="themes"><ThemeCustomizer /></ProtectedRoute>} />
          )}

          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              {/* Dashboard - accessible to all */}
              <Route index element={<ProtectedRoute feature="dashboard"><Dashboard /></ProtectedRoute>} />

              {/* Content Management */}
              <Route path="posts" element={<ProtectedRoute feature="posts"><Posts /></ProtectedRoute>} />
              <Route path="posts/new" element={<ProtectedRoute feature="posts" action="canCreate"><PostEditor /></ProtectedRoute>} />
              <Route path="posts/edit/:id" element={<ProtectedRoute feature="posts" action="canEdit"><PostEditor /></ProtectedRoute>} />
              <Route path="pages" element={<ProtectedRoute feature="pages"><Pages /></ProtectedRoute>} />
              <Route path="pages/new" element={<ProtectedRoute feature="pages" action="canCreate"><PageEditor /></ProtectedRoute>} />
              <Route path="pages/edit/:id" element={<ProtectedRoute feature="pages" action="canEdit"><PageEditor /></ProtectedRoute>} />
              <Route path="media" element={<ProtectedRoute feature="media"><Media /></ProtectedRoute>} />

              {/* User Management */}
              <Route path="users" element={<ProtectedRoute feature="users" requiredRole="ADMIN"><Users /></ProtectedRoute>} />

              {/* Messaging - accessible to all authenticated users */}
              <Route path="messages" element={<ProtectedRoute feature="messages"><Messages /></ProtectedRoute>} />

              {/* Groups */}
              <Route path="groups" element={<ProtectedRoute feature="groups"><Groups /></ProtectedRoute>} />
              <Route path="groups/:id/chat" element={<ProtectedRoute feature="groups"><GroupChat /></ProtectedRoute>} />

              {/* Theme Management */}
              <Route path="theme-builder" element={<ProtectedRoute feature="themes"><ThemeBuilder /></ProtectedRoute>} />
              <Route path="theme-designer" element={<ProtectedRoute feature="themes"><ThemeDesigner /></ProtectedRoute>} />
              <Route path="menus" element={<ProtectedRoute feature="menus"><MenuManager /></ProtectedRoute>} />

              {/* Shop routes */}
              <Route path="shop/products" element={<ProtectedRoute feature="shop"><ShopProducts /></ProtectedRoute>} />
              <Route path="shop/products/new" element={<ProtectedRoute feature="shop" action="canCreate"><ShopProductEditor /></ProtectedRoute>} />
              <Route path="shop/products/:id" element={<ProtectedRoute feature="shop" action="canEdit"><ShopProductEditor /></ProtectedRoute>} />
              <Route path="shop/orders" element={<ProtectedRoute feature="shop"><ShopOrders /></ProtectedRoute>} />
              <Route path="shop/orders/:id" element={<ProtectedRoute feature="shop"><ShopOrderDetail /></ProtectedRoute>} />
              <Route path="shop/categories" element={<ProtectedRoute feature="shop"><ShopCategories /></ProtectedRoute>} />

              {/* LMS admin routes */}
              <Route path="lms" element={<ProtectedRoute feature="lms"><LmsAdminDashboard /></ProtectedRoute>} />
              <Route path="lms/courses" element={<ProtectedRoute feature="lms"><LmsCourses /></ProtectedRoute>} />
              <Route path="lms/courses/new" element={<ProtectedRoute feature="lms" action="canCreate"><LmsCourseEditor /></ProtectedRoute>} />
              <Route path="lms/courses/:id" element={<ProtectedRoute feature="lms" action="canEdit"><LmsCourseEditor /></ProtectedRoute>} />
              <Route path="lms/courses/:courseId/lessons" element={<ProtectedRoute feature="lms" action="canEdit"><LmsLessons /></ProtectedRoute>} />
              <Route path="lms/courses/:courseId/quizzes" element={<ProtectedRoute feature="lms" action="canEdit"><LmsQuizzes /></ProtectedRoute>} />
              <Route path="lms/courses/:courseId/quizzes/:quizId/questions" element={<ProtectedRoute feature="lms" action="canEdit"><LmsQuizQuestions /></ProtectedRoute>} />
              <Route path="lms/categories" element={<ProtectedRoute feature="lms"><LmsCourseCategories /></ProtectedRoute>} />

              {/* LMS student routes (authenticated) - accessible to all */}
              <Route path="lms/dashboard" element={<LmsStudentDashboard />} />
              <Route path="lms/learn/:courseId" element={<LmsLearningPlayer />} />
              <Route path="lms/learn/:courseId/lesson/:lessonId" element={<LmsLearningPlayer />} />
              <Route path="lms/quiz/:courseId/:quizId" element={<LmsQuizPlayer />} />
              <Route path="lms/certificate/:courseId" element={<LmsCertificate />} />

              {/* Profile routes - accessible to all */}
              <Route path="profile" element={<MyProfile />} />
              <Route path="profile/:identifier" element={<PublicProfile />} />

              {/* Analytics */}
              <Route path="analytics" element={<ProtectedRoute feature="analytics" requiredRole="ADMIN"><Analytics /></ProtectedRoute>} />

              {/* SEO */}
              <Route path="seo" element={<ProtectedRoute feature="seo" requiredRole="EDITOR"><Seo /></ProtectedRoute>} />

              {/* Security - Admin only */}
              <Route path="security/*" element={<ProtectedRoute feature="security" requiredRole="ADMIN"><Security /></ProtectedRoute>} />

              {/* Settings */}
              <Route path="settings" element={<ProtectedRoute feature="settings" requiredRole="ADMIN"><Settings /></ProtectedRoute>} />
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

