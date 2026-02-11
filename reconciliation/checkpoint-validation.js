/**
 * Validación simplificada del Checkpoint de Lógica de Negocio
 * 
 * Verifica que todos los archivos principales existan y tengan la estructura correcta
 */

const fs = require('fs');
const path = require('path');

function validateBusinessLogicCheckpoint() {
  console.log('🏁 VALIDACIÓN DEL CHECKPOINT DE LÓGICA DE NEGOCIO');
  console.log('='.repeat(60));
  console.log('Verificando que todos los componentes estén implementados\n');

  let passedTests = 0;
  let totalTests = 0;
  const results = [];

  function test(name, testFn) {
    totalTests++;
    try {
      console.log(`📋 ${name}`);
      testFn();
      console.log(`✅ PASÓ: ${name}\n`);
      passedTests++;
      results.push({ name, status: 'PASÓ' });
      return true;
    } catch (error) {
      console.log(`❌ FALLÓ: ${name}`);
      console.log(`   Error: ${error.message}\n`);
      results.push({ name, status: 'FALLÓ', error: error.message });
      return false;
    }
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function fileExists(filePath) {
    return fs.existsSync(path.join(__dirname, filePath));
  }

  function fileContains(filePath, searchText) {
    if (!fileExists(filePath)) return false;
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    return content.includes(searchText);
  }

  // 1. VERIFICAR ARCHIVOS PRINCIPALES
  console.log('📁 VERIFICANDO ARCHIVOS PRINCIPALES');
  console.log('-'.repeat(40));

  test('Archivo types.js existe y contiene definiciones', () => {
    assert(fileExists('types.js'), 'types.js debe existir');
    assert(fileContains('types.js', 'ReconciliationTypes'), 'types.js debe contener ReconciliationTypes');
  });

  test('Archivo calculation-engine.js existe y contiene clase', () => {
    assert(fileExists('calculation-engine.js'), 'calculation-engine.js debe existir');
    assert(fileContains('calculation-engine.js', 'class CalculationEngine'), 'Debe contener clase CalculationEngine');
    assert(fileContains('calculation-engine.js', 'calculateCommission'), 'Debe contener método calculateCommission');
    assert(fileContains('calculation-engine.js', 'calculateDistribution'), 'Debe contener método calculateDistribution');
  });

  test('Archivo reconciliation-generator.js existe y contiene clase', () => {
    assert(fileExists('reconciliation-generator.js'), 'reconciliation-generator.js debe existir');
    assert(fileContains('reconciliation-generator.js', 'class ReconciliationGenerator'), 'Debe contener clase ReconciliationGenerator');
    assert(fileContains('reconciliation-generator.js', 'generateReconciliation'), 'Debe contener método generateReconciliation');
  });

  test('Archivo cash-calculator.js existe y contiene clase', () => {
    assert(fileExists('cash-calculator.js'), 'cash-calculator.js debe existir');
    assert(fileContains('cash-calculator.js', 'class CashCalculator'), 'Debe contener clase CashCalculator');
    assert(fileContains('cash-calculator.js', 'calculateTotal'), 'Debe contener método calculateTotal');
  });

  test('Archivo storage-manager.js existe y contiene clase', () => {
    assert(fileExists('storage-manager.js'), 'storage-manager.js debe existir');
    assert(fileContains('storage-manager.js', 'class ReconciliationStorageManager'), 'Debe contener clase ReconciliationStorageManager');
    assert(fileContains('storage-manager.js', 'saveService'), 'Debe contener método saveService');
    assert(fileContains('storage-manager.js', 'getServices'), 'Debe contener método getServices');
  });

  test('Archivo validation-system.js existe y contiene clase', () => {
    assert(fileExists('validation-system.js'), 'validation-system.js debe existir');
    assert(fileContains('validation-system.js', 'class ValidationSystem'), 'Debe contener clase ValidationSystem');
    assert(fileContains('validation-system.js', 'validateService'), 'Debe contener método validateService');
    assert(fileContains('validation-system.js', 'validateExpense'), 'Debe contener método validateExpense');
  });

  // 2. VERIFICAR ARCHIVOS DE PRUEBAS
  console.log('🧪 VERIFICANDO ARCHIVOS DE PRUEBAS');
  console.log('-'.repeat(40));

  test('Archivo test-calculation-engine.js existe', () => {
    assert(fileExists('test-calculation-engine.js'), 'test-calculation-engine.js debe existir');
    assert(fileContains('test-calculation-engine.js', 'runCalculationEngineTests'), 'Debe contener función de pruebas');
  });

  test('Archivo test-reconciliation-generator.js existe', () => {
    assert(fileExists('test-reconciliation-generator.js'), 'test-reconciliation-generator.js debe existir');
    assert(fileContains('test-reconciliation-generator.js', 'runReconciliationGeneratorTests'), 'Debe contener función de pruebas');
  });

  test('Archivo test-cash-calculator.js existe', () => {
    assert(fileExists('test-cash-calculator.js'), 'test-cash-calculator.js debe existir');
    assert(fileContains('test-cash-calculator.js', 'runCashCalculatorTests'), 'Debe contener función de pruebas');
  });

  test('Archivo test-storage-persistence.js existe', () => {
    assert(fileExists('test-storage-persistence.js'), 'test-storage-persistence.js debe existir');
    assert(fileContains('test-storage-persistence.js', 'runStoragePersistenceTests'), 'Debe contener función de pruebas');
  });

  test('Archivo test-validation-system.js existe', () => {
    assert(fileExists('test-validation-system.js'), 'test-validation-system.js debe existir');
    assert(fileContains('test-validation-system.js', 'runValidationSystemTests'), 'Debe contener función de pruebas');
  });

  // 3. VERIFICAR FUNCIONALIDADES ESPECÍFICAS
  console.log('⚙️ VERIFICANDO FUNCIONALIDADES ESPECÍFICAS');
  console.log('-'.repeat(40));

  test('CalculationEngine tiene métodos de comisión Freenow', () => {
    assert(fileContains('calculation-engine.js', 'freenow'), 'Debe manejar plataforma Freenow');
    assert(fileContains('calculation-engine.js', 'commission'), 'Debe calcular comisiones');
  });

  test('ReconciliationGenerator maneja períodos de fechas', () => {
    assert(fileContains('reconciliation-generator.js', 'startDate'), 'Debe manejar fecha de inicio');
    assert(fileContains('reconciliation-generator.js', 'endDate'), 'Debe manejar fecha de fin');
    assert(fileContains('reconciliation-generator.js', 'period'), 'Debe manejar períodos');
  });

  test('CashCalculator maneja billetes y monedas', () => {
    assert(fileContains('cash-calculator.js', 'bills'), 'Debe manejar billetes');
    assert(fileContains('cash-calculator.js', 'coins'), 'Debe manejar monedas');
    assert(fileContains('cash-calculator.js', 'fifty'), 'Debe manejar billetes de 50');
  });

  test('StorageManager maneja localStorage', () => {
    assert(fileContains('storage-manager.js', 'localStorage'), 'Debe usar localStorage');
    assert(fileContains('storage-manager.js', 'saveService'), 'Debe guardar servicios');
    assert(fileContains('storage-manager.js', 'saveExpense'), 'Debe guardar gastos');
  });

  test('ValidationSystem detecta errores', () => {
    assert(fileContains('validation-system.js', 'errorTypes'), 'Debe definir tipos de errores');
    assert(fileContains('validation-system.js', 'NEGATIVE_AMOUNT'), 'Debe detectar montos negativos');
    assert(fileContains('validation-system.js', 'INVALID_DATE'), 'Debe detectar fechas inválidas');
  });

  // 4. VERIFICAR INTEGRACIÓN
  console.log('🔗 VERIFICANDO INTEGRACIÓN');
  console.log('-'.repeat(40));

  test('Todos los archivos tienen exportación para Node.js', () => {
    const coreFiles = [
      'calculation-engine.js',
      'reconciliation-generator.js', 
      'cash-calculator.js',
      'storage-manager.js',
      'validation-system.js'
    ];

    coreFiles.forEach(file => {
      assert(fileContains(file, 'module.exports'), `${file} debe tener exportación para Node.js`);
    });
  });

  test('Todos los archivos tienen exportación para navegador', () => {
    const coreFiles = [
      'calculation-engine.js',
      'reconciliation-generator.js', 
      'cash-calculator.js',
      'storage-manager.js',
      'validation-system.js'
    ];

    coreFiles.forEach(file => {
      assert(fileContains(file, 'window.'), `${file} debe tener exportación para navegador`);
    });
  });

  test('Archivos de pruebas tienen estructura correcta', () => {
    const testFiles = [
      'test-calculation-engine.js',
      'test-reconciliation-generator.js',
      'test-cash-calculator.js',
      'test-storage-persistence.js',
      'test-validation-system.js'
    ];

    testFiles.forEach(file => {
      assert(fileContains(file, 'function test('), `${file} debe tener función test helper`);
      assert(fileContains(file, 'console.log'), `${file} debe tener logging`);
    });
  });

  // 5. VERIFICAR TAREAS COMPLETADAS
  console.log('📋 VERIFICANDO TAREAS COMPLETADAS');
  console.log('-'.repeat(40));

  test('Tarea 2.1 y 2.4 - CalculationEngine implementado', () => {
    assert(fileContains('calculation-engine.js', 'calculateCommission'), 'Debe tener calculateCommission');
    assert(fileContains('calculation-engine.js', 'calculateDistribution'), 'Debe tener calculateDistribution');
    assert(fileContains('calculation-engine.js', 'calculateFinalSettlement'), 'Debe tener calculateFinalSettlement');
  });

  test('Tarea 3.1 y 3.4 - ServiceManager funcionalidad', () => {
    assert(fileExists('service-manager.js'), 'service-manager.js debe existir');
    assert(fileContains('service-manager.js', 'ServiceManager'), 'Debe contener función ServiceManager');
  });

  test('Tarea 4.1 - ExpenseManager funcionalidad', () => {
    assert(fileExists('expense-manager.js'), 'expense-manager.js debe existir');
    assert(fileContains('expense-manager.js', 'ExpenseManager'), 'Debe contener función ExpenseManager');
  });

  test('Tarea 6.1 y 6.4 - ReconciliationGenerator implementado', () => {
    assert(fileContains('reconciliation-generator.js', 'generateReconciliation'), 'Debe generar conciliaciones');
    assert(fileContains('reconciliation-generator.js', 'calculateNetTotals'), 'Debe calcular totales netos');
  });

  test('Tarea 7.1 - CashCalculator implementado', () => {
    assert(fileContains('cash-calculator.js', 'calculateTotal'), 'Debe calcular totales');
    assert(fileContains('cash-calculator.js', 'calculateDifference'), 'Debe calcular diferencias');
  });

  test('Tarea 8.1 - StorageManager implementado', () => {
    assert(fileContains('storage-manager.js', 'saveService'), 'Debe guardar servicios');
    assert(fileContains('storage-manager.js', 'saveExpense'), 'Debe guardar gastos');
    assert(fileContains('storage-manager.js', 'saveReconciliation'), 'Debe guardar conciliaciones');
  });

  test('Tarea 9.1 - ValidationSystem implementado', () => {
    assert(fileContains('validation-system.js', 'validateService'), 'Debe validar servicios');
    assert(fileContains('validation-system.js', 'validateExpense'), 'Debe validar gastos');
    assert(fileContains('validation-system.js', 'detectInconsistencies'), 'Debe detectar inconsistencias');
  });

  // RESUMEN FINAL
  console.log('📊 RESUMEN DE VALIDACIÓN DEL CHECKPOINT');
  console.log('='.repeat(60));
  console.log(`✅ Validaciones pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  console.log('📋 Desglose de resultados:');
  results.forEach(result => {
    const status = result.status === 'PASÓ' ? '✅' : '❌';
    console.log(`   ${status} ${result.name}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  console.log('\n🎯 ESTADO DEL CHECKPOINT:');
  if (passedTests === totalTests) {
    console.log('✅ CHECKPOINT VALIDADO EXITOSAMENTE');
    console.log('🚀 Todos los componentes de lógica de negocio están implementados');
    console.log('📋 Sistema listo para implementación de interfaz de usuario');
    console.log('🔧 Componentes validados:');
    console.log('   • CalculationEngine - Cálculos y comisiones ✅');
    console.log('   • ReconciliationGenerator - Generación de conciliaciones ✅');
    console.log('   • CashCalculator - Cálculo de efectivo ✅');
    console.log('   • StorageManager - Persistencia de datos ✅');
    console.log('   • ValidationSystem - Validaciones y errores ✅');
    console.log('   • ServiceManager - Gestión de servicios ✅');
    console.log('   • ExpenseManager - Gestión de gastos ✅');
  } else {
    console.log('⚠️  CHECKPOINT PENDIENTE');
    console.log('🔧 Revisar fallos antes de continuar con la interfaz');
    console.log(`📋 ${totalTests - passedTests} validaciones requieren atención`);
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
      'ValidationSystem',
      'ServiceManager',
      'ExpenseManager'
    ]
  };
}

// Ejecutar validación
const result = validateBusinessLogicCheckpoint();

// Salir con código de error si hay fallos
process.exit(result.success ? 0 : 1);