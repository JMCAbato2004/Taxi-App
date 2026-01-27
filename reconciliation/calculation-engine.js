/**
 * Motor de cálculos para el módulo de conciliación de taxista
 * Implementa toda la lógica de negocio para cálculos de comisiones, distribuciones y totales
 */

class CalculationEngine {
  constructor(settings = null) {
    const defaultSettings = {
      commissionRates: { freenow: 0.15, other: 0.10 },
      distributionRates: { driver: 0.40, owner: 0.60 },
      settlementType: 'percentage', // 'percentage' o 'fixed'
      fixedOwnerAmount: 0 // Monto fijo para el dueño en modo 'fixed'
    };

    let globalSettings = null;
    if (typeof window !== 'undefined' && window.ReconciliationTypes) {
      globalSettings = window.ReconciliationTypes.DEFAULT_RECONCILIATION_SETTINGS;
    }

    this.settings = { ...defaultSettings, ...(settings || globalSettings) };
  }

  calculateCommission(amount, platform = 'other') {
    if (amount < 0) return 0;
    const rate = platform === 'freenow'
      ? this.settings.commissionRates.freenow
      : this.settings.commissionRates.other;
    return Math.round(amount * rate * 100) / 100;
  }

  calculateDistribution(amount, percentage) {
    if (amount < 0 || percentage < 0 || percentage > 1) return 0;
    return Math.round(amount * percentage * 100) / 100;
  }

  calculateDailyTotals(services, expenses, date) {
    const dayServices = services.filter(s =>
      new Date(s.date).toDateString() === date.toDateString()
    );
    const dayExpenses = expenses.filter(e =>
      new Date(e.date).toDateString() === date.toDateString()
    );

    const serviceStart = dayServices.length;
    const totalService = dayServices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const articulated = dayServices.filter(s => s.isArticulated).reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    const cardPayment = dayServices.filter(s => s.paymentType === 'card').reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const appPayment = dayServices.filter(s => s.paymentType === 'app').reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const cashPayment = dayServices.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // Separar gastos por quien los paga
    const expensesShared = dayExpenses.filter(e => !e.paidBy || e.paidBy === 'shared').reduce((sum, e) => sum + (e.amount || 0), 0);
    const expensesDriver = dayExpenses.filter(e => e.paidBy === 'driver').reduce((sum, e) => sum + (e.amount || 0), 0);
    const expensesOwner = dayExpenses.filter(e => e.paidBy === 'owner').reduce((sum, e) => sum + (e.amount || 0), 0);
    const expensesTotal = expensesShared + expensesDriver + expensesOwner;

    // Calcular comisiones por quien las paga
    const freenowServices = dayServices.filter(s => s.platform === 'freenow');
    const freenowTotal = freenowServices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    let commShared = 0, commDriver = 0, commOwner = 0;
    dayServices.forEach(s => {
      const comm = s.commission || (s.platform === 'freenow' ? this.calculateCommission(s.totalAmount || 0, 'freenow') : 0);
      if (comm > 0) {
        if (!s.commissionPaidBy || s.commissionPaidBy === 'shared') commShared += comm;
        else if (s.commissionPaidBy === 'driver') commDriver += comm;
        else if (s.commissionPaidBy === 'owner') commOwner += comm;
      }
    });

    const freenowIncentives = freenowServices.reduce((sum, s) => sum + (s.incentives || 0), 0);
    const freenowTips = freenowServices.reduce((sum, s) => sum + (s.tips || 0), 0);

    // El ingreso neto a distribuir es: Total - Gastos Compartidos - Comisiones Compartidas
    const netIncomeToDistribute = totalService - expensesShared - commShared;
    const grossIncome = totalService;

    return {
      date: date,
      serviceCount: serviceStart,
      totalService: Math.round(totalService * 100) / 100,
      articulated: Math.round(articulated * 100) / 100,
      cardPayment: Math.round(cardPayment * 100) / 100,
      appPayment: Math.round(appPayment * 100) / 100,
      cashPayment: Math.round(cashPayment * 100) / 100,
      expensesTotal: Math.round(expensesTotal * 100) / 100,
      expensesShared: Math.round(expensesShared * 100) / 100,
      expensesDriver: Math.round(expensesDriver * 100) / 100,
      expensesOwner: Math.round(expensesOwner * 100) / 100,
      commShared: Math.round(commShared * 100) / 100,
      commDriver: Math.round(commDriver * 100) / 100,
      commOwner: Math.round(commOwner * 100) / 100,
      netIncomeToDistribute: Math.round(netIncomeToDistribute * 100) / 100,
      grossIncome: Math.round(grossIncome * 100) / 100,
      freenowExtras: Math.round((freenowIncentives + freenowTips) * 100) / 100
    };
  }

