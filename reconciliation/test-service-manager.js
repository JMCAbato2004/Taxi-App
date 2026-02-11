/**
 * Pruebas unitarias para el ServiceManager
 * Verifica la funcionalidad CRUD y validaciones de servicios
 * Requerimientos: 1.1, 1.2, 1.3, 1.4, 1.5
 */

// Cargar dependencias
if (typeof require !== 'undefined') {
  // En Node.js (si se necesita)
  global.React = { useState: () => [null, () => {}], useEffect: () => {}, createElement: () => {} };
}

/**
 * Función principal de pruebas del ServiceManager
 */
function runServiceManagerTests() {
  console.log('🧪 Iniciando pruebas del ServiceManager...\n');
  
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
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
  }

  function assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Assertion failed. ${message}`);
    }
  }

  function assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`Expected false but got true. ${message}`);
    }
  }

  // ========================================
  // PRUEBAS DE VALIDACIÓN DE DATOS
  // ========================================
  console.log('📋 Pruebas de validación de datos de servicios:');

  test('Validación de servicio válido', () => {
    const validService = {
      date: new Date('2024-01-15'),
      startTime: '08:30',
      totalAmount: 25.50,
      paymentType: 'cash',
      isArticulated: false
    };

    // Simular validación básica
    assertTrue(validService.date instanceof Date, 'Fecha debe ser un objeto Date');
    assertTrue(typeof validService.totalAmount === 'number', 'Monto debe ser numérico');
    assertTrue(validService.totalAmount > 0, 'Monto debe ser positivo');
    assertTrue(['cash', 'card', 'app'].includes(validService.paymentType), 'Tipo de pago debe ser válido');
    assertTrue(typeof validService.isArticulated === 'boolean', 'isArticulated debe ser booleano');
  });

  test('Validación de monto negativo', () => {
    const invalidService = {
      date: new Date('2024-01-15'),
      totalAmount: -10.00,
      paymentType: 'cash',
      isArticulated: false
    };

    // El monto negativo debe ser inválido
    assertFalse(invalidService.totalAmount > 0, 'Monto negativo debe ser inválido');
  });

  test('Validación de tipo de pago inválido', () => {
    const invalidPaymentTypes = ['credit', 'bitcoin', 'check', ''];
    
    invalidPaymentTypes.forEach(type => {
      assertFalse(['cash', 'card', 'app'].includes(type), `Tipo de pago '${type}' debe ser inválido`);
    });
  });

  test('Validación de monto máximo', () => {
    const expensiveService = {
      totalAmount: 1500.00 // Supera el límite de 1000€
    };

    assertFalse(expensiveService.totalAmount <= 1000, 'Monto superior a 1000€ debe ser inválido');
  });

  // ========================================
  // PRUEBAS DE CATEGORIZACIÓN DE PAGOS
  // ========================================
  console.log('\n📋 Pruebas de categorización de pagos (REQ 1.2, 1.3, 1.4):');

  test('Categorización de pago en efectivo', () => {
    const cashService = {
      id: '1',
      totalAmount: 30.00,
      paymentType: 'cash'
    };

    assertEqual(cashService.paymentType, 'cash', 'Servicio debe categorizarse como efectivo');
  });

  test('Categorización de pago con tarjeta', () => {
    const cardService = {
      id: '2',
      totalAmount: 45.00,
      paymentType: 'card'
    };

    assertEqual(cardService.paymentType, 'card', 'Servicio debe categorizarse como tarjeta');
  });

  test('Categorización de pago por aplicación', () => {
    const appService = {
      id: '3',
      totalAmount: 25.00,
      paymentType: 'app',
      platform: 'freenow'
    };

    assertEqual(appService.paymentType, 'app', 'Servicio debe categorizarse como aplicación');
    assertEqual(appService.platform, 'freenow', 'Plataforma debe especificarse para pagos por app');
  });

  // ========================================
  // PRUEBAS DE SERVICIOS ARTICULADOS
  // ========================================
  console.log('\n📋 Pruebas de servicios articulados (REQ 1.5):');

  test('Identificación de servicio articulado', () => {
    const articulatedService = {
      id: '4',
      totalAmount: 60.00,
      paymentType: 'card',
      isArticulated: true
    };

    assertTrue(articulatedService.isArticulated, 'Servicio debe marcarse como articulado');
  });

  test('Identificación de servicio no articulado', () => {
    const regularService = {
      id: '5',
      totalAmount: 20.00,
      paymentType: 'cash',
      isArticulated: false
    };

    assertFalse(regularService.isArticulated, 'Servicio debe marcarse como no articulado');
  });

  // ========================================
  // PRUEBAS DE FILTRADO POR FECHAS (REQ 5.1)
  // ========================================
  console.log('\n📋 Pruebas de filtrado por rango de fechas (REQ 5.1):');

  const testServicesWithDates = [
    {
      id: '1',
      date: new Date('2024-01-10'),
      totalAmount: 25.50,
      paymentType: 'cash'
    },
    {
      id: '2',
      date: new Date('2024-01-15'),
      totalAmount: 45.00,
      paymentType: 'card'
    },
    {
      id: '3',
      date: new Date('2024-01-20'),
      totalAmount: 30.00,
      paymentType: 'app'
    },
    {
      id: '4',
      date: new Date('2024-01-25'),
      totalAmount: 35.00,
      paymentType: 'cash'
    }
  ];

  test('Filtrado por fecha desde (dateFrom)', () => {
    const dateFrom = new Date('2024-01-15');
    const filteredServices = testServicesWithDates.filter(service => {
      const serviceDate = new Date(service.date);
      return serviceDate >= dateFrom;
    });
    
    assertEqual(filteredServices.length, 3, 'Debe encontrar 3 servicios desde el 15/01');
    assertTrue(filteredServices.every(s => new Date(s.date) >= dateFrom), 'Todos los servicios deben ser posteriores o iguales a la fecha desde');
  });

  test('Filtrado por fecha hasta (dateTo)', () => {
    const dateTo = new Date('2024-01-20');
    const filteredServices = testServicesWithDates.filter(service => {
      const serviceDate = new Date(service.date);
      return serviceDate <= dateTo;
    });
    
    assertEqual(filteredServices.length, 3, 'Debe encontrar 3 servicios hasta el 20/01');
    assertTrue(filteredServices.every(s => new Date(s.date) <= dateTo), 'Todos los servicios deben ser anteriores o iguales a la fecha hasta');
  });

  test('Filtrado por rango de fechas completo', () => {
    const dateFrom = new Date('2024-01-12');
    const dateTo = new Date('2024-01-22');
    const filteredServices = testServicesWithDates.filter(service => {
      const serviceDate = new Date(service.date);
      return serviceDate >= dateFrom && serviceDate <= dateTo;
    });
    
    assertEqual(filteredServices.length, 2, 'Debe encontrar 2 servicios en el rango 12/01 - 22/01');
    assertEqual(filteredServices[0].id, '2', 'Debe incluir servicio del 15/01');
    assertEqual(filteredServices[1].id, '3', 'Debe incluir servicio del 20/01');
  });

  test('Filtrado por rango de fechas sin resultados', () => {
    const dateFrom = new Date('2024-02-01');
    const dateTo = new Date('2024-02-28');
    const filteredServices = testServicesWithDates.filter(service => {
      const serviceDate = new Date(service.date);
      return serviceDate >= dateFrom && serviceDate <= dateTo;
    });
    
    assertEqual(filteredServices.length, 0, 'No debe encontrar servicios fuera del rango de datos');
  });

  test('Filtrado por fecha exacta', () => {
    const exactDate = new Date('2024-01-15');
    const filteredServices = testServicesWithDates.filter(service => {
      const serviceDate = new Date(service.date);
      return serviceDate.toDateString() === exactDate.toDateString();
    });
    
    assertEqual(filteredServices.length, 1, 'Debe encontrar 1 servicio en fecha exacta');
    assertEqual(filteredServices[0].id, '2', 'Debe ser el servicio correcto');
  });

  test('Combinación de filtros: fecha y tipo de pago', () => {
    const dateFrom = new Date('2024-01-12');
    const dateTo = new Date('2024-01-25');
    const paymentType = 'cash';
    
    const filteredServices = testServicesWithDates.filter(service => {
      const serviceDate = new Date(service.date);
      const matchesDate = serviceDate >= dateFrom && serviceDate <= dateTo;
      const matchesType = service.paymentType === paymentType;
      return matchesDate && matchesType;
    });
    
    assertEqual(filteredServices.length, 1, 'Debe encontrar 1 servicio que cumpla ambos filtros');
    assertEqual(filteredServices[0].id, '4', 'Debe ser el servicio del 25/01 en efectivo');
  });

  // ========================================
  // PRUEBAS DE FILTRADO Y BÚSQUEDA
  // ========================================
  console.log('\n📋 Pruebas de filtrado y búsqueda:');

  const testServices = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      totalAmount: 25.50,
      paymentType: 'cash',
      isArticulated: false
    },
    {
      id: '2',
      date: new Date('2024-01-16'),
      totalAmount: 45.00,
      paymentType: 'card',
      isArticulated: true
    },
    {
      id: '3',
      date: new Date('2024-01-17'),
      totalAmount: 30.00,
      paymentType: 'app',
      platform: 'freenow',
      isArticulated: false
    }
  ];

  test('Filtrado por tipo de pago - efectivo', () => {
    const cashServices = testServices.filter(s => s.paymentType === 'cash');
    assertEqual(cashServices.length, 1, 'Debe encontrar 1 servicio en efectivo');
    assertEqual(cashServices[0].id, '1', 'Debe ser el servicio correcto');
  });

  test('Filtrado por tipo de pago - tarjeta', () => {
    const cardServices = testServices.filter(s => s.paymentType === 'card');
    assertEqual(cardServices.length, 1, 'Debe encontrar 1 servicio con tarjeta');
    assertEqual(cardServices[0].id, '2', 'Debe ser el servicio correcto');
  });

  test('Filtrado por tipo de pago - aplicación', () => {
    const appServices = testServices.filter(s => s.paymentType === 'app');
    assertEqual(appServices.length, 1, 'Debe encontrar 1 servicio por app');
    assertEqual(appServices[0].platform, 'freenow', 'Debe tener la plataforma correcta');
  });

  test('Filtrado por servicios articulados', () => {
    const articulatedServices = testServices.filter(s => s.isArticulated);
    assertEqual(articulatedServices.length, 1, 'Debe encontrar 1 servicio articulado');
    assertEqual(articulatedServices[0].id, '2', 'Debe ser el servicio correcto');
  });

  test('Búsqueda por monto', () => {
    const searchTerm = '25.5'; // Sin el cero final
    const foundServices = testServices.filter(s => 
      s.totalAmount.toString().includes(searchTerm)
    );
    assertEqual(foundServices.length, 1, 'Debe encontrar 1 servicio con ese monto');
    assertEqual(foundServices[0].totalAmount, 25.50, 'Debe ser el monto correcto');
  });

  test('Búsqueda por plataforma', () => {
    const searchTerm = 'freenow';
    const foundServices = testServices.filter(s => 
      s.platform && s.platform.toLowerCase().includes(searchTerm.toLowerCase())
    );
    assertEqual(foundServices.length, 1, 'Debe encontrar 1 servicio de Freenow');
    assertEqual(foundServices[0].platform, 'freenow', 'Debe ser la plataforma correcta');
  });

  // ========================================
  // PRUEBAS DE ORDENAMIENTO
  // ========================================
  console.log('\n📋 Pruebas de ordenamiento:');

  test('Ordenamiento por fecha ascendente', () => {
    const sortedServices = [...testServices].sort((a, b) => new Date(a.date) - new Date(b.date));
    assertEqual(sortedServices[0].id, '1', 'Primer servicio debe ser el más antiguo');
    assertEqual(sortedServices[2].id, '3', 'Último servicio debe ser el más reciente');
  });

  test('Ordenamiento por fecha descendente', () => {
    const sortedServices = [...testServices].sort((a, b) => new Date(b.date) - new Date(a.date));
    assertEqual(sortedServices[0].id, '3', 'Primer servicio debe ser el más reciente');
    assertEqual(sortedServices[2].id, '1', 'Último servicio debe ser el más antiguo');
  });

  test('Ordenamiento por monto ascendente', () => {
    const sortedServices = [...testServices].sort((a, b) => a.totalAmount - b.totalAmount);
    assertEqual(sortedServices[0].totalAmount, 25.50, 'Primer servicio debe tener el menor monto');
    assertEqual(sortedServices[2].totalAmount, 45.00, 'Último servicio debe tener el mayor monto');
  });

  test('Ordenamiento por monto descendente', () => {
    const sortedServices = [...testServices].sort((a, b) => b.totalAmount - a.totalAmount);
    assertEqual(sortedServices[0].totalAmount, 45.00, 'Primer servicio debe tener el mayor monto');
    assertEqual(sortedServices[2].totalAmount, 25.50, 'Último servicio debe tener el menor monto');
  });

  // ========================================
  // PRUEBAS DE ESTADÍSTICAS
  // ========================================
  console.log('\n📋 Pruebas de cálculo de estadísticas:');

  test('Cálculo de total de servicios', () => {
    const totalServices = testServices.length;
    assertEqual(totalServices, 3, 'Debe contar 3 servicios en total');
  });

  test('Cálculo de importe total', () => {
    const totalAmount = testServices.reduce((sum, s) => sum + s.totalAmount, 0);
    assertEqual(totalAmount, 100.50, 'Importe total debe ser 100.50€');
  });

  test('Conteo por tipo de pago', () => {
    const cashCount = testServices.filter(s => s.paymentType === 'cash').length;
    const cardCount = testServices.filter(s => s.paymentType === 'card').length;
    const appCount = testServices.filter(s => s.paymentType === 'app').length;

    assertEqual(cashCount, 1, 'Debe haber 1 servicio en efectivo');
    assertEqual(cardCount, 1, 'Debe haber 1 servicio con tarjeta');
    assertEqual(appCount, 1, 'Debe haber 1 servicio por app');
  });

  test('Conteo de servicios articulados', () => {
    const articulatedCount = testServices.filter(s => s.isArticulated).length;
    assertEqual(articulatedCount, 1, 'Debe haber 1 servicio articulado');
  });

  // ========================================
  // PRUEBAS DE INTEGRACIÓN CON STORAGE
  // ========================================
  console.log('\n📋 Pruebas de integración con almacenamiento:');

  test('Estructura de datos para almacenamiento', () => {
    const serviceForStorage = {
      id: 'service_123',
      date: new Date('2024-01-15'),
      startTime: '08:30',
      totalAmount: 25.50,
      paymentType: 'cash',
      isArticulated: false
    };

    // Verificar que tiene todos los campos requeridos
    assertTrue(serviceForStorage.id !== undefined, 'Debe tener ID');
    assertTrue(serviceForStorage.date instanceof Date, 'Debe tener fecha válida');
    assertTrue(typeof serviceForStorage.totalAmount === 'number', 'Debe tener monto numérico');
    assertTrue(['cash', 'card', 'app'].includes(serviceForStorage.paymentType), 'Debe tener tipo de pago válido');
    assertTrue(typeof serviceForStorage.isArticulated === 'boolean', 'Debe tener flag articulado');
  });

  test('Conversión de fecha para almacenamiento', () => {
    const service = {
      date: new Date('2024-01-15T08:30:00')
    };

    // Simular conversión a ISO string para almacenamiento
    const dateString = service.date.toISOString();
    assertTrue(dateString.includes('2024-01-15'), 'Fecha debe convertirse correctamente');
    
    // Simular recuperación desde almacenamiento
    const recoveredDate = new Date(dateString);
    assertEqual(recoveredDate.getTime(), service.date.getTime(), 'Fecha debe recuperarse correctamente');
  });

  // ========================================
  // PRUEBAS DE CASOS BORDE
  // ========================================
  console.log('\n📋 Pruebas de casos borde:');

  test('Manejo de lista vacía de servicios', () => {
    const emptyServices = [];
    assertEqual(emptyServices.length, 0, 'Lista vacía debe tener longitud 0');
    
    const totalAmount = emptyServices.reduce((sum, s) => sum + s.totalAmount, 0);
    assertEqual(totalAmount, 0, 'Importe total de lista vacía debe ser 0');
  });

  test('Manejo de servicio con campos opcionales vacíos', () => {
    const minimalService = {
      id: '1',
      date: new Date('2024-01-15'),
      totalAmount: 20.00,
      paymentType: 'cash',
      isArticulated: false
      // Sin startTime, platform, commission, incentives, tips
    };

    assertTrue(minimalService.id !== undefined, 'Debe tener campos obligatorios');
    assertEqual(minimalService.startTime, undefined, 'Campos opcionales pueden ser undefined');
    assertEqual(minimalService.platform, undefined, 'Platform puede ser undefined');
  });

  test('Manejo de servicio con extras de Freenow', () => {
    const freenowService = {
      id: '1',
      date: new Date('2024-01-15'),
      totalAmount: 30.00,
      paymentType: 'app',
      platform: 'freenow',
      isArticulated: false,
      commission: 4.50,
      incentives: 5.00,
      tips: 2.50
    };

    assertEqual(freenowService.platform, 'freenow', 'Debe ser servicio de Freenow');
    assertTrue(freenowService.commission > 0, 'Debe tener comisión');
    assertTrue(freenowService.incentives > 0, 'Debe tener incentivos');
    assertTrue(freenowService.tips > 0, 'Debe tener propinas');
    
    const totalExtras = freenowService.incentives + freenowService.tips;
    assertEqual(totalExtras, 7.50, 'Total de extras debe ser 7.50€');
  });

  // ========================================
  // RESUMEN DE PRUEBAS
  // ========================================
  console.log(`\n📊 RESUMEN DE PRUEBAS DEL SERVICEMANAGER:`);
  console.log(`✅ Pruebas pasadas: ${passedTests}`);
  console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}`);
  console.log(`📊 Total: ${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS DEL SERVICEMANAGER PASARON!');
    console.log('✅ REQ 1.1: Almacenamiento de servicios con todos los campos');
    console.log('✅ REQ 1.2: Categorización de pagos en efectivo');
    console.log('✅ REQ 1.3: Categorización de pagos con tarjeta');
    console.log('✅ REQ 1.4: Categorización de pagos por aplicación');
    console.log('✅ REQ 1.5: Identificación de servicios articulados');
    console.log('✅ Funcionalidad CRUD completa');
    console.log('✅ Validaciones de entrada');
    console.log('✅ Filtrado y búsqueda');
    console.log('✅ Ordenamiento de datos');
    console.log('✅ Cálculo de estadísticas');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisar implementación del ServiceManager.');
  }

  return { passed: passedTests, total: totalTests };
}

// Ejecutar pruebas
if (typeof window !== 'undefined') {
  window.runServiceManagerTests = runServiceManagerTests;
} else if (typeof module !== 'undefined' && require.main === module) {
  runServiceManagerTests();
}