const CACHE_NAME = 'shifted-admin-cache-v1';
const OFFLINE_PAGE = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets here
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    return handleApiRequest(event);
  }

  // Handle static assets and navigation requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Return cached response
        }

        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            return new Response('Network error', { status: 408 });
          });
      })
  );
});

// Handle API requests with network-first strategy
function handleApiRequest(event) {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful API responses
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Try to return cached API response when offline
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            return new Response(
              JSON.stringify({ error: 'Network error' }),
              {
                status: 408,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
      })
  );
}

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-updates') {
    event.waitUntil(syncData());
  }
});

// Sync data from IndexedDB to server
async function syncData() {
  // Implementation will be added later
  console.log('Background sync triggered');
} 