/**
 * Main App Component
 * Handles routing and authentication state with role-based access control
 * Uses React.lazy for code-splitting to reduce initial bundle size
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { SiteThemeProvider, useSiteTheme } from './contexts/SiteThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import { TourProvider } from './components/GuidedTour';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Loading component for lazy-loaded routes - now theme-aware
const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 transition-colors">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
};

// Auth pages (loaded eagerly as they're entry points)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetupWizard from './pages/SetupWizard';

// Lazy-loaded pages - Core
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Posts = lazy(() => import('./pages/Posts'));
const PostEditor = lazy(() => import('./pages/PostEditor'));
const Pages = lazy(() => import('./pages/Pages'));
const PageEditor = lazy(() => import('./pages/PageEditor'));
const Media = lazy(() => import('./pages/Media'));
const Users = lazy(() => import('./pages/Users'));
const Groups = lazy(() => import('./pages/Groups'));
const GroupChat = lazy(() => import('./pages/GroupChat'));
const Messages = lazy(() => import('./pages/Messages'));

// Lazy-loaded pages - Theme & Design
const ThemeBuilder = lazy(() => import('./pages/ThemeBuilder'));
const ThemeDesigner = lazy(() => import('./pages/ThemeDesigner'));
const ThemeCustomizer = lazy(() => import('./pages/ThemeCustomizer'));
const ThemeContentManager = lazy(() => import('./pages/ThemeContentManager'));
const MenuManager = lazy(() => import('./pages/MenuManager'));
const MarketplaceAdmin = lazy(() => import('./pages/MarketplaceAdmin'));

// Lazy-loaded pages - Admin
const Backups = lazy(() => import('./pages/Backups'));
const Security = lazy(() => import('./pages/Security'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Seo = lazy(() => import('./pages/Seo'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Updates = lazy(() => import('./pages/Updates'));
const Languages = lazy(() => import('./pages/Languages'));

// Lazy-loaded pages - Shop
const ShopProducts = lazy(() => import('./pages/shop/Products'));
const ShopProductEditor = lazy(() => import('./pages/shop/ProductEditor'));
const ShopOrders = lazy(() => import('./pages/shop/Orders'));
const ShopOrderDetail = lazy(() => import('./pages/shop/OrderDetail'));
const ShopCategories = lazy(() => import('./pages/shop/Categories'));
const ShopShipping = lazy(() => import('./pages/shop/Shipping'));

// Lazy-loaded pages - Storefront
const StorefrontShop = lazy(() => import('./pages/storefront/Shop'));
const StorefrontProduct = lazy(() => import('./pages/storefront/ProductPage'));
const StorefrontCart = lazy(() => import('./pages/storefront/Cart'));
const StorefrontCheckout = lazy(() => import('./pages/storefront/Checkout'));
const StorefrontOrderSuccess = lazy(() => import('./pages/storefront/OrderSuccess'));

// Lazy-loaded pages - LMS Admin
const LmsAdminDashboard = lazy(() => import('./pages/lms/AdminDashboard'));
const LmsCourses = lazy(() => import('./pages/lms/Courses'));
const LmsCourseEditor = lazy(() => import('./pages/lms/CourseEditor'));
const LmsCourseCategories = lazy(() => import('./pages/lms/CourseCategories'));
const LmsLessons = lazy(() => import('./pages/lms/Lessons'));
const LmsQuizzes = lazy(() => import('./pages/lms/Quizzes'));
const LmsQuizQuestions = lazy(() => import('./pages/lms/QuizQuestions'));
const LmsCurriculumBuilder = lazy(() => import('./pages/lms/CurriculumBuilder'));
const CertificateTemplates = lazy(() => import('./pages/lms/CertificateTemplates'));
const CertificateTemplateEditor = lazy(() => import('./pages/lms/CertificateTemplateEditor'));

// Lazy-loaded pages - LMS Student
const LmsCourseCatalog = lazy(() => import('./pages/lms/CourseCatalog'));
const LmsCourseLanding = lazy(() => import('./pages/lms/CourseLanding'));
const LmsLearningPlayer = lazy(() => import('./pages/lms/LearningPlayer'));
const LmsStudentDashboard = lazy(() => import('./pages/lms/StudentDashboard'));
const LmsQuizPlayer = lazy(() => import('./pages/lms/QuizPlayer'));
const LmsCertificate = lazy(() => import('./pages/lms/Certificate'));

// Lazy-loaded pages - Profile
const MyProfile = lazy(() => import('./pages/profile/MyProfile'));
const PublicProfile = lazy(() => import('./pages/profile/PublicProfile'));

// Lazy-loaded pages - Feed
const ActivityFeed = lazy(() => import('./pages/feed/ActivityFeed'));
const Timeline = lazy(() => import('./pages/feed/Timeline'));

// Lazy-loaded pages - Email
const EmailTemplates = lazy(() => import('./pages/email/EmailTemplates'));
const EmailComposer = lazy(() => import('./pages/email/EmailComposer'));
const EmailLogs = lazy(() => import('./pages/email/EmailLogs'));
const EmailTemplateDesigner = lazy(() => import('./pages/email/EmailTemplateDesigner'));
const EmailSettings = lazy(() => import('./pages/email/EmailSettings'));

// Lazy-loaded pages - Developer Marketplace
const MarketplaceDashboard = lazy(() => import('./pages/marketplace').then(m => ({ default: m.MarketplaceDashboard })));
const MarketplaceDevelopers = lazy(() => import('./pages/marketplace').then(m => ({ default: m.Developers })));
const BrowseDevelopers = lazy(() => import('./pages/marketplace').then(m => ({ default: m.BrowseDevelopers })));
const HiringRequests = lazy(() => import('./pages/marketplace').then(m => ({ default: m.HiringRequests })));
const MarketplaceProjects = lazy(() => import('./pages/marketplace').then(m => ({ default: m.Projects })));
const DeveloperApplication = lazy(() => import('./pages/marketplace').then(m => ({ default: m.DeveloperApplication })));
const HireForm = lazy(() => import('./pages/marketplace').then(m => ({ default: m.HireForm })));
const MyDeveloperProfile = lazy(() => import('./pages/marketplace').then(m => ({ default: m.MyDeveloperProfile })));
const EditDeveloper = lazy(() => import('./pages/marketplace').then(m => ({ default: m.EditDeveloper })));
const HiringRequestDetail = lazy(() => import('./pages/marketplace').then(m => ({ default: m.HiringRequestDetail })));

// Lazy-loaded pages - Subscriptions
const Pricing = lazy(() => import('./pages/Pricing'));
const Subscription = lazy(() => import('./pages/Subscription'));

// Demo mode components
import { useDemoStore } from './stores/demoStore';
import { DemoBanner } from './components/DemoBanner';
import { DemoUpgradePrompt } from './components/DemoUpgradePrompt';

function AppContent() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { initFromCookie, isDemo } = useDemoStore();

  // Initialize demo mode from cookie on mount
  useEffect(() => {
    initFromCookie();
  }, [initFromCookie]);

  // Wait for Zustand to rehydrate from localStorage before rendering auth-dependent routes
  if (!_hasHydrated) {
    return <PageLoader />;
  }

  return (
    <>
      <Toaster />
      {/* Demo mode banner - shows at top when in demo mode */}
      {isDemo && <DemoBanner />}
      {/* Demo upgrade prompt modal */}
      <DemoUpgradePrompt />
      <BrowserRouter basename="/admin">
        <Suspense fallback={<PageLoader />}>
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
                <Route path="dev-marketplace/browse" element={<ProtectedRoute feature="marketplace"><BrowseDevelopers /></ProtectedRoute>} />
                <Route path="dev-marketplace/developers" element={<ProtectedRoute feature="marketplace" requiredRole="ADMIN"><MarketplaceDevelopers /></ProtectedRoute>} />
                <Route path="dev-marketplace/developers/:id/edit" element={<ProtectedRoute feature="marketplace" requiredRole="ADMIN"><EditDeveloper /></ProtectedRoute>} />
                <Route path="dev-marketplace/requests" element={<ProtectedRoute feature="marketplace"><HiringRequests /></ProtectedRoute>} />
                <Route path="dev-marketplace/requests/:id" element={<ProtectedRoute feature="marketplace"><HiringRequestDetail /></ProtectedRoute>} />
                <Route path="dev-marketplace/projects" element={<ProtectedRoute feature="marketplace"><MarketplaceProjects /></ProtectedRoute>} />
                <Route path="dev-marketplace/apply" element={<ProtectedRoute feature="marketplace"><DeveloperApplication /></ProtectedRoute>} />
                <Route path="dev-marketplace/hire/:developerId" element={<ProtectedRoute feature="marketplace"><HireForm /></ProtectedRoute>} />
                <Route path="dev-marketplace/my-profile" element={<ProtectedRoute feature="marketplace"><MyDeveloperProfile /></ProtectedRoute>} />

                {/* Shop Admin - specific routes before parameterized */}
                <Route path="shop/products" element={<ProtectedRoute feature="shop"><ShopProducts /></ProtectedRoute>} />
                <Route path="shop/products/new" element={<ProtectedRoute feature="shop" action="canCreate"><ShopProductEditor /></ProtectedRoute>} />
                <Route path="shop/products/:id" element={<ProtectedRoute feature="shop" action="canEdit"><ShopProductEditor /></ProtectedRoute>} />
                <Route path="shop/orders" element={<ProtectedRoute feature="shop"><ShopOrders /></ProtectedRoute>} />
                <Route path="shop/orders/:id" element={<ProtectedRoute feature="shop"><ShopOrderDetail /></ProtectedRoute>} />
                <Route path="shop/categories" element={<ProtectedRoute feature="shop"><ShopCategories /></ProtectedRoute>} />
                <Route path="shop/shipping" element={<ProtectedRoute feature="shop"><ShopShipping /></ProtectedRoute>} />

                {/* LMS Admin - IMPORTANT: specific routes MUST come before parameterized routes */}
                <Route path="lms" element={<ProtectedRoute feature="lms"><LmsAdminDashboard /></ProtectedRoute>} />
                <Route path="lms/categories" element={<ProtectedRoute feature="lms"><LmsCourseCategories /></ProtectedRoute>} />
                <Route path="lms/certificate-templates" element={<ProtectedRoute feature="lms"><CertificateTemplates /></ProtectedRoute>} />
                <Route path="lms/certificate-templates/:id" element={<ProtectedRoute feature="lms"><CertificateTemplateEditor /></ProtectedRoute>} />
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

                {/* Activity Feed */}
                <Route path="feed" element={<ActivityFeed />} />
                <Route path="timeline" element={<Timeline />} />

                {/* Security */}
                <Route path="security/*" element={<ProtectedRoute feature="security" requiredRole="ADMIN"><Security /></ProtectedRoute>} />

                {/* Email - specific routes before parameterized */}
                <Route path="email/templates" element={<ProtectedRoute feature="email" requiredRole="ADMIN"><EmailTemplates /></ProtectedRoute>} />
                <Route path="email/designer" element={<ProtectedRoute feature="email" requiredRole="ADMIN"><EmailTemplateDesigner /></ProtectedRoute>} />
                <Route path="email/composer" element={<ProtectedRoute feature="email" requiredRole="ADMIN"><EmailComposer /></ProtectedRoute>} />
                <Route path="email/logs" element={<ProtectedRoute feature="email" requiredRole="ADMIN"><EmailLogs /></ProtectedRoute>} />
                <Route path="email/settings" element={<ProtectedRoute feature="email" requiredRole="ADMIN"><EmailSettings /></ProtectedRoute>} />

                {/* Backups */}
                <Route path="backups" element={<ProtectedRoute feature="settings" requiredRole="ADMIN"><Backups /></ProtectedRoute>} />

                {/* Updates */}
                <Route path="updates" element={<ProtectedRoute feature="settings" requiredRole="ADMIN"><Updates /></ProtectedRoute>} />

                {/* Settings */}
                <Route path="settings" element={<ProtectedRoute feature="settings" requiredRole="ADMIN"><Settings /></ProtectedRoute>} />

                {/* Languages (i18n) */}
                <Route path="languages" element={<ProtectedRoute feature="settings" requiredRole="ADMIN"><Languages /></ProtectedRoute>} />

                {/* Subscription & Pricing (authenticated users only) */}
                <Route path="subscription" element={<Subscription />} />
                <Route path="subscription/success" element={<Subscription />} />
                <Route path="pricing" element={<Pricing />} />

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
        </Suspense>
      </BrowserRouter>
    </>
  );
}

// Main App component wrapped with SiteThemeProvider, I18nProvider, and TourProvider
function App() {
  return (
    <SiteThemeProvider>
      <I18nProvider>
        <TourProvider>
          <AppContent />
        </TourProvider>
      </I18nProvider>
    </SiteThemeProvider>
  );
}

export default App;

