// LMS Pro Theme - Main JavaScript

// Enroll in course
function enrollCourse(courseId) {
  console.log('Enrolling in course:', courseId);
  // API call to enroll
  fetch(`/api/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Successfully enrolled in course!');
      window.location.href = `/my-courses/${courseId}`;
    } else {
      alert('Failed to enroll. Please try again.');
    }
  })
  .catch(error => console.error('Error:', error));
}

// Toggle module content
function toggleModule(element) {
  const content = element.nextElementSibling;
  const isHidden = content.style.display === 'none';
  content.style.display = isHidden ? 'block' : 'none';
  element.querySelector('span:last-child').style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

// Search courses
function searchCourses(query) {
  console.log('Searching for:', query);
  // Implement search functionality
}

// Filter courses
function filterCourses() {
  const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value);
  const levels = Array.from(document.querySelectorAll('input[name="level"]:checked')).map(el => el.value);
  const prices = Array.from(document.querySelectorAll('input[name="price"]:checked')).map(el => el.value);
  
  console.log('Filters:', { categories, levels, prices });
  // Implement filter functionality
}

// Add to wishlist
function addToWishlist(courseId) {
  fetch(`/api/wishlist/${courseId}`, {
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
  console.log('LMS Pro Theme loaded');
  
  // Add any initialization code here
  initializeTheme();
});

function initializeTheme() {
  // Theme initialization
  console.log('Initializing LMS Pro theme');
}

// Export functions for global use
window.enrollCourse = enrollCourse;
window.toggleModule = toggleModule;
window.searchCourses = searchCourses;
window.filterCourses = filterCourses;
window.addToWishlist = addToWishlist;