  calculatePeriodSummary(dailyTotals, services = []) {
    const summary = dailyTotals.reduce((acc, day) => ({
      totalServices: acc.totalServices + day.serviceCount,
      totalArticulated: acc.totalArticulated + day.articulated,
      totalCard: acc.totalCard + day.cardPayment,
      totalApp: acc.totalApp + day.appPayment,
      totalCash: acc.totalCash + day.cashPayment,
      totalExpenses: acc.totalExpenses + day.expensesTotal,
      expensesShared: acc.expensesShared + day.expensesShared,
      expensesDriver: acc.expensesDriver + day.expensesDriver,
      expensesOwner: acc.expensesOwner + day.expensesOwner,
      commShared: acc.commShared + day.commShared,
      commDriver: acc.commDriver + day.commDriver,
      commOwner: acc.commOwner + day.commOwner,
      netIncome: acc.netIncome + day.netIncomeToDistribute,
      grossIncome: acc.grossIncome + day.grossIncome
    }), {
      totalServices: 0, totalArticulated: 0, totalCard: 0, totalApp: 0, totalCash: 0,
      totalExpenses: 0, expensesShared: 0, expensesDriver: 0, expensesOwner: 0,
      commShared: 0, commDriver: 0, commOwner: 0, netIncome: 0, grossIncome: 0
    });

    summary.freenowExtras = this.calculateFreenowExtras(services);

    Object.keys(summary).forEach(key => {
      if (typeof summary[key] === 'number') summary[key] = Math.round(summary[key] * 100) / 100;
    });

    return summary;
  }

  calculateFinalSettlement(summary, cashBreakdown, services = []) {
    const type = this.settings.settlementType || 'percentage';
    let driverAmount, ownerAmount;

    if (type === 'fixed') {
      // Liquidación fija: El dueño recibe un pago fijo, el taxista paga todo y se queda el resto
      ownerAmount = this.settings.fixedOwnerAmount || 0;
      // Todo corre por cuenta del taxista en este modelo (según petición USER)
      // Pero calculamos el neto real: Bruto - Todos los gastos - Todas las comisiones - Fijo Patrón + Extras
      const allExpenses = summary.totalExpenses;
      const allCommissions = summary.commShared + summary.commDriver + summary.commOwner;
      driverAmount = summary.grossIncome - allExpenses - allCommissions - ownerAmount + summary.freenowExtras;
    } else {
      // Liquidación porcentual (40/60 o similar)
      const ownerBase = this.calculateDistribution(summary.netIncome, this.settings.distributionRates.owner);
      const driverBase = this.calculateDistribution(summary.netIncome, this.settings.distributionRates.driver);

      driverAmount = driverBase - summary.expensesDriver - summary.commDriver + summary.freenowExtras;
      ownerAmount = ownerBase - summary.expensesOwner - summary.commOwner;
    }

    const externalBalance = this.calculateExternalBalance(summary, cashBreakdown, services);

    return {
      driverAmount: Math.round(driverAmount * 100) / 100,
      ownerAmount: Math.round(ownerAmount * 100) / 100,
      externalBalance: Math.round(externalBalance * 100) / 100,
      type,
      summaryDetails: {
        expensesDriver: summary.expensesDriver,
        expensesOwner: summary.expensesOwner,
        commDriver: summary.commDriver,
        commOwner: summary.commOwner,
        freenowExtras: summary.freenowExtras,
        grossIncome: summary.grossIncome
      }
    };
  }

  calculateFreenowExtras(services) {
    if (!services || !Array.isArray(services)) return 0;
    const freenowServices = services.filter(s => s.platform === 'freenow');
    return freenowServices.reduce((sum, s) => sum + (s.incentives || 0) + (s.tips || 0), 0);
  }

  calculateExternalBalance(summary, cashBreakdown, services = []) {
    let balance = 0;
    if (cashBreakdown && cashBreakdown.difference) balance += cashBreakdown.difference;
    return balance;
  }

  calculateCashTotal(bills) {
    if (!bills) return 0;
    const total = (bills.fifty || 0) * 50 + (bills.twenty || 0) * 20 + (bills.ten || 0) * 10 + (bills.five || 0) * 5 + (bills.two || 0) * 2 + (bills.one || 0) * 1 + (bills.cents || 0) * 0.01;
    return Math.round(total * 100) / 100;
  }

  calculateCashDifference(calculatedCash, bills) {
    const billsTotal = this.calculateCashTotal(bills);
    return Math.round((billsTotal - calculatedCash) * 100) / 100;
  }

  generateReconciliation(services, expenses, period, cashBreakdown = null) {
    const periodServices = services.filter(s => {
      const d = new Date(s.date);
      return d >= period.start && d <= period.end;
    });

    const periodExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= period.start && d <= period.end;
    });

    const allDates = new Set();
    periodServices.forEach(s => allDates.add(new Date(s.date).toDateString()));
    periodExpenses.forEach(e => allDates.add(new Date(e.date).toDateString()));

    if (allDates.size === 0) allDates.add(period.start.toDateString());

    const dailyTotals = Array.from(allDates)
      .map(d => new Date(d))
      .sort((a, b) => a - b)
      .map(date => this.calculateDailyTotals(periodServices, periodExpenses, date));

    const summary = this.calculatePeriodSummary(dailyTotals, periodServices);

    let processedCashBreakdown = null;
    if (cashBreakdown) {
      const billsTotal = this.calculateCashTotal(cashBreakdown.bills);
      const calculatedCash = summary.totalCash || 0;
      processedCashBreakdown = {
        bills: cashBreakdown.bills,
        total: billsTotal,
        difference: billsTotal - calculatedCash
      };
    }

    const finalSettlement = this.calculateFinalSettlement(summary, processedCashBreakdown, periodServices);

    return {
      id: `reconciliation_${Date.now()}`,
      period,
      summary,
      finalSettlement,
      createdAt: new Date()
    };
  }
}

if (typeof window !== 'undefined') { window.CalculationEngine = CalculationEngine; }
if (typeof module !== 'undefined' && module.exports) { module.exports = CalculationEngine; }