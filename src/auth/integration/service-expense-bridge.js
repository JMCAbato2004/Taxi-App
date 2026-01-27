/**
 * Service and Expense Management Bridge
 * Integrates existing service and expense management components with authentication
 * Requirements: 5.3, 5.5
 */

console.log('📄 Cargando service-expense-bridge.js');

/**
 * Bridge class that connects authentication with existing service/expense management
 */
class ServiceExpenseBridge {
  constructor(authService, roleService, reconciliationService, serviceExpenseIntegrationService) {
    this.authService = authService;
    this.roleService = roleService;
    this.reconciliationService = reconciliationService;
    this.integrationService = serviceExpenseIntegrationService;
    this.currentUser = null;
    this.operationContext = null;
    
    this.initialize();
  }

  /**
   * Initialize the bridge
   */
  initialize() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.operationContext = this.integrationService.getOperationContext();
    }
  }

  /**
   * Create authenticated storage wrapper
   */
  createAuthenticatedStorage(originalStorage) {
    if (!this.currentUser) {
      throw new Error('Usuario no autenticado');
    }

    return this.integrationService.wrapStorageOperations(originalStorage);
  }

  /**
   * Create authenticated service manager props
   */
  createServiceManagerProps(theme, originalStorage) {
    if (!this.currentUser) {
      return {
        theme,
        services: [],
        onAdd: () => { throw new Error('Usuario no autenticado'); },
        onUpdate: () => { throw new Error('Usuario no autenticado'); },
        onDelete: () => { throw new Error('Usuario no autenticado'); },
        userContext: null,
        canCreate: false
      };
    }

    const wrappedStorage = this.createAuthenticatedStorage(originalStorage);
    const services = wrappedStorage.getServicesWithAuth();
    const aggregatedStats = this.operationContext?.canViewAggregatedData ? 
      wrappedStorage.getAggregatedStats()?.services : null;

    return {
      theme,
      services: services.map(service => ({
        ...service,
        // Add UI metadata
        _canEdit: service.canEdit,
        _canDelete: service.canDelete,
        _createdByUser: service.createdByUser,
        _associatedTaxista: service.associatedTaxista
      })),
      onAdd: async (serviceData) => {
        try {
          await wrappedStorage.saveServiceWithAuth(serviceData);
          return true;
        } catch (error) {
          console.error('Error creating service:', error);
          throw error;
        }
      },
      onUpdate: async (serviceId, updates) => {
        try {
          await wrappedStorage.updateServiceWithAuth(serviceId, updates);
          return true;
        } catch (error) {
          console.error('Error updating service:', error);
          throw error;
        }
      },
      onDelete: async (serviceId) => {
        try {
          await wrappedStorage.deleteServiceWithAuth(serviceId);
          return true;
        } catch (error) {
          console.error('Error deleting service:', error);
          throw error;
        }
      },
      userContext: {
        user: this.currentUser,
        role: this.currentUser.rol,
        canViewAggregated: this.operationContext?.canViewAggregatedData || false,
        associatedUsers: this.operationContext?.associatedUsers || []
      },
      aggregatedStats,
      canCreate: this.operationContext?.canCreateServices || false
    };
  }

  /**
   * Create authenticated expense manager props
   */
  createExpenseManagerProps(theme, originalStorage) {
    if (!this.currentUser) {
      return {
        theme,
        expenses: [],
        onAdd: () => { throw new Error('Usuario no autenticado'); },
        onUpdate: () => { throw new Error('Usuario no autenticado'); },
        onDelete: () => { throw new Error('Usuario no autenticado'); },
        userContext: null,
        canCreate: false
      };
    }

    const wrappedStorage = this.createAuthenticatedStorage(originalStorage);
    const expenses = wrappedStorage.getExpensesWithAuth();
    const aggregatedStats = this.operationContext?.canViewAggregatedData ? 
      wrappedStorage.getAggregatedStats()?.expenses : null;

    return {
      theme,
      expenses: expenses.map(expense => ({
        ...expense,
        // Add UI metadata
        _canEdit: expense.canEdit,
        _canDelete: expense.canDelete,
        _createdByUser: expense.createdByUser,
        _associatedTaxista: expense.associatedTaxista
      })),
      onAdd: async (expenseData) => {
        try {
          await wrappedStorage.saveExpenseWithAuth(expenseData);
          return true;
        } catch (error) {
          console.error('Error creating expense:', error);
          throw error;
        }
      },
      onUpdate: async (expenseId, updates) => {
        try {
          await wrappedStorage.updateExpenseWithAuth(expenseId, updates);
          return true;
        } catch (error) {
          console.error('Error updating expense:', error);
          throw error;
        }
      },
      onDelete: async (expenseId) => {
        try {
          await wrappedStorage.deleteExpenseWithAuth(expenseId);
          return true;
        } catch (error) {
          console.error('Error deleting expense:', error);
          throw error;
        }
      },
      userContext: {
        user: this.currentUser,
        role: this.currentUser.rol,
        canViewAggregated: this.operationContext?.canViewAggregatedData || false,
        associatedUsers: this.operationContext?.associatedUsers || []
      },
      aggregatedStats,
      canCreate: this.operationContext?.canCreateExpenses || false
    };
  }

  /**
   * Create enhanced service manager component with authentication
   */
  createAuthenticatedServiceManager(theme, originalStorage) {
    const props = this.createServiceManagerProps(theme, originalStorage);
    
    // Return a wrapper component that adds authentication context
    return function AuthenticatedServiceManagerWrapper({ onError, onSuccess }) {
      const { useState, useEffect, createElement: e } = React;
      const [services, setServices] = useState(props.services);
      const [loading, setLoading] = useState(false);

      // Reload services function
      const reloadServices = async () => {
        setLoading(true);
        try {
          const wrappedStorage = this.createAuthenticatedStorage(originalStorage);
          const updatedServices = wrappedStorage.getServicesWithAuth();
          setServices(updatedServices.map(service => ({
            ...service,
            _canEdit: service.canEdit,
            _canDelete: service.canDelete,
            _createdByUser: service.createdByUser,
            _associatedTaxista: service.associatedTaxista
          })));
        } catch (error) {
          if (onError) onError(error);
        } finally {
          setLoading(false);
        }
      };

      // Enhanced handlers with reload
      const enhancedProps = {
        ...props,
        services,
        onAdd: async (serviceData) => {
          try {
            await props.onAdd(serviceData);
            await reloadServices();
            if (onSuccess) onSuccess('Servicio creado correctamente');
          } catch (error) {
            if (onError) onError(error);
          }
        },
        onUpdate: async (serviceId, updates) => {
          try {
            await props.onUpdate(serviceId, updates);
            await reloadServices();
            if (onSuccess) onSuccess('Servicio actualizado correctamente');
          } catch (error) {
            if (onError) onError(error);
          }
        },
        onDelete: async (serviceId) => {
          try {
            await props.onDelete(serviceId);
            await reloadServices();
            if (onSuccess) onSuccess('Servicio eliminado correctamente');
          } catch (error) {
            if (onError) onError(error);
          }
        }
      };

      // Use existing ServiceManager component
      return e(window.ServiceManager || window.ServiceManagerSimple, enhancedProps);
    }.bind(this);
  }

  /**
   * Create enhanced expense manager component with authentication
   */
  createAuthenticatedExpenseManager(theme, originalStorage) {
    const props = this.createExpenseManagerProps(theme, originalStorage);
    
    // Return a wrapper component that adds authentication context
    return function AuthenticatedExpenseManagerWrapper({ onError, onSuccess }) {
      const { useState, useEffect, createElement: e } = React;
      const [expenses, setExpenses] = useState(props.expenses);
      const [loading, setLoading] = useState(false);

      // Reload expenses function
      const reloadExpenses = async () => {
        setLoading(true);
        try {
          const wrappedStorage = this.createAuthenticatedStorage(originalStorage);
          const updatedExpenses = wrappedStorage.getExpensesWithAuth();
          setExpenses(updatedExpenses.map(expense => ({
            ...expense,
            _canEdit: expense.canEdit,
            _canDelete: expense.canDelete,
            _createdByUser: expense.createdByUser,
            _associatedTaxista: expense.associatedTaxista
          })));
        } catch (error) {
          if (onError) onError(error);
        } finally {
          setLoading(false);
        }
      };

      // Enhanced handlers with reload
      const enhancedProps = {
        ...props,
        expenses,
        onAdd: async (expenseData) => {
          try {
            await props.onAdd(expenseData);
            await reloadExpenses();
            if (onSuccess) onSuccess('Gasto creado correctamente');
          } catch (error) {
            if (onError) onError(error);
          }
        },
        onUpdate: async (expenseId, updates) => {
          try {
            await props.onUpdate(expenseId, updates);
            await reloadExpenses();
            if (onSuccess) onSuccess('Gasto actualizado correctamente');
          } catch (error) {
            if (onError) onError(error);
          }
        },
        onDelete: async (expenseId) => {
          try {
            await props.onDelete(expenseId);
            await reloadExpenses();
            if (onSuccess) onSuccess('Gasto eliminado correctamente');
          } catch (error) {
            if (onError) onError(error);
          }
        }
      };

      // Use existing ExpenseManager component
      return e(window.ExpenseManager || window.ExpenseManagerSimple, enhancedProps);
    }.bind(this);
  }

  /**
   * Get user context for UI
   */
  getUserContext() {
    return {
      user: this.currentUser,
      role: this.currentUser?.rol || null,
      canViewAggregated: this.operationContext?.canViewAggregatedData || false,
      canCreateServices: this.operationContext?.canCreateServices || false,
      canCreateExpenses: this.operationContext?.canCreateExpenses || false,
      associatedUsers: this.operationContext?.associatedUsers || []
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Refresh authentication context
   */
  refreshContext() {
    this.initialize();
  }
}

/**
 * Factory function to create service expense bridge
 */
function createServiceExpenseBridge(authService, roleService, reconciliationService, serviceExpenseIntegrationService) {
  return new ServiceExpenseBridge(authService, roleService, reconciliationService, serviceExpenseIntegrationService);
}

// Export globally
if (typeof window !== 'undefined') {
  window.ServiceExpenseBridge = ServiceExpenseBridge;
  window.createServiceExpenseBridge = createServiceExpenseBridge;
  console.log('✅ ServiceExpenseBridge exportado globalmente');
}

// Export as module if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ServiceExpenseBridge, createServiceExpenseBridge };
}

console.log('📄 service-expense-bridge.js cargado completamente');