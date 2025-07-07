// Service Worker for performance optimization
const CACHE_NAME = 'elazig-cilingir-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/script.js',
    '/assets/hero-poster.webp',
    '/manifest.json',
    '/vendor/leaflet/leaflet.css',
    '/vendor/leaflet/leaflet.js',
    '/vendor/leaflet/images/marker-icon.png',
    '/vendor/leaflet/images/marker-shadow.png',
    '/vendor/leaflet/images/layers.png',
    '/vendor/leaflet/images/layers-2x.png'
];

// Network-first strategy for dynamic content
const NETWORK_FIRST = [
    '/api/',
  
    'https://fonts.googleapis.com/',
    'https://cdnjs.cloudflare.com/'
];

// Cache-first strategy for assets
const CACHE_FIRST = [
    '/assets/',
    '/vendor/',
    '.webp',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.css',
    '.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error during service worker installation:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('Error during service worker activation:', error);
            })
    );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        handleRequest(request)
    );
});

// Handle different request types with appropriate strategies
async function handleRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Network-first strategy for dynamic content
        if (NETWORK_FIRST.some(pattern => request.url.includes(pattern))) {
            return await networkFirst(request);
        }
        
        // Cache-first strategy for assets
        if (CACHE_FIRST.some(pattern => request.url.includes(pattern) || url.pathname.includes(pattern))) {
            return await cacheFirst(request);
        }
        
        // Stale-while-revalidate for HTML pages
        if (request.destination === 'document') {
            return await staleWhileRevalidate(request);
        }
        
        // Default to network-first
        return await networkFirst(request);
        
    } catch (error) {
        console.error('Request handling error:', error);
        
        // Return offline fallback if available
        if (request.destination === 'document') {
            const cachedResponse = await caches.match('/');
            if (cachedResponse) {
                return cachedResponse;
            }
        }
        
        // Return a basic offline response
        return new Response('Offline - Please check your internet connection', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network-first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Cache-first strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        throw error;
    }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    const networkResponsePromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(() => {
        // Network failed, but we might have cached response
        return null;
    });
    
    // Return cached response immediately if available
    if (cachedResponse) {
        // Update cache in background
        networkResponsePromise.catch(() => {
            // Ignore network errors when updating cache
        });
        return cachedResponse;
    }
    
    // Wait for network response if no cached version
    const networkResponse = await networkResponsePromise;
    if (networkResponse) {
        return networkResponse;
    }
    
    throw new Error('No cached response and network failed');
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Handle offline form submissions or other background tasks
    console.log('Background sync triggered');
}

// Handle push notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/assets/icon-192x192.png',
            badge: '/assets/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '1'
            },
            actions: [
                {
                    action: 'view',
                    title: 'Görüntüle',
                    icon: '/assets/view-icon.png'
                },
                {
                    action: 'close',
                    title: 'Kapat',
                    icon: '/assets/close-icon.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification('Elazığ Çilingir', options)
        );
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
}); 