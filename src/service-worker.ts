/// <reference lib="webworker" />

const CACHE_NAME = 'ups-school-cache-v1';
const OFFLINE_URL = '/offline.html';

// List of assets to cache on install
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/globals.css',
  '/placeholder.svg', // Your PWA icons
  OFFLINE_URL,
  // Add other critical static assets here, e.g., main JS bundle, fonts
  // Note: Vite will generate a hashed JS bundle name, so we can't hardcode it.
  // For a more robust solution, consider using a PWA plugin for Vite.
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  // Only handle navigation requests for offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) as Promise<Response>;
      })
    );
    return;
  }

  // For other requests (assets, data), try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        // Cache new requests if they are successful and not range requests
        if (networkResponse.ok && event.request.method === 'GET' && !event.request.headers.has('range')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If both cache and network fail for an asset, you might want a generic fallback image/file
        // For now, just return a network error.
        return new Response('Network error or asset not found in cache.', { status: 404, statusText: 'Not Found' });
      });
    })
  );
});