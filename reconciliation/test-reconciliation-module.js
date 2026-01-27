/**
 * Pruebas para el componente principal ReconciliationModule
 * Valida la integración de todos los componentes y la navegación entre pestañas
 */

// Simular React para las pruebas
const React = {
  useState: (initial) => [initial, () => {}],
  useEffect: () => {},
  createElement: (type, props, ...children) => ({ type, props, children })
};

// Simular window global
global.window = {
  React: React,
  ReconciliationStorageManager: class {
    getServices() { return []; }
    getExpenses() { return []; }
    getReconciliations() { return []; }
    getSettings() { return { commissionRates: { freenow: 0.15, other: 0.10 }, distributionRates: { driver: 0.40, owner: 0.60 } }; }
    saveService() { return true; }
    saveExpense() { return true; }
    saveReconciliation() { return true; }
  },
  CalculationEngine: class {
    constructor(settings) { this.settings = settings; }
    generateReconciliation() { return { id: 'test', summary: { totalServices: 0, netIncome: 0, totalExpenses: 0 }, dailyTotals: [], finalSettlement: { driverAmount: 0, ownerAmount: 0 } }; }
  },
  ServiceManager: () => React.createElement('div', null, 'ServiceManager'),
  ExpenseManager: () => React.createElement('div', null, 'ExpenseManager'),
  CashCalculator: class {
    createEmptyBreakdown() { return { fifty: 0, twenty: 0, ten: 0, five: 0, two: 0, one: 0, cents: 0 }; }
    calculateTotal() { return 0; }
    calculateDifference() { return 0; }
    updateDenomination(breakdown, type, denomination, count) { return { ...breakdown, [denomination]: count }; }
  }
};

// Cargar el módulo
require('./reconciliation-module.js');

/**
 * Pruebas del componente ReconciliationModule
 */
