/**
 * Offline Manager para PWA Control de Ventas
 * Maneja sincronización de datos offline/online
 */

class OfflineManager {
  constructor() {
    this.OFFLINE_QUEUE_KEY = 'sales_offline_queue';
    this.SYNC_STATUS_KEY = 'sales_sync_status';
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;

    // Escuchar cambios de conectividad
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Inicializar
    this.init();
  }

  init() {
    console.log('[OfflineManager] Inicializando...');

    // Verificar si hay datos pendientes de sincronizar
    const pendingData = this.getPendingData();
    if (pendingData.length > 0 && this.isOnline) {
      console.log(`[OfflineManager] ${pendingData.length} elementos pendientes de sincronizar`);
      this.syncPendingData();
    }
  }

  /**
   * Maneja cuando se recupera la conexión
   */
  handleOnline() {
    console.log('[OfflineManager] Conexión restaurada');
    this.isOnline = true;

    // Notificar a la UI
    this.notifyUI('online');

    // Sincronizar datos pendientes
    this.syncPendingData();
  }

  /**
   * Maneja cuando se pierde la conexión
   */
  handleOffline() {
    console.log('[OfflineManager] Conexión perdida - modo offline activado');
    this.isOnline = false;

    // Notificar a la UI
    this.notifyUI('offline');
  }

