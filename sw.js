/**
 * Service Worker para PWA Control de Ventas
 * Implementa cache-first strategy para recursos estáticos
 * y funcionalidad offline completa
 */

const CACHE_NAME = 'sales-control-v1.0.0';
const STATIC_CACHE_NAME = 'sales-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'sales-dynamic-v1.0.0';

// Recursos estáticos para cachear (App Shell)
const STATIC_ASSETS = [
  './',
  './index.html',
  './index',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './favicon.ico',
  './offline-manager.js',
  './config.js',
  './reconciliation/types.js',
  './reconciliation/calculation-engine.js',
  './reconciliation/service-manager.js',
  './reconciliation/expense-manager.js',
  './reconciliation/reconciliation-generator.js',
  './reconciliation/cash-calculator.js',
  './reconciliation/storage-manager.js',
  './reconciliation/validation-system.js',
  './reconciliation/reconciliation-module.js',
  './reconciliation/reconciliation-table.js',
  './reconciliation/report-exporter.js',
  './reconciliation/mobile-optimizations.js',
  './reconciliation/desktop-optimizations.js',
  // CDN resources (se cachearán dinámicamente)
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

// Recursos que siempre deben ir a la red (no cachear)
const NETWORK_ONLY = [
  '/api/',
  'chrome-extension://'
];

// Límite de cache dinámico (evitar que crezca indefinidamente)
const DYNAMIC_CACHE_LIMIT = 50;

/**
 * Evento de instalación del Service Worker
 * Cachea los recursos estáticos esenciales
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        // Forzar activación inmediata
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

/**
 * Evento de activación del Service Worker
 * Limpia caches antiguos y toma control de todas las pestañas
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Eliminar caches antiguos
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                (cacheName.startsWith('sales-') || cacheName.startsWith('taxi-'))) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        // Tomar control de todas las pestañas inmediatamente
        return self.clients.claim();
      })
  );
});

/**
 * Evento de fetch - Intercepta todas las peticiones de red
 * Implementa estrategia cache-first para recursos estáticos
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar peticiones que no deben cachearse
  if (NETWORK_ONLY.some(pattern => request.url.includes(pattern))) {
    return;
  }
  
  // Ignorar peticiones que no son GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Estrategia diferente según el tipo de recurso
  if (isStaticAsset(request.url)) {
    // Cache First para recursos estáticos
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    // Network First para APIs (con fallback a cache)
    event.respondWith(networkFirst(request));
  } else {
    // Stale While Revalidate para otros recursos
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Estrategia Cache First
 * Busca primero en cache, si no encuentra va a la red
 */
async function cacheFirst(request) {
  try {
    // Buscar en cache estático primero
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    const staticResponse = await staticCache.match(request);
    
    if (staticResponse) {
      console.log('[SW] Serving from static cache:', request.url);
      return staticResponse;
    }
    
    // Buscar en cache dinámico
    const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
    const dynamicResponse = await dynamicCache.match(request);
    
    if (dynamicResponse) {
      console.log('[SW] Serving from dynamic cache:', request.url);
      return dynamicResponse;
    }
    
    // Si no está en cache, ir a la red y cachear
    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Cachear la respuesta si es exitosa
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      dynamicCache.put(request, responseClone);
      limitCacheSize(DYNAMIC_CACHE_NAME, DYNAMIC_CACHE_LIMIT);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    
    // Fallback para páginas HTML
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return cache.match('./index.html');
    }
    
    // Fallback genérico
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Estrategia Network First
 * Intenta la red primero, fallback a cache
 */
async function networkFirst(request) {
  try {
    console.log('[SW] Network first for:', request.url);
    const networkResponse = await fetch(request);
    
    // Cachear respuesta exitosa
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Fallback a cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - API not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Estrategia Stale While Revalidate
 * Sirve desde cache y actualiza en background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch en background para actualizar cache
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.log('[SW] Background fetch failed:', error);
  });
  
  // Devolver cache inmediatamente si existe, sino esperar network
  if (cachedResponse) {
    console.log('[SW] Serving stale content:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] No cache, waiting for network:', request.url);
  return fetchPromise;
}

/**
 * Determina si un recurso es estático
 */
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) ||
         url.includes('.css') ||
         url.includes('.js') ||
         url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.svg') ||
         url.includes('.ico') ||
         url.includes('.json');
}

/**
 * Determina si es una petición a API
 */
function isAPIRequest(url) {
  return url.includes('/api/') || 
         url.includes('api.') ||
         url.includes('.json') && !url.includes('manifest.json');
}

/**
 * Limita el tamaño del cache dinámico
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Eliminar los más antiguos
    const itemsToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(
      itemsToDelete.map(key => cache.delete(key))
    );
    console.log(`[SW] Cache ${cacheName} cleaned, removed ${itemsToDelete.length} items`);
  }
}

/**
 * Manejo de mensajes desde la aplicación principal
 */
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      static: STATIC_CACHE_NAME,
      dynamic: DYNAMIC_CACHE_NAME
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * Limpia todos los caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
}

/**
 * Manejo de sincronización en background
 */
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Sincronización en background (para datos offline)
 */
async function doBackgroundSync() {
  console.log('[SW] Performing background sync...');
  
  try {
    // Aquí se implementaría la lógica para sincronizar datos offline
    // Por ejemplo, enviar servicios/gastos guardados mientras estaba offline
    
    // Notificar a la aplicación que la sincronización está completa
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * Manejo de notificaciones push (preparado para futuras implementaciones)
 */
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Tienes nuevas actualizaciones en Control de Taxi',
    icon: './icons/icon-192.png',
    badge: './icons/icon-96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: './icons/shortcut-reports.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: './icons/icon-96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Control de Taxi', options)
  );
});

/**
 * Manejo de clicks en notificaciones
 */
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Abrir la aplicación en la sección de reportes
    event.waitUntil(
      clients.openWindow('./index.html?action=reports')
    );
  } else if (event.action === 'close') {
    // Solo cerrar la notificación
    return;
  } else {
    // Click en el cuerpo de la notificación
    event.waitUntil(
      clients.openWindow('./index.html')
    );
  }
});

console.log('[SW] Service Worker loaded successfully');