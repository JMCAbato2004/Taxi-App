/**
 * Demo del ServiceManager con datos de ejemplo
 * Muestra la funcionalidad completa de gestión de servicios
 */

/**
 * Función para generar datos de ejemplo y probar el ServiceManager
 */
function demoServiceManager() {
  console.log('🚕 Demo del ServiceManager - Gestión de Servicios de Taxi\n');

  // Verificar que los componentes estén disponibles
  if (!window.ReconciliationStorageManager || !window.ServiceManager) {
    console.error('❌ Componentes requeridos no disponibles');
    return;
  }

  const storageManager = new window.ReconciliationStorageManager();

  // Limpiar datos existentes para el demo
  console.log('🧹 Limpiando datos existentes...');
  storageManager.clearAllData();

  // Datos de ejemplo para servicios
  const sampleServices = [
    {
      date: new Date('2024-01-15'),
      startTime: '08:30',
      totalAmount: 25.50,
      paymentType: 'cash',
      isArticulated: false
    },
    {
      date: new Date('2024-01-15'),
      startTime: '10:15',
      totalAmount: 45.00,
      paymentType: 'card',
      isArticulated: true
    },
    {
      date: new Date('2024-01-15'),
      startTime: '12:00',
      totalAmount: 30.00,
      paymentType: 'app',
      platform: 'freenow',
      isArticulated: false,
      commission: 4.50,
      incentives: 5.00,
      tips: 2.50
    },
    {
      date: new Date('2024-01-15'),
      startTime: '14:30',
      totalAmount: 18.75,
      paymentType: 'cash',
      isArticulated: false
    },
    {
      date: new Date('2024-01-16'),
      startTime: '09:00',
      totalAmount: 35.25,
      paymentType: 'app',
      platform: 'uber',
      isArticulated: false,
      commission: 3.50
    },
    {
      date: new Date('2024-01-16'),
      startTime: '11:45',
      totalAmount: 52.00,
      paymentType: 'card',
      isArticulated: true
    },
    {
      date: new Date('2024-01-16'),
      startTime: '16:20',
      totalAmount: 22.80,
      paymentType: 'cash',
      isArticulated: false
    },
    {
      date: new Date('2024-01-17'),
      startTime: '07:45',
      totalAmount: 28.90,
      paymentType: 'app',
      platform: 'freenow',
      isArticulated: false,
      commission: 4.34,
      incentives: 3.00,
      tips: 1.50
    }
  ];

  // Guardar servicios de ejemplo
  console.log('💾 Guardando servicios de ejemplo...');
  let savedCount = 0;
  sampleServices.forEach((service, index) => {
    const success = storageManager.saveService(service);
    if (success) {
      savedCount++;
      console.log(`✅ Servicio ${index + 1}: ${service.totalAmount}€ (${service.paymentType})`);
    } else {
      console.log(`❌ Error guardando servicio ${index + 1}`);
    }
  });

  console.log(`\n📊 Resumen: ${savedCount} servicios guardados de ${sampleServices.length} intentos\n`);

  // Obtener servicios guardados
  const savedServices = storageManager.getServices();
  console.log('📋 Servicios en almacenamiento:');
  console.log(`Total: ${savedServices.length} servicios`);

  // Calcular estadísticas
  const stats = {
    total: savedServices.length,
    totalAmount: savedServices.reduce((sum, s) => sum + s.totalAmount, 0),
    cash: savedServices.filter(s => s.paymentType === 'cash').length,
    card: savedServices.filter(s => s.paymentType === 'card').length,
    app: savedServices.filter(s => s.paymentType === 'app').length,
    articulated: savedServices.filter(s => s.isArticulated).length,
    freenow: savedServices.filter(s => s.platform === 'freenow').length
  };

  console.log('\n📈 Estadísticas:');
  console.log(`💰 Importe total: ${stats.totalAmount.toFixed(2)}€`);
  console.log(`💵 Efectivo: ${stats.cash} servicios`);
  console.log(`💳 Tarjeta: ${stats.card} servicios`);
  console.log(`📱 Aplicación: ${stats.app} servicios`);
  console.log(`🚌 Articulados: ${stats.articulated} servicios`);
  console.log(`🆓 Freenow: ${stats.freenow} servicios`);

  // Mostrar servicios por día
  console.log('\n📅 Servicios por día:');
  const servicesByDay = {};
  savedServices.forEach(service => {
    const dateKey = new Date(service.date).toDateString();
    if (!servicesByDay[dateKey]) {
      servicesByDay[dateKey] = [];
    }
    servicesByDay[dateKey].push(service);
  });

  Object.keys(servicesByDay).sort().forEach(dateKey => {
    const dayServices = servicesByDay[dateKey];
    const dayTotal = dayServices.reduce((sum, s) => sum + s.totalAmount, 0);
    console.log(`${dateKey}: ${dayServices.length} servicios, ${dayTotal.toFixed(2)}€`);
  });

  // Probar filtros
  console.log('\n🔍 Pruebas de filtrado:');
  
  const cashServices = savedServices.filter(s => s.paymentType === 'cash');
  console.log(`Servicios en efectivo: ${cashServices.length}`);
  
  const articulatedServices = savedServices.filter(s => s.isArticulated);
  console.log(`Servicios articulados: ${articulatedServices.length}`);
  
  const freenowServices = savedServices.filter(s => s.platform === 'freenow');
  console.log(`Servicios Freenow: ${freenowServices.length}`);

  // Probar ordenamiento
  console.log('\n📊 Pruebas de ordenamiento:');
  
  const sortedByAmount = [...savedServices].sort((a, b) => b.totalAmount - a.totalAmount);
  console.log(`Servicio más caro: ${sortedByAmount[0].totalAmount}€`);
  console.log(`Servicio más barato: ${sortedByAmount[sortedByAmount.length - 1].totalAmount}€`);

  const sortedByDate = [...savedServices].sort((a, b) => new Date(b.date) - new Date(a.date));
  console.log(`Servicio más reciente: ${new Date(sortedByDate[0].date).toDateString()}`);
  console.log(`Servicio más antiguo: ${new Date(sortedByDate[sortedByDate.length - 1].date).toDateString()}`);

  // Información de almacenamiento
  console.log('\n💾 Información de almacenamiento:');
  const storageInfo = storageManager.getStorageInfo();
  console.log(`Servicios almacenados: ${storageInfo.services}`);
  console.log(`Gastos almacenados: ${storageInfo.expenses}`);
  console.log(`Conciliaciones almacenadas: ${storageInfo.reconciliations}`);
  console.log(`Tamaño total: ${storageInfo.totalSizeKB} KB`);

  console.log('\n✅ Demo completado. Los servicios están listos para usar en el módulo de conciliación.');
  console.log('🚀 Abre el módulo de conciliación para ver los servicios en la interfaz.');

  return {
    services: savedServices,
    stats: stats,
    storageInfo: storageInfo
  };
}

