/**
 * Pruebas específicas para verificar los requerimientos de la tarea 2.1
 * - Implementar calculateCommission para diferentes plataformas
 * - Implementar calculateDistribution para reparto 60/40
 * - Implementar calculateDailyTotals para totales por día
 * - Requerimientos: 2.1, 2.2, 3.1, 3.2
 */

// Cargar el CalculationEngine
if (typeof require !== 'undefined') {
  const CalculationEngine = require('./calculation-engine.js');
  global.CalculationEngine = CalculationEngine;
}

function runRequirementsTests() {
  console.log('🎯 Verificando requerimientos específicos de la tarea 2.1...\n');
  
  const engine = new CalculationEngine();
  let passedTests = 0;
  let totalTests = 0;

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

  function assertEqual(actual, expected, message = '') {
    if (Math.abs(actual - expected) > 0.01) {
      throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
  }

  // ========================================
  // REQUERIMIENTO 2.1: Cálculo de comisiones según porcentaje configurado
  // ========================================
  console.log('📋 Requerimiento 2.1: Cálculo de comisiones Freenow');
  
  test('REQ 2.1 - Comisión Freenow 15% configurada', () => {
    const result = engine.calculateCommission(100, 'freenow');
    assertEqual(result, 15, 'Comisión Freenow debe ser 15% del monto');
  });

  test('REQ 2.1 - Comisión otras plataformas 10% configurada', () => {
    const result = engine.calculateCommission(100, 'other');
    assertEqual(result, 10, 'Comisión otras plataformas debe ser 10% del monto');
  });

  test('REQ 2.1 - Comisión con diferentes montos', () => {
    assertEqual(engine.calculateCommission(50, 'freenow'), 7.5, 'Comisión 50€ Freenow');
    assertEqual(engine.calculateCommission(200, 'freenow'), 30, 'Comisión 200€ Freenow');
    assertEqual(engine.calculateCommission(33.33, 'freenow'), 5.00, 'Comisión con redondeo');
  });

  // ========================================
  // REQUERIMIENTO 2.2: Total neto = total - comisión
  // ========================================
  console.log('\n📋 Requerimiento 2.2: Cálculo de total neto Freenow');
  
  test('REQ 2.2 - Verificar cálculo neto en totales diarios', () => {
    const services = [{
      id: '1',
      date: new Date('2024-01-15'),
      totalAmount: 100,
      paymentType: 'app',
      platform: 'freenow',
      isArticulated: false,
      incentives: 10,
      tips: 5
    }];
    
    const result = engine.calculateDailyTotals(services, [], new Date('2024-01-15'));
    
    // Total Freenow = 100
    assertEqual(result.freenowTotal, 100, 'Total Freenow debe ser 100€');
    
    // Comisión = 15% de 100 = 15
    assertEqual(result.freenowCommission, 15, 'Comisión debe ser 15€');
    
    // Neto = 100 - 15 + 10 + 5 = 100
    assertEqual(result.freenowNet, 100, 'Neto debe incluir incentivos y propinas');
  });

  // ========================================
  // REQUERIMIENTO 3.1: Distribución 60% para el patrón
  // ========================================
  console.log('\n📋 Requerimiento 3.1: Distribución 60% para el patrón');
  
  test('REQ 3.1 - Distribución 60% patrón', () => {
    const result = engine.calculateDistribution(1000, 0.6);
    assertEqual(result, 600, 'Patrón debe recibir 60% de los ingresos netos');
  });

  test('REQ 3.1 - Distribución 60% con diferentes montos', () => {
    assertEqual(engine.calculateDistribution(500, 0.6), 300, 'Distribución 60% de 500€');
    assertEqual(engine.calculateDistribution(150.75, 0.6), 90.45, 'Distribución 60% con decimales');
  });

  // ========================================
  // REQUERIMIENTO 3.2: Distribución 40% para el taxista
  // ========================================
  console.log('\n📋 Requerimiento 3.2: Distribución 40% para el taxista');
  
  test('REQ 3.2 - Distribución 40% taxista', () => {
    const result = engine.calculateDistribution(1000, 0.4);
    assertEqual(result, 400, 'Taxista debe recibir 40% de los ingresos netos');
  });

  test('REQ 3.2 - Distribución 40% con diferentes montos', () => {
    assertEqual(engine.calculateDistribution(500, 0.4), 200, 'Distribución 40% de 500€');
    assertEqual(engine.calculateDistribution(150.75, 0.4), 60.30, 'Distribución 40% con decimales');
  });

  // ========================================
  // VERIFICACIÓN: Suma de distribuciones = 100%
  // ========================================
  console.log('\n📋 Verificación: Suma de distribuciones debe ser 100%');
  
  test('Suma distribuciones 60% + 40% = 100%', () => {
    const amount = 1000;
    const owner = engine.calculateDistribution(amount, 0.6);
    const driver = engine.calculateDistribution(amount, 0.4);
    assertEqual(owner + driver, amount, 'Suma de distribuciones debe ser igual al monto original');
  });

  // ========================================
  // PRUEBA INTEGRAL: calculateDailyTotals
  // ========================================
  console.log('\n📋 Prueba integral: calculateDailyTotals con todos los requerimientos');
  
  test('Integración completa de cálculos diarios', () => {
    const services = [
      {
        id: '1',
        date: new Date('2024-01-15'),
        totalAmount: 50,
        paymentType: 'cash',
        isArticulated: false
      },
      {
        id: '2',
        date: new Date('2024-01-15'),
        totalAmount: 80,
        paymentType: 'app',
        platform: 'freenow',
        isArticulated: true,
        incentives: 5,
        tips: 3
      },
      {
        id: '3',
        date: new Date('2024-01-15'),
        totalAmount: 30,
        paymentType: 'card',
        isArticulated: false
      }
    ];

    const expenses = [{
      id: '1',
      date: new Date('2024-01-15'),
      amount: 40,
      concept: 'Gasolina'
    }];

    const result = engine.calculateDailyTotals(services, expenses, new Date('2024-01-15'));

    // Verificar totales básicos
    assertEqual(result.serviceStart, 3, 'Debe contar 3 servicios');
    assertEqual(result.totalService, 160, 'Total servicios: 50+80+30=160€');
    assertEqual(result.articulated, 80, 'Articulados: solo el servicio de 80€');
    assertEqual(result.cashPayment, 50, 'Efectivo: 50€');
    assertEqual(result.appPayment, 80, 'App: 80€');
    assertEqual(result.cardPayment, 30, 'Tarjeta: 30€');
    assertEqual(result.expenses, 40, 'Gastos: 40€');

    // Verificar cálculos Freenow (REQ 2.1, 2.2)
    assertEqual(result.freenowTotal, 80, 'Total Freenow: 80€');
    assertEqual(result.freenowCommission, 12, 'Comisión Freenow: 15% de 80€ = 12€');
    assertEqual(result.freenowNet, 76, 'Neto Freenow: 80-12+5+3 = 76€');

    // Verificar distribuciones (REQ 3.1, 3.2)
    const netIncome = 160 - 40; // 120€
    assertEqual(result.distribution60, 72, 'Distribución 60%: 120€ * 0.6 = 72€');
    assertEqual(result.distribution40, 48, 'Distribución 40%: 120€ * 0.4 = 48€');
  });

  // ========================================
  // CASOS BORDE Y VALIDACIONES
  // ========================================
  console.log('\n📋 Casos borde y validaciones');
  
  test('Manejo de montos negativos en comisiones', () => {
    const result = engine.calculateCommission(-100, 'freenow');
    assertEqual(result, 0, 'Comisión con monto negativo debe ser 0');
  });

  test('Manejo de porcentajes inválidos en distribución', () => {
    assertEqual(engine.calculateDistribution(100, -0.1), 0, 'Porcentaje negativo debe retornar 0');
    assertEqual(engine.calculateDistribution(100, 1.5), 0, 'Porcentaje > 1 debe retornar 0');
  });

  test('Cálculos con servicios vacíos', () => {
    const result = engine.calculateDailyTotals([], [], new Date('2024-01-15'));
    assertEqual(result.serviceStart, 0, 'Sin servicios debe ser 0');
    assertEqual(result.totalService, 0, 'Total servicios debe ser 0');
    assertEqual(result.freenowTotal, 0, 'Total Freenow debe ser 0');
    assertEqual(result.distribution60, 0, 'Distribución 60% debe ser 0');
    assertEqual(result.distribution40, 0, 'Distribución 40% debe ser 0');
  });

  // Resumen final
  console.log(`\n📊 RESUMEN DE VERIFICACIÓN DE REQUERIMIENTOS:`);
  console.log(`✅ Pruebas pasadas: ${passedTests}`);
  console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}`);
  console.log(`📊 Total: ${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ¡TODOS LOS REQUERIMIENTOS VERIFICADOS CORRECTAMENTE!');
    console.log('✅ REQ 2.1: Cálculo de comisiones para diferentes plataformas');
    console.log('✅ REQ 2.2: Cálculo de total neto Freenow');
    console.log('✅ REQ 3.1: Distribución 60% para el patrón');
    console.log('✅ REQ 3.2: Distribución 40% para el taxista');
    console.log('✅ Método calculateDailyTotals implementado correctamente');
  } else {
    console.log('\n⚠️  Algunos requerimientos no se cumplen. Revisar implementación.');
  }

  return { passed: passedTests, total: totalTests };
}

// Ejecutar pruebas
if (typeof window !== 'undefined') {
  window.runRequirementsTests = runRequirementsTests;
} else if (typeof module !== 'undefined' && require.main === module) {
  runRequirementsTests();
}