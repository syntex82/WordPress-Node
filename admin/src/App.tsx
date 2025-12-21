/**
 * Main App Component
 * Handles routing and authentication state with role-based access control
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetupWizard from './pages/SetupWizard';
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
import MarketplaceAdmin from './pages/MarketplaceAdmin';
import Backups from './pages/Backups';
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
import LmsCurriculumBuilder from './pages/lms/CurriculumBuilder';
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
import ThemeContentManager from './pages/ThemeContentManager';
// Email
import EmailTemplates from './pages/email/EmailTemplates';
import EmailComposer from './pages/email/EmailComposer';
import EmailLogs from './pages/email/EmailLogs';
import EmailTemplateDesigner from './pages/email/EmailTemplateDesigner';
// Recommendations
import Recommendations from './pages/Recommendations';
// Developer Marketplace
import {
  MarketplaceDashboard,
  Developers as MarketplaceDevelopers,
  HiringRequests,
  Projects as MarketplaceProjects,
  DeveloperApplication,
  HireForm,
} from './pages/marketplace';

function App() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // Wait for Zustand to rehydrate from localStorage before rendering auth-dependent routes
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <BrowserRouter basename="/admin">
        <Routes>
          {/* ==================== PUBLIC ROUTES (No auth required) ==================== */}
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Public Profile */}
          <Route path="/u/:identifier" element={<PublicProfile />} />

          {/* ==================== AUTHENTICATED ROUTES ==================== */}
          {isAuthenticated ? (
            <>
              {/* Theme Customizer - Full screen, outside Layout */}
              <Route path="/customize" element={<ProtectedRoute feature="themes"><ThemeCustomizer /></ProtectedRoute>} />

              {/* Main Layout with Sidebar */}
              <Route path="/" element={<Layout />}>
                {/* Dashboard */}
                <Route index element={<ProtectedRoute feature="dashboard"><Dashboard /></ProtectedRoute>} />

                {/* Analytics, SEO & Recommendations */}
                <Route path="analytics" element={<ProtectedRoute feature="analytics" requiredRole="ADMIN"><Analytics /></ProtectedRoute>} />
                <Route path="seo" element={<ProtectedRoute feature="seo" requiredRole="EDITOR"><Seo /></ProtectedRoute>} />
                <Route path="recommendations" element={<ProtectedRoute feature="recommendations" requiredRole="ADMIN"><Recommendations /></ProtectedRoute>} />

                {/* Posts - specific routes before parameterized */}
                <Route path="posts" element={<ProtectedRoute feature="posts"><Posts /></ProtectedRoute>} />
                <Route path="posts/new" element={<ProtectedRoute feature="posts" action="canCreate"><PostEditor /></ProtectedRoute>} />
                <Route path="posts/edit/:id" element={<ProtectedRoute feature="posts" action="canEdit"><PostEditor /></ProtectedRoute>} />

                {/* Pages - specific routes before parameterized */}
                <Route path="pages" element={<ProtectedRoute feature="pages"><Pages /></ProtectedRoute>} />
                <Route path="pages/new" element={<ProtectedRoute feature="pages" action="canCreate"><PageEditor /></ProtectedRoute>} />
                <Route path="pages/edit/:id" element={<ProtectedRoute feature="pages" action="canEdit"><PageEditor /></ProtectedRoute>} />

                {/* Media */}
                <Route path="media" element={<ProtectedRoute feature="media"><Media /></ProtectedRoute>} />

                {/* User Management */}
                <Route path="users" element={<ProtectedRoute feature="users" requiredRole="ADMIN"><Users /></ProtectedRoute>} />

                {/* Messaging */}
                <Route path="messages" element={<ProtectedRoute feature="messages"><Messages /></ProtectedRoute>} />

                {/* Groups - specific routes before parameterized */}
                <Route path="groups" element={<ProtectedRoute feature="groups"><Groups /></ProtectedRoute>} />
                <Route path="groups/:id/chat" element={<ProtectedRoute feature="groups"><GroupChat /></ProtectedRoute>} />

                {/* Theme Management */}
                <Route path="menus" element={<ProtectedRoute feature="menus"><MenuManager /></ProtectedRoute>} />
                <Route path="theme-builder" element={<ProtectedRoute feature="themes"><ThemeBuilder /></ProtectedRoute>} />
                <Route path="theme-designer" element={<ProtectedRoute feature="themes"><ThemeDesigner /></ProtectedRoute>} />
                <Route path="theme-content" element={<ProtectedRoute feature="themes"><ThemeContentManager /></ProtectedRoute>} />
                <Route path="marketplace" element={<ProtectedRoute feature="themes" requiredRole="ADMIN"><MarketplaceAdmin /></ProtectedRoute>} />

                {/* Developer Marketplace */}
                <Route path="dev-marketplace" element={<ProtectedRoute feature="marketplace"><MarketplaceDashboard /></ProtectedRoute>} />
                <Route path="dev-marketplace/developers" element={<ProtectedRoute feature="marketplace" requiredRole="ADMIN"><MarketplaceDevelopers /></ProtectedRoute>} />
                <Route path="dev-marketplace/requests" element={<ProtectedRoute feature="marketplace"><HiringRequests /></ProtectedRoute>} />
                <Route path="dev-marketplace/projects" element={<ProtectedRoute feature="marketplace"><MarketplaceProjects /></ProtectedRoute>} />
                <Route path="dev-marketplace/apply" element={<ProtectedRoute feature="marketplace"><DeveloperApplication /></ProtectedRoute>} />
                <Route path="dev-marketplace/hire/:developerId" element={<ProtectedRoute feature="marketplace"><HireForm /></ProtectedRoute>} />

                {/* Shop Admin - specific routes before parameterized */}
                <Route path="shop/products" element={<ProtectedRoute feature="shop"><ShopProducts /></ProtectedRoute>} />
                <Route path="shop/products/new" element={<ProtectedRoute feature="shop" action="canCreate"><ShopProductEditor /></ProtectedRoute>} />
                <Route path="shop/products/:id" element={<ProtectedRoute feature="shop" action="canEdit"><ShopProductEditor /></ProtectedRoute>} />
                <Route path="shop/orders" element={<ProtectedRoute feature="shop"><ShopOrders /></ProtectedRoute>} />
                <Route path="shop/orders/:id" element={<ProtectedRoute feature="shop"><ShopOrderDetail /></ProtectedRoute>} />
                <Route path="shop/categories" element={<ProtectedRoute feature="shop"><ShopCategories /></ProtectedRoute>} />

                {/* LMS Admin - IMPORTANT: specific routes MUST come before parameterized routes */}
                <Route path="lms" element={<ProtectedRoute feature="lms"><LmsAdminDashboard /></ProtectedRoute>} />
                <Route path="lms/categories" element={<ProtectedRoute feature="lms"><LmsCourseCategories /></ProtectedRoute>} />
                <Route path="lms/catalog" element={<LmsCourseCatalog />} />
                <Route path="lms/dashboard" element={<LmsStudentDashboard />} />
                <Route path="lms/courses" element={<ProtectedRoute feature="lms"><LmsCourses /></ProtectedRoute>} />
                <Route path="lms/courses/new" element={<ProtectedRoute feature="lms" action="canCreate"><LmsCourseEditor /></ProtectedRoute>} />
                <Route path="lms/courses/:id" element={<ProtectedRoute feature="lms" action="canEdit"><LmsCourseEditor /></ProtectedRoute>} />
                <Route path="lms/courses/:courseId/lessons" element={<ProtectedRoute feature="lms" action="canEdit"><LmsLessons /></ProtectedRoute>} />
                <Route path="lms/courses/:courseId/curriculum" element={<ProtectedRoute feature="lms" action="canEdit"><LmsCurriculumBuilder /></ProtectedRoute>} />
                <Route path="lms/courses/:courseId/quizzes" element={<ProtectedRoute feature="lms" action="canEdit"><LmsQuizzes /></ProtectedRoute>} />
                <Route path="lms/courses/:courseId/quizzes/:quizId/questions" element={<ProtectedRoute feature="lms" action="canEdit"><LmsQuizQuestions /></ProtectedRoute>} />
                <Route path="lms/course/:slug" element={<LmsCourseLanding />} />
                <Route path="lms/learn/:courseId" element={<LmsLearningPlayer />} />
                <Route path="lms/learn/:courseId/lesson/:lessonId" element={<LmsLearningPlayer />} />
                <Route path="lms/quiz/:courseId/:quizId" element={<LmsQuizPlayer />} />
                <Route path="lms/certificate/:courseId" element={<LmsCertificate />} />

                {/* Profile */}
                <Route path="profile" element={<MyProfile />} />
                <Route path="profile/:identifier" element={<PublicProfile />} />

                {/* Security */}
                <Route path="security/*" element={<ProtectedRoute feature="security" requiredRole="ADMIN"><Security /></ProtectedRoute>} />

                {/* Email - specific routes before parameterized */}
                <Route path="email/templates" element={<ProtectedRoute feature="email" requiredRole="ADMIN"><EmailTemplates /></ProtectedRoute>} />
                <Route path="email/designer" element={<ProtectedRoute feature="email" requiredRole="ADMIN"><EmailTemplateDesigner /></ProtectedRoute>} />
                <Route path="email/composer" element={<ProtectedRoute feature="email" requiredRole="ADMIN"><EmailComposer /></ProtectedRoute>} />
                <Route path="email/logs" element={<ProtectedRoute feature="email" requiredRole="ADMIN"><EmailLogs /></ProtectedRoute>} />

                {/* Backups */}
                <Route path="backups" element={<ProtectedRoute feature="settings" requiredRole="ADMIN"><Backups /></ProtectedRoute>} />

                {/* Settings */}
                <Route path="settings" element={<ProtectedRoute feature="settings" requiredRole="ADMIN"><Settings /></ProtectedRoute>} />

                {/* Catch-all for authenticated users - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>

              {/* Public Storefront (accessible when logged in too) */}
              <Route path="/storefront" element={<StorefrontShop />} />
              <Route path="/storefront/product/:slug" element={<StorefrontProduct />} />
              <Route path="/storefront/cart" element={<StorefrontCart />} />
              <Route path="/storefront/checkout" element={<StorefrontCheckout />} />
              <Route path="/storefront/order-success" element={<StorefrontOrderSuccess />} />
            </>
          ) : (
            <>
              {/* Public Storefront Routes (when not logged in) */}
              <Route path="/storefront" element={<StorefrontShop />} />
              <Route path="/storefront/product/:slug" element={<StorefrontProduct />} />
              <Route path="/storefront/cart" element={<StorefrontCart />} />
              <Route path="/storefront/checkout" element={<StorefrontCheckout />} />
              <Route path="/storefront/order-success" element={<StorefrontOrderSuccess />} />

              {/* Redirect all other routes to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

