const CACHE = 'build-cc-v3'

const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/offline',
]

// API responses to cache with stale-while-revalidate
const SWR_PREFIXES = ['/api/builds']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)

  // Navigation — network-first, fallback to /offline if completely disconnected
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then(cached => cached || caches.match('/offline'))
      )
    )
    return
  }

  // Build API — stale-while-revalidate: serve cache instantly, update in background
  if (SWR_PREFIXES.some(p => url.pathname.startsWith(p))) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request)
        const networkFetch = fetch(e.request).then(res => {
          if (res.ok) cache.put(e.request, res.clone())
          return res
        }).catch(() => null)
        return cached || (await networkFetch) || new Response('{}', { status: 503 })
      })
    )
    return
  }

  // Static assets — cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(response => {
        if (response.ok && STATIC_ASSETS.includes(url.pathname)) {
          caches.open(CACHE).then(c => c.put(e.request, response.clone()))
        }
        return response
      })
    })
  )
})
