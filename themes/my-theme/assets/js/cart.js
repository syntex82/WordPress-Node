// Cart page functionality - CSP-compliant (no inline handlers)
(function() {
  'use strict';
  var API = '/api/shop/cart';

  function getAuthHeaders() {
    var token = localStorage.getItem('access_token');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  async function loadCart() {
    var itemsContainer = document.getElementById('cartItems');
    var emptyCart = document.getElementById('emptyCart');
    var cartContent = document.getElementById('cartContent');

    if (!itemsContainer) return;

    try {
      var r = await fetch(API, { credentials: 'include', headers: getAuthHeaders() });
      if (!r.ok) throw new Error('Failed to load cart');
      var cart = await r.json();

      if (!cart.items || cart.items.length === 0) {
        if (cartContent) cartContent.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
        return;
      }

      if (cartContent) cartContent.style.display = 'grid';
      if (emptyCart) emptyCart.style.display = 'none';
      renderItems(cart.items);
      updateSummary(cart);
    } catch (e) {
      console.error('Cart load error:', e);
      itemsContainer.innerHTML = '<div class="loading-state" style="color: var(--color-error);">Failed to load cart. Please refresh the page.</div>';
    }
  }

  function renderItems(items) {
    var container = document.getElementById('cartItems');
    if (!container) return;

    container.innerHTML = items.map(function(item) {
      var isCourse = item.itemType === 'COURSE' || item.courseId;
      var img = item.product?.images?.[0] || item.course?.featuredImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop';
      var title = item.product?.name || item.course?.title || 'Item';
      var price = item.product?.salePrice || item.product?.price || item.course?.priceAmount || 0;

      var qtyHtml = isCourse ? '' :
        '<div class="qty-controls">' +
          '<button class="qty-btn qty-decrease" data-item-id="' + item.id + '" data-qty="' + (item.quantity - 1) + '">−</button>' +
          '<span class="qty-value">' + item.quantity + '</span>' +
          '<button class="qty-btn qty-increase" data-item-id="' + item.id + '" data-qty="' + (item.quantity + 1) + '">+</button>' +
        '</div>';

      return '<div class="cart-item" data-item-id="' + item.id + '">' +
        '<img src="' + img + '" alt="' + title + '" class="cart-item-image">' +
        '<div class="cart-item-details">' +
          '<div class="cart-item-title">' + title + '</div>' +
          '<span class="cart-item-type ' + (isCourse ? 'course' : 'product') + '">' + (isCourse ? '📚 Course' : '📦 Product') + '</span>' +
          '<div class="cart-item-price">$' + parseFloat(price).toFixed(2) + (isCourse ? '' : ' × ' + item.quantity) + '</div>' +
        '</div>' +
        '<div class="cart-item-actions">' +
          qtyHtml +
          '<button class="remove-btn" data-item-id="' + item.id + '">🗑️ Remove</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function updateSummary(cart) {
    var subtotal = cart.items.reduce(function(sum, item) {
      var price = item.product?.salePrice || item.product?.price || item.course?.priceAmount || 0;
      return sum + (parseFloat(price) * item.quantity);
    }, 0);
    var tax = subtotal * 0.1;
    var total = subtotal + tax;

    var subtotalEl = document.getElementById('subtotal');
    var taxEl = document.getElementById('tax');
    var totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (taxEl) taxEl.textContent = '$' + tax.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
  }

  async function updateQuantity(id, qty) {
    if (qty < 1) {
      removeItem(id);
      return;
    }

    try {
      await fetch(API + '/item/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ quantity: qty }),
        credentials: 'include'
      });
      loadCart();
      if (window.updateCartCount) window.updateCartCount();
    } catch (e) {
      console.error('Update quantity error:', e);
    }
  }

  async function removeItem(id) {
    try {
      await fetch(API + '/item/' + id, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      loadCart();
      if (window.updateCartCount) window.updateCartCount();
    } catch (e) {
      console.error('Remove item error:', e);
    }
  }

  // Event delegation for cart actions (CSP-compliant)
  function setupEventListeners() {
    var container = document.getElementById('cartItems');
    if (!container) return;

    container.addEventListener('click', function(e) {
      var target = e.target;

      // Handle remove button
      if (target.classList.contains('remove-btn')) {
        var itemId = target.getAttribute('data-item-id');
        if (itemId) removeItem(itemId);
        return;
      }

      // Handle quantity buttons
      if (target.classList.contains('qty-btn')) {
        var itemId = target.getAttribute('data-item-id');
        var qty = parseInt(target.getAttribute('data-qty'), 10);
        if (itemId && !isNaN(qty)) updateQuantity(itemId, qty);
        return;
      }
    });
  }

  // Initialize
  function init() {
    setupEventListeners();
    loadCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();