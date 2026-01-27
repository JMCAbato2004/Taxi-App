/**
 * Módulo de Reconciliación Funcional
 * Usa los módulos simplificados que funcionan correctamente
 */

console.log('🚕 Cargando reconciliation-module-functional.js');

/**
 * Componente principal de reconciliación funcional
 */
function ReconciliationModuleFunctional({ theme, onBack, initialTab = 'services' }) {
  const { useState, useEffect, createElement: e } = React;

  // Estados principales - usar initialTab como valor por defecto
  const [activeTab, setActiveTab] = useState(initialTab);
  const [services, setServices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [storageManager, setStorageManager] = useState(null);
  const [validationSystem, setValidationSystem] = useState(null);

  // Inicializar sistemas
  useEffect(() => {
    try {
      if (window.ReconciliationStorageManager) {
        const storage = new window.ReconciliationStorageManager();
        setStorageManager(storage);
        
        // Cargar datos existentes
        const existingServices = storage.getServices();
        const existingExpenses = storage.getExpenses();
        
        setServices(existingServices);
        setExpenses(existingExpenses);
        
        console.log('✅ Datos cargados:', {
          services: existingServices.length,
          expenses: existingExpenses.length
        });
      }

      if (window.ValidationSystemSimple) {
        const validator = new window.ValidationSystemSimple();
        setValidationSystem(validator);
        console.log('✅ Sistema de validación inicializado');
      }
    } catch (error) {
      console.error('❌ Error inicializando sistemas:', error);
    }
  }, []);

  // Handlers para servicios
  const handleAddService = (serviceData) => {
    try {
      if (!storageManager) return;

      // Validar servicio
      if (validationSystem) {
        const validation = validationSystem.validateService(serviceData);
        if (!validation.valid) {
          alert('Error de validación: ' + validation.errors.map(e => e.message).join(', '));
          return;
        }
      }

      // Guardar servicio
      const success = storageManager.saveService(serviceData);
      if (success) {
        const updatedServices = storageManager.getServices();
        setServices(updatedServices);
        console.log('✅ Servicio guardado correctamente');
      } else {
        alert('Error guardando el servicio');
      }
    } catch (error) {
      console.error('❌ Error añadiendo servicio:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleUpdateService = (id, updates) => {
    try {
      if (!storageManager) return;

      // Validar actualizaciones
      if (validationSystem) {
        const validation = validationSystem.validateService(updates);
        if (!validation.valid) {
          alert('Error de validación: ' + validation.errors.map(e => e.message).join(', '));
          return;
        }
      }

      const success = storageManager.updateService(id, updates);
      if (success) {
        const updatedServices = storageManager.getServices();
        setServices(updatedServices);
        console.log('✅ Servicio actualizado correctamente');
      } else {
        alert('Error actualizando el servicio');
      }
    } catch (error) {
      console.error('❌ Error actualizando servicio:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteService = (id) => {
    try {
      if (!storageManager) return;

      const success = storageManager.deleteService(id);
      if (success) {
        const updatedServices = storageManager.getServices();
        setServices(updatedServices);
        console.log('✅ Servicio eliminado correctamente');
      } else {
        alert('Error eliminando el servicio');
      }
    } catch (error) {
      console.error('❌ Error eliminando servicio:', error);
      alert('Error: ' + error.message);
    }
  };

  // Handlers para gastos
  const handleAddExpense = (expenseData) => {
    try {
      if (!storageManager) return;

      // Validar gasto
      if (validationSystem) {
        const validation = validationSystem.validateExpense(expenseData);
        if (!validation.valid) {
          alert('Error de validación: ' + validation.errors.map(e => e.message).join(', '));
          return;
        }
      }

      const success = storageManager.saveExpense(expenseData);
      if (success) {
        const updatedExpenses = storageManager.getExpenses();
        setExpenses(updatedExpenses);
        console.log('✅ Gasto guardado correctamente');
      } else {
        alert('Error guardando el gasto');
      }
    } catch (error) {
      console.error('❌ Error añadiendo gasto:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleUpdateExpense = (id, updates) => {
    try {
      if (!storageManager) return;

      // Validar actualizaciones
      if (validationSystem) {
        const validation = validationSystem.validateExpense(updates);
        if (!validation.valid) {
          alert('Error de validación: ' + validation.errors.map(e => e.message).join(', '));
          return;
        }
      }

      const success = storageManager.updateExpense(id, updates);
      if (success) {
        const updatedExpenses = storageManager.getExpenses();
        setExpenses(updatedExpenses);
        console.log('✅ Gasto actualizado correctamente');
      } else {
        alert('Error actualizando el gasto');
      }
    } catch (error) {
      console.error('❌ Error actualizando gasto:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDeleteExpense = (id) => {
    try {
      if (!storageManager) return;

      const success = storageManager.deleteExpense(id);
      if (success) {
        const updatedExpenses = storageManager.getExpenses();
        setExpenses(updatedExpenses);
        console.log('✅ Gasto eliminado correctamente');
      } else {
        alert('Error eliminando el gasto');
      }
    } catch (error) {
      console.error('❌ Error eliminando gasto:', error);
      alert('Error: ' + error.message);
    }
  };

  // Verificar disponibilidad de componentes
  const hasServiceManager = typeof window.ServiceManagerSimple !== 'undefined';
  const hasExpenseManager = typeof window.ExpenseManagerSimple !== 'undefined';

  return e('div', { className: "min-h-screen bg-gray-50" },
    // Header
    e('div', { className: "bg-white shadow-sm border-b" },
      e('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
        e('div', { className: "flex justify-between items-center py-4" },
          e('div', { className: "flex items-center gap-4" },
            e('div', null,
              e('h1', { className: "text-2xl font-bold text-gray-900" }, '🚕 Sistema de Conciliación'),
              e('p', { className: "text-sm text-gray-600" }, 'Gestión completa de servicios y gastos')
            )
          ),
          e('div', { className: "flex items-center gap-2 text-sm" },
            e('span', { className: "px-2 py-1 bg-green-100 text-green-800 rounded-full" }, 
              `${services.length} servicios`
            ),
            e('span', { className: "px-2 py-1 bg-red-100 text-red-800 rounded-full" }, 
              `${expenses.length} gastos`
            )
          )
        )
      )
    ),

    // Navegación por pestañas
    e('div', { className: "bg-white border-b" },
      e('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
        e('nav', { className: "flex space-x-8" },
          e('button', {
            onClick: () => setActiveTab('services'),
            className: `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`
          }, '🚕 Servicios'),
          e('button', {
            onClick: () => setActiveTab('expenses'),
            className: `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'expenses'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`
          }, '💰 Gastos'),
          e('button', {
            onClick: () => setActiveTab('reconciliation'),
            className: `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reconciliation'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`
          }, '📊 Conciliación')
        )
      )
    ),

    // Contenido principal
    e('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" },
      // Pestaña de servicios
      activeTab === 'services' && (
        hasServiceManager ? e(window.ServiceManagerSimple, {
          theme: theme,
          services: services,
          onAdd: handleAddService,
          onUpdate: handleUpdateService,
          onDelete: handleDeleteService
        }) : e('div', { className: "text-center py-12" },
          e('div', { className: "text-4xl mb-4" }, '⚠️'),
          e('h3', { className: "text-lg font-medium text-gray-900 mb-2" }, 'ServiceManager no disponible'),
          e('p', { className: "text-gray-600" }, 'El componente ServiceManagerSimple no se ha cargado correctamente')
        )
      ),

      // Pestaña de gastos
      activeTab === 'expenses' && (
        hasExpenseManager ? e(window.ExpenseManagerSimple, {
          theme: theme,
          expenses: expenses,
          onAdd: handleAddExpense,
          onUpdate: handleUpdateExpense,
          onDelete: handleDeleteExpense
        }) : e('div', { className: "text-center py-12" },
          e('div', { className: "text-4xl mb-4" }, '⚠️'),
          e('h3', { className: "text-lg font-medium text-gray-900 mb-2" }, 'ExpenseManager no disponible'),
          e('p', { className: "text-gray-600" }, 'El componente ExpenseManagerSimple no se ha cargado correctamente')
        )
      ),

      // Pestaña de conciliación
      activeTab === 'reconciliation' && e(window.ConciliationModule, {
        theme: theme,
        services: services,
        expenses: expenses,
        onBack: () => setActiveTab('services')
      })
    )
  );
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ReconciliationModuleFunctional = ReconciliationModuleFunctional;
  console.log('✅ ReconciliationModuleFunctional exportado globalmente');
}

console.log('📄 reconciliation-module-functional.js cargado completamente');