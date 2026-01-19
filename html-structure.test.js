/**
 * Test de estructura HTML para la PWA de Control de Taxi
 * Validates: Requirements 3.1
 */

const fs = require('fs');
const path = require('path');

describe('HTML Structure Tests', () => {
  let htmlContent;

  beforeAll(() => {
    // Leer el archivo HTML
    htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  });

  test('HTML file should exist and be readable', () => {
    expect(htmlContent).toBeDefined();
    expect(htmlContent.length).toBeGreaterThan(0);
  });

  test('HTML should have proper DOCTYPE and structure', () => {
    expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
    expect(htmlContent).toMatch(/<html[^>]*>/i);
    expect(htmlContent).toMatch(/<head>/i);
    expect(htmlContent).toMatch(/<body>/i);
    expect(htmlContent).toMatch(/<\/html>/i);
  });

  test('HTML should include PWA meta tags', () => {
    // Viewport meta tag
    expect(htmlContent).toMatch(/<meta name="viewport"[^>]*>/i);
    
    // Theme color
    expect(htmlContent).toMatch(/<meta name="theme-color"[^>]*>/i);
    
    // Apple PWA meta tags
    expect(htmlContent).toMatch(/<meta name="apple-mobile-web-app-capable"[^>]*>/i);
    expect(htmlContent).toMatch(/<meta name="apple-mobile-web-app-status-bar-style"[^>]*>/i);
  });

  test('HTML should link to manifest.json', () => {
    expect(htmlContent).toMatch(/<link rel="manifest" href="\.\/manifest\.json">/i);
  });

  test('HTML should include React app container', () => {
    expect(htmlContent).toMatch(/<div id="root"><\/div>/i);
  });

  test('HTML should include React and required dependencies', () => {
    // React CDN
    expect(htmlContent).toMatch(/react@18\/umd\/react\.production\.min\.js/i);
    expect(htmlContent).toMatch(/react-dom@18\/umd\/react-dom\.production\.min\.js/i);
    
    // Babel for JSX
    expect(htmlContent).toMatch(/babel\.min\.js/i);
    
    // Tailwind CSS
    expect(htmlContent).toMatch(/tailwindcss\.com/i);
    
    // Lucide Icons
    expect(htmlContent).toMatch(/lucide/i);
  });

  test('HTML should register service worker', () => {
    expect(htmlContent).toMatch(/navigator\.serviceWorker\.register/i);
    expect(htmlContent).toMatch(/sw\.js/i);
  });

  test('HTML should include PWA installation prompt', () => {
    expect(htmlContent).toMatch(/beforeinstallprompt/i);
    expect(htmlContent).toMatch(/install-prompt/i);
  });

  test('HTML should include offline detection', () => {
    expect(htmlContent).toMatch(/navigator\.onLine/i);
    expect(htmlContent).toMatch(/offline-indicator/i);
  });

  test('HTML should have proper title and description', () => {
    expect(htmlContent).toMatch(/<title>.*Control de Taxi.*<\/title>/i);
    expect(htmlContent).toMatch(/<meta name="description"[^>]*taxi[^>]*>/i);
  });

  test('HTML should include app icons', () => {
    expect(htmlContent).toMatch(/icon-192\.png/i);
    expect(htmlContent).toMatch(/icon-512\.png/i);
  });

  test('HTML should have loading screen', () => {
    expect(htmlContent).toMatch(/loading-screen/i);
    expect(htmlContent).toMatch(/Cargando Control de Taxi/i);
  });
});

describe('HTML Validation', () => {
  test('HTML should not have common syntax errors', () => {
    const htmlContent = fs.readFileSync('./index.html', 'utf8');
    
    // Check for unclosed tags (basic validation)
    const openTags = (htmlContent.match(/<[^\/][^>]*>/g) || []).length;
    const closeTags = (htmlContent.match(/<\/[^>]*>/g) || []).length;
    const selfClosingTags = (htmlContent.match(/<[^>]*\/>/g) || []).length;
    
    // Should have reasonable balance (not exact due to self-closing tags)
    expect(Math.abs(openTags - closeTags - selfClosingTags)).toBeLessThan(10);
  });

  test('HTML should load React app correctly', () => {
    const htmlContent = fs.readFileSync('./index.html', 'utf8');
    
    // Should have app loading logic
    expect(htmlContent).toMatch(/TaxiControlApp/i);
    expect(htmlContent).toMatch(/ReactDOM\.render/i);
  });
});