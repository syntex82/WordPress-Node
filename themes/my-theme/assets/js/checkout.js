/**
 * Checkout JavaScript
 * Handles checkout form and order placement
 */

(function() {
  'use strict';

  const API_BASE = '/api/shop';

  document.addEventListener('DOMContentLoaded', function() {
    loadOrderSummary();
    setupCheckoutForm();
  });

  // Load order summary from cart
  async function loadOrderSummary() {
    const orderItems = document.getElementById('orderItems');
    if (!orderItems) return;

    try {
      const response = await fetch(`${API_BASE}/cart`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to load cart');

      const cart = await response.json();

      if (!cart.items || cart.items.length === 0) {
        window.location.href = '/cart';
        return;
      }

      renderOrderItems(cart.items);
      updateTotals(cart);
    } catch (error) {
      console.error('Error loading order summary:', error);
      orderItems.innerHTML = '<p class="error">Failed to load order. Please try again.</p>';
    }
  }

  // Render order items
  function renderOrderItems(items) {
    const orderItems = document.getElementById('orderItems');
    if (!orderItems) return;

    orderItems.innerHTML = items.map(item => {
      const isCourse = item.type === 'COURSE';
      const image = item.product?.images?.[0] || item.course?.thumbnail || '/placeholder.jpg';
      const title = item.product?.name || item.course?.title || 'Unknown Item';
      const price = item.product?.price || item.course?.price || 0;

      return `
        <div class="order-item">
          <img src="${image}" alt="${title}" class="order-item-image">
          <div class="order-item-details">
            <div class="order-item-title">${title}</div>
            <div class="order-item-qty">${isCourse ? 'Course' : `Qty: ${item.quantity}`}</div>
          </div>
          <div class="order-item-price">$${(parseFloat(price) * item.quantity).toFixed(2)}</div>
        </div>
      `;
    }).join('');
  }

  // Update totals
  function updateTotals(cart) {
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.product?.price || item.course?.price || 0;
      return sum + (parseFloat(price) * item.quantity);
    }, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
  }

  // Setup checkout form
  function setupCheckoutForm() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const submitBtn = document.getElementById('placeOrderBtn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');

      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      submitBtn.disabled = true;

      const formData = new FormData(checkoutForm);
      const orderData = {
        email: formData.get('email'),
        billingAddress: {
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          address1: formData.get('address'),
          city: formData.get('city'),
          state: formData.get('state'),
          postalCode: formData.get('postalCode'),
          country: formData.get('country')
        }
      };

      try {
        const response = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(orderData),
          credentials: 'include'
        });

        if (response.ok) {
          const order = await response.json();
          // Clear cart count
          const cartCount = document.getElementById('cartCount');
          if (cartCount) cartCount.style.display = 'none';
          // Redirect to success page or show confirmation
          alert('Order placed successfully! Order ID: ' + order.id);
          window.location.href = '/';
        } else {
          const error = await response.json();
          alert(error.message || 'Failed to place order. Please try again.');
          resetButton(submitBtn, btnText, btnLoading);
        }
      } catch (error) {
        console.error('Error placing order:', error);
        alert('An error occurred. Please try again.');
        resetButton(submitBtn, btnText, btnLoading);
      }
    });
  }

  function resetButton(btn, text, loading) {
    text.style.display = 'inline';
    loading.style.display = 'none';
    btn.disabled = false;
  }

  function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
})();

