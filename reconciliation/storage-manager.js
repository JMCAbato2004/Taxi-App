/**
 * Gestor de almacenamiento para el módulo de conciliación de taxista
 * Maneja la persistencia de datos en localStorage con validación y recuperación de errores
 */

class ReconciliationStorageManager {
  constructor() {
    this.storageKeys = {
      services: 'reconciliation_services',
      expenses: 'reconciliation_expenses',
      reconciliations: 'reconciliation_data',
      settings: 'reconciliation_settings'
    };
    
    // Inicializar configuración por defecto si no existe
    this.initializeDefaultSettings();
  }

  /**
   * Inicializa la configuración por defecto si no existe
   */
  initializeDefaultSettings() {
    const existingSettings = this.getSettings();
    if (!existingSettings) {
      const defaultSettings = window.ReconciliationTypes?.DEFAULT_RECONCILIATION_SETTINGS || {
        commissionRates: { freenow: 0.15, other: 0.10 },
        distributionRates: { driver: 0.40, owner: 0.60 },
        defaultCurrency: '€',
        dateFormat: 'DD/MM/YYYY',
        companyInfo: { name: '', taxId: '', address: '', phone: '', email: '' }
      };
      this.saveSettings(defaultSettings);
    }
  }

  /**
   * Guarda datos en localStorage con manejo de errores
   * @param {string} key - Clave de almacenamiento
   * @param {any} data - Datos a guardar
   * @returns {boolean} True si se guardó correctamente
   */
  saveToStorage(key, data) {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error(`Error guardando en localStorage (${key}):`, error);
      
      // Intentar limpiar espacio si el error es por cuota excedida
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldData();
        try {
          localStorage.setItem(key, JSON.stringify(data));
          return true;
        } catch (retryError) {
          console.error('Error después de limpiar espacio:', retryError);
        }
      }
      return false;
    }
  }

  /**
   * Carga datos desde localStorage con manejo de errores
   * @param {string} key - Clave de almacenamiento
   * @param {any} defaultValue - Valor por defecto si no existe o hay error
   * @returns {any} Datos cargados o valor por defecto
   */
  loadFromStorage(key, defaultValue = null) {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return defaultValue;
      }
      
      const data = JSON.parse(serializedData);
      
      // Validar que los datos no estén corruptos
      if (this.validateStoredData(key, data)) {
        return data;
      } else {
        console.warn(`Datos corruptos detectados en ${key}, usando valor por defecto`);
        return defaultValue;
      }
    } catch (error) {
      console.error(`Error cargando desde localStorage (${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * Valida que los datos almacenados tengan la estructura correcta
   * @param {string} key - Clave de almacenamiento
   * @param {any} data - Datos a validar
   * @returns {boolean} True si los datos son válidos
   */
  validateStoredData(key, data) {
    if (!data) return false;

    switch (key) {
      case this.storageKeys.services:
        return Array.isArray(data) && data.every(service => 
          service.id && service.date && typeof service.totalAmount === 'number'
        );
      
      case this.storageKeys.expenses:
        return Array.isArray(data) && data.every(expense => 
          expense.id && expense.date && typeof expense.amount === 'number'
        );
      
      case this.storageKeys.reconciliations:
        return Array.isArray(data) && data.every(reconciliation => 
          reconciliation.id && reconciliation.period && reconciliation.summary
        );
      
      case this.storageKeys.settings:
        return data.commissionRates && data.distributionRates;
      
      default:
        return true;
    }
  }

  /**
   * Limpia datos antiguos para liberar espacio
   */
  cleanupOldData() {
    try {
      // Mantener solo las últimas 50 conciliaciones
      const reconciliations = this.getReconciliations();
      if (reconciliations.length > 50) {
        const sortedReconciliations = reconciliations
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 50);
        this.saveToStorage(this.storageKeys.reconciliations, sortedReconciliations);
      }

      // Mantener solo servicios y gastos de los últimos 6 meses
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const services = this.getServices().filter(s => 
        new Date(s.date) >= sixMonthsAgo
      );
      const expenses = this.getExpenses().filter(e => 
        new Date(e.date) >= sixMonthsAgo
      );

      this.saveToStorage(this.storageKeys.services, services);
      this.saveToStorage(this.storageKeys.expenses, expenses);

      console.log('Limpieza de datos completada');
    } catch (error) {
      console.error('Error durante la limpieza de datos:', error);
    }
  }

  // Métodos para servicios
  
  /**
   * Obtiene todos los servicios almacenados
   * @returns {Service[]} Array de servicios
   */
  getServices() {
    return this.loadFromStorage(this.storageKeys.services, []);
  }

  /**
   * Guarda un nuevo servicio
   * @param {Service} service - Servicio a guardar
   * @returns {boolean} True si se guardó correctamente
   */
  saveService(service) {
    const services = this.getServices();
    
    // Asegurar que tenga un ID único
    if (!service.id) {
      service.id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Convertir fecha a string si es necesario
    if (service.date instanceof Date) {
      service.date = service.date.toISOString();
    }

    services.push(service);
    return this.saveToStorage(this.storageKeys.services, services);
  }

  /**
   * Actualiza un servicio existente
   * @param {string} id - ID del servicio
   * @param {Partial<Service>} updates - Actualizaciones a aplicar
   * @returns {boolean} True si se actualizó correctamente
   */
  updateService(id, updates) {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === id);
    
    if (index === -1) {
      console.warn(`Servicio con ID ${id} no encontrado`);
      return false;
    }

    // Convertir fecha a string si es necesario
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }

    services[index] = { ...services[index], ...updates };
    return this.saveToStorage(this.storageKeys.services, services);
  }

  /**
   * Elimina un servicio
   * @param {string} id - ID del servicio a eliminar
   * @returns {boolean} True si se eliminó correctamente
   */
  deleteService(id) {
    const services = this.getServices();
    const filteredServices = services.filter(s => s.id !== id);
    
    if (filteredServices.length === services.length) {
      console.warn(`Servicio con ID ${id} no encontrado`);
      return false;
    }

    return this.saveToStorage(this.storageKeys.services, filteredServices);
  }

  // Métodos para gastos

  /**
   * Obtiene todos los gastos almacenados
   * @returns {Expense[]} Array de gastos
   */
  getExpenses() {
    return this.loadFromStorage(this.storageKeys.expenses, []);
  }

  /**
   * Guarda un nuevo gasto
   * @param {Expense} expense - Gasto a guardar
   * @returns {boolean} True si se guardó correctamente
   */
  saveExpense(expense) {
    const expenses = this.getExpenses();
    
    // Asegurar que tenga un ID único
    if (!expense.id) {
      expense.id = `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Convertir fecha a string si es necesario
    if (expense.date instanceof Date) {
      expense.date = expense.date.toISOString();
    }

    expenses.push(expense);
    return this.saveToStorage(this.storageKeys.expenses, expenses);
  }

  /**
   * Actualiza un gasto existente
   * @param {string} id - ID del gasto
   * @param {Partial<Expense>} updates - Actualizaciones a aplicar
   * @returns {boolean} True si se actualizó correctamente
   */
  updateExpense(id, updates) {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    
    if (index === -1) {
      console.warn(`Gasto con ID ${id} no encontrado`);
      return false;
    }

    // Convertir fecha a string si es necesario
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }

    expenses[index] = { ...expenses[index], ...updates };
    return this.saveToStorage(this.storageKeys.expenses, expenses);
  }

  /**
   * Elimina un gasto
   * @param {string} id - ID del gasto a eliminar
   * @returns {boolean} True si se eliminó correctamente
   */
  deleteExpense(id) {
    const expenses = this.getExpenses();
    const filteredExpenses = expenses.filter(e => e.id !== id);
    
    if (filteredExpenses.length === expenses.length) {
      console.warn(`Gasto con ID ${id} no encontrado`);
      return false;
    }

    return this.saveToStorage(this.storageKeys.expenses, filteredExpenses);
  }

  // Métodos para conciliaciones

  /**
   * Obtiene todas las conciliaciones almacenadas
   * @returns {ReconciliationData[]} Array de conciliaciones
   */
  getReconciliations() {
    return this.loadFromStorage(this.storageKeys.reconciliations, []);
  }

  /**
   * Guarda una nueva conciliación o actualiza una existente
   * @param {ReconciliationData} reconciliation - Conciliación a guardar
   * @returns {boolean} True si se guardó correctamente
   */
  saveReconciliation(reconciliation) {
    const reconciliations = this.getReconciliations();
    
    // Asegurar que tenga un ID único
    if (!reconciliation.id) {
      reconciliation.id = `reconciliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Convertir fechas a strings si es necesario
    if (reconciliation.createdAt instanceof Date) {
      reconciliation.createdAt = reconciliation.createdAt.toISOString();
    }
    if (reconciliation.updatedAt instanceof Date) {
      reconciliation.updatedAt = reconciliation.updatedAt.toISOString();
    }
    if (reconciliation.period && reconciliation.period.startDate instanceof Date) {
      reconciliation.period.startDate = reconciliation.period.startDate.toISOString();
    }
    if (reconciliation.period && reconciliation.period.endDate instanceof Date) {
      reconciliation.period.endDate = reconciliation.period.endDate.toISOString();
    }

    // Buscar si ya existe una conciliación con el mismo ID
    const existingIndex = reconciliations.findIndex(r => r.id === reconciliation.id);
    
    if (existingIndex !== -1) {
      // Actualizar conciliación existente
      reconciliations[existingIndex] = reconciliation;
    } else {
      // Agregar nueva conciliación
      reconciliations.push(reconciliation);
    }

    return this.saveToStorage(this.storageKeys.reconciliations, reconciliations);
  }

  /**
   * Actualiza una conciliación existente
   * @param {string} id - ID de la conciliación
   * @param {Partial<ReconciliationData>} updates - Actualizaciones a aplicar
   * @returns {boolean} True si se actualizó correctamente
   */
  updateReconciliation(id, updates) {
    const reconciliations = this.getReconciliations();
    const index = reconciliations.findIndex(r => r.id === id);
    
    if (index === -1) {
      console.warn(`Conciliación con ID ${id} no encontrada`);
      return false;
    }

    // Convertir fechas a strings si es necesario
    if (updates.updatedAt instanceof Date) {
      updates.updatedAt = updates.updatedAt.toISOString();
    }
    if (updates.period) {
      if (updates.period.startDate instanceof Date) {
        updates.period.startDate = updates.period.startDate.toISOString();
      }
      if (updates.period.endDate instanceof Date) {
        updates.period.endDate = updates.period.endDate.toISOString();
      }
    }

    reconciliations[index] = { ...reconciliations[index], ...updates };
    return this.saveToStorage(this.storageKeys.reconciliations, reconciliations);
  }

  /**
   * Obtiene una conciliación específica por ID
   * @param {string} id - ID de la conciliación
   * @returns {ReconciliationData|null} Conciliación encontrada o null
   */
  getReconciliation(id) {
    const reconciliations = this.getReconciliations();
    return reconciliations.find(r => r.id === id) || null;
  }

  /**
   * Elimina una conciliación
   * @param {string} id - ID de la conciliación a eliminar
   * @returns {boolean} True si se eliminó correctamente
   */
  deleteReconciliation(id) {
    const reconciliations = this.getReconciliations();
    const filteredReconciliations = reconciliations.filter(r => r.id !== id);
    
    if (filteredReconciliations.length === reconciliations.length) {
      console.warn(`Conciliación con ID ${id} no encontrada`);
      return false;
    }

    return this.saveToStorage(this.storageKeys.reconciliations, filteredReconciliations);
  }

  // Métodos para configuración

  /**
   * Obtiene la configuración almacenada
   * @returns {ReconciliationSettings} Configuración
   */
  getSettings() {
    return this.loadFromStorage(this.storageKeys.settings);
  }

  /**
   * Guarda la configuración
   * @param {ReconciliationSettings} settings - Configuración a guardar
   * @returns {boolean} True si se guardó correctamente
   */
  saveSettings(settings) {
    return this.saveToStorage(this.storageKeys.settings, settings);
  }

  // Métodos de utilidad

  /**
   * Exporta todos los datos a un objeto JSON
   * @returns {ReconciliationStorage} Todos los datos almacenados
   */
  exportAllData() {
    return {
      services: this.getServices(),
      expenses: this.getExpenses(),
      reconciliations: this.getReconciliations(),
      settings: this.getSettings()
    };
  }

  /**
   * Importa datos desde un objeto JSON
   * @param {ReconciliationStorage} data - Datos a importar
   * @returns {boolean} True si se importó correctamente
   */
  importAllData(data) {
    try {
      let success = true;
      
      if (data.services) {
        success = success && this.saveToStorage(this.storageKeys.services, data.services);
      }
      if (data.expenses) {
        success = success && this.saveToStorage(this.storageKeys.expenses, data.expenses);
      }
      if (data.reconciliations) {
        success = success && this.saveToStorage(this.storageKeys.reconciliations, data.reconciliations);
      }
      if (data.settings) {
        success = success && this.saveToStorage(this.storageKeys.settings, data.settings);
      }

      return success;
    } catch (error) {
      console.error('Error importando datos:', error);
      return false;
    }
  }

  /**
   * Limpia todos los datos almacenados
   * @returns {boolean} True si se limpió correctamente
   */
  clearAllData() {
    try {
      Object.values(this.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Reinicializar configuración por defecto
      this.initializeDefaultSettings();
      
      return true;
    } catch (error) {
      console.error('Error limpiando datos:', error);
      return false;
    }
  }

  /**
   * Obtiene información sobre el uso de almacenamiento
   * @returns {Object} Información de uso
   */
  getStorageInfo() {
    const info = {
      services: this.getServices().length,
      expenses: this.getExpenses().length,
      reconciliations: this.getReconciliations().length,
      totalSize: 0,
      lastBackup: this.getLastBackupDate(),
      autoCleanupEnabled: true
    };

    // Calcular tamaño aproximado
    Object.values(this.storageKeys).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        info.totalSize += data.length;
      }
    });

    // Convertir a KB
    info.totalSizeKB = Math.round(info.totalSize / 1024 * 100) / 100;

    // Calcular porcentaje de uso estimado (asumiendo límite de 5MB)
    info.usagePercentage = Math.round((info.totalSize / (5 * 1024 * 1024)) * 100);

    return info;
  }

  /**
   * Carga datos al iniciar la aplicación con validación
   * @returns {Object} Estado de la carga inicial
   */
  loadInitialData() {
    const startTime = Date.now();
    const result = {
      success: true,
      services: { count: 0, loaded: false },
      expenses: { count: 0, loaded: false },
      reconciliations: { count: 0, loaded: false },
      settings: { loaded: false },
      errors: [],
      loadTime: 0
    };

    try {
      // Cargar servicios
      const services = this.getServices();
      result.services = { count: services.length, loaded: true };
      
      // Cargar gastos
      const expenses = this.getExpenses();
      result.expenses = { count: expenses.length, loaded: true };
      
      // Cargar conciliaciones
      const reconciliations = this.getReconciliations();
      result.reconciliations = { count: reconciliations.length, loaded: true };
      
      // Cargar configuración
      const settings = this.getSettings();
      result.settings = { loaded: !!settings };

      // Verificar integridad de datos
      this.verifyDataIntegrity(result);

    } catch (error) {
      result.success = false;
      result.errors.push(`Error cargando datos iniciales: ${error.message}`);
      console.error('Error en carga inicial:', error);
    }

    result.loadTime = Date.now() - startTime;
    return result;
  }

  /**
   * Verifica la integridad de los datos cargados
   * @param {Object} loadResult - Resultado de la carga inicial
   */
  verifyDataIntegrity(loadResult) {
    try {
      // Verificar servicios duplicados
      const services = this.getServices();
      const serviceIds = services.map(s => s.id);
      const uniqueServiceIds = [...new Set(serviceIds)];
      if (serviceIds.length !== uniqueServiceIds.length) {
        loadResult.errors.push('Servicios duplicados detectados');
      }

      // Verificar gastos duplicados
      const expenses = this.getExpenses();
      const expenseIds = expenses.map(e => e.id);
      const uniqueExpenseIds = [...new Set(expenseIds)];
      if (expenseIds.length !== uniqueExpenseIds.length) {
        loadResult.errors.push('Gastos duplicados detectados');
      }

      // Verificar conciliaciones duplicadas
      const reconciliations = this.getReconciliations();
      const reconciliationIds = reconciliations.map(r => r.id);
      const uniqueReconciliationIds = [...new Set(reconciliationIds)];
      if (reconciliationIds.length !== uniqueReconciliationIds.length) {
        loadResult.errors.push('Conciliaciones duplicadas detectadas');
      }

      // Verificar fechas válidas
      const invalidServices = services.filter(s => isNaN(new Date(s.date).getTime()));
      if (invalidServices.length > 0) {
        loadResult.errors.push(`${invalidServices.length} servicios con fechas inválidas`);
      }

      const invalidExpenses = expenses.filter(e => isNaN(new Date(e.date).getTime()));
      if (invalidExpenses.length > 0) {
        loadResult.errors.push(`${invalidExpenses.length} gastos con fechas inválidas`);
      }

    } catch (error) {
      loadResult.errors.push(`Error verificando integridad: ${error.message}`);
    }
  }

  /**
   * Elimina datos con confirmación
   * @param {string} type - Tipo de datos ('service', 'expense', 'reconciliation', 'all')
   * @param {string} id - ID específico (opcional para 'all')
   * @param {boolean} confirmed - Confirmación del usuario
   * @returns {Object} Resultado de la eliminación
   */
  deleteWithConfirmation(type, id = null, confirmed = false) {
    if (!confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        message: this.getConfirmationMessage(type, id),
        type: type,
        id: id
      };
    }

    const result = { success: false, message: '', deletedCount: 0 };

    try {
      switch (type) {
        case 'service':
          if (id) {
            result.success = this.deleteService(id);
            result.deletedCount = result.success ? 1 : 0;
            result.message = result.success ? 'Servicio eliminado' : 'Error eliminando servicio';
          }
          break;

        case 'expense':
          if (id) {
            result.success = this.deleteExpense(id);
            result.deletedCount = result.success ? 1 : 0;
            result.message = result.success ? 'Gasto eliminado' : 'Error eliminando gasto';
          }
          break;

        case 'reconciliation':
          if (id) {
            result.success = this.deleteReconciliation(id);
            result.deletedCount = result.success ? 1 : 0;
            result.message = result.success ? 'Conciliación eliminada' : 'Error eliminando conciliación';
          }
          break;

        case 'all':
          const beforeCounts = this.getStorageInfo();
          result.success = this.clearAllData();
          result.deletedCount = beforeCounts.services + beforeCounts.expenses + beforeCounts.reconciliations;
          result.message = result.success ? 
            `Todos los datos eliminados (${result.deletedCount} elementos)` : 
            'Error eliminando todos los datos';
          break;

        default:
          result.message = 'Tipo de eliminación no válido';
      }
    } catch (error) {
      result.success = false;
      result.message = `Error durante eliminación: ${error.message}`;
    }

    return result;
  }

  /**
   * Genera mensaje de confirmación para eliminación
   * @param {string} type - Tipo de datos
   * @param {string} id - ID específico
   * @returns {string} Mensaje de confirmación
   */
  getConfirmationMessage(type, id) {
    switch (type) {
      case 'service':
        return `¿Está seguro de que desea eliminar este servicio? Esta acción no se puede deshacer.`;
      case 'expense':
        return `¿Está seguro de que desea eliminar este gasto? Esta acción no se puede deshacer.`;
      case 'reconciliation':
        return `¿Está seguro de que desea eliminar esta conciliación? Esta acción no se puede deshacer.`;
      case 'all':
        const info = this.getStorageInfo();
        return `¿Está seguro de que desea eliminar TODOS los datos? Esto incluye ${info.services} servicios, ${info.expenses} gastos y ${info.reconciliations} conciliaciones. Esta acción no se puede deshacer.`;
      default:
        return '¿Está seguro de que desea continuar?';
    }
  }

  /**
   * Crea una copia de seguridad de todos los datos
   * @returns {Object} Resultado de la copia de seguridad
   */
  createBackup() {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: this.exportAllData(),
        metadata: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          storageInfo: this.getStorageInfo()
        }
      };

      // Guardar fecha del último backup
      this.saveLastBackupDate();

      return {
        success: true,
        backup: backupData,
        size: JSON.stringify(backupData).length,
        message: 'Copia de seguridad creada exitosamente'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error creando copia de seguridad'
      };
    }
  }

  /**
   * Restaura datos desde una copia de seguridad
   * @param {Object} backupData - Datos de la copia de seguridad
   * @param {boolean} confirmed - Confirmación del usuario
   * @returns {Object} Resultado de la restauración
   */
  restoreFromBackup(backupData, confirmed = false) {
    if (!confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        message: 'La restauración eliminará todos los datos actuales. ¿Desea continuar?',
        backupInfo: {
          timestamp: backupData.timestamp,
          version: backupData.version,
          services: backupData.data?.services?.length || 0,
          expenses: backupData.data?.expenses?.length || 0,
          reconciliations: backupData.data?.reconciliations?.length || 0
        }
      };
    }

    try {
      // Validar estructura del backup
      if (!backupData.data || !backupData.timestamp) {
        throw new Error('Estructura de backup inválida');
      }

      // Crear backup de datos actuales antes de restaurar
      const currentBackup = this.createBackup();

      // Limpiar datos actuales
      this.clearAllData();

      // Importar datos del backup
      const importSuccess = this.importAllData(backupData.data);

      if (!importSuccess) {
        // Si falla la importación, intentar restaurar datos anteriores
        if (currentBackup.success) {
          this.importAllData(currentBackup.backup.data);
        }
        throw new Error('Error importando datos del backup');
      }

      return {
        success: true,
        message: 'Datos restaurados exitosamente',
        restored: {
          services: backupData.data.services?.length || 0,
          expenses: backupData.data.expenses?.length || 0,
          reconciliations: backupData.data.reconciliations?.length || 0
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error restaurando desde backup'
      };
    }
  }

  /**
   * Guarda la fecha del último backup
   */
  saveLastBackupDate() {
    try {
      localStorage.setItem('reconciliation_last_backup', new Date().toISOString());
    } catch (error) {
      console.warn('Error guardando fecha de backup:', error);
    }
  }

  /**
   * Obtiene la fecha del último backup
   * @returns {string|null} Fecha del último backup o null
   */
  getLastBackupDate() {
    try {
      return localStorage.getItem('reconciliation_last_backup');
    } catch (error) {
      return null;
    }
  }

  /**
   * Migra datos de versiones anteriores si es necesario
   * @returns {Object} Resultado de la migración
   */
  migrateDataIfNeeded() {
    const result = { migrated: false, changes: [], errors: [] };

    try {
      // Verificar si hay datos en formato antiguo
      const services = this.getServices();
      const expenses = this.getExpenses();
      const reconciliations = this.getReconciliations();

      let needsMigration = false;

      // Migrar servicios si usan formato antiguo
      const migratedServices = services.map(service => {
        if (service.totalAmount === undefined && service.amount !== undefined) {
          service.totalAmount = service.amount;
          delete service.amount;
          needsMigration = true;
          result.changes.push(`Servicio ${service.id}: migrado campo amount -> totalAmount`);
        }
        return service;
      });

      // Migrar conciliaciones si usan formato antiguo
      const migratedReconciliations = reconciliations.map(reconciliation => {
        if (reconciliation.period && reconciliation.period.start && !reconciliation.period.startDate) {
          reconciliation.period.startDate = reconciliation.period.start;
          reconciliation.period.endDate = reconciliation.period.end;
          delete reconciliation.period.start;
          delete reconciliation.period.end;
          needsMigration = true;
          result.changes.push(`Conciliación ${reconciliation.id}: migrado formato de período`);
        }
        return reconciliation;
      });

      if (needsMigration) {
        this.saveToStorage(this.storageKeys.services, migratedServices);
        this.saveToStorage(this.storageKeys.reconciliations, migratedReconciliations);
        result.migrated = true;
      }

    } catch (error) {
      result.errors.push(`Error durante migración: ${error.message}`);
    }

    return result;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ReconciliationStorageManager = ReconciliationStorageManager;
}

// También exportar como módulo si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReconciliationStorageManager;
}