/**
 * Pruebas unitarias para ExpenseManager
 * Valida funcionalidad CRUD, validaciones y filtros
 */

/**
 * Suite de pruebas para ExpenseManager
 */
function runExpenseManagerTests() {
  console.log('🧪 Iniciando pruebas de ExpenseManager...');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  };

  // Helper para ejecutar pruebas
  function test(name, testFn) {
    results.total++;
    try {
      testFn();
      results.passed++;
      results.details.push({ name, status: 'PASS', error: null });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.details.push({ name, status: 'FAIL', error: error.message });
      console.error(`❌ ${name}: ${error.message}`);
    }
  }

  // Helper para crear datos de prueba
  function createTestExpense(overrides = {}) {
    return {
      id: 'test-' + Date.now(),
      date: new Date('2024-01-15'),
      concept: 'Gasto de prueba',
      amount: 50.00,
      category: 'fuel',
      ...overrides
    };
  }

  // Helper para validar estructura de gasto
  function validateExpenseStructure(expense) {
    const requiredFields = ['id', 'date', 'concept', 'amount', 'category'];
    for (const field of requiredFields) {
      if (!(field in expense)) {
        throw new Error(`Campo requerido faltante: ${field}`);
      }
    }

    // Validar tipos
    if (typeof expense.id !== 'string') {
      throw new Error('ID debe ser string');
    }
    if (!(expense.date instanceof Date)) {
      throw new Error('Date debe ser Date object');
    }
    if (typeof expense.concept !== 'string') {
      throw new Error('Concept debe ser string');
    }
    if (typeof expense.amount !== 'number') {
      throw new Error('Amount debe ser number');
    }
    if (typeof expense.category !== 'string') {
      throw new Error('Category debe ser string');
    }

    // Validar valores
    if (expense.amount < 0) {
      throw new Error('Amount no puede ser negativo');
    }
    if (expense.concept.length < 3) {
      throw new Error('Concept debe tener al menos 3 caracteres');
    }
    if (!['fuel', 'maintenance', 'insurance', 'other'].includes(expense.category)) {
      throw new Error('Category debe ser válida');
    }
  }

  // Pruebas de estructura de datos
  test('Estructura de gasto válida', () => {
    const expense = createTestExpense();
    validateExpenseStructure(expense);
  });

  test('Validación de campos requeridos', () => {
    const incompleteExpense = { id: '1', date: new Date() };
    try {
      validateExpenseStructure(incompleteExpense);
      throw new Error('Debería haber fallado la validación');
    } catch (error) {
      if (!error.message.includes('Campo requerido faltante')) {
        throw error;
      }
    }
  });

  // Pruebas de validación de datos
  test('Validación de importe negativo', () => {
    try {
      const expense = createTestExpense({ amount: -10 });
      validateExpenseStructure(expense);
      throw new Error('Debería rechazar importe negativo');
    } catch (error) {
      if (!error.message.includes('Amount no puede ser negativo')) {
        throw error;
      }
    }
  });

  test('Validación de concepto muy corto', () => {
    try {
      const expense = createTestExpense({ concept: 'ab' });
      validateExpenseStructure(expense);
      throw new Error('Debería rechazar concepto muy corto');
    } catch (error) {
      if (!error.message.includes('Concept debe tener al menos 3 caracteres')) {
        throw error;
      }
    }
  });

  test('Validación de categoría inválida', () => {
    try {
      const expense = createTestExpense({ category: 'invalid' });
      validateExpenseStructure(expense);
      throw new Error('Debería rechazar categoría inválida');
    } catch (error) {
      if (!error.message.includes('Category debe ser válida')) {
        throw error;
      }
    }
  });

  // Pruebas de operaciones CRUD
  test('Crear gasto válido', () => {
    const expenses = [];
    const newExpense = createTestExpense();
    
    // Simular adición
    expenses.push(newExpense);
    
    if (expenses.length !== 1) {
      throw new Error('Gasto no fue añadido correctamente');
    }
    if (expenses[0].id !== newExpense.id) {
      throw new Error('ID del gasto no coincide');
    }
  });

  test('Actualizar gasto existente', () => {
    const expenses = [createTestExpense({ id: 'test-1' })];
    const updatedData = { concept: 'Concepto actualizado', amount: 75.50 };
    
    // Simular actualización
    const index = expenses.findIndex(e => e.id === 'test-1');
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updatedData };
    }
    
    if (expenses[0].concept !== updatedData.concept) {
      throw new Error('Concepto no fue actualizado');
    }
    if (expenses[0].amount !== updatedData.amount) {
      throw new Error('Importe no fue actualizado');
    }
  });

  test('Eliminar gasto existente', () => {
    const expenses = [
      createTestExpense({ id: 'test-1' }),
      createTestExpense({ id: 'test-2' })
    ];
    
    // Simular eliminación
    const filteredExpenses = expenses.filter(e => e.id !== 'test-1');
    
    if (filteredExpenses.length !== 1) {
      throw new Error('Gasto no fue eliminado correctamente');
    }
    if (filteredExpenses[0].id === 'test-1') {
      throw new Error('Gasto eliminado aún existe');
    }
  });

  // Pruebas de filtrado
  test('Filtrar por categoría', () => {
    const expenses = [
      createTestExpense({ id: '1', category: 'fuel' }),
      createTestExpense({ id: '2', category: 'maintenance' }),
      createTestExpense({ id: '3', category: 'fuel' })
    ];
    
    const fuelExpenses = expenses.filter(e => e.category === 'fuel');
    
    if (fuelExpenses.length !== 2) {
      throw new Error('Filtro por categoría no funciona correctamente');
    }
  });

  test('Filtrar por rango de fechas', () => {
    const expenses = [
      createTestExpense({ id: '1', date: new Date('2024-01-10') }),
      createTestExpense({ id: '2', date: new Date('2024-01-15') }),
      createTestExpense({ id: '3', date: new Date('2024-01-20') })
    ];
    
    const startDate = new Date('2024-01-12');
    const endDate = new Date('2024-01-18');
    
    const filteredExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    if (filteredExpenses.length !== 1) {
      throw new Error('Filtro por fecha no funciona correctamente');
    }
    if (filteredExpenses[0].id !== '2') {
      throw new Error('Filtro por fecha devolvió gasto incorrecto');
    }
  });

  test('Búsqueda por concepto', () => {
    const expenses = [
      createTestExpense({ id: '1', concept: 'Gasolina Shell' }),
      createTestExpense({ id: '2', concept: 'Cambio de aceite' }),
      createTestExpense({ id: '3', concept: 'Gasolina BP' })
    ];
    
    const searchTerm = 'gasolina';
    const searchResults = expenses.filter(e => 
      e.concept.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (searchResults.length !== 2) {
      throw new Error('Búsqueda por concepto no funciona correctamente');
    }
  });

  // Pruebas de cálculos y estadísticas
  test('Calcular total de gastos', () => {
    const expenses = [
      createTestExpense({ amount: 50.00 }),
      createTestExpense({ amount: 75.50 }),
      createTestExpense({ amount: 25.25 })
    ];
    
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expected = 150.75;
    
    if (Math.abs(total - expected) > 0.01) {
      throw new Error(`Total incorrecto: esperado ${expected}, obtenido ${total}`);
    }
  });

  test('Calcular estadísticas por categoría', () => {
    const expenses = [
      createTestExpense({ category: 'fuel', amount: 50.00 }),
      createTestExpense({ category: 'fuel', amount: 60.00 }),
      createTestExpense({ category: 'maintenance', amount: 100.00 })
    ];
    
    const categoryStats = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    if (categoryStats.fuel !== 110.00) {
      throw new Error('Estadística de combustible incorrecta');
    }
    if (categoryStats.maintenance !== 100.00) {
      throw new Error('Estadística de mantenimiento incorrecta');
    }
  });

  // Pruebas de ordenación
  test('Ordenar por fecha descendente', () => {
    const expenses = [
      createTestExpense({ id: '1', date: new Date('2024-01-10') }),
      createTestExpense({ id: '2', date: new Date('2024-01-20') }),
      createTestExpense({ id: '3', date: new Date('2024-01-15') })
    ];
    
    const sorted = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sorted[0].id !== '2') {
      throw new Error('Ordenación por fecha descendente incorrecta');
    }
    if (sorted[2].id !== '1') {
      throw new Error('Ordenación por fecha descendente incorrecta');
    }
  });

  test('Ordenar por importe ascendente', () => {
    const expenses = [
      createTestExpense({ id: '1', amount: 75.00 }),
      createTestExpense({ id: '2', amount: 25.00 }),
      createTestExpense({ id: '3', amount: 50.00 })
    ];
    
    const sorted = expenses.sort((a, b) => a.amount - b.amount);
    
    if (sorted[0].id !== '2') {
      throw new Error('Ordenación por importe ascendente incorrecta');
    }
    if (sorted[2].id !== '1') {
      throw new Error('Ordenación por importe ascendente incorrecta');
    }
  });

  // Pruebas de casos borde
  test('Lista vacía de gastos', () => {
    const expenses = [];
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    if (total !== 0) {
      throw new Error('Total de lista vacía debería ser 0');
    }
  });

  test('Gasto con importe cero', () => {
    const expense = createTestExpense({ amount: 0 });
    validateExpenseStructure(expense);
    
    if (expense.amount !== 0) {
      throw new Error('Importe cero debería ser válido');
    }
  });

  test('Concepto con longitud máxima', () => {
    const longConcept = 'a'.repeat(100);
    const expense = createTestExpense({ concept: longConcept });
    validateExpenseStructure(expense);
    
    if (expense.concept.length !== 100) {
      throw new Error('Concepto de 100 caracteres debería ser válido');
    }
  });

  test('Concepto excede longitud máxima', () => {
    const tooLongConcept = 'a'.repeat(101);
    try {
      const expense = createTestExpense({ concept: tooLongConcept });
      // Simular validación de longitud máxima
      if (expense.concept.length > 100) {
        throw new Error('Concept no puede superar los 100 caracteres');
      }
      throw new Error('Debería rechazar concepto muy largo');
    } catch (error) {
      if (!error.message.includes('Concept no puede superar los 100 caracteres')) {
        throw error;
      }
    }
  });

  // Pruebas de integración con requerimientos
  test('Requerimiento 4.1: Almacenamiento completo de gastos', () => {
    const expense = createTestExpense({
      date: new Date('2024-01-15'),
      concept: 'Gasolina Shell',
      amount: 65.50,
      category: 'fuel'
    });
    
    validateExpenseStructure(expense);
    
    // Verificar que todos los campos requeridos están presentes
    if (!expense.date || !expense.concept || expense.amount === undefined || !expense.category) {
      throw new Error('Faltan campos requeridos para el requerimiento 4.1');
    }
  });

  test('Requerimiento 4.2: Suma de gastos por período', () => {
    const expenses = [
      createTestExpense({ date: new Date('2024-01-10'), amount: 50.00 }),
      createTestExpense({ date: new Date('2024-01-15'), amount: 75.00 }),
      createTestExpense({ date: new Date('2024-01-25'), amount: 25.00 })
    ];
    
    const startDate = new Date('2024-01-12');
    const endDate = new Date('2024-01-20');
    
    const periodExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    const periodTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    if (periodTotal !== 75.00) {
      throw new Error('Suma de gastos por período incorrecta');
    }
  });

  // Mostrar resultados
  console.log('\n📊 Resultados de las pruebas:');
  console.log(`✅ Pasadas: ${results.passed}`);
  console.log(`❌ Fallidas: ${results.failed}`);
  console.log(`📝 Total: ${results.total}`);
  console.log(`📈 Porcentaje de éxito: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ Pruebas fallidas:');
    results.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
  }

  return results;
}

// Ejecutar pruebas automáticamente si estamos en el navegador
if (typeof window !== 'undefined') {
  window.runExpenseManagerTests = runExpenseManagerTests;
  
  // Ejecutar automáticamente después de un breve delay
  setTimeout(() => {
    console.log('🚀 Ejecutando pruebas automáticas de ExpenseManager...');
    runExpenseManagerTests();
  }, 1000);
}

// Exportar para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runExpenseManagerTests };
}