/**
 * Authentication JavaScript
 * Handles login and registration form submissions
 * For SSR pages, we let the native form submission work (sets HTTP-only cookies)
 * We just add loading state and client-side validation
 */

(function() {
  'use strict';

  // Login form handler - let native form submission work for SSR cookie auth
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      const submitBtn = document.getElementById('submitBtn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');

      // Basic validation
      const email = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;

      if (!email || !password) {
        e.preventDefault();
        showError(loginForm, 'Please fill in all fields');
        return;
      }

      // Show loading state - form will submit natively
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      submitBtn.disabled = true;

      // Let form submit naturally to /login which sets the cookie
    });
  }

  // Register form handler - let native form submission work for SSR cookie auth
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      const submitBtn = document.getElementById('submitBtn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');

      const password = registerForm.querySelector('[name="password"]').value;
      const confirmPassword = registerForm.querySelector('[name="confirmPassword"]').value;

      // Validate passwords match
      if (password !== confirmPassword) {
        e.preventDefault();
        showError(registerForm, 'Passwords do not match');
        return;
      }

      // Show loading state - form will submit natively
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      submitBtn.disabled = true;

      // Let form submit naturally to /register which sets the cookie
    });
  }

  // User menu dropdown
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

  // Helper functions
  function showError(form, message) {
    let alertEl = form.querySelector('.alert-error');
    if (!alertEl) {
      alertEl = document.createElement('div');
      alertEl.className = 'alert alert-error';
      form.insertBefore(alertEl, form.firstChild);
    }
    alertEl.textContent = message;
  }

  function resetButton(btn, text, loading) {
    text.style.display = 'inline';
    loading.style.display = 'none';
    btn.disabled = false;
  }
})();

