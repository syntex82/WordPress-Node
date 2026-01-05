(function(){
  'use strict';
  var API = '/api/shop';
  var stripe = null;
  var cardElement = null;

  document.addEventListener('DOMContentLoaded', async function() {
    await initStripe();
    await loadOrderSummary();
    setupForm();
  });

  async function initStripe() {
    try {
      var r = await fetch(API + '/checkout/config', { credentials: 'include', headers: getAuthHeaders() });
      if (!r.ok) throw new Error('Failed to load Stripe config');
      var config = await r.json();
      if (config.publishableKey) {
        stripe = Stripe(config.publishableKey);
        var elements = stripe.elements();
        cardElement = elements.create('card', {
          style: {
            base: {
              color: '#E2E8F0',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSmoothing: 'antialiased',
              fontSize: '16px',
              '::placeholder': { color: '#94A3B8' }
            },
            invalid: { color: '#dc2626', iconColor: '#dc2626' }
          }
        });
        cardElement.mount('#card-element');
        cardElement.on('change', function(event) {
          var displayError = document.getElementById('card-errors');
          displayError.textContent = event.error ? event.error.message : '';
        });
      }
    } catch (e) {
      console.error('Failed to load Stripe:', e);
      document.getElementById('card-errors').textContent = 'Payment system failed to load. Please refresh.';
    }
  }

  async function loadOrderSummary() {
    var el = document.getElementById('orderItems');
    if (!el) return;
    try {
      var r = await fetch(API + '/cart', { credentials: 'include', headers: getAuthHeaders() });
      if (!r.ok) throw new Error();
      var cart = await r.json();
      if (!cart.items || cart.items.length === 0) {
        window.location.href = '/cart';
        return;
      }
      renderItems(cart.items);
      updateTotals(cart);
    } catch (e) {
      el.innerHTML = '<p style="color: var(--color-text-muted);">Failed to load cart</p>';
    }
  }

  function renderItems(items) {
    var el = document.getElementById('orderItems');
    if (!el) return;
    el.innerHTML = items.map(function(i) {
      var isCourse = i.itemType === 'COURSE';
      var img = i.image || '';
      var title = i.name || 'Item';
      var price = i.price || 0;
      var imgHtml = img ? '<img src="' + img + '" style="width:50px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.style.display=\'none\'">' : '<div style="width:50px;height:50px;background:var(--color-border);border-radius:4px;"></div>';
      return '<div style="display:flex;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid var(--color-border);font-size:0.9rem;">' +
        imgHtml +
        '<div style="flex:1;"><div style="font-weight:500;">' + title + '</div>' +
        '<div style="color:var(--color-text-muted);font-size:0.85rem;">' + (isCourse ? 'Course' : 'Qty: ' + i.quantity) + '</div></div>' +
        '<div style="font-weight:500;">$' + (parseFloat(price) * i.quantity).toFixed(2) + '</div></div>';
    }).join('');
  }

  function updateTotals(cart) {
    var sub = cart.subtotal || 0;
    var tax = 0;
    document.getElementById('subtotal').textContent = '$' + parseFloat(sub).toFixed(2);
    document.getElementById('tax').textContent = '$' + tax.toFixed(2);
    document.getElementById('total').textContent = '$' + parseFloat(sub).toFixed(2);
  }

  function setupForm() {
    var form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      var btn = document.getElementById('placeOrderBtn');
      var txt = btn.querySelector('.btn-text');
      var load = btn.querySelector('.btn-loading');

      txt.style.display = 'none';
      load.style.display = 'inline';
      btn.disabled = true;

      var fd = new FormData(form);
      var email = fd.get('email');

      if (!email) {
        showError('Please enter your email address');
        resetBtn(btn, txt, load);
        return;
      }

      if (!stripe || !cardElement) {
        showError('Payment system not ready. Please refresh the page.');
        resetBtn(btn, txt, load);
        return;
      }

      try {
        // Step 1: Create order and get payment intent
        var orderData = {
          email: email,
          billingAddress: {
            firstName: fd.get('firstName') || '',
            lastName: fd.get('lastName') || '',
            address1: fd.get('address') || '',
            city: fd.get('city') || '',
            state: fd.get('state') || '',
            postalCode: fd.get('postalCode') || '',
            country: fd.get('country') || ''
          }
        };

        load.textContent = 'Creating order...';

        var r = await fetch(API + '/checkout/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(orderData),
          credentials: 'include'
        });

        if (!r.ok) {
          var err = await r.json();
          throw new Error(err.message || 'Failed to create order');
        }

        var orderResult = await r.json();
        var clientSecret = orderResult.clientSecret;
        var orderId = orderResult.order.id;

        // Step 2: Confirm payment with Stripe
        load.textContent = 'Processing payment...';

        var result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: email,
              name: ((fd.get('firstName') || '') + ' ' + (fd.get('lastName') || '')).trim(),
              address: {
                line1: fd.get('address') || '',
                city: fd.get('city') || '',
                state: fd.get('state') || '',
                postal_code: fd.get('postalCode') || '',
                country: fd.get('country') || ''
              }
            }
          }
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        // Payment successful!
        load.textContent = 'Payment successful!';
        window.location.href = '/order-success?order=' + orderId;

      } catch (e) {
        console.error('Checkout error:', e);
        showError(e.message || 'Checkout failed. Please try again.');
        resetBtn(btn, txt, load);
      }
    });
  }

  function showError(msg) {
    var existing = document.querySelector('.checkout-error');
    if (existing) existing.remove();

    var form = document.getElementById('checkoutForm');
    var errorDiv = document.createElement('div');
    errorDiv.className = 'checkout-error';
    errorDiv.style.cssText = 'background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;';
    errorDiv.textContent = msg;
    form.insertBefore(errorDiv, form.firstChild);
  }

  function resetBtn(b, t, l) {
    t.style.display = 'inline';
    l.style.display = 'none';
    l.textContent = 'Processing...';
    b.disabled = false;
  }

  function getAuthHeaders() {
    var t = getCookie('access_token') || localStorage.getItem('access_token');
    return t ? { 'Authorization': 'Bearer ' + t } : {};
  }

  function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
})();