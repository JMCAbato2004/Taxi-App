/**
 * Pruebas para ReconciliationGenerator
 * 
 * Valida la funcionalidad de generación de conciliaciones, agrupación por día,
 * cálculo de totales y manejo de períodos.
 * 
 * Tarea 6.1: Crear ReconciliationGenerator con lógica principal
 */

// Cargar dependencias
if (typeof require !== 'undefined') {
  const ReconciliationGenerator = require('./reconciliation-generator.js');
  const CalculationEngine = require('./calculation-engine.js');
  global.ReconciliationGenerator = ReconciliationGenerator;
  global.CalculationEngine = CalculationEngine;
}

/**
 * Suite de pruebas para ReconciliationGenerator
 */
function runReconciliationGeneratorTests() {
  console.log('🧪 PRUEBAS DEL RECONCILIATION GENERATOR');
  console.log('='.repeat(50));
  console.log('Validando generación de conciliaciones, agrupación por día y cálculo de totales\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = {
    generation: { passed: 0, total: 0 },
    grouping: { passed: 0, total: 0 },
    calculation: { passed: 0, total: 0 },
    validation: { passed: 0, total: 0 }
  };

  // Helper para ejecutar pruebas
  function test(name, testFn, category = 'generation') {
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

  // Crear instancias para pruebas (sin StorageManager para evitar problemas con localStorage en Node.js)
  const engine = new CalculationEngine();
  
  // Mock simple del StorageManager para las pruebas
  const mockStorage = {
    loadServices: () => [],
    loadExpenses: () => []
  };
  
  const generator = new ReconciliationGenerator(engine, mockStorage);

  // Datos de prueba
  const testServices = [
    {
      id: 'service-1',
      date: '2024-01-15',
      time: '10:00',
      amount: 100,
      paymentType: 'card',
      platform: 'freenow',
      isArticulated: false
    },
    {
      id: 'service-2',
      date: '2024-01-15',
      time: '11:00',
      amount: 80,
      paymentType: 'cash',
      platform: 'other',
      isArticulated: true
    },
    {
      id: 'service-3',
      date: '2024-01-16',
      time: '09:00',
      amount: 120,
      paymentType: 'app',
      platform: 'freenow',
      isArticulated: false
    }
  ];

  const testExpenses = [
    {
      id: 'expense-1',
      date: '2024-01-15',
      description: 'Gasolina',
      amount: 50,
      category: 'fuel'
    },
    {
      id: 'expense-2',
      date: '2024-01-16',
      description: 'Lavado',
      amount: 20,
      category: 'maintenance'
    }
  ];

  const testPeriod = {
    startDate: '2024-01-15',
    endDate: '2024-01-16'
  };

  // 1. PRUEBAS DE GENERACIÓN BÁSICA
  console.log('🔧 VALIDANDO GENERACIÓN BÁSICA');
  console.log('-'.repeat(40));

  test('Generación de conciliación básica', () => {
    const reconciliation = generator.generateReconciliation(testPeriod, testServices, testExpenses);
    
    assert(reconciliation.id !== undefined, 'ID de conciliación requerido');
    assert(reconciliation.period !== undefined, 'Período requerido');
    assert(Array.isArray(reconciliation.services), 'Servicios deben ser array');
    assert(Array.isArray(reconciliation.expenses), 'Gastos deben ser array');
    assert(Array.isArray(reconciliation.dailyTotals), 'Totales diarios deben ser array');
    assert(reconciliation.summary !== undefined, 'Resumen requerido');
  }, 'generation');

  test('Filtrado por período', () => {
    const allServices = [
      ...testServices,
      { id: 'out-of-range', date: '2024-01-10', amount: 50, paymentType: 'cash' }
    ];
    
    const filtered = generator.filterByPeriod(allServices, testPeriod);
    
    assert(filtered.length === 3, `Esperados 3 servicios, obtenidos ${filtered.length}`);
    assert(!filtered.find(s => s.id === 'out-of-range'), 'Servicio fuera de rango no debe incluirse');
  }, 'generation');

  test('Manejo de período vacío', () => {
    const emptyPeriod = {
      startDate: '2024-02-01',
      endDate: '2024-02-02'
    };
    
    const reconciliation = generator.generateReconciliation(emptyPeriod, testServices, testExpenses);
    
    assert(reconciliation.services.length === 0, 'No debe haber servicios en período vacío');
    assert(reconciliation.expenses.length === 0, 'No debe haber gastos en período vacío');
    assert(reconciliation.summary.totalServices === 0, 'Total de servicios debe ser 0');
  }, 'generation');

  // 2. PRUEBAS DE AGRUPACIÓN
  console.log('📅 VALIDANDO AGRUPACIÓN POR DÍA');
  console.log('-'.repeat(40));

  test('Agrupación de servicios por día', () => {
    const grouped = generator.groupServicesByDay(testServices);
    
    assert(grouped['2024-01-15'] !== undefined, 'Debe existir grupo para 2024-01-15');
    assert(grouped['2024-01-16'] !== undefined, 'Debe existir grupo para 2024-01-16');
    assert(grouped['2024-01-15'].length === 2, 'Debe haber 2 servicios el día 15');
    assert(grouped['2024-01-16'].length === 1, 'Debe haber 1 servicio el día 16');
  }, 'grouping');

  test('Agrupación de gastos por día', () => {
    const grouped = generator.groupExpensesByDay(testExpenses);
    
    assert(grouped['2024-01-15'] !== undefined, 'Debe existir grupo para 2024-01-15');
    assert(grouped['2024-01-16'] !== undefined, 'Debe existir grupo para 2024-01-16');
    assert(grouped['2024-01-15'].length === 1, 'Debe haber 1 gasto el día 15');
    assert(grouped['2024-01-16'].length === 1, 'Debe haber 1 gasto el día 16');
  }, 'grouping');

  test('Formateo de claves de fecha', () => {
    const dateString = '2024-01-15';
    const dateObject = new Date('2024-01-15');
    
    const key1 = generator.formatDateKey(dateString);
    const key2 = generator.formatDateKey(dateObject);
    
    assert(key1 === '2024-01-15', `Esperado 2024-01-15, obtenido ${key1}`);
    assert(key2 === '2024-01-15', `Esperado 2024-01-15, obtenido ${key2}`);
  }, 'grouping');

  // 3. PRUEBAS DE CÁLCULOS
  console.log('🧮 VALIDANDO CÁLCULOS DE TOTALES');
  console.log('-'.repeat(40));

  test('Cálculo de totales diarios', () => {
    const servicesByDay = generator.groupServicesByDay(testServices);
    const dailyTotals = generator.calculateDailyTotals(servicesByDay, testExpenses);
    
    assert(dailyTotals.length === 2, `Esperados 2 días, obtenidos ${dailyTotals.length}`);
    
    const day15 = dailyTotals.find(d => d.date === '2024-01-15');
    const day16 = dailyTotals.find(d => d.date === '2024-01-16');
    
    assert(day15 !== undefined, 'Debe existir total para día 15');
    assert(day16 !== undefined, 'Debe existir total para día 16');
    
    assert(day15.serviceStart === 2, `Esperados 2 servicios día 15, obtenidos ${day15.serviceStart}`);
    assert(day15.totalService === 180, `Esperado total 180 día 15, obtenido ${day15.totalService}`);
    assert(day15.expenses === 50, `Esperados gastos 50 día 15, obtenidos ${day15.expenses}`);
  }, 'calculation');

  test('Separación por tipo de pago', () => {
    const servicesByDay = generator.groupServicesByDay(testServices);
    const dailyTotals = generator.calculateDailyTotals(servicesByDay, testExpenses);
    
    const day15 = dailyTotals.find(d => d.date === '2024-01-15');
    
    assert(day15.cardPayment === 100, `Esperado pago tarjeta 100, obtenido ${day15.cardPayment}`);
    assert(day15.cashPayment === 80, `Esperado pago efectivo 80, obtenido ${day15.cashPayment}`);
    assert(day15.appPayment === 0, `Esperado pago app 0, obtenido ${day15.appPayment}`);
    assert(day15.articulated === 80, `Esperado articulados 80, obtenido ${day15.articulated}`);
  }, 'calculation');

  test('Cálculo de resumen del período', () => {
    const servicesByDay = generator.groupServicesByDay(testServices);
    const dailyTotals = generator.calculateDailyTotals(servicesByDay, testExpenses);
    const summary = generator.calculatePeriodSummary(dailyTotals);
    
    assert(summary.totalServices === 300, `Esperado total servicios 300, obtenido ${summary.totalServices}`);
    assert(summary.totalExpenses === 70, `Esperado total gastos 70, obtenido ${summary.totalExpenses}`);
    assert(summary.totalCard === 100, `Esperado total tarjeta 100, obtenido ${summary.totalCard}`);
    assert(summary.totalCash === 80, `Esperado total efectivo 80, obtenido ${summary.totalCash}`);
    assert(summary.totalApp === 120, `Esperado total app 120, obtenido ${summary.totalApp}`);
  }, 'calculation');

  test('Cálculo de comisiones Freenow', () => {
    const servicesByDay = generator.groupServicesByDay(testServices);
    const dailyTotals = generator.calculateDailyTotals(servicesByDay, testExpenses);
    
    const day15 = dailyTotals.find(d => d.date === '2024-01-15');
    const day16 = dailyTotals.find(d => d.date === '2024-01-16');
    
    // Día 15: 1 servicio Freenow de 100€
    assert(day15.freenowTotal === 100, `Esperado Freenow total 100, obtenido ${day15.freenowTotal}`);
    assert(day15.freenowCommission === 15, `Esperada comisión 15, obtenida ${day15.freenowCommission}`);
    assert(day15.freenowNet === 85, `Esperado Freenow neto 85, obtenido ${day15.freenowNet}`);
    
    // Día 16: 1 servicio Freenow de 120€
    assert(day16.freenowTotal === 120, `Esperado Freenow total 120, obtenido ${day16.freenowTotal}`);
    assert(day16.freenowCommission === 18, `Esperada comisión 18, obtenida ${day16.freenowCommission}`);
    assert(day16.freenowNet === 102, `Esperado Freenow neto 102, obtenido ${day16.freenowNet}`);
  }, 'calculation');

  // 4. PRUEBAS DE VALIDACIÓN
  console.log('✅ VALIDANDO ENTRADA DE DATOS');
  console.log('-'.repeat(40));

  test('Validación de período válido', () => {
    const validation = generator.validateReconciliationData(testPeriod, testServices, testExpenses);
    
    assert(validation.valid === true, 'Datos válidos deben pasar validación');
    assert(validation.errors.length === 0, 'No debe haber errores en datos válidos');
  }, 'validation');

  test('Validación de período inválido', () => {
    const invalidPeriod = {
      startDate: '2024-01-20',
      endDate: '2024-01-15' // Fecha fin anterior a inicio
    };
    
    const validation = generator.validateReconciliationData(invalidPeriod, [], []);
    
    assert(validation.valid === false, 'Período inválido debe fallar validación');
    assert(validation.errors.length > 0, 'Debe haber errores en período inválido');
  }, 'validation');

  test('Validación de servicios inválidos', () => {
    const invalidServices = [
      { date: '2024-01-15', amount: -100, paymentType: 'card' }, // Monto negativo
      { date: '2024-01-15', amount: 50, paymentType: 'invalid' }, // Tipo pago inválido
      { amount: 75, paymentType: 'cash' } // Sin fecha
    ];
    
    const validation = generator.validateReconciliationData(testPeriod, invalidServices, []);
    
    assert(validation.valid === false, 'Servicios inválidos deben fallar validación');
    assert(validation.errors.length >= 3, 'Debe haber al menos 3 errores');
  }, 'validation');

  test('Validación de gastos inválidos', () => {
    const invalidExpenses = [
      { date: '2024-01-15', amount: -50, description: 'Gasto negativo' }, // Monto negativo
      { date: '2024-01-15', amount: 30, description: '' }, // Descripción vacía
      { amount: 40, description: 'Sin fecha' } // Sin fecha
    ];
    
    const validation = generator.validateReconciliationData(testPeriod, [], invalidExpenses);
    
    assert(validation.valid === false, 'Gastos inválidos deben fallar validación');
    assert(validation.errors.length >= 3, 'Debe haber al menos 3 errores');
  }, 'validation');

  test('Generación de ID único', () => {
    const id1 = generator.generateReconciliationId(testPeriod);
    const id2 = generator.generateReconciliationId(testPeriod);
    
    assert(id1 !== id2, 'Los IDs deben ser únicos');
    assert(id1.includes('20240115'), 'ID debe contener fecha de inicio');
    assert(id1.includes('20240116'), 'ID debe contener fecha de fin');
  }, 'validation');

  // RESUMEN FINAL
  console.log('📊 RESUMEN DE PRUEBAS - RECONCILIATION GENERATOR');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  console.log('📋 Desglose por categoría:');
  Object.entries(results).forEach(([category, result]) => {
    const percentage = result.total > 0 ? ((result.passed/result.total) * 100).toFixed(1) : '0.0';
    console.log(`   ${category}: ${result.passed}/${result.total} (${percentage}%)`);
  });
  
  console.log('\n🎯 ESTADO DE LA IMPLEMENTACIÓN:');
  if (passedTests === totalTests) {
    console.log('✅ RECONCILIATION GENERATOR COMPLETADO');
    console.log('🚀 Funcionalidad de generación de conciliaciones validada');
  } else {
    console.log('⚠️  RECONCILIATION GENERATOR PENDIENTE');
    console.log('🔧 Revisar fallos antes de continuar');
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
  window.runReconciliationGeneratorTests = runReconciliationGeneratorTests;
} else if (typeof module !== 'undefined') {
  // En Node.js
  module.exports = { runReconciliationGeneratorTests };
}

// Auto-ejecutar si se carga como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runReconciliationGeneratorTests();
}