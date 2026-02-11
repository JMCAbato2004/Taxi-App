/**
 * Checkpoint de Validación de Lógica de Negocio Central
 * 
 * Valida los componentes centrales de cálculo y validación
 * sin dependencias del navegador (localStorage, window).
 * 
 * Tarea 10: Checkpoint - Validar lógica de negocio completa
 */

// Cargar dependencias centrales
if (typeof require !== 'undefined') {
  const CalculationEngine = require('./calculation-engine.js');
  const CashCalculator = require('./cash-calculator.js');
  const ValidationSystem = require('./validation-system.js');
  
  global.CalculationEngine = CalculationEngine;
  global.CashCalculator = CashCalculator;
  global.ValidationSystem = ValidationSystem;
}

/**
 * Suite de pruebas para validación de lógica de negocio central
 */
function runCoreBusinessLogicCheckpoint() {
  console.log('🏁 CHECKPOINT DE LÓGICA DE NEGOCIO CENTRAL');
  console.log('='.repeat(60));
  console.log('Validando componentes centrales de cálculo y validación\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = {
    calculations: { passed: 0, total: 0 },
    validation: { passed: 0, total: 0 },
    integration: { passed: 0, total: 0 },
    businessRules: { passed: 0, total: 0 }
  };

  // Helper para ejecutar pruebas
  function test(name, testFn, category = 'calculations') {
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

  // Crear instancias de los componentes centrales
  const calculationEngine = new CalculationEngine();
  const cashCalculator = new CashCalculator();
  const validator = new ValidationSystem();

  // 1. PRUEBAS DE INICIALIZACIÓN
  console.log('🔧 VALIDANDO INICIALIZACIÓN');
  console.log('-'.repeat(40));

  test('Inicialización de componentes centrales', () => {
    assert(calculationEngine !== undefined, 'CalculationEngine debe inicializarse');
    assert(cashCalculator !== undefined, 'CashCalculator debe inicializarse');
    assert(validator !== undefined, 'ValidationSystem debe inicializarse');
    
    // Verificar configuración por defecto
    assert(calculationEngine.settings !== undefined, 'CalculationEngine debe tener configuración');
    assert(calculationEngine.settings.commissionRates !== undefined, 'Debe tener tasas de comisión');
    assert(calculationEngine.settings.distributionRates !== undefined, 'Debe tener tasas de distribución');
  }, 'integration');

  // 2. PRUEBAS DE CÁLCULOS BÁSICOS
  console.log('🧮 VALIDANDO CÁLCULOS BÁSICOS');
  console.log('-'.repeat(40));

  test('Cálculo de comisiones Freenow', () => {
    const amount = 100;
    const commission = calculationEngine.calculateCommission(amount, 'freenow');
    
    // Comisión Freenow por defecto es 15%
    assertClose(commission, 15, 0.01, 'Comisión Freenow');
    assert(commission > 0, 'Comisión debe ser positiva');
    assert(commission < amount, 'Comisión debe ser menor al monto total');
  }, 'calculations');

  test('Cálculo de comisiones otras plataformas', () => {
    const amount = 100;
    const commission = calculationEngine.calculateCommission(amount, 'other');
    
    // Comisión otras plataformas por defecto es 10%
    assertClose(commission, 10, 0.01, 'Comisión otras plataformas');
    assert(commission > 0, 'Comisión debe ser positiva');
    assert(commission < amount, 'Comisión debe ser menor al monto total');
  }, 'calculations');

  test('Cálculo de distribución 60/40', () => {
    const amount = 100;
    const ownerPercentage = 0.6;
    const driverPercentage = 0.4;
    
    const ownerAmount = calculationEngine.calculateDistribution(amount, ownerPercentage);
    const driverAmount = calculationEngine.calculateDistribution(amount, driverPercentage);
    
    assertClose(ownerAmount, 60, 0.01, 'Distribución patrón (60%)');
    assertClose(driverAmount, 40, 0.01, 'Distribución taxista (40%)');
    assertClose(ownerAmount + driverAmount, amount, 0.01, 'Suma de distribuciones');
  }, 'calculations');

  test('Cálculo de totales diarios básico', () => {
    const services = [
      { totalAmount: 100, paymentType: 'cash', platform: 'other', isArticulated: false, date: '2024-01-15' },
      { totalAmount: 80, paymentType: 'card', platform: 'freenow', isArticulated: true, date: '2024-01-15' },
      { totalAmount: 60, paymentType: 'app', platform: 'other', isArticulated: false, date: '2024-01-15' }
    ];
    
    const expenses = [
      { amount: 30, date: '2024-01-15' },
      { amount: 20, date: '2024-01-15' }
    ];
    
    const date = new Date('2024-01-15');
    const dailyTotal = calculationEngine.calculateDailyTotals(services, expenses, date);
    
    assertClose(dailyTotal.totalService, 240, 0.01, 'Total de servicios');
    assertClose(dailyTotal.expenses, 50, 0.01, 'Total de gastos');
    assertClose(dailyTotal.cashPayment, 100, 0.01, 'Total efectivo');
    assertClose(dailyTotal.cardPayment, 80, 0.01, 'Total tarjeta');
    assertClose(dailyTotal.appPayment, 60, 0.01, 'Total app');
    assertClose(dailyTotal.articulated, 80, 0.01, 'Total articulados');
  }, 'calculations');

  // 3. PRUEBAS DE CÁLCULO DE EFECTIVO
  console.log('💰 VALIDANDO CÁLCULO DE EFECTIVO');
  console.log('-'.repeat(40));

  test('Cálculo de desglose de billetes básico', () => {
    const breakdown = {
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
    
    const result = cashCalculator.calculateTotal(breakdown);
    const expectedTotal = 100 + 60 + 10 + 10 + 10 + 15; // 205€
    
    assert(result.success, 'Cálculo debe ser exitoso');
    assertClose(result.total, expectedTotal, 0.01, 'Total de efectivo');
    assert(result.details !== undefined, 'Debe incluir detalles');
  }, 'calculations');

  test('Cálculo de diferencia de efectivo', () => {
    const breakdown = {
      bills: { twenty: 5 }, // 100€
      coins: { one: 0 }
    };
    
    const expectedCash = 95; // Efectivo esperado
    const result = cashCalculator.calculateDifference(breakdown, expectedCash);
    
    assert(result.success, 'Cálculo debe ser exitoso');
    assertClose(result.difference, 5, 0.01, 'Diferencia de efectivo'); // 100 - 95 = 5
    assertClose(result.actualCash, 100, 0.01, 'Total calculado debe ser correcto');
  }, 'calculations');

  test('Sugerencia de desglose óptimo', () => {
    const targetAmount = 175;
    const suggestion = cashCalculator.suggestBreakdown(targetAmount);
    
    assert(suggestion.success, 'Debe generar sugerencia exitosamente');
    assert(suggestion.suggestedBreakdown !== undefined, 'Debe incluir desglose sugerido');
    
    // Calcular total de la sugerencia usando el propio calculador
    const calculationResult = cashCalculator.calculateTotal(suggestion.suggestedBreakdown);
    assert(calculationResult.success, 'Cálculo de sugerencia debe ser exitoso');
    
    assertClose(calculationResult.total, targetAmount, 0.01, 'Sugerencia debe sumar al objetivo');
  }, 'calculations');

  // 4. PRUEBAS DE VALIDACIÓN
  console.log('🔍 VALIDANDO SISTEMA DE VALIDACIONES');
  console.log('-'.repeat(40));

  test('Validación de servicio válido', () => {
    const validService = {
      id: 'test-service-1',
      date: '2024-01-15',
      totalAmount: 100,
      paymentType: 'card',
      platform: 'freenow',
      isArticulated: false
    };
    
    const result = validator.validateService(validService);
    
    assert(result.valid === true, 'Servicio válido debe pasar validación');
    assert(result.errors.length === 0, 'No debe tener errores');
    assert(result.summary.errorCount === 0, 'Conteo de errores debe ser 0');
  }, 'validation');

  test('Validación de servicio con errores múltiples', () => {
    const invalidService = {
      id: '', // Campo vacío
      date: 'fecha-inválida', // Fecha inválida
      totalAmount: -50, // Monto negativo
      paymentType: 'invalid-type', // Tipo inválido
      platform: 'unknown' // Plataforma inválida
    };
    
    const result = validator.validateService(invalidService);
    
    assert(result.valid === false, 'Servicio inválido debe fallar validación');
    assert(result.errors.length > 0, 'Debe tener errores');
    
    // Verificar tipos específicos de errores
    const errorTypes = result.errors.map(e => e.type);
    assert(errorTypes.includes(validator.errorTypes.REQUIRED_FIELD), 'Debe detectar campo requerido');
    assert(errorTypes.includes(validator.errorTypes.INVALID_DATE), 'Debe detectar fecha inválida');
    assert(errorTypes.includes(validator.errorTypes.NEGATIVE_AMOUNT), 'Debe detectar monto negativo');
    assert(errorTypes.includes(validator.errorTypes.INVALID_FORMAT), 'Debe detectar formato inválido');
  }, 'validation');

  test('Validación de gasto válido', () => {
    const validExpense = {
      id: 'test-expense-1',
      date: '2024-01-15',
      amount: 50,
      description: 'Gasolina para el día',
      category: 'fuel'
    };
    
    const result = validator.validateExpense(validExpense);
    
    assert(result.valid === true, 'Gasto válido debe pasar validación');
    assert(result.errors.length === 0, 'No debe tener errores');
  }, 'validation');

  test('Validación de desglose de efectivo', () => {
    const validCashBreakdown = {
      bills: {
        fifty: 1,
        twenty: 2,
        ten: 1,
        five: 1
      },
      coins: {
        two: 2,
        one: 5
      }
    };
    
    const result = validator.validateCashBreakdown(validCashBreakdown);
    
    assert(result.valid === true, 'Desglose válido debe pasar validación');
    assert(result.errors.length === 0, 'No debe tener errores');
  }, 'validation');

  // 5. PRUEBAS DE REGLAS DE NEGOCIO
  console.log('📋 VALIDANDO REGLAS DE NEGOCIO');
  console.log('-'.repeat(40));

  test('Regla: Comisión nunca mayor al monto total', () => {
    const amounts = [10, 50, 100, 500, 1000];
    const platforms = ['freenow', 'other', 'uber'];
    
    amounts.forEach(amount => {
      platforms.forEach(platform => {
        const commission = calculationEngine.calculateCommission(amount, platform);
        assert(commission < amount, `Comisión ${commission} debe ser menor a monto ${amount} para ${platform}`);
        assert(commission >= 0, `Comisión debe ser no negativa para ${platform}`);
      });
    });
  }, 'businessRules');

  test('Regla: Distribución siempre suma 100%', () => {
    const amounts = [50, 100, 150, 200, 500];
    
    amounts.forEach(amount => {
      const owner = calculationEngine.calculateDistribution(amount, 0.6);
      const driver = calculationEngine.calculateDistribution(amount, 0.4);
      
      assertClose(owner + driver, amount, 0.01, `Distribución debe sumar ${amount}`);
    });
  }, 'businessRules');

  test('Regla: Montos negativos siempre retornan 0', () => {
    const negativeAmount = -100;
    
    const commission = calculationEngine.calculateCommission(negativeAmount, 'freenow');
    const distribution = calculationEngine.calculateDistribution(negativeAmount, 0.6);
    
    assert(commission === 0, 'Comisión de monto negativo debe ser 0');
    assert(distribution === 0, 'Distribución de monto negativo debe ser 0');
  }, 'businessRules');

  test('Regla: Porcentajes fuera de rango retornan 0', () => {
    const amount = 100;
    
    const negativePercentage = calculationEngine.calculateDistribution(amount, -0.1);
    const overPercentage = calculationEngine.calculateDistribution(amount, 1.5);
    
    assert(negativePercentage === 0, 'Porcentaje negativo debe retornar 0');
    assert(overPercentage === 0, 'Porcentaje mayor a 1 debe retornar 0');
  }, 'businessRules');

  test('Regla: Validación rechaza datos críticos inválidos', () => {
    const criticallyInvalidService = null;
    const result = validator.validateService(criticallyInvalidService);
    
    assert(result.valid === false, 'Datos null deben fallar validación');
    assert(result.summary.criticalErrors > 0, 'Debe detectar errores críticos');
  }, 'businessRules');

  // 6. PRUEBAS DE INTEGRACIÓN
  console.log('🔗 VALIDANDO INTEGRACIÓN ENTRE COMPONENTES');
  console.log('-'.repeat(40));

  test('Flujo completo: Servicio → Validación → Cálculo', () => {
    // 1. Crear servicio
    const service = {
      id: 'integration-test-1',
      date: '2024-01-15',
      totalAmount: 120,
      paymentType: 'app',
      platform: 'freenow',
      isArticulated: false
    };
    
    // 2. Validar servicio
    const validation = validator.validateService(service);
    assert(validation.valid, 'Servicio debe ser válido');
    
    // 3. Calcular comisión
    const commission = calculationEngine.calculateCommission(service.totalAmount, service.platform);
    const netAmount = service.totalAmount - commission;
    
    // 4. Calcular distribución
    const ownerAmount = calculationEngine.calculateDistribution(netAmount, 0.6);
    const driverAmount = calculationEngine.calculateDistribution(netAmount, 0.4);
    
    // 5. Verificar consistencia
    assertClose(commission, 18, 0.01, 'Comisión Freenow 15%'); // 120 * 0.15 = 18
    assertClose(netAmount, 102, 0.01, 'Monto neto'); // 120 - 18 = 102
    assertClose(ownerAmount, 61.2, 0.01, 'Distribución patrón'); // 102 * 0.6 = 61.2
    assertClose(driverAmount, 40.8, 0.01, 'Distribución taxista'); // 102 * 0.4 = 40.8
    assertClose(ownerAmount + driverAmount, netAmount, 0.01, 'Suma distribuciones');
  }, 'integration');

  test('Flujo completo: Múltiples servicios → Totales → Efectivo', () => {
    const services = [
      { totalAmount: 100, paymentType: 'cash', platform: 'other', date: '2024-01-15' },
      { totalAmount: 80, paymentType: 'card', platform: 'freenow', date: '2024-01-15' },
      { totalAmount: 60, paymentType: 'cash', platform: 'other', date: '2024-01-15' }
    ];
    
    const expenses = [{ amount: 40, date: '2024-01-15' }];
    
    // Calcular totales
    const date = new Date('2024-01-15');
    const dailyTotal = calculationEngine.calculateDailyTotals(services, expenses, date);
    
    // Verificar totales
    assertClose(dailyTotal.totalService, 240, 0.01, 'Total servicios');
    assertClose(dailyTotal.cashPayment, 160, 0.01, 'Total efectivo'); // 100 + 60
    
    // Calcular desglose de efectivo
    const cashBreakdown = {
      bills: { fifty: 3, ten: 1 }, // 150 + 10 = 160
      coins: { one: 0 }
    };
    
    const cashResult = cashCalculator.calculateTotal(cashBreakdown);
    assert(cashResult.success, 'Cálculo de efectivo debe ser exitoso');
    assertClose(cashResult.total, dailyTotal.cashPayment, 0.01, 'Efectivo calculado vs esperado');
  }, 'integration');

  test('Validación de consistencia en flujo completo', () => {
    // Crear datos de prueba
    const service = {
      id: 'consistency-test',
      date: '2024-01-15',
      totalAmount: 100,
      paymentType: 'card',
      platform: 'freenow'
    };
    
    const expense = {
      id: 'consistency-expense',
      date: '2024-01-15',
      amount: 30,
      description: 'Gasolina',
      category: 'fuel'
    };
    
    // Validar individualmente
    const serviceValidation = validator.validateService(service);
    const expenseValidation = validator.validateExpense(expense);
    
    assert(serviceValidation.valid, 'Servicio debe ser válido');
    assert(expenseValidation.valid, 'Gasto debe ser válido');
    
    // Simular conciliación
    const mockReconciliation = {
      id: 'test-reconciliation',
      period: { startDate: '2024-01-15', endDate: '2024-01-15' },
      services: [service],
      expenses: [expense],
      summary: {
        totalServices: service.totalAmount,
        totalExpenses: expense.amount,
        netIncome: service.totalAmount - expense.amount
      }
    };
    
    // Validar conciliación
    const reconciliationValidation = validator.validateReconciliation(mockReconciliation);
    assert(reconciliationValidation.valid, 'Conciliación debe ser válida');
  }, 'integration');

  // RESUMEN FINAL
  console.log('📊 RESUMEN DEL CHECKPOINT DE LÓGICA CENTRAL');
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
    console.log('✅ CHECKPOINT DE LÓGICA CENTRAL COMPLETADO');
    console.log('🚀 Componentes centrales funcionan correctamente');
    console.log('📋 Lógica de negocio validada exitosamente');
    console.log('🔧 Componentes validados:');
    console.log('   • CalculationEngine - Cálculos y comisiones ✅');
    console.log('   • CashCalculator - Cálculo de efectivo ✅');
    console.log('   • ValidationSystem - Validaciones y errores ✅');
    console.log('\n🎉 SISTEMA LISTO PARA CONTINUAR CON LA INTERFAZ DE USUARIO');
  } else {
    console.log('⚠️  CHECKPOINT PENDIENTE');
    console.log('🔧 Revisar fallos antes de continuar');
    
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
      'CashCalculator',
      'ValidationSystem'
    ]
  };
}

// Ejecutar si se carga directamente
if (typeof window !== 'undefined') {
  // En navegador
  window.runCoreBusinessLogicCheckpoint = runCoreBusinessLogicCheckpoint;
} else if (typeof module !== 'undefined') {
  // En Node.js
  module.exports = { runCoreBusinessLogicCheckpoint };
}

// Auto-ejecutar si se carga como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runCoreBusinessLogicCheckpoint();
}