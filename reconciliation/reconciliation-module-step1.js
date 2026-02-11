/**
 * Módulo de conciliación - Paso 1: Con tipos y storage
 */

console.log('📄 Cargando reconciliation-module-step1.js');

// Función principal del módulo de conciliación
function ReconciliationModuleStep1({ theme, onBack }) {
  console.log('🚕 ReconciliationModuleStep1 iniciado');
  
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
  const [error, setError] = useState(null);
  const [storageManager, setStorageManager] = useState(null);
  const [services, setServices] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Verificar dependencias y cargar datos
  useEffect(() => {
    console.log('🔍 Verificando dependencias paso 1...');
    
    try {
      // Verificar tipos
      if (typeof window.ReconciliationTypes === 'undefined') {
        throw new Error('ReconciliationTypes no disponible');
      }
      console.log('✅ Tipos disponibles');

      // Verificar storage manager
      if (typeof window.ReconciliationStorageManager === 'undefined') {
        throw new Error('ReconciliationStorageManager no disponible');
      }
      
      // Inicializar storage manager
      const storage = new window.ReconciliationStorageManager();
      setStorageManager(storage);
      console.log('✅ StorageManager inicializado');
      
      // Cargar datos
      const loadedServices = storage.getServices();
      const loadedExpenses = storage.getExpenses();
      
      setServices(loadedServices);
      setExpenses(loadedExpenses);
      
      console.log(`📊 Datos cargados: ${loadedServices.length} servicios, ${loadedExpenses.length} gastos`);
      
    } catch (err) {
      console.error('❌ Error en paso 1:', err);
      setError(err.message);
    }
  }, []);

  // Si hay error, mostrar mensaje
  if (error) {
    return e('div', { 
      className: 'min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center' 
    },
      e('div', { className: "text-center max-w-md mx-auto p-6" },
        e('div', { className: "text-4xl mb-4" }, '⚠️'),
        e('div', { className: "text-xl font-bold mb-2" }, 'Error en Paso 1'),
        e('div', { className: "text-gray-600 mb-4" }, error),
        e('button', {
          onClick: onBack,
          className: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
        }, 'Volver')
      )
    );
  }

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
          e('h1', { className: "text-2xl font-bold" }, '📊 Conciliación - Paso 1')
        )
      )
    ),

    // Navigation Tabs
    e('div', { className: 'bg-white border-b border-gray-200' },
      e('div', { className: "max-w-6xl mx-auto px-4" },
        e('div', { className: "flex gap-1 overflow-x-auto" },
          e('button', {
            onClick: () => setActiveTab('services'),
            className: `px-6 py-3 font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'services' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`
          }, 'Servicios'),
          e('button', {
            onClick: () => setActiveTab('expenses'),
            className: `px-6 py-3 font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'expenses' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`
          }, 'Gastos'),
          e('button', {
            onClick: () => setActiveTab('reconciliation'),
            className: `px-6 py-3 font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'reconciliation' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`
          }, 'Conciliación'),
          e('button', {
            onClick: () => setActiveTab('history'),
            className: `px-6 py-3 font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'history' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`
          }, 'Historial')
        )
      )
    ),

    // Main Content
    e('div', { className: "max-w-6xl mx-auto p-4" },
      e('div', { className: 'bg-white rounded-xl p-6 border border-gray-200' },
        e('h2', { className: "text-xl font-bold mb-4" }, 
          activeTab === 'services' ? 'Gestión de Servicios' :
          activeTab === 'expenses' ? 'Gestión de Gastos' :
          activeTab === 'reconciliation' ? 'Generar Conciliación' :
          'Historial de Conciliaciones'
        ),
        e('div', { className: "space-y-4" },
          e('div', { className: "p-4 bg-green-50 rounded-lg" },
            e('p', { className: "text-green-800 font-semibold" },
              '✅ Paso 1 completado: Tipos y Storage'
            ),
            e('p', { className: "text-green-700 text-sm mt-2" },
              `Pestaña activa: ${activeTab}`
            )
          ),
          e('div', { className: "p-4 bg-blue-50 rounded-lg" },
            e('p', { className: "text-blue-800 font-semibold mb-2" },
              '📊 Datos Cargados:'
            ),
            e('ul', { className: "text-blue-700 text-sm space-y-1" },
              e('li', null, `• Servicios: ${services.length}`),
              e('li', null, `• Gastos: ${expenses.length}`),
              e('li', null, '• StorageManager: ✅ Funcionando'),
              e('li', null, '• Tipos: ✅ Disponibles')
            )
          ),
          activeTab === 'services' && e('div', { className: "p-4 bg-purple-50 rounded-lg" },
            e('p', { className: "text-purple-800 font-semibold mb-2" },
              '🚕 Servicios Cargados'
            ),
            services.length > 0 ? 
              e('div', { className: "space-y-2" },
                ...services.slice(0, 3).map((service, index) => 
                  e('div', { key: index, className: "text-purple-700 text-sm p-2 bg-purple-100 rounded" },
                    `${service.date} - ${service.platform} - €${service.totalAmount}`
                  )
                ),
                services.length > 3 && e('p', { className: "text-purple-600 text-xs" },
                  `... y ${services.length - 3} más`
                )
              ) :
              e('p', { className: "text-purple-700 text-sm" },
                'No hay servicios registrados aún'
              )
          ),
          activeTab === 'expenses' && e('div', { className: "p-4 bg-red-50 rounded-lg" },
            e('p', { className: "text-red-800 font-semibold mb-2" },
              '💰 Gastos Cargados'
            ),
            expenses.length > 0 ? 
              e('div', { className: "space-y-2" },
                ...expenses.slice(0, 3).map((expense, index) => 
                  e('div', { key: index, className: "text-red-700 text-sm p-2 bg-red-100 rounded" },
                    `${expense.date} - ${expense.category} - €${expense.amount}`
                  )
                ),
                expenses.length > 3 && e('p', { className: "text-red-600 text-xs" },
                  `... y ${expenses.length - 3} más`
                )
              ) :
              e('p', { className: "text-red-700 text-sm" },
                'No hay gastos registrados aún'
              )
          ),
          e('div', { className: "p-4 bg-yellow-50 rounded-lg" },
            e('p', { className: "text-yellow-800 font-semibold mb-2" },
              '🔄 Siguiente Paso'
            ),
            e('p', { className: "text-yellow-700 text-sm" },
              'Una vez confirmado que este paso funciona, activaremos el motor de cálculos y los managers.'
            )
          )
        )
      )
    )
  );
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ReconciliationModuleStep1 = ReconciliationModuleStep1;
  console.log('✅ ReconciliationModuleStep1 exportado globalmente');
}

console.log('📄 reconciliation-module-step1.js cargado completamente');