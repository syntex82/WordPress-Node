// My Account page functionality
(function() {
  var API = '/api';

  function getAuthHeaders() {
    var token = localStorage.getItem('access_token');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  async function checkAuth() {
    try {
      var r = await fetch(API + '/auth/me', { credentials: 'include', headers: getAuthHeaders() });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  async function loadProfile() {
    try {
      var r = await fetch(API + '/profiles/me', { credentials: 'include', headers: getAuthHeaders() });
      if (!r.ok) throw new Error('Failed to load profile');
      var profile = await r.json();
      document.getElementById('profileName').value = profile.displayName || profile.name || '';
      document.getElementById('profileEmail').value = profile.email || '';
      document.getElementById('profileBio').value = profile.bio || '';
    } catch (e) { console.error('Profile load error:', e); }
  }

  async function loadOrders() {
    var container = document.getElementById('ordersList');
    try {
      var r = await fetch(API + '/shop/my-orders', { credentials: 'include', headers: getAuthHeaders() });
      if (!r.ok) throw new Error('Failed to load orders');
      var data = await r.json();
      var orders = data.orders || data || [];

      if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon">📦</div><p>No orders yet</p><a href="/shop" class="btn btn-primary">Start Shopping</a></div>';
        return;
      }

      container.innerHTML = orders.map(function(order) {
        var statusClass = order.status === 'COMPLETED' ? 'completed' : order.status === 'CANCELLED' || order.status === 'FAILED' ? 'failed' : 'pending';
        var items = order.items || [];

        return '<div class="order-card">' +
          '<div class="order-header">' +
            '<div><div class="order-id">#' + order.orderNumber + '</div><div class="order-date">' + new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '</div></div>' +
            '<span class="order-status ' + statusClass + '">' + order.status + '</span>' +
          '</div>' +
          '<div class="order-items">' +
            items.map(function(item) {
              var img = item.product?.images?.[0] || item.course?.featuredImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop';
              var name = item.product?.name || item.course?.title || 'Item';
              return '<div class="order-item">' +
                '<img src="' + img + '" alt="' + name + '" class="order-item-image">' +
                '<div class="order-item-details">' +
                  '<div class="order-item-name">' + name + '</div>' +
                  '<div class="order-item-meta">Qty: ' + item.quantity + ' × $' + parseFloat(item.price || 0).toFixed(2) + '</div>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
          '<div class="order-total"><span>Total</span><span>$' + parseFloat(order.total).toFixed(2) + '</span></div>' +
        '</div>';
      }).join('');
    } catch (e) {
      container.innerHTML = '<div class="empty-state" style="color: var(--color-error);"><div class="icon">❌</div><p>Failed to load orders</p></div>';
    }
  }

  function setupTabs() {
    var links = document.querySelectorAll('.account-nav-link[data-tab]');
    var tabs = document.querySelectorAll('.tab-content');

    // Handle URL hash for deep linking
    var hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash + 'Tab')) {
      links.forEach(function(l) { l.classList.remove('active'); });
      tabs.forEach(function(t) { t.classList.remove('active'); });
      document.querySelector('[data-tab="' + hash + '"]')?.classList.add('active');
      document.getElementById(hash + 'Tab').classList.add('active');
      if (hash === 'orders') loadOrders();
    }

    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var tab = this.getAttribute('data-tab');
        if (!tab) return;

        links.forEach(function(l) { l.classList.remove('active'); });
        this.classList.add('active');

        tabs.forEach(function(t) { t.classList.remove('active'); });
        document.getElementById(tab + 'Tab').classList.add('active');

        window.location.hash = tab;
        if (tab === 'orders') loadOrders();
      });
    });
  }

  function setupProfileForm() {
    var form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var msg = document.getElementById('profileMessage');
      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;

      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        var r = await fetch(API + '/profiles/me', {
          method: 'PUT', credentials: 'include',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: document.getElementById('profileName').value,
            bio: document.getElementById('profileBio').value
          })
        });
        if (!r.ok) throw new Error('Failed to update profile');

        msg.style.display = 'block';
        msg.className = 'message success';
        msg.textContent = '✓ Profile updated successfully!';
        setTimeout(function() { msg.style.display = 'none'; }, 3000);
      } catch (e) {
        msg.style.display = 'block';
        msg.className = 'message error';
        msg.textContent = '✗ Failed to update profile';
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  function setupPasswordForm() {
    var form = document.getElementById('passwordForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var msg = document.getElementById('passwordMessage');
      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;

      var newPass = document.getElementById('newPassword').value;
      var confirmPass = document.getElementById('confirmPassword').value;

      if (newPass !== confirmPass) {
        msg.style.display = 'block';
        msg.className = 'message error';
        msg.textContent = '✗ Passwords do not match';
        return;
      }

      btn.textContent = 'Updating...';
      btn.disabled = true;

      try {
        var r = await fetch(API + '/auth/change-password', {
          method: 'POST', credentials: 'include',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: document.getElementById('currentPassword').value,
            newPassword: newPass
          })
        });
        if (!r.ok) throw new Error('Failed to change password');

        msg.style.display = 'block';
        msg.className = 'message success';
        msg.textContent = '✓ Password updated successfully!';
        form.reset();
        setTimeout(function() { msg.style.display = 'none'; }, 3000);
      } catch (e) {
        msg.style.display = 'block';
        msg.className = 'message error';
        msg.textContent = '✗ Failed to change password. Check your current password.';
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  function setupLogout() {
    var btn = document.getElementById('logoutBtn');
    if (!btn) return;

    btn.addEventListener('click', function() {
      localStorage.removeItem('access_token');
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/';
    });
  }

  // 2FA State
  var twofaSecret = null;

  async function load2FAStatus() {
    try {
      var r = await fetch(API + '/auth/me', { credentials: 'include', headers: getAuthHeaders() });
      if (!r.ok) return;
      var user = await r.json();
      update2FAStatusUI(user.twoFactorEnabled);
    } catch (e) {
      console.error('2FA status load error:', e);
    }
  }

  function update2FAStatusUI(enabled) {
    var indicator = document.getElementById('twofa-status-indicator');
    var enableBtn = document.getElementById('twofaEnableBtn');
    var disableBtn = document.getElementById('twofaDisableBtn');

    if (enabled) {
      indicator.className = 'status-indicator enabled';
      indicator.innerHTML = '<span class="status-icon">✅</span><span class="status-text">Two-Factor Authentication is enabled</span>';
      enableBtn.style.display = 'none';
      disableBtn.style.display = 'inline-block';
    } else {
      indicator.className = 'status-indicator disabled';
      indicator.innerHTML = '<span class="status-icon">⚠️</span><span class="status-text">Two-Factor Authentication is not enabled</span>';
      enableBtn.style.display = 'inline-block';
      disableBtn.style.display = 'none';
    }
  }

  async function generate2FASecret() {
    var msg = document.getElementById('twofaMessage');
    try {
      var r = await fetch(API + '/security/2fa/generate', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (!r.ok) throw new Error('Failed to generate 2FA secret');
      var data = await r.json();
      twofaSecret = data.secret;

      // Show QR code
      document.getElementById('twofa-qrcode').innerHTML = '<img src="' + data.qrCode + '" alt="2FA QR Code">';
      document.getElementById('twofa-secret-key').textContent = data.secret;

      // Show setup section
      document.getElementById('twofa-setup').style.display = 'block';
      document.getElementById('twofaEnableBtn').style.display = 'none';
    } catch (e) {
      msg.style.display = 'block';
      msg.className = 'message error';
      msg.textContent = '✗ Failed to generate 2FA secret. Please try again.';
    }
  }

  async function enable2FA(code) {
    var msg = document.getElementById('twofaMessage');
    try {
      var r = await fetch(API + '/security/2fa/enable', {
        method: 'POST',
        credentials: 'include',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: twofaSecret, token: code })
      });
      if (!r.ok) {
        var err = await r.json();
        throw new Error(err.message || 'Invalid verification code');
      }
      var data = await r.json();

      // Show backup codes
      var codesContainer = document.getElementById('backup-codes-list');
      codesContainer.innerHTML = data.recoveryCodes.map(function(code) {
        return '<div class="backup-code">' + code + '</div>';
      }).join('');

      document.getElementById('twofa-setup').style.display = 'none';
      document.getElementById('twofa-backup-codes').style.display = 'block';

      msg.style.display = 'block';
      msg.className = 'message success';
      msg.textContent = '✓ Two-Factor Authentication enabled successfully!';
    } catch (e) {
      msg.style.display = 'block';
      msg.className = 'message error';
      msg.textContent = '✗ ' + e.message;
    }
  }

  async function disable2FA(password) {
    var msg = document.getElementById('twofaMessage');
    try {
      var r = await fetch(API + '/security/2fa/disable', {
        method: 'POST',
        credentials: 'include',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
      });
      if (!r.ok) {
        var err = await r.json();
        throw new Error(err.message || 'Invalid password');
      }

      document.getElementById('twofa-disable-modal').style.display = 'none';
      update2FAStatusUI(false);

      msg.style.display = 'block';
      msg.className = 'message success';
      msg.textContent = '✓ Two-Factor Authentication has been disabled.';
      setTimeout(function() { msg.style.display = 'none'; }, 3000);
    } catch (e) {
      msg.style.display = 'block';
      msg.className = 'message error';
      msg.textContent = '✗ ' + e.message;
    }
  }

  function setup2FA() {
    // Enable button
    var enableBtn = document.getElementById('twofaEnableBtn');
    if (enableBtn) {
      enableBtn.addEventListener('click', generate2FASecret);
    }

    // Cancel setup button
    var cancelBtn = document.getElementById('twofaCancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        document.getElementById('twofa-setup').style.display = 'none';
        document.getElementById('twofaEnableBtn').style.display = 'inline-block';
        twofaSecret = null;
      });
    }

    // Verify form
    var verifyForm = document.getElementById('twofaVerifyForm');
    if (verifyForm) {
      verifyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var code = document.getElementById('twofaCode').value;
        if (code.length !== 6) {
          var msg = document.getElementById('twofaMessage');
          msg.style.display = 'block';
          msg.className = 'message error';
          msg.textContent = '✗ Please enter a 6-digit code';
          return;
        }
        enable2FA(code);
      });
    }

    // Backup codes done button
    var doneBtn = document.getElementById('backupCodesDoneBtn');
    if (doneBtn) {
      doneBtn.addEventListener('click', function() {
        document.getElementById('twofa-backup-codes').style.display = 'none';
        update2FAStatusUI(true);
        var msg = document.getElementById('twofaMessage');
        setTimeout(function() { msg.style.display = 'none'; }, 3000);
      });
    }

    // Disable button
    var disableBtn = document.getElementById('twofaDisableBtn');
    if (disableBtn) {
      disableBtn.addEventListener('click', function() {
        document.getElementById('twofa-disable-modal').style.display = 'flex';
      });
    }

    // Disable cancel button
    var disableCancelBtn = document.getElementById('twofaDisableCancelBtn');
    if (disableCancelBtn) {
      disableCancelBtn.addEventListener('click', function() {
        document.getElementById('twofa-disable-modal').style.display = 'none';
        document.getElementById('twofaDisablePassword').value = '';
      });
    }

    // Disable form
    var disableForm = document.getElementById('twofaDisableForm');
    if (disableForm) {
      disableForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var password = document.getElementById('twofaDisablePassword').value;
        disable2FA(password);
      });
    }

    // Load initial status
    load2FAStatus();
  }

  async function init() {
    var user = await checkAuth();
    if (!user) {
      document.getElementById('accountContent').style.display = 'none';
      document.getElementById('notLoggedIn').style.display = 'block';
      return;
    }

    setupTabs();
    setupProfileForm();
    setupPasswordForm();
    setupLogout();
    setup2FA();
    loadProfile();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

