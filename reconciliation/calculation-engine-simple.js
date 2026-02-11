/**
 * Motor de cálculos simplificado para diagnóstico
 */

console.log('📄 Cargando calculation-engine-simple.js');

class CalculationEngineSimple {
  constructor(settings = null) {
    console.log('🔧 CalculationEngineSimple constructor llamado');
    this.settings = {
      commissionRates: { freenow: 0.15, other: 0.10 },
      distributionRates: { driver: 0.40, owner: 0.60 }
    };
    console.log('✅ CalculationEngineSimple inicializado');
  }

  calculateCommission(amount, platform = 'other') {
    const rate = platform === 'freenow' ? 0.15 : 0.10;
    return Math.round(amount * rate * 100) / 100;
  }

  calculateDistribution(amount, percentage) {
    return Math.round(amount * percentage * 100) / 100;
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.CalculationEngine = CalculationEngineSimple;
  console.log('✅ CalculationEngineSimple exportado como CalculationEngine');
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculationEngineSimple;
}

console.log('📄 calculation-engine-simple.js cargado completamente');