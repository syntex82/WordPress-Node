// E-commerce Pro Theme - Main JavaScript

// Add to cart
function addToCart(productId, quantity = 1) {
  console.log('Adding to cart:', productId, quantity);
  
  fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ productId, quantity })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Product added to cart!');
      updateCartCount();
    } else {
      alert('Failed to add to cart. Please try again.');
    }
  })
  .catch(error => console.error('Error:', error));
}

// Update cart count
function updateCartCount() {
  fetch('/api/cart/count', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(response => response.json())
  .then(data => {
    const cartBadge = document.querySelector('.cart-count');
    if (cartBadge) {
      cartBadge.textContent = data.count;
    }
  });
}

// Add to wishlist
function addToWishlist(productId) {
  fetch(`/api/wishlist/${productId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Added to wishlist!');
    }
  })
  .catch(error => console.error('Error:', error));
}

// Filter products
function filterProducts() {
  const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value);
  const priceRange = document.querySelector('input[name="price-range"]')?.value;
  
  console.log('Filters:', { categories, priceRange });
  // Implement filter functionality
}

// Sort products
function sortProducts(sortBy) {
  console.log('Sorting by:', sortBy);
  // Implement sort functionality
}

// Product image gallery
function changeProductImage(imageSrc) {
  const mainImage = document.querySelector('.product-main-image');
  if (mainImage) {
    mainImage.src = imageSrc;
  }
}

// Quantity selector
function updateQuantity(value) {
  const quantityInput = document.querySelector('input[name="quantity"]');
  if (quantityInput) {
    let quantity = parseInt(quantityInput.value) + value;
    if (quantity < 1) quantity = 1;
    quantityInput.value = quantity;
  }
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('E-commerce Pro Theme loaded');
  updateCartCount();
});

// Export functions for global use
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;
window.changeProductImage = changeProductImage;
window.updateQuantity = updateQuantity;

