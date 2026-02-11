/**
 * Pruebas de integración completas para el checkpoint de validación básica
 * Valida que CalculationEngine, ServiceManager, ExpenseManager y StorageManager funcionen correctamente
 * Tarea 5: Checkpoint - Validar funcionalidad básica
 */

// Cargar dependencias
if (typeof require !== 'undefined') {
  const CalculationEngine = require('./calculation-engine.js');
  const ReconciliationStorageManager = require('./storage-manager.js');
  global.CalculationEngine = CalculationEngine;
  global.ReconciliationStorageManager = ReconciliationStorageManager;
}

/**
 * Suite completa de pruebas de integración
 */
function runComprehensiveIntegrationTests() {
  console.log('🧪 CHECKPOINT - VALIDACIÓN DE FUNCIONALIDAD BÁSICA');
  console.log('='.repeat(60));
  console.log('Validando integración entre CalculationEngine, ServiceManager, ExpenseManager y StorageManager\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = {
    calculationEngine: { passed: 0, total: 0 },
    storageManager: { passed: 0, total: 0 },
    integration: { passed: 0, total: 0 },
    requirements: { passed: 0, total: 0 }
  };

  // Helper para ejecutar pruebas
  function test(name, testFn, category = 'integration') {
    totalTests++;
    results[category].total++;
    
    try {
      console.log(`📋 ${name}`);
      testFn();
      console.log(`✅ PASÓ: ${name}\n`);
      passedTests++;
      results[category].passed++;
      return true;
    } catch (error) {
      console.log(`❌ FALLÓ: ${name}`);
      console.log(`   Error: ${error.message}\n`);
      return false;
    }
  }

  // Helper para validar objetos
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  // 1. PRUEBAS DEL CALCULATION ENGINE
  console.log('🔧 VALIDANDO CALCULATION ENGINE');
  console.log('-'.repeat(40));

  test('CalculationEngine - Cálculo de comisión Freenow', () => {
    const engine = new CalculationEngine();
    const service = {
      platform: 'freenow',
      amount: 100,
      paymentType: 'card'
    };
    const commission = engine.calculateCommission(service);
    assert(commission === 25, `Esperado 25, obtenido ${commission}`);
  }, 'calculationEngine');

  test('CalculationEngine - Distribución 60/40', () => {
    const engine = new CalculationEngine();
    const distribution = engine.calculateDistribution(1000);
    assert(distribution.driver === 600, `Driver esperado 600, obtenido ${distribution.driver}`);
    assert(distribution.owner === 400, `Owner esperado 400, obtenido ${distribution.owner}`);
  }, 'calculationEngine');

  test('CalculationEngine - Totales diarios', () => {
    const engine = new CalculationEngine();
    const services = [
      { platform: 'freenow', amount: 100, paymentType: 'card', date: '2024-01-15' },
      { platform: 'uber', amount: 80, paymentType: 'cash', date: '2024-01-15' }
    ];
    const totals = engine.calculateDailyTotals(services);
    assert(totals['2024-01-15'].total === 180, `Total esperado 180, obtenido ${totals['2024-01-15'].total}`);
  }, 'calculationEngine');

  test('CalculationEngine - Liquidación final', () => {
    const engine = new CalculationEngine();
    const reconciliationData = {
      totalIncome: 1000,
      totalExpenses: 200,
      freenowExtras: { incentives: 50, tips: 30 },
      externalBalance: 100
    };
    const settlement = engine.calculateFinalSettlement(reconciliationData);
    assert(settlement.netIncome === 800, `Ingreso neto esperado 800, obtenido ${settlement.netIncome}`);
    assert(settlement.finalBalance === 980, `Balance final esperado 980, obtenido ${settlement.finalBalance}`);
  }, 'calculationEngine');

  // 2. PRUEBAS DEL STORAGE MANAGER
  console.log('💾 VALIDANDO STORAGE MANAGER');
  console.log('-'.repeat(40));

  test('StorageManager - Guardar y cargar servicios', () => {
    const storage = new ReconciliationStorageManager();
    const testService = {
      id: 'test-service-1',
      platform: 'freenow',
      amount: 100,
      paymentType: 'card',
      date: '2024-01-15',
      time: '10:30'
    };
    
    storage.saveService(testService);
    const services = storage.loadServices();
    const savedService = services.find(s => s.id === 'test-service-1');
    
    assert(savedService !== undefined, 'Servicio no encontrado después de guardar');
    assert(savedService.amount === 100, `Monto esperado 100, obtenido ${savedService.amount}`);
    assert(savedService.platform === 'freenow', `Plataforma esperada freenow, obtenida ${savedService.platform}`);
  }, 'storageManager');

  test('StorageManager - Guardar y cargar gastos', () => {
    const storage = new ReconciliationStorageManager();
    const testExpense = {
      id: 'test-expense-1',
      description: 'Gasolina',
      amount: 50,
      category: 'fuel',
      date: '2024-01-15'
    };
    
    storage.saveExpense(testExpense);
    const expenses = storage.loadExpenses();
    const savedExpense = expenses.find(e => e.id === 'test-expense-1');
    
    assert(savedExpense !== undefined, 'Gasto no encontrado después de guardar');
    assert(savedExpense.amount === 50, `Monto esperado 50, obtenido ${savedExpense.amount}`);
    assert(savedExpense.category === 'fuel', `Categoría esperada fuel, obtenida ${savedExpense.category}`);
  }, 'storageManager');

  test('StorageManager - Eliminar servicios', () => {
    const storage = new ReconciliationStorageManager();
    const initialCount = storage.loadServices().length;
    
    storage.deleteService('test-service-1');
    const finalCount = storage.loadServices().length;
    
    assert(finalCount === initialCount - 1, `Esperado ${initialCount - 1} servicios, obtenido ${finalCount}`);
  }, 'storageManager');

  test('StorageManager - Eliminar gastos', () => {
    const storage = new ReconciliationStorageManager();
    const initialCount = storage.loadExpenses().length;
    
    storage.deleteExpense('test-expense-1');
    const finalCount = storage.loadExpenses().length;
    
    assert(finalCount === initialCount - 1, `Esperado ${initialCount - 1} gastos, obtenido ${finalCount}`);
  }, 'storageManager');

  // 3. PRUEBAS DE INTEGRACIÓN
  console.log('🔗 VALIDANDO INTEGRACIÓN COMPLETA');
  console.log('-'.repeat(40));

  test('Integración - Flujo completo de conciliación', () => {
    const engine = new CalculationEngine();
    const storage = new ReconciliationStorageManager();
    
    // Crear datos de prueba
    const services = [
      { id: 'int-service-1', platform: 'freenow', amount: 100, paymentType: 'card', date: '2024-01-15', time: '10:00' },
      { id: 'int-service-2', platform: 'uber', amount: 80, paymentType: 'cash', date: '2024-01-15', time: '11:00' },
      { id: 'int-service-3', platform: 'freenow', amount: 120, paymentType: 'card', date: '2024-01-16', time: '09:00' }
    ];
    
    const expenses = [
      { id: 'int-expense-1', description: 'Gasolina', amount: 50, category: 'fuel', date: '2024-01-15' },
      { id: 'int-expense-2', description: 'Lavado', amount: 20, category: 'maintenance', date: '2024-01-16' }
    ];
    
    // Guardar datos
    services.forEach(service => storage.saveService(service));
    expenses.forEach(expense => storage.saveExpense(expense));
    
    // Calcular totales
    const dailyTotals = engine.calculateDailyTotals(services);
    const totalIncome = services.reduce((sum, service) => sum + service.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Validar cálculos
    assert(totalIncome === 300, `Ingreso total esperado 300, obtenido ${totalIncome}`);
    assert(totalExpenses === 70, `Gastos totales esperados 70, obtenidos ${totalExpenses}`);
    assert(dailyTotals['2024-01-15'].total === 180, `Total día 15 esperado 180, obtenido ${dailyTotals['2024-01-15'].total}`);
    assert(dailyTotals['2024-01-16'].total === 120, `Total día 16 esperado 120, obtenido ${dailyTotals['2024-01-16'].total}`);
    
    // Limpiar datos de prueba
    services.forEach(service => storage.deleteService(service.id));
    expenses.forEach(expense => storage.deleteExpense(expense.id));
  }, 'integration');

  // 4. VALIDACIÓN DE REQUERIMIENTOS
  console.log('📋 VALIDANDO REQUERIMIENTOS');
  console.log('-'.repeat(40));

  test('Requerimiento 1.1 - Registro completo de servicios', () => {
    const storage = new ReconciliationStorageManager();
    const service = {
      id: 'req-test-1',
      platform: 'freenow',
      amount: 100,
      paymentType: 'card',
      date: '2024-01-15',
      time: '10:30'
    };
    
    storage.saveService(service);
    const saved = storage.loadServices().find(s => s.id === 'req-test-1');
    
    assert(saved.platform !== undefined, 'Plataforma requerida');
    assert(saved.amount !== undefined, 'Monto requerido');
    assert(saved.paymentType !== undefined, 'Tipo de pago requerido');
    assert(saved.date !== undefined, 'Fecha requerida');
    assert(saved.time !== undefined, 'Hora requerida');
    
    storage.deleteService('req-test-1');
  }, 'requirements');

  test('Requerimiento 2.1 - Cálculo correcto de comisiones', () => {
    const engine = new CalculationEngine();
    
    // Freenow: 25%
    const freenowService = { platform: 'freenow', amount: 100, paymentType: 'card' };
    const freenowCommission = engine.calculateCommission(freenowService);
    assert(freenowCommission === 25, `Comisión Freenow esperada 25, obtenida ${freenowCommission}`);
    
    // Uber: 20%
    const uberService = { platform: 'uber', amount: 100, paymentType: 'card' };
    const uberCommission = engine.calculateCommission(uberService);
    assert(uberCommission === 20, `Comisión Uber esperada 20, obtenida ${uberCommission}`);
  }, 'requirements');

  test('Requerimiento 3.1 - Distribución 60/40', () => {
    const engine = new CalculationEngine();
    const distribution = engine.calculateDistribution(1000);
    
    assert(distribution.driver === 600, `Conductor esperado 600, obtenido ${distribution.driver}`);
    assert(distribution.owner === 400, `Propietario esperado 400, obtenido ${distribution.owner}`);
    assert(distribution.driver + distribution.owner === 1000, 'La suma debe ser igual al total');
  }, 'requirements');

  test('Requerimiento 4.1 - Registro completo de gastos', () => {
    const storage = new ReconciliationStorageManager();
    const expense = {
      id: 'req-expense-1',
      description: 'Gasolina',
      amount: 50,
      category: 'fuel',
      date: '2024-01-15'
    };
    
    storage.saveExpense(expense);
    const saved = storage.loadExpenses().find(e => e.id === 'req-expense-1');
    
    assert(saved.description !== undefined, 'Descripción requerida');
    assert(saved.amount !== undefined, 'Monto requerido');
    assert(saved.category !== undefined, 'Categoría requerida');
    assert(saved.date !== undefined, 'Fecha requerida');
    
    storage.deleteExpense('req-expense-1');
  }, 'requirements');

  // RESUMEN FINAL
  console.log('📊 RESUMEN DEL CHECKPOINT');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  console.log('📋 Desglose por categoría:');
  Object.entries(results).forEach(([category, result]) => {
    const percentage = result.total > 0 ? ((result.passed/result.total) * 100).toFixed(1) : '0.0';
    console.log(`   ${category}: ${result.passed}/${result.total} (${percentage}%)`);
  });
  
  console.log('\n🎯 ESTADO DEL CHECKPOINT:');
  if (passedTests === totalTests) {
    console.log('✅ CHECKPOINT COMPLETADO - Funcionalidad básica validada');
    console.log('🚀 Listo para continuar con la tarea 6: ReconciliationGenerator');
  } else {
    console.log('⚠️  CHECKPOINT PENDIENTE - Revisar fallos antes de continuar');
    console.log('🔧 Corregir los errores identificados antes de proceder');
  }
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests,
    results: results
  };
}

// Ejecutar si se carga directamente
if (typeof window !== 'undefined') {
  // En navegador
  window.runComprehensiveIntegrationTests = runComprehensiveIntegrationTests;
} else if (typeof module !== 'undefined') {
  // En Node.js
  module.exports = { runComprehensiveIntegrationTests };
}

// Auto-ejecutar si se carga como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runComprehensiveIntegrationTests();
}