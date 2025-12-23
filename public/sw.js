// public/sw.js
const VERSION = 'v2'
const CACHE_NAME = `rt-restaurant-${VERSION}`
const RUNTIME_CACHE = `rt-runtime-${VERSION}`
const IMAGE_CACHE = `rt-images-${VERSION}`
const ADMIN_CACHE = `rt-admin-${VERSION}`

// ✅ Static assets to cache
const STATIC_ASSETS = [
    '/',
    '/admin',
    '/admin/login',
    '/orders',
    '/tables',
    '/attendance',
    '/offline.html'
]

// ✅ Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.log('Cache failed for some assets:', err)
            })
        })
    )
    self.skipWaiting()
})

// ✅ Activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheName.includes(VERSION)) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
    self.clients.claim()
})

// ✅ Fetch Strategy
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    if (request.method !== 'GET') return

    // ✅ Admin routes (Network First)
    if (url.pathname.startsWith('/admin')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone()
                    caches.open(ADMIN_CACHE).then(cache => cache.put(request, clone))
                    return response
                })
                .catch(() => caches.match(request).then(cached => {
                    return cached || caches.match('/admin/login')
                }))
        )
        return
    }

    // ✅ Supabase API (Network First with fallback)
    if (url.origin.includes('supabase')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (url.pathname.includes('/menu_') ||
                        url.pathname.includes('/restaurant_tables') ||
                        url.pathname.includes('/waiters')) {
                        const clone = response.clone()
                        caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone))
                    }
                    return response
                })
                .catch(() => caches.match(request).then(cached => {
                    return cached || new Response(JSON.stringify({ offline: true, data: [] }), {
                        headers: { 'Content-Type': 'application/json' }
                    })
                }))
        )
        return
    }

    // ✅ Images (Cache First)
    if (request.destination === 'image' ||
        url.hostname.includes('cloudinary') ||
        url.hostname.includes('res.cloudinary.com')) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then(cache => {
                return cache.match(request).then(cached => {
                    return cached || fetch(request).then(response => {
                        if (response.ok) cache.put(request, response.clone())
                        return response
                    }).catch(() => {
                        return new Response(
                            '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#f1f3f5"/><text x="50%" y="50%" text-anchor="middle" fill="#6b7280" font-size="16">Image Offline</text></svg>',
                            { headers: { 'Content-Type': 'image/svg+xml' } }
                        )
                    })
                })
            })
        )
        return
    }

    // ✅ Static assets (Cache First)
    event.respondWith(
        caches.match(request).then(cached => {
            return cached || fetch(request).then(response => {
                if (request.destination === 'script' ||
                    request.destination === 'style' ||
                    request.destination === 'font') {
                    const clone = response.clone()
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
                }
                return response
            })
        }).catch(() => {
            if (request.destination === 'document') {
                return caches.match('/offline.html')
            }
        })
    )
})

// ✅ Message handler
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }

    if (event.data?.type === 'CACHE_IMAGES') {
        const urls = event.data.urls || []
        caches.open(IMAGE_CACHE).then(cache => {
            urls.forEach(url => {
                fetch(url).then(res => {
                    if (res.ok) cache.put(url, res)
                }).catch(() => {})
            })
        })
    }
})