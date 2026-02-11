/**
 * Tipos de datos para el módulo de conciliación de taxista
 * Definiciones TypeScript convertidas a JSDoc para compatibilidad con React puro
 */

/**
 * @typedef {Object} Service
 * @property {string} id - Identificador único del servicio
 * @property {Date} date - Fecha del servicio
 * @property {string} startTime - Hora de inicio del servicio
 * @property {number} totalAmount - Monto total del servicio
 * @property {'cash'|'card'|'app'} paymentType - Tipo de pago
 * @property {'freenow'|'other'} [platform] - Plataforma utilizada (opcional)
 * @property {boolean} isArticulated - Si es un servicio articulado
 * @property {number} [commission] - Comisión aplicada (opcional)
 * @property {number} [incentives] - Incentivos recibidos (opcional)
 * @property {number} [tips] - Propinas recibidas (opcional)
 */

/**
 * @typedef {Object} Expense
 * @property {string} id - Identificador único del gasto
 * @property {Date} date - Fecha del gasto
 * @property {string} concept - Concepto del gasto
 * @property {number} amount - Monto del gasto
 * @property {'fuel'|'maintenance'|'insurance'|'other'} category - Categoría del gasto
 */

/**
 * @typedef {Object} DateRange
 * @property {Date} start - Fecha de inicio del período
 * @property {Date} end - Fecha de fin del período
 */

/**
 * @typedef {Object} DailyTotal
 * @property {Date} date - Fecha del día
 * @property {number} serviceStart - Número de servicios iniciados
 * @property {number} totalService - Total de servicios
 * @property {number} articulated - Total de servicios articulados
 * @property {number} cardPayment - Total de pagos con tarjeta
 * @property {number} appPayment - Total de pagos por aplicación
 * @property {number} cashPayment - Total de pagos en efectivo
 * @property {number} expenses - Total de gastos
 * @property {number} freenowTotal - Total bruto de Freenow
 * @property {number} freenowCommission - Comisión de Freenow
 * @property {number} freenowNet - Total neto de Freenow
 * @property {number} distribution60 - Distribución 60% (patrón)
 * @property {number} distribution40 - Distribución 40% (taxista)
 * @property {number} netCash - Efectivo neto
 * @property {number} netFreenow - Freenow neto
 */

/**
 * @typedef {Object} ReconciliationSummary
 * @property {number} totalServices - Total de servicios
 * @property {number} totalArticulated - Total de servicios articulados
 * @property {number} totalCard - Total de pagos con tarjeta
 * @property {number} totalApp - Total de pagos por aplicación
 * @property {number} totalCash - Total de pagos en efectivo
 * @property {number} totalExpenses - Total de gastos
 * @property {number} totalFreenow - Total bruto de Freenow
 * @property {number} totalCommission - Total de comisiones
 * @property {number} netIncome - Ingresos netos
 * @property {number} [freenowExtras] - Extras de Freenow (incentivos + propinas)
 */

/**
 * @typedef {Object} BillCount
 * @property {number} fifty - Billetes de 50€
 * @property {number} twenty - Billetes de 20€
 * @property {number} ten - Billetes de 10€
 * @property {number} five - Billetes de 5€
 * @property {number} two - Monedas de 2€
 * @property {number} one - Monedas de 1€
 * @property {number} cents - Céntimos
 */

/**
 * @typedef {Object} CashBreakdown
 * @property {BillCount} bills - Desglose de billetes y monedas
 * @property {number} total - Total calculado
 * @property {number} difference - Diferencia con el efectivo calculado
 */

/**
 * @typedef {Object} FinalSettlement
 * @property {number} driverAmount - Cantidad para el taxista
 * @property {number} ownerAmount - Cantidad para el patrón
 * @property {number} externalBalance - Saldo para el exterior
 * @property {number} freenowExtras - Extras de Freenow (incentivos + propinas)
 */

/**
 * @typedef {Object} ReconciliationData
 * @property {string} id - Identificador único de la conciliación
 * @property {DateRange} period - Período de la conciliación
 * @property {Service[]} services - Servicios incluidos
 * @property {Expense[]} expenses - Gastos incluidos
 * @property {DailyTotal[]} dailyTotals - Totales diarios
 * @property {ReconciliationSummary} summary - Resumen de la conciliación
 * @property {CashBreakdown} cashBreakdown - Desglose de efectivo
 * @property {FinalSettlement} finalSettlement - Liquidación final
 * @property {Date} createdAt - Fecha de creación
 */

