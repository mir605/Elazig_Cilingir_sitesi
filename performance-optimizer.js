/**
 * Performance Optimizer for Elazığ Çilingir Website
 * Addresses all identified performance issues
 */

class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.optimizeFontLoading();
        this.optimizeCSSLoading();
        this.optimizeJavaScriptLoading();
        this.optimizeImages();
        this.optimizeVideo();
        this.setupServiceWorker();
        this.monitorPerformance();
    }

    // Font Display Optimization
    optimizeFontLoading() {
        // Add font-display: swap to Google Fonts
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => {
            if (!link.href.includes('display=swap')) {
                link.href += '&display=swap';
            }
        });

        // Preload critical fonts
        const criticalFonts = [
            'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
        ];

        criticalFonts.forEach(fontUrl => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = fontUrl;
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    // CSS Optimization
    optimizeCSSLoading() {
        // Remove unused CSS by loading only critical styles inline
        const criticalCSS = `
            /* Critical above-the-fold styles only */
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f8f9fa;color:#333;line-height:1.6}
            header{background:linear-gradient(135deg,#2c3e50,#1a1a2e);color:#fff;padding:15px 0;position:fixed;top:0;width:100%;z-index:1000;box-shadow:0 2px 10px rgba(0,0,0,.1)}
            .hero{position:relative;height:80vh;display:flex;align-items:center;color:#fff;text-align:center;overflow:hidden;margin-top:80px}
            .btn{display:inline-block;background:linear-gradient(to right,#dc2626,#ea580c);color:#fff;padding:15px 35px;border-radius:50px;text-decoration:none;font-weight:600;font-size:1.1rem;transition:all .3s;border:0;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,.2)}
        `;

        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.insertBefore(style, document.head.firstChild);

        // Defer non-critical CSS
        const nonCriticalCSS = document.querySelector('link[href*="style.min.css"]');
        if (nonCriticalCSS) {
            nonCriticalCSS.media = 'print';
            nonCriticalCSS.onload = () => {
                nonCriticalCSS.media = 'all';
            };
        }
    }

    // JavaScript Optimization
    optimizeJavaScriptLoading() {
        // Load Supabase only when needed
        let supabaseLoaded = false;
        const loadSupabase = () => {
            if (supabaseLoaded) return;
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js';
            script.onload = () => {
                supabaseLoaded = true;
                if (window.initCommentSystem) {
                    window.initCommentSystem();
                }
            };
            document.head.appendChild(script);
        };

        // Load Supabase when comment section is visible
        const commentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !supabaseLoaded) {
                    loadSupabase();
                    commentObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const commentSection = document.getElementById('homepageComments');
        if (commentSection) {
            commentObserver.observe(commentSection);
        }

        // Optimize main script loading
        const mainScript = document.querySelector('script[src*="script.min.js"]');
        if (mainScript) {
            mainScript.setAttribute('defer', '');
        }
    }

    // Image Optimization
    optimizeImages() {
        // Lazy load images with Intersection Observer
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            img.classList.remove('lazy');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }

        // Add loading="lazy" to non-critical images
        document.querySelectorAll('img:not([loading])').forEach(img => {
            if (!img.closest('.hero')) {
                img.loading = 'lazy';
            }
        });
    }

    // Video Optimization
    optimizeVideo() {
        const video = document.getElementById('hero-video');
        if (video) {
            // Optimize video loading
            video.preload = 'metadata';
            
            // Add error handling
            video.addEventListener('error', () => {
                video.style.display = 'none';
                const hero = document.querySelector('.hero');
                if (hero) {
                    hero.style.backgroundImage = 'url(assets/hero-bg.webp)';
                    hero.style.backgroundSize = 'cover';
                    hero.style.backgroundPosition = 'center';
                }
            });

            // Pause video when not visible
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        video.pause();
                    } else if (video.paused) {
                        video.play().catch(() => {});
                    }
                });
            }, { threshold: 0.1 });

            videoObserver.observe(video);
        }
    }

    // Service Worker Setup
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js?v=2.6')
                    .then(registration => {
                        console.log('Service Worker registered:', registration);
                    })
                    .catch(error => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }
    }

    // Performance Monitoring
    monitorPerformance() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'navigation') {
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
}

// Initialize performance optimizer
document.addEventListener('DOMContentLoaded', () => {
    new PerformanceOptimizer();
});

// Export for use in other scripts
window.PerformanceOptimizer = PerformanceOptimizer;


