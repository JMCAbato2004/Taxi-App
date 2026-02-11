/**
 * ReconciliationGenerator - Generador de conciliaciones por período
 * 
 * Implementa la lógica principal para generar conciliaciones basadas en servicios y gastos
 * de un período específico. Agrupa servicios por día y calcula totales diarios y generales.
 * 
 * Tarea 6.1: Crear ReconciliationGenerator con lógica principal
 * Requerimientos: 5.2, 5.3, 5.5
 */

class ReconciliationGenerator {
  constructor(calculationEngine, storageManager) {
    this.calculationEngine = calculationEngine;
    this.storageManager = storageManager;
  }

  /**
   * Genera una conciliación completa para un período específico
   * @param {Object} period - Período de fechas {startDate, endDate}
   * @param {Array} services - Servicios del período (opcional, se cargan si no se proporcionan)
   * @param {Array} expenses - Gastos del período (opcional, se cargan si no se proporcionan)
   * @returns {Object} Datos completos de la conciliación
   */
  generateReconciliation(period, services = null, expenses = null) {
    try {
      // Validar período
      if (!period || !period.startDate || !period.endDate) {
        throw new Error('Período inválido: se requieren startDate y endDate');
      }

      // Cargar datos si no se proporcionan
      const allServices = services || this.storageManager.loadServices();
      const allExpenses = expenses || this.storageManager.loadExpenses();

      // Filtrar servicios y gastos por período
      const periodServices = this.filterByPeriod(allServices, period);
      const periodExpenses = this.filterByPeriod(allExpenses, period);

      // Generar ID único para la conciliación
      const reconciliationId = this.generateReconciliationId(period);

      // Agrupar servicios por día
      const servicesByDay = this.groupServicesByDay(periodServices);

      // Calcular totales diarios
      const dailyTotals = this.calculateDailyTotals(servicesByDay, periodExpenses);

      // Calcular resumen general
      const summary = this.calculatePeriodSummary(dailyTotals);

      // Crear estructura de conciliación
      const reconciliationData = {
        id: reconciliationId,
        period: {
          startDate: period.startDate,
          endDate: period.endDate
        },
        services: periodServices,
        expenses: periodExpenses,
        dailyTotals: dailyTotals,
        summary: summary,
        cashBreakdown: this.initializeCashBreakdown(),
        finalSettlement: this.calculateFinalSettlement(summary),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return reconciliationData;

    } catch (error) {
      console.error('Error generando conciliación:', error);
      throw new Error(`Error al generar conciliación: ${error.message}`);
    }
  }

  /**
   * Filtra servicios o gastos por período de fechas
   * @param {Array} items - Array de servicios o gastos
   * @param {Object} period - Período {startDate, endDate}
   * @returns {Array} Items filtrados por período
   */
  filterByPeriod(items, period) {
    if (!Array.isArray(items)) {
      return [];
    }

    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    return items.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  /**
   * Agrupa servicios por día
   * @param {Array} services - Array de servicios
   * @returns {Object} Servicios agrupados por fecha (YYYY-MM-DD)
   */
  groupServicesByDay(services) {
    const servicesByDay = {};

    services.forEach(service => {
      const dateKey = this.formatDateKey(service.date);
      
      if (!servicesByDay[dateKey]) {
        servicesByDay[dateKey] = [];
      }
      
      servicesByDay[dateKey].push(service);
    });

    return servicesByDay;
  }

  /**
   * Calcula totales diarios para cada día del período
   * @param {Object} servicesByDay - Servicios agrupados por día
   * @param {Array} expenses - Gastos del período
   * @returns {Array} Array de totales diarios
   */
  calculateDailyTotals(servicesByDay, expenses) {
    const dailyTotals = [];

    // Agrupar gastos por día
    const expensesByDay = this.groupExpensesByDay(expenses);

    // Obtener todas las fechas (servicios y gastos)
    const allDates = new Set([
      ...Object.keys(servicesByDay),
      ...Object.keys(expensesByDay)
    ]);

    // Calcular totales para cada día
    Array.from(allDates).sort().forEach(dateKey => {
      const dayServices = servicesByDay[dateKey] || [];
      const dayExpenses = expensesByDay[dateKey] || [];

      const dailyTotal = this.calculateSingleDayTotals(dateKey, dayServices, dayExpenses);
      dailyTotals.push(dailyTotal);
    });

    return dailyTotals;
  }

  /**
   * Agrupa gastos por día
   * @param {Array} expenses - Array de gastos
   * @returns {Object} Gastos agrupados por fecha
   */
  groupExpensesByDay(expenses) {
    const expensesByDay = {};

    expenses.forEach(expense => {
      const dateKey = this.formatDateKey(expense.date);
      
      if (!expensesByDay[dateKey]) {
        expensesByDay[dateKey] = [];
      }
      
      expensesByDay[dateKey].push(expense);
    });

    return expensesByDay;
  }

  /**
   * Calcula totales para un día específico
   * @param {string} dateKey - Fecha en formato YYYY-MM-DD
   * @param {Array} services - Servicios del día
   * @param {Array} expenses - Gastos del día
   * @returns {Object} Totales del día
   */
  calculateSingleDayTotals(dateKey, services, expenses) {
    // Calcular totales de servicios
    const serviceStart = services.length;
    const totalService = services.reduce((sum, service) => sum + service.amount, 0);
    
    // Separar por tipo de pago
    const cardPayment = services
      .filter(s => s.paymentType === 'card')
      .reduce((sum, s) => sum + s.amount, 0);
    
    const appPayment = services
      .filter(s => s.paymentType === 'app')
      .reduce((sum, s) => sum + s.amount, 0);
    
    const cashPayment = services
      .filter(s => s.paymentType === 'cash')
      .reduce((sum, s) => sum + s.amount, 0);

    // Servicios articulados
    const articulated = services
      .filter(s => s.isArticulated)
      .reduce((sum, s) => sum + s.amount, 0);

    // Calcular totales de Freenow
    const freenowServices = services.filter(s => s.platform === 'freenow');
    const freenowTotal = freenowServices.reduce((sum, s) => sum + s.amount, 0);
    const freenowCommission = this.calculationEngine.calculateCommission(freenowTotal, 'freenow');
    const freenowNet = freenowTotal - freenowCommission;

    // Calcular gastos del día
    const dayExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calcular distribuciones
    const netIncome = totalService - dayExpenses;
    const distribution = this.calculationEngine.calculateDistribution(netIncome);

    return {
      date: dateKey,
      serviceStart: serviceStart,
      totalService: totalService,
      articulated: articulated,
      cardPayment: cardPayment,
      appPayment: appPayment,
      cashPayment: cashPayment,
      expenses: dayExpenses,
      freenowTotal: freenowTotal,
      freenowCommission: freenowCommission,
      freenowNet: freenowNet,
      distribution60: distribution.owner,
      distribution40: distribution.driver,
      netCash: cashPayment - (dayExpenses * (cashPayment / totalService || 0)),
      netFreenow: freenowNet,
      netIncome: netIncome
    };
  }

  /**
   * Calcula el resumen general del período
   * @param {Array} dailyTotals - Totales diarios
   * @returns {Object} Resumen del período
   */
  calculatePeriodSummary(dailyTotals) {
    const summary = {
      totalServices: 0,
      totalArticulated: 0,
      totalCard: 0,
      totalApp: 0,
      totalCash: 0,
      totalExpenses: 0,
      totalFreenow: 0,
      totalCommission: 0,
      netIncome: 0,
      distribution60: 0,
      distribution40: 0,
      netCash: 0,
      netFreenow: 0
    };

    dailyTotals.forEach(daily => {
      summary.totalServices += daily.totalService;
      summary.totalArticulated += daily.articulated;
      summary.totalCard += daily.cardPayment;
      summary.totalApp += daily.appPayment;
      summary.totalCash += daily.cashPayment;
      summary.totalExpenses += daily.expenses;
      summary.totalFreenow += daily.freenowTotal;
      summary.totalCommission += daily.freenowCommission;
      summary.netIncome += daily.netIncome;
      summary.distribution60 += daily.distribution60;
      summary.distribution40 += daily.distribution40;
      summary.netCash += daily.netCash;
      summary.netFreenow += daily.netFreenow;
    });

    return summary;
  }

  /**
   * Calcula la liquidación final
   * @param {Object} summary - Resumen del período
   * @returns {Object} Liquidación final
   */
  calculateFinalSettlement(summary) {
    return this.calculationEngine.calculateFinalSettlement({
      totalIncome: summary.netIncome,
      totalExpenses: summary.totalExpenses,
      freenowExtras: { incentives: 0, tips: 0 }, // Se actualizará cuando se implementen
      externalBalance: 0 // Se calculará según la lógica de negocio
    });
  }

  /**
   * Inicializa el desglose de efectivo vacío
   * @returns {Object} Desglose de efectivo inicial
   */
  initializeCashBreakdown() {
    return {
      bills: {
        fifty: 0,
        twenty: 0,
        ten: 0,
        five: 0,
        two: 0,
        one: 0,
        cents: 0
      },
      total: 0,
      difference: 0
    };
  }

  /**
   * Genera un ID único para la conciliación
   * @param {Object} period - Período de la conciliación
   * @returns {string} ID único
   */
  generateReconciliationId(period) {
    const startDate = period.startDate.replace(/-/g, '');
    const endDate = period.endDate.replace(/-/g, '');
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `reconciliation_${startDate}_${endDate}_${timestamp}_${random}`;
  }

  /**
   * Formatea una fecha como clave (YYYY-MM-DD)
   * @param {string|Date} date - Fecha a formatear
   * @returns {string} Fecha formateada
   */
  formatDateKey(date) {
    if (typeof date === 'string') {
      // Asegurar formato YYYY-MM-DD
      const dateObj = new Date(date);
      return dateObj.toISOString().split('T')[0];
    }
    
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    throw new Error('Formato de fecha inválido');
  }

  /**
   * Recalcula una conciliación existente
   * @param {Object} reconciliationData - Datos de conciliación existente
   * @returns {Object} Conciliación recalculada
   */
  recalculateReconciliation(reconciliationData) {
    return this.generateReconciliation(
      reconciliationData.period,
      reconciliationData.services,
      reconciliationData.expenses
    );
  }

  /**
   * Recalcula automáticamente tras cambios en servicios o gastos
   * @param {Object} reconciliationData - Conciliación existente
   * @param {Array} updatedServices - Servicios actualizados (opcional)
   * @param {Array} updatedExpenses - Gastos actualizados (opcional)
   * @returns {Object} Conciliación recalculada
   */
  recalculateAfterChanges(reconciliationData, updatedServices = null, updatedExpenses = null) {
    try {
      // Usar servicios y gastos actualizados o los existentes
      const services = updatedServices || reconciliationData.services;
      const expenses = updatedExpenses || reconciliationData.expenses;

      // Filtrar por período para asegurar consistencia
      const periodServices = this.filterByPeriod(services, reconciliationData.period);
      const periodExpenses = this.filterByPeriod(expenses, reconciliationData.period);

      // Generar nueva conciliación con datos actualizados
      const updatedReconciliation = this.generateReconciliation(
        reconciliationData.period,
        periodServices,
        periodExpenses
      );

      // Mantener ID original y actualizar timestamp
      updatedReconciliation.id = reconciliationData.id;
      updatedReconciliation.createdAt = reconciliationData.createdAt;
      updatedReconciliation.updatedAt = new Date().toISOString();

      // Asegurar que la fecha de actualización sea diferente
      if (updatedReconciliation.updatedAt === reconciliationData.updatedAt) {
        // Agregar un milisegundo para asegurar diferencia
        const newTime = new Date(Date.now() + 1);
        updatedReconciliation.updatedAt = newTime.toISOString();
      }

      // Preservar desglose de efectivo si existe
      if (reconciliationData.cashBreakdown) {
        updatedReconciliation.cashBreakdown = { ...reconciliationData.cashBreakdown };
        // Recalcular diferencia con nuevo efectivo neto
        const newNetCash = updatedReconciliation.summary.netCash;
        updatedReconciliation.cashBreakdown.difference = 
          updatedReconciliation.cashBreakdown.total - newNetCash;
      }

      return updatedReconciliation;

    } catch (error) {
      console.error('Error en recálculo automático:', error);
      throw new Error(`Error al recalcular conciliación: ${error.message}`);
    }
  }

  /**
   * Calcula totales netos restando gastos de ingresos brutos
   * @param {number} grossIncome - Ingresos brutos
   * @param {number} totalExpenses - Total de gastos
   * @returns {Object} Totales netos calculados
   */
  calculateNetTotals(grossIncome, totalExpenses) {
    if (typeof grossIncome !== 'number' || typeof totalExpenses !== 'number') {
      throw new Error('Los ingresos y gastos deben ser números');
    }

    if (grossIncome < 0 || totalExpenses < 0) {
      throw new Error('Los ingresos y gastos no pueden ser negativos');
    }

    const netIncome = grossIncome - totalExpenses;
    const ownerAmount = this.calculationEngine.calculateDistribution(netIncome, 0.6);
    const driverAmount = this.calculationEngine.calculateDistribution(netIncome, 0.4);

    return {
      grossIncome: grossIncome,
      totalExpenses: totalExpenses,
      netIncome: netIncome,
      distribution: {
        driver: driverAmount,
        owner: ownerAmount
      },
      profitMargin: grossIncome > 0 ? (netIncome / grossIncome) * 100 : 0
    };
  }

  /**
   * Maneja casos de conciliación vacía
   * @param {Object} period - Período de la conciliación
   * @returns {Object} Conciliación vacía con totales en cero
   */
  createEmptyReconciliation(period) {
    return {
      id: this.generateReconciliationId(period),
      period: {
        startDate: period.startDate,
        endDate: period.endDate
      },
      services: [],
      expenses: [],
      dailyTotals: [],
      summary: {
        totalServices: 0,
        totalArticulated: 0,
        totalCard: 0,
        totalApp: 0,
        totalCash: 0,
        totalExpenses: 0,
        totalFreenow: 0,
        totalCommission: 0,
        netIncome: 0,
        distribution60: 0,
        distribution40: 0,
        netCash: 0,
        netFreenow: 0
      },
      cashBreakdown: this.initializeCashBreakdown(),
      finalSettlement: {
        driverAmount: 0,
        ownerAmount: 0,
        externalBalance: 0,
        freenowExtras: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Actualiza el desglose de efectivo y recalcula diferencias
   * @param {Object} reconciliationData - Datos de conciliación
   * @param {Object} newCashBreakdown - Nuevo desglose de efectivo
   * @returns {Object} Conciliación con desglose actualizado
   */
  updateCashBreakdown(reconciliationData, newCashBreakdown) {
    try {
      // Calcular total de billetes
      const billsTotal = this.calculateBillsTotal(newCashBreakdown.bills);
      
      // Obtener efectivo neto calculado
      const netCash = reconciliationData.summary.netCash;
      
      // Calcular diferencia
      const difference = billsTotal - netCash;

      // Crear nuevo desglose
      const updatedCashBreakdown = {
        bills: { ...newCashBreakdown.bills },
        total: billsTotal,
        difference: difference
      };

      // Actualizar conciliación
      const updatedReconciliation = { ...reconciliationData };
      updatedReconciliation.cashBreakdown = updatedCashBreakdown;
      updatedReconciliation.updatedAt = new Date().toISOString();

      // Recalcular liquidación final si hay cambios significativos
      if (Math.abs(difference) > 0.01) {
        updatedReconciliation.finalSettlement = this.calculationEngine.calculateFinalSettlement({
          totalIncome: reconciliationData.summary.netIncome,
          totalExpenses: reconciliationData.summary.totalExpenses,
          freenowExtras: { incentives: 0, tips: 0 },
          externalBalance: difference
        });
      }

      return updatedReconciliation;

    } catch (error) {
      console.error('Error actualizando desglose de efectivo:', error);
      throw new Error(`Error al actualizar desglose: ${error.message}`);
    }
  }

  /**
   * Calcula el total de billetes según las cantidades
   * @param {Object} bills - Desglose de billetes
   * @returns {number} Total calculado
   */
  calculateBillsTotal(bills) {
    const denominations = {
      fifty: 50,
      twenty: 20,
      ten: 10,
      five: 5,
      two: 2,
      one: 1,
      cents: 0.01
    };

    let total = 0;
    Object.entries(bills).forEach(([denomination, count]) => {
      if (denominations[denomination] && typeof count === 'number' && count >= 0) {
        total += denominations[denomination] * count;
      }
    });

    return Math.round(total * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Detecta inconsistencias en los cálculos de la conciliación
   * @param {Object} reconciliationData - Datos de conciliación a validar
   * @returns {Object} Resultado de validación con inconsistencias encontradas
   */
  detectInconsistencies(reconciliationData) {
    const inconsistencies = [];

    try {
      // Validar suma de totales diarios vs resumen general
      if (reconciliationData.dailyTotals.length > 0) {
        const dailySum = reconciliationData.dailyTotals.reduce((sum, daily) => sum + daily.totalService, 0);
        const summaryTotal = reconciliationData.summary.totalServices;
        
        if (Math.abs(dailySum - summaryTotal) > 0.01) {
          inconsistencies.push({
            type: 'total_mismatch',
            message: `Suma diaria (${dailySum}) no coincide con total general (${summaryTotal})`,
            severity: 'high'
          });
        }
      }

      // Validar distribución 60/40
      const expectedOwner = reconciliationData.summary.netIncome * 0.6;
      const expectedDriver = reconciliationData.summary.netIncome * 0.4;
      
      if (Math.abs(reconciliationData.summary.distribution60 - expectedOwner) > 0.01) {
        inconsistencies.push({
          type: 'distribution_error',
          message: `Distribución 60% incorrecta: esperado ${expectedOwner.toFixed(2)}, obtenido ${reconciliationData.summary.distribution60}`,
          severity: 'high'
        });
      }

      if (Math.abs(reconciliationData.summary.distribution40 - expectedDriver) > 0.01) {
        inconsistencies.push({
          type: 'distribution_error',
          message: `Distribución 40% incorrecta: esperado ${expectedDriver.toFixed(2)}, obtenido ${reconciliationData.summary.distribution40}`,
          severity: 'high'
        });
      }

      // Validar diferencias de efectivo significativas
      if (reconciliationData.cashBreakdown && Math.abs(reconciliationData.cashBreakdown.difference) > 10) {
        inconsistencies.push({
          type: 'cash_difference',
          message: `Diferencia de efectivo significativa: ${reconciliationData.cashBreakdown.difference.toFixed(2)}€`,
          severity: 'medium'
        });
      }

      // Validar comisiones Freenow
      const freenowServices = reconciliationData.services.filter(s => s.platform === 'freenow');
      const expectedFreenowTotal = freenowServices.reduce((sum, s) => sum + s.amount, 0);
      
      if (Math.abs(reconciliationData.summary.totalFreenow - expectedFreenowTotal) > 0.01) {
        inconsistencies.push({
          type: 'freenow_total_error',
          message: `Total Freenow incorrecto: esperado ${expectedFreenowTotal}, obtenido ${reconciliationData.summary.totalFreenow}`,
          severity: 'high'
        });
      }

    } catch (error) {
      inconsistencies.push({
        type: 'validation_error',
        message: `Error durante validación: ${error.message}`,
        severity: 'high'
      });
    }

    return {
      hasInconsistencies: inconsistencies.length > 0,
      inconsistencies: inconsistencies,
      summary: {
        total: inconsistencies.length,
        high: inconsistencies.filter(i => i.severity === 'high').length,
        medium: inconsistencies.filter(i => i.severity === 'medium').length,
        low: inconsistencies.filter(i => i.severity === 'low').length
      }
    };
  }

  /**
   * Valida los datos de entrada para generar una conciliación
   * @param {Object} period - Período a validar
   * @param {Array} services - Servicios a validar
   * @param {Array} expenses - Gastos a validar
   * @returns {Object} Resultado de validación {valid: boolean, errors: Array}
   */
  validateReconciliationData(period, services = [], expenses = []) {
    const errors = [];

    // Validar período
    if (!period) {
      errors.push('Período requerido');
    } else {
      if (!period.startDate) {
        errors.push('Fecha de inicio requerida');
      }
      if (!period.endDate) {
        errors.push('Fecha de fin requerida');
      }
      if (period.startDate && period.endDate && new Date(period.startDate) > new Date(period.endDate)) {
        errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }

    // Validar servicios
    if (!Array.isArray(services)) {
      errors.push('Los servicios deben ser un array');
    } else {
      services.forEach((service, index) => {
        if (!service.date) {
          errors.push(`Servicio ${index + 1}: fecha requerida`);
        }
        if (typeof service.amount !== 'number' || service.amount < 0) {
          errors.push(`Servicio ${index + 1}: monto inválido`);
        }
        if (!['cash', 'card', 'app'].includes(service.paymentType)) {
          errors.push(`Servicio ${index + 1}: tipo de pago inválido`);
        }
      });
    }

    // Validar gastos
    if (!Array.isArray(expenses)) {
      errors.push('Los gastos deben ser un array');
    } else {
      expenses.forEach((expense, index) => {
        if (!expense.date) {
          errors.push(`Gasto ${index + 1}: fecha requerida`);
        }
        if (typeof expense.amount !== 'number' || expense.amount < 0) {
          errors.push(`Gasto ${index + 1}: monto inválido`);
        }
        if (!expense.description || expense.description.trim().length === 0) {
          errors.push(`Gasto ${index + 1}: descripción requerida`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// Exportar para uso en navegador y Node.js
if (typeof window !== 'undefined') {
  window.ReconciliationGenerator = ReconciliationGenerator;
} else if (typeof module !== 'undefined') {
  module.exports = ReconciliationGenerator;
}