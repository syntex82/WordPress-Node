/**
 * Main JavaScript
 * Global functionality for the theme
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    initUserMenu();
    updateCartCount();
    initAddToCart();
  });

  // User menu dropdown
  function initUserMenu() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
      });

      document.addEventListener('click', function() {
        userDropdown.classList.remove('active');
      });
    }

    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('access_token');
        window.location.href = '/logout';
      });
    }
  }

  // Update cart count in header
  async function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;

    try {
      const response = await fetch('/api/shop/cart', {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        cartCount.style.display = 'none';
        return;
      }

      const cart = await response.json();
      const count = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      
      if (count > 0) {
        cartCount.textContent = count;
        cartCount.style.display = 'flex';
      } else {
        cartCount.style.display = 'none';
      }
    } catch (error) {
      cartCount.style.display = 'none';
    }
  }

  // Initialize add to cart buttons
  function initAddToCart() {
    // Product add to cart
    document.querySelectorAll('[data-add-product]').forEach(btn => {
      btn.addEventListener('click', async function() {
        const productId = this.dataset.addProduct;
        await addToCart('product', productId);
      });
    });

    // Course add to cart (paid courses)
    document.querySelectorAll('[data-add-course]').forEach(btn => {
      btn.addEventListener('click', async function() {
        const courseId = this.dataset.addCourse;
        await addToCart('course', courseId);
      });
    });

    // Free course enrollment
    document.querySelectorAll('[data-enroll-course]').forEach(btn => {
      btn.addEventListener('click', async function() {
        const courseId = this.dataset.enrollCourse;
        await enrollFreeCourse(courseId);
      });
    });
  }

  // Enroll in a free course
  async function enrollFreeCourse(courseId) {
    try {
      const response = await fetch(`/api/lms/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });

      if (response.ok) {
        showNotification('Successfully enrolled! Redirecting...', 'success');
        // Redirect to learning page after short delay
        setTimeout(() => {
          window.location.href = `/learn/${courseId}`;
        }, 1500);
      } else if (response.status === 401) {
        // Not logged in - redirect to login
        showNotification('Please log in to enroll', 'error');
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }, 1500);
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to enroll', 'error');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      showNotification('Failed to enroll', 'error');
    }
  }

  // Add item to cart
  async function addToCart(type, id) {
    try {
      const endpoint = type === 'course'
        ? '/api/shop/cart/add-course'
        : '/api/shop/cart/add';

      const body = type === 'course'
        ? { courseId: id }
        : { productId: id, quantity: 1 };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (response.ok) {
        updateCartCount();
        showNotification('Added to cart!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to add to cart', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Failed to add to cart', 'error');
    }
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-error)' : 'var(--color-primary)'};
      color: white;
      border-radius: 8px;
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Get auth headers
  function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Expose globally
  window.addToCart = addToCart;
  window.updateCartCount = updateCartCount;
})();

