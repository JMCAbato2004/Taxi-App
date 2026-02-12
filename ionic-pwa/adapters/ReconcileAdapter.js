/**
 * ReconcileAdapter - Integration layer between Ionic UI and existing reconciliation system
 * Connects the Ionic PWA interface to the JavaScript reconciliation modules
 */
class ReconcileAdapter {
  constructor(authAdapter = null) {
    // Will be initialized with actual reconciliation services when integrated
    this.storageManager = null;
    this.roleService = null;
    this.calculationEngine = null;
    this.authAdapter = authAdapter;
  }

  /**
   * Initialize the adapter with reconciliation services
   * @param {Object} storageManager - Storage manager instance
   * @param {Object} roleService - Role service instance
   * @param {Object} calculationEngine - Calculation engine instance
   */
  initialize(storageManager, roleService, calculationEngine) {
    this.storageManager = storageManager;
    this.roleService = roleService;
    this.calculationEngine = calculationEngine;
  }

  /**
   * Get services filtered by role
   * @returns {Promise<Array>} Array of services
   */
  async getServices() {
    try {
      // TODO: Integrate with actual storageManager.getServices()
      const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
      
      // Filter by role (will use roleService when integrated)
      const currentUser = JSON.parse(localStorage.getItem('taxi_auth_current_user') || 'null');
      if (!currentUser) return [];

      if (currentUser.rol === 'TAXISTA') {
        return services.filter(s => s.userId === currentUser.id);
      }

      // PATRON sees all services from associated taxistas
      return services;
    } catch (error) {
      console.error('Get services error:', error);
      return [];
    }
  }

