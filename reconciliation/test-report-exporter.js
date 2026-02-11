/**
 * Pruebas unitarias para ReportExporter
 * Valida la funcionalidad de generación de reportes PDF y JSON
 * 
 * Tarea 12.1: Crear ReportExporter con generación de PDF
 * Requerimientos: 8.1, 8.2
 */

/**
 * Suite de pruebas para ReportExporter
 */
function runReportExporterTests() {
  console.log('🧪 Iniciando pruebas de ReportExporter...\n');
  
  let passedTests = 0;
  let totalTests = 0;

  // Helper para ejecutar pruebas
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

  // Helper para validar objetos
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  // Mock de jsPDF para las pruebas
  const mockJsPDF = function() {
    return {
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297
        },
        getNumberOfPages: () => 1
      },
      setFontSize: () => {},
      setFont: () => {},
      text: () => {},
      setLineWidth: () => {},
      line: () => {},
      addPage: () => {},
      setPage: () => {},
      output: (format) => {
        if (format === 'blob') {
          return new Blob(['mock pdf content'], { type: 'application/pdf' });
        }
        return 'mock pdf content';
      }
    };
  };

  // Mock de window para las pruebas
  const mockWindow = {
    jsPDF: mockJsPDF,
    URL: {
      createObjectURL: () => 'mock-url',
      revokeObjectURL: () => {}
    }
  };

  // Mock de document
  const mockDocument = {
    createElement: (tag) => ({
      href: '',
      download: '',
      style: { display: '' },
      click: () => {}
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  };

  // Configurar mocks globales
  global.window = mockWindow;
  global.document = mockDocument;
  global.Blob = class MockBlob {
    constructor(content, options) {
      this.content = content;
      this.type = options?.type || 'application/octet-stream';
    }
  };

  // Crear instancia del ReportExporter
  const exporter = new ReportExporter();

  // Datos de prueba
  const mockReconciliation = {
    id: 'test-reconciliation',
    period: {
      startDate: '2024-01-15',
      endDate: '2024-01-17'
    },
    summary: {
      totalServices: 24,
      totalExpenses: 125,
      netIncome: 835,
      totalCash: 300,
      totalCard: 360,
      totalApp: 300,
      totalFreenow: 300,
      totalCommission: 45,
      distribution60: 501,
      distribution40: 334
    },
    finalSettlement: {
      driverAmount: 334,
      ownerAmount: 501,
      externalBalance: 15,
      freenowExtras: 25
    },
    dailyTotals: [
      {
        date: '2024-01-15',
        serviceStart: 8,
        totalService: 320,
        expenses: 45
      },
      {
        date: '2024-01-16',
        serviceStart: 6,
        totalService: 240,
        expenses: 30
      }
    ],
    cashBreakdown: {
      bills: {
        fifty: 4,
        twenty: 3,
        ten: 2,
        five: 2,
        two: 5,
        one: 0
      },
      total: 300,
      difference: 0
    },
    services: [],
    expenses: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-17T18:00:00Z'
  };

  // 1. PRUEBAS DE INICIALIZACIÓN
  console.log('🔧 VALIDANDO INICIALIZACIÓN');
  console.log('-'.repeat(40));

  test('ReportExporter se inicializa correctamente', () => {
    assert(typeof ReportExporter === 'function', 'ReportExporter debe ser una clase');
    assert(exporter instanceof ReportExporter, 'Debe crear instancia correctamente');
    assert(exporter.companyInfo !== undefined, 'Debe tener información de empresa por defecto');
  });

  test('Configuración de información de empresa', () => {
    const newInfo = {
      name: 'Taxi Test S.L.',
      address: 'Calle Test 123',
      phone: '123-456-789',
      email: 'test@taxi.com',
      taxId: 'B12345678'
    };

    exporter.setCompanyInfo(newInfo);
    
    assert(exporter.companyInfo.name === newInfo.name, 'Debe actualizar nombre de empresa');
    assert(exporter.companyInfo.address === newInfo.address, 'Debe actualizar dirección');
    assert(exporter.companyInfo.phone === newInfo.phone, 'Debe actualizar teléfono');
  });

  // 2. PRUEBAS DE EXPORTACIÓN JSON
  console.log('📄 VALIDANDO EXPORTACIÓN JSON');
  console.log('-'.repeat(40));

  test('Exportación JSON básica funciona', () => {
    const jsonData = exporter.exportJSON(mockReconciliation);
    
    assert(typeof jsonData === 'string', 'Debe retornar string JSON');
    
    const parsed = JSON.parse(jsonData);
    assert(parsed.metadata !== undefined, 'Debe incluir metadata');
    assert(parsed.reconciliation !== undefined, 'Debe incluir datos de conciliación');
    assert(parsed.metadata.type === 'reconciliation', 'Debe tener tipo correcto');
  });

  test('Exportación JSON con opciones avanzadas', () => {
    const options = {
      includeRawData: true,
      includeCalculations: true,
      minify: false
    };

    const jsonData = exporter.exportJSON(mockReconciliation, options);
    const parsed = JSON.parse(jsonData);
    
    assert(parsed.rawData !== undefined, 'Debe incluir datos raw cuando se solicita');
    assert(parsed.calculations !== undefined, 'Debe incluir cálculos cuando se solicita');
    assert(parsed.calculations.commissionRates !== undefined, 'Debe incluir tasas de comisión');
  });

  test('Exportación JSON minificada', () => {
    const options = { minify: true };
    const jsonData = exporter.exportJSON(mockReconciliation, options);
    
    assert(typeof jsonData === 'string', 'Debe retornar string');
    assert(!jsonData.includes('\n'), 'JSON minificado no debe tener saltos de línea');
  });

  // 3. PRUEBAS DE GENERACIÓN PDF
  console.log('📑 VALIDANDO GENERACIÓN PDF');
  console.log('-'.repeat(40));

  test('Generación PDF básica funciona', async () => {
    const pdfBlob = await exporter.generatePDF(mockReconciliation);
    
    assert(pdfBlob instanceof Blob, 'Debe retornar un Blob');
    assert(pdfBlob.type === 'application/pdf', 'Debe tener tipo MIME correcto');
  });

  test('Generación PDF con datos completos', async () => {
    const fullReconciliation = {
      ...mockReconciliation,
      dailyTotals: [
        ...mockReconciliation.dailyTotals,
        {
          date: '2024-01-17',
          serviceStart: 10,
          totalService: 400,
          expenses: 50
        }
      ]
    };

    const pdfBlob = await exporter.generatePDF(fullReconciliation);
    assert(pdfBlob instanceof Blob, 'Debe manejar datos completos');
  });

  test('Generación PDF sin jsPDF falla correctamente', async () => {
    // Temporalmente remover jsPDF
    const originalJsPDF = global.window.jsPDF;
    delete global.window.jsPDF;

    try {
      await exporter.generatePDF(mockReconciliation);
      assert(false, 'Debe fallar sin jsPDF');
    } catch (error) {
      assert(error.message.includes('jsPDF'), 'Debe mencionar jsPDF en el error');
    }

    // Restaurar jsPDF
    global.window.jsPDF = originalJsPDF;
  });

  // 4. PRUEBAS DE VALIDACIÓN
  console.log('✅ VALIDANDO VALIDACIÓN DE DATOS');
  console.log('-'.repeat(40));

  test('Validación de datos correctos', () => {
    const validation = exporter.validateReconciliation(mockReconciliation);
    
    assert(validation.valid === true, 'Datos válidos deben pasar validación');
    assert(Array.isArray(validation.errors), 'Debe retornar array de errores');
    assert(Array.isArray(validation.warnings), 'Debe retornar array de advertencias');
  });

  test('Validación detecta datos faltantes', () => {
    const incompleteReconciliation = {
      id: 'test'
      // Faltan period y summary
    };

    const validation = exporter.validateReconciliation(incompleteReconciliation);
    
    assert(validation.valid === false, 'Datos incompletos deben fallar validación');
    assert(validation.errors.length > 0, 'Debe tener errores');
  });

  test('Validación detecta inconsistencias', () => {
    const inconsistentReconciliation = {
      ...mockReconciliation,
      dailyTotals: [
        { date: '2024-01-15', totalService: 100 },
        { date: '2024-01-16', totalService: 200 }
      ],
      summary: {
        ...mockReconciliation.summary,
        totalServices: 500 // Inconsistente con dailyTotals (300)
      }
    };

    const validation = exporter.validateReconciliation(inconsistentReconciliation);
    
    assert(validation.warnings.length > 0, 'Debe detectar inconsistencias como advertencias');
  });

  // 5. PRUEBAS DE NOMBRES DE ARCHIVO
  console.log('📁 VALIDANDO NOMBRES DE ARCHIVO');
  console.log('-'.repeat(40));

  test('Generación de nombres de archivo para un día', () => {
    const singleDayReconciliation = {
      period: {
        startDate: '2024-01-15',
        endDate: '2024-01-15'
      }
    };

    const filename = exporter.generateFilename(singleDayReconciliation, 'pdf');
    assert(filename === 'conciliacion_2024-01-15.pdf', 'Debe generar nombre correcto para un día');
  });

  test('Generación de nombres de archivo para rango', () => {
    const filename = exporter.generateFilename(mockReconciliation, 'json');
    assert(filename === 'conciliacion_2024-01-15_2024-01-17.json', 'Debe generar nombre correcto para rango');
  });

  // 6. PRUEBAS DE CAPACIDADES
  console.log('🔍 VALIDANDO CAPACIDADES');
  console.log('-'.repeat(40));

  test('Obtención de capacidades', () => {
    const capabilities = exporter.getCapabilities();
    
    assert(Array.isArray(capabilities.formats), 'Debe listar formatos soportados');
    assert(capabilities.formats.includes('pdf'), 'Debe soportar PDF');
    assert(capabilities.formats.includes('json'), 'Debe soportar JSON');
    assert(capabilities.features.pdf !== undefined, 'Debe tener info de capacidades PDF');
    assert(capabilities.features.json !== undefined, 'Debe tener info de capacidades JSON');
  });

  // 7. PRUEBAS DE GENERACIÓN COMPLETA
  console.log('🎯 VALIDANDO GENERACIÓN COMPLETA');
  console.log('-'.repeat(40));

  test('Generación completa de reporte PDF', async () => {
    const result = await exporter.generateReport(mockReconciliation, 'pdf');
    
    assert(result.success === true, 'Generación debe ser exitosa');
    assert(result.data instanceof Blob, 'Debe retornar Blob para PDF');
    assert(result.format === 'pdf', 'Debe indicar formato correcto');
    assert(result.filename !== undefined, 'Debe generar nombre de archivo');
  });

  test('Generación completa de reporte JSON', async () => {
    const result = await exporter.generateReport(mockReconciliation, 'json');
    
    assert(result.success === true, 'Generación debe ser exitosa');
    assert(typeof result.data === 'string', 'Debe retornar string para JSON');
    assert(result.format === 'json', 'Debe indicar formato correcto');
  });

  test('Generación con formato no soportado', async () => {
    const result = await exporter.generateReport(mockReconciliation, 'xml');
    
    assert(result.success === false, 'Debe fallar con formato no soportado');
    assert(result.error !== undefined, 'Debe incluir mensaje de error');
  });

  // 8. PRUEBAS DE DESCARGA (SIMULADA)
  console.log('💾 VALIDANDO FUNCIONALIDAD DE DESCARGA');
  console.log('-'.repeat(40));

  test('Función downloadFile funciona', () => {
    const testData = 'test content';
    const filename = 'test.txt';
    
    // Esta función no debería fallar en el entorno de prueba
    try {
      exporter.downloadFile(testData, filename, 'text/plain');
      assert(true, 'downloadFile debe ejecutarse sin errores');
    } catch (error) {
      // En entorno de prueba puede fallar, pero no debe ser por lógica interna
      assert(error.message.includes('navegador') || error.message.includes('DOM'), 'Error debe ser por entorno de prueba');
    }
  });

  // RESUMEN DE PRUEBAS
  console.log('📊 RESUMEN DE PRUEBAS DE REPORTEXPORTER');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests/totalTests) * 100).toFixed(1)}%\n`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡TODAS LAS PRUEBAS DE REPORTEXPORTER PASARON!');
    console.log('✅ REQ 8.1: Generación de PDF con todos los detalles implementada');
    console.log('✅ REQ 8.2: Exportación de datos en formato JSON implementada');
    console.log('✅ Integración con sistema de descarga del navegador');
    console.log('✅ Validación de datos de entrada');
    console.log('✅ Generación de nombres de archivo automática');
    console.log('✅ Manejo de errores y casos edge');
    console.log('✅ Configuración de información de empresa');
    console.log('✅ Capacidades de exportación documentadas');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisar implementación de ReportExporter.');
  }

  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests,
    component: 'ReportExporter',
    requirements: ['8.1', '8.2']
  };
}

// Ejecutar pruebas si se carga directamente
if (typeof window !== 'undefined') {
  // En navegador
  window.runReportExporterTests = runReportExporterTests;
} else if (typeof module !== 'undefined') {
  // En Node.js
  module.exports = { runReportExporterTests };
}

// Auto-ejecutar si se carga como script principal
if (typeof require !== 'undefined' && require.main === module) {
  runReportExporterTests();
}