  /**
   * Guarda datos cuando está offline
   */
  saveOfflineData(type, data, action = 'create') {
    const offlineItem = {
      id: Date.now() + Math.random(), // ID único temporal
      type, // 'income' o 'expense'
      action, // 'create', 'update', 'delete'
      data,
      timestamp: new Date().toISOString(),
      synced: false
    };

    const queue = this.getPendingData();
    queue.push(offlineItem);

    localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));

    console.log(`[OfflineManager] Datos guardados offline:`, offlineItem);

    // Intentar sincronizar si hay conexión
    if (this.isOnline) {
      this.syncPendingData();
    }

    return offlineItem.id;
  }

  /**
   * Obtiene datos pendientes de sincronización
   */
  getPendingData() {
    try {
      const data = localStorage.getItem(this.OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[OfflineManager] Error al obtener datos pendientes:', error);
      return [];
    }
  }

  /**
   * Sincroniza datos pendientes con el servidor (simulado con localStorage)
   */
  async syncPendingData() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    const pendingData = this.getPendingData();
    if (pendingData.length === 0) {
      return;
    }

    console.log(`[OfflineManager] Iniciando sincronización de ${pendingData.length} elementos...`);
    this.syncInProgress = true;

    try {
      // Notificar inicio de sincronización
      this.notifyUI('sync_start');

      const syncResults = [];

      for (const item of pendingData) {
        try {
          const result = await this.syncSingleItem(item);
          syncResults.push({ item, success: true, result });
        } catch (error) {
          console.error('[OfflineManager] Error sincronizando item:', item, error);
          syncResults.push({ item, success: false, error: error.message });
        }
      }

      // Procesar resultados
      const successfulSyncs = syncResults.filter(r => r.success);
      const failedSyncs = syncResults.filter(r => !r.success);

      if (successfulSyncs.length > 0) {
        // Remover elementos sincronizados exitosamente
        const remainingQueue = pendingData.filter(item =>
          !successfulSyncs.some(sync => sync.item.id === item.id)
        );

        localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));

        console.log(`[OfflineManager] ${successfulSyncs.length} elementos sincronizados exitosamente`);
      }

      if (failedSyncs.length > 0) {
        console.warn(`[OfflineManager] ${failedSyncs.length} elementos fallaron al sincronizar`);
      }

      // Notificar finalización
      this.notifyUI('sync_complete', {
        successful: successfulSyncs.length,
        failed: failedSyncs.length,
        total: syncResults.length
      });

    } catch (error) {
      console.error('[OfflineManager] Error durante sincronización:', error);
      this.notifyUI('sync_error', error.message);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sincroniza un elemento individual
   */
  async syncSingleItem(item) {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    const { type, action, data } = item;

    switch (type) {
      case 'income':
        return this.syncIncome(action, data);
      case 'service':
        return this.syncService(action, data);
      case 'expense':
        return this.syncExpense(action, data);
      case 'reconciliation_service':
        return this.syncReconciliationService(action, data);
      case 'reconciliation_expense':
        return this.syncReconciliationExpense(action, data);
      case 'reconciliation':
        return this.syncReconciliation(action, data);
      default:
        throw new Error(`Tipo de datos desconocido: ${type}`);
    }
  }

  /**
   * Sincroniza un ingreso
   */
  syncIncome(action, incomeData) {
    const incomes = JSON.parse(localStorage.getItem('incomes') || '[]');

    switch (action) {
      case 'create':
        // Verificar si ya existe (evitar duplicados)
        const existingIncome = incomes.find(i =>
          i.date === incomeData.date &&
          i.source === incomeData.source &&
          i.amount === incomeData.amount
        );

        if (!existingIncome) {
          const newIncome = { ...incomeData, id: incomeData.id || Date.now() };
          incomes.push(newIncome);
          localStorage.setItem('incomes', JSON.stringify(incomes));
          console.log('[OfflineManager] Ingreso sincronizado:', newIncome);
          return newIncome;
        } else {
          console.log('[OfflineManager] Ingreso ya existe, omitiendo duplicado');
          return existingIncome;
        }

      case 'update':
        const incomeIndex = incomes.findIndex(i => i.id === incomeData.id);
        if (incomeIndex !== -1) {
          incomes[incomeIndex] = incomeData;
          localStorage.setItem('incomes', JSON.stringify(incomes));
          console.log('[OfflineManager] Ingreso actualizado:', incomeData);
          return incomeData;
        }
        throw new Error('Ingreso no encontrado para actualizar');

      case 'delete':
        const filteredIncomes = incomes.filter(i => i.id !== incomeData.id);
        localStorage.setItem('incomes', JSON.stringify(filteredIncomes));
        console.log('[OfflineManager] Ingreso eliminado:', incomeData.id);
        return { deleted: true, id: incomeData.id };

      default:
        throw new Error(`Acción de ingreso desconocida: ${action}`);
    }
  }

  /**
   * Sincroniza un servicio
   */
  syncService(action, serviceData) {
    const services = JSON.parse(localStorage.getItem('services') || '[]');

    switch (action) {
      case 'create':
        // Verificar si ya existe (evitar duplicados)
        const existingService = services.find(s =>
          s.startTime === serviceData.startTime &&
          s.platform === serviceData.platform &&
          s.price === serviceData.price
        );

        if (!existingService) {
          const newService = { ...serviceData, id: Date.now() };
          services.push(newService);
          localStorage.setItem('services', JSON.stringify(services));
          console.log('[OfflineManager] Servicio sincronizado:', newService);
          return newService;
        } else {
          console.log('[OfflineManager] Servicio ya existe, omitiendo duplicado');
          return existingService;
        }

      case 'update':
        const serviceIndex = services.findIndex(s => s.id === serviceData.id);
        if (serviceIndex !== -1) {
          services[serviceIndex] = serviceData;
          localStorage.setItem('services', JSON.stringify(services));
          console.log('[OfflineManager] Servicio actualizado:', serviceData);
          return serviceData;
        }
        throw new Error('Servicio no encontrado para actualizar');

      case 'delete':
        const filteredServices = services.filter(s => s.id !== serviceData.id);
        localStorage.setItem('services', JSON.stringify(filteredServices));
        console.log('[OfflineManager] Servicio eliminado:', serviceData.id);
        return { deleted: true, id: serviceData.id };

      default:
        throw new Error(`Acción de servicio desconocida: ${action}`);
    }
  }

  /**
   * Sincroniza un gasto
   */
  syncExpense(action, expenseData) {
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

    switch (action) {
      case 'create':
        // Verificar si ya existe (evitar duplicados)
        const existingExpense = expenses.find(e =>
          e.timestamp === expenseData.timestamp &&
          e.category === expenseData.category &&
          e.amount === expenseData.amount
        );

        if (!existingExpense) {
          const newExpense = { ...expenseData, id: Date.now() };
          expenses.push(newExpense);
          localStorage.setItem('expenses', JSON.stringify(expenses));
          console.log('[OfflineManager] Gasto sincronizado:', newExpense);
          return newExpense;
        } else {
          console.log('[OfflineManager] Gasto ya existe, omitiendo duplicado');
          return existingExpense;
        }

      case 'update':
        const expenseIndex = expenses.findIndex(e => e.id === expenseData.id);
        if (expenseIndex !== -1) {
          expenses[expenseIndex] = expenseData;
          localStorage.setItem('expenses', JSON.stringify(expenses));
          console.log('[OfflineManager] Gasto actualizado:', expenseData);
          return expenseData;
        }
        throw new Error('Gasto no encontrado para actualizar');

      case 'delete':
        const filteredExpenses = expenses.filter(e => e.id !== expenseData.id);
        localStorage.setItem('expenses', JSON.stringify(filteredExpenses));
        console.log('[OfflineManager] Gasto eliminado:', expenseData.id);
        return { deleted: true, id: expenseData.id };

      default:
        throw new Error(`Acción de gasto desconocida: ${action}`);
    }
  }

  /**
   * Sincroniza un servicio de conciliación (taxista)
   */
  syncReconciliationService(action, serviceData) {
    const services = JSON.parse(localStorage.getItem('reconciliation_services') || '[]');

    switch (action) {
      case 'create':
        const existingService = services.find(s =>
          s.date === serviceData.date &&
          s.platform === serviceData.platform &&
          s.totalAmount === serviceData.totalAmount
        );

        if (!existingService) {
          const newService = { ...serviceData, id: Date.now() };
          services.push(newService);
          localStorage.setItem('reconciliation_services', JSON.stringify(services));
          console.log('[OfflineManager] Servicio de conciliación sincronizado:', newService);
          return newService;
        } else {
          console.log('[OfflineManager] Servicio de conciliación ya existe, omitiendo duplicado');
          return existingService;
        }

      case 'update':
        const serviceIndex = services.findIndex(s => s.id === serviceData.id);
        if (serviceIndex !== -1) {
          services[serviceIndex] = serviceData;
          localStorage.setItem('reconciliation_services', JSON.stringify(services));
          console.log('[OfflineManager] Servicio de conciliación actualizado:', serviceData);
          return serviceData;
        }
        throw new Error('Servicio de conciliación no encontrado para actualizar');

      case 'delete':
        const filteredServices = services.filter(s => s.id !== serviceData.id);
        localStorage.setItem('reconciliation_services', JSON.stringify(filteredServices));
        console.log('[OfflineManager] Servicio de conciliación eliminado:', serviceData.id);
        return { deleted: true, id: serviceData.id };

      default:
        throw new Error(`Acción de servicio de conciliación desconocida: ${action}`);
    }
  }

  /**
   * Sincroniza un gasto de conciliación (taxista)
   */
  syncReconciliationExpense(action, expenseData) {
    const expenses = JSON.parse(localStorage.getItem('reconciliation_expenses') || '[]');

    switch (action) {
      case 'create':
        const existingExpense = expenses.find(e =>
          e.date === expenseData.date &&
          e.category === expenseData.category &&
          e.amount === expenseData.amount
        );

        if (!existingExpense) {
          const newExpense = { ...expenseData, id: Date.now() };
          expenses.push(newExpense);
          localStorage.setItem('reconciliation_expenses', JSON.stringify(expenses));
          console.log('[OfflineManager] Gasto de conciliación sincronizado:', newExpense);
          return newExpense;
        } else {
          console.log('[OfflineManager] Gasto de conciliación ya existe, omitiendo duplicado');
          return existingExpense;
        }

      case 'update':
        const expenseIndex = expenses.findIndex(e => e.id === expenseData.id);
        if (expenseIndex !== -1) {
          expenses[expenseIndex] = expenseData;
          localStorage.setItem('reconciliation_expenses', JSON.stringify(expenses));
          console.log('[OfflineManager] Gasto de conciliación actualizado:', expenseData);
          return expenseData;
        }
        throw new Error('Gasto de conciliación no encontrado para actualizar');

      case 'delete':
        const filteredExpenses = expenses.filter(e => e.id !== expenseData.id);
        localStorage.setItem('reconciliation_expenses', JSON.stringify(filteredExpenses));
        console.log('[OfflineManager] Gasto de conciliación eliminado:', expenseData.id);
        return { deleted: true, id: expenseData.id };

      default:
        throw new Error(`Acción de gasto de conciliación desconocida: ${action}`);
    }
  }

  /**
   * Sincroniza una conciliación completa
   */
  syncReconciliation(action, reconciliationData) {
    const reconciliations = JSON.parse(localStorage.getItem('reconciliation_reconciliations') || '[]');

    switch (action) {
      case 'create':
        const existingReconciliation = reconciliations.find(r =>
          r.period?.startDate === reconciliationData.period?.startDate &&
          r.period?.endDate === reconciliationData.period?.endDate
        );

        if (!existingReconciliation) {
          const newReconciliation = {
            ...reconciliationData,
            id: Date.now(),
            createdAt: new Date().toISOString()
          };
          reconciliations.push(newReconciliation);
          localStorage.setItem('reconciliation_reconciliations', JSON.stringify(reconciliations));
          console.log('[OfflineManager] Conciliación sincronizada:', newReconciliation);
          return newReconciliation;
        } else {
          console.log('[OfflineManager] Conciliación ya existe, omitiendo duplicado');
          return existingReconciliation;
        }

      case 'update':
        const reconciliationIndex = reconciliations.findIndex(r => r.id === reconciliationData.id);
        if (reconciliationIndex !== -1) {
          reconciliations[reconciliationIndex] = reconciliationData;
          localStorage.setItem('reconciliation_reconciliations', JSON.stringify(reconciliations));
          console.log('[OfflineManager] Conciliación actualizada:', reconciliationData);
          return reconciliationData;
        }
        throw new Error('Conciliación no encontrada para actualizar');

      case 'delete':
        const filteredReconciliations = reconciliations.filter(r => r.id !== reconciliationData.id);
        localStorage.setItem('reconciliation_reconciliations', JSON.stringify(filteredReconciliations));
        console.log('[OfflineManager] Conciliación eliminada:', reconciliationData.id);
        return { deleted: true, id: reconciliationData.id };

      default:
        throw new Error(`Acción de conciliación desconocida: ${action}`);
    }
  }

  /**
   * Notifica eventos a la UI
   */
  notifyUI(event, data = null) {
    const detail = { event, data, timestamp: Date.now() };

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('offlineManagerUpdate', { detail }));

    // También enviar mensaje al Service Worker si está disponible
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'OFFLINE_MANAGER_UPDATE',
        event,
        data
      });
    }
  }

  /**
   * Obtiene estadísticas de sincronización
   */
  getSyncStats() {
    const pendingData = this.getPendingData();
    const services = pendingData.filter(item => item.type === 'service');
    const expenses = pendingData.filter(item => item.type === 'expense');
    const reconciliationServices = pendingData.filter(item => item.type === 'reconciliation_service');
    const reconciliationExpenses = pendingData.filter(item => item.type === 'reconciliation_expense');
    const reconciliations = pendingData.filter(item => item.type === 'reconciliation');

    return {
      total: pendingData.length,
      services: services.length,
      expenses: expenses.length,
      reconciliationServices: reconciliationServices.length,
      reconciliationExpenses: reconciliationExpenses.length,
      reconciliations: reconciliations.length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSync: localStorage.getItem('last_sync_timestamp')
    };
  }

  /**
   * Fuerza una sincronización manual
   */
  forcSync() {
    if (this.isOnline) {
      console.log('[OfflineManager] Sincronización forzada iniciada');
      this.syncPendingData();
    } else {
      console.warn('[OfflineManager] No se puede sincronizar: sin conexión');
      this.notifyUI('sync_error', 'Sin conexión a internet');
    }
  }

  /**
   * Limpia todos los datos offline (usar con cuidado)
   */
  clearOfflineData() {
    localStorage.removeItem(this.OFFLINE_QUEUE_KEY);
    localStorage.removeItem(this.SYNC_STATUS_KEY);
    console.log('[OfflineManager] Datos offline limpiados');
    this.notifyUI('offline_data_cleared');
  }
}

// Crear instancia global
window.offlineManager = new OfflineManager();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineManager;
}