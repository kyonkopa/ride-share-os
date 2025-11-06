/**
 * Service Worker for KED Transport Services PWA
 *
 * Implements caching and automatic updates with cache versioning.
 */

// Cache version based on build timestamp or current time
const CACHE_VERSION = `v${Date.now()}`
const CACHE_NAME = `ked-transport-${CACHE_VERSION}`

// Static assets to cache on install
const STATIC_ASSETS = ["/", "/manifest.json", "/icon.svg"]

// Cache strategies
const CACHE_FIRST_PATTERNS = [
  /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|gif|ico)$/i,
  /\/assets\//,
]

const NETWORK_FIRST_PATTERNS = [/\/graphql/, /\/api\//]

// Install: cache app shell and activate immediately
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker, version:", CACHE_VERSION)
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          STATIC_ASSETS.map((url) => cache.add(url).catch(() => null))
        )
      )
      .then(() => self.skipWaiting())
  )
})

// Activate: clean old caches and take control
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker, version:", CACHE_VERSION)
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) =>
                name !== CACHE_NAME &&
                (name.startsWith("ked-transport-") ||
                  name.startsWith("workbox-") ||
                  name.startsWith("vite-"))
            )
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  )
})

// Fetch: apply caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET" || url.origin !== location.origin) return

  // Network-first for API/GraphQL
  if (NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const respClone = response.clone()
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, respClone))
          }
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              (cached) => cached || new Response("Offline", { status: 503 })
            )
        )
    )
    return
  }

  // Cache-first for static assets
  if (CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const respClone = response.clone()
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, respClone))
          }
          return response
        })
      })
    )
    return
  }

  // Network-first for others (HTML fallback)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const respClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached
          if (request.destination === "document") return caches.match("/")
          return new Response("Offline", { status: 503 })
        })
      )
  )
})
