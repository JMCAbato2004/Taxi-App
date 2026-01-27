/**
 * Sistema de Validaciones y Manejo de Errores
 * 
 * Implementa validación completa de montos negativos, fechas inválidas,
 * campos obligatorios y detección de inconsistencias en el sistema.
 * 
 * Tarea 9.1: Crear sistema de validaciones
 * Requerimientos: 9.1, 9.2, 9.3, 9.4
 */

class ValidationSystem {
  constructor() {
    this.validationRules = {
      service: this.getServiceValidationRules(),
      expense: this.getExpenseValidationRules(),
      reconciliation: this.getReconciliationValidationRules(),
      cashBreakdown: this.getCashBreakdownValidationRules(),
      settings: this.getSettingsValidationRules()
    };

    this.errorTypes = {
      REQUIRED_FIELD: 'required_field',
      INVALID_TYPE: 'invalid_type',
      NEGATIVE_AMOUNT: 'negative_amount',
      INVALID_DATE: 'invalid_date',
      OUT_OF_RANGE: 'out_of_range',
      INVALID_FORMAT: 'invalid_format',
      INCONSISTENCY: 'inconsistency',
      BUSINESS_RULE: 'business_rule'
    };

    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  /**
   * Valida un servicio completo
   * @param {Object} service - Servicio a validar
   * @returns {Object} Resultado de validación
   */
  validateService(service) {
    const result = this.createValidationResult();
    
    // Validación temprana de datos null/undefined
    if (!service || typeof service !== 'object') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'El servicio debe ser un objeto válido', this.severityLevels.CRITICAL);
      return this.finalizeValidationResult(result);
    }

    const rules = this.validationRules.service;

    // Validar campos obligatorios
    this.validateRequiredFields(service, rules.required, result);

    // Validar tipos de datos
    this.validateDataTypes(service, rules.types, result);

    // Validar montos negativos
    this.validateNegativeAmounts(service, rules.amounts, result);

    // Validar fechas
    this.validateDates(service, rules.dates, result);

    // Validar formatos específicos
    this.validateFormats(service, rules.formats, result);

    // Validar reglas de negocio
    this.validateServiceBusinessRules(service, result);

