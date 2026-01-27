/**
 * Pruebas para Sistema de Validaciones y Manejo de Errores
 * 
 * Valida la funcionalidad de validación de montos negativos, fechas inválidas,
 * campos obligatorios y detección de inconsistencias.
 * 
 * Tarea 9.1: Crear sistema de validaciones
 */

// Cargar dependencias
if (typeof require !== 'undefined') {
  const ValidationSystem = require('./validation-system.js');
  global.ValidationSystem = ValidationSystem;
}

/**
 * Suite de pruebas para sistema de validaciones
 */
function runValidationSystemTests() {
  console.log('🧪 PRUEBAS DEL SISTEMA DE VALIDACIONES');
  console.log('='.repeat(60));
  console.log('Validando montos negativos, fechas inválidas, campos obligatorios e inconsistencias\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = {
    basic: { passed: 0, total: 0 },
    services: { passed: 0, total: 0 },
    expenses: { passed: 0, total: 0 },
    reconciliations: { passed: 0, total: 0 },
    inconsistencies: { passed: 0, total: 0 },
    advanced: { passed: 0, total: 0 }
  };

  // Helper para ejecutar pruebas
  function test(name, testFn, category = 'basic') {
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

  // Crear instancia del sistema de validaciones
  const validator = new ValidationSystem();

  // 1. PRUEBAS BÁSICAS DEL SISTEMA
  console.log('🔧 VALIDANDO FUNCIONALIDAD BÁSICA');
  console.log('-'.repeat(40));

  test('Creación de resultado de validación', () => {
    const result = validator.createValidationResult();
    
    assert(result.valid === true, 'Resultado inicial debe ser válido');
    assert(Array.isArray(result.errors), 'Debe tener array de errores');
    assert(Array.isArray(result.warnings), 'Debe tener array de advertencias');
    assert(Array.isArray(result.info), 'Debe tener array de información');
    assert(result.summary !== undefined, 'Debe tener resumen');
    assert(result.summary.errorCount === 0, 'Conteo inicial de errores debe ser 0');
  }, 'basic');

  test('Adición de errores y advertencias', () => {
    const result = validator.createValidationResult();
    
    validator.addError(result, 'test_error', 'Error de prueba', validator.severityLevels.HIGH);
    validator.addWarning(result, 'test_warning', 'Advertencia de prueba');
    validator.addInfo(result, 'test_info', 'Información de prueba');
    
    assert(result.valid === false, 'Resultado debe ser inválido después de agregar error');
    assert(result.errors.length === 1, 'Debe tener 1 error');
    assert(result.warnings.length === 1, 'Debe tener 1 advertencia');
    assert(result.info.length === 1, 'Debe tener 1 información');
    assert(result.summary.errorCount === 1, 'Conteo de errores debe ser 1');
    assert(result.summary.warningCount === 1, 'Conteo de advertencias debe ser 1');
  }, 'basic');

  test('Finalización de resultado de validación', () => {
    const result = validator.createValidationResult();
    validator.addError(result, 'test', 'Test error', validator.severityLevels.CRITICAL);
    
    const finalized = validator.finalizeValidationResult(result);
    
    assert(finalized.completedAt !== undefined, 'Debe tener fecha de completado');
    assert(finalized.hasErrors === true, 'Debe indicar que tiene errores');
    assert(finalized.hasCriticalErrors === true, 'Debe indicar errores críticos');
  }, 'basic');

  test('Formateo de resultado de validación', () => {
    const result = validator.createValidationResult();
    validator.addError(result, 'test', 'Error de prueba', validator.severityLevels.HIGH);
    validator.addWarning(result, 'test', 'Advertencia de prueba');
    
    const formatted = validator.formatValidationResult(result);
    
    assert(typeof formatted === 'string', 'Resultado formateado debe ser string');
    assert(formatted.includes('❌'), 'Debe incluir icono de error');
    assert(formatted.includes('Error de prueba'), 'Debe incluir mensaje de error');
    assert(formatted.includes('Advertencia de prueba'), 'Debe incluir mensaje de advertencia');
  }, 'basic');

  // 2. PRUEBAS DE VALIDACIÓN DE SERVICIOS
  console.log('🚕 VALIDANDO SERVICIOS');
  console.log('-'.repeat(40));

  test('Validación de servicio válido', () => {
    const validService = {
      id: 'service-1',
      date: '2024-01-15',
      time: '10:30',
      totalAmount: 100,
      paymentType: 'card',
      platform: 'freenow',
      isArticulated: false
    };
    
    const result = validator.validateService(validService);
    
    assert(result.valid === true, 'Servicio válido debe pasar validación');
    assert(result.errors.length === 0, 'No debe tener errores');
  }, 'services');

  test('Validación de campos obligatorios en servicios', () => {
    const invalidService = {
      id: 'service-1',
      // Faltan campos obligatorios
      totalAmount: 100
    };
    
    const result = validator.validateService(invalidService);
    
    assert(result.valid === false, 'Servicio inválido debe fallar validación');
    assert(result.errors.length > 0, 'Debe tener errores');
    
    const requiredFieldErrors = result.errors.filter(e => e.type === validator.errorTypes.REQUIRED_FIELD);
    assert(requiredFieldErrors.length > 0, 'Debe tener errores de campos obligatorios');
  }, 'services');

  test('Validación de montos negativos en servicios', () => {
    const serviceWithNegativeAmount = {
      id: 'service-1',
      date: '2024-01-15',
      totalAmount: -50, // Monto negativo
      paymentType: 'card',
      platform: 'freenow'
    };
    
    const result = validator.validateService(serviceWithNegativeAmount);
    
    assert(result.valid === false, 'Servicio con monto negativo debe fallar');
    
    const negativeAmountErrors = result.errors.filter(e => e.type === validator.errorTypes.NEGATIVE_AMOUNT);
    assert(negativeAmountErrors.length > 0, 'Debe detectar monto negativo');
  }, 'services');

  test('Validación de fechas inválidas en servicios', () => {
    const serviceWithInvalidDate = {
      id: 'service-1',
      date: 'fecha-inválida',
      totalAmount: 100,
      paymentType: 'card',
      platform: 'freenow'
    };
    
    const result = validator.validateService(serviceWithInvalidDate);
    
    assert(result.valid === false, 'Servicio con fecha inválida debe fallar');
    
    const invalidDateErrors = result.errors.filter(e => e.type === validator.errorTypes.INVALID_DATE);
    assert(invalidDateErrors.length > 0, 'Debe detectar fecha inválida');
  }, 'services');

  test('Validación de tipos de datos en servicios', () => {
    const serviceWithWrongTypes = {
      id: 'service-1',
      date: '2024-01-15',
      totalAmount: 'cien', // Debe ser número
      paymentType: 'card',
      platform: 'freenow'
    };
    
    const result = validator.validateService(serviceWithWrongTypes);
    
    assert(result.valid === false, 'Servicio con tipos incorrectos debe fallar');
    
    const typeErrors = result.errors.filter(e => e.type === validator.errorTypes.INVALID_TYPE);
    assert(typeErrors.length > 0, 'Debe detectar tipo incorrecto');
  }, 'services');

  test('Validación de formatos específicos en servicios', () => {
    const serviceWithInvalidFormat = {
      id: 'service-1',
      date: '2024-01-15',
      totalAmount: 100,
      paymentType: 'invalid-payment', // Formato inválido
      platform: 'freenow'
    };
    
    const result = validator.validateService(serviceWithInvalidFormat);
    
    assert(result.valid === false, 'Servicio con formato inválido debe fallar');
    
    const formatErrors = result.errors.filter(e => e.type === validator.errorTypes.INVALID_FORMAT);
    assert(formatErrors.length > 0, 'Debe detectar formato inválido');
  }, 'services');

  test('Validación de reglas de negocio en servicios', () => {
    const serviceWithBusinessRuleIssues = {
      id: 'service-1',
      date: '2024-01-15',
      time: '25:70', // Hora inválida
      totalAmount: 1000, // Monto muy alto
      paymentType: 'cash',
      platform: 'freenow' // Freenow con efectivo es inusual
    };
    
    const result = validator.validateService(serviceWithBusinessRuleIssues);
    
    assert(result.valid === false, 'Servicio con problemas de negocio debe fallar');
    assert(result.warnings.length > 0 || result.errors.length > 0, 'Debe tener advertencias o errores');
  }, 'services');

  // 3. PRUEBAS DE VALIDACIÓN DE GASTOS
  console.log('💰 VALIDANDO GASTOS');
  console.log('-'.repeat(40));

  test('Validación de gasto válido', () => {
    const validExpense = {
      id: 'expense-1',
      date: '2024-01-15',
      amount: 50,
      description: 'Gasolina',
      category: 'fuel'
    };
    
    const result = validator.validateExpense(validExpense);
    
    assert(result.valid === true, 'Gasto válido debe pasar validación');
    assert(result.errors.length === 0, 'No debe tener errores');
  }, 'expenses');

  test('Validación de campos obligatorios en gastos', () => {
    const invalidExpense = {
      id: 'expense-1',
      // Faltan campos obligatorios
      amount: 50
    };
    
    const result = validator.validateExpense(invalidExpense);
    
    assert(result.valid === false, 'Gasto inválido debe fallar validación');
    
    const requiredFieldErrors = result.errors.filter(e => e.type === validator.errorTypes.REQUIRED_FIELD);
    assert(requiredFieldErrors.length > 0, 'Debe tener errores de campos obligatorios');
  }, 'expenses');

  test('Validación de montos negativos en gastos', () => {
    const expenseWithNegativeAmount = {
      id: 'expense-1',
      date: '2024-01-15',
      amount: -25, // Monto negativo
      description: 'Gasto negativo',
      category: 'other'
    };
    
    const result = validator.validateExpense(expenseWithNegativeAmount);
    
    assert(result.valid === false, 'Gasto con monto negativo debe fallar');
    
    const negativeAmountErrors = result.errors.filter(e => e.type === validator.errorTypes.NEGATIVE_AMOUNT);
    assert(negativeAmountErrors.length > 0, 'Debe detectar monto negativo');
  }, 'expenses');

  test('Validación de reglas de negocio en gastos', () => {
    const expenseWithBusinessIssues = {
      id: 'expense-1',
      date: '2024-01-15',
      amount: 2000, // Monto muy alto para mantenimiento
      description: 'X', // Descripción muy corta
      category: 'maintenance'
    };
    
    const result = validator.validateExpense(expenseWithBusinessIssues);
    
    assert(result.warnings.length > 0, 'Debe tener advertencias de reglas de negocio');
  }, 'expenses');

  // 4. PRUEBAS DE VALIDACIÓN DE CONCILIACIONES
  console.log('📊 VALIDANDO CONCILIACIONES');
  console.log('-'.repeat(40));

  test('Validación de conciliación válida', () => {
    const validReconciliation = {
      id: 'reconciliation-1',
      period: {
        startDate: '2024-01-15',
        endDate: '2024-01-15'
      },
      services: [
        { id: 'service-1', totalAmount: 100, date: '2024-01-15' }
      ],
      expenses: [
        { id: 'expense-1', amount: 50, date: '2024-01-15' }
      ],
      summary: {
        totalServices: 100,
        totalExpenses: 50,
        netIncome: 50,
        distribution60: 30,
        distribution40: 20
      }
    };
    
    const result = validator.validateReconciliation(validReconciliation);
    
    assert(result.valid === true, 'Conciliación válida debe pasar validación');
    assert(result.errors.length === 0, 'No debe tener errores');
  }, 'reconciliations');

  test('Validación de fechas de período en conciliaciones', () => {
    const reconciliationWithInvalidPeriod = {
      id: 'reconciliation-1',
      period: {
        startDate: '2024-01-20', // Fecha inicio posterior a fin
        endDate: '2024-01-15'
      },
      services: [],
      expenses: [],
      summary: {}
    };
    
    const result = validator.validateReconciliation(reconciliationWithInvalidPeriod);
    
    assert(result.valid === false, 'Conciliación con período inválido debe fallar');
    
    const businessRuleErrors = result.errors.filter(e => e.type === validator.errorTypes.BUSINESS_RULE);
    assert(businessRuleErrors.length > 0, 'Debe detectar problema de regla de negocio');
  }, 'reconciliations');

  test('Validación de consistencia interna en conciliaciones', () => {
    const inconsistentReconciliation = {
      id: 'reconciliation-1',
      period: {
        startDate: '2024-01-15',
        endDate: '2024-01-15'
      },
      services: [],
      expenses: [],
      summary: {
        totalServices: 100,
        totalExpenses: 50,
        netIncome: 60 // Inconsistente: debería ser 50
      }
    };
    
    const result = validator.validateReconciliation(inconsistentReconciliation);
    
    assert(result.valid === false, 'Conciliación inconsistente debe fallar');
    
    const inconsistencyErrors = result.errors.filter(e => e.type === validator.errorTypes.INCONSISTENCY);
    assert(inconsistencyErrors.length > 0, 'Debe detectar inconsistencia');
  }, 'reconciliations');

  test('Validación de servicios fuera del período', () => {
    const reconciliationWithOutOfPeriodServices = {
      id: 'reconciliation-1',
      period: {
        startDate: '2024-01-15',
        endDate: '2024-01-15'
      },
      services: [
        { id: 'service-1', totalAmount: 100, date: '2024-01-20' } // Fuera del período
      ],
      expenses: [],
      summary: {}
    };
    
    const result = validator.validateReconciliation(reconciliationWithOutOfPeriodServices);
    
    assert(result.valid === false, 'Conciliación con servicios fuera de período debe fallar');
    
    const inconsistencyErrors = result.errors.filter(e => e.type === validator.errorTypes.INCONSISTENCY);
    assert(inconsistencyErrors.length > 0, 'Debe detectar servicio fuera de período');
  }, 'reconciliations');

  // 5. PRUEBAS DE DETECCIÓN DE INCONSISTENCIAS
  console.log('🔍 VALIDANDO DETECCIÓN DE INCONSISTENCIAS');
  console.log('-'.repeat(40));

  test('Detección de IDs duplicados', () => {
    const systemDataWithDuplicates = {
      services: [
        { id: 'service-1', totalAmount: 100, date: '2024-01-15' },
        { id: 'service-1', totalAmount: 150, date: '2024-01-16' } // ID duplicado
      ],
      expenses: [],
      reconciliations: []
    };
    
    const result = validator.detectInconsistencies(systemDataWithDuplicates);
    
    assert(result.valid === false, 'Sistema con IDs duplicados debe fallar');
    
    const inconsistencyErrors = result.errors.filter(e => e.type === validator.errorTypes.INCONSISTENCY);
    assert(inconsistencyErrors.length > 0, 'Debe detectar IDs duplicados');
  }, 'inconsistencies');

  test('Detección de inconsistencias entre servicios y conciliaciones', () => {
    const systemDataWithInconsistencies = {
      services: [
        { id: 'service-1', totalAmount: 100, date: '2024-01-15' }
      ],
      expenses: [],
      reconciliations: [
        {
          id: 'reconciliation-1',
          services: [
            { id: 'service-1', totalAmount: 150 } // Monto diferente
          ],
          expenses: [],
          summary: {}
        }
      ]
    };
    
    const result = validator.detectInconsistencies(systemDataWithInconsistencies);
    
    assert(result.valid === false, 'Sistema con inconsistencias debe fallar');
    
    const inconsistencyErrors = result.errors.filter(e => e.type === validator.errorTypes.INCONSISTENCY);
    assert(inconsistencyErrors.length > 0, 'Debe detectar inconsistencias');
  }, 'inconsistencies');

  test('Detección de totales calculados incorrectos', () => {
    const systemDataWithWrongTotals = {
      services: [],
      expenses: [],
      reconciliations: [
        {
          id: 'reconciliation-1',
          services: [
            { id: 'service-1', totalAmount: 100 },
            { id: 'service-2', totalAmount: 50 }
          ],
          expenses: [],
          summary: {
            totalServices: 200 // Incorrecto: debería ser 150
          }
        }
      ]
    };
    
    const result = validator.detectInconsistencies(systemDataWithWrongTotals);
    
    assert(result.valid === false, 'Sistema con totales incorrectos debe fallar');
    
    const inconsistencyErrors = result.errors.filter(e => e.type === validator.errorTypes.INCONSISTENCY);
    assert(inconsistencyErrors.length > 0, 'Debe detectar totales incorrectos');
  }, 'inconsistencies');

  test('Detección de referencias faltantes', () => {
    const systemDataWithMissingReferences = {
      services: [], // No hay servicios
      expenses: [],
      reconciliations: [
        {
          id: 'reconciliation-1',
          services: [
            { id: 'service-nonexistent', totalAmount: 100 } // Servicio inexistente
          ],
          expenses: [],
          summary: {}
        }
      ]
    };
    
    const result = validator.detectInconsistencies(systemDataWithMissingReferences);
    
    assert(result.valid === false, 'Sistema con referencias faltantes debe fallar');
    
    const inconsistencyErrors = result.errors.filter(e => e.type === validator.errorTypes.INCONSISTENCY);
    assert(inconsistencyErrors.length > 0, 'Debe detectar referencias faltantes');
  }, 'inconsistencies');

  // 6. PRUEBAS AVANZADAS
  console.log('🚀 VALIDANDO FUNCIONALIDADES AVANZADAS');
  console.log('-'.repeat(40));

  test('Validación de desglose de efectivo', () => {
    const validCashBreakdown = {
      bills: {
        fifty: 2,
        twenty: 3,
        ten: 1,
        five: 2
      },
      coins: {
        two: 5,
        one: 10
      },
      total: 200,
      difference: 0
    };
    
    const result = validator.validateCashBreakdown(validCashBreakdown);
    
    assert(result.valid === true, 'Desglose válido debe pasar validación');
    assert(result.errors.length === 0, 'No debe tener errores');
  }, 'advanced');

  test('Validación de denominaciones inválidas en efectivo', () => {
    const invalidCashBreakdown = {
      bills: {
        hundred: 1, // Denominación inválida
        twenty: 2
      },
      coins: {
        invalid_coin: 5 // Denominación inválida
      }
    };
    
    const result = validator.validateCashBreakdown(invalidCashBreakdown);
    
    assert(result.valid === false, 'Desglose con denominaciones inválidas debe fallar');
    
    const formatErrors = result.errors.filter(e => e.type === validator.errorTypes.INVALID_FORMAT);
    assert(formatErrors.length > 0, 'Debe detectar denominaciones inválidas');
  }, 'advanced');

  test('Validación de cantidades negativas en efectivo', () => {
    const cashBreakdownWithNegatives = {
      bills: {
        fifty: -1, // Cantidad negativa
        twenty: 2
      },
      coins: {
        one: 5
      }
    };
    
    const result = validator.validateCashBreakdown(cashBreakdownWithNegatives);
    
    assert(result.valid === false, 'Desglose con cantidades negativas debe fallar');
    
    const negativeAmountErrors = result.errors.filter(e => e.type === validator.errorTypes.NEGATIVE_AMOUNT);
    assert(negativeAmountErrors.length > 0, 'Debe detectar cantidades negativas');
  }, 'advanced');

  test('Validación de sistema completo sin errores', () => {
    const cleanSystemData = {
      services: [
        { id: 'service-1', totalAmount: 100, date: '2024-01-15', paymentType: 'card', platform: 'freenow' }
      ],
      expenses: [
        { id: 'expense-1', amount: 50, date: '2024-01-15', description: 'Gasolina', category: 'fuel' }
      ],
      reconciliations: [
        {
          id: 'reconciliation-1',
          services: [{ id: 'service-1', totalAmount: 100 }],
          expenses: [{ id: 'expense-1', amount: 50 }],
          summary: {
            totalServices: 100,
            totalExpenses: 50,
            netIncome: 50
          }
        }
      ]
    };
    
    const result = validator.detectInconsistencies(cleanSystemData);
    
    assert(result.valid === true, 'Sistema limpio debe pasar validación');
    assert(result.errors.length === 0, 'No debe tener errores');
  }, 'advanced');

  test('Manejo de datos null/undefined', () => {
    const nullResult = validator.validateService(null);
    assert(nullResult.valid === false, 'Validación de null debe fallar');
    
    const undefinedResult = validator.validateExpense(undefined);
    assert(undefinedResult.valid === false, 'Validación de undefined debe fallar');
    
    const emptyResult = validator.validateReconciliation({});
    assert(emptyResult.valid === false, 'Validación de objeto vacío debe fallar');
  }, 'advanced');

  // RESUMEN FINAL
  console.log('📊 RESUMEN DE PRUEBAS - SISTEMA DE VALIDACIONES');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  console.log('📋 Desglose por categoría:');
  Object.entries(results).forEach(([category, result]) => {
    const percentage = result.total > 0 ? ((result.passed/result.total) * 100).toFixed(1) : '0.0';
    console.log(`   ${category}: ${result.passed}/${result.total} (${percentage}%)`);
  });
  
  console.log('\n🎯 ESTADO DE LA TAREA 9.1:');
  if (passedTests === totalTests) {
    console.log('✅ TAREA 9.1 COMPLETADA');
    console.log('🚀 Sistema de validaciones y manejo de errores validado');
    console.log('📋 Requerimientos 9.1, 9.2, 9.3, 9.4 implementados correctamente');
  } else {
    console.log('⚠️  TAREA 9.1 PENDIENTE');
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
  window.runValidationSystemTests = runValidationSystemTests;
} else if (typeof module !== 'undefined') {
  // En Node.js
  module.exports = { runValidationSystemTests };
}

// Auto-ejecutar si se carga como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runValidationSystemTests();
}