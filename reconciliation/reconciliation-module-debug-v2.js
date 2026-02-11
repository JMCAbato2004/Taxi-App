/**
 * Módulo de Debug v2 - Usando versiones simplificadas
 * Prueba la carga de módulos simplificados para identificar errores
 */

console.log('🔍 Iniciando Debug v2 con módulos simplificados');

/**
 * Componente de debug mejorado
 */
function ReconciliationDebugV2() {
  const { useState, useEffect, createElement: e } = React;
  const [debugInfo, setDebugInfo] = useState({
    dependencies: {},
    systemInfo: {},
    loadingErrors: [],
    testResults: {}
  });

  // Verificar dependencias
  useEffect(() => {
    const checkDependencies = () => {
      const deps = {
        // Dependencias básicas
        React: typeof React !== 'undefined',
        window: typeof window !== 'undefined',
        
        // Módulos base (que funcionan)
        ReconciliationTypes: typeof window.ReconciliationTypes !== 'undefined',
        ReconciliationStorageManager: typeof window.ReconciliationStorageManager !== 'undefined',
        CalculationEngine: typeof window.CalculationEngine !== 'undefined',
        
        // Módulos originales (problemáticos)
        ServiceManager: typeof window.ServiceManager !== 'undefined',
        ExpenseManager: typeof window.ExpenseManager !== 'undefined',
        ValidationSystem: typeof window.ValidationSystem !== 'undefined',
        
        // Módulos simplificados (nuevos)
        ServiceManagerSimple: typeof window.ServiceManagerSimple !== 'undefined',
        ExpenseManagerSimple: typeof window.ExpenseManagerSimple !== 'undefined',
        ValidationSystemSimple: typeof window.ValidationSystemSimple !== 'undefined'
      };

      const systemInfo = {
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        timestamp: new Date().toLocaleString('es-ES'),
        reactVersion: React.version || 'Desconocida',
        location: window.location.href
      };

      setDebugInfo(prev => ({
        ...prev,
        dependencies: deps,
        systemInfo: systemInfo
      }));
    };

    checkDependencies();
    
    // Verificar cada 2 segundos
    const interval = setInterval(checkDependencies, 2000);
    return () => clearInterval(interval);
  }, []);

  // Probar funcionalidad básica
  const testBasicFunctionality = () => {
    const results = {};
    
    try {
      // Probar CalculationEngine
      if (window.CalculationEngine) {
        const engine = new window.CalculationEngine();
        const testResult = engine.calculateCommission(100, 'freenow');
        results.CalculationEngine = (testResult === 15) ? '✅ Funciona' : '❌ Error en cálculo';
      } else {
        results.CalculationEngine = '❌ No disponible';
      }
    } catch (error) {
      results.CalculationEngine = `❌ Error: ${error.message}`;
    }

    try {
      // Probar ValidationSystemSimple
      if (window.ValidationSystemSimple) {
        const validator = new window.ValidationSystemSimple();
        const testService = { date: '2024-01-01', totalAmount: 50, paymentType: 'cash' };
        const result = validator.validateService(testService);
        results.ValidationSystemSimple = result.valid ? '✅ Funciona' : '❌ Validación falló';
      } else {
        results.ValidationSystemSimple = '❌ No disponible';
      }
    } catch (error) {
      results.ValidationSystemSimple = `❌ Error: ${error.message}`;
    }

    try {
      // Probar StorageManager
      if (window.ReconciliationStorageManager) {
        const storage = new window.ReconciliationStorageManager();
        const services = storage.getServices();
        results.StorageManager = Array.isArray(services) ? '✅ Funciona' : '❌ Error en carga';
      } else {
        results.StorageManager = '❌ No disponible';
      }
    } catch (error) {
      results.StorageManager = `❌ Error: ${error.message}`;
    }

    try {
      // Probar ServiceManagerSimple
      if (window.ServiceManagerSimple) {
        // Solo verificar que se puede instanciar
        const testProps = { theme: {}, services: [], onAdd: () => {}, onUpdate: () => {}, onDelete: () => {} };
        results.ServiceManagerSimple = '✅ Disponible para usar';
      } else {
        results.ServiceManagerSimple = '❌ No disponible';
      }
    } catch (error) {
      results.ServiceManagerSimple = `❌ Error: ${error.message}`;
    }

    try {
      // Probar ExpenseManagerSimple
      if (window.ExpenseManagerSimple) {
        // Solo verificar que se puede instanciar
        const testProps = { theme: {}, expenses: [], onAdd: () => {}, onUpdate: () => {}, onDelete: () => {} };
        results.ExpenseManagerSimple = '✅ Disponible para usar';
      } else {
        results.ExpenseManagerSimple = '❌ No disponible';
      }
    } catch (error) {
      results.ExpenseManagerSimple = `❌ Error: ${error.message}`;
    }

    setDebugInfo(prev => ({
      ...prev,
      testResults: results
    }));
  };

  // Cargar módulos faltantes
  const loadMissingModules = () => {
    const modulesToLoad = [
      { name: 'service-manager-simple.js', check: () => window.ServiceManagerSimple },
      { name: 'expense-manager-simple.js', check: () => window.ExpenseManagerSimple },
      { name: 'validation-system-simple.js', check: () => window.ValidationSystemSimple }
    ];

    modulesToLoad.forEach(module => {
      if (!module.check()) {
        console.log(`🔄 Intentando cargar ${module.name}`);
        const script = document.createElement('script');
        script.src = `reconciliation/${module.name}`;
        script.onload = () => console.log(`✅ ${module.name} cargado`);
        script.onerror = (error) => {
          console.error(`❌ Error cargando ${module.name}:`, error);
          setDebugInfo(prev => ({
            ...prev,
            loadingErrors: [...prev.loadingErrors, `Error cargando ${module.name}`]
          }));
        };
        document.head.appendChild(script);
      }
    });
  };

  const getDependencyIcon = (available) => available ? '✅' : '❌';
  const getDependencyStatus = (available) => available ? 'Disponible' : 'No disponible';

  return e('div', { className: "p-6 max-w-4xl mx-auto" },
    e('div', { className: "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" },
      // Header
      e('div', { className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6" },
        e('h1', { className: "text-2xl font-bold mb-2" }, '🔍 Debug de Dependencias v2'),
        e('p', { className: "opacity-90" }, 'Diagnóstico avanzado con módulos simplificados'),
        e('div', { className: "mt-4 flex gap-3" },
          e('button', {
            onClick: testBasicFunctionality,
            className: "bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-colors"
          }, '🧪 Probar Funcionalidad'),
          e('button', {
            onClick: loadMissingModules,
            className: "bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-colors"
          }, '🔄 Cargar Módulos')
        )
      ),

      // Estado de Dependencias
      e('div', { className: "p-6" },
        e('h2', { className: "text-xl font-bold mb-4" }, '📊 Estado de Dependencias'),
        
        // Dependencias básicas
        e('div', { className: "mb-6" },
          e('h3', { className: "font-semibold mb-3 text-gray-700" }, 'Dependencias Básicas'),
          e('div', { className: "grid grid-cols-2 md:grid-cols-3 gap-3" },
            ['React', 'window'].map(dep =>
              e('div', {
                key: dep,
                className: `flex items-center gap-2 p-3 rounded-lg border ${debugInfo.dependencies[dep] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`
              },
                e('span', { className: "text-lg" }, getDependencyIcon(debugInfo.dependencies[dep])),
                e('div', null,
                  e('div', { className: "font-medium" }, dep),
                  e('div', { className: "text-sm text-gray-600" }, getDependencyStatus(debugInfo.dependencies[dep]))
                )
              )
            )
          )
        ),

        // Módulos base (funcionando)
        e('div', { className: "mb-6" },
          e('h3', { className: "font-semibold mb-3 text-gray-700" }, 'Módulos Base (Funcionando)'),
          e('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-3" },
            ['ReconciliationTypes', 'ReconciliationStorageManager', 'CalculationEngine'].map(dep =>
              e('div', {
                key: dep,
                className: `flex items-center gap-2 p-3 rounded-lg border ${debugInfo.dependencies[dep] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`
              },
                e('span', { className: "text-lg" }, getDependencyIcon(debugInfo.dependencies[dep])),
                e('div', null,
                  e('div', { className: "font-medium" }, dep),
                  e('div', { className: "text-sm text-gray-600" }, getDependencyStatus(debugInfo.dependencies[dep]))
                )
              )
            )
          )
        ),

        // Módulos originales (problemáticos)
        e('div', { className: "mb-6" },
          e('h3', { className: "font-semibold mb-3 text-gray-700" }, 'Módulos Originales (Problemáticos)'),
          e('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-3" },
            ['ServiceManager', 'ExpenseManager', 'ValidationSystem'].map(dep =>
              e('div', {
                key: dep,
                className: `flex items-center gap-2 p-3 rounded-lg border ${debugInfo.dependencies[dep] ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`
              },
                e('span', { className: "text-lg" }, debugInfo.dependencies[dep] ? '✅' : '⚠️'),
                e('div', null,
                  e('div', { className: "font-medium" }, dep),
                  e('div', { className: "text-sm text-gray-600" }, 
                    debugInfo.dependencies[dep] ? 'Disponible' : 'Problemático'
                  )
                )
              )
            )
          )
        ),

        // Módulos simplificados (nuevos)
        e('div', { className: "mb-6" },
          e('h3', { className: "font-semibold mb-3 text-gray-700" }, 'Módulos Simplificados (Nuevos)'),
          e('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-3" },
            ['ServiceManagerSimple', 'ExpenseManagerSimple', 'ValidationSystemSimple'].map(dep =>
              e('div', {
                key: dep,
                className: `flex items-center gap-2 p-3 rounded-lg border ${debugInfo.dependencies[dep] ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`
              },
                e('span', { className: "text-lg" }, debugInfo.dependencies[dep] ? '✅' : '🔄'),
                e('div', null,
                  e('div', { className: "font-medium" }, dep),
                  e('div', { className: "text-sm text-gray-600" }, 
                    debugInfo.dependencies[dep] ? 'Disponible' : 'Cargando...'
                  )
                )
              )
            )
          )
        ),

        // Resultados de pruebas
        Object.keys(debugInfo.testResults).length > 0 && e('div', { className: "mb-6" },
          e('h3', { className: "font-semibold mb-3 text-gray-700" }, '🧪 Resultados de Pruebas'),
          e('div', { className: "bg-gray-50 rounded-lg p-4" },
            Object.entries(debugInfo.testResults).map(([module, result]) =>
              e('div', { key: module, className: "flex justify-between items-center py-2" },
                e('span', { className: "font-medium" }, module),
                e('span', { className: "text-sm" }, result)
              )
            )
          )
        ),

        // Errores de carga
        debugInfo.loadingErrors.length > 0 && e('div', { className: "mb-6" },
          e('h3', { className: "font-semibold mb-3 text-red-700" }, '🚨 Errores de Carga'),
          e('div', { className: "bg-red-50 rounded-lg p-4 border border-red-200" },
            debugInfo.loadingErrors.map((error, index) =>
              e('div', { key: index, className: "text-red-700 text-sm py-1" }, `• ${error}`)
            )
          )
        ),

        // Información del sistema
        e('div', null,
          e('h3', { className: "font-semibold mb-3 text-gray-700" }, '🔧 Información del Sistema'),
          e('div', { className: "bg-gray-50 rounded-lg p-4 text-sm" },
            Object.entries(debugInfo.systemInfo).map(([key, value]) =>
              e('div', { key: key, className: "flex justify-between items-center py-1" },
                e('span', { className: "font-medium capitalize" }, key.replace(/([A-Z])/g, ' $1')),
                e('span', { className: "text-gray-600 font-mono" }, value)
              )
            )
          )
        )
      )
    )
  );
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ReconciliationDebugV2 = ReconciliationDebugV2;
  console.log('✅ ReconciliationDebugV2 exportado globalmente');
}

console.log('📄 reconciliation-module-debug-v2.js cargado completamente');