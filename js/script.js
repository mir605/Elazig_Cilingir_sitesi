// Modern JavaScript with performance optimizations
(function() {
    'use strict';

    // Performance optimization: Use passive event listeners where possible
    const passiveSupported = (function() {
        let supported = false;
        try {
            const options = {
                get passive() {
                    supported = true;
                    return false;
                }
            };
            window.addEventListener('test', null, options);
            window.removeEventListener('test', null, options);
        } catch (err) {
            supported = false;
        }
        return supported;
    })();

    const eventOptions = passiveSupported ? { passive: true } : false;

    // Utility functions
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const throttle = (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // Mobile menu functionality
    function initMobileMenu() {
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');

        if (!menuBtn || !navLinks) return;

    menuBtn.addEventListener('click', () => {
            const isActive = navLinks.classList.contains('active');
        navLinks.classList.toggle('active');
            
            // Update ARIA attributes for accessibility
            menuBtn.setAttribute('aria-expanded', !isActive);
            menuBtn.setAttribute('aria-label', isActive ? 'Menüyü Aç' : 'Menüyü Kapat');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                menuBtn.setAttribute('aria-expanded', 'false');
                menuBtn.setAttribute('aria-label', 'Menüyü Aç');
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuBtn.setAttribute('aria-expanded', 'false');
                menuBtn.setAttribute('aria-label', 'Menüyü Aç');
                menuBtn.focus();
            }
        });
    }

    // Header scroll effect with throttling for better performance
    function initHeaderScroll() {
    const header = document.querySelector('header');
        if (!header) return;

        const handleScroll = throttle(() => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        }, 16); // ~60fps

        window.addEventListener('scroll', handleScroll, eventOptions);
    }

    // Smooth scroll for anchor links
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Close mobile menu if open
                    const navLinks = document.querySelector('.nav-links');
                    const menuBtn = document.querySelector('.menu-btn');
                    if (navLinks?.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        menuBtn?.setAttribute('aria-expanded', 'false');
                    }
        }
    });
        });
    }

    // Accordion functionality with accessibility
    function initAccordion() {
    const accordionItems = document.querySelectorAll('.accordion-item');
        
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
            const content = item.querySelector('.accordion-content');
            
            if (!header || !content) return;

            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other accordion items
                accordionItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        const otherContent = otherItem.querySelector('.accordion-content');
                        const otherHeader = otherItem.querySelector('.accordion-header');
                        if (otherContent) otherContent.style.maxHeight = '0';
                        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle current item
                item.classList.toggle('active');
                header.setAttribute('aria-expanded', !isActive);
                
                if (!isActive) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                    content.style.maxHeight = '0';
                }
            });

            // Handle keyboard navigation
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
            }
        });
    });
    }
    
    // Scroll to top button with throttling
    function initScrollToTop() {
    const scrollUpBtn = document.querySelector('.scroll-up-btn');
        if (!scrollUpBtn) return;

        const handleScroll = throttle(() => {
        if (window.scrollY > 300) {
            scrollUpBtn.classList.add('show');
        } else {
            scrollUpBtn.classList.remove('show');
        }
        }, 16);

        window.addEventListener('scroll', handleScroll, eventOptions);

        scrollUpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Blog navigation functionality
    window.toggleBlog = function() {
        const currentPage = window.location.pathname.toLowerCase();
        
        if (currentPage.includes('blog.html') || currentPage.includes('/blog/')) {
            // Currently on blog page or blog article, go to home
            window.location.href = '/';
        } else {
            // Currently on home page, go to blog list
            window.location.href = 'blog.html';
        }
    };

    // Update blog button text based on current page
    function updateBlogButton() {
        const blogNavBtn = document.getElementById('blog-nav-btn');
        const currentPage = window.location.pathname.toLowerCase();
        
        if (blogNavBtn) {
            // Check if we're on blog.html or in blog directory
            if (currentPage.includes('blog.html') || currentPage.includes('/blog/')) {
                blogNavBtn.textContent = 'Ana Sayfa';
                blogNavBtn.setAttribute('aria-label', 'Ana sayfaya dön');
            } else {
                blogNavBtn.textContent = 'Blog';
                blogNavBtn.setAttribute('aria-label', 'Blog sayfasına git');
            }
        }
    }

    // Initialize blog button on page load
    function initBlogButton() {
        // Run immediately
        updateBlogButton();
        
        // Run after a small delay to ensure DOM is fully loaded
        setTimeout(updateBlogButton, 100);
        
        // Update button on page navigation
        window.addEventListener('popstate', updateBlogButton);
        
        // Update on hash change
        window.addEventListener('hashchange', updateBlogButton);
    }

    // Lazy loading for images with Intersection Observer
    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '20px 0px'
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Intersection Observer for section animations
    function initScrollAnimations() {
        if ('IntersectionObserver' in window) {
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        sectionObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px'
            });

            document.querySelectorAll('section').forEach(section => {
                sectionObserver.observe(section);
            });
        } else {
            // Fallback for browsers without Intersection Observer
            document.querySelectorAll('section').forEach(section => {
                section.classList.add('visible');
            });
        }
    }

    // Lazy load map when map section is in viewport
    function initMapLazyLoading() {
        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        let mapLoaded = false;

        const mapObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !mapLoaded) {
                    loadMap();
                    mapLoaded = true;
                    mapObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '100px 0px'
        });

        mapObserver.observe(mapElement);
    }

    // Load map function
    function loadMap() {
        if (typeof L === 'undefined') {
            // Load Local Leaflet CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'vendor/leaflet/leaflet.css';
            document.head.appendChild(link);

            // Load Local Leaflet JS
            const script = document.createElement('script');
            script.src = 'vendor/leaflet/leaflet.js';
            script.onload = initializeMap;
            document.head.appendChild(script);
        } else {
            initializeMap();
        }
    }

    // Initialize Leaflet map
    function initializeMap() {
    const mapElement = document.getElementById('map');
        if (!mapElement || typeof L === 'undefined') return;

        try {
        const lat = 38.669472;
        const lon = 39.205833;

            const map = L.map('map', {
                center: [lat, lon],
                zoom: 16,
                scrollWheelZoom: false,
                touchZoom: true,
                doubleClickZoom: true,
                boxZoom: false,
                keyboard: true,
                dragging: true
            });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18
        }).addTo(map);

        const customIcon = L.icon({
                iconUrl: 'vendor/leaflet/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
                shadowUrl: 'vendor/leaflet/images/marker-shadow.png',
            shadowSize: [41, 41],
            shadowAnchor: [12, 41]
        });
        
            L.marker([lat, lon], { icon: customIcon })
                .addTo(map)
                .bindPopup('<strong>Elazığ Çilingir</strong><br>Olgunlar mahallesi, Şehit Feyzi Gürsu caddesi, No 1/A, Elazığ Merkez')
            .openPopup();

            // Enable scroll wheel zoom when map is clicked
            map.on('click', () => {
                map.scrollWheelZoom.enable();
            });

            // Disable scroll wheel zoom when mouse leaves map
            map.on('mouseout', () => {
                map.scrollWheelZoom.disable();
            });

        } catch (error) {
            console.warn('Map initialization failed:', error);
            mapElement.innerHTML = '<p style="text-align: center; padding: 2rem;">Harita yüklenemedi. Lütfen sayfayı yenileyin.</p>';
        }
    }

    // Video optimization and lazy autoplay with mobile optimizations
    function initVideoOptimization() {
        const video = document.getElementById('hero-video');
        if (!video) return;

        // Mobile detection
        const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Mobile specific optimizations
        if (isMobile) {
            video.preload = 'metadata';
            // Keep autoplay on mobile but with lighter preload
        }

        // Ensure video plays immediately when loaded
        video.addEventListener('loadedmetadata', () => {
            video.play().catch(e => {
                console.log('Video autoplay failed:', e);
                // Fallback: show play button or poster
            });
        });

        // Pause video when not visible to save resources
        const pauseObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const vid = entry.target;
                if (!entry.isIntersecting) {
                    vid.pause();
                } else if (vid.paused && !isMobile) {
                    vid.play().catch(e => {
                        console.log('Video play failed:', e);
                    });
                }
            });
        }, {
            threshold: 0.1
        });

        pauseObserver.observe(video);

        // Add click to play for mobile
        if (isMobile) {
            video.addEventListener('click', () => {
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            });
        }
    }

    // Performance monitoring
    function initPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'navigation') {
                            // Log performance metrics for debugging
                            const metrics = {
                                dns: entry.domainLookupEnd - entry.domainLookupStart,
                                connect: entry.connectEnd - entry.connectStart,
                                ttfb: entry.responseStart - entry.requestStart,
                                download: entry.responseEnd - entry.responseStart,
                                domLoad: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                                totalTime: entry.loadEventEnd - entry.navigationStart
                            };
                            console.log('Performance Metrics:', metrics);
            }
        });
                });
                observer.observe({ entryTypes: ['navigation'] });
            } catch (error) {
                console.warn('Performance monitoring failed:', error);
            }
        }
    }

    // Mobile Services Slider
    function initMobileServicesSlider() {
        const servicesGrid = document.getElementById('servicesGrid');
        const servicesIndicator = document.getElementById('servicesIndicator');
        const serviceCards = document.querySelectorAll('.service-card');
        const indicators = document.querySelectorAll('.indicator-dot');
        
        if (!servicesGrid || !servicesIndicator || serviceCards.length === 0) return;
        
        // Only activate on mobile devices
        if (window.innerWidth <= 768) {
            let currentIndex = 0;
            
            // Function to update active indicator
            function updateActiveIndicator(index) {
                indicators.forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
                currentIndex = index;
            }
            
            // Function to scroll to specific card
            function scrollToCard(index) {
                if (index >= 0 && index < serviceCards.length) {
                    const cardWidth = serviceCards[0].offsetWidth;
                    const gap = 16; // 1rem gap
                    const scrollPosition = index * (cardWidth + gap);
                    
                    servicesGrid.scrollTo({
                        left: scrollPosition,
                        behavior: 'smooth'
                    });
                    
                    updateActiveIndicator(index);
                }
            }
            
            // Add click listeners to indicators
            indicators.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    scrollToCard(index);
                });
            });
            
            // Listen to scroll events to update active indicator
            let scrollTimeout;
            servicesGrid.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const scrollLeft = servicesGrid.scrollLeft;
                    const cardWidth = serviceCards[0].offsetWidth;
                    const gap = 16;
                    const newIndex = Math.round(scrollLeft / (cardWidth + gap));
                    
                    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < serviceCards.length) {
                        updateActiveIndicator(newIndex);
                    }
                }, 150);
            });
            
            // Touch swipe support
            let touchStartX = 0;
            let touchEndX = 0;
            
            servicesGrid.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            servicesGrid.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });
            
            function handleSwipe() {
                const swipeThreshold = 50;
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) > swipeThreshold) {
                    if (diff > 0 && currentIndex < serviceCards.length - 1) {
                        // Swipe left - next card
                        scrollToCard(currentIndex + 1);
                    } else if (diff < 0 && currentIndex > 0) {
                        // Swipe right - previous card
                        scrollToCard(currentIndex - 1);
                    }
                }
            }
            
            // Initialize first indicator as active
            updateActiveIndicator(0);
        }
    }

    // Initialize all functionality when DOM is ready
    function init() {
        initMobileMenu();
        initHeaderScroll();
        initSmoothScroll();
        initAccordion();
        initScrollToTop();
        initBlogButton();
        initLazyLoading();
        initScrollAnimations();
        initMapLazyLoading();
        initVideoOptimization();
        initMobileServicesSlider();
        
        // Initialize performance monitoring in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            initPerformanceMonitoring();
        }
    }

    // DOM ready check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Service Worker registration for better caching (optional)
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
    });
}); 
    }

})(); 