    return this.finalizeValidationResult(result);
  }

  /**
   * Valida un gasto completo
   * @param {Object} expense - Gasto a validar
   * @returns {Object} Resultado de validación
   */
  validateExpense(expense) {
    const result = this.createValidationResult();
    
    // Validación temprana de datos null/undefined
    if (!expense || typeof expense !== 'object') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'El gasto debe ser un objeto válido', this.severityLevels.CRITICAL);
      return this.finalizeValidationResult(result);
    }

    const rules = this.validationRules.expense;

    // Validar campos obligatorios
    this.validateRequiredFields(expense, rules.required, result);

    // Validar tipos de datos
    this.validateDataTypes(expense, rules.types, result);

    // Validar montos negativos
    this.validateNegativeAmounts(expense, rules.amounts, result);

    // Validar fechas
    this.validateDates(expense, rules.dates, result);

    // Validar formatos específicos
    this.validateFormats(expense, rules.formats, result);

    // Validar reglas de negocio
    this.validateExpenseBusinessRules(expense, result);

    return this.finalizeValidationResult(result);
  }

  /**
   * Valida una conciliación completa
   * @param {Object} reconciliation - Conciliación a validar
   * @returns {Object} Resultado de validación
   */
  validateReconciliation(reconciliation) {
    const result = this.createValidationResult();
    
    // Validación temprana de datos null/undefined
    if (!reconciliation || typeof reconciliation !== 'object') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'La conciliación debe ser un objeto válido', this.severityLevels.CRITICAL);
      return this.finalizeValidationResult(result);
    }

    const rules = this.validationRules.reconciliation;

    // Validar campos obligatorios
    this.validateRequiredFields(reconciliation, rules.required, result);

    // Validar tipos de datos
    this.validateDataTypes(reconciliation, rules.types, result);

    // Validar fechas del período
    this.validateReconciliationDates(reconciliation, result);

    // Validar consistencia de datos
    this.validateReconciliationConsistency(reconciliation, result);

    // Validar reglas de negocio
    this.validateReconciliationBusinessRules(reconciliation, result);

    return this.finalizeValidationResult(result);
  }

  /**
   * Valida un desglose de efectivo
   * @param {Object} cashBreakdown - Desglose de efectivo a validar
   * @returns {Object} Resultado de validación
   */
  validateCashBreakdown(cashBreakdown) {
    const result = this.createValidationResult();
    const rules = this.validationRules.cashBreakdown;

    // Validar estructura básica
    this.validateRequiredFields(cashBreakdown, rules.required, result);

    // Validar tipos de datos
    this.validateDataTypes(cashBreakdown, rules.types, result);

    // Validar cantidades negativas
    this.validateCashBreakdownAmounts(cashBreakdown, result);

    // Validar denominaciones válidas
    this.validateCashDenominations(cashBreakdown, result);

    return this.finalizeValidationResult(result);
  }

  /**
   * Detecta inconsistencias en el sistema
   * @param {Object} systemData - Datos del sistema (servicios, gastos, conciliaciones)
   * @returns {Object} Resultado de detección de inconsistencias
   */
  detectInconsistencies(systemData) {
    const result = this.createValidationResult();

    // Validar consistencia entre servicios y conciliaciones
    this.validateServiceReconciliationConsistency(systemData, result);

    // Validar consistencia entre gastos y conciliaciones
    this.validateExpenseReconciliationConsistency(systemData, result);

    // Validar totales calculados vs almacenados
    this.validateCalculatedTotals(systemData, result);

    // Validar fechas coherentes
    this.validateDateConsistency(systemData, result);

    // Validar IDs únicos
    this.validateUniqueIds(systemData, result);

    // Validar integridad referencial
    this.validateReferentialIntegrity(systemData, result);

    return this.finalizeValidationResult(result);
  }

  /**
   * Obtiene reglas de validación para servicios
   * @returns {Object} Reglas de validación
   */
  getServiceValidationRules() {
    return {
      required: ['id', 'date', 'totalAmount', 'paymentType', 'platform'],
      types: {
        id: 'string',
        date: 'string',
        time: 'string',
        totalAmount: 'number',
        paymentType: 'string',
        platform: 'string',
        isArticulated: 'boolean'
      },
      amounts: ['totalAmount'],
      dates: ['date'],
      formats: {
        paymentType: ['cash', 'card', 'app'],
        platform: ['freenow', 'uber', 'other']
      }
    };
  }

  /**
   * Obtiene reglas de validación para gastos
   * @returns {Object} Reglas de validación
   */
  getExpenseValidationRules() {
    return {
      required: ['id', 'date', 'amount', 'description', 'category'],
      types: {
        id: 'string',
        date: 'string',
        amount: 'number',
        description: 'string',
        category: 'string'
      },
      amounts: ['amount'],
      dates: ['date'],
      formats: {
        category: ['fuel', 'maintenance', 'tolls', 'parking', 'other']
      }
    };
  }

  /**
   * Obtiene reglas de validación para conciliaciones
   * @returns {Object} Reglas de validación
   */
  getReconciliationValidationRules() {
    return {
      required: ['id', 'period', 'services', 'expenses', 'summary'],
      types: {
        id: 'string',
        period: 'object',
        services: 'array',
        expenses: 'array',
        summary: 'object',
        dailyTotals: 'array'
      },
      amounts: [],
      dates: [],
      formats: {}
    };
  }

  /**
   * Obtiene reglas de validación para desglose de efectivo
   * @returns {Object} Reglas de validación
   */
  getCashBreakdownValidationRules() {
    return {
      required: ['bills', 'coins'],
      types: {
        bills: 'object',
        coins: 'object',
        total: 'number',
        difference: 'number'
      },
      amounts: [],
      dates: [],
      formats: {}
    };
  }

  /**
   * Obtiene reglas de validación para configuración
   * @returns {Object} Reglas de validación
   */
  getSettingsValidationRules() {
    return {
      required: ['commissionRates', 'distributionRates'],
      types: {
        commissionRates: 'object',
        distributionRates: 'object',
        defaultCurrency: 'string',
        dateFormat: 'string'
      },
      amounts: [],
      dates: [],
      formats: {}
    };
  }

  /**
   * Crea un resultado de validación vacío
   * @returns {Object} Resultado de validación inicial
   */
  createValidationResult() {
    return {
      valid: true,
      errors: [],
      warnings: [],
      info: [],
      summary: {
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        criticalErrors: 0,
        highSeverityErrors: 0
      }
    };
  }

  /**
   * Valida campos obligatorios
   * @param {Object} data - Datos a validar
   * @param {Array} requiredFields - Campos obligatorios
   * @param {Object} result - Resultado de validación
   */
  validateRequiredFields(data, requiredFields, result) {
    if (!data || typeof data !== 'object') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'Los datos deben ser un objeto válido', this.severityLevels.CRITICAL);
      return;
    }

    requiredFields.forEach(field => {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        this.addError(result, this.errorTypes.REQUIRED_FIELD, `El campo '${field}' es obligatorio`, this.severityLevels.HIGH);
      }
    });
  }

  /**
   * Valida tipos de datos
   * @param {Object} data - Datos a validar
   * @param {Object} typeRules - Reglas de tipos
   * @param {Object} result - Resultado de validación
   */
  validateDataTypes(data, typeRules, result) {
    Object.entries(typeRules).forEach(([field, expectedType]) => {
      if (data[field] !== undefined && data[field] !== null) {
        const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
        if (actualType !== expectedType) {
          this.addError(result, this.errorTypes.INVALID_TYPE, 
            `El campo '${field}' debe ser de tipo ${expectedType}, recibido ${actualType}`, 
            this.severityLevels.MEDIUM);
        }
      }
    });
  }

  /**
   * Valida montos negativos
   * @param {Object} data - Datos a validar
   * @param {Array} amountFields - Campos de montos
   * @param {Object} result - Resultado de validación
   */
  validateNegativeAmounts(data, amountFields, result) {
    amountFields.forEach(field => {
      if (data[field] !== undefined && typeof data[field] === 'number' && data[field] < 0) {
        this.addError(result, this.errorTypes.NEGATIVE_AMOUNT, 
          `El campo '${field}' no puede ser negativo (valor: ${data[field]})`, 
          this.severityLevels.HIGH);
      }
    });
  }

  /**
   * Valida fechas inválidas
   * @param {Object} data - Datos a validar
   * @param {Array} dateFields - Campos de fechas
   * @param {Object} result - Resultado de validación
   */
  validateDates(data, dateFields, result) {
    dateFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null) {
        const date = new Date(data[field]);
        if (isNaN(date.getTime())) {
          this.addError(result, this.errorTypes.INVALID_DATE, 
            `El campo '${field}' contiene una fecha inválida (valor: ${data[field]})`, 
            this.severityLevels.HIGH);
        } else {
          // Validar rango razonable de fechas
          const now = new Date();
          const minDate = new Date(now.getFullYear() - 10, 0, 1);
          const maxDate = new Date(now.getFullYear() + 1, 11, 31);
          
          if (date < minDate || date > maxDate) {
            this.addWarning(result, this.errorTypes.OUT_OF_RANGE, 
              `La fecha en '${field}' está fuera del rango esperado (${data[field]})`);
          }
        }
      }
    });
  }

  /**
   * Valida formatos específicos
   * @param {Object} data - Datos a validar
   * @param {Object} formatRules - Reglas de formato
   * @param {Object} result - Resultado de validación
   */
  validateFormats(data, formatRules, result) {
    Object.entries(formatRules).forEach(([field, allowedValues]) => {
      if (data[field] !== undefined && data[field] !== null) {
        if (!allowedValues.includes(data[field])) {
          this.addError(result, this.errorTypes.INVALID_FORMAT, 
            `El campo '${field}' tiene un valor inválido '${data[field]}'. Valores permitidos: ${allowedValues.join(', ')}`, 
            this.severityLevels.MEDIUM);
        }
      }
    });
  }

  /**
   * Valida reglas de negocio específicas para servicios
   * @param {Object} service - Servicio a validar
   * @param {Object} result - Resultado de validación
   */
  validateServiceBusinessRules(service, result) {
    // Validar monto mínimo razonable
    if (service.totalAmount !== undefined && service.totalAmount < 1) {
      this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
        `El monto del servicio es muy bajo (${service.totalAmount}€)`);
    }

    // Validar monto máximo razonable
    if (service.totalAmount !== undefined && service.totalAmount > 500) {
      this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
        `El monto del servicio es muy alto (${service.totalAmount}€)`);
    }

    // Validar coherencia entre plataforma y tipo de pago
    if (service.platform === 'freenow' && service.paymentType === 'cash') {
      this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
        'Es inusual que un servicio de Freenow sea pagado en efectivo');
    }

    // Validar formato de hora si está presente
    if (service.time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(service.time)) {
      this.addError(result, this.errorTypes.INVALID_FORMAT, 
        `El formato de hora '${service.time}' es inválido. Use HH:MM`, 
        this.severityLevels.MEDIUM);
    }
  }

  /**
   * Valida reglas de negocio específicas para gastos
   * @param {Object} expense - Gasto a validar
   * @param {Object} result - Resultado de validación
   */
  validateExpenseBusinessRules(expense, result) {
    // Validar monto mínimo razonable
    if (expense.amount !== undefined && expense.amount < 0.01) {
      this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
        `El monto del gasto es muy bajo (${expense.amount}€)`);
    }

    // Validar monto máximo razonable por categoría
    const maxAmountsByCategory = {
      fuel: 200,
      maintenance: 1000,
      tolls: 50,
      parking: 20,
      other: 500
    };

    const maxAmount = maxAmountsByCategory[expense.category] || 500;
    if (expense.amount !== undefined && expense.amount > maxAmount) {
      this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
        `El monto del gasto (${expense.amount}€) es alto para la categoría '${expense.category}' (máximo sugerido: ${maxAmount}€)`);
    }

    // Validar descripción mínima
    if (expense.description && expense.description.length < 3) {
      this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
        'La descripción del gasto es muy corta');
    }
  }

  /**
   * Valida fechas específicas de conciliación
   * @param {Object} reconciliation - Conciliación a validar
   * @param {Object} result - Resultado de validación
   */
  validateReconciliationDates(reconciliation, result) {
    if (!reconciliation.period) return;

    const startDate = new Date(reconciliation.period.startDate);
    const endDate = new Date(reconciliation.period.endDate);

    if (isNaN(startDate.getTime())) {
      this.addError(result, this.errorTypes.INVALID_DATE, 
        'La fecha de inicio del período es inválida', 
        this.severityLevels.HIGH);
    }

    if (isNaN(endDate.getTime())) {
      this.addError(result, this.errorTypes.INVALID_DATE, 
        'La fecha de fin del período es inválida', 
        this.severityLevels.HIGH);
    }

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (startDate > endDate) {
        this.addError(result, this.errorTypes.BUSINESS_RULE, 
          'La fecha de inicio no puede ser posterior a la fecha de fin', 
          this.severityLevels.HIGH);
      }

      // Validar que el período no sea demasiado largo
      const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > 31) {
        this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
          `El período de conciliación es muy largo (${Math.ceil(daysDiff)} días)`);
      }
    }
  }

  /**
   * Valida consistencia interna de conciliación
   * @param {Object} reconciliation - Conciliación a validar
   * @param {Object} result - Resultado de validación
   */
  validateReconciliationConsistency(reconciliation, result) {
    if (!reconciliation.summary) return;

    // Validar que los totales sean coherentes
    const summary = reconciliation.summary;
    
    if (summary.totalServices !== undefined && summary.totalExpenses !== undefined && summary.netIncome !== undefined) {
      const expectedNetIncome = summary.totalServices - summary.totalExpenses;
      const difference = Math.abs(summary.netIncome - expectedNetIncome);
      
      if (difference > 0.01) {
        this.addError(result, this.errorTypes.INCONSISTENCY, 
          `Inconsistencia en ingreso neto: esperado ${expectedNetIncome.toFixed(2)}, obtenido ${summary.netIncome.toFixed(2)}`, 
          this.severityLevels.HIGH);
      }
    }

    // Validar distribución 60/40
    if (summary.distribution60 !== undefined && summary.distribution40 !== undefined && summary.netIncome !== undefined) {
      const expectedTotal = summary.distribution60 + summary.distribution40;
      const difference = Math.abs(summary.netIncome - expectedTotal);
      
      if (difference > 0.01) {
        this.addError(result, this.errorTypes.INCONSISTENCY, 
          `Inconsistencia en distribución: suma ${expectedTotal.toFixed(2)}, ingreso neto ${summary.netIncome.toFixed(2)}`, 
          this.severityLevels.HIGH);
      }
    }
  }

  /**
   * Valida reglas de negocio de conciliación
   * @param {Object} reconciliation - Conciliación a validar
   * @param {Object} result - Resultado de validación
   */
  validateReconciliationBusinessRules(reconciliation, result) {
    // Validar que tenga servicios o gastos
    if ((!reconciliation.services || reconciliation.services.length === 0) && 
        (!reconciliation.expenses || reconciliation.expenses.length === 0)) {
      this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
        'La conciliación no contiene servicios ni gastos');
    }

    // Validar fechas de servicios dentro del período
    if (reconciliation.services && reconciliation.period) {
      const startDate = new Date(reconciliation.period.startDate);
      const endDate = new Date(reconciliation.period.endDate);
      
      reconciliation.services.forEach((service, index) => {
        const serviceDate = new Date(service.date);
        if (serviceDate < startDate || serviceDate > endDate) {
          this.addError(result, this.errorTypes.INCONSISTENCY, 
            `El servicio ${index + 1} tiene fecha fuera del período de conciliación`, 
            this.severityLevels.MEDIUM);
        }
      });
    }

    // Validar fechas de gastos dentro del período
    if (reconciliation.expenses && reconciliation.period) {
      const startDate = new Date(reconciliation.period.startDate);
      const endDate = new Date(reconciliation.period.endDate);
      
      reconciliation.expenses.forEach((expense, index) => {
        const expenseDate = new Date(expense.date);
        if (expenseDate < startDate || expenseDate > endDate) {
          this.addError(result, this.errorTypes.INCONSISTENCY, 
            `El gasto ${index + 1} tiene fecha fuera del período de conciliación`, 
            this.severityLevels.MEDIUM);
        }
      });
    }
  }

  /**
   * Valida cantidades en desglose de efectivo
   * @param {Object} cashBreakdown - Desglose de efectivo
   * @param {Object} result - Resultado de validación
   */
  validateCashBreakdownAmounts(cashBreakdown, result) {
    const validateDenominations = (denominations, type) => {
      if (!denominations) return;
      
      Object.entries(denominations).forEach(([key, count]) => {
        if (typeof count === 'number' && count < 0) {
          this.addError(result, this.errorTypes.NEGATIVE_AMOUNT, 
            `La cantidad de ${type} '${key}' no puede ser negativa (${count})`, 
            this.severityLevels.HIGH);
        }
        
        if (typeof count === 'number' && !Number.isInteger(count)) {
          this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
            `La cantidad de ${type} '${key}' debe ser un número entero (${count})`);
        }
        
        if (typeof count === 'number' && count > 1000) {
          this.addWarning(result, this.errorTypes.BUSINESS_RULE, 
            `La cantidad de ${type} '${key}' es muy alta (${count})`);
        }
      });
    };

    validateDenominations(cashBreakdown.bills, 'billetes');
    validateDenominations(cashBreakdown.coins, 'monedas');
  }

  /**
   * Valida denominaciones válidas de efectivo
   * @param {Object} cashBreakdown - Desglose de efectivo
   * @param {Object} result - Resultado de validación
   */
  validateCashDenominations(cashBreakdown, result) {
    const validBills = ['fifty', 'twenty', 'ten', 'five'];
    const validCoins = ['two', 'one', 'fifty_cents', 'twenty_cents', 'ten_cents', 'five_cents', 'two_cents', 'one_cent'];

    if (cashBreakdown.bills) {
      Object.keys(cashBreakdown.bills).forEach(key => {
        if (!validBills.includes(key)) {
          this.addError(result, this.errorTypes.INVALID_FORMAT, 
            `Denominación de billete inválida: '${key}'`, 
            this.severityLevels.MEDIUM);
        }
      });
    }

    if (cashBreakdown.coins) {
      Object.keys(cashBreakdown.coins).forEach(key => {
        if (!validCoins.includes(key)) {
          this.addError(result, this.errorTypes.INVALID_FORMAT, 
            `Denominación de moneda inválida: '${key}'`, 
            this.severityLevels.MEDIUM);
        }
      });
    }
  }

  /**
   * Valida consistencia entre servicios y conciliaciones
   * @param {Object} systemData - Datos del sistema
   * @param {Object} result - Resultado de validación
   */
  validateServiceReconciliationConsistency(systemData, result) {
    if (!systemData.services || !systemData.reconciliations) return;

    systemData.reconciliations.forEach(reconciliation => {
      if (!reconciliation.services) return;

      reconciliation.services.forEach(reconciliationService => {
        const systemService = systemData.services.find(s => s.id === reconciliationService.id);
        if (!systemService) {
          this.addError(result, this.errorTypes.INCONSISTENCY, 
            `Servicio ${reconciliationService.id} en conciliación no existe en el sistema`, 
            this.severityLevels.HIGH);
        } else {
          // Validar que los datos coincidan
          if (systemService.totalAmount !== reconciliationService.totalAmount) {
            this.addError(result, this.errorTypes.INCONSISTENCY, 
              `Monto del servicio ${reconciliationService.id} no coincide entre sistema y conciliación`, 
              this.severityLevels.MEDIUM);
          }
        }
      });
    });
  }

  /**
   * Valida consistencia entre gastos y conciliaciones
   * @param {Object} systemData - Datos del sistema
   * @param {Object} result - Resultado de validación
   */
  validateExpenseReconciliationConsistency(systemData, result) {
    if (!systemData.expenses || !systemData.reconciliations) return;

    systemData.reconciliations.forEach(reconciliation => {
      if (!reconciliation.expenses) return;

      reconciliation.expenses.forEach(reconciliationExpense => {
        const systemExpense = systemData.expenses.find(e => e.id === reconciliationExpense.id);
        if (!systemExpense) {
          this.addError(result, this.errorTypes.INCONSISTENCY, 
            `Gasto ${reconciliationExpense.id} en conciliación no existe en el sistema`, 
            this.severityLevels.HIGH);
        } else {
          // Validar que los datos coincidan
          if (systemExpense.amount !== reconciliationExpense.amount) {
            this.addError(result, this.errorTypes.INCONSISTENCY, 
              `Monto del gasto ${reconciliationExpense.id} no coincide entre sistema y conciliación`, 
              this.severityLevels.MEDIUM);
          }
        }
      });
    });
  }

  /**
   * Valida totales calculados vs almacenados
   * @param {Object} systemData - Datos del sistema
   * @param {Object} result - Resultado de validación
   */
  validateCalculatedTotals(systemData, result) {
    if (!systemData.reconciliations) return;

    systemData.reconciliations.forEach(reconciliation => {
      if (!reconciliation.services || !reconciliation.summary) return;

      // Calcular total de servicios
      const calculatedServiceTotal = reconciliation.services.reduce((sum, service) => sum + (service.totalAmount || 0), 0);
      const storedServiceTotal = reconciliation.summary.totalServices || 0;

      if (Math.abs(calculatedServiceTotal - storedServiceTotal) > 0.01) {
        this.addError(result, this.errorTypes.INCONSISTENCY, 
          `Total de servicios calculado (${calculatedServiceTotal.toFixed(2)}) no coincide con almacenado (${storedServiceTotal.toFixed(2)}) en conciliación ${reconciliation.id}`, 
          this.severityLevels.HIGH);
      }

      // Calcular total de gastos
      if (reconciliation.expenses) {
        const calculatedExpenseTotal = reconciliation.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        const storedExpenseTotal = reconciliation.summary.totalExpenses || 0;

        if (Math.abs(calculatedExpenseTotal - storedExpenseTotal) > 0.01) {
          this.addError(result, this.errorTypes.INCONSISTENCY, 
            `Total de gastos calculado (${calculatedExpenseTotal.toFixed(2)}) no coincide con almacenado (${storedExpenseTotal.toFixed(2)}) en conciliación ${reconciliation.id}`, 
            this.severityLevels.HIGH);
        }
      }
    });
  }

  /**
   * Valida consistencia de fechas en el sistema
   * @param {Object} systemData - Datos del sistema
   * @param {Object} result - Resultado de validación
   */
  validateDateConsistency(systemData, result) {
    // Validar que las fechas de creación sean coherentes
    const allItems = [
      ...(systemData.services || []).map(s => ({ ...s, type: 'service' })),
      ...(systemData.expenses || []).map(e => ({ ...e, type: 'expense' })),
      ...(systemData.reconciliations || []).map(r => ({ ...r, type: 'reconciliation' }))
    ];

    allItems.forEach(item => {
      if (item.createdAt) {
        const createdDate = new Date(item.createdAt);
        const itemDate = new Date(item.date);

        if (!isNaN(createdDate.getTime()) && !isNaN(itemDate.getTime())) {
          // La fecha de creación no debería ser anterior a la fecha del item
          if (createdDate < itemDate) {
            this.addWarning(result, this.errorTypes.INCONSISTENCY, 
              `${item.type} ${item.id}: fecha de creación anterior a fecha del elemento`);
          }
        }
      }
    });
  }

  /**
   * Valida IDs únicos en el sistema
   * @param {Object} systemData - Datos del sistema
   * @param {Object} result - Resultado de validación
   */
  validateUniqueIds(systemData, result) {
    const validateUniqueIdsInArray = (items, type) => {
      if (!Array.isArray(items)) return;

      const ids = items.map(item => item.id).filter(id => id);
      const uniqueIds = [...new Set(ids)];

      if (ids.length !== uniqueIds.length) {
        this.addError(result, this.errorTypes.INCONSISTENCY, 
          `IDs duplicados detectados en ${type}`, 
          this.severityLevels.HIGH);
      }
    };

    validateUniqueIdsInArray(systemData.services, 'servicios');
    validateUniqueIdsInArray(systemData.expenses, 'gastos');
    validateUniqueIdsInArray(systemData.reconciliations, 'conciliaciones');
  }

  /**
   * Valida integridad referencial
   * @param {Object} systemData - Datos del sistema
   * @param {Object} result - Resultado de validación
   */
  validateReferentialIntegrity(systemData, result) {
    // Esta validación ya se hace en parte en validateServiceReconciliationConsistency
    // y validateExpenseReconciliationConsistency, pero aquí podemos agregar más validaciones

    if (!systemData.reconciliations) return;

    systemData.reconciliations.forEach(reconciliation => {
      // Validar que todos los servicios referenciados existan
      if (reconciliation.services && systemData.services) {
        const missingServices = reconciliation.services.filter(rs => 
          !systemData.services.find(s => s.id === rs.id)
        );

        if (missingServices.length > 0) {
          this.addError(result, this.errorTypes.INCONSISTENCY, 
            `Conciliación ${reconciliation.id} referencia ${missingServices.length} servicios inexistentes`, 
            this.severityLevels.HIGH);
        }
      }

      // Validar que todos los gastos referenciados existan
      if (reconciliation.expenses && systemData.expenses) {
        const missingExpenses = reconciliation.expenses.filter(re => 
          !systemData.expenses.find(e => e.id === re.id)
        );

        if (missingExpenses.length > 0) {
          this.addError(result, this.errorTypes.INCONSISTENCY, 
            `Conciliación ${reconciliation.id} referencia ${missingExpenses.length} gastos inexistentes`, 
            this.severityLevels.HIGH);
        }
      }
    });
  }

  /**
   * Agrega un error al resultado de validación
   * @param {Object} result - Resultado de validación
   * @param {string} type - Tipo de error
   * @param {string} message - Mensaje de error
   * @param {string} severity - Severidad del error
   */
  addError(result, type, message, severity = this.severityLevels.MEDIUM) {
    result.valid = false;
    result.errors.push({
      type: type,
      message: message,
      severity: severity,
      timestamp: new Date().toISOString()
    });
    result.summary.errorCount++;

    if (severity === this.severityLevels.CRITICAL) {
      result.summary.criticalErrors++;
    } else if (severity === this.severityLevels.HIGH) {
      result.summary.highSeverityErrors++;
    }
  }

  /**
   * Agrega una advertencia al resultado de validación
   * @param {Object} result - Resultado de validación
   * @param {string} type - Tipo de advertencia
   * @param {string} message - Mensaje de advertencia
   */
  addWarning(result, type, message) {
    result.warnings.push({
      type: type,
      message: message,
      severity: this.severityLevels.LOW,
      timestamp: new Date().toISOString()
    });
    result.summary.warningCount++;
  }

  /**
   * Agrega información al resultado de validación
   * @param {Object} result - Resultado de validación
   * @param {string} type - Tipo de información
   * @param {string} message - Mensaje informativo
   */
  addInfo(result, type, message) {
    result.info.push({
      type: type,
      message: message,
      timestamp: new Date().toISOString()
    });
    result.summary.infoCount++;
  }

  /**
   * Finaliza el resultado de validación
   * @param {Object} result - Resultado de validación
   * @returns {Object} Resultado finalizado
   */
  finalizeValidationResult(result) {
    result.completedAt = new Date().toISOString();
    result.hasErrors = result.errors.length > 0;
    result.hasWarnings = result.warnings.length > 0;
    result.hasCriticalErrors = result.summary.criticalErrors > 0;
    
    return result;
  }

  /**
   * Formatea el resultado de validación para mostrar
   * @param {Object} result - Resultado de validación
   * @returns {string} Resultado formateado
   */
  formatValidationResult(result) {
    let output = [];

    if (result.valid) {
      output.push('✅ Validación exitosa');
    } else {
      output.push('❌ Validación fallida');
    }

    if (result.summary.errorCount > 0) {
      output.push(`\n🚨 Errores: ${result.summary.errorCount}`);
      result.errors.forEach(error => {
        const icon = error.severity === this.severityLevels.CRITICAL ? '🔴' : 
                    error.severity === this.severityLevels.HIGH ? '🟠' : '🟡';
        output.push(`   ${icon} ${error.message}`);
      });
    }

    if (result.summary.warningCount > 0) {
      output.push(`\n⚠️  Advertencias: ${result.summary.warningCount}`);
      result.warnings.forEach(warning => {
        output.push(`   🟡 ${warning.message}`);
      });
    }

    if (result.summary.infoCount > 0) {
      output.push(`\nℹ️  Información: ${result.summary.infoCount}`);
      result.info.forEach(info => {
        output.push(`   🔵 ${info.message}`);
      });
    }

    return output.join('\n');
  }
}

// Exportar para uso en navegador y Node.js
if (typeof window !== 'undefined') {
  window.ValidationSystem = ValidationSystem;
} else if (typeof module !== 'undefined') {
  module.exports = ValidationSystem;
}