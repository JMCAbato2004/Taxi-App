/**
 * Pruebas para CashCalculator
 * 
 * Valida la funcionalidad de cálculo de efectivo, desglose de billetes,
 * cálculo automático de totales y diferencias con efectivo neto.
 * 
 * Tarea 7.1: Crear CashCalculator con desglose de billetes
 */

// Cargar dependencias
if (typeof require !== 'undefined') {
  const CashCalculator = require('./cash-calculator.js');
  global.CashCalculator = CashCalculator;
}

/**
 * Suite de pruebas para CashCalculator
 */
function runCashCalculatorTests() {
  console.log('🧪 PRUEBAS DEL CASH CALCULATOR');
  console.log('='.repeat(50));
  console.log('Validando cálculo de efectivo, desglose de billetes y diferencias\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = {
    basic: { passed: 0, total: 0 },
    calculation: { passed: 0, total: 0 },
    difference: { passed: 0, total: 0 },
    validation: { passed: 0, total: 0 },
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

  // Crear instancia del calculador
  const calculator = new CashCalculator();

  // 1. PRUEBAS BÁSICAS
  console.log('🔧 VALIDANDO FUNCIONALIDAD BÁSICA');
  console.log('-'.repeat(40));

  test('Creación de desglose vacío', () => {
    const breakdown = calculator.createEmptyBreakdown();
    
    assert(breakdown.bills !== undefined, 'Debe tener estructura de billetes');
    assert(breakdown.coins !== undefined, 'Debe tener estructura de monedas');
    assert(breakdown.metadata !== undefined, 'Debe tener metadata');
    
    // Verificar que todos los billetes están en 0
    Object.values(breakdown.bills).forEach(count => {
      assert(count === 0, 'Todos los billetes deben estar en 0');
    });
    
    // Verificar que todas las monedas están en 0
    Object.values(breakdown.coins).forEach(count => {
      assert(count === 0, 'Todas las monedas deben estar en 0');
    });
  }, 'basic');

  test('Información de denominaciones', () => {
    const info = calculator.getDenominationsInfo();
    
    assert(info.bills !== undefined, 'Debe tener información de billetes');
    assert(info.coins !== undefined, 'Debe tener información de monedas');
    assert(info.settings !== undefined, 'Debe tener configuración');
    assert(info.totalDenominations > 0, 'Debe tener denominaciones disponibles');
    
    // Verificar denominaciones específicas
    assert(info.bills.fifty !== undefined, 'Debe tener billetes de 50€');
    assert(info.coins.one !== undefined, 'Debe tener monedas de 1€');
  }, 'basic');

  test('Actualización de configuración', () => {
    const newSettings = {
      precision: 3,
      autoCalculate: false,
      showCoins: false
    };
    
    const result = calculator.updateSettings(newSettings);
    
    assert(result.success === true, 'Actualización debe ser exitosa');
    assert(result.settings.precision === 3, 'Precisión debe actualizarse');
    assert(result.settings.autoCalculate === false, 'AutoCalculate debe actualizarse');
    assert(result.settings.showCoins === false, 'ShowCoins debe actualizarse');
    
    // Restaurar configuración original
    calculator.updateSettings({ precision: 2, autoCalculate: true, showCoins: true });
  }, 'basic');

  // 2. PRUEBAS DE CÁLCULO
  console.log('🧮 VALIDANDO CÁLCULOS DE TOTALES');
  console.log('-'.repeat(40));

  test('Cálculo de total básico', () => {
    const breakdown = {
      bills: { fifty: 2, twenty: 3, ten: 1, five: 2 },
      coins: { two: 5, one: 10, fifty_cents: 4 }
    };
    
    const result = calculator.calculateTotal(breakdown);
    
    assert(result.success === true, 'Cálculo debe ser exitoso');
    
    // Verificar cálculos: (2*50) + (3*20) + (1*10) + (2*5) + (5*2) + (10*1) + (4*0.5)
    // = 100 + 60 + 10 + 10 + 10 + 10 + 2 = 202
    const expectedTotal = 202;
    assert(Math.abs(result.total - expectedTotal) < 0.01, 
      `Total esperado ${expectedTotal}, obtenido ${result.total}`);
    
    assert(result.details !== null, 'Debe incluir detalles');
    assert(result.details.summary !== undefined, 'Debe incluir resumen');
  }, 'calculation');

  test('Cálculo con desglose vacío', () => {
    const emptyBreakdown = calculator.createEmptyBreakdown();
    const result = calculator.calculateTotal(emptyBreakdown);
    
    assert(result.success === true, 'Cálculo de desglose vacío debe ser exitoso');
    assert(result.total === 0, `Total debe ser 0, obtenido ${result.total}`);
    assert(result.details.summary.billCount === 0, 'Conteo de billetes debe ser 0');
    assert(result.details.summary.coinCount === 0, 'Conteo de monedas debe ser 0');
  }, 'calculation');

  test('Manejo de entrada inválida en cálculo', () => {
    const result1 = calculator.calculateTotal(null);
    assert(result1.success === false, 'Debe fallar con entrada null');
    
    const result2 = calculator.calculateTotal({ bills: { invalid: 5 } });
    assert(result2.success === true, 'Debe ignorar denominaciones inválidas');
    assert(result2.total === 0, 'Total debe ser 0 con denominaciones inválidas');
  }, 'calculation');

  test('Actualización de denominación individual', () => {
    const breakdown = calculator.createEmptyBreakdown();
    
    const result = calculator.updateDenomination(breakdown, 'bills', 'fifty', 3);
    
    assert(result.success === true, 'Actualización debe ser exitosa');
    assert(result.breakdown.bills.fifty === 3, 'Cantidad debe actualizarse');
    assert(result.calculation !== null, 'Debe incluir cálculo automático');
    assert(Math.abs(result.calculation.total - 150) < 0.01, 'Total debe ser 150 (3*50)');
  }, 'calculation');

  // 3. PRUEBAS DE DIFERENCIAS
  console.log('📊 VALIDANDO CÁLCULO DE DIFERENCIAS');
  console.log('-'.repeat(40));

  test('Diferencia exacta (sin diferencia)', () => {
    const breakdown = {
      bills: { twenty: 5 }, // 100€
      coins: {}
    };
    
    const result = calculator.calculateDifference(breakdown, 100);
    
    assert(result.success === true, 'Cálculo debe ser exitoso');
    assert(result.expectedCash === 100, 'Efectivo esperado debe ser 100');
    assert(result.actualCash === 100, 'Efectivo actual debe ser 100');
    assert(Math.abs(result.difference) < 0.01, 'Diferencia debe ser 0');
    assert(result.analysis.status === 'exact', 'Estado debe ser exacto');
    assert(result.analysis.severity === 'none', 'Severidad debe ser ninguna');
  }, 'difference');

  test('Diferencia con excedente', () => {
    const breakdown = {
      bills: { twenty: 5, ten: 1 }, // 110€
      coins: {}
    };
    
    const result = calculator.calculateDifference(breakdown, 100);
    
    assert(result.success === true, 'Cálculo debe ser exitoso');
    assert(result.difference === 10, `Diferencia esperada 10, obtenida ${result.difference}`);
    assert(result.analysis.status === 'surplus', 'Estado debe ser excedente');
    assert(result.analysis.severity === 'medium', 'Severidad debe ser media');
    assert(result.analysis.message.includes('excedente'), 'Mensaje debe mencionar excedente');
  }, 'difference');

  test('Diferencia con faltante', () => {
    const breakdown = {
      bills: { twenty: 4 }, // 80€
      coins: {}
    };
    
    const result = calculator.calculateDifference(breakdown, 100);
    
    assert(result.success === true, 'Cálculo debe ser exitoso');
    assert(result.difference === -20, `Diferencia esperada -20, obtenida ${result.difference}`);
    assert(result.analysis.status === 'deficit', 'Estado debe ser faltante');
    assert(result.analysis.severity === 'high', 'Severidad debe ser alta (>=20€)');
    assert(result.analysis.message.includes('faltante'), 'Mensaje debe mencionar faltante');
  }, 'difference');

  test('Cálculo de porcentaje de diferencia', () => {
    const breakdown = {
      bills: { twenty: 5, five: 1 }, // 105€
      coins: {}
    };
    
    const result = calculator.calculateDifference(breakdown, 100);
    
    assert(result.success === true, 'Cálculo debe ser exitoso');
    assert(result.percentageDifference === 5, 
      `Porcentaje esperado 5%, obtenido ${result.percentageDifference}%`);
  }, 'difference');

  // 4. PRUEBAS DE VALIDACIÓN
  console.log('✅ VALIDANDO ENTRADA DE DATOS');
  console.log('-'.repeat(40));

  test('Validación de desglose válido', () => {
    const validBreakdown = {
      bills: { fifty: 1, twenty: 2 },
      coins: { one: 5, fifty_cents: 2 }
    };
    
    const validation = calculator.validateBreakdown(validBreakdown);
    
    assert(validation.valid === true, 'Desglose válido debe pasar validación');
    assert(validation.errors.length === 0, 'No debe haber errores');
  }, 'validation');

  test('Validación de desglose inválido', () => {
    const invalidBreakdown = {
      bills: { fifty: -1, invalid: 5 }, // Cantidad negativa y denominación inválida
      coins: { one: 'invalid' } // Tipo inválido
    };
    
    const validation = calculator.validateBreakdown(invalidBreakdown);
    
    assert(validation.valid === false, 'Desglose inválido debe fallar validación');
    assert(validation.errors.length > 0, 'Debe haber errores');
    assert(validation.summary.errorCount > 0, 'Conteo de errores debe ser mayor a 0');
  }, 'validation');

  test('Validación con advertencias', () => {
    const breakdownWithWarnings = {
      bills: { fifty: 1.5, twenty: 2 }, // Cantidad no entera
      coins: { one: 600 } // Cantidad muy alta
    };
    
    const validation = calculator.validateBreakdown(breakdownWithWarnings);
    
    assert(validation.warnings.length > 0, 'Debe haber advertencias');
    assert(validation.summary.warningCount > 0, 'Conteo de advertencias debe ser mayor a 0');
  }, 'validation');

  test('Validación de entrada null/undefined', () => {
    const validation1 = calculator.validateBreakdown(null);
    assert(validation1.valid === false, 'Debe fallar con null');
    
    const validation2 = calculator.validateBreakdown(undefined);
    assert(validation2.valid === false, 'Debe fallar con undefined');
  }, 'validation');

  // 5. PRUEBAS AVANZADAS
  console.log('🚀 VALIDANDO FUNCIONALIDADES AVANZADAS');
  console.log('-'.repeat(40));

  test('Sugerencia de desglose óptimo', () => {
    const amount = 87.35;
    const suggestion = calculator.suggestBreakdown(amount);
    
    assert(suggestion.success === true, 'Sugerencia debe ser exitosa');
    assert(suggestion.originalAmount === amount, 'Cantidad original debe preservarse');
    assert(suggestion.calculation.success === true, 'Cálculo debe ser exitoso');
    
    // Verificar que la sugerencia se acerca al monto original
    const difference = Math.abs(suggestion.calculation.total - amount);
    assert(difference < 0.1, `Diferencia debe ser mínima, obtenida ${difference}`);
    
    assert(suggestion.isExact || suggestion.remainingAmount < 0.05, 
      'Debe ser exacto o tener resto mínimo');
  }, 'advanced');

  test('Sugerencia con restricciones', () => {
    const amount = 25.75;
    const options = {
      includeCoins: false, // Solo billetes
      preferLargerDenominations: true
    };
    
    const suggestion = calculator.suggestBreakdown(amount, options);
    
    assert(suggestion.success === true, 'Sugerencia debe ser exitosa');
    
    // Verificar que no se usan monedas
    const coinCount = Object.values(suggestion.suggestedBreakdown.coins)
      .reduce((sum, count) => sum + count, 0);
    assert(coinCount === 0, 'No debe usar monedas cuando están deshabilitadas');
  }, 'advanced');

  test('Formato para visualización', () => {
    const breakdown = {
      bills: { fifty: 1, twenty: 2 },
      coins: { one: 3, fifty_cents: 2 }
    };
    
    const formatted = calculator.formatForDisplay(breakdown);
    
    assert(formatted.success === true, 'Formato debe ser exitoso');
    assert(formatted.formatted.bills.length > 0, 'Debe tener billetes formateados');
    assert(formatted.formatted.coins.length > 0, 'Debe tener monedas formateadas');
    assert(formatted.formatted.display.total !== undefined, 'Debe tener total formateado');
    
    // Verificar formato de moneda
    assert(formatted.formatted.display.total.includes('€'), 'Total debe incluir símbolo de euro');
  }, 'advanced');

  test('Formato con opciones personalizadas', () => {
    const breakdown = {
      bills: { fifty: 1 },
      coins: { one: 0 } // Cantidad cero
    };
    
    const options = {
      showZeros: true,
      currency: ' EUR'
    };
    
    const formatted = calculator.formatForDisplay(breakdown, options);
    
    assert(formatted.success === true, 'Formato debe ser exitoso');
    
    // Verificar que se muestran los ceros
    const zeroCoins = formatted.formatted.coins.filter(coin => coin.count === 0);
    assert(zeroCoins.length > 0, 'Debe mostrar denominaciones con cantidad 0');
    
    // Verificar moneda personalizada
    assert(formatted.formatted.display.total.includes('EUR'), 'Debe usar moneda personalizada');
  }, 'advanced');

  test('Redondeo de precisión', () => {
    const value1 = 10.123456;
    const rounded1 = calculator.roundToPrecision(value1);
    assert(rounded1 === 10.12, `Esperado 10.12, obtenido ${rounded1}`);
    
    const value2 = 10.126;
    const rounded2 = calculator.roundToPrecision(value2);
    assert(rounded2 === 10.13, `Esperado 10.13, obtenido ${rounded2}`);
  }, 'advanced');

  // RESUMEN FINAL
  console.log('📊 RESUMEN DE PRUEBAS - CASH CALCULATOR');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  console.log('📋 Desglose por categoría:');
  Object.entries(results).forEach(([category, result]) => {
    const percentage = result.total > 0 ? ((result.passed/result.total) * 100).toFixed(1) : '0.0';
    console.log(`   ${category}: ${result.passed}/${result.total} (${percentage}%)`);
  });
  
  console.log('\n🎯 ESTADO DE LA TAREA 7.1:');
  if (passedTests === totalTests) {
    console.log('✅ TAREA 7.1 COMPLETADA');
    console.log('🚀 CashCalculator con desglose de billetes validado');
    console.log('📋 Requerimientos 6.1, 6.2, 6.3 implementados correctamente');
  } else {
    console.log('⚠️  TAREA 7.1 PENDIENTE');
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
  window.runCashCalculatorTests = runCashCalculatorTests;
} else if (typeof module !== 'undefined') {
  // En Node.js
  module.exports = { runCashCalculatorTests };
}

// Auto-ejecutar si se carga como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runCashCalculatorTests();
}