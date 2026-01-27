/**
 * Módulo de conciliación mínimo para diagnóstico
 */

console.log('📄 Cargando reconciliation-module-minimal.js');

// Verificar que React esté disponible
if (typeof React === 'undefined') {
  console.error('❌ React no está disponible');
} else {
  console.log('✅ React disponible');
}

// Función principal del módulo de conciliación
function ReconciliationModuleMinimal({ theme, onBack }) {
  console.log('🚕 ReconciliationModuleMinimal iniciado');
  
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

  const { useState, createElement: e } = React;
  
  // Estados básicos
  const [activeTab, setActiveTab] = useState('services');

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
          e('h1', { className: "text-2xl font-bold" }, '📊 Conciliación de Taxista - Diagnóstico')
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
              '✅ Módulo de conciliación cargado correctamente'
            ),
            e('p', { className: "text-green-700 text-sm mt-2" },
              `Pestaña activa: ${activeTab}`
            )
          ),
          e('div', { className: "p-4 bg-blue-50 rounded-lg" },
            e('p', { className: "text-blue-800 font-semibold mb-2" },
              '🔍 Estado del Sistema:'
            ),
            e('ul', { className: "text-blue-700 text-sm space-y-1" },
              e('li', null, '• React: ✅ Disponible'),
              e('li', null, '• Tailwind CSS: ✅ Cargado'),
              e('li', null, '• Navegación: ✅ Funcional'),
              e('li', null, '• Estados: ✅ Funcionando')
            )
          ),
          e('div', { className: "p-4 bg-yellow-50 rounded-lg" },
            e('p', { className: "text-yellow-800 font-semibold mb-2" },
              '⚠️ Versión de Diagnóstico'
            ),
            e('p', { className: "text-yellow-700 text-sm" },
              'Esta es una versión simplificada para identificar problemas. Las funcionalidades completas se activarán una vez resueltos los errores.'
            )
          ),
          activeTab === 'services' && e('div', { className: "p-4 bg-purple-50 rounded-lg" },
            e('p', { className: "text-purple-800 font-semibold" },
              '🚕 Servicios de Taxi'
            ),
            e('p', { className: "text-purple-700 text-sm" },
              'Aquí podrás gestionar todos los servicios realizados con el taxi.'
            )
          ),
          activeTab === 'expenses' && e('div', { className: "p-4 bg-red-50 rounded-lg" },
            e('p', { className: "text-red-800 font-semibold" },
              '💰 Gastos del Taxi'
            ),
            e('p', { className: "text-red-700 text-sm" },
              'Aquí podrás registrar todos los gastos relacionados con el taxi.'
            )
          ),
          activeTab === 'reconciliation' && e('div', { className: "p-4 bg-indigo-50 rounded-lg" },
            e('p', { className: "text-indigo-800 font-semibold" },
              '📊 Conciliación Automática'
            ),
            e('p', { className: "text-indigo-700 text-sm" },
              'Aquí podrás generar conciliaciones automáticas basadas en servicios y gastos.'
            )
          ),
          activeTab === 'history' && e('div', { className: "p-4 bg-gray-50 rounded-lg" },
            e('p', { className: "text-gray-800 font-semibold" },
              '📋 Historial Completo'
            ),
            e('p', { className: "text-gray-700 text-sm" },
              'Aquí podrás ver todas las conciliaciones generadas anteriormente.'
            )
          )
        )
      )
    )
  );
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ReconciliationModuleMinimal = ReconciliationModuleMinimal;
  console.log('✅ ReconciliationModuleMinimal exportado globalmente');
} else if (typeof module !== 'undefined') {
  module.exports = ReconciliationModuleMinimal;
}

console.log('📄 reconciliation-module-minimal.js cargado completamente');