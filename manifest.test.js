/**
 * Test de validación de manifest.json para la PWA de Control de Taxi
 * Validates: Requirements 3.2, 3.3
 */

const fs = require('fs');
const path = require('path');

describe('Manifest.json Validation Tests', () => {
  let manifest;

  beforeAll(() => {
    // Leer y parsear el archivo manifest.json
    const manifestContent = fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8');
    manifest = JSON.parse(manifestContent);
  });

  test('manifest.json should exist and be valid JSON', () => {
    expect(manifest).toBeDefined();
    expect(typeof manifest).toBe('object');
  });

  describe('Required PWA Manifest Fields', () => {
    test('should have required name fields', () => {
      expect(manifest.name).toBeDefined();
      expect(typeof manifest.name).toBe('string');
      expect(manifest.name.length).toBeGreaterThan(0);
      expect(manifest.name.length).toBeLessThanOrEqual(45); // PWA best practice
      
      expect(manifest.short_name).toBeDefined();
      expect(typeof manifest.short_name).toBe('string');
      expect(manifest.short_name.length).toBeLessThanOrEqual(12); // PWA best practice
    });

    test('should have valid start_url and scope', () => {
      expect(manifest.start_url).toBeDefined();
      expect(typeof manifest.start_url).toBe('string');
      expect(manifest.start_url).toMatch(/\.html$/); // Should point to HTML file
      
      expect(manifest.scope).toBeDefined();
      expect(typeof manifest.scope).toBe('string');
    });

    test('should have proper display mode', () => {
      expect(manifest.display).toBeDefined();
      expect(['standalone', 'fullscreen', 'minimal-ui', 'browser']).toContain(manifest.display);
    });

    test('should have theme and background colors', () => {
      expect(manifest.theme_color).toBeDefined();
      expect(typeof manifest.theme_color).toBe('string');
      expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/); // Valid hex color
      
      expect(manifest.background_color).toBeDefined();
      expect(typeof manifest.background_color).toBe('string');
      expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/); // Valid hex color
    });

    test('should have description', () => {
      expect(manifest.description).toBeDefined();
      expect(typeof manifest.description).toBe('string');
      expect(manifest.description.length).toBeGreaterThan(10);
    });
  });

  describe('Icons Configuration', () => {
    test('should have icons array with required sizes', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    test('should include 192x192 and 512x512 icons (required for PWA)', () => {
      const iconSizes = manifest.icons.map(icon => icon.sizes);
      expect(iconSizes).toContain('192x192');
      expect(iconSizes).toContain('512x512');
    });

    test('all icons should have valid structure', () => {
      manifest.icons.forEach(icon => {
        expect(icon.src).toBeDefined();
        expect(typeof icon.src).toBe('string');
        expect(icon.sizes).toBeDefined();
        expect(typeof icon.sizes).toBe('string');
        expect(icon.type).toBeDefined();
        expect(icon.type).toBe('image/png');
        expect(icon.purpose).toBeDefined();
      });
    });

    test('should have maskable icons for adaptive icons', () => {
      const maskableIcons = manifest.icons.filter(icon => 
        icon.purpose && icon.purpose.includes('maskable')
      );
      expect(maskableIcons.length).toBeGreaterThan(0);
    });
  });

  describe('PWA Installability Requirements', () => {
    test('should meet basic installability criteria', () => {
      // Name
      expect(manifest.name || manifest.short_name).toBeDefined();
      
      // Icons (at least 192x192)
      const hasRequiredIcon = manifest.icons.some(icon => 
        icon.sizes.includes('192') && icon.type === 'image/png'
      );
      expect(hasRequiredIcon).toBe(true);
      
      // Start URL
      expect(manifest.start_url).toBeDefined();
      
      // Display mode
      expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(manifest.display);
    });

    test('should have proper orientation setting', () => {
      if (manifest.orientation) {
        const validOrientations = [
          'any', 'natural', 'landscape', 'landscape-primary', 
          'landscape-secondary', 'portrait', 'portrait-primary', 'portrait-secondary'
        ];
        expect(validOrientations).toContain(manifest.orientation);
      }
    });
  });

  describe('Enhanced PWA Features', () => {
    test('should have language and direction settings', () => {
      expect(manifest.lang).toBeDefined();
      expect(typeof manifest.lang).toBe('string');
      
      if (manifest.dir) {
        expect(['ltr', 'rtl', 'auto']).toContain(manifest.dir);
      }
    });

    test('should have categories for app store classification', () => {
      if (manifest.categories) {
        expect(Array.isArray(manifest.categories)).toBe(true);
        expect(manifest.categories.length).toBeGreaterThan(0);
      }
    });

    test('should have shortcuts for quick actions', () => {
      if (manifest.shortcuts) {
        expect(Array.isArray(manifest.shortcuts)).toBe(true);
        manifest.shortcuts.forEach(shortcut => {
          expect(shortcut.name).toBeDefined();
          expect(shortcut.url).toBeDefined();
          expect(typeof shortcut.name).toBe('string');
          expect(typeof shortcut.url).toBe('string');
        });
      }
    });

    test('should have screenshots for app stores', () => {
      if (manifest.screenshots) {
        expect(Array.isArray(manifest.screenshots)).toBe(true);
        manifest.screenshots.forEach(screenshot => {
          expect(screenshot.src).toBeDefined();
          expect(screenshot.sizes).toBeDefined();
          expect(screenshot.type).toBeDefined();
        });
      }
    });
  });

  describe('Taxi App Specific Validation', () => {
    test('should be configured for taxi/business use', () => {
      // Check if name/description mentions taxi
      const nameAndDesc = (manifest.name + ' ' + manifest.description).toLowerCase();
      expect(nameAndDesc).toMatch(/taxi|control|servicio|gasto/);
      
      // Check categories include business/productivity
      if (manifest.categories) {
        const hasBusinessCategory = manifest.categories.some(cat => 
          ['business', 'productivity', 'finance'].includes(cat)
        );
        expect(hasBusinessCategory).toBe(true);
      }
    });

    test('should have appropriate theme colors for taxi app', () => {
      // Theme color should be green (taxi/money related)
      expect(manifest.theme_color).toMatch(/^#[0-5][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i);
    });
  });
});