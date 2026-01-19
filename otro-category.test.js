// Test para verificar que la categoría "Otro" funciona correctamente
const fs = require('fs');
const path = require('path');

describe('Categoría "Otro" en Gastos', () => {
  let appContent;

  beforeAll(() => {
    const appPath = path.join(__dirname, 'index.html');
    appContent = fs.readFileSync(appPath, 'utf8');
  });

  test('should include "Otro" in DEFAULT_EXPENSE_CATEGORIES', () => {
    expect(appContent).toMatch(/const DEFAULT_EXPENSE_CATEGORIES = \['Gasolina', 'Comida', 'Lavado', 'Peajes', 'Mantenimiento', 'Otro'\]/);
  });

  test('should have category merging logic', () => {
    expect(appContent).toMatch(/const mergedCategories = \[\.\.\.new Set\(\[\.\.\.savedCategories, \.\.\.DEFAULT_EXPENSE_CATEGORIES\]\)\]/);
  });

  test('should update localStorage when categories are merged', () => {
    expect(appContent).toMatch(/if \(mergedCategories\.length !== savedCategories\.length\)/);
    expect(appContent).toMatch(/localStorage\.setItem\('expenseCategories', JSON\.stringify\(mergedCategories\)\)/);
  });

  test('should pass expenseCategories to ReportsView', () => {
    expect(appContent).toMatch(/e\(ReportsView, \{[^}]*expenseCategories: expenseCategories[^}]*\}\)/);
  });

  test('should use expenseCategories in ReportsView function', () => {
    expect(appContent).toMatch(/function ReportsView\(\{ theme, services, expenses, expenseCategories \}\)/);
    expect(appContent).toMatch(/const expenseData = expenseCategories\.map\(category =>/);
  });

  test('should have NewExpenseView component that uses categories prop', () => {
    expect(appContent).toMatch(/function NewExpenseView\(\{ theme, categories, onSave, onCancel \}\)/);
    expect(appContent).toMatch(/categories\.map\(c => e\('option'/);
  });
});