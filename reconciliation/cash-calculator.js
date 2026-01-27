/**
 * CashCalculator - Calculadora de efectivo con desglose de billetes
 * 
 * Implementa la funcionalidad para calcular el desglose de billetes y monedas,
 * calcular totales automáticamente y determinar diferencias con el efectivo neto esperado.
 * 
 * Tarea 7.1: Crear CashCalculator con desglose de billetes
 * Requerimientos: 6.1, 6.2, 6.3
 */

class CashCalculator {
  constructor() {
    // Denominaciones de billetes y monedas en euros
    this.denominations = {
      bills: {
        fifty: { value: 50, label: '50€', type: 'bill' },
        twenty: { value: 20, label: '20€', type: 'bill' },
        ten: { value: 10, label: '10€', type: 'bill' },
        five: { value: 5, label: '5€', type: 'bill' }
      },
      coins: {
        two: { value: 2, label: '2€', type: 'coin' },
        one: { value: 1, label: '1€', type: 'coin' },
        fifty_cents: { value: 0.5, label: '50¢', type: 'coin' },
        twenty_cents: { value: 0.2, label: '20¢', type: 'coin' },
        ten_cents: { value: 0.1, label: '10¢', type: 'coin' },
        five_cents: { value: 0.05, label: '5¢', type: 'coin' },
        two_cents: { value: 0.02, label: '2¢', type: 'coin' },
        one_cent: { value: 0.01, label: '1¢', type: 'coin' }
      }
    };

    // Configuración por defecto
    this.settings = {
      precision: 2, // Decimales para redondeo
      autoCalculate: true, // Cálculo automático al cambiar cantidades
      showCoins: true, // Mostrar monedas en la interfaz
      validateInput: true // Validar entrada de datos
    };
  }

  /**
   * Crea un desglose de efectivo vacío
   * @returns {Object} Desglose inicial con todas las denominaciones en 0
   */
  createEmptyBreakdown() {
    const breakdown = {
      bills: {},
      coins: {},
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        autoCalculated: false
      }
    };

    // Inicializar billetes
    Object.keys(this.denominations.bills).forEach(key => {
      breakdown.bills[key] = 0;
    });

    // Inicializar monedas
    Object.keys(this.denominations.coins).forEach(key => {
      breakdown.coins[key] = 0;
    });

