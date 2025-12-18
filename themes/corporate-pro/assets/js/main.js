// Corporate Pro Theme - Main JavaScript

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Contact form submission
function submitContactForm(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);
  
  fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Thank you for your message! We will get back to you soon.');
      event.target.reset();
    } else {
      alert('Failed to send message. Please try again.');
    }
  })
  .catch(error => console.error('Error:', error));
}

// Portfolio filter
function filterPortfolio(category) {
  const items = document.querySelectorAll('.portfolio-item');
  items.forEach(item => {
    if (category === 'all' || item.dataset.category === category) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Scroll animations
function observeElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card, .portfolio-item, .team-member').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Corporate Pro Theme loaded');
  observeElements();
});

// Export functions for global use
window.submitContactForm = submitContactForm;
window.filterPortfolio = filterPortfolio;

