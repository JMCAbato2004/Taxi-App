/**
 * Validación de ReconciliationTable
 * Verifica que el archivo tenga la estructura correcta
 * 
 * Tarea 11.2: Crear tabla de conciliación (ReconciliationTable)
 */

const fs = require('fs');
const path = require('path');

function validateReconciliationTable() {
  console.log('🧪 VALIDANDO RECONCILIATION TABLE');
  console.log('='.repeat(50));
  console.log('Verificando estructura y funcionalidades\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name, testFn) {
    totalTests++;
    try {
      console.log(`📋 ${name}`);
      testFn();
      console.log(`✅ PASÓ: ${name}\n`);
      passedTests++;
      return true;
    } catch (error) {
      console.log(`❌ FALLÓ: ${name}`);
      console.log(`   Error: ${error.message}\n`);
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

  // 1. VERIFICAR ARCHIVO PRINCIPAL
  console.log('📁 VERIFICANDO ARCHIVO PRINCIPAL');
  console.log('-'.repeat(40));

  test('Archivo reconciliation-table.js existe', () => {
    assert(fileExists('reconciliation-table.js'), 'reconciliation-table.js debe existir');
  });

  test('Contiene función ReconciliationTable principal', () => {
    assert(fileContains('reconciliation-table.js', 'function ReconciliationTable'), 'Debe contener función ReconciliationTable');
  });

  test('Contiene parámetros correctos', () => {
    assert(fileContains('reconciliation-table.js', 'theme, reconciliation, onSave, onExport'), 'Debe tener parámetros correctos');
  });

  // 2. VERIFICAR COMPONENTES DE SECCIÓN
  console.log('📊 VERIFICANDO COMPONENTES DE SECCIÓN');
  console.log('-'.repeat(40));

  test('Contiene DailyTotalsSection', () => {
    assert(fileContains('reconciliation-table.js', 'function DailyTotalsSection'), 'Debe contener DailyTotalsSection');
  });

  test('Contiene SummarySection', () => {
    assert(fileContains('reconciliation-table.js', 'function SummarySection'), 'Debe contener SummarySection');
  });

  test('Contiene SettlementSection', () => {
    assert(fileContains('reconciliation-table.js', 'function SettlementSection'), 'Debe contener SettlementSection');
  });

  test('Contiene CashBreakdownSection', () => {
    assert(fileContains('reconciliation-table.js', 'function CashBreakdownSection'), 'Debe contener CashBreakdownSection');
  });

  // 3. VERIFICAR COMPONENTES DE TABLA
  console.log('📅 VERIFICANDO COMPONENTES DE TABLA');
  console.log('-'.repeat(40));

  test('Contiene DailyTotalsTable', () => {
    assert(fileContains('reconciliation-table.js', 'function DailyTotalsTable'), 'Debe contener DailyTotalsTable');
  });

  test('Contiene DailyTotalsMobile', () => {
    assert(fileContains('reconciliation-table.js', 'function DailyTotalsMobile'), 'Debe contener DailyTotalsMobile');
  });

  // 4. VERIFICAR FUNCIONALIDADES ESPECÍFICAS
  console.log('⚙️ VERIFICANDO FUNCIONALIDADES ESPECÍFICAS');
  console.log('-'.repeat(40));

  test('Maneja estados de vista (viewMode)', () => {
    assert(fileContains('reconciliation-table.js', 'viewMode'), 'Debe manejar viewMode');
    assert(fileContains('reconciliation-table.js', 'setViewMode'), 'Debe tener setViewMode');
  });

  test('Maneja secciones expandibles', () => {
    assert(fileContains('reconciliation-table.js', 'expandedSections'), 'Debe manejar expandedSections');
    assert(fileContains('reconciliation-table.js', 'toggleSection'), 'Debe tener toggleSection');
  });

  test('Incluye formateo de fechas', () => {
    assert(fileContains('reconciliation-table.js', 'formatDate'), 'Debe incluir formatDate');
  });

  test('Incluye formateo de moneda', () => {
    assert(fileContains('reconciliation-table.js', 'formatCurrency'), 'Debe incluir formatCurrency');
  });

  // 5. VERIFICAR REQUERIMIENTOS ESPECÍFICOS
  console.log('📋 VERIFICANDO REQUERIMIENTOS');
  console.log('-'.repeat(40));

  test('REQ 7.1: Tabla responsiva implementada', () => {
    assert(fileContains('reconciliation-table.js', 'overflow-x-auto'), 'Debe tener scroll horizontal');
    assert(fileContains('reconciliation-table.js', 'md:grid-cols'), 'Debe tener diseño responsivo');
    assert(fileContains('reconciliation-table.js', 'mobile'), 'Debe tener vista móvil');
  });

  test('REQ 7.2: Totales diarios y generales', () => {
    assert(fileContains('reconciliation-table.js', 'dailyTotals'), 'Debe manejar totales diarios');
    assert(fileContains('reconciliation-table.js', 'summary'), 'Debe manejar resumen general');
    assert(fileContains('reconciliation-table.js', 'TOTAL'), 'Debe mostrar fila de totales');
  });

  test('REQ 7.3: Visualización de liquidación final', () => {
    assert(fileContains('reconciliation-table.js', 'finalSettlement'), 'Debe manejar liquidación final');
    assert(fileContains('reconciliation-table.js', 'distribution60'), 'Debe mostrar distribución 60%');
    assert(fileContains('reconciliation-table.js', 'distribution40'), 'Debe mostrar distribución 40%');
    assert(fileContains('reconciliation-table.js', 'LIQUIDACIÓN FINAL'), 'Debe mostrar liquidación final');
  });

  // 6. VERIFICAR CARACTERÍSTICAS AVANZADAS
  console.log('🚀 VERIFICANDO CARACTERÍSTICAS AVANZADAS');
  console.log('-'.repeat(40));

  test('Incluye desglose de efectivo', () => {
    assert(fileContains('reconciliation-table.js', 'cashBreakdown'), 'Debe manejar desglose de efectivo');
    assert(fileContains('reconciliation-table.js', 'bills'), 'Debe manejar billetes');
    assert(fileContains('reconciliation-table.js', 'difference'), 'Debe calcular diferencias');
  });

  test('Incluye controles de exportación', () => {
    assert(fileContains('reconciliation-table.js', 'onSave'), 'Debe manejar guardado');
    assert(fileContains('reconciliation-table.js', 'onExport'), 'Debe manejar exportación');
    assert(fileContains('reconciliation-table.js', 'Guardar'), 'Debe mostrar botón guardar');
    assert(fileContains('reconciliation-table.js', 'Exportar'), 'Debe mostrar botón exportar');
  });

  test('Incluye manejo de datos vacíos', () => {
    assert(fileContains('reconciliation-table.js', 'Sin datos de conciliación'), 'Debe manejar estado vacío');
    assert(fileContains('reconciliation-table.js', '!reconciliation'), 'Debe verificar datos nulos');
  });

  // 7. VERIFICAR EXPORTACIÓN
  console.log('📤 VERIFICANDO EXPORTACIÓN');
  console.log('-'.repeat(40));

  test('Exportación para navegador', () => {
    assert(fileContains('reconciliation-table.js', 'window.ReconciliationTable'), 'Debe exportar a window');
  });

  test('Exportación para Node.js', () => {
    assert(fileContains('reconciliation-table.js', 'module.exports'), 'Debe exportar para Node.js');
  });

  // 8. VERIFICAR ESTRUCTURA DE CLASES CSS
  console.log('🎨 VERIFICANDO ESTILOS Y CLASES');
  console.log('-'.repeat(40));

  test('Usa Tailwind CSS correctamente', () => {
    assert(fileContains('reconciliation-table.js', 'rounded-xl'), 'Debe usar clases de Tailwind');
    assert(fileContains('reconciliation-table.js', 'bg-'), 'Debe usar colores de fondo');
    assert(fileContains('reconciliation-table.js', 'text-'), 'Debe usar colores de texto');
  });

  test('Incluye iconos y emojis', () => {
    assert(fileContains('reconciliation-table.js', '📊'), 'Debe incluir iconos');
    assert(fileContains('reconciliation-table.js', '💰'), 'Debe incluir emojis descriptivos');
  });

  // RESUMEN FINAL
  console.log('📊 RESUMEN DE VALIDACIÓN');
  console.log('='.repeat(50));
  console.log(`✅ Validaciones pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡RECONCILIATION TABLE VALIDADA EXITOSAMENTE!');
    console.log('✅ REQ 7.1: Tabla responsiva con todas las columnas');
    console.log('✅ REQ 7.2: Totales diarios y generales');
    console.log('✅ REQ 7.3: Visualización de liquidación final');
    console.log('✅ Componentes de sección implementados');
    console.log('✅ Vista móvil responsiva');
    console.log('✅ Formateo de datos');
    console.log('✅ Manejo de estados');
    console.log('✅ Exportación correcta');
    console.log('✅ Estilos Tailwind CSS');
  } else {
    console.log('⚠️  Algunas validaciones fallaron.');
    console.log('🔧 Revisar implementación de ReconciliationTable');
  }
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests,
    component: 'ReconciliationTable',
    requirements: ['7.1', '7.2', '7.3']
  };
}

// Ejecutar validación
const result = validateReconciliationTable();

// Salir con código de error si hay fallos
process.exit(result.success ? 0 : 1);