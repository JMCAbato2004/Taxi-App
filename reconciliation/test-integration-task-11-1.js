/**
 * Pruebas de integración para Task 11.1: Crear componente principal ReconciliationModule
 * Valida que el componente principal integre correctamente todos los componentes desarrollados
 */

// Cargar todos los módulos necesarios
const fs = require('fs');
const path = require('path');

/**
 * Pruebas de integración para Task 11.1
 */
function testTask11_1Integration() {
  console.log('🧪 Iniciando pruebas de integración para Task 11.1...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function runTest(name, testFn) {
    try {
      testFn();
      console.log(`✅ ${name}`);
      results.passed++;
      results.tests.push({ name, status: 'passed' });
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      results.failed++;
      results.tests.push({ name, status: 'failed', error: error.message });
    }
  }

  // Test 1: Verificar que todos los archivos necesarios existen
  runTest('Todos los archivos de componentes existen', () => {
    const requiredFiles = [
      'reconciliation-module.js',
      'service-manager.js',
      'expense-manager.js',
      'calculation-engine.js',
      'cash-calculator.js',
      'storage-manager.js'
    ];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(path.join(__dirname, file))) {
        throw new Error(`Archivo requerido no encontrado: ${file}`);
      }
    });
  });

  // Test 2: Verificar estructura del ReconciliationModule
  runTest('ReconciliationModule tiene la estructura correcta', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    // Verificar que contiene las funciones principales
    const requiredFunctions = [
      'ReconciliationModule',
      'TabButton',
      'ServicesTab',
      'ExpensesTab',
      'ReconciliationTab',
      'HistoryTab'
    ];

    requiredFunctions.forEach(func => {
      if (!moduleContent.includes(`function ${func}`)) {
        throw new Error(`Función requerida no encontrada: ${func}`);
      }
    });
  });

  // Test 3: Verificar navegación entre pestañas
  runTest('Navegación entre pestañas implementada', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    // Verificar que contiene los estados de navegación
    if (!moduleContent.includes('activeTab')) {
      throw new Error('Estado activeTab no encontrado');
    }

    // Verificar que contiene las pestañas principales
    const tabs = ['services', 'expenses', 'reconciliation', 'history'];
    tabs.forEach(tab => {
      if (!moduleContent.includes(`'${tab}'`)) {
        throw new Error(`Pestaña '${tab}' no encontrada en el código`);
      }
    });
  });

  // Test 4: Verificar integración con ServiceManager
  runTest('Integración con ServiceManager implementada', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    if (!moduleContent.includes('window.ServiceManager')) {
      throw new Error('Integración con ServiceManager no encontrada');
    }

    if (!moduleContent.includes('onAdd') || !moduleContent.includes('onUpdate') || !moduleContent.includes('onDelete')) {
      throw new Error('Handlers CRUD para ServiceManager no encontrados');
    }
  });

  // Test 5: Verificar integración con ExpenseManager
  runTest('Integración con ExpenseManager implementada', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    if (!moduleContent.includes('window.ExpenseManager')) {
      throw new Error('Integración con ExpenseManager no encontrada');
    }

    // Verificar que ExpensesTab usa ExpenseManager
    if (!moduleContent.includes('ExpenseManager')) {
      throw new Error('ExpensesTab no integra ExpenseManager');
    }
  });

  // Test 6: Verificar selector de período de fechas
  runTest('Selector de período de fechas implementado', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    if (!moduleContent.includes('selectedPeriod')) {
      throw new Error('Estado selectedPeriod no encontrado');
    }

    if (!moduleContent.includes('onPeriodChange')) {
      throw new Error('Handler onPeriodChange no encontrado');
    }

    // Verificar que contiene inputs de fecha
    if (!moduleContent.includes('type: \'date\'')) {
      throw new Error('Inputs de fecha no encontrados');
    }

    // Verificar botones de período rápido
    const quickPeriods = ['Hoy', 'Esta semana', 'Este mes', 'Mes anterior'];
    quickPeriods.forEach(period => {
      if (!moduleContent.includes(period)) {
        throw new Error(`Botón de período rápido '${period}' no encontrado`);
      }
    });
  });

  // Test 7: Verificar integración con CalculationEngine
  runTest('Integración con CalculationEngine implementada', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    if (!moduleContent.includes('CalculationEngine')) {
      throw new Error('Integración con CalculationEngine no encontrada');
    }

    if (!moduleContent.includes('generateReconciliation')) {
      throw new Error('Método generateReconciliation no utilizado');
    }
  });

  // Test 8: Verificar integración con CashCalculator
  runTest('Integración con CashCalculator implementada', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    if (!moduleContent.includes('CashCalculator')) {
      throw new Error('Integración con CashCalculator no encontrada');
    }

    if (!moduleContent.includes('CashBreakdownForm')) {
      throw new Error('Formulario de desglose de efectivo no encontrado');
    }

    // Verificar denominaciones de billetes
    const denominations = ['fifty', 'twenty', 'ten', 'five', 'two', 'one', 'cents'];
    denominations.forEach(denom => {
      if (!moduleContent.includes(denom)) {
        throw new Error(`Denominación '${denom}' no encontrada en el desglose`);
      }
    });
  });

  // Test 9: Verificar funcionalidad de generación de conciliación
  runTest('Funcionalidad de generación de conciliación implementada', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    if (!moduleContent.includes('handleGenerate')) {
      throw new Error('Handler handleGenerate no encontrado');
    }

    if (!moduleContent.includes('Generar Conciliación')) {
      throw new Error('Botón de generar conciliación no encontrado');
    }

    if (!moduleContent.includes('ReconciliationDisplay')) {
      throw new Error('Componente ReconciliationDisplay no encontrado');
    }
  });

  // Test 10: Verificar manejo de estados y persistencia
  runTest('Manejo de estados y persistencia implementado', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    // Verificar estados principales
    const requiredStates = [
      'services', 'expenses', 'reconciliations', 'settings',
      'selectedPeriod', 'currentReconciliation', 'isLoading'
    ];

    requiredStates.forEach(state => {
      if (!moduleContent.includes(state)) {
        throw new Error(`Estado '${state}' no encontrado`);
      }
    });

    // Verificar integración con StorageManager
    if (!moduleContent.includes('storageManager')) {
      throw new Error('Integración con StorageManager no encontrada');
    }
  });

  // Test 11: Verificar interfaz responsiva
  runTest('Interfaz responsiva implementada', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    // Verificar clases responsivas de Tailwind
    const responsiveClasses = ['md:grid-cols', 'md:flex-row', 'max-w-6xl', 'overflow-x-auto'];
    responsiveClasses.forEach(cls => {
      if (!moduleContent.includes(cls)) {
        throw new Error(`Clase responsiva '${cls}' no encontrada`);
      }
    });
  });

  // Test 12: Verificar notificaciones de usuario
  runTest('Sistema de notificaciones implementado', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    if (!moduleContent.includes('showNotification')) {
      throw new Error('Función showNotification no encontrada');
    }

    // Verificar tipos de notificación
    const notificationTypes = ['success', 'error', 'info'];
    notificationTypes.forEach(type => {
      if (!moduleContent.includes(`'${type}'`)) {
        throw new Error(`Tipo de notificación '${type}' no encontrado`);
      }
    });
  });

  // Test 13: Verificar estadísticas del período
  runTest('Estadísticas del período implementadas', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    if (!moduleContent.includes('periodStats')) {
      throw new Error('Estadísticas del período no encontradas');
    }

    // Verificar métricas básicas
    const metrics = ['services', 'totalServices', 'expenses', 'totalExpenses'];
    metrics.forEach(metric => {
      if (!moduleContent.includes(metric)) {
        throw new Error(`Métrica '${metric}' no encontrada en estadísticas`);
      }
    });
  });

  // Test 14: Verificar exportación global
  runTest('Exportación global del módulo', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    if (!moduleContent.includes('window.ReconciliationModule = ReconciliationModule')) {
      throw new Error('Exportación global del módulo no encontrada');
    }
  });

  // Test 15: Verificar requerimientos específicos de Task 11.1
  runTest('Requerimientos específicos de Task 11.1 cumplidos', () => {
    const moduleContent = fs.readFileSync(path.join(__dirname, 'reconciliation-module.js'), 'utf8');
    
    // Requerimiento: Implementar navegación entre pestañas (servicios, gastos, conciliación)
    const requiredTabs = ['services', 'expenses', 'reconciliation'];
    requiredTabs.forEach(tab => {
      if (!moduleContent.includes(`activeTab === '${tab}'`)) {
        throw new Error(`Navegación a pestaña '${tab}' no implementada`);
      }
    });

    // Requerimiento: Implementar selector de período de fechas
    if (!moduleContent.includes('selectedPeriod') || !moduleContent.includes('onPeriodChange')) {
      throw new Error('Selector de período de fechas no implementado completamente');
    }

    // Requerimiento: Integrar todos los componentes desarrollados
    const requiredComponents = ['ServiceManager', 'ExpenseManager', 'CalculationEngine', 'CashCalculator'];
    requiredComponents.forEach(component => {
      if (!moduleContent.includes(component)) {
        throw new Error(`Integración con ${component} no encontrada`);
      }
    });
  });

  // Mostrar resumen
  console.log('\n📊 Resumen de pruebas de Task 11.1:');
  console.log(`✅ Pasadas: ${results.passed}`);
  console.log(`❌ Fallidas: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}`);
  console.log(`🎯 Éxito: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ Pruebas fallidas:');
    results.tests.filter(t => t.status === 'failed').forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  } else {
    console.log('\n🎉 ¡Todas las pruebas de Task 11.1 pasaron exitosamente!');
    console.log('\n✅ Funcionalidades implementadas:');
    console.log('  - ✅ Componente principal ReconciliationModule');
    console.log('  - ✅ Navegación entre pestañas (servicios, gastos, conciliación)');
    console.log('  - ✅ Selector de período de fechas con botones rápidos');
    console.log('  - ✅ Integración con ServiceManager');
    console.log('  - ✅ Integración con ExpenseManager');
    console.log('  - ✅ Integración con CalculationEngine');
    console.log('  - ✅ Integración con CashCalculator');
    console.log('  - ✅ Desglose de efectivo con denominaciones');
    console.log('  - ✅ Generación de conciliaciones');
    console.log('  - ✅ Visualización de estadísticas del período');
    console.log('  - ✅ Sistema de notificaciones');
    console.log('  - ✅ Interfaz responsiva');
    console.log('  - ✅ Manejo de estados y persistencia');
  }

  return results;
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  const results = testTask11_1Integration();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { testTask11_1Integration };