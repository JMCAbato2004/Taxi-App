/**
 * Checkpoint de Validación de Lógica de Negocio Completa
 * 
 * Valida que todos los componentes del sistema funcionen correctamente
 * en conjunto y que la lógica de negocio sea consistente.
 * 
 * Tarea 10: Checkpoint - Validar lógica de negocio completa
 */

// Cargar dependencias de clases (no componentes React)
if (typeof require !== 'undefined') {
  const CalculationEngine = require('./calculation-engine.js');
  const ReconciliationGenerator = require('./reconciliation-generator.js');
  const CashCalculator = require('./cash-calculator.js');
  const StorageManager = require('./storage-manager.js');
  const ValidationSystem = require('./validation-system.js');
  
  global.CalculationEngine = CalculationEngine;
  global.ReconciliationGenerator = ReconciliationGenerator;
  global.CashCalculator = CashCalculator;
  global.StorageManager = StorageManager;
  global.ValidationSystem = ValidationSystem;
}

/**
 * Suite de pruebas para validación completa de lógica de negocio
 */
function runBusinessLogicCheckpoint() {
  console.log('🏁 CHECKPOINT DE LÓGICA DE NEGOCIO COMPLETA');
  console.log('='.repeat(60));
  console.log('Validando integración y consistencia de todos los componentes\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = {
    integration: { passed: 0, total: 0 },
    calculations: { passed: 0, total: 0 },
    persistence: { passed: 0, total: 0 },
    validation: { passed: 0, total: 0 },
    endToEnd: { passed: 0, total: 0 }
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

  // Helper para comparar números con tolerancia
  function assertClose(actual, expected, tolerance = 0.01, message = '') {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
      throw new Error(`${message} - Esperado: ${expected}, Actual: ${actual}, Diferencia: ${diff}`);
    }
  }

  // Crear instancias de los componentes de lógica de negocio
  const calculationEngine = new CalculationEngine();
  const reconciliationGenerator = new ReconciliationGenerator();
  const cashCalculator = new CashCalculator();
  const storageManager = new StorageManager();
  const validator = new ValidationSystem();

  // 1. PRUEBAS DE INTEGRACIÓN BÁSICA
  console.log('🔗 VALIDANDO INTEGRACIÓN BÁSICA');
  console.log('-'.repeat(40));

  test('Inicialización de componentes de lógica de negocio', () => {
    assert(calculationEngine !== undefined, 'CalculationEngine debe inicializarse');
    assert(reconciliationGenerator !== undefined, 'ReconciliationGenerator debe inicializarse');
    assert(cashCalculator !== undefined, 'CashCalculator debe inicializarse');
    assert(storageManager !== undefined, 'StorageManager debe inicializarse');
    assert(validator !== undefined, 'ValidationSystem debe inicializarse');
  }, 'integration');

  test('Flujo completo: Servicio → Cálculo → Conciliación', () => {
    // Crear un servicio de prueba
    const service = {
      id: 'test-service-1',
      date: '2024-01-15',
      time: '10:30',
      totalAmount: 100,
      paymentType: 'app',
      platform: 'freenow',
      isArticulated: false
    };

    // Validar el servicio
    const serviceValidation = validator.validateService(service);
    assert(serviceValidation.valid, 'Servicio debe ser válido');

    // Calcular comisión
    const commission = calculationEngine.calculateCommission(service.totalAmount, service.platform);
    assert(commission > 0, 'Comisión debe ser positiva');
    assert(commission < service.totalAmount, 'Comisión debe ser menor al total');

    // Calcular distribución
    const netAmount = service.totalAmount - commission;
    const distribution = calculationEngine.calculateDistribution(netAmount, 60, 40);
    
    assertClose(distribution.owner + distribution.driver, netAmount, 0.01, 'Distribución debe sumar al neto');
    assertClose(distribution.owner / netAmount, 0.6, 0.01, 'Patrón debe recibir 60%');
    assertClose(distribution.driver / netAmount, 0.4, 0.01, 'Taxista debe recibir 40%');
  }, 'integration');

  test('Flujo completo: Gasto → Validación → Almacenamiento', () => {
    // Crear un gasto de prueba
    const expense = {
      id: 'test-expense-1',
      date: '2024-01-15',
      amount: 50,
      description: 'Gasolina para el día',
      category: 'fuel'
    };

    // Validar el gasto
    const expenseValidation = validator.validateExpense(expense);
    assert(expenseValidation.valid, 'Gasto debe ser válido');

    // Simular almacenamiento
    const expenses = [expense];
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    assert(totalExpenses === 50, 'Total de gastos debe ser correcto');
  }, 'integration');

  // 2. PRUEBAS DE CÁLCULOS COMPLEJOS
  console.log('🧮 VALIDANDO CÁLCULOS COMPLEJOS');
  console.log('-'.repeat(40));

  test('Cálculo de conciliación completa con múltiples servicios', () => {
    const services = [
      { id: 's1', date: '2024-01-15', totalAmount: 100, paymentType: 'app', platform: 'freenow', isArticulated: false },
      { id: 's2', date: '2024-01-15', totalAmount: 80, paymentType: 'card', platform: 'other', isArticulated: true },
      { id: 's3', date: '2024-01-15', totalAmount: 60, paymentType: 'cash', platform: 'other', isArticulated: false }
    ];

    const expenses = [
      { id: 'e1', date: '2024-01-15', amount: 30, description: 'Gasolina', category: 'fuel' },
      { id: 'e2', date: '2024-01-15', amount: 20, description: 'Peaje', category: 'tolls' }
    ];

    // Generar conciliación
    const period = { startDate: '2024-01-15', endDate: '2024-01-15' };
    const reconciliation = reconciliationGenerator.generateReconciliation(period, services, expenses);

    // Validar totales
    const expectedServiceTotal = services.reduce((sum, s) => sum + s.totalAmount, 0);
    const expectedExpenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    assertClose(reconciliation.summary.totalServices, expectedServiceTotal, 0.01, 'Total de servicios');
    assertClose(reconciliation.summary.totalExpenses, expectedExpenseTotal, 0.01, 'Total de gastos');
    
    const expectedNetIncome = expectedServiceTotal - expectedExpenseTotal;
    assertClose(reconciliation.summary.netIncome, expectedNetIncome, 0.01, 'Ingreso neto');

    // Validar distribución
    const expectedOwnerAmount = expectedNetIncome * 0.6;
    const expectedDriverAmount = expectedNetIncome * 0.4;
    
    assertClose(reconciliation.summary.distribution60, expectedOwnerAmount, 0.01, 'Distribución patrón');
    assertClose(reconciliation.summary.distribution40, expectedDriverAmount, 0.01, 'Distribución taxista');
  }, 'calculations');

  test('Cálculo de efectivo con desglose completo', () => {
    const cashBreakdown = {
      bills: {
        fifty: 2,    // 100€
        twenty: 3,   // 60€
        ten: 1,      // 10€
        five: 2      // 10€
      },
      coins: {
        two: 5,      // 10€
        one: 15      // 15€
      }
    };

    const result = cashCalculator.calculateTotal(cashBreakdown);
    const expectedTotal = 100 + 60 + 10 + 10 + 10 + 15; // 205€
    
    assertClose(result.total, expectedTotal, 0.01, 'Total de efectivo calculado');

    // Validar desglose
    const validation = validator.validateCashBreakdown(result);
    assert(validation.valid, 'Desglose de efectivo debe ser válido');
  }, 'calculations');

  test('Cálculo de comisiones Freenow con extras', () => {
    const freenowService = {
      totalAmount: 100,
      platform: 'freenow',
      incentives: 5,
      tips: 3
    };

    const commission = calculationEngine.calculateCommission(freenowService.totalAmount, freenowService.platform);
    const netFreenow = freenowService.totalAmount - commission;
    const extras = (freenowService.incentives || 0) + (freenowService.tips || 0);
    const finalFreenowAmount = netFreenow + extras;

    assert(commission > 0, 'Comisión Freenow debe ser positiva');
    assert(netFreenow < freenowService.totalAmount, 'Neto debe ser menor al total');
    assert(finalFreenowAmount > netFreenow, 'Extras deben incrementar el total');
    assertClose(extras, 8, 0.01, 'Extras deben sumar correctamente');
  }, 'calculations');

  // 3. PRUEBAS DE PERSISTENCIA Y RECUPERACIÓN
  console.log('💾 VALIDANDO PERSISTENCIA Y RECUPERACIÓN');
  console.log('-'.repeat(40));

  test('Guardado y recuperación de servicios', () => {
    const testServices = [
      { id: 'persist-s1', date: '2024-01-15', totalAmount: 100, paymentType: 'card', platform: 'freenow' },
      { id: 'persist-s2', date: '2024-01-15', totalAmount: 80, paymentType: 'cash', platform: 'other' }
    ];

    // Simular guardado individual
    testServices.forEach(service => {
      storageManager.saveService(service);
    });
    
    // Simular recuperación
    const retrievedServices = storageManager.getServices();
    
    assert(Array.isArray(retrievedServices), 'Servicios recuperados deben ser array');
    assert(retrievedServices.length >= testServices.length, 'Debe recuperar al menos los servicios guardados');
    
    // Verificar que los servicios de prueba estén presentes
    testServices.forEach(testService => {
      const found = retrievedServices.find(s => s.id === testService.id);
      assert(found !== undefined, `Servicio ${testService.id} debe estar presente`);
      if (found) {
        assertClose(found.totalAmount, testService.totalAmount, 0.01, `Monto del servicio ${testService.id}`);
      }
    });
  }, 'persistence');

  test('Guardado y recuperación de gastos', () => {
    const testExpenses = [
      { id: 'persist-e1', date: '2024-01-15', amount: 50, description: 'Gasolina', category: 'fuel' },
      { id: 'persist-e2', date: '2024-01-15', amount: 25, description: 'Peaje', category: 'tolls' }
    ];

    // Simular guardado individual
    testExpenses.forEach(expense => {
      storageManager.saveExpense(expense);
    });
    
    // Simular recuperación
    const retrievedExpenses = storageManager.getExpenses();
    
    assert(Array.isArray(retrievedExpenses), 'Gastos recuperados deben ser array');
    assert(retrievedExpenses.length >= testExpenses.length, 'Debe recuperar al menos los gastos guardados');
    
    // Verificar que los gastos de prueba estén presentes
    testExpenses.forEach(testExpense => {
      const found = retrievedExpenses.find(e => e.id === testExpense.id);
      assert(found !== undefined, `Gasto ${testExpense.id} debe estar presente`);
      if (found) {
        assertClose(found.amount, testExpense.amount, 0.01, `Monto del gasto ${testExpense.id}`);
      }
    });
  }, 'persistence');

  test('Integridad de datos tras múltiples operaciones', () => {
    // Crear datos de prueba
    const services = [
      { id: 'integrity-s1', date: '2024-01-15', totalAmount: 100, paymentType: 'card', platform: 'freenow' }
    ];
    const expenses = [
      { id: 'integrity-e1', date: '2024-01-15', amount: 30, description: 'Gasolina', category: 'fuel' }
    ];

    // Guardar datos
    services.forEach(service => storageManager.saveService(service));
    expenses.forEach(expense => storageManager.saveExpense(expense));

    // Generar conciliación
    const period = { startDate: '2024-01-15', endDate: '2024-01-15' };
    const reconciliation = reconciliationGenerator.generateReconciliation(period, services, expenses);
    
    // Guardar conciliación
    storageManager.saveReconciliation(reconciliation);

    // Verificar integridad
    const systemData = {
      services: storageManager.getServices(),
      expenses: storageManager.getExpenses(),
      reconciliations: storageManager.getReconciliations()
    };

    const integrityCheck = validator.detectInconsistencies(systemData);
    
    // Debe tener pocos o ningún error crítico
    assert(integrityCheck.summary.criticalErrors === 0, 'No debe haber errores críticos de integridad');
  }, 'persistence');

  // 4. PRUEBAS DE VALIDACIÓN INTEGRAL
  console.log('🔍 VALIDANDO SISTEMA DE VALIDACIONES');
  console.log('-'.repeat(40));

  test('Validación de datos inválidos en flujo completo', () => {
    const invalidService = {
      id: 'invalid-s1',
      date: 'fecha-inválida',
      totalAmount: -50, // Negativo
      paymentType: 'invalid-type',
      platform: 'unknown-platform'
    };

    const validation = validator.validateService(invalidService);
    
    assert(validation.valid === false, 'Servicio inválido debe fallar validación');
    assert(validation.errors.length > 0, 'Debe tener errores');
    assert(validation.summary.errorCount > 0, 'Conteo de errores debe ser positivo');
    
    // Verificar tipos específicos de errores
    const hasNegativeAmountError = validation.errors.some(e => e.type === validator.errorTypes.NEGATIVE_AMOUNT);
    const hasInvalidDateError = validation.errors.some(e => e.type === validator.errorTypes.INVALID_DATE);
    const hasInvalidFormatError = validation.errors.some(e => e.type === validator.errorTypes.INVALID_FORMAT);
    
    assert(hasNegativeAmountError, 'Debe detectar monto negativo');
    assert(hasInvalidDateError, 'Debe detectar fecha inválida');
    assert(hasInvalidFormatError, 'Debe detectar formato inválido');
  }, 'validation');

  test('Validación de consistencia en conciliación compleja', () => {
    const inconsistentReconciliation = {
      id: 'inconsistent-r1',
      period: { startDate: '2024-01-15', endDate: '2024-01-15' },
      services: [
        { id: 's1', totalAmount: 100, date: '2024-01-15' },
        { id: 's2', totalAmount: 80, date: '2024-01-15' }
      ],
      expenses: [
        { id: 'e1', amount: 30, date: '2024-01-15' }
      ],
      summary: {
        totalServices: 200, // Inconsistente: debería ser 180
        totalExpenses: 30,
        netIncome: 150,     // Inconsistente: debería ser 150
        distribution60: 100, // Inconsistente: debería ser 90
        distribution40: 50   // Inconsistente: debería ser 60
      }
    };

    const validation = validator.validateReconciliation(inconsistentReconciliation);
    
    assert(validation.valid === false, 'Conciliación inconsistente debe fallar');
    
    const inconsistencyErrors = validation.errors.filter(e => e.type === validator.errorTypes.INCONSISTENCY);
    assert(inconsistencyErrors.length > 0, 'Debe detectar inconsistencias');
  }, 'validation');

  // 5. PRUEBAS END-TO-END
  console.log('🎯 VALIDANDO FLUJOS END-TO-END');
  console.log('-'.repeat(40));

  test('Flujo completo: Registro → Cálculo → Conciliación → Exportación', () => {
    // 1. Registrar servicios y gastos
    const services = [
      { id: 'e2e-s1', date: '2024-01-15', totalAmount: 120, paymentType: 'app', platform: 'freenow', isArticulated: false },
      { id: 'e2e-s2', date: '2024-01-15', totalAmount: 90, paymentType: 'card', platform: 'other', isArticulated: true },
      { id: 'e2e-s3', date: '2024-01-15', totalAmount: 70, paymentType: 'cash', platform: 'other', isArticulated: false }
    ];

    const expenses = [
      { id: 'e2e-e1', date: '2024-01-15', amount: 40, description: 'Gasolina', category: 'fuel' },
      { id: 'e2e-e2', date: '2024-01-15', amount: 15, description: 'Peaje', category: 'tolls' }
    ];

    // 2. Validar todos los datos
    services.forEach(service => {
      const validation = validator.validateService(service);
      assert(validation.valid, `Servicio ${service.id} debe ser válido`);
    });

    expenses.forEach(expense => {
      const validation = validator.validateExpense(expense);
      assert(validation.valid, `Gasto ${expense.id} debe ser válido`);
    });

    // 3. Generar conciliación
    const period = { startDate: '2024-01-15', endDate: '2024-01-15' };
    const reconciliation = reconciliationGenerator.generateReconciliation(period, services, expenses);

    // 4. Validar conciliación generada
    const reconciliationValidation = validator.validateReconciliation(reconciliation);
    assert(reconciliationValidation.valid, 'Conciliación generada debe ser válida');

    // 5. Verificar cálculos finales
    const expectedServiceTotal = services.reduce((sum, s) => sum + s.totalAmount, 0); // 280
    const expectedExpenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0); // 55
    const expectedNetIncome = expectedServiceTotal - expectedExpenseTotal; // 225

    assertClose(reconciliation.summary.totalServices, expectedServiceTotal, 0.01, 'Total servicios E2E');
    assertClose(reconciliation.summary.totalExpenses, expectedExpenseTotal, 0.01, 'Total gastos E2E');
    assertClose(reconciliation.summary.netIncome, expectedNetIncome, 0.01, 'Ingreso neto E2E');

    // 6. Verificar distribución final
    const expectedOwner = expectedNetIncome * 0.6; // 135
    const expectedDriver = expectedNetIncome * 0.4; // 90

    assertClose(reconciliation.summary.distribution60, expectedOwner, 0.01, 'Distribución patrón E2E');
    assertClose(reconciliation.summary.distribution40, expectedDriver, 0.01, 'Distribución taxista E2E');

    // 7. Calcular efectivo
    const cashServices = services.filter(s => s.paymentType === 'cash');
    const totalCash = cashServices.reduce((sum, s) => sum + s.totalAmount, 0);
    
    if (totalCash > 0) {
      const cashBreakdown = {
        bills: { twenty: 3, ten: 1 }, // 70€
        coins: { one: 0 }
      };
      
      const cashResult = cashCalculator.calculateTotal(cashBreakdown);
      assertClose(cashResult.total, totalCash, 0.01, 'Total efectivo E2E');
    }
  }, 'endToEnd');

  test('Flujo de recuperación tras error', () => {
    // Simular datos corruptos
    const corruptedService = {
      id: 'corrupt-s1',
      date: null,
      totalAmount: 'invalid',
      paymentType: undefined
    };

    // El sistema debe manejar gracefully los errores
    const validation = validator.validateService(corruptedService);
    
    assert(validation.valid === false, 'Datos corruptos deben fallar validación');
    assert(validation.summary.criticalErrors > 0, 'Debe detectar errores críticos');
    
    // El sistema debe continuar funcionando con datos válidos
    const validService = {
      id: 'recovery-s1',
      date: '2024-01-15',
      totalAmount: 100,
      paymentType: 'card',
      platform: 'freenow'
    };

    const recoveryValidation = validator.validateService(validService);
    assert(recoveryValidation.valid, 'Sistema debe recuperarse y procesar datos válidos');
  }, 'endToEnd');

  test('Rendimiento con volumen de datos moderado', () => {
    const startTime = Date.now();
    
    // Generar datos de prueba (100 servicios, 50 gastos)
    const services = [];
    const expenses = [];
    
    for (let i = 1; i <= 100; i++) {
      services.push({
        id: `perf-s${i}`,
        date: '2024-01-15',
        totalAmount: 50 + (i % 100),
        paymentType: ['cash', 'card', 'app'][i % 3],
        platform: ['freenow', 'uber', 'other'][i % 3],
        isArticulated: i % 10 === 0
      });
    }
    
    for (let i = 1; i <= 50; i++) {
      expenses.push({
        id: `perf-e${i}`,
        date: '2024-01-15',
        amount: 10 + (i % 50),
        description: `Gasto ${i}`,
        category: ['fuel', 'maintenance', 'tolls', 'parking', 'other'][i % 5]
      });
    }

    // Generar conciliación
    const period = { startDate: '2024-01-15', endDate: '2024-01-15' };
    const reconciliation = reconciliationGenerator.generateReconciliation(period, services, expenses);
    
    // Validar conciliación
    const validation = validator.validateReconciliation(reconciliation);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    assert(validation.valid, 'Conciliación con volumen moderado debe ser válida');
    assert(processingTime < 5000, `Procesamiento debe ser rápido (${processingTime}ms < 5000ms)`);
    
    console.log(`   ⏱️  Tiempo de procesamiento: ${processingTime}ms para 150 elementos`);
  }, 'endToEnd');

  // RESUMEN FINAL
  console.log('📊 RESUMEN DEL CHECKPOINT DE LÓGICA DE NEGOCIO');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  console.log('📋 Desglose por categoría:');
  Object.entries(results).forEach(([category, result]) => {
    const percentage = result.total > 0 ? ((result.passed/result.total) * 100).toFixed(1) : '0.0';
    const status = result.passed === result.total ? '✅' : '⚠️';
    console.log(`   ${status} ${category}: ${result.passed}/${result.total} (${percentage}%)`);
  });
  
  console.log('\n🎯 ESTADO DEL CHECKPOINT:');
  if (passedTests === totalTests) {
    console.log('✅ CHECKPOINT COMPLETADO EXITOSAMENTE');
    console.log('🚀 Toda la lógica de negocio funciona correctamente');
    console.log('📋 Sistema listo para implementación de interfaz de usuario');
    console.log('🔧 Componentes validados:');
    console.log('   • CalculationEngine - Cálculos y comisiones');
    console.log('   • ReconciliationGenerator - Generación de conciliaciones');
    console.log('   • CashCalculator - Cálculo de efectivo');
    console.log('   • StorageManager - Persistencia de datos');
    console.log('   • ValidationSystem - Validaciones y errores');
  } else {
    console.log('⚠️  CHECKPOINT PENDIENTE');
    console.log('🔧 Revisar fallos antes de continuar con la interfaz');
    console.log('📋 Componentes que requieren atención:');
    
    Object.entries(results).forEach(([category, result]) => {
      if (result.passed < result.total) {
        console.log(`   ❌ ${category}: ${result.total - result.passed} pruebas fallidas`);
      }
    });
  }
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests,
    results: results,
    componentsValidated: [
      'CalculationEngine',
      'ReconciliationGenerator',
      'CashCalculator',
      'StorageManager',
      'ValidationSystem'
    ]
  };
}

// Ejecutar si se carga directamente
if (typeof window !== 'undefined') {
  // En navegador
  window.runBusinessLogicCheckpoint = runBusinessLogicCheckpoint;
} else if (typeof module !== 'undefined') {
  // En Node.js
  module.exports = { runBusinessLogicCheckpoint };
}

// Auto-ejecutar si se carga como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runBusinessLogicCheckpoint();
}