/**
 * Pruebas para sistema de persistencia y almacenamiento
 * 
 * Valida la funcionalidad de guardado, carga, eliminación con confirmación,
 * copias de seguridad y migración de datos.
 * 
 * Tarea 8.1: Crear sistema de persistencia en localStorage
 */

// Mock de localStorage para Node.js
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    data: {},
    getItem: function(key) {
      return this.data[key] || null;
    },
    setItem: function(key, value) {
      this.data[key] = value;
    },
    removeItem: function(key) {
      delete this.data[key];
    },
    clear: function() {
      this.data = {};
    }
  };
}

// Mock de window para Node.js
if (typeof window === 'undefined') {
  global.window = {
    ReconciliationTypes: {
      DEFAULT_RECONCILIATION_SETTINGS: {
        commissionRates: { freenow: 0.15, other: 0.10 },
        distributionRates: { driver: 0.40, owner: 0.60 },
        defaultCurrency: '€',
        dateFormat: 'DD/MM/YYYY',
        companyInfo: { name: '', taxId: '', address: '', phone: '', email: '' }
      }
    }
  };
}

// Mock de navigator para Node.js
if (typeof navigator === 'undefined') {
  global.navigator = {
    userAgent: 'Node.js Test Environment'
  };
}

// Cargar dependencias
if (typeof require !== 'undefined') {
  const ReconciliationStorageManager = require('./storage-manager.js');
  global.ReconciliationStorageManager = ReconciliationStorageManager;
}

/**
 * Suite de pruebas para sistema de persistencia
 */
