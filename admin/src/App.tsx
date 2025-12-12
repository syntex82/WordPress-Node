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
// LMS admin pages
import LmsAdminDashboard from './pages/lms/AdminDashboard';
import LmsCourses from './pages/lms/Courses';
import LmsCourseEditor from './pages/lms/CourseEditor';
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

          {/* Public LMS Routes */}
          <Route path="/lms/catalog" element={<LmsCourseCatalog />} />
          <Route path="/lms/course/:slug" element={<LmsCourseLanding />} />

          {/* Public Profile Routes */}
          <Route path="/u/:identifier" element={<PublicProfile />} />

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
              {/* LMS admin routes */}
              <Route path="lms" element={<LmsAdminDashboard />} />
              <Route path="lms/courses" element={<LmsCourses />} />
              <Route path="lms/courses/new" element={<LmsCourseEditor />} />
              <Route path="lms/courses/:id" element={<LmsCourseEditor />} />
              <Route path="lms/courses/:courseId/lessons" element={<LmsLessons />} />
              <Route path="lms/courses/:courseId/quizzes" element={<LmsQuizzes />} />
              <Route path="lms/courses/:courseId/quizzes/:quizId/questions" element={<LmsQuizQuestions />} />
              {/* LMS student routes (authenticated) */}
              <Route path="lms/dashboard" element={<LmsStudentDashboard />} />
              <Route path="lms/learn/:courseId" element={<LmsLearningPlayer />} />
              <Route path="lms/learn/:courseId/lesson/:lessonId" element={<LmsLearningPlayer />} />
              <Route path="lms/quiz/:courseId/:quizId" element={<LmsQuizPlayer />} />
              <Route path="lms/certificate/:courseId" element={<LmsCertificate />} />
              {/* Profile routes */}
              <Route path="profile" element={<MyProfile />} />
              <Route path="profile/:identifier" element={<PublicProfile />} />
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