    return breakdown;
  }

  /**
   * Calcula el total de un desglose de efectivo
   * @param {Object} breakdown - Desglose de billetes y monedas
   * @returns {Object} Resultado del cálculo con totales y detalles
   */
  calculateTotal(breakdown) {
    try {
      if (!breakdown || typeof breakdown !== 'object') {
        throw new Error('Desglose de efectivo inválido');
      }

      let totalBills = 0;
      let totalCoins = 0;
      const details = {
        bills: {},
        coins: {},
        summary: {}
      };

      // Calcular total de billetes
      if (breakdown.bills) {
        Object.entries(breakdown.bills).forEach(([key, count]) => {
          const denomination = this.denominations.bills[key];
          if (denomination && typeof count === 'number' && count >= 0) {
            const subtotal = denomination.value * count;
            totalBills += subtotal;
            details.bills[key] = {
              count: count,
              value: denomination.value,
              subtotal: subtotal,
              label: denomination.label
            };
          }
        });
      }

      // Calcular total de monedas
      if (breakdown.coins) {
        Object.entries(breakdown.coins).forEach(([key, count]) => {
          const denomination = this.denominations.coins[key];
          if (denomination && typeof count === 'number' && count >= 0) {
            const subtotal = denomination.value * count;
            totalCoins += subtotal;
            details.coins[key] = {
              count: count,
              value: denomination.value,
              subtotal: subtotal,
              label: denomination.label
            };
          }
        });
      }

      const grandTotal = totalBills + totalCoins;

      // Resumen
      details.summary = {
        totalBills: this.roundToPrecision(totalBills),
        totalCoins: this.roundToPrecision(totalCoins),
        grandTotal: this.roundToPrecision(grandTotal),
        billCount: Object.values(breakdown.bills || {}).reduce((sum, count) => sum + (count || 0), 0),
        coinCount: Object.values(breakdown.coins || {}).reduce((sum, count) => sum + (count || 0), 0)
      };

      return {
        success: true,
        total: details.summary.grandTotal,
        details: details,
        calculatedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        total: 0,
        details: null
      };
    }
  }

  /**
   * Calcula la diferencia entre el efectivo contado y el efectivo neto esperado
   * @param {Object} breakdown - Desglose de efectivo contado
   * @param {number} expectedCash - Efectivo neto esperado
   * @returns {Object} Resultado con diferencia y análisis
   */
  calculateDifference(breakdown, expectedCash) {
    try {
      if (typeof expectedCash !== 'number') {
        throw new Error('El efectivo esperado debe ser un número');
      }

      const calculation = this.calculateTotal(breakdown);
      if (!calculation.success) {
        throw new Error(`Error calculando total: ${calculation.error}`);
      }

      const actualCash = calculation.total;
      const difference = this.roundToPrecision(actualCash - expectedCash);
      const percentageDifference = expectedCash !== 0 ? 
        this.roundToPrecision((difference / expectedCash) * 100) : 0;

      // Análisis de la diferencia
      let analysis = {
        status: 'exact',
        severity: 'none',
        message: 'El efectivo contado coincide exactamente con el esperado'
      };

      if (Math.abs(difference) > 0.01) { // Más de 1 céntimo de diferencia
        if (difference > 0) {
          analysis.status = 'surplus';
          analysis.message = `Hay un excedente de ${Math.abs(difference).toFixed(2)}€`;
        } else {
          analysis.status = 'deficit';
          analysis.message = `Hay un faltante de ${Math.abs(difference).toFixed(2)}€`;
        }

        // Determinar severidad
        if (Math.abs(difference) >= 20) {
          analysis.severity = 'high';
        } else if (Math.abs(difference) >= 5) {
          analysis.severity = 'medium';
        } else {
          analysis.severity = 'low';
        }
      }

      return {
        success: true,
        expectedCash: this.roundToPrecision(expectedCash),
        actualCash: actualCash,
        difference: difference,
        percentageDifference: percentageDifference,
        analysis: analysis,
        calculation: calculation,
        calculatedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        expectedCash: expectedCash,
        actualCash: 0,
        difference: 0
      };
    }
  }

  /**
   * Actualiza una denominación específica y recalcula automáticamente
   * @param {Object} breakdown - Desglose actual
   * @param {string} type - 'bills' o 'coins'
   * @param {string} denomination - Clave de la denominación
   * @param {number} count - Nueva cantidad
   * @returns {Object} Desglose actualizado con cálculos
   */
  updateDenomination(breakdown, type, denomination, count) {
    try {
      // Validar entrada
      if (!breakdown || typeof breakdown !== 'object') {
        throw new Error('Desglose inválido');
      }

      if (!['bills', 'coins'].includes(type)) {
        throw new Error('Tipo debe ser "bills" o "coins"');
      }

      if (!this.denominations[type][denomination]) {
        throw new Error(`Denominación ${denomination} no válida para ${type}`);
      }

      if (typeof count !== 'number' || count < 0) {
        throw new Error('La cantidad debe ser un número no negativo');
      }

      // Crear copia del desglose
      const updatedBreakdown = JSON.parse(JSON.stringify(breakdown));

      // Asegurar que existen las estructuras
      if (!updatedBreakdown[type]) {
        updatedBreakdown[type] = {};
      }

      if (!updatedBreakdown.metadata) {
        updatedBreakdown.metadata = {
          createdAt: breakdown.metadata?.createdAt || new Date().toISOString(),
          autoCalculated: false
        };
      }

      // Actualizar la denominación
      updatedBreakdown[type][denomination] = Math.floor(count); // Solo enteros
      updatedBreakdown.metadata.updatedAt = new Date().toISOString();
      updatedBreakdown.metadata.autoCalculated = this.settings.autoCalculate;

      // Calcular nuevo total si está habilitado
      let calculation = null;
      if (this.settings.autoCalculate) {
        calculation = this.calculateTotal(updatedBreakdown);
      }

      return {
        success: true,
        breakdown: updatedBreakdown,
        calculation: calculation,
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        breakdown: breakdown
      };
    }
  }

  /**
   * Sugiere un desglose óptimo para una cantidad específica
   * @param {number} amount - Cantidad a desglosar
   * @param {Object} options - Opciones de desglose
   * @returns {Object} Desglose sugerido
   */
  suggestBreakdown(amount, options = {}) {
    try {
      if (typeof amount !== 'number' || amount < 0) {
        throw new Error('La cantidad debe ser un número no negativo');
      }

      const opts = {
        preferLargerDenominations: true,
        includeCoins: true,
        maxCoins: 50, // Máximo número de monedas
        ...options
      };

      let remaining = this.roundToPrecision(amount);
      const suggestion = this.createEmptyBreakdown();

      // Algoritmo greedy para desglose óptimo
      let totalCoins = 0;
      
      // Procesar billetes primero (mayor a menor)
      const billKeys = ['fifty', 'twenty', 'ten', 'five'];
      for (const key of billKeys) {
        if (remaining <= 0.001) break;
        const denom = this.denominations.bills[key];
        const count = Math.floor(remaining / denom.value);
        if (count > 0) {
          suggestion.bills[key] = count;
          remaining = this.roundToPrecision(remaining - (count * denom.value));
        }
      }

      // Procesar monedas si están habilitadas (mayor a menor)
      if (opts.includeCoins) {
        const coinKeys = ['two', 'one', 'fifty_cents', 'twenty_cents', 'ten_cents', 'five_cents', 'two_cents', 'one_cent'];
        for (const key of coinKeys) {
          if (remaining <= 0.001) break;
          if (totalCoins >= opts.maxCoins) break;
          
          const denom = this.denominations.coins[key];
          const count = Math.floor(remaining / denom.value);
          if (count > 0) {
            const allowedCoins = Math.min(count, opts.maxCoins - totalCoins);
            suggestion.coins[key] = allowedCoins;
            remaining = this.roundToPrecision(remaining - (allowedCoins * denom.value));
            totalCoins += allowedCoins;
          }
        }
      }

      // Calcular total del desglose sugerido
      const calculation = this.calculateTotal(suggestion);

      return {
        success: true,
        originalAmount: amount,
        suggestedBreakdown: suggestion,
        calculation: calculation,
        remainingAmount: remaining,
        isExact: Math.abs(remaining) < 0.01,
        metadata: {
          algorithm: 'greedy',
          options: opts,
          createdAt: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        originalAmount: amount
      };
    }
  }

  /**
   * Valida un desglose de efectivo
   * @param {Object} breakdown - Desglose a validar
   * @returns {Object} Resultado de validación
   */
  validateBreakdown(breakdown) {
    const errors = [];
    const warnings = [];

    try {
      if (!breakdown || typeof breakdown !== 'object') {
        errors.push('El desglose debe ser un objeto válido');
        return { valid: false, errors, warnings };
      }

      // Validar estructura de billetes
      if (breakdown.bills) {
        Object.entries(breakdown.bills).forEach(([key, count]) => {
          if (!this.denominations.bills[key]) {
            errors.push(`Denominación de billete inválida: ${key}`);
          } else if (typeof count !== 'number' || count < 0) {
            errors.push(`Cantidad inválida para ${key}: debe ser un número no negativo`);
          } else if (!Number.isInteger(count)) {
            warnings.push(`Cantidad no entera para ${key}: se redondeará hacia abajo`);
          }
        });
      }

      // Validar estructura de monedas
      if (breakdown.coins) {
        Object.entries(breakdown.coins).forEach(([key, count]) => {
          if (!this.denominations.coins[key]) {
            errors.push(`Denominación de moneda inválida: ${key}`);
          } else if (typeof count !== 'number' || count < 0) {
            errors.push(`Cantidad inválida para ${key}: debe ser un número no negativo`);
          } else if (!Number.isInteger(count)) {
            warnings.push(`Cantidad no entera para ${key}: se redondeará hacia abajo`);
          }
        });
      }

      // Validar totales razonables
      const calculation = this.calculateTotal(breakdown);
      if (calculation.success) {
        if (calculation.details.summary.billCount > 1000) {
          warnings.push('Cantidad muy alta de billetes (>1000)');
        }
        if (calculation.details.summary.coinCount > 500) {
          warnings.push('Cantidad muy alta de monedas (>500)');
        }
        if (calculation.total > 10000) {
          warnings.push('Total muy alto (>10,000€)');
        }
      }

    } catch (error) {
      errors.push(`Error durante validación: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      summary: {
        errorCount: errors.length,
        warningCount: warnings.length
      }
    };
  }

  /**
   * Convierte un desglose a formato de visualización
   * @param {Object} breakdown - Desglose a formatear
   * @param {Object} options - Opciones de formato
   * @returns {Object} Desglose formateado para mostrar
   */
  formatForDisplay(breakdown, options = {}) {
    try {
      const opts = {
        showZeros: false,
        groupByType: true,
        includeLabels: true,
        includeSubtotals: true,
        currency: '€',
        ...options
      };

      const calculation = this.calculateTotal(breakdown);
      if (!calculation.success) {
        throw new Error(`Error calculando totales: ${calculation.error}`);
      }

      const formatted = {
        bills: [],
        coins: [],
        summary: calculation.details.summary,
        display: {
          total: `${calculation.total.toFixed(2)}${opts.currency}`,
          billsTotal: `${calculation.details.summary.totalBills.toFixed(2)}${opts.currency}`,
          coinsTotal: `${calculation.details.summary.totalCoins.toFixed(2)}${opts.currency}`
        }
      };

      // Formatear billetes
      Object.entries(calculation.details.bills).forEach(([key, detail]) => {
        if (opts.showZeros || detail.count > 0) {
          formatted.bills.push({
            key: key,
            label: detail.label,
            count: detail.count,
            value: detail.value,
            subtotal: detail.subtotal,
            display: {
              count: detail.count.toString(),
              value: `${detail.value.toFixed(2)}${opts.currency}`,
              subtotal: `${detail.subtotal.toFixed(2)}${opts.currency}`
            }
          });
        }
      });

      // Formatear monedas
      Object.entries(calculation.details.coins).forEach(([key, detail]) => {
        if (opts.showZeros || detail.count > 0) {
          formatted.coins.push({
            key: key,
            label: detail.label,
            count: detail.count,
            value: detail.value,
            subtotal: detail.subtotal,
            display: {
              count: detail.count.toString(),
              value: detail.value < 1 ? detail.label : `${detail.value.toFixed(2)}${opts.currency}`,
              subtotal: `${detail.subtotal.toFixed(2)}${opts.currency}`
            }
          });
        }
      });

      return {
        success: true,
        formatted: formatted,
        options: opts,
        formattedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Redondea un número a la precisión configurada
   * @param {number} value - Valor a redondear
   * @returns {number} Valor redondeado
   */
  roundToPrecision(value) {
    const factor = Math.pow(10, this.settings.precision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Obtiene información sobre las denominaciones disponibles
   * @returns {Object} Información de denominaciones
   */
  getDenominationsInfo() {
    return {
      bills: { ...this.denominations.bills },
      coins: { ...this.denominations.coins },
      settings: { ...this.settings },
      totalDenominations: Object.keys(this.denominations.bills).length + 
                         Object.keys(this.denominations.coins).length
    };
  }

  /**
   * Actualiza la configuración del calculador
   * @param {Object} newSettings - Nueva configuración
   * @returns {Object} Configuración actualizada
   */
  updateSettings(newSettings) {
    try {
      const validSettings = ['precision', 'autoCalculate', 'showCoins', 'validateInput'];
      const updates = {};

      Object.entries(newSettings).forEach(([key, value]) => {
        if (validSettings.includes(key)) {
          updates[key] = value;
        }
      });

      this.settings = { ...this.settings, ...updates };

      return {
        success: true,
        settings: { ...this.settings },
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        settings: { ...this.settings }
      };
    }
  }
}

// Exportar para uso en navegador y Node.js
if (typeof window !== 'undefined') {
  window.CashCalculator = CashCalculator;
} else if (typeof module !== 'undefined') {
  module.exports = CashCalculator;
}