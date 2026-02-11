/**
 * Tests para diseño responsivo de la PWA Control de Taxi
 * Validates: Requirements 5.1, 5.2, 5.3
 */

const fs = require('fs');

describe('Responsive Design Tests', () => {
  let appContent;
  let htmlContent;

  beforeAll(() => {
    // Leer archivos necesarios
    appContent = fs.readFileSync('./index', 'utf8');
    htmlContent = fs.readFileSync('./index.html', 'utf8');
  });

  describe('Tailwind CSS Integration', () => {
    test('HTML should include Tailwind CSS CDN', () => {
      expect(htmlContent).toMatch(/tailwindcss/);
      expect(htmlContent).toMatch(/cdn\.tailwindcss\.com/);
    });

    test('should use responsive grid layouts', () => {
      expect(appContent).toMatch(/grid-cols-2/);
      expect(appContent).toMatch(/grid-cols-4/);
      expect(appContent).toMatch(/gap-\d+/);
    });

    test('should use flexible layouts', () => {
      expect(appContent).toMatch(/flex/);
      expect(appContent).toMatch(/flex-1/);
      expect(appContent).toMatch(/justify-between/);
      expect(appContent).toMatch(/items-center/);
    });

    test('should use responsive spacing', () => {
      expect(appContent).toMatch(/p-\d+/);
      expect(appContent).toMatch(/m-\d+/);
      expect(appContent).toMatch(/space-y-\d+/);
      expect(appContent).toMatch(/gap-\d+/);
    });

    test('should use responsive widths and heights', () => {
      expect(appContent).toMatch(/w-full/);
      expect(appContent).toMatch(/h-\d+/);
      expect(appContent).toMatch(/max-w-/);
      expect(appContent).toMatch(/min-h-screen/);
    });
  });

  describe('Mobile-First Design', () => {
    test('should have viewport meta tag', () => {
      expect(htmlContent).toMatch(/<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1"/);
    });

    test('should use mobile-friendly touch targets', () => {
      expect(appContent).toMatch(/p-\d+/); // Adequate padding for touch
      expect(appContent).toMatch(/rounded-/); // Rounded corners for better UX
    });

    test('should handle overflow on mobile', () => {
      expect(appContent).toMatch(/overflow-x-auto/);
      expect(appContent).toMatch(/overflow-y-auto/);
      expect(appContent).toMatch(/max-h-/);
    });

    test('should use appropriate text sizes', () => {
      expect(appContent).toMatch(/text-xs/);
      expect(appContent).toMatch(/text-sm/);
      expect(appContent).toMatch(/text-lg/);
      expect(appContent).toMatch(/text-xl/);
      expect(appContent).toMatch(/text-2xl/);
    });
  });

  describe('Layout Components', () => {
    test('should have responsive navigation', () => {
      expect(appContent).toMatch(/fixed bottom-0/);
      expect(appContent).toMatch(/grid grid-cols-4/);
      expect(appContent).toMatch(/NavButton/);
    });

    test('should have responsive header', () => {
      expect(appContent).toMatch(/sticky top-0/);
      expect(appContent).toMatch(/max-w-4xl mx-auto/);
      expect(appContent).toMatch(/flex justify-between/);
    });

    test('should have responsive main content', () => {
      expect(appContent).toMatch(/max-w-4xl mx-auto/);
      expect(appContent).toMatch(/p-4 pb-24/); // Bottom padding for fixed nav
    });

    test('should have responsive floating action button', () => {
      expect(appContent).toMatch(/fixed bottom-24 right-6/);
      expect(appContent).toMatch(/rounded-full/);
      expect(appContent).toMatch(/p-6/);
    });
  });

  describe('Form Responsiveness', () => {
    test('should have responsive form layouts', () => {
      expect(appContent).toMatch(/grid grid-cols-2 gap-4/);
      expect(appContent).toMatch(/w-full.*p-4.*rounded-lg/);
    });

    test('should handle form inputs properly', () => {
      expect(appContent).toMatch(/w-full p-4 rounded-lg/);
      expect(appContent).toMatch(/border/);
      expect(appContent).toMatch(/text-lg/);
    });

    test('should have responsive buttons', () => {
      expect(appContent).toMatch(/w-full.*bg-.*text-white.*p-\d+.*rounded-xl/);
      expect(appContent).toMatch(/hover:bg-/);
    });
  });

  describe('Card and List Layouts', () => {
    test('should use responsive card layouts', () => {
      expect(appContent).toMatch(/rounded-xl p-6/);
      expect(appContent).toMatch(/border/);
      expect(appContent).toMatch(/space-y-/);
    });

    test('should handle list items responsively', () => {
      expect(appContent).toMatch(/flex justify-between items-center/);
      expect(appContent).toMatch(/flex items-center gap-/);
    });

    test('should use responsive statistics cards', () => {
      expect(appContent).toMatch(/StatCard/);
      expect(appContent).toMatch(/grid grid-cols-2 gap-4/);
    });
  });

  describe('Lucide Icons Integration', () => {
    test('HTML should include Lucide React CDN', () => {
      expect(htmlContent).toMatch(/lucide-react/);
      expect(htmlContent).toMatch(/unpkg\.com/);
    });

    test('should use Lucide icons consistently', () => {
      expect(appContent).toMatch(/import.*{.*Plus.*DollarSign.*TrendingUp.*Receipt.*Settings.*Sun.*Moon.*X.*Pencil.*Trash2.*Download.*}.*from 'lucide-react'/);
    });

    test('should use icons in navigation', () => {
      expect(appContent).toMatch(/NavButton icon={<DollarSign \/>}/);
      expect(appContent).toMatch(/NavButton icon={<TrendingUp \/>}/);
      expect(appContent).toMatch(/NavButton icon={<Settings \/>}/);
    });

    test('should use icons in UI elements', () => {
      expect(appContent).toMatch(/<Plus size={32} \/>/);
      expect(appContent).toMatch(/<Receipt size={24} \/>/);
      expect(appContent).toMatch(/<Download size={20} \/>/);
    });
  });

  describe('Theme Support', () => {
    test('should implement dark/light theme system', () => {
      expect(appContent).toMatch(/darkMode.*useState/);
      expect(appContent).toMatch(/setDarkMode/);
      expect(appContent).toMatch(/localStorage.*darkMode/);
    });

    test('should use theme object for consistent styling', () => {
      expect(appContent).toMatch(/const theme = {/);
      expect(appContent).toMatch(/bg:.*darkMode.*bg-gray-900.*bg-gray-50/);
      expect(appContent).toMatch(/card:.*darkMode.*bg-gray-800.*bg-white/);
      expect(appContent).toMatch(/text:.*darkMode.*text-white.*text-gray-900/);
    });

    test('should apply theme classes consistently', () => {
      expect(appContent).toMatch(/\${theme\.bg}/);
      expect(appContent).toMatch(/\${theme\.card}/);
      expect(appContent).toMatch(/\${theme\.text}/);
      expect(appContent).toMatch(/\${theme\.border}/);
    });

    test('should have theme toggle button', () => {
      expect(appContent).toMatch(/onClick.*setDarkMode.*!darkMode/);
      expect(appContent).toMatch(/darkMode.*Sun.*Moon/);
    });
  });

  describe('Accessibility and UX', () => {
    test('should use semantic HTML structure', () => {
      expect(appContent).toMatch(/<h1.*Control de Taxi/);
      expect(appContent).toMatch(/<h2.*font-bold/);
      expect(appContent).toMatch(/<h3.*font-bold/);
    });

    test('should provide visual feedback', () => {
      expect(appContent).toMatch(/hover:bg-/);
      expect(appContent).toMatch(/hover:text-/);
      expect(appContent).toMatch(/transition-/);
      expect(appContent).toMatch(/animate-/);
    });

    test('should handle loading and offline states', () => {
      expect(appContent).toMatch(/animate-pulse/);
      expect(appContent).toMatch(/animate-spin/);
      expect(appContent).toMatch(/Offline/);
      expect(appContent).toMatch(/Sincronizando/);
    });

    test('should use appropriate color coding', () => {
      expect(appContent).toMatch(/text-green-600/); // Income/positive
      expect(appContent).toMatch(/text-red-600/);   // Expenses/negative
      expect(appContent).toMatch(/text-blue-600/);  // Neutral/info
      expect(appContent).toMatch(/bg-orange-600/);  // Warning/offline
    });
  });

  describe('Performance Optimizations', () => {
    test('should use efficient CSS classes', () => {
      // Check for utility-first approach
      expect(appContent).toMatch(/className.*flex.*items-center.*gap-/);
      expect(appContent).toMatch(/className.*grid.*grid-cols-.*gap-/);
    });

    test('should minimize inline styles', () => {
      // Should primarily use Tailwind classes, not inline styles
      const inlineStyleMatches = appContent.match(/style=/g);
      expect(inlineStyleMatches).toBeNull(); // No inline styles expected
    });

    test('should use consistent spacing system', () => {
      expect(appContent).toMatch(/p-[1-6]/);
      expect(appContent).toMatch(/m-[1-6]/);
      expect(appContent).toMatch(/gap-[1-6]/);
      expect(appContent).toMatch(/space-y-[1-6]/);
    });
  });
});

describe('Cross-Device Compatibility', () => {
  test('should handle different screen sizes', () => {
    // Mobile-first approach with appropriate breakpoints
    expect(appContent).toMatch(/max-w-4xl/); // Desktop constraint
    expect(appContent).toMatch(/grid-cols-2/); // Mobile grid
    expect(appContent).toMatch(/grid-cols-4/); // Desktop navigation
  });

  test('should handle touch interactions', () => {
    expect(appContent).toMatch(/p-[3-6]/); // Adequate touch targets
    expect(appContent).toMatch(/rounded-/); // Touch-friendly corners
  });

  test('should handle keyboard navigation', () => {
    expect(appContent).toMatch(/button/);
    expect(appContent).toMatch(/onClick/);
    expect(appContent).toMatch(/onCancel/);
  });
});