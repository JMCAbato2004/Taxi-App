/**
 * Tests para Service Worker de la PWA Control de Taxi
 * Validates: Requirements 4.1, 4.2
 */

const fs = require('fs');
const path = require('path');

describe('Service Worker Tests', () => {
  let swContent;

  beforeAll(() => {
    // Leer el archivo del Service Worker
    swContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
  });

  test('sw.js should exist and be readable', () => {
    expect(swContent).toBeDefined();
    expect(swContent.length).toBeGreaterThan(0);
  });

  describe('Service Worker Structure', () => {
    test('should have proper cache names defined', () => {
      expect(swContent).toMatch(/CACHE_NAME\s*=\s*['"`]taxi-control-v/);
      expect(swContent).toMatch(/STATIC_CACHE_NAME\s*=\s*['"`]taxi-static-v/);
      expect(swContent).toMatch(/DYNAMIC_CACHE_NAME\s*=\s*['"`]taxi-dynamic-v/);
    });

    test('should define static assets to cache', () => {
      expect(swContent).toMatch(/STATIC_ASSETS\s*=\s*\[/);
      expect(swContent).toContain('./index.html');
      expect(swContent).toContain('./index');
      expect(swContent).toContain('./manifest.json');
    });

    test('should have essential event listeners', () => {
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]install['"`]/);
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]activate['"`]/);
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]fetch['"`]/);
    });
  });

  describe('Cache Strategy Implementation', () => {
    test('should implement cache-first strategy', () => {
      expect(swContent).toMatch(/function\s+cacheFirst/);
      expect(swContent).toMatch(/cache\.match\s*\(\s*request\s*\)/);
    });

    test('should implement network-first strategy', () => {
      expect(swContent).toMatch(/function\s+networkFirst/);
      expect(swContent).toMatch(/fetch\s*\(\s*request\s*\)/);
    });

    test('should implement stale-while-revalidate strategy', () => {
      expect(swContent).toMatch(/function\s+staleWhileRevalidate/);
    });

    test('should have cache size limiting', () => {
      expect(swContent).toMatch(/function\s+limitCacheSize/);
      expect(swContent).toMatch(/DYNAMIC_CACHE_LIMIT/);
    });
  });

  describe('PWA Features', () => {
    test('should handle background sync', () => {
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]sync['"`]/);
      expect(swContent).toMatch(/doBackgroundSync/);
    });

    test('should handle push notifications', () => {
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]push['"`]/);
      expect(swContent).toMatch(/showNotification/);
    });

    test('should handle notification clicks', () => {
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]notificationclick['"`]/);
    });

    test('should handle messages from main app', () => {
      expect(swContent).toMatch(/addEventListener\s*\(\s*['"`]message['"`]/);
    });
  });

  describe('Error Handling', () => {
    test('should have try-catch blocks for critical operations', () => {
      const tryBlocks = (swContent.match(/try\s*{/g) || []).length;
      const catchBlocks = (swContent.match(/catch\s*\(/g) || []).length;
      
      expect(tryBlocks).toBeGreaterThan(0);
      expect(catchBlocks).toBeGreaterThan(0);
      expect(tryBlocks).toBe(catchBlocks); // Should be balanced
    });

    test('should have fallback responses for offline scenarios', () => {
      expect(swContent).toMatch(/new Response\s*\(/);
      expect(swContent).toContain('Offline');
      expect(swContent).toMatch(/status:\s*503/);
    });
  });

  describe('Taxi App Specific Features', () => {
    test('should cache taxi app specific resources', () => {
      expect(swContent).toContain('./icons/icon-192.png');
      expect(swContent).toContain('./icons/icon-512.png');
      expect(swContent).toContain('./manifest.json');
    });

    test('should have appropriate cache names for taxi app', () => {
      expect(swContent).toContain('taxi-control');
      expect(swContent).toContain('taxi-static');
      expect(swContent).toContain('taxi-dynamic');
    });

    test('should handle CDN resources for React and Tailwind', () => {
      expect(swContent).toContain('tailwindcss.com');
      expect(swContent).toContain('react@18');
      expect(swContent).toContain('lucide');
    });
  });
});

describe('Service Worker Registration Tests', () => {
  let htmlContent;

  beforeAll(() => {
    htmlContent = fs.readFileSync('./index.html', 'utf8');
  });

  test('HTML should register service worker', () => {
    expect(htmlContent).toMatch(/navigator\.serviceWorker\.register/);
    expect(htmlContent).toContain('./sw.js');
  });

  test('should have service worker feature detection', () => {
    expect(htmlContent).toMatch(/if\s*\(\s*['"`]serviceWorker['"`]\s+in\s+navigator\s*\)/);
  });

  test('should handle service worker registration errors', () => {
    expect(htmlContent).toMatch(/\.catch\s*\(/);
    expect(htmlContent).toContain('registrationError');
  });

  test('should handle service worker updates', () => {
    expect(htmlContent).toMatch(/updatefound/);
    expect(htmlContent).toMatch(/SKIP_WAITING/);
  });

  test('should handle service worker messages', () => {
    expect(htmlContent).toMatch(/addEventListener\s*\(\s*['"`]message['"`]/);
  });
});

describe('Cache Strategy Validation', () => {
  test('service worker should implement proper cache strategies', () => {
    // Verificar que las estrategias están implementadas correctamente
    expect(swContent).toMatch(/cache\.match.*request/);
    expect(swContent).toMatch(/fetch.*request/);
    expect(swContent).toMatch(/cache\.put.*request/);
  });

  test('should handle different resource types appropriately', () => {
    expect(swContent).toMatch(/isStaticAsset/);
    expect(swContent).toMatch(/isAPIRequest/);
  });

  test('should have network-only exclusions', () => {
    expect(swContent).toMatch(/NETWORK_ONLY/);
    expect(swContent).toContain('/api/');
  });
});

describe('Offline Functionality Tests', () => {
  test('should provide offline fallbacks', () => {
    expect(swContent).toContain('Offline');
    expect(swContent).toContain('Service Unavailable');
  });

  test('should handle document requests when offline', () => {
    expect(swContent).toMatch(/request\.destination.*===.*['"`]document['"`]/);
    expect(swContent).toMatch(/cache\.match.*index\.html/);
  });

  test('should implement background sync for offline data', () => {
    expect(swContent).toMatch(/sync.*register/);
    expect(swContent).toMatch(/background-sync/);
  });
});