  /**
   * Create a new service
   * @param {Object} serviceData - Service data
   * @returns {Promise<Object>} Created service
   */
  async createService(serviceData) {
    try {
      // Try to get user from AuthAdapter first, fallback to localStorage
      let currentUser = null;
      if (this.authAdapter) {
        currentUser = this.authAdapter.getCurrentUser();
      }
      
      // Fallback to localStorage if AuthAdapter not available
      if (!currentUser) {
        currentUser = JSON.parse(localStorage.getItem('taxi_auth_current_user') || 'null');
      }
      
      if (!currentUser) throw new Error('Usuario no autenticado');

      const service = {
        id: 'service-' + Date.now(),
        ...serviceData,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
      services.push(service);
      localStorage.setItem('taxi_services', JSON.stringify(services));

      return service;
    } catch (error) {
      console.error('Create service error:', error);
      throw new Error('Error al crear el servicio: ' + error.message);
    }
  }

  /**
   * Update an existing service
   * @param {string} id - Service ID
   * @param {Object} updates - Updated data
   * @returns {Promise<Object>} Updated service
   */
  async updateService(id, updates) {
    try {
      const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
      const index = services.findIndex(s => s.id === id);
      
      if (index === -1) {
        throw new Error('Servicio no encontrado');
      }

      services[index] = {
        ...services[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('taxi_services', JSON.stringify(services));
      return services[index];
    } catch (error) {
      console.error('Update service error:', error);
      throw new Error('Error al actualizar el servicio: ' + error.message);
    }
  }

  /**
   * Delete a service
   * @param {string} id - Service ID
   * @returns {Promise<void>}
   */
  async deleteService(id) {
    try {
      const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
      const filtered = services.filter(s => s.id !== id);
      localStorage.setItem('taxi_services', JSON.stringify(filtered));
    } catch (error) {
      console.error('Delete service error:', error);
      throw new Error('Error al eliminar el servicio: ' + error.message);
    }
  }

  /**
   * Get expenses filtered by role
   * @returns {Promise<Array>} Array of expenses
   */
  async getExpenses() {
    try {
      const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
      
      // Filter by role
      const currentUser = JSON.parse(localStorage.getItem('taxi_auth_current_user') || 'null');
      if (!currentUser) return [];

      if (currentUser.rol === 'TAXISTA') {
        return expenses.filter(e => e.userId === currentUser.id);
      }

      // PATRON sees all expenses from associated taxistas
      return expenses;
    } catch (error) {
      console.error('Get expenses error:', error);
      return [];
    }
  }

  /**
   * Create a new expense
   * @param {Object} expenseData - Expense data
   * @returns {Promise<Object>} Created expense
   */
  async createExpense(expenseData) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('taxi_auth_current_user') || 'null');
      if (!currentUser) throw new Error('Usuario no autenticado');

      const expense = {
        id: 'expense-' + Date.now(),
        ...expenseData,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
      expenses.push(expense);
      localStorage.setItem('taxi_expenses', JSON.stringify(expenses));

      return expense;
    } catch (error) {
      console.error('Create expense error:', error);
      throw new Error('Error al crear el gasto: ' + error.message);
    }
  }

  /**
   * Update an existing expense
   * @param {string} id - Expense ID
   * @param {Object} updates - Updated data
   * @returns {Promise<Object>} Updated expense
   */
  async updateExpense(id, updates) {
    try {
      const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
      const index = expenses.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new Error('Gasto no encontrado');
      }

      expenses[index] = {
        ...expenses[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('taxi_expenses', JSON.stringify(expenses));
      return expenses[index];
    } catch (error) {
      console.error('Update expense error:', error);
      throw new Error('Error al actualizar el gasto: ' + error.message);
    }
  }

  /**
   * Delete an expense
   * @param {string} id - Expense ID
   * @returns {Promise<void>}
   */
  async deleteExpense(id) {
    try {
      const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
      const filtered = expenses.filter(e => e.id !== id);
      localStorage.setItem('taxi_expenses', JSON.stringify(filtered));
    } catch (error) {
      console.error('Delete expense error:', error);
      throw new Error('Error al eliminar el gasto: ' + error.message);
    }
  }

  /**
   * Get reconciliations filtered by role
   * @returns {Promise<Array>} Array of reconciliations
   */
  async getReconciliations() {
    try {
      const reconciliations = JSON.parse(localStorage.getItem('taxi_reconciliations') || '[]');
      
      // Filter by role
      const currentUser = JSON.parse(localStorage.getItem('taxi_auth_current_user') || 'null');
      if (!currentUser) return [];

      if (currentUser.rol === 'TAXISTA') {
        return reconciliations.filter(r => r.userId === currentUser.id);
      }

      // PATRON sees all reconciliations from associated taxistas
      return reconciliations;
    } catch (error) {
      console.error('Get reconciliations error:', error);
      return [];
    }
  }

  /**
   * Save a reconciliation
   * @param {Object} reconciliationData - Reconciliation data
   * @returns {Promise<Object>} Saved reconciliation
   */
  async saveReconciliation(reconciliationData) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('taxi_auth_current_user') || 'null');
      if (!currentUser) throw new Error('Usuario no autenticado');

      const reconciliation = {
        id: 'reconciliation-' + Date.now(),
        ...reconciliationData,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const reconciliations = JSON.parse(localStorage.getItem('taxi_reconciliations') || '[]');
      reconciliations.push(reconciliation);
      localStorage.setItem('taxi_reconciliations', JSON.stringify(reconciliations));

      return reconciliation;
    } catch (error) {
      console.error('Save reconciliation error:', error);
      throw new Error('Error al guardar la conciliación: ' + error.message);
    }
  }

  /**
   * Delete a reconciliation
   * @param {string} id - Reconciliation ID
   * @returns {Promise<void>}
   */
  async deleteReconciliation(id) {
    try {
      const reconciliations = JSON.parse(localStorage.getItem('taxi_reconciliations') || '[]');
      const filtered = reconciliations.filter(r => r.id !== id);
      localStorage.setItem('taxi_reconciliations', JSON.stringify(filtered));
    } catch (error) {
      console.error('Delete reconciliation error:', error);
      throw new Error('Error al eliminar la conciliación: ' + error.message);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReconcileAdapter;
}