function runStoragePersistenceTests() {
  console.log('🧪 PRUEBAS DEL SISTEMA DE PERSISTENCIA');
  console.log('='.repeat(60));
  console.log('Validando guardado, carga, eliminación y copias de seguridad\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = {
    basic: { passed: 0, total: 0 },
    persistence: { passed: 0, total: 0 },
    deletion: { passed: 0, total: 0 },
    backup: { passed: 0, total: 0 },
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

  // Crear instancia del storage manager
  const storage = new ReconciliationStorageManager();

  // Limpiar datos antes de empezar
  storage.clearAllData();

  // Datos de prueba
  const testService = {
    id: 'test-service-1',
    date: '2024-01-15',
    time: '10:30',
    totalAmount: 100,
    paymentType: 'card',
    platform: 'freenow'
  };

  const testExpense = {
    id: 'test-expense-1',
    date: '2024-01-15',
    description: 'Gasolina',
    amount: 50,
    category: 'fuel'
  };

  const testReconciliation = {
    id: 'test-reconciliation-1',
    period: {
      startDate: '2024-01-15',
      endDate: '2024-01-15'
    },
    services: [testService],
    expenses: [testExpense],
    summary: {
      totalServices: 100,
      totalExpenses: 50,
      netIncome: 50
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. PRUEBAS BÁSICAS DE PERSISTENCIA
  console.log('💾 VALIDANDO PERSISTENCIA BÁSICA');
  console.log('-'.repeat(40));

  test('Carga inicial de datos', () => {
    const loadResult = storage.loadInitialData();
    
    assert(loadResult.success === true, 'Carga inicial debe ser exitosa');
    assert(loadResult.services.loaded === true, 'Servicios deben cargarse');
    assert(loadResult.expenses.loaded === true, 'Gastos deben cargarse');
    assert(loadResult.reconciliations.loaded === true, 'Conciliaciones deben cargarse');
    assert(loadResult.settings.loaded === true, 'Configuración debe cargarse');
    assert(typeof loadResult.loadTime === 'number', 'Debe reportar tiempo de carga');
  }, 'basic');

  test('Información de almacenamiento', () => {
    const info = storage.getStorageInfo();
    
    assert(typeof info.services === 'number', 'Debe reportar cantidad de servicios');
    assert(typeof info.expenses === 'number', 'Debe reportar cantidad de gastos');
    assert(typeof info.reconciliations === 'number', 'Debe reportar cantidad de conciliaciones');
    assert(typeof info.totalSizeKB === 'number', 'Debe reportar tamaño en KB');
    assert(typeof info.usagePercentage === 'number', 'Debe reportar porcentaje de uso');
    assert(info.autoCleanupEnabled === true, 'Auto-limpieza debe estar habilitada');
  }, 'basic');

  test('Migración de datos', () => {
    const migrationResult = storage.migrateDataIfNeeded();
    
    assert(typeof migrationResult.migrated === 'boolean', 'Debe reportar si se migró');
    assert(Array.isArray(migrationResult.changes), 'Debe reportar cambios realizados');
    assert(Array.isArray(migrationResult.errors), 'Debe reportar errores de migración');
  }, 'basic');

  // 2. PRUEBAS DE PERSISTENCIA AVANZADA
  console.log('🔄 VALIDANDO PERSISTENCIA AVANZADA');
  console.log('-'.repeat(40));

  test('Guardado y actualización de conciliaciones', () => {
    // Guardar conciliación inicial
    const saveResult = storage.saveReconciliation(testReconciliation);
    assert(saveResult === true, 'Guardado inicial debe ser exitoso');
    
    // Verificar que se guardó
    const saved = storage.getReconciliation(testReconciliation.id);
    assert(saved !== null, 'Conciliación debe encontrarse');
    assert(saved.id === testReconciliation.id, 'ID debe coincidir');
    
    // Actualizar conciliación
    const updates = {
      summary: { ...testReconciliation.summary, totalServices: 150 },
      updatedAt: new Date().toISOString()
    };
    
    const updateResult = storage.updateReconciliation(testReconciliation.id, updates);
    assert(updateResult === true, 'Actualización debe ser exitosa');
    
    // Verificar actualización
    const updated = storage.getReconciliation(testReconciliation.id);
    assert(updated.summary.totalServices === 150, 'Actualización debe aplicarse');
    assert(updated.updatedAt !== testReconciliation.updatedAt, 'Fecha de actualización debe cambiar');
  }, 'persistence');

  test('Persistencia round-trip de servicios', () => {
    // Guardar servicio
    const saveResult = storage.saveService(testService);
    assert(saveResult === true, 'Guardado debe ser exitoso');
    
    // Cargar servicios
    const services = storage.getServices();
    const savedService = services.find(s => s.id === testService.id);
    
    assert(savedService !== undefined, 'Servicio debe encontrarse');
    assert(savedService.totalAmount === testService.totalAmount, 'Monto debe preservarse');
    assert(savedService.paymentType === testService.paymentType, 'Tipo de pago debe preservarse');
    assert(savedService.platform === testService.platform, 'Plataforma debe preservarse');
    
    // Actualizar servicio
    const updates = { totalAmount: 120, paymentType: 'cash' };
    const updateResult = storage.updateService(testService.id, updates);
    assert(updateResult === true, 'Actualización debe ser exitosa');
    
    // Verificar actualización
    const updatedServices = storage.getServices();
    const updatedService = updatedServices.find(s => s.id === testService.id);
    assert(updatedService.totalAmount === 120, 'Monto debe actualizarse');
    assert(updatedService.paymentType === 'cash', 'Tipo de pago debe actualizarse');
  }, 'persistence');

  test('Persistencia round-trip de gastos', () => {
    // Guardar gasto
    const saveResult = storage.saveExpense(testExpense);
    assert(saveResult === true, 'Guardado debe ser exitoso');
    
    // Cargar gastos
    const expenses = storage.getExpenses();
    const savedExpense = expenses.find(e => e.id === testExpense.id);
    
    assert(savedExpense !== undefined, 'Gasto debe encontrarse');
    assert(savedExpense.amount === testExpense.amount, 'Monto debe preservarse');
    assert(savedExpense.description === testExpense.description, 'Descripción debe preservarse');
    assert(savedExpense.category === testExpense.category, 'Categoría debe preservarse');
    
    // Actualizar gasto
    const updates = { amount: 75, description: 'Gasolina Premium' };
    const updateResult = storage.updateExpense(testExpense.id, updates);
    assert(updateResult === true, 'Actualización debe ser exitosa');
    
    // Verificar actualización
    const updatedExpenses = storage.getExpenses();
    const updatedExpense = updatedExpenses.find(e => e.id === testExpense.id);
    assert(updatedExpense.amount === 75, 'Monto debe actualizarse');
    assert(updatedExpense.description === 'Gasolina Premium', 'Descripción debe actualizarse');
  }, 'persistence');

  test('Verificación de integridad de datos', () => {
    // Agregar algunos datos duplicados intencionalmente para probar la verificación
    const duplicateService = { ...testService, id: testService.id };
    storage.saveService(duplicateService);
    
    const loadResult = storage.loadInitialData();
    
    // La verificación debe detectar problemas pero no fallar la carga
    assert(loadResult.success === true, 'Carga debe ser exitosa incluso con duplicados');
    assert(Array.isArray(loadResult.errors), 'Debe reportar errores encontrados');
  }, 'persistence');

  // 3. PRUEBAS DE ELIMINACIÓN CON CONFIRMACIÓN
  console.log('🗑️ VALIDANDO ELIMINACIÓN CON CONFIRMACIÓN');
  console.log('-'.repeat(40));

  test('Eliminación de servicio con confirmación', () => {
    // Intentar eliminar sin confirmación
    const withoutConfirmation = storage.deleteWithConfirmation('service', testService.id, false);
    
    assert(withoutConfirmation.success === false, 'Debe fallar sin confirmación');
    assert(withoutConfirmation.requiresConfirmation === true, 'Debe requerir confirmación');
    assert(typeof withoutConfirmation.message === 'string', 'Debe incluir mensaje');
    
    // Eliminar con confirmación
    const withConfirmation = storage.deleteWithConfirmation('service', testService.id, true);
    
    assert(withConfirmation.success === true, 'Debe ser exitoso con confirmación');
    assert(withConfirmation.deletedCount === 1, 'Debe reportar 1 elemento eliminado');
    
    // Verificar eliminación
    const services = storage.getServices();
    const deletedService = services.find(s => s.id === testService.id);
    assert(deletedService === undefined, 'Servicio debe estar eliminado');
  }, 'deletion');

  test('Eliminación de gasto con confirmación', () => {
    // Intentar eliminar sin confirmación
    const withoutConfirmation = storage.deleteWithConfirmation('expense', testExpense.id, false);
    
    assert(withoutConfirmation.requiresConfirmation === true, 'Debe requerir confirmación');
    
    // Eliminar con confirmación
    const withConfirmation = storage.deleteWithConfirmation('expense', testExpense.id, true);
    
    assert(withConfirmation.success === true, 'Debe ser exitoso con confirmación');
    assert(withConfirmation.deletedCount === 1, 'Debe reportar 1 elemento eliminado');
  }, 'deletion');

  test('Eliminación de conciliación con confirmación', () => {
    // Intentar eliminar sin confirmación
    const withoutConfirmation = storage.deleteWithConfirmation('reconciliation', testReconciliation.id, false);
    
    assert(withoutConfirmation.requiresConfirmation === true, 'Debe requerir confirmación');
    
    // Eliminar con confirmación
    const withConfirmation = storage.deleteWithConfirmation('reconciliation', testReconciliation.id, true);
    
    assert(withConfirmation.success === true, 'Debe ser exitoso con confirmación');
    assert(withConfirmation.deletedCount === 1, 'Debe reportar 1 elemento eliminado');
  }, 'deletion');

  test('Mensajes de confirmación apropiados', () => {
    const serviceMessage = storage.getConfirmationMessage('service', 'test-id');
    assert(serviceMessage.includes('servicio'), 'Mensaje debe mencionar servicio');
    assert(serviceMessage.includes('deshacer'), 'Debe advertir que no se puede deshacer');
    
    const expenseMessage = storage.getConfirmationMessage('expense', 'test-id');
    assert(expenseMessage.includes('gasto'), 'Mensaje debe mencionar gasto');
    
    const allMessage = storage.getConfirmationMessage('all');
    assert(allMessage.includes('TODOS'), 'Mensaje debe enfatizar eliminación total');
  }, 'deletion');

  // 4. PRUEBAS DE COPIAS DE SEGURIDAD
  console.log('💾 VALIDANDO COPIAS DE SEGURIDAD');
  console.log('-'.repeat(40));

  test('Creación de copia de seguridad', () => {
    // Agregar algunos datos para el backup
    storage.saveService({ ...testService, id: 'backup-service-1' });
    storage.saveExpense({ ...testExpense, id: 'backup-expense-1' });
    
    const backupResult = storage.createBackup();
    
    assert(backupResult.success === true, 'Creación de backup debe ser exitosa');
    assert(backupResult.backup !== undefined, 'Debe incluir datos de backup');
    assert(backupResult.backup.timestamp !== undefined, 'Debe incluir timestamp');
    assert(backupResult.backup.version !== undefined, 'Debe incluir versión');
    assert(backupResult.backup.data !== undefined, 'Debe incluir datos');
    assert(typeof backupResult.size === 'number', 'Debe reportar tamaño');
    
    // Verificar estructura de datos
    assert(Array.isArray(backupResult.backup.data.services), 'Debe incluir servicios');
    assert(Array.isArray(backupResult.backup.data.expenses), 'Debe incluir gastos');
    assert(backupResult.backup.data.services.length > 0, 'Debe tener servicios');
    assert(backupResult.backup.data.expenses.length > 0, 'Debe tener gastos');
  }, 'backup');

  test('Restauración desde copia de seguridad', () => {
    // Crear backup de datos actuales
    const currentBackup = storage.createBackup();
    assert(currentBackup.success === true, 'Backup inicial debe ser exitoso');
    
    // Limpiar datos y agregar datos diferentes
    storage.clearAllData();
    storage.saveService({ ...testService, id: 'different-service', totalAmount: 999 });
    
    // Intentar restaurar sin confirmación
    const withoutConfirmation = storage.restoreFromBackup(currentBackup.backup, false);
    
    assert(withoutConfirmation.success === false, 'Debe fallar sin confirmación');
    assert(withoutConfirmation.requiresConfirmation === true, 'Debe requerir confirmación');
    assert(withoutConfirmation.backupInfo !== undefined, 'Debe incluir info del backup');
    
    // Restaurar con confirmación
    const withConfirmation = storage.restoreFromBackup(currentBackup.backup, true);
    
    assert(withConfirmation.success === true, 'Restauración debe ser exitosa');
    assert(withConfirmation.restored !== undefined, 'Debe reportar elementos restaurados');
    
    // Verificar que los datos se restauraron
    const services = storage.getServices();
    const restoredService = services.find(s => s.id === 'backup-service-1');
    assert(restoredService !== undefined, 'Servicio del backup debe estar restaurado');
    
    const differentService = services.find(s => s.id === 'different-service');
    assert(differentService === undefined, 'Datos nuevos deben haber sido reemplazados');
  }, 'backup');

  test('Manejo de fecha de último backup', () => {
    // Crear backup para actualizar fecha
    const backupResult = storage.createBackup();
    assert(backupResult.success === true, 'Backup debe ser exitoso');
    
    // Verificar que se guardó la fecha
    const lastBackupDate = storage.getLastBackupDate();
    assert(lastBackupDate !== null, 'Debe tener fecha de último backup');
    assert(!isNaN(new Date(lastBackupDate).getTime()), 'Fecha debe ser válida');
    
    // Verificar que aparece en la información de almacenamiento
    const storageInfo = storage.getStorageInfo();
    assert(storageInfo.lastBackup !== undefined, 'Info debe incluir último backup');
  }, 'backup');

  test('Validación de estructura de backup', () => {
    // Intentar restaurar con backup inválido
    const invalidBackup = { invalid: true };
    const result = storage.restoreFromBackup(invalidBackup, true);
    
    assert(result.success === false, 'Debe fallar con backup inválido');
    assert(result.error !== undefined, 'Debe reportar error');
    assert(result.message.includes('backup') || result.message.includes('inválida') || result.message.includes('estructura'), 'Mensaje debe indicar problema con backup');
  }, 'backup');

  // 5. PRUEBAS AVANZADAS
  console.log('🚀 VALIDANDO FUNCIONALIDADES AVANZADAS');
  console.log('-'.repeat(40));

  test('Exportación e importación completa', () => {
    // Limpiar y agregar datos conocidos
    storage.clearAllData();
    storage.saveService({ ...testService, id: 'export-service' });
    storage.saveExpense({ ...testExpense, id: 'export-expense' });
    
    // Exportar datos
    const exportedData = storage.exportAllData();
    
    assert(exportedData.services !== undefined, 'Debe exportar servicios');
    assert(exportedData.expenses !== undefined, 'Debe exportar gastos');
    assert(exportedData.settings !== undefined, 'Debe exportar configuración');
    
    // Limpiar datos
    storage.clearAllData();
    
    // Verificar que están vacíos
    assert(storage.getServices().length === 0, 'Servicios deben estar vacíos');
    assert(storage.getExpenses().length === 0, 'Gastos deben estar vacíos');
    
    // Importar datos
    const importResult = storage.importAllData(exportedData);
    assert(importResult === true, 'Importación debe ser exitosa');
    
    // Verificar que se importaron
    const importedServices = storage.getServices();
    const importedExpenses = storage.getExpenses();
    
    assert(importedServices.length === 1, 'Debe haber 1 servicio importado');
    assert(importedExpenses.length === 1, 'Debe haber 1 gasto importado');
    assert(importedServices[0].id === 'export-service', 'Servicio debe coincidir');
    assert(importedExpenses[0].id === 'export-expense', 'Gasto debe coincidir');
  }, 'advanced');

  test('Limpieza automática de datos antiguos', () => {
    // Esta prueba simula el comportamiento de limpieza
    // En un entorno real, se ejecutaría cuando se exceda la cuota
    
    const initialInfo = storage.getStorageInfo();
    
    // Ejecutar limpieza manualmente
    storage.cleanupOldData();
    
    const afterCleanupInfo = storage.getStorageInfo();
    
    // La limpieza debe ejecutarse sin errores
    assert(typeof afterCleanupInfo.services === 'number', 'Debe reportar servicios después de limpieza');
    assert(typeof afterCleanupInfo.expenses === 'number', 'Debe reportar gastos después de limpieza');
  }, 'advanced');

  test('Manejo de errores de almacenamiento', () => {
    // Simular error de cuota excedida (difícil de probar directamente)
    // Verificar que los métodos manejan errores gracefully
    
    const result = storage.saveToStorage('test-key', { test: 'data' });
    assert(typeof result === 'boolean', 'Debe retornar boolean');
    
    const loaded = storage.loadFromStorage('non-existent-key', 'default');
    assert(loaded === 'default', 'Debe retornar valor por defecto para clave inexistente');
  }, 'advanced');

  test('Validación de datos almacenados', () => {
    // Probar validación con datos válidos
    const validServices = [{ id: 'test', date: '2024-01-01', totalAmount: 100 }];
    const isValid = storage.validateStoredData(storage.storageKeys.services, validServices);
    assert(isValid === true, 'Datos válidos deben pasar validación');
    
    // Probar validación con datos inválidos
    const invalidServices = [{ id: 'test' }]; // Falta date y totalAmount
    const isInvalid = storage.validateStoredData(storage.storageKeys.services, invalidServices);
    assert(isInvalid === false, 'Datos inválidos deben fallar validación');
    
    // Probar con datos null
    const nullValidation = storage.validateStoredData(storage.storageKeys.services, null);
    assert(nullValidation === false, 'Datos null deben fallar validación');
  }, 'advanced');

  // RESUMEN FINAL
  console.log('📊 RESUMEN DE PRUEBAS - SISTEMA DE PERSISTENCIA');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  console.log('📋 Desglose por categoría:');
  Object.entries(results).forEach(([category, result]) => {
    const percentage = result.total > 0 ? ((result.passed/result.total) * 100).toFixed(1) : '0.0';
    console.log(`   ${category}: ${result.passed}/${result.total} (${percentage}%)`);
  });
  
  console.log('\n🎯 ESTADO DE LA TAREA 8.1:');
  if (passedTests === totalTests) {
    console.log('✅ TAREA 8.1 COMPLETADA');
    console.log('🚀 Sistema de persistencia en localStorage validado');
    console.log('📋 Requerimientos 8.3, 8.4, 8.5 implementados correctamente');
  } else {
    console.log('⚠️  TAREA 8.1 PENDIENTE');
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
  window.runStoragePersistenceTests = runStoragePersistenceTests;
} else if (typeof module !== 'undefined') {
  // En Node.js
  module.exports = { runStoragePersistenceTests };
}

// Auto-ejecutar si se carga como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runStoragePersistenceTests();
}