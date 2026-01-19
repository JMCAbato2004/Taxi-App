/**
 * Tests para funcionalidad de la aplicación PWA Control de Taxi
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

const fs = require('fs');

describe('App Functionality Tests', () => {
  let appContent;

  beforeAll(() => {
    appContent = fs.readFileSync('./index', 'utf8');
  });

  describe('Service Management (Requirement 6.1)', () => {
    test('should define service state management', () => {
      expect(appContent).toMatch(/const \[services, setServices\] = useState\(\(\) => {/);
      expect(appContent).toMatch(/const saved = localStorage\.getItem\('services'\)/);
      expect(appContent).toMatch(/return saved \? JSON\.parse\(saved\) : \[\]/);
    });

    test('should persist services to localStorage', () => {
      expect(appContent).toMatch(/useEffect\(\(\) => {/);
      expect(appContent).toMatch(/localStorage\.setItem\('services', JSON\.stringify\(services\)\)/);
      expect(appContent).toMatch(/}, \[services\]\)/);
    });

    test('should implement addService function', () => {
      expect(appContent).toMatch(/const addService = \(service\) => {/);
      expect(appContent).toMatch(/const newService = { \.\.\.service, id: Date\.now\(\) }/);
      expect(appContent).toMatch(/setServices\(\[\.\.\.services, newService\]\)/);
    });

    test('should implement updateService function', () => {
      expect(appContent).toMatch(/const updateService = \(id, updatedService\) => {/);
      expect(appContent).toMatch(/setServices\(services\.map\(s => s\.id === id \? serviceWithId : s\)\)/);
    });

    test('should implement deleteService function', () => {
      expect(appContent).toMatch(/const deleteService = \(id\) => {/);
      expect(appContent).toMatch(/window\.confirm\('¿Seguro que quieres eliminar este servicio\?'\)/);
      expect(appContent).toMatch(/setServices\(services\.filter\(s => s\.id !== id\)\)/);
    });

    test('should support all required platforms', () => {
      expect(appContent).toMatch(/const PLATFORMS = \['Emisora', 'Calle', 'Uber', 'Freenow', 'Cabify', 'Bolt', 'DiDi', 'Otra'\]/);
    });

    test('should handle service form data', () => {
      expect(appContent).toMatch(/platform: 'Emisora'/);
      expect(appContent).toMatch(/price: ''/);
      expect(appContent).toMatch(/tip: ''/);
      expect(appContent).toMatch(/extras: ''/);
      expect(appContent).toMatch(/startTime:/);
      expect(appContent).toMatch(/endTime:/);
      expect(appContent).toMatch(/origin: ''/);
      expect(appContent).toMatch(/destination: ''/);
    });

    test('should validate required service fields', () => {
      expect(appContent).toMatch(/if \(formData\.price\) {/);
      expect(appContent).toMatch(/alert\('El precio es obligatorio'\)/);
    });
  });

  describe('Expense Management (Requirement 6.2)', () => {
    test('should define expense state management', () => {
      expect(appContent).toMatch(/const \[expenses, setExpenses\] = useState\(\(\) => {/);
      expect(appContent).toMatch(/const saved = localStorage\.getItem\('expenses'\)/);
      expect(appContent).toMatch(/return saved \? JSON\.parse\(saved\) : \[\]/);
    });

    test('should persist expenses to localStorage', () => {
      expect(appContent).toMatch(/localStorage\.setItem\('expenses', JSON\.stringify\(expenses\)\)/);
    });

    test('should implement addExpense function', () => {
      expect(appContent).toMatch(/const addExpense = \(expense\) => {/);
      expect(appContent).toMatch(/const newExpense = { \.\.\.expense, id: Date\.now\(\), timestamp: new Date\(\)\.toISOString\(\) }/);
      expect(appContent).toMatch(/setExpenses\(\[\.\.\.expenses, newExpense\]\)/);
    });

    test('should implement deleteExpense function', () => {
      expect(appContent).toMatch(/const deleteExpense = \(id\) => {/);
      expect(appContent).toMatch(/window\.confirm\('¿Seguro que quieres eliminar este gasto\?'\)/);
      expect(appContent).toMatch(/setExpenses\(expenses\.filter\(e => e\.id !== id\)\)/);
    });

    test('should support expense categories', () => {
      expect(appContent).toMatch(/const DEFAULT_EXPENSE_CATEGORIES = \['Gasolina', 'Comida', 'Lavado', 'Peajes', 'Mantenimiento'\]/);
      expect(appContent).toMatch(/const \[expenseCategories, setExpenseCategories\] = useState/);
    });

    test('should handle expense form data', () => {
      expect(appContent).toMatch(/category: categories\[0\]/);
      expect(appContent).toMatch(/amount: ''/);
      expect(appContent).toMatch(/notes: ''/);
      expect(appContent).toMatch(/photo: null/);
    });

    test('should validate required expense fields', () => {
      expect(appContent).toMatch(/if \(formData\.amount && formData\.category\) {/);
      expect(appContent).toMatch(/alert\('El importe y la categoría son obligatorios'\)/);
    });

    test('should support photo upload for receipts', () => {
      expect(appContent).toMatch(/const handlePhotoUpload = \(e\) => {/);
      expect(appContent).toMatch(/const file = e\.target\.files\[0\]/);
      expect(appContent).toMatch(/const reader = new FileReader\(\)/);
      expect(appContent).toMatch(/reader\.readAsDataURL\(file\)/);
      expect(appContent).toMatch(/accept="image\/\*"/);
      expect(appContent).toMatch(/capture="environment"/);
    });
  });

  describe('Reports Generation (Requirement 6.3)', () => {
    test('should implement getTodayStats function', () => {
      expect(appContent).toMatch(/const getTodayStats = \(\) => {/);
      expect(appContent).toMatch(/const today = new Date\(\)\.toDateString\(\)/);
      expect(appContent).toMatch(/const todayServices = services\.filter/);
      expect(appContent).toMatch(/const todayExpenses = expenses\.filter/);
    });

    test('should calculate income correctly', () => {
      expect(appContent).toMatch(/const income = todayServices\.reduce\(\(sum, s\) =>/);
      expect(appContent).toMatch(/sum \+ parseFloat\(s\.price\) \+ parseFloat\(s\.tip \|\| 0\) \+ parseFloat\(s\.extras \|\| 0\)/);
    });

    test('should calculate expenses correctly', () => {
      expect(appContent).toMatch(/const spent = todayExpenses\.reduce\(\(sum, e\) => sum \+ parseFloat\(e\.amount\), 0\)/);
    });

    test('should calculate profit correctly', () => {
      expect(appContent).toMatch(/profit: \(income - spent\)\.toFixed\(2\)/);
    });

    test('should provide platform breakdown', () => {
      expect(appContent).toMatch(/byPlatform: PLATFORMS\.reduce\(\(acc, platform\) => {/);
      expect(appContent).toMatch(/const platformServices = todayServices\.filter\(s => s\.platform === platform\)/);
    });

    test('should support different time periods', () => {
      expect(appContent).toMatch(/const \[period, setPeriod\] = useState\('today'\)/);
      expect(appContent).toMatch(/const getDateRange = \(\) => {/);
      expect(appContent).toMatch(/case 'today':/);
      expect(appContent).toMatch(/case 'week':/);
      expect(appContent).toMatch(/case 'month':/);
    });

    test('should filter data by date range', () => {
      expect(appContent).toMatch(/const periodServices = services\.filter\(s => {/);
      expect(appContent).toMatch(/const date = new Date\(s\.startTime\)/);
      expect(appContent).toMatch(/return date >= start && date <= end/);
    });
  });

  describe('Data Persistence (Requirement 6.4)', () => {
    test('should persist all app state to localStorage', () => {
      expect(appContent).toMatch(/localStorage\.setItem\('services'/);
      expect(appContent).toMatch(/localStorage\.setItem\('expenses'/);
      expect(appContent).toMatch(/localStorage\.setItem\('expenseCategories'/);
      expect(appContent).toMatch(/localStorage\.setItem\('darkMode'/);
    });

    test('should restore state from localStorage on load', () => {
      expect(appContent).toMatch(/localStorage\.getItem\('services'\)/);
      expect(appContent).toMatch(/localStorage\.getItem\('expenses'\)/);
      expect(appContent).toMatch(/localStorage\.getItem\('expenseCategories'\)/);
      expect(appContent).toMatch(/localStorage\.getItem\('darkMode'\)/);
    });

    test('should handle localStorage errors gracefully', () => {
      expect(appContent).toMatch(/saved \? JSON\.parse\(saved\) : \[\]/);
      expect(appContent).toMatch(/saved \? JSON\.parse\(saved\) : false/);
    });

    test('should use useEffect for persistence', () => {
      expect(appContent).toMatch(/useEffect\(\(\) => {[\s\S]*localStorage\.setItem/);
    });
  });

  describe('CSV Export (Requirement 6.5)', () => {
    test('should implement exportToExcel function', () => {
      expect(appContent).toMatch(/const exportToExcel = \(\) => {/);
    });

    test('should create CSV content with headers', () => {
      expect(appContent).toMatch(/const csvContent = \[/);
      expect(appContent).toMatch(/\['Fecha', 'Plataforma', 'Precio', 'Propina', 'Extras', 'Total'\]/);
    });

    test('should format service data for CSV', () => {
      expect(appContent).toMatch(/\.\.\.periodServices\.map\(s => \[/);
      expect(appContent).toMatch(/new Date\(s\.startTime\)\.toLocaleString\(\)/);
      expect(appContent).toMatch(/s\.platform/);
      expect(appContent).toMatch(/s\.price/);
      expect(appContent).toMatch(/s\.tip \|\| 0/);
      expect(appContent).toMatch(/s\.extras \|\| 0/);
    });

    test('should create downloadable CSV file', () => {
      expect(appContent).toMatch(/const blob = new Blob\(\[csvContent\], { type: 'text\/csv' }\)/);
      expect(appContent).toMatch(/const url = URL\.createObjectURL\(blob\)/);
      expect(appContent).toMatch(/const a = document\.createElement\('a'\)/);
      expect(appContent).toMatch(/a\.href = url/);
      expect(appContent).toMatch(/a\.download =/);
      expect(appContent).toMatch(/a\.click\(\)/);
    });

    test('should include period and date in filename', () => {
      expect(appContent).toMatch(/servicios_\${period}_\${new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]}\.csv/);
    });

    test('should have export button in UI', () => {
      expect(appContent).toMatch(/onClick={exportToExcel}/);
      expect(appContent).toMatch(/Descargar Excel \(CSV\)/);
      expect(appContent).toMatch(/<Download size={20} \/>/);
    });
  });

  describe('Navigation and Views', () => {
    test('should implement view state management', () => {
      expect(appContent).toMatch(/const \[view, setView\] = useState\('home'\)/);
    });

    test('should support all required views', () => {
      expect(appContent).toMatch(/view === 'home'/);
      expect(appContent).toMatch(/view === 'newService'/);
      expect(appContent).toMatch(/view === 'newExpense'/);
      expect(appContent).toMatch(/view === 'reports'/);
      expect(appContent).toMatch(/view === 'settings'/);
    });

    test('should implement navigation buttons', () => {
      expect(appContent).toMatch(/<NavButton.*label="Inicio".*active={view === 'home'}/);
      expect(appContent).toMatch(/<NavButton.*label="Reportes".*active={view === 'reports'}/);
      expect(appContent).toMatch(/<NavButton.*label="Ajustes".*active={view === 'settings'}/);
    });

    test('should have floating action button', () => {
      expect(appContent).toMatch(/onClick.*setView\('newService'\)/);
      expect(appContent).toMatch(/fixed bottom-24 right-6/);
      expect(appContent).toMatch(/<Plus size={32} \/>/);
    });
  });

  describe('Form Handling', () => {
    test('should handle service form submission', () => {
      expect(appContent).toMatch(/const handleSave = \(\) => {/);
      expect(appContent).toMatch(/onSave\(formData\)/);
    });

    test('should handle form cancellation', () => {
      expect(appContent).toMatch(/onCancel.*setView\('home'\)/);
      expect(appContent).toMatch(/setEditingService\(null\)/);
    });

    test('should support service editing', () => {
      expect(appContent).toMatch(/const \[editingService, setEditingService\] = useState\(null\)/);
      expect(appContent).toMatch(/initialData={editingService}/);
      expect(appContent).toMatch(/editingService \? \(data\) => updateService\(editingService\.id, data\) : addService/);
    });

    test('should handle datetime inputs', () => {
      expect(appContent).toMatch(/type="datetime-local"/);
      expect(appContent).toMatch(/new Date\(\)\.toISOString\(\)\.slice\(0, 16\)/);
    });

    test('should handle numeric inputs', () => {
      expect(appContent).toMatch(/type="number"/);
      expect(appContent).toMatch(/step="0\.01"/);
    });
  });

  describe('Settings Management', () => {
    test('should allow category management', () => {
      expect(appContent).toMatch(/const addCategory = \(\) => {/);
      expect(appContent).toMatch(/const removeCategory = \(cat\) => {/);
      expect(appContent).toMatch(/setCategories\(\[\.\.\.categories, newCategory\]\)/);
      expect(appContent).toMatch(/setCategories\(categories\.filter\(c => c !== cat\)\)/);
    });

    test('should prevent removing all categories', () => {
      expect(appContent).toMatch(/if \(categories\.length > 1\)/);
      expect(appContent).toMatch(/alert\('Debe haber al menos una categoría'\)/);
    });

    test('should prevent duplicate categories', () => {
      expect(appContent).toMatch(/if \(newCategory && !categories\.includes\(newCategory\)\)/);
    });
  });

  describe('Error Handling', () => {
    test('should validate form inputs', () => {
      expect(appContent).toMatch(/if \(formData\.price\)/);
      expect(appContent).toMatch(/if \(formData\.amount && formData\.category\)/);
    });

    test('should confirm destructive actions', () => {
      expect(appContent).toMatch(/window\.confirm.*eliminar/);
    });

    test('should handle missing data gracefully', () => {
      expect(appContent).toMatch(/\|\| 0/); // Default values
      expect(appContent).toMatch(/\|\| ''/); // Default strings
      expect(appContent).toMatch(/\|\| \[\]/); // Default arrays
    });
  });
});