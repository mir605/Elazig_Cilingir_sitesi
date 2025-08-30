// Optimized Service Worker for Elazığ Çilingir
const CACHE_NAME = 'elazig-cilingir-v2.6';
const STATIC_CACHE = 'static-v2.6';
const DYNAMIC_CACHE = 'dynamic-v2.6';

// Critical resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.min.css',
    '/js/script.min.js',
    '/assets/hero-bg.webp',
    '/assets/anahtar.webp',
    '/assets/kapi.webp',
    '/assets/yedek-anahtar.webp',
    '/vendor/leaflet/leaflet.css',
    '/vendor/leaflet/leaflet.js'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(error => {
                console.log('Cache installation failed:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external resources (CDN, analytics, etc.)
    if (url.origin !== self.location.origin) {
        return;
    }

    // Handle different resource types
    if (request.destination === 'image') {
        event.respondWith(handleImageRequest(request));
    } else if (request.destination === 'style' || request.destination === 'script') {
        event.respondWith(handleStaticRequest(request));
    } else {
        event.respondWith(handlePageRequest(request));
    }
});

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return a placeholder image if available
        const placeholderResponse = await cache.match('/assets/placeholder.webp');
        return placeholderResponse || new Response('Image not available', { status: 404 });
    }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return new Response('Resource not available', { status: 404 });
    }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to index.html for SPA routing
        if (request.destination === 'document') {
            const fallbackResponse = await cache.match('/index.html');
            if (fallbackResponse) {
                return fallbackResponse;
            }
        }
        
        return new Response('Page not available', { status: 404 });
    }
}

// Background sync for offline form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        
        for (const request of requests) {
            if (request.url.includes('/api/comments')) {
                const response = await fetch(request);
                if (response.ok) {
                    await cache.delete(request);
                }
            }
        }
    } catch (error) {
        console.log('Background sync failed:', error);
    }
}

// Push notification handling
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
        self.registration.showNotification('Elazığ Çilingir', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});