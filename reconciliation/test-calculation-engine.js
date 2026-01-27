/**
 * Pruebas para el CalculationEngine
 * Verificar que los métodos básicos funcionan correctamente según los requerimientos
 */

// Cargar el CalculationEngine
if (typeof require !== 'undefined') {
  const CalculationEngine = require('./calculation-engine.js');
  global.CalculationEngine = CalculationEngine;
} else if (typeof window !== 'undefined' && window.CalculationEngine) {
  // Ya está cargado globalmente
} else {
  console.error('CalculationEngine no está disponible');
}

/**
 * Función de prueba simple
 */
function runTests() {
  console.log('🧪 Iniciando pruebas del CalculationEngine...\n');
  
  const engine = new CalculationEngine();
  let passedTests = 0;
  let totalTests = 0;

  // Helper para ejecutar pruebas
  function test(name, testFn) {
    totalTests++;
    try {
      testFn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  // Helper para assertions
  function assertEqual(actual, expected, message = '') {
    if (Math.abs(actual - expected) > 0.01) {
      throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
  }

  function assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Assertion failed. ${message}`);
    }
  }

  // Pruebas de calculateCommission
  console.log('📊 Pruebas de calculateCommission:');
  
  test('Comisión Freenow 15%', () => {
    const result = engine.calculateCommission(100, 'freenow');
    assertEqual(result, 15, 'Comisión de 100€ en Freenow debe ser 15€');
  });

  test('Comisión otras plataformas 10%', () => {
    const result = engine.calculateCommission(100, 'other');
    assertEqual(result, 10, 'Comisión de 100€ en otras plataformas debe ser 10€');
  });

  test('Comisión con monto negativo', () => {
    const result = engine.calculateCommission(-50, 'freenow');
    assertEqual(result, 0, 'Comisión con monto negativo debe ser 0');
  });

  test('Comisión con redondeo', () => {
    const result = engine.calculateCommission(33.33, 'freenow');
    assertEqual(result, 5.00, 'Comisión debe redondearse correctamente');
  });

  // Pruebas de calculateDistribution
  console.log('\n📊 Pruebas de calculateDistribution:');
  
  test('Distribución 60% patrón', () => {
    const result = engine.calculateDistribution(1000, 0.6);
    assertEqual(result, 600, 'Distribución 60% de 1000€ debe ser 600€');
  });

  test('Distribución 40% taxista', () => {
    const result = engine.calculateDistribution(1000, 0.4);
    assertEqual(result, 400, 'Distribución 40% de 1000€ debe ser 400€');
  });

  test('Distribución con monto negativo', () => {
    const result = engine.calculateDistribution(-100, 0.6);
    assertEqual(result, 0, 'Distribución con monto negativo debe ser 0');
  });

  test('Distribución con porcentaje inválido', () => {
    const result = engine.calculateDistribution(100, 1.5);
    assertEqual(result, 0, 'Distribución con porcentaje > 1 debe ser 0');
  });

  // Pruebas de calculateDailyTotals
  console.log('\n📊 Pruebas de calculateDailyTotals:');
  
  const testDate = new Date('2024-01-15');
  const testServices = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      startTime: '08:00',
      totalAmount: 25.50,
      paymentType: 'cash',
      isArticulated: false
    },
    {
      id: '2',
      date: new Date('2024-01-15'),
      startTime: '09:30',
      totalAmount: 45.00,
      paymentType: 'card',
      isArticulated: true
    },
    {
      id: '3',
      date: new Date('2024-01-15'),
      startTime: '11:00',
      totalAmount: 30.00,
      paymentType: 'app',
      platform: 'freenow',
      isArticulated: false,
      incentives: 5.00,
      tips: 2.50
    },
    {
      id: '4',
      date: new Date('2024-01-16'), // Día diferente, no debe incluirse
      startTime: '10:00',
      totalAmount: 20.00,
      paymentType: 'cash',
      isArticulated: false
    }
  ];

  const testExpenses = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      concept: 'Gasolina',
      amount: 50.00,
      category: 'fuel'
    },
    {
      id: '2',
      date: new Date('2024-01-16'), // Día diferente, no debe incluirse
      concept: 'Mantenimiento',
      amount: 25.00,
      category: 'maintenance'
    }
  ];

  test('Cálculo de totales diarios básicos', () => {
    const result = engine.calculateDailyTotals(testServices, testExpenses, testDate);
    
    assertEqual(result.serviceStart, 3, 'Debe contar 3 servicios del día');
    assertEqual(result.totalService, 100.50, 'Total de servicios debe ser 100.50€');
    assertEqual(result.articulated, 45.00, 'Total articulados debe ser 45.00€');
    assertEqual(result.cashPayment, 25.50, 'Pago en efectivo debe ser 25.50€');
    assertEqual(result.cardPayment, 45.00, 'Pago con tarjeta debe ser 45.00€');
    assertEqual(result.appPayment, 30.00, 'Pago por app debe ser 30.00€');
    assertEqual(result.expenses, 50.00, 'Gastos deben ser 50.00€');
  });

  test('Cálculo de Freenow en totales diarios', () => {
    const result = engine.calculateDailyTotals(testServices, testExpenses, testDate);
    
    assertEqual(result.freenowTotal, 30.00, 'Total Freenow debe ser 30.00€');
    assertEqual(result.freenowCommission, 4.50, 'Comisión Freenow debe ser 4.50€ (15% de 30€)');
    // freenowNet = total - comisión + incentivos + propinas = 30 - 4.5 + 5 + 2.5 = 33
    assertEqual(result.freenowNet, 33.00, 'Freenow neto debe incluir incentivos y propinas');
  });

  test('Cálculo de distribuciones en totales diarios', () => {
    const result = engine.calculateDailyTotals(testServices, testExpenses, testDate);
    
    // Ingresos netos = 100.50 - 50.00 = 50.50
    const netIncome = 50.50;
    assertEqual(result.distribution60, netIncome * 0.6, 'Distribución 60% debe ser correcta');
    assertEqual(result.distribution40, netIncome * 0.4, 'Distribución 40% debe ser correcta');
  });

  // Pruebas de calculateCashTotal
  console.log('\n📊 Pruebas de calculateCashTotal:');
  
  test('Cálculo total de billetes', () => {
    const bills = {
      fifty: 2,    // 100€
      twenty: 3,   // 60€
      ten: 1,      // 10€
      five: 2,     // 10€
      two: 5,      // 10€
      one: 3,      // 3€
      cents: 150   // 1.50€
    };
    const result = engine.calculateCashTotal(bills);
    assertEqual(result, 194.50, 'Total de billetes debe ser 194.50€');
  });

  test('Cálculo con billetes vacíos', () => {
    const result = engine.calculateCashTotal(null);
    assertEqual(result, 0, 'Total con billetes null debe ser 0');
  });

  // Pruebas de calculateCashDifference
  console.log('\n📊 Pruebas de calculateCashDifference:');
  
  test('Diferencia de efectivo', () => {
    const bills = { twenty: 5 }; // 100€
    const result = engine.calculateCashDifference(95, bills);
    assertEqual(result, 5, 'Diferencia debe ser 5€ (100 - 95)');
  });

  // Pruebas de calculateFreenowExtras
  console.log('\n📊 Pruebas de calculateFreenowExtras:');
  
  test('Cálculo de extras Freenow con incentivos y propinas', () => {
    const servicesWithExtras = [
      {
        id: '1',
        platform: 'freenow',
        incentives: 10.00,
        tips: 5.50
      },
      {
        id: '2',
        platform: 'freenow',
        incentives: 8.00,
        tips: 3.25
      },
      {
        id: '3',
        platform: 'other', // No debe incluirse
        incentives: 5.00,
        tips: 2.00
      }
    ];
    
    const result = engine.calculateFreenowExtras(servicesWithExtras);
    assertEqual(result, 26.75, 'Extras Freenow debe ser 26.75€ (10+5.5+8+3.25)');
  });

  test('Cálculo de extras Freenow sin servicios', () => {
    const result = engine.calculateFreenowExtras([]);
    assertEqual(result, 0, 'Extras sin servicios debe ser 0');
  });

  test('Cálculo de extras Freenow con servicios sin extras', () => {
    const servicesWithoutExtras = [
      {
        id: '1',
        platform: 'freenow',
        totalAmount: 30.00
      }
    ];
    
    const result = engine.calculateFreenowExtras(servicesWithoutExtras);
    assertEqual(result, 0, 'Extras sin incentivos ni propinas debe ser 0');
  });

  // Pruebas de calculateExternalBalance
  console.log('\n📊 Pruebas de calculateExternalBalance:');
  
  test('Cálculo de saldo externo con diferencia de efectivo', () => {
    const summary = { totalCommission: 15.00 };
    const cashBreakdown = { difference: 5.00 };
    const services = [
      {
        platform: 'freenow',
        incentives: 10.00,
        tips: 2.50
      }
    ];
    
    const result = engine.calculateExternalBalance(summary, cashBreakdown, services);
    // 5.00 (diferencia) + 12.50 (extras) + 15.00 (comisiones) = 32.50
    assertEqual(result, 32.50, 'Saldo externo debe incluir diferencia, extras y comisiones');
  });

  test('Cálculo de saldo externo sin datos', () => {
    const result = engine.calculateExternalBalance({}, null, []);
    assertEqual(result, 0, 'Saldo externo sin datos debe ser 0');
  });

  // Pruebas de calculateFinalSettlement mejorado
  console.log('\n📊 Pruebas de calculateFinalSettlement mejorado:');
  
  test('Liquidación final con extras de Freenow', () => {
    const summary = {
      netIncome: 1000.00,
      totalCommission: 50.00
    };
    
    const cashBreakdown = {
      difference: 10.00
    };
    
    const services = [
      {
        platform: 'freenow',
        incentives: 20.00,
        tips: 15.00
      }
    ];
    
    const result = engine.calculateFinalSettlement(summary, cashBreakdown, services);
    
    assertEqual(result.driverAmount, 400.00, 'Taxista debe recibir 40% de 1000€');
    assertEqual(result.ownerAmount, 600.00, 'Patrón debe recibir 60% de 1000€');
    assertEqual(result.freenowExtras, 35.00, 'Extras Freenow debe ser 35€ (20+15)');
    // Saldo externo: 10 (diferencia) + 35 (extras) + 50 (comisiones) = 95
    assertEqual(result.externalBalance, 95.00, 'Saldo externo debe incluir todos los ajustes');
  });

  // Pruebas de integración completa
  console.log('\n📊 Pruebas de integración completa:');
  
  test('Generación de conciliación con extras Freenow', () => {
    const services = [
      {
        id: '1',
        date: new Date('2024-01-15'),
        totalAmount: 100.00,
        paymentType: 'app',
        platform: 'freenow',
        isArticulated: false,
        incentives: 15.00,
        tips: 8.50
      }
    ];
    
    const expenses = [
      {
        id: '1',
        date: new Date('2024-01-15'),
        amount: 20.00
      }
    ];
    
    const period = {
      start: new Date('2024-01-15'),
      end: new Date('2024-01-15')
    };
    
    const result = engine.generateReconciliation(services, expenses, period);
    
    assertTrue(result.summary.freenowExtras !== undefined, 'Resumen debe incluir extras de Freenow');
    assertEqual(result.summary.freenowExtras, 23.50, 'Extras en resumen debe ser 23.50€');
    assertEqual(result.finalSettlement.freenowExtras, 23.50, 'Extras en liquidación debe ser 23.50€');
    
    // Verificar que el saldo externo incluye las comisiones y extras
    const expectedCommission = 15.00; // 15% de 100€
    assertTrue(result.finalSettlement.externalBalance > expectedCommission, 'Saldo externo debe incluir comisiones y extras');
  });

  // Resumen de pruebas
  console.log(`\n📋 Resumen de pruebas:`);
  console.log(`✅ Pruebas pasadas: ${passedTests}`);
  console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}`);
  console.log(`📊 Total: ${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! El CalculationEngine funciona correctamente.');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisar la implementación.');
  }

  return { passed: passedTests, total: totalTests };
}

// Ejecutar pruebas si se ejecuta directamente
if (typeof window !== 'undefined') {
  // En el navegador, exponer la función globalmente
  window.runCalculationEngineTests = runTests;
} else if (typeof module !== 'undefined' && require.main === module) {
  // En Node.js, ejecutar directamente
  runTests();
}