/**
 * ValidationSystem Simplificado - Versión mínima para depuración
 * Implementa validaciones básicas del sistema
 */

console.log('📄 Cargando validation-system-simple.js');

/**
 * Sistema de validaciones simplificado
 */
class ValidationSystemSimple {
  constructor() {
    this.errorTypes = {
      REQUIRED_FIELD: 'required_field',
      INVALID_TYPE: 'invalid_type',
      NEGATIVE_AMOUNT: 'negative_amount',
      INVALID_DATE: 'invalid_date'
    };

    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  /**
   * Valida un servicio básico
   */
  validateService(service) {
    const result = this.createValidationResult();
    
    if (!service || typeof service !== 'object') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'El servicio debe ser un objeto válido', this.severityLevels.CRITICAL);
      return this.finalizeValidationResult(result);
    }

    // Validar campos obligatorios básicos
    if (!service.date) {
      this.addError(result, this.errorTypes.REQUIRED_FIELD, 'La fecha es obligatoria', this.severityLevels.HIGH);
    }

    if (!service.totalAmount && service.totalAmount !== 0) {
      this.addError(result, this.errorTypes.REQUIRED_FIELD, 'El importe es obligatorio', this.severityLevels.HIGH);
    }

    if (!service.paymentType) {
      this.addError(result, this.errorTypes.REQUIRED_FIELD, 'El tipo de pago es obligatorio', this.severityLevels.HIGH);
    }

    // Validar tipos básicos
    if (service.totalAmount !== undefined && typeof service.totalAmount !== 'number') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'El importe debe ser un número', this.severityLevels.MEDIUM);
    }

    // Validar montos negativos
    if (typeof service.totalAmount === 'number' && service.totalAmount < 0) {
      this.addError(result, this.errorTypes.NEGATIVE_AMOUNT, 'El importe no puede ser negativo', this.severityLevels.HIGH);
    }

    // Validar fecha
    if (service.date) {
      const date = new Date(service.date);
      if (isNaN(date.getTime())) {
        this.addError(result, this.errorTypes.INVALID_DATE, 'La fecha es inválida', this.severityLevels.HIGH);
      }
    }

    return this.finalizeValidationResult(result);
  }

  /**
   * Valida un gasto básico
   */
  validateExpense(expense) {
    const result = this.createValidationResult();
    
    if (!expense || typeof expense !== 'object') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'El gasto debe ser un objeto válido', this.severityLevels.CRITICAL);
      return this.finalizeValidationResult(result);
    }

    // Validar campos obligatorios básicos
    if (!expense.date) {
      this.addError(result, this.errorTypes.REQUIRED_FIELD, 'La fecha es obligatoria', this.severityLevels.HIGH);
    }

    if (!expense.concept) {
      this.addError(result, this.errorTypes.REQUIRED_FIELD, 'El concepto es obligatorio', this.severityLevels.HIGH);
    }

    if (!expense.amount && expense.amount !== 0) {
      this.addError(result, this.errorTypes.REQUIRED_FIELD, 'El importe es obligatorio', this.severityLevels.HIGH);
    }

    if (!expense.category) {
      this.addError(result, this.errorTypes.REQUIRED_FIELD, 'La categoría es obligatoria', this.severityLevels.HIGH);
    }

    // Validar tipos básicos
    if (expense.amount !== undefined && typeof expense.amount !== 'number') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'El importe debe ser un número', this.severityLevels.MEDIUM);
    }

    // Validar montos negativos
    if (typeof expense.amount === 'number' && expense.amount < 0) {
      this.addError(result, this.errorTypes.NEGATIVE_AMOUNT, 'El importe no puede ser negativo', this.severityLevels.HIGH);
    }

    // Validar fecha
    if (expense.date) {
      const date = new Date(expense.date);
      if (isNaN(date.getTime())) {
        this.addError(result, this.errorTypes.INVALID_DATE, 'La fecha es inválida', this.severityLevels.HIGH);
      }
    }

    return this.finalizeValidationResult(result);
  }

  /**
   * Valida una conciliación básica
   */
  validateReconciliation(reconciliation) {
    const result = this.createValidationResult();
    
    if (!reconciliation || typeof reconciliation !== 'object') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'La conciliación debe ser un objeto válido', this.severityLevels.CRITICAL);
      return this.finalizeValidationResult(result);
    }

    // Validar estructura básica
    if (!reconciliation.period) {
      this.addError(result, this.errorTypes.REQUIRED_FIELD, 'El período es obligatorio', this.severityLevels.HIGH);
    }

    if (!Array.isArray(reconciliation.services)) {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'Los servicios deben ser un array', this.severityLevels.MEDIUM);
    }

    if (!Array.isArray(reconciliation.expenses)) {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'Los gastos deben ser un array', this.severityLevels.MEDIUM);
    }

    return this.finalizeValidationResult(result);
  }

  /**
   * Detecta inconsistencias básicas
   */
  detectInconsistencies(systemData) {
    const result = this.createValidationResult();

    if (!systemData || typeof systemData !== 'object') {
      this.addError(result, this.errorTypes.INVALID_TYPE, 'Los datos del sistema deben ser un objeto válido', this.severityLevels.CRITICAL);
      return this.finalizeValidationResult(result);
    }

    // Validar que existan las estructuras básicas
    if (!Array.isArray(systemData.services)) {
      this.addWarning(result, this.errorTypes.INVALID_TYPE, 'No se encontraron servicios en el sistema');
    }

    if (!Array.isArray(systemData.expenses)) {
      this.addWarning(result, this.errorTypes.INVALID_TYPE, 'No se encontraron gastos en el sistema');
    }

    if (!Array.isArray(systemData.reconciliations)) {
      this.addWarning(result, this.errorTypes.INVALID_TYPE, 'No se encontraron conciliaciones en el sistema');
    }

    return this.finalizeValidationResult(result);
  }

  /**
   * Crea un resultado de validación vacío
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
   * Agrega un error al resultado
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
   * Agrega una advertencia al resultado
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
   * Agrega información al resultado
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
   */
  finalizeValidationResult(result) {
    result.completedAt = new Date().toISOString();
    result.hasErrors = result.errors.length > 0;
    result.hasWarnings = result.warnings.length > 0;
    result.hasCriticalErrors = result.summary.criticalErrors > 0;
    
    return result;
  }

  /**
   * Formatea el resultado para mostrar
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

    return output.join('\n');
  }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ValidationSystemSimple = ValidationSystemSimple;
  console.log('✅ ValidationSystemSimple exportado globalmente');
}

console.log('📄 validation-system-simple.js cargado completamente');