/**
 * Función para limpiar datos del demo
 */
function clearDemoData() {
  console.log('🧹 Limpiando datos del demo...');
  
  if (!window.ReconciliationStorageManager) {
    console.error('❌ ReconciliationStorageManager no disponible');
    return false;
  }

  const storageManager = new window.ReconciliationStorageManager();
  const success = storageManager.clearAllData();
  
  if (success) {
    console.log('✅ Datos del demo limpiados correctamente');
  } else {
    console.log('❌ Error limpiando datos del demo');
  }

  return success;
}

/**
 * Función para mostrar el estado actual de los datos
 */
function showCurrentData() {
  console.log('📊 Estado actual de los datos:\n');
  
  if (!window.ReconciliationStorageManager) {
    console.error('❌ ReconciliationStorageManager no disponible');
    return;
  }

  const storageManager = new window.ReconciliationStorageManager();
  const services = storageManager.getServices();
  const expenses = storageManager.getExpenses();
  const reconciliations = storageManager.getReconciliations();

  console.log(`🚕 Servicios: ${services.length}`);
  console.log(`💰 Gastos: ${expenses.length}`);
  console.log(`📋 Conciliaciones: ${reconciliations.length}`);

  if (services.length > 0) {
    const totalAmount = services.reduce((sum, s) => sum + s.totalAmount, 0);
    console.log(`💵 Importe total de servicios: ${totalAmount.toFixed(2)}€`);
    
    const byType = {
      cash: services.filter(s => s.paymentType === 'cash').length,
      card: services.filter(s => s.paymentType === 'card').length,
      app: services.filter(s => s.paymentType === 'app').length
    };
    
    console.log(`Efectivo: ${byType.cash}, Tarjeta: ${byType.card}, App: ${byType.app}`);
  }

  const storageInfo = storageManager.getStorageInfo();
  console.log(`💾 Tamaño de almacenamiento: ${storageInfo.totalSizeKB} KB`);
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
  window.demoServiceManager = demoServiceManager;
  window.clearDemoData = clearDemoData;
  window.showCurrentData = showCurrentData;
}

// También exportar como módulo si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    demoServiceManager,
    clearDemoData,
    showCurrentData
  };
}