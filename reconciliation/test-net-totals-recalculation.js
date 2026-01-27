/**
 * Pruebas específicas para cálculo de totales netos y recálculo automático
 * 
 * Tarea 6.4: Implementar cálculo de totales netos y recálculo automático
 * Requerimientos: 4.3, 4.4, 5.4, 5.5
 */

// Cargar dependencias
if (typeof require !== 'undefined') {
  const ReconciliationGenerator = require('./reconciliation-generator.js');
  const CalculationEngine = require('./calculation-engine.js');
  global.ReconciliationGenerator = ReconciliationGenerator;
  global.CalculationEngine = CalculationEngine;
}

/**
 * Suite de pruebas para totales netos y recálculo automático
 */
function runNetTotalsRecalculationTests() {
  console.log('🧪 PRUEBAS DE TOTALES NETOS Y RECÁLCULO AUTOMÁTICO');
  console.log('='.repeat(60));
  console.log('Validando cálculo de totales netos y recálculo tras cambios\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = {
    netTotals: { passed: 0, total: 0 },
    recalculation: { passed: 0, total: 0 },
    validation: { passed: 0, total: 0 },
    edgeCases: { passed: 0, total: 0 }
  };

  // Helper para ejecutar pruebas
  function test(name, testFn, category = 'netTotals') {
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

  // Crear instancias para pruebas
  const engine = new CalculationEngine();
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
      amount: 100,
      paymentType: 'card',
      platform: 'freenow'
    },
    {
      id: 'service-2',
      date: '2024-01-15',
      amount: 80,
      paymentType: 'cash',
      platform: 'other'
    }
  ];

  const testExpenses = [
    {
      id: 'expense-1',
      date: '2024-01-15',
      description: 'Gasolina',
      amount: 30,
      category: 'fuel'
    }
  ];

  const testPeriod = {
    startDate: '2024-01-15',
    endDate: '2024-01-15'
  };

  // 1. PRUEBAS DE CÁLCULO DE TOTALES NETOS
  console.log('💰 VALIDANDO CÁLCULO DE TOTALES NETOS');
  console.log('-'.repeat(40));

  test('Cálculo básico de totales netos', () => {
    const netTotals = generator.calculateNetTotals(1000, 200);
    
    assert(netTotals.grossIncome === 1000, `Ingreso bruto esperado 1000, obtenido ${netTotals.grossIncome}`);
    assert(netTotals.totalExpenses === 200, `Gastos esperados 200, obtenidos ${netTotals.totalExpenses}`);
    assert(netTotals.netIncome === 800, `Ingreso neto esperado 800, obtenido ${netTotals.netIncome}`);
    assert(netTotals.distribution.driver === 320, `Distribución conductor esperada 320 (40%), obtenida ${netTotals.distribution.driver}`);
    assert(netTotals.distribution.owner === 480, `Distribución propietario esperada 480 (60%), obtenida ${netTotals.distribution.owner}`);
  }, 'netTotals');

  test('Cálculo de margen de beneficio', () => {
    const netTotals = generator.calculateNetTotals(1000, 200);
    
    assert(netTotals.profitMargin === 80, `Margen esperado 80%, obtenido ${netTotals.profitMargin}%`);
  }, 'netTotals');

  test('Manejo de ingresos cero', () => {
    const netTotals = generator.calculateNetTotals(0, 0);
    
    assert(netTotals.grossIncome === 0, 'Ingreso bruto debe ser 0');
    assert(netTotals.netIncome === 0, 'Ingreso neto debe ser 0');
    assert(netTotals.profitMargin === 0, 'Margen debe ser 0 cuando no hay ingresos');
  }, 'netTotals');

  test('Validación de entrada para totales netos', () => {
    try {
      generator.calculateNetTotals(-100, 50);
      assert(false, 'Debe fallar con ingresos negativos');
    } catch (error) {
      assert(error.message.includes('negativos'), 'Error debe mencionar valores negativos');
    }

    try {
      generator.calculateNetTotals(100, -50);
      assert(false, 'Debe fallar con gastos negativos');
    } catch (error) {
      assert(error.message.includes('negativos'), 'Error debe mencionar valores negativos');
    }

    try {
      generator.calculateNetTotals('invalid', 50);
      assert(false, 'Debe fallar con tipo de dato inválido');
    } catch (error) {
      assert(error.message.includes('números'), 'Error debe mencionar tipo de dato');
    }
  }, 'netTotals');

  // 2. PRUEBAS DE RECÁLCULO AUTOMÁTICO
  console.log('🔄 VALIDANDO RECÁLCULO AUTOMÁTICO');
  console.log('-'.repeat(40));

  test('Recálculo tras cambios en servicios', () => {
    // Generar conciliación inicial
    const originalReconciliation = generator.generateReconciliation(testPeriod, testServices, testExpenses);
    const originalTotal = originalReconciliation.summary.totalServices;
    
    // Agregar nuevo servicio
    const updatedServices = [
      ...testServices,
      {
        id: 'service-3',
        date: '2024-01-15',
        amount: 50,
        paymentType: 'cash',
        platform: 'other'
      }
    ];
    
    // Recalcular
    const recalculated = generator.recalculateAfterChanges(originalReconciliation, updatedServices, testExpenses);
    
    assert(recalculated.summary.totalServices === originalTotal + 50, 
      `Total esperado ${originalTotal + 50}, obtenido ${recalculated.summary.totalServices}`);
    assert(recalculated.id === originalReconciliation.id, 'ID debe mantenerse igual');
    assert(recalculated.createdAt === originalReconciliation.createdAt, 'Fecha creación debe mantenerse');
    assert(recalculated.updatedAt !== originalReconciliation.updatedAt, 'Fecha actualización debe cambiar');
  }, 'recalculation');

  test('Recálculo tras cambios en gastos', () => {
    // Generar conciliación inicial
    const originalReconciliation = generator.generateReconciliation(testPeriod, testServices, testExpenses);
    const originalExpenses = originalReconciliation.summary.totalExpenses;
    
    // Agregar nuevo gasto
    const updatedExpenses = [
      ...testExpenses,
      {
        id: 'expense-2',
        date: '2024-01-15',
        description: 'Peaje',
        amount: 20,
        category: 'tolls'
      }
    ];
    
    // Recalcular
    const recalculated = generator.recalculateAfterChanges(originalReconciliation, testServices, updatedExpenses);
    
    assert(recalculated.summary.totalExpenses === originalExpenses + 20, 
      `Gastos esperados ${originalExpenses + 20}, obtenidos ${recalculated.summary.totalExpenses}`);
    assert(recalculated.summary.netIncome === originalReconciliation.summary.netIncome - 20, 
      'Ingreso neto debe reducirse por el nuevo gasto');
  }, 'recalculation');

  test('Recálculo tras eliminación de servicios', () => {
    // Generar conciliación inicial
    const originalReconciliation = generator.generateReconciliation(testPeriod, testServices, testExpenses);
    
    // Eliminar un servicio
    const reducedServices = testServices.slice(0, 1); // Solo el primer servicio
    
    // Recalcular
    const recalculated = generator.recalculateAfterChanges(originalReconciliation, reducedServices, testExpenses);
    
    assert(recalculated.summary.totalServices === 100, 
      `Total esperado 100, obtenido ${recalculated.summary.totalServices}`);
    assert(recalculated.services.length === 1, 'Debe haber solo 1 servicio');
  }, 'recalculation');

  test('Preservación de desglose de efectivo en recálculo', () => {
    // Generar conciliación inicial
    const originalReconciliation = generator.generateReconciliation(testPeriod, testServices, testExpenses);
    
    // Simular desglose de efectivo existente
    originalReconciliation.cashBreakdown = {
      bills: { fifty: 1, twenty: 2, ten: 1, five: 0, two: 0, one: 0, cents: 0 },
      total: 90,
      difference: 10
    };
    
    // Recalcular con cambios menores
    const recalculated = generator.recalculateAfterChanges(originalReconciliation, testServices, testExpenses);
    
    assert(recalculated.cashBreakdown.bills.fifty === 1, 'Desglose de billetes debe preservarse');
    assert(recalculated.cashBreakdown.total === 90, 'Total de billetes debe preservarse');
    // La diferencia se recalcula automáticamente
    assert(typeof recalculated.cashBreakdown.difference === 'number', 'Diferencia debe recalcularse');
  }, 'recalculation');

  // 3. PRUEBAS DE VALIDACIÓN DE INCONSISTENCIAS
  console.log('🔍 VALIDANDO DETECCIÓN DE INCONSISTENCIAS');
  console.log('-'.repeat(40));

  test('Detección de inconsistencias en totales', () => {
    const reconciliation = generator.generateReconciliation(testPeriod, testServices, testExpenses);
    
    // Simular inconsistencia manual
    reconciliation.summary.totalServices = 999; // Valor incorrecto
    
    const validation = generator.detectInconsistencies(reconciliation);
    
    assert(validation.hasInconsistencies === true, 'Debe detectar inconsistencias');
    assert(validation.inconsistencies.length > 0, 'Debe haber al menos una inconsistencia');
    assert(validation.summary.high > 0, 'Debe haber inconsistencias de alta severidad');
  }, 'validation');

  test('Detección de diferencias de efectivo significativas', () => {
    const reconciliation = generator.generateReconciliation(testPeriod, testServices, testExpenses);
    
    // Simular diferencia significativa de efectivo
    reconciliation.cashBreakdown = {
      bills: { fifty: 0, twenty: 0, ten: 0, five: 0, two: 0, one: 0, cents: 0 },
      total: 0,
      difference: -50 // Diferencia significativa
    };
    
    const validation = generator.detectInconsistencies(reconciliation);
    
    const cashInconsistency = validation.inconsistencies.find(i => i.type === 'cash_difference');
    assert(cashInconsistency !== undefined, 'Debe detectar diferencia de efectivo');
    assert(cashInconsistency.severity === 'medium', 'Diferencia de efectivo debe ser severidad media');
  }, 'validation');

  test('Validación sin inconsistencias', () => {
    const reconciliation = generator.generateReconciliation(testPeriod, testServices, testExpenses);
    
    const validation = generator.detectInconsistencies(reconciliation);
    
    assert(validation.hasInconsistencies === false, 'No debe haber inconsistencias en datos válidos');
    assert(validation.inconsistencies.length === 0, 'Lista de inconsistencias debe estar vacía');
    assert(validation.summary.total === 0, 'Total de inconsistencias debe ser 0');
  }, 'validation');

  // 4. PRUEBAS DE CASOS BORDE
  console.log('🎯 VALIDANDO CASOS BORDE');
  console.log('-'.repeat(40));

  test('Conciliación completamente vacía', () => {
    const emptyReconciliation = generator.createEmptyReconciliation(testPeriod);
    
    assert(emptyReconciliation.services.length === 0, 'No debe haber servicios');
    assert(emptyReconciliation.expenses.length === 0, 'No debe haber gastos');
    assert(emptyReconciliation.summary.totalServices === 0, 'Total servicios debe ser 0');
    assert(emptyReconciliation.summary.netIncome === 0, 'Ingreso neto debe ser 0');
    assert(emptyReconciliation.dailyTotals.length === 0, 'No debe haber totales diarios');
  }, 'edgeCases');

  test('Actualización de desglose de efectivo', () => {
    const reconciliation = generator.generateReconciliation(testPeriod, testServices, testExpenses);
    
    const newCashBreakdown = {
      bills: { fifty: 1, twenty: 1, ten: 1, five: 1, two: 1, one: 1, cents: 50 }
    };
    
    const updated = generator.updateCashBreakdown(reconciliation, newCashBreakdown);
    
    const expectedTotal = 50 + 20 + 10 + 5 + 2 + 1 + 0.5; // 88.5
    assert(Math.abs(updated.cashBreakdown.total - expectedTotal) < 0.01, 
      `Total esperado ${expectedTotal}, obtenido ${updated.cashBreakdown.total}`);
    assert(typeof updated.cashBreakdown.difference === 'number', 'Diferencia debe calcularse');
  }, 'edgeCases');

  test('Cálculo de total de billetes', () => {
    const bills = { fifty: 2, twenty: 3, ten: 1, five: 2, two: 0, one: 5, cents: 150 };
    const total = generator.calculateBillsTotal(bills);
    
    const expected = (2 * 50) + (3 * 20) + (1 * 10) + (2 * 5) + (0 * 2) + (5 * 1) + (150 * 0.01);
    assert(Math.abs(total - expected) < 0.01, `Total esperado ${expected}, obtenido ${total}`);
  }, 'edgeCases');

  test('Manejo de errores en recálculo', () => {
    try {
      const invalidReconciliation = { period: null };
      generator.recalculateAfterChanges(invalidReconciliation, [], []);
      assert(false, 'Debe fallar con datos inválidos');
    } catch (error) {
      assert(error.message.includes('recalcular'), 'Error debe mencionar recálculo');
    }
  }, 'edgeCases');

  // RESUMEN FINAL
  console.log('📊 RESUMEN DE PRUEBAS - TOTALES NETOS Y RECÁLCULO');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  console.log('📋 Desglose por categoría:');
  Object.entries(results).forEach(([category, result]) => {
    const percentage = result.total > 0 ? ((result.passed/result.total) * 100).toFixed(1) : '0.0';
    console.log(`   ${category}: ${result.passed}/${result.total} (${percentage}%)`);
  });
  
  console.log('\n🎯 ESTADO DE LA TAREA 6.4:');
  if (passedTests === totalTests) {
    console.log('✅ TAREA 6.4 COMPLETADA');
    console.log('🚀 Cálculo de totales netos y recálculo automático validados');
    console.log('📋 Requerimientos 4.3, 4.4, 5.4, 5.5 implementados correctamente');
  } else {
    console.log('⚠️  TAREA 6.4 PENDIENTE');
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
  window.runNetTotalsRecalculationTests = runNetTotalsRecalculationTests;
} else if (typeof module !== 'undefined') {
  // En Node.js
  module.exports = { runNetTotalsRecalculationTests };
}

// Auto-ejecutar si se carga como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runNetTotalsRecalculationTests();
}