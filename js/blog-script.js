// Blog page specific JavaScript
(function() {
    'use strict';

    // DOM ready check
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(function() {
        // Mobile menu toggle
        const menuBtn = document.querySelector('.menu-btn');
        const navLinks = document.querySelector('.nav-links');
        
        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.classList.toggle('active');
            });
            
            // Close menu on outside click
            document.addEventListener('click', (e) => {
                if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                    navLinks.classList.remove('active');
                }
            });
        }
        
        // Scroll to top functionality
        const scrollUpBtn = document.querySelector('.scroll-up-btn');
        if (scrollUpBtn) {
            // Show/hide scroll up button
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    scrollUpBtn.classList.add('show');
                } else {
                    scrollUpBtn.classList.remove('show');
                }
            });
            
            // Scroll to top when clicked
            scrollUpBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    });
})();
