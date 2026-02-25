/**
 * Service Worker for Ionic PWA
 * Provides offline functionality and asset caching
 */

const CACHE_NAME = 'taxi-pwa-v42-money-inputs';
const RUNTIME_CACHE = 'taxi-runtime-v20-money-inputs';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/favicon.ico',
  '/styles/theme.css',
  '/adapters/AuthAdapter.js',
  '/adapters/ReconcileAdapter.js',
  '/services/SecureStorageService.js',
  '/services/TokenService.js',
  '/services/CryptoService.js',
  '/services/CSRFProtectionService.js',
  '/services/LoginAttemptService.js',
  '/services/EmailVerificationService.js',
  'https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css',
  'https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests EXCEPT cdn.jsdelivr.net
  if (url.origin !== location.origin && !url.href.includes('cdn.jsdelivr.net')) {
    return;
  }

  // For CDN requests, use network-first strategy (don't cache dynamic imports)
  if (url.href.includes('cdn.jsdelivr.net') && url.href.includes('?module')) {
    event.respondWith(
      fetch(request, { mode: 'cors' })
        .catch((error) => {
          console.error('[Service Worker] CDN fetch failed:', error);
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);
            return cachedResponse;
          }

          // Not in cache, fetch from network
          return fetch(request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Cache the fetched response (but not CDN dynamic imports)
              if (!url.href.includes('cdn.jsdelivr.net') || !url.href.includes('?module')) {
                caches.open(RUNTIME_CACHE)
                  .then((cache) => {
                    cache.put(request, responseToCache);
                  });
              }

              return response;
            })
            .catch((error) => {
              console.error('[Service Worker] Fetch failed:', error);
              
              // Return offline page if available
              return caches.match('/offline.html')
                .then((offlineResponse) => {
                  return offlineResponse || new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable'
                  });
                });
            });
        })
    );
  }
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.urls;
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => {
          return cache.addAll(urlsToCache);
        })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
    );
  }
});

// Background sync event (for offline operations)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-operations') {
    event.waitUntil(
      syncPendingOperations()
    );
  }
});

/**
 * Sync pending operations when back online
 */
async function syncPendingOperations() {
  try {
    console.log('[Service Worker] Syncing pending operations...');
    
    // Get pending operations from IndexedDB or localStorage
    // This will be implemented when DataSyncService is integrated
    
    // For now, just log
    console.log('[Service Worker] Sync completed');
    
    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error;
  }
}

// Push notification event (for future use)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Control de Taxi', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[Service Worker] Loaded');
