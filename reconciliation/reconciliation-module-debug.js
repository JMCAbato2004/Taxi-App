/**
 * Módulo de conciliación para debug - Sin dependencias externas
 */

console.log('📄 Cargando reconciliation-module-debug.js');

// Función principal del módulo de conciliación
function ReconciliationModuleDebug({ theme, onBack }) {
  console.log('🚕 ReconciliationModuleDebug iniciado');
  
  if (!React) {
    return React.createElement('div', { 
      className: 'min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center' 
    },
      React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "text-4xl mb-4" }, '❌'),
        React.createElement('div', { className: "text-xl font-bold mb-2" }, 'Error: React no disponible')
      )
    );
  }

  const { useState, useEffect, createElement: e } = React;
  
  // Estados básicos
  const [activeTab, setActiveTab] = useState('services');
  const [debugInfo, setDebugInfo] = useState({});

  // Debug de dependencias
  useEffect(() => {
    console.log('🔍 Verificando todas las dependencias...');
    
    const dependencies = {
      'React': typeof React !== 'undefined',
      'window': typeof window !== 'undefined',
      'ReconciliationTypes': typeof window?.ReconciliationTypes !== 'undefined',
      'ReconciliationStorageManager': typeof window?.ReconciliationStorageManager !== 'undefined',
      'CalculationEngine': typeof window?.CalculationEngine !== 'undefined',
      'ServiceManager': typeof window?.ServiceManager !== 'undefined',
      'ExpenseManager': typeof window?.ExpenseManager !== 'undefined',
      'ValidationSystem': typeof window?.ValidationSystem !== 'undefined'
    };
    
    console.log('📊 Estado de dependencias:', dependencies);
    setDebugInfo(dependencies);
    
    // Verificar qué está disponible en window
    if (typeof window !== 'undefined') {
      const windowKeys = Object.keys(window).filter(key => key.includes('Reconciliation') || key.includes('Manager') || key.includes('Engine'));
      console.log('🔑 Claves relacionadas en window:', windowKeys);
    }
    
  }, []);

  // Renderizado principal
  return e('div', { 
    className: 'min-h-screen bg-gray-50 text-gray-900' 
  },
    // Header
    e('div', { className: 'bg-white border-b border-gray-200 p-4 sticky top-0 z-10' },
      e('div', { className: "flex justify-between items-center max-w-6xl mx-auto" },
        e('div', { className: "flex items-center gap-3" },
          e('button', {
            onClick: onBack,
            className: 'p-2 rounded-lg hover:bg-gray-100 text-gray-600'
          }, '←'),
          e('h1', { className: "text-2xl font-bold" }, '🔍 Debug de Dependencias')
        )
      )
    ),

    // Navigation Tabs
    e('div', { className: 'bg-white border-b border-gray-200' },
      e('div', { className: "max-w-6xl mx-auto px-4" },
        e('div', { className: "flex gap-1 overflow-x-auto" },
          e('button', {
            onClick: () => setActiveTab('debug'),
            className: `px-6 py-3 font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'debug' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`
          }, 'Debug'),
          e('button', {
            onClick: () => setActiveTab('test'),
            className: `px-6 py-3 font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'test' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`
          }, 'Test')
        )
      )
    ),

    // Main Content
    e('div', { className: "max-w-6xl mx-auto p-4" },
      e('div', { className: 'bg-white rounded-xl p-6 border border-gray-200' },
        e('h2', { className: "text-xl font-bold mb-4" }, 
          activeTab === 'debug' ? 'Estado de Dependencias' : 'Pruebas de Funcionalidad'
        ),
        e('div', { className: "space-y-4" },
          activeTab === 'debug' && e('div', { className: "space-y-3" },
            e('div', { className: "p-4 bg-blue-50 rounded-lg" },
              e('p', { className: "text-blue-800 font-semibold mb-3" },
                '📊 Estado de Dependencias:'
              ),
              e('div', { className: "grid grid-cols-2 gap-2 text-sm" },
                ...Object.entries(debugInfo).map(([key, available]) => 
                  e('div', { 
                    key: key, 
                    className: `p-2 rounded ${available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}` 
                  },
                    `${available ? '✅' : '❌'} ${key}`
                  )
                )
              )
            ),
            e('div', { className: "p-4 bg-gray-50 rounded-lg" },
              e('p', { className: "text-gray-800 font-semibold mb-2" },
                '🔧 Información del Sistema:'
              ),
              e('ul', { className: "text-gray-700 text-sm space-y-1" },
                e('li', null, `• React: ${typeof React !== 'undefined' ? 'Disponible' : 'No disponible'}`),
                e('li', null, `• Window: ${typeof window !== 'undefined' ? 'Disponible' : 'No disponible'}`),
                e('li', null, `• User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'No disponible'}`),
                e('li', null, `• Timestamp: ${new Date().toLocaleString()}`)
              )
            )
          ),
          activeTab === 'test' && e('div', { className: "space-y-3" },
            e('div', { className: "p-4 bg-green-50 rounded-lg" },
              e('p', { className: "text-green-800 font-semibold mb-2" },
                '✅ Funcionalidades Básicas'
              ),
              e('ul', { className: "text-green-700 text-sm space-y-1" },
                e('li', null, '• React: Funcionando'),
                e('li', null, '• Estados: Funcionando'),
                e('li', null, '• Navegación: Funcionando'),
                e('li', null, '• Tailwind CSS: Funcionando')
              )
            ),
            e('div', { className: "p-4 bg-yellow-50 rounded-lg" },
              e('p', { className: "text-yellow-800 font-semibold mb-2" },
                '⚠️ Próximos Pasos'
              ),
              e('p', { className: "text-yellow-700 text-sm" },
                'Una vez identificadas las dependencias faltantes, las cargaremos una por una para identificar el problema específico.'
              )
            )
          )
        )
      )
    )
  );
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ReconciliationModuleDebug = ReconciliationModuleDebug;
  console.log('✅ ReconciliationModuleDebug exportado globalmente');
}

console.log('📄 reconciliation-module-debug.js cargado completamente');