const CACHE_NAME = 'rt-restaurant-v1'
const RUNTIME_CACHE = 'rt-runtime-v1'
const IMAGE_CACHE = 'rt-images-v1'

// ✅ Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/admin',
    '/orders',
    '/tables',
    '/attendance',
    '/offline',
]

// ✅ Install: Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS)
        })
    )
    self.skipWaiting()
})

// ✅ Activate: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (![CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE].includes(cacheName)) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
    self.clients.claim()
})

// ✅ Fetch: Smart caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== 'GET') return

    // ✅ Strategy 1: Supabase API (Network First)
    if (url.origin.includes('supabase')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache menu & table data for offline
                    if (url.pathname.includes('/menu_items') ||
                        url.pathname.includes('/restaurant_tables') ||
                        url.pathname.includes('/menu_categories')) {
                        const clonedResponse = response.clone()
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, clonedResponse)
                        })
                    }
                    return response
                })
                .catch(() => {
                    // Fallback to cache when offline
                    return caches.match(request).then((cached) => {
                        return cached || new Response(JSON.stringify({ offline: true, data: [] }), {
                            headers: { 'Content-Type': 'application/json' }
                        })
                    })
                })
        )
        return
    }

    // ✅ Strategy 2: Images (Cache First - Cloudinary & Menu images)
    if (request.destination === 'image' ||
        url.hostname.includes('cloudinary') ||
        url.hostname.includes('res.cloudinary.com')) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then((cache) => {
                return cache.match(request).then((cached) => {
                    if (cached) return cached

                    return fetch(request).then((response) => {
                        // Cache images for 30 days
                        if (response.ok) {
                            cache.put(request, response.clone())
                        }
                        return response
                    }).catch(() => {
                        // Return placeholder if image fails
                        return new Response(
                            '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#f1f3f5"/><text x="50%" y="50%" text-anchor="middle" fill="#6b7280" font-size="20">📷 Image Offline</text></svg>',
                            { headers: { 'Content-Type': 'image/svg+xml' } }
                        )
                    })
                })
            })
        )
        return
    }

    // ✅ Strategy 3: Static assets (Cache First)
    event.respondWith(
        caches.match(request).then((cached) => {
            return cached || fetch(request).then((response) => {
                // Cache JS, CSS, fonts
                if (request.destination === 'script' ||
                    request.destination === 'style' ||
                    request.destination === 'font') {
                    const clonedResponse = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clonedResponse)
                    })
                }
                return response
            })
        }).catch(() => {
            // Return offline page for navigation requests
            if (request.destination === 'document') {
                return caches.match('/offline')
            }
        })
    )
})

// ✅ Background Sync (for offline orders)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOfflineOrders())
    }
})

async function syncOfflineOrders() {
    // Will implement in Phase 2
    console.log('🔄 Syncing offline orders...')
}

// ✅ Message handler (REPLACE existing one)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }

    // ✅ Cache menu URLs
    if (event.data && event.data.type === 'CACHE_MENU') {
        caches.open(RUNTIME_CACHE).then((cache) => {
            cache.addAll(event.data.urls || [])
        })
    }

    // ✅ NEW: Cache images
    if (event.data && event.data.type === 'CACHE_IMAGES') {
        const imageUrls = event.data.urls || []
        caches.open(IMAGE_CACHE).then((cache) => {
            imageUrls.forEach(url => {
                fetch(url).then(response => {
                    if (response.ok) cache.put(url, response)
                }).catch(() => console.log('Failed to cache:', url))
            })
        })
    }
})