/**
 * @typedef {Object} CommissionRates
 * @property {number} freenow - Porcentaje de comisión Freenow
 * @property {number} other - Porcentaje para otras plataformas
 */

/**
 * @typedef {Object} DistributionRates
 * @property {number} driver - Porcentaje para el taxista (40%)
 * @property {number} owner - Porcentaje para el patrón (60%)
 */

/**
 * @typedef {Object} CompanyInfo
 * @property {string} name - Nombre de la empresa
 * @property {string} taxId - NIF/CIF
 * @property {string} address - Dirección
 * @property {string} phone - Teléfono
 * @property {string} email - Email
 */

/**
 * @typedef {Object} ReconciliationSettings
 * @property {CommissionRates} commissionRates - Tasas de comisión
 * @property {DistributionRates} distributionRates - Tasas de distribución
 * @property {string} defaultCurrency - Moneda por defecto
 * @property {string} dateFormat - Formato de fecha
 * @property {CompanyInfo} companyInfo - Información de la empresa
 */

/**
 * @typedef {Object} ReconciliationStorage
 * @property {Service[]} services - Servicios almacenados
 * @property {Expense[]} expenses - Gastos almacenados
 * @property {ReconciliationData[]} reconciliations - Conciliaciones almacenadas
 * @property {ReconciliationSettings} settings - Configuración
 */

/**
 * @typedef {Object} ValidationRules
 * @property {Object} service - Reglas para servicios
 * @property {Object} service.totalAmount - Reglas para el monto total
 * @property {number} service.totalAmount.min - Monto mínimo
 * @property {number} service.totalAmount.max - Monto máximo
 * @property {Object} service.date - Reglas para la fecha
 * @property {boolean} service.date.required - Si es requerida
 * @property {string} service.date.format - Formato esperado
 * @property {Object} service.paymentType - Reglas para tipo de pago
 * @property {boolean} service.paymentType.required - Si es requerido
 * @property {string[]} service.paymentType.enum - Valores permitidos
 * @property {Object} expense - Reglas para gastos
 * @property {Object} expense.amount - Reglas para el monto
 * @property {number} expense.amount.min - Monto mínimo
 * @property {number} expense.amount.max - Monto máximo
 * @property {Object} expense.concept - Reglas para el concepto
 * @property {boolean} expense.concept.required - Si es requerido
 * @property {number} expense.concept.minLength - Longitud mínima
 * @property {number} expense.concept.maxLength - Longitud máxima
 * @property {Object} expense.date - Reglas para la fecha
 * @property {boolean} expense.date.required - Si es requerida
 * @property {string} expense.date.format - Formato esperado
 * @property {Object} cashBreakdown - Reglas para desglose de efectivo
 * @property {Object} cashBreakdown.bills - Reglas para billetes
 * @property {number} cashBreakdown.bills.min - Cantidad mínima
 * @property {number} cashBreakdown.bills.max - Cantidad máxima
 * @property {Object} cashBreakdown.total - Reglas para el total
 * @property {boolean} cashBreakdown.total.calculated - Si es calculado
 */

// Configuración por defecto
const DEFAULT_RECONCILIATION_SETTINGS = {
  commissionRates: {
    freenow: 0.15, // 15% de comisión para Freenow
    other: 0.10    // 10% para otras plataformas
  },
  distributionRates: {
    driver: 0.40,  // 40% para el taxista
    owner: 0.60    // 60% para el patrón
  },
  defaultCurrency: '€',
  dateFormat: 'DD/MM/YYYY',
  companyInfo: {
    name: '',
    taxId: '',
    address: '',
    phone: '',
    email: ''
  }
};

// Reglas de validación por defecto
const DEFAULT_VALIDATION_RULES = {
  service: {
    totalAmount: { min: 0, max: 1000 },
    date: { required: true, format: 'YYYY-MM-DD' },
    paymentType: { required: true, enum: ['cash', 'card', 'app'] }
  },
  expense: {
    amount: { min: 0, max: 10000 },
    concept: { required: true, minLength: 3, maxLength: 100 },
    date: { required: true, format: 'YYYY-MM-DD' }
  },
  cashBreakdown: {
    bills: { min: 0, max: 1000 },
    total: { calculated: true }
  }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ReconciliationTypes = {
    DEFAULT_RECONCILIATION_SETTINGS,
    DEFAULT_VALIDATION_RULES
  };
}