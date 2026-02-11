/**
 * Módulo de conciliación simplificado para diagnóstico
 */

// Verificar que React esté disponible
if (typeof React === 'undefined') {
  console.error('❌ React no está disponible');
} else {
  console.log('✅ React disponible');
}

// Función principal del módulo de conciliación
function ReconciliationModule({ theme, onBack }) {
  console.log('🚕 ReconciliationModule iniciado');
  
  if (!React) {
    return React.createElement('div', { 
      className: `min-h-screen ${theme?.bg || 'bg-gray-50'} ${theme?.text || 'text-gray-900'} flex items-center justify-center` 
    },
      React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "text-4xl mb-4" }, '❌'),
        React.createElement('div', { className: "text-xl font-bold mb-2" }, 'Error: React no disponible'),
        React.createElement('div', { className: "text-gray-600" }, 'El módulo de conciliación requiere React para funcionar')
      )
    );
  }

  const { useState, useEffect, createElement: e } = React;
  
  // Estados básicos
  const [activeTab, setActiveTab] = useState('services');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verificar dependencias
  useEffect(() => {
    console.log('🔍 Verificando dependencias...');
    
    const dependencies = [
      'ReconciliationStorageManager',
      'CalculationEngine', 
      'ServiceManager',
      'ExpenseManager',
      'ValidationSystem'
    ];
    
    const missing = dependencies.filter(dep => !window[dep]);
    
    if (missing.length > 0) {
      console.error('❌ Dependencias faltantes:', missing);
      setError(`Dependencias faltantes: ${missing.join(', ')}`);
    } else {
      console.log('✅ Todas las dependencias disponibles');
    }
  }, []);

  // Si hay error, mostrar mensaje
  if (error) {
    return e('div', { 
      className: `min-h-screen ${theme?.bg || 'bg-gray-50'} ${theme?.text || 'text-gray-900'} flex items-center justify-center` 
    },
      e('div', { className: "text-center max-w-md mx-auto p-6" },
        e('div', { className: "text-4xl mb-4" }, '⚠️'),
        e('div', { className: "text-xl font-bold mb-2" }, 'Error de Dependencias'),
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
    className: `min-h-screen ${theme?.bg || 'bg-gray-50'} ${theme?.text || 'text-gray-900'}` 
  },
    // Header
    e('div', { className: `${theme?.card || 'bg-white'} border-b ${theme?.border || 'border-gray-200'} p-4 sticky top-0 z-10` },
      e('div', { className: "flex justify-between items-center max-w-6xl mx-auto" },
        e('div', { className: "flex items-center gap-3" },
          e('button', {
            onClick: onBack,
            className: `p-2 rounded-lg hover:${theme?.bg || 'bg-gray-100'} ${theme?.textSecondary || 'text-gray-600'}`
          }, '←'),
          e('h1', { className: "text-2xl font-bold" }, '📊 Conciliación de Taxista')
        )
      )
    ),

    // Navigation Tabs
    e('div', { className: `${theme?.card || 'bg-white'} border-b ${theme?.border || 'border-gray-200'}` },
      e('div', { className: "max-w-6xl mx-auto px-4" },
        e('div', { className: "flex gap-1 overflow-x-auto" },
          e(TabButton, {
            label: "Servicios",
            active: activeTab === 'services',
            onClick: () => setActiveTab('services'),
            theme: theme
          }),
          e(TabButton, {
            label: "Gastos", 
            active: activeTab === 'expenses',
            onClick: () => setActiveTab('expenses'),
            theme: theme
          }),
          e(TabButton, {
            label: "Conciliación",
            active: activeTab === 'reconciliation', 
            onClick: () => setActiveTab('reconciliation'),
            theme: theme
          }),
          e(TabButton, {
            label: "Historial",
            active: activeTab === 'history',
            onClick: () => setActiveTab('history'),
            theme: theme
          })
        )
      )
    ),

    // Main Content
    e('div', { className: "max-w-6xl mx-auto p-4" },
      activeTab === 'services' && e('div', { className: `${theme?.card || 'bg-white'} rounded-xl p-6 border ${theme?.border || 'border-gray-200'}` },
        e('h2', { className: "text-xl font-bold mb-4" }, 'Gestión de Servicios'),
        e('p', { className: theme?.textSecondary || 'text-gray-600' }, 
          'Aquí puedes gestionar los servicios de taxi realizados.'
        ),
        e('div', { className: "mt-4 p-4 bg-blue-50 rounded-lg" },
          e('p', { className: "text-blue-800 text-sm" },
            '✅ Módulo de servicios cargado correctamente'
          )
        )
      ),
      
      activeTab === 'expenses' && e('div', { className: `${theme?.card || 'bg-white'} rounded-xl p-6 border ${theme?.border || 'border-gray-200'}` },
        e('h2', { className: "text-xl font-bold mb-4" }, 'Gestión de Gastos'),
        e('p', { className: theme?.textSecondary || 'text-gray-600' }, 
          'Aquí puedes gestionar los gastos relacionados con el taxi.'
        ),
        e('div', { className: "mt-4 p-4 bg-green-50 rounded-lg" },
          e('p', { className: "text-green-800 text-sm" },
            '✅ Módulo de gastos cargado correctamente'
          )
        )
      ),
      
      activeTab === 'reconciliation' && e('div', { className: `${theme?.card || 'bg-white'} rounded-xl p-6 border ${theme?.border || 'border-gray-200'}` },
        e('h2', { className: "text-xl font-bold mb-4" }, 'Generar Conciliación'),
        e('p', { className: theme?.textSecondary || 'text-gray-600' }, 
          'Aquí puedes generar conciliaciones automáticas basadas en servicios y gastos.'
        ),
        e('div', { className: "mt-4 p-4 bg-purple-50 rounded-lg" },
          e('p', { className: "text-purple-800 text-sm" },
            '✅ Módulo de conciliación cargado correctamente'
          )
        )
      ),
      
      activeTab === 'history' && e('div', { className: `${theme?.card || 'bg-white'} rounded-xl p-6 border ${theme?.border || 'border-gray-200'}` },
        e('h2', { className: "text-xl font-bold mb-4" }, 'Historial de Conciliaciones'),
        e('p', { className: theme?.textSecondary || 'text-gray-600' }, 
          'Aquí puedes ver el historial de conciliaciones generadas.'
        ),
        e('div', { className: "mt-4 p-4 bg-orange-50 rounded-lg" },
          e('p', { className: "text-orange-800 text-sm" },
            '✅ Módulo de historial cargado correctamente'
          )
        )
      )
    )
  );
}

// Componente para botones de navegación
function TabButton({ label, active, onClick, theme }) {
  const { createElement: e } = React;
  
  return e('button', {
    onClick: onClick,
    className: `px-6 py-3 font-semibold whitespace-nowrap border-b-2 transition-colors ${
      active 
        ? 'border-blue-600 text-blue-600' 
        : `border-transparent ${theme?.textSecondary || 'text-gray-600'} hover:${theme?.text || 'text-gray-900'}`
    }`
  }, label);
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ReconciliationModuleSimple = ReconciliationModule;
  console.log('✅ ReconciliationModuleSimple exportado globalmente');
} else if (typeof module !== 'undefined') {
  module.exports = ReconciliationModule;
}

console.log('📄 reconciliation-module-simple.js cargado');