// Service Worker for MURAT OTO ANAHTAR
// Version: 2.4 - Extreme Performance Optimized

 const CACHE_NAME = 'murat-oto-anahtar-v2.4';
 const STATIC_CACHE = 'static-v2.4';
 const DYNAMIC_CACHE = 'dynamic-v2.4';
 const FONT_CACHE = 'font-cache-v2.4';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/style.min.css',
    '/js/script.min.js',
    '/assets/anahtar.webp',
    '/assets/hero-bg.webp',
    '/assets/kapi.webp',
    '/assets/cilingir-ekipman.webp',
    '/assets/yedek-anahtar.webp',
    '/assets/WhatsApp Image 2025-05-28 at 19.32.34 (1).webp',
    '/assets/WhatsApp Image 2025-05-28 at 19.32.34.webp',
    '/assets/WhatsApp Image 2025-05-28 at 19.32.35.webp',
    '/manifest.json',
    '/favicon.ico'
];

// Font files to cache separately
const FONT_FILES = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5n-wU.woff2',
    'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE)
                .then(cache => {
                    console.log('Caching static files');
                    return cache.addAll(STATIC_FILES);
                }),
            // Cache font files
            caches.open(FONT_CACHE)
                .then(cache => {
                    console.log('Caching font files');
                    return cache.addAll(FONT_FILES);
                })
        ])
        .then(() => {
            console.log('Service Worker installed');
            return self.skipWaiting();
        })
        .catch(error => {
            console.error('Failed to cache files during install:', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== FONT_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network with optimized strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle different types of requests with specific strategies
    if (url.origin === location.origin) {
        // Same-origin requests - Cache First strategy with network fallback
        event.respondWith(cacheFirstWithNetworkFallback(request));
    } else if (
        url.href.includes('fonts.googleapis.com') ||
        url.href.includes('fonts.gstatic.com') ||
        url.href.includes('unpkg.com') ||
        url.href.includes('cdnjs.cloudflare.com')
    ) {
        // Font and external library requests - Stale While Revalidate strategy
        event.respondWith(staleWhileRevalidate(request));
    } else {
        // Other external requests - Network First strategy with cache fallback
        event.respondWith(networkFirstWithCacheFallback(request));
    }
});

// Cache First Strategy with Network Fallback
function cacheFirstWithNetworkFallback(request) {
    return caches.match(request)
        .then(response => {
            // Return cached version if available
            if (response) {
                // Update cache in background for better performance
                fetch(request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => cache.put(request, networkResponse.clone()));
                    }
                });
                return response;
            }

            // If not in cache, fetch from network
            return fetch(request)
                .then(networkResponse => {
                    // Check if valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Clone the response for caching
                    const responseToCache = networkResponse.clone();

                    // Cache dynamic content
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => {
                            cache.put(request, responseToCache);
                        });

                    return networkResponse;
                })
                .catch(() => {
                    // Return offline page for navigation requests
                    if (request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
        });
}

// Network First Strategy with Cache Fallback
function networkFirstWithCacheFallback(request) {
    return fetch(request)
        .then(response => {
            // Check if valid response
            if (response && response.status === 200 && response.type === 'basic') {
                // Clone the response for caching
                const responseToCache = response.clone();

                // Cache dynamic content
                caches.open(DYNAMIC_CACHE)
                    .then(cache => {
                        cache.put(request, responseToCache);
                    });
            }

            return response;
        })
        .catch(() => {
            // Fallback to cache
            return caches.match(request);
        });
}

// Stale While Revalidate Strategy (for fonts and external libraries)
function staleWhileRevalidate(request) {
    return caches.open(FONT_CACHE)
        .then(cache => {
            return cache.match(request)
                .then(response => {
                    // Fetch fresh version in background
                    const networkResponse = fetch(request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                // Update cache with fresh version
                                cache.put(request, networkResponse.clone());
                            }
                            return networkResponse;
                        });

                    // Return cached version immediately or network if no cache
                    return response || networkResponse;
                });
        });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Yeni bildirim',
        icon: '/assets/icon-192x192.png',
        badge: '/assets/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Görüntüle',
                icon: '/assets/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Kapat',
                icon: '/assets/icon-192x192.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('MURAT OTO ANAHTAR', options)
    );
});

// Notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Background sync function
function doBackgroundSync() {
    // Handle offline actions here
    console.log('Background sync completed');
}

// Cache size management
function trimCache(cacheName, maxItems) {
    caches.open(cacheName)
        .then(cache => {
            cache.keys()
                .then(names => {
                    if (names.length > maxItems) {
                        cache.delete(names[0])
                            .then(() => trimCache(cacheName, maxItems));
                    }
                });
        });
}

// Periodic cache cleanup
setInterval(() => {
    trimCache(DYNAMIC_CACHE, 50);
    trimCache(STATIC_CACHE, 100);
}, 300000); // Every 5 minutes