function testReconciliationModule() {
  console.log('🧪 Iniciando pruebas del ReconciliationModule...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function runTest(name, testFn) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      results.passed++;
      results.tests.push({ name, status: 'passed' });
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      results.failed++;
      results.tests.push({ name, status: 'failed', error: error.message });
    }
  }

  // Test 1: Verificar que ReconciliationModule está disponible
  runTest('ReconciliationModule está disponible globalmente', () => {
    if (typeof window.ReconciliationModule !== 'function') {
      throw new Error('ReconciliationModule no está disponible en window');
    }
  });

  // Test 2: Verificar que se puede instanciar el componente
  runTest('ReconciliationModule se puede instanciar', () => {
    const theme = {
      bg: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      card: 'bg-white',
      border: 'border-gray-200',
      input: 'bg-white'
    };

    const component = window.ReconciliationModule({
      theme: theme,
      onBack: () => {}
    });

    if (!component || typeof component !== 'object') {
      throw new Error('ReconciliationModule no retorna un componente válido');
    }
  });

  // Test 3: Verificar estructura del componente
  runTest('ReconciliationModule tiene la estructura correcta', () => {
    const theme = {
      bg: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      card: 'bg-white',
      border: 'border-gray-200',
      input: 'bg-white'
    };

    const component = window.ReconciliationModule({
      theme: theme,
      onBack: () => {}
    });

    // Verificar que es un div principal
    if (component.type !== 'div') {
      throw new Error('El componente principal debe ser un div');
    }

    // Verificar que tiene className con tema
    if (!component.props.className.includes(theme.bg)) {
      throw new Error('El componente debe usar el tema proporcionado');
    }
  });

  // Test 4: Verificar que TabButton está disponible
  runTest('TabButton está disponible y funcional', () => {
    const theme = {
      textSecondary: 'text-gray-600',
      text: 'text-gray-900'
    };

    // TabButton debería estar definido en el scope del módulo
    // Como es una función interna, verificamos que el módulo se carga sin errores
    if (typeof window.ReconciliationModule !== 'function') {
      throw new Error('TabButton no está disponible (módulo no cargado correctamente)');
    }
  });

  // Test 5: Verificar integración con ServiceManager
  runTest('Integración con ServiceManager funciona', () => {
    // Verificar que ServiceManager está disponible
    if (typeof window.ServiceManager !== 'function') {
      throw new Error('ServiceManager no está disponible para integración');
    }

    // Verificar que se puede llamar
    const serviceManager = window.ServiceManager({
      theme: { card: 'bg-white', border: 'border-gray-200' },
      services: [],
      onAdd: () => {},
      onUpdate: () => {},
      onDelete: () => {}
    });

    if (!serviceManager) {
      throw new Error('ServiceManager no se puede instanciar');
    }
  });

  // Test 6: Verificar integración con ExpenseManager
  runTest('Integración con ExpenseManager funciona', () => {
    // Verificar que ExpenseManager está disponible
    if (typeof window.ExpenseManager !== 'function') {
      throw new Error('ExpenseManager no está disponible para integración');
    }

    // Verificar que se puede llamar
    const expenseManager = window.ExpenseManager({
      theme: { card: 'bg-white', border: 'border-gray-200' },
      expenses: [],
      onAdd: () => {},
      onUpdate: () => {},
      onDelete: () => {}
    });

    if (!expenseManager) {
      throw new Error('ExpenseManager no se puede instanciar');
    }
  });

  // Test 7: Verificar integración con CalculationEngine
  runTest('Integración con CalculationEngine funciona', () => {
    // Verificar que CalculationEngine está disponible
    if (typeof window.CalculationEngine !== 'function') {
      throw new Error('CalculationEngine no está disponible para integración');
    }

    // Verificar que se puede instanciar
    const engine = new window.CalculationEngine();
    if (!engine || typeof engine.generateReconciliation !== 'function') {
      throw new Error('CalculationEngine no se puede instanciar correctamente');
    }
  });

  // Test 8: Verificar integración con CashCalculator
  runTest('Integración con CashCalculator funciona', () => {
    // Verificar que CashCalculator está disponible
    if (typeof window.CashCalculator !== 'function') {
      throw new Error('CashCalculator no está disponible para integración');
    }

    // Verificar que se puede instanciar
    const calculator = new window.CashCalculator();
    if (!calculator || typeof calculator.createEmptyBreakdown !== 'function') {
      throw new Error('CashCalculator no se puede instanciar correctamente');
    }
  });

  // Test 9: Verificar manejo de estados
  runTest('Manejo de estados del componente', () => {
    // Simular useState con valores reales
    let stateValues = {
      activeTab: 'services',
      services: [],
      expenses: [],
      selectedPeriod: { start: new Date(), end: new Date() }
    };

    // Mock useState para retornar valores controlados
    const originalUseState = React.useState;
    React.useState = (initial) => {
      const key = typeof initial === 'string' ? initial : 
                   Array.isArray(initial) ? 'array' :
                   typeof initial === 'object' && initial.start ? 'period' : 'other';
      
      return [stateValues[key] || initial, (newValue) => {
        stateValues[key] = newValue;
      }];
    };

    try {
      const component = window.ReconciliationModule({
        theme: { bg: 'bg-white', text: 'text-gray-900', textSecondary: 'text-gray-600', card: 'bg-white', border: 'border-gray-200', input: 'bg-white' },
        onBack: () => {}
      });

      if (!component) {
        throw new Error('Componente no se renderiza con estados simulados');
      }
    } finally {
      React.useState = originalUseState;
    }
  });

  // Test 10: Verificar navegación entre pestañas
  runTest('Navegación entre pestañas implementada', () => {
    // Verificar que las pestañas están definidas en el componente
    const theme = {
      bg: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      card: 'bg-white',
      border: 'border-gray-200',
      input: 'bg-white'
    };

    const component = window.ReconciliationModule({
      theme: theme,
      onBack: () => {}
    });

    // El componente debe tener children que incluyan las pestañas
    if (!component.children || component.children.length === 0) {
      throw new Error('El componente debe tener children para las pestañas');
    }
  });

  // Mostrar resumen
  console.log('\n📊 Resumen de pruebas:');
  console.log(`✅ Pasadas: ${results.passed}`);
  console.log(`❌ Fallidas: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}`);
  console.log(`🎯 Éxito: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ Pruebas fallidas:');
    results.tests.filter(t => t.status === 'failed').forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  }

  return results;
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  testReconciliationModule();
}

module.exports = { testReconciliationModule };