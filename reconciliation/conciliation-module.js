/**
 * Módulo de Conciliación - Generación de reportes y cálculos
 * Implementa la funcionalidad completa de conciliación de turnos
 */

console.log('📊 Cargando conciliation-module.js');

/**
 * Componente principal de conciliación
 */
function ConciliationModule({ theme, services, expenses, onBack }) {
  const { useState, useEffect, createElement: e } = React;

  // Estados del componente
  const [period, setPeriod] = useState('today');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [conciliationData, setConciliationData] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Estados para configuración de distribución
  const [driverPercentage, setDriverPercentage] = useState(() => {
    const saved = localStorage.getItem('conciliation_driver_percentage');
    return saved ? parseFloat(saved) : 60;
  });
  
  const [ownerPercentage, setOwnerPercentage] = useState(() => {
    const saved = localStorage.getItem('conciliation_owner_percentage');
    return saved ? parseFloat(saved) : 40;
  });

  // Estados para configuración de comisiones y propinas
  const [commissionsTo, setCommissionsTo] = useState(() => {
    const saved = localStorage.getItem('conciliation_commissions_to');
    return saved || 'owner'; // 'owner', 'driver', 'shared'
  });

  const [tipsTo, setTipsTo] = useState(() => {
    const saved = localStorage.getItem('conciliation_tips_to');
    return saved || 'driver'; // 'owner', 'driver', 'shared'
  });

  // Guardar configuración cuando cambie
  useEffect(() => {
    localStorage.setItem('conciliation_driver_percentage', driverPercentage.toString());
    localStorage.setItem('conciliation_owner_percentage', ownerPercentage.toString());
    localStorage.setItem('conciliation_commissions_to', commissionsTo);
    localStorage.setItem('conciliation_tips_to', tipsTo);
  }, [driverPercentage, ownerPercentage, commissionsTo, tipsTo]);

  // Función para ajustar porcentajes automáticamente
  const adjustPercentages = (newDriverPercentage) => {
    const newOwnerPercentage = 100 - newDriverPercentage;
    setDriverPercentage(newDriverPercentage);
    setOwnerPercentage(newOwnerPercentage);
  };

  // Calcular período de fechas
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        return { 
          start: today, 
          end: new Date(today.getTime() + 86400000 - 1) 
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return { 
          start: yesterday, 
          end: new Date(yesterday.getTime() + 86400000 - 1) 
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { start: weekStart, end: now };
      case 'month':
        return { 
          start: new Date(now.getFullYear(), now.getMonth(), 1), 
          end: now 
        };
      case 'custom':
        if (customDateFrom && customDateTo) {
          return {
            start: new Date(customDateFrom),
            end: new Date(customDateTo + 'T23:59:59')
          };
        }
        return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
      default:
        return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    }
  };

  // Calcular conciliación
  useEffect(() => {
    const calculateConciliation = () => {
      const { start, end } = getDateRange();
      
      // Filtrar servicios del período
      const periodServices = services.filter(service => {
        const serviceDate = new Date(service.date);
        return serviceDate >= start && serviceDate <= end;
      });

      // Filtrar gastos del período
      const periodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
      });

      // Calcular totales por tipo de pago
      const servicesByPayment = {
        cash: periodServices.filter(s => s.paymentType === 'cash'),
        card: periodServices.filter(s => s.paymentType === 'card'),
        app: periodServices.filter(s => s.paymentType === 'app')
      };

      const totals = {
        cash: servicesByPayment.cash.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
        card: servicesByPayment.card.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
        app: servicesByPayment.app.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      };

      // Calcular comisiones y propinas de TODOS los servicios (no solo apps)
      const totalCommissions = periodServices.reduce((sum, s) => sum + (s.commission || 0), 0);
      const totalTips = periodServices.reduce((sum, s) => sum + (s.tips || 0), 0);

      // Mantener compatibilidad con cálculos anteriores (solo apps)
      const appCommissions = servicesByPayment.app.reduce((sum, s) => sum + (s.commission || 0), 0);
      const appIncentives = servicesByPayment.app.reduce((sum, s) => sum + (s.incentives || 0), 0);
      const appTips = servicesByPayment.app.reduce((sum, s) => sum + (s.tips || 0), 0);

      // Total de ingresos brutos
      const totalGrossIncome = totals.cash + totals.card + totals.app;

      // Total de gastos
      const totalExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // Calcular distribución de comisiones según configuración
      let driverCommissions = 0;
      let ownerCommissions = 0;
      
      switch (commissionsTo) {
        case 'driver':
          driverCommissions = totalCommissions;
          break;
        case 'owner':
          ownerCommissions = totalCommissions;
          break;
        case 'shared':
          driverCommissions = totalCommissions * (driverPercentage / 100);
          ownerCommissions = totalCommissions * (ownerPercentage / 100);
          break;
      }

      // Calcular distribución de propinas según configuración
      let driverTips = 0;
      let ownerTips = 0;
      
      switch (tipsTo) {
        case 'driver':
          driverTips = totalTips;
          break;
        case 'owner':
          ownerTips = totalTips;
          break;
        case 'shared':
          driverTips = totalTips * (driverPercentage / 100);
          ownerTips = totalTips * (ownerPercentage / 100);
          break;
      }

      // Ingresos base para distribución (sin comisiones ni propinas)
      const baseIncome = totalGrossIncome;

      // El taxista recibe su % del total base + sus comisiones/propinas asignadas
      const driverShare = (baseIncome * (driverPercentage / 100)) - driverCommissions + driverTips;
      
      // El patrón recibe su % del total base + sus comisiones/propinas asignadas - gastos
      const ownerShareBeforeExpenses = (baseIncome * (ownerPercentage / 100)) - ownerCommissions + ownerTips;
      const ownerShare = ownerShareBeforeExpenses - totalExpenses;
      
      // Ingresos netos totales (para estadísticas)
      const netIncome = totalGrossIncome - totalCommissions + totalTips - totalExpenses;

      // Gastos por categoría
      const expensesByCategory = {
        fuel: periodExpenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0),
        maintenance: periodExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
        insurance: periodExpenses.filter(e => e.category === 'insurance').reduce((sum, e) => sum + e.amount, 0),
        other: periodExpenses.filter(e => e.category === 'other').reduce((sum, e) => sum + e.amount, 0)
      };

      // Estadísticas adicionales
      const stats = {
        totalServices: periodServices.length,
        totalExpenses: periodExpenses.length,
        averageServiceAmount: periodServices.length > 0 ? totalGrossIncome / periodServices.length : 0,
        servicesPerDay: periodServices.length / Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))),
        articulatedServices: periodServices.filter(s => s.isArticulated).length
      };

      setConciliationData({
        period: { start, end },
        services: periodServices,
        expenses: periodExpenses,
        servicesByPayment,
        totals,
        appCommissions,
        appIncentives,
        appTips,
        totalGrossIncome,
        totalExpenses,
        totalCommissions,
        totalTips,
        driverCommissions,
        ownerCommissions,
        driverTips,
        ownerTips,
        commissionsTo,
        tipsTo,
        netIncome,
        driverShare,
        ownerShare,
        expensesByCategory,
        stats,
        // Mantener compatibilidad
        appCommissions,
        appIncentives,
        appTips
      });
    };

    calculateConciliation();
  }, [period, customDateFrom, customDateTo, services, expenses, driverPercentage, ownerPercentage, commissionsTo, tipsTo]);

  // Formatear fecha para mostrar
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatear período para mostrar
  const formatPeriod = () => {
    if (!conciliationData) return '';
    
    const { start, end } = conciliationData.period;
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    
    if (startStr === endStr) {
      return startStr;
    }
    return `${startStr} - ${endStr}`;
  };

  if (!conciliationData) {
    return e('div', { className: "flex items-center justify-center py-12" },
      e('div', { className: "text-center" },
        e('div', { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }),
        e('p', { className: "text-gray-600" }, 'Calculando conciliación...')
      )
    );
  }

  return e('div', { className: "space-y-6" },
    // Header con controles de período
    e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
      e('div', { className: "flex justify-between items-start mb-6" },
        e('div', null,
          e('h2', { className: "text-2xl font-bold mb-2" }, '📊 Conciliación de Turno'),
          e('p', { className: theme.textSecondary }, `Período: ${formatPeriod()}`)
        ),
        e('div', { className: "flex gap-2" },
          e('button', {
            onClick: () => setShowSettings(!showSettings),
            className: `px-4 py-2 ${showSettings ? 'bg-blue-600 text-white' : 'text-blue-600 border border-blue-600'} rounded-lg hover:bg-blue-700 hover:text-white transition-colors`
          }, showSettings ? '⚙️ Ocultar Config' : '⚙️ Configurar'),
          e('button', {
            onClick: onBack,
            className: "px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          }, '← Volver')
        )
      ),

      // Selector de período
      e('div', { className: "grid grid-cols-2 md:grid-cols-6 gap-3 mb-4" },
        [
          { id: 'today', label: 'Hoy', icon: '📅' },
          { id: 'yesterday', label: 'Ayer', icon: '📆' },
          { id: 'week', label: 'Esta semana', icon: '📊' },
          { id: 'month', label: 'Este mes', icon: '🗓️' },
          { id: 'custom', label: 'Personalizado', icon: '⚙️' }
        ].map(p =>
          e('button', {
            key: p.id,
            onClick: () => setPeriod(p.id),
            className: `flex flex-col items-center p-3 rounded-lg border transition-all ${
              period === p.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : `border-gray-200 ${theme.card} hover:border-gray-300`
            }`
          },
            e('span', { className: "text-lg mb-1" }, p.icon),
            e('span', { className: "text-xs font-medium" }, p.label)
          )
        )
      ),

      // Fechas personalizadas
      period === 'custom' && e('div', { className: "grid grid-cols-2 gap-4 mt-4" },
        e('div', null,
          e('label', { className: "block text-sm font-medium mb-2" }, 'Fecha desde'),
          e('input', {
            type: 'date',
            value: customDateFrom,
            onChange: (e) => setCustomDateFrom(e.target.value),
            className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`
          })
        ),
        e('div', null,
          e('label', { className: "block text-sm font-medium mb-2" }, 'Fecha hasta'),
          e('input', {
            type: 'date',
            value: customDateTo,
            onChange: (e) => setCustomDateTo(e.target.value),
            className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`
          })
        )
      )
    ),

    // Panel de configuración de distribución
    showSettings && e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border} bg-blue-50 dark:bg-blue-900/20` },
      e('h3', { className: "text-xl font-bold mb-4 flex items-center gap-2" }, 
        e('span', null, '⚙️'), 
        'Configuración de Distribución'
      ),
      e('div', { className: "space-y-4" },
        e('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          // Porcentaje del taxista
          e('div', { className: "space-y-2" },
            e('label', { className: "block text-sm font-medium" }, 
              `🚕 Porcentaje del Taxista: ${driverPercentage}%`
            ),
            e('input', {
              type: 'range',
              min: '0',
              max: '100',
              value: driverPercentage,
              onChange: (e) => adjustPercentages(parseFloat(e.target.value)),
              className: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
            }),
            e('div', { className: "text-xs text-gray-600" }, 
              `Cantidad: ${conciliationData ? conciliationData.driverShare.toFixed(2) : '0.00'}€`
            )
          ),
          
          // Porcentaje del patrón
          e('div', { className: "space-y-2" },
            e('label', { className: "block text-sm font-medium" }, 
              `👤 Porcentaje del Patrón: ${ownerPercentage}%`
            ),
            e('input', {
              type: 'range',
              min: '0',
              max: '100',
              value: ownerPercentage,
              onChange: (e) => adjustPercentages(100 - parseFloat(e.target.value)),
              className: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
            }),
            e('div', { className: "text-xs text-gray-600" }, 
              `Cantidad: ${conciliationData ? conciliationData.ownerShare.toFixed(2) : '0.00'}€ (después de gastos)`
            )
          )
        ),
        
        // Botones de configuración rápida
        e('div', { className: "flex flex-wrap gap-2 pt-4 border-t border-gray-200" },
          e('h4', { className: "w-full text-sm font-medium mb-2" }, 'Configuraciones Rápidas:'),
          [
            { label: '50/50', driver: 50, owner: 50 },
            { label: '60/40', driver: 60, owner: 40 },
            { label: '70/30', driver: 70, owner: 30 },
            { label: '80/20', driver: 80, owner: 20 }
          ].map(config => 
            e('button', {
              key: config.label,
              onClick: () => adjustPercentages(config.driver),
              className: `px-3 py-1 text-xs rounded-lg border transition-colors ${
                driverPercentage === config.driver 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`
            }, config.label)
          )
        ),
        
        // Validación
        e('div', { className: "text-xs text-gray-600 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg" },
          e('div', { className: "flex items-center gap-2" },
            e('span', null, '✅'),
            `Total: ${driverPercentage + ownerPercentage}% ${driverPercentage + ownerPercentage === 100 ? '(Correcto)' : '(¡Debe sumar 100%!)'}`
          )
        ),

        // Configuración de comisiones y propinas
        e('div', { className: "pt-4 border-t border-gray-200" },
          e('h4', { className: "text-lg font-medium mb-4" }, '💰 Distribución de Comisiones y Propinas'),
          
          e('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
            // Configuración de comisiones
            e('div', { className: "space-y-3" },
              e('label', { className: "block text-sm font-medium" }, '📉 Las comisiones van para:'),
              e('div', { className: "space-y-2" },
                ['owner', 'driver', 'shared'].map(option => {
                  const labels = {
                    owner: '👤 Patrón',
                    driver: '🚕 Taxista', 
                    shared: '⚖️ Compartidas'
                  };
                  return e('label', {
                    key: option,
                    className: "flex items-center gap-2 cursor-pointer"
                  },
                    e('input', {
                      type: 'radio',
                      name: 'commissions',
                      value: option,
                      checked: commissionsTo === option,
                      onChange: (e) => setCommissionsTo(e.target.value),
                      className: 'text-blue-600'
                    }),
                    e('span', { className: "text-sm" }, labels[option])
                  );
                })
              ),
              conciliationData.totalCommissions > 0 && e('div', { className: "text-xs text-gray-600 bg-red-50 p-2 rounded" },
                `Total comisiones: ${conciliationData.totalCommissions.toFixed(2)}€`
              )
            ),

            // Configuración de propinas
            e('div', { className: "space-y-3" },
              e('label', { className: "block text-sm font-medium" }, '📈 Las propinas van para:'),
              e('div', { className: "space-y-2" },
                ['driver', 'owner', 'shared'].map(option => {
                  const labels = {
                    owner: '👤 Patrón',
                    driver: '🚕 Taxista',
                    shared: '⚖️ Compartidas'
                  };
                  return e('label', {
                    key: option,
                    className: "flex items-center gap-2 cursor-pointer"
                  },
                    e('input', {
                      type: 'radio',
                      name: 'tips',
                      value: option,
                      checked: tipsTo === option,
                      onChange: (e) => setTipsTo(e.target.value),
                      className: 'text-green-600'
                    }),
                    e('span', { className: "text-sm" }, labels[option])
                  );
                })
              ),
              conciliationData.totalTips > 0 && e('div', { className: "text-xs text-gray-600 bg-green-50 p-2 rounded" },
                `Total propinas: ${conciliationData.totalTips.toFixed(2)}€`
              )
            )
          )
        )
      )
    ),

    // Resumen principal
    e('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-6" },
      // Ingresos brutos
      e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
        e('div', { className: "flex items-center justify-between mb-4" },
          e('h3', { className: "font-semibold text-gray-700" }, 'Ingresos Brutos'),
          e('span', { className: "text-2xl" }, '💰')
        ),
        e('div', { className: "text-3xl font-bold text-green-600 mb-2" }, 
          `${conciliationData.totalGrossIncome.toFixed(2)}€`
        ),
        e('div', { className: "text-sm text-gray-600" },
          `${conciliationData.stats.totalServices} servicios`
        )
      ),

      // Gastos
      e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
        e('div', { className: "flex items-center justify-between mb-4" },
          e('h3', { className: "font-semibold text-gray-700" }, 'Gastos'),
          e('span', { className: "text-2xl" }, '💸')
        ),
        e('div', { className: "text-3xl font-bold text-red-600 mb-2" }, 
          `${conciliationData.totalExpenses.toFixed(2)}€`
        ),
        e('div', { className: "text-sm text-gray-600" },
          `${conciliationData.stats.totalExpenses} gastos`
        )
      ),

      // Ingresos netos
      e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
        e('div', { className: "flex items-center justify-between mb-4" },
          e('h3', { className: "font-semibold text-gray-700" }, 'Ingresos Brutos Netos'),
          e('span', { className: "text-2xl" }, '📈')
        ),
        e('div', { className: "text-3xl font-bold text-blue-600 mb-2" }, 
          `${(conciliationData.totalGrossIncome - conciliationData.appCommissions + conciliationData.appIncentives + conciliationData.appTips).toFixed(2)}€`
        ),
        e('div', { className: "text-sm text-gray-600" },
          'Antes de distribución y gastos'
        ),
        (conciliationData.totalCommissions > 0 || conciliationData.totalTips > 0) && e('div', { className: "text-xs text-gray-500 mt-1" },
          conciliationData.totalCommissions > 0 && `Comisiones: -${conciliationData.totalCommissions.toFixed(2)}€`,
          (conciliationData.totalCommissions > 0 && conciliationData.totalTips > 0) && ' | ',
          conciliationData.totalTips > 0 && `Propinas: +${conciliationData.totalTips.toFixed(2)}€`
        )
      ),

      // Promedio por servicio
      e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
        e('div', { className: "flex items-center justify-between mb-4" },
          e('h3', { className: "font-semibold text-gray-700" }, 'Promedio/Servicio'),
          e('span', { className: "text-2xl" }, '📊')
        ),
        e('div', { className: "text-3xl font-bold text-purple-600 mb-2" }, 
          `${conciliationData.stats.averageServiceAmount.toFixed(2)}€`
        ),
        e('div', { className: "text-sm text-gray-600" },
          `${conciliationData.stats.servicesPerDay.toFixed(1)} servicios/día`
        )
      )
    ),

    // Distribución configurable
    e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
      e('h3', { className: "text-xl font-bold mb-4" }, `⚖️ Distribución ${driverPercentage}/${ownerPercentage}`),
      e('div', { className: "mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200" },
        e('div', { className: "flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200" },
          e('span', null, '💡'),
          e('div', null,
            e('div', { className: "font-medium" }, 'Distribución configurada:'),
            e('div', { className: "text-xs mt-1" },
              `Comisiones → ${commissionsTo === 'owner' ? 'Patrón' : commissionsTo === 'driver' ? 'Taxista' : 'Compartidas'} | `,
              `Propinas → ${tipsTo === 'owner' ? 'Patrón' : tipsTo === 'driver' ? 'Taxista' : 'Compartidas'}`
            )
          )
        )
      ),
      e('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
        // Parte del taxista
        e('div', { className: "bg-green-50 rounded-lg p-4 border border-green-200" },
          e('div', { className: "flex items-center gap-3 mb-3" },
            e('span', { className: "text-2xl" }, '🚕'),
            e('h4', { className: "font-semibold text-green-800" }, `Taxista (${driverPercentage}%)`)
          ),
          e('div', { className: "text-2xl font-bold text-green-700 mb-2" },
            `${conciliationData.driverShare.toFixed(2)}€`
          ),
          e('div', { className: "text-sm text-green-600" },
            `${driverPercentage}% base + comisiones/propinas asignadas`
          ),
          e('div', { className: "text-xs text-green-500 mt-1 space-y-1" },
            e('div', null, `Base: ${driverPercentage}% × ${conciliationData.totalGrossIncome.toFixed(2)}€ = ${(conciliationData.totalGrossIncome * (driverPercentage / 100)).toFixed(2)}€`),
            conciliationData.driverCommissions > 0 && e('div', null, `Comisiones: -${conciliationData.driverCommissions.toFixed(2)}€`),
            conciliationData.driverTips > 0 && e('div', null, `Propinas: +${conciliationData.driverTips.toFixed(2)}€`)
          )
        ),

        // Parte del patrón
        e('div', { className: "bg-blue-50 rounded-lg p-4 border border-blue-200" },
          e('div', { className: "flex items-center gap-3 mb-3" },
            e('span', { className: "text-2xl" }, '👤'),
            e('h4', { className: "font-semibold text-blue-800" }, `Patrón (${ownerPercentage}%)`)
          ),
          e('div', { className: "text-2xl font-bold text-blue-700 mb-2" },
            `${conciliationData.ownerShare.toFixed(2)}€`
          ),
          e('div', { className: "text-sm text-blue-600" },
            `${ownerPercentage}% base + comisiones/propinas - gastos`
          ),
          e('div', { className: "text-xs text-blue-500 mt-1 space-y-1" },
            e('div', null, `Base: ${ownerPercentage}% × ${conciliationData.totalGrossIncome.toFixed(2)}€ = ${(conciliationData.totalGrossIncome * (ownerPercentage / 100)).toFixed(2)}€`),
            conciliationData.ownerCommissions > 0 && e('div', null, `Comisiones: -${conciliationData.ownerCommissions.toFixed(2)}€`),
            conciliationData.ownerTips > 0 && e('div', null, `Propinas: +${conciliationData.ownerTips.toFixed(2)}€`),
            e('div', null, `Gastos: -${conciliationData.totalExpenses.toFixed(2)}€`)
          )
        )
      )
    ),

    // Desglose por tipo de pago
    e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
      e('div', { className: "flex justify-between items-center mb-4" },
        e('h3', { className: "text-xl font-bold" }, '💳 Desglose por Tipo de Pago'),
        e('button', {
          onClick: () => setShowBreakdown(!showBreakdown),
          className: "text-blue-600 hover:text-blue-800 font-medium"
        }, showBreakdown ? 'Ocultar detalles' : 'Ver detalles')
      ),
      
      e('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        // Efectivo
        e('div', { className: "bg-green-50 rounded-lg p-4 border border-green-200" },
          e('div', { className: "flex items-center gap-2 mb-2" },
            e('span', { className: "text-xl" }, '💵'),
            e('h4', { className: "font-semibold" }, 'Efectivo')
          ),
          e('div', { className: "text-xl font-bold text-green-700" },
            `${conciliationData.totals.cash.toFixed(2)}€`
          ),
          e('div', { className: "text-sm text-gray-600" },
            `${conciliationData.servicesByPayment.cash.length} servicios`
          )
        ),

        // Tarjeta
        e('div', { className: "bg-blue-50 rounded-lg p-4 border border-blue-200" },
          e('div', { className: "flex items-center gap-2 mb-2" },
            e('span', { className: "text-xl" }, '💳'),
            e('h4', { className: "font-semibold" }, 'Tarjeta')
          ),
          e('div', { className: "text-xl font-bold text-blue-700" },
            `${conciliationData.totals.card.toFixed(2)}€`
          ),
          e('div', { className: "text-sm text-gray-600" },
            `${conciliationData.servicesByPayment.card.length} servicios`
          )
        ),

        // Aplicación
        e('div', { className: "bg-purple-50 rounded-lg p-4 border border-purple-200" },
          e('div', { className: "flex items-center gap-2 mb-2" },
            e('span', { className: "text-xl" }, '📱'),
            e('h4', { className: "font-semibold" }, 'Aplicación')
          ),
          e('div', { className: "text-xl font-bold text-purple-700" },
            `${conciliationData.totals.app.toFixed(2)}€`
          ),
          e('div', { className: "text-sm text-gray-600" },
            `${conciliationData.servicesByPayment.app.length} servicios`
          ),
          conciliationData.appCommissions > 0 && e('div', { className: "text-xs text-red-600 mt-1" },
            `Comisiones: -${conciliationData.appCommissions.toFixed(2)}€`
          )
        )
      ),

      // Detalles adicionales de apps
      showBreakdown && conciliationData.servicesByPayment.app.length > 0 && e('div', { className: "mt-4 pt-4 border-t border-gray-200" },
        e('h4', { className: "font-semibold mb-3" }, 'Detalles de Aplicaciones'),
        e('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" },
          e('div', { className: "bg-red-50 rounded-lg p-3" },
            e('div', { className: "font-medium text-red-800" }, 'Comisiones'),
            e('div', { className: "text-lg font-bold text-red-700" }, 
              `-${conciliationData.appCommissions.toFixed(2)}€`
            )
          ),
          e('div', { className: "bg-green-50 rounded-lg p-3" },
            e('div', { className: "font-medium text-green-800" }, 'Incentivos'),
            e('div', { className: "text-lg font-bold text-green-700" }, 
              `+${conciliationData.appIncentives.toFixed(2)}€`
            )
          ),
          e('div', { className: "bg-yellow-50 rounded-lg p-3" },
            e('div', { className: "font-medium text-yellow-800" }, 'Propinas'),
            e('div', { className: "text-lg font-bold text-yellow-700" }, 
              `+${conciliationData.appTips.toFixed(2)}€`
            )
          )
        )
      )
    ),

    // Resumen de comisiones y propinas totales
    (conciliationData.totalCommissions > 0 || conciliationData.totalTips > 0) && e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
      e('h3', { className: "text-xl font-bold mb-4" }, '💰 Distribución de Comisiones y Propinas'),
      e('div', { className: "space-y-4" },
        // Comisiones
        conciliationData.totalCommissions > 0 && e('div', { className: "bg-red-50 rounded-lg p-4 border border-red-200" },
          e('div', { className: "flex items-center justify-between mb-3" },
            e('div', { className: "flex items-center gap-2" },
              e('span', { className: "text-xl" }, '📉'),
              e('h4', { className: "font-semibold text-red-800" }, 'Comisiones Totales')
            ),
            e('div', { className: "text-lg font-bold text-red-700" },
              `${conciliationData.totalCommissions.toFixed(2)}€`
            )
          ),
          e('div', { className: "grid grid-cols-2 gap-4 text-sm" },
            e('div', null,
              e('div', { className: "font-medium" }, '🚕 Taxista'),
              e('div', { className: "text-red-600" }, `-${conciliationData.driverCommissions.toFixed(2)}€`)
            ),
            e('div', null,
              e('div', { className: "font-medium" }, '👤 Patrón'),
              e('div', { className: "text-red-600" }, `-${conciliationData.ownerCommissions.toFixed(2)}€`)
            )
          )
        ),
        
        // Propinas
        conciliationData.totalTips > 0 && e('div', { className: "bg-green-50 rounded-lg p-4 border border-green-200" },
          e('div', { className: "flex items-center justify-between mb-3" },
            e('div', { className: "flex items-center gap-2" },
              e('span', { className: "text-xl" }, '📈'),
              e('h4', { className: "font-semibold text-green-800" }, 'Propinas Totales')
            ),
            e('div', { className: "text-lg font-bold text-green-700" },
              `${conciliationData.totalTips.toFixed(2)}€`
            )
          ),
          e('div', { className: "grid grid-cols-2 gap-4 text-sm" },
            e('div', null,
              e('div', { className: "font-medium" }, '🚕 Taxista'),
              e('div', { className: "text-green-600" }, `+${conciliationData.driverTips.toFixed(2)}€`)
            ),
            e('div', null,
              e('div', { className: "font-medium" }, '👤 Patrón'),
              e('div', { className: "text-green-600" }, `+${conciliationData.ownerTips.toFixed(2)}€`)
            )
          )
        )
      )
    ),

    // Desglose de gastos por categoría
    conciliationData.totalExpenses > 0 && e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
      e('h3', { className: "text-xl font-bold mb-4" }, '💸 Gastos por Categoría'),
      e('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
        Object.entries(conciliationData.expensesByCategory).map(([category, amount]) => {
          if (amount === 0) return null;
          
          const categoryInfo = {
            fuel: { icon: '⛽', name: 'Combustible', color: 'yellow' },
            maintenance: { icon: '🔧', name: 'Mantenimiento', color: 'blue' },
            insurance: { icon: '🛡️', name: 'Seguro', color: 'green' },
            other: { icon: '📋', name: 'Otros', color: 'gray' }
          };

          const info = categoryInfo[category];
          if (!info) return null;

          return e('div', {
            key: category,
            className: `bg-${info.color}-50 rounded-lg p-4 border border-${info.color}-200`
          },
            e('div', { className: "flex items-center gap-2 mb-2" },
              e('span', { className: "text-lg" }, info.icon),
              e('h4', { className: "font-semibold text-sm" }, info.name)
            ),
            e('div', { className: `text-lg font-bold text-${info.color}-700` },
              `${amount.toFixed(2)}€`
            ),
            e('div', { className: "text-xs text-gray-600" },
              `${((amount / conciliationData.totalExpenses) * 100).toFixed(1)}%`
            )
          );
        })
      )
    )
  );
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ConciliationModule = ConciliationModule;
  console.log('✅ ConciliationModule exportado globalmente');
}

console.log('📊 conciliation-module.js cargado completamente');