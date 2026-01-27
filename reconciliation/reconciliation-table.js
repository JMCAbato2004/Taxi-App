/**
 * Componente ReconciliationTable para mostrar tabla detallada de conciliación
 * Implementa tabla responsiva con todas las columnas, totales diarios y generales
 * 
 * Tarea 11.2: Crear tabla de conciliación (ReconciliationTable)
 * Requerimientos: 7.1, 7.2, 7.3
 */

/**
 * Componente principal de la tabla de conciliación
 */
function ReconciliationTable({ theme, reconciliation, onSave, onExport }) {
  const { useState, createElement: e } = React;

  const [viewMode, setViewMode] = useState('detailed'); // 'detailed', 'summary', 'mobile'
  const [expandedSections, setExpandedSections] = useState({
    dailyTotals: true,
    summary: true,
    settlement: true,
    cashBreakdown: true
  });

  // Función para alternar secciones expandidas
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Función para formatear fechas
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    // Asegurarse de que amount sea un número antes de usar toFixed
    const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `${num.toFixed(2)}€`;
  };

  // Verificar si hay datos de conciliación
  if (!reconciliation || !reconciliation.dailyTotals) {
    return e('div', { className: `${theme.card} rounded-xl p-8 border ${theme.border} text-center` },
      e('div', { className: "text-4xl mb-4" }, '📊'),
      e('h3', { className: "text-lg font-semibold mb-2" }, 'Sin datos de conciliación'),
      e('p', { className: theme.textSecondary }, 'Selecciona un período para generar la conciliación')
    );
  }

  return e('div', { className: "space-y-6" },
    
    // Header con controles
    e('div', { className: `${theme.card} rounded-xl p-4 border ${theme.border}` },
      e('div', { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4" },
        
        // Título y período
        e('div', null,
          e('h2', { className: "text-xl font-bold mb-1" }, '📊 Tabla de Conciliación'),
          e('p', { className: theme.textSecondary }, 
            `Período: ${formatDate(reconciliation.period.startDate)} - ${formatDate(reconciliation.period.endDate)}`
          )
        ),

        // Controles de vista y acciones
        e('div', { className: "flex flex-wrap gap-2" },
          
          // Selector de vista
          e('div', { className: "flex bg-gray-100 rounded-lg p-1" },
            ['detailed', 'summary', 'mobile'].map(mode => 
              e('button', {
                key: mode,
                onClick: () => setViewMode(mode),
                className: `px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === mode 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`
              }, 
                mode === 'detailed' ? '📋 Detallada' :
                mode === 'summary' ? '📈 Resumen' : '📱 Móvil'
              )
            )
          ),

          // Botones de acción
          onSave && e('button', {
            onClick: onSave,
            className: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          },
            e('span', null, '💾'),
            e('span', null, 'Guardar')
          ),

          onExport && e('button', {
            onClick: onExport,
            className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          },
            e('span', null, '📄'),
            e('span', null, 'Exportar')
          )
        )
      )
    ),

    // Tabla de totales diarios
    expandedSections.dailyTotals && e(DailyTotalsSection, {
      theme,
      dailyTotals: reconciliation.dailyTotals,
      viewMode,
      onToggle: () => toggleSection('dailyTotals')
    }),

    // Resumen general
    expandedSections.summary && e(SummarySection, {
      theme,
      summary: reconciliation.summary,
      onToggle: () => toggleSection('summary')
    }),

    // Liquidación final
    expandedSections.settlement && e(SettlementSection, {
      theme,
      finalSettlement: reconciliation.finalSettlement,
      summary: reconciliation.summary,
      onToggle: () => toggleSection('settlement')
    }),

    // Desglose de efectivo
    reconciliation.cashBreakdown && expandedSections.cashBreakdown && e(CashBreakdownSection, {
      theme,
      cashBreakdown: reconciliation.cashBreakdown,
      onToggle: () => toggleSection('cashBreakdown')
    })
  );
}

/**
 * Sección de totales diarios
 */
function DailyTotalsSection({ theme, dailyTotals, viewMode, onToggle }) {
  const { createElement: e } = React;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)}€`;
  };

  return e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
    
    // Header de la sección
    e('div', { className: "p-4 border-b border-gray-200 bg-gray-50" },
      e('div', { className: "flex justify-between items-center" },
        e('h3', { className: "font-semibold flex items-center gap-2" },
          e('span', null, '📅'),
          e('span', null, 'Totales Diarios')
        ),
        e('button', {
          onClick: onToggle,
          className: "text-gray-500 hover:text-gray-700"
        }, '−')
      )
    ),

    // Tabla responsiva
    viewMode === 'mobile' ? e(DailyTotalsMobile, { theme, dailyTotals }) : e(DailyTotalsTable, { theme, dailyTotals, viewMode })
  );
}

/**
 * Tabla de totales diarios para desktop
 */
function DailyTotalsTable({ theme, dailyTotals, viewMode }) {
  const { createElement: e } = React;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)}€`;
  };

  const columns = viewMode === 'detailed' ? [
    { key: 'date', label: 'Fecha', width: 'w-24' },
    { key: 'serviceStart', label: 'Servicios', width: 'w-20' },
    { key: 'totalService', label: 'Total', width: 'w-24' },
    { key: 'articulated', label: 'Articulado', width: 'w-24' },
    { key: 'cardPayment', label: 'Tarjeta', width: 'w-24' },
    { key: 'appPayment', label: 'App', width: 'w-24' },
    { key: 'cashPayment', label: 'Efectivo', width: 'w-24' },
    { key: 'expenses', label: 'Gastos', width: 'w-24' },
    { key: 'freenowTotal', label: 'Freenow', width: 'w-24' },
    { key: 'freenowNet', label: 'Freenow Neto', width: 'w-28' },
    { key: 'distribution60', label: 'Patrón (60%)', width: 'w-28' },
    { key: 'distribution40', label: 'Taxista (40%)', width: 'w-28' }
  ] : [
    { key: 'date', label: 'Fecha', width: 'w-24' },
    { key: 'serviceStart', label: 'Servicios', width: 'w-20' },
    { key: 'totalService', label: 'Total', width: 'w-24' },
    { key: 'expenses', label: 'Gastos', width: 'w-24' },
    { key: 'distribution60', label: 'Patrón', width: 'w-24' },
    { key: 'distribution40', label: 'Taxista', width: 'w-24' }
  ];

  return e('div', { className: "overflow-x-auto" },
    e('table', { className: "w-full" },
      
      // Header
      e('thead', { className: "bg-gray-50" },
        e('tr', null,
          columns.map(col => 
            e('th', {
              key: col.key,
              className: `px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.width}`
            }, col.label)
          )
        )
      ),

      // Body
      e('tbody', { className: "bg-white divide-y divide-gray-200" },
        dailyTotals.map((day, index) => 
          e('tr', {
            key: day.date,
            className: index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
          },
            columns.map(col => 
              e('td', {
                key: col.key,
                className: "px-3 py-4 whitespace-nowrap text-sm"
              },
                col.key === 'date' ? formatDate(day[col.key]) :
                col.key === 'serviceStart' ? day[col.key] :
                formatCurrency(day[col.key] || 0)
              )
            )
          )
        ),

        // Fila de totales
        e('tr', { className: "bg-blue-50 font-semibold" },
          columns.map(col => 
            e('td', {
              key: col.key,
              className: "px-3 py-4 whitespace-nowrap text-sm font-semibold"
            },
              col.key === 'date' ? 'TOTAL' :
              col.key === 'serviceStart' ? dailyTotals.reduce((sum, day) => sum + day.serviceStart, 0) :
              formatCurrency(dailyTotals.reduce((sum, day) => sum + (day[col.key] || 0), 0))
            )
          )
        )
      )
    )
  );
}

/**
 * Vista móvil de totales diarios
 */
function DailyTotalsMobile({ theme, dailyTotals }) {
  const { createElement: e } = React;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  };

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)}€`;
  };

  return e('div', { className: "p-4 space-y-4" },
    dailyTotals.map(day => 
      e('div', {
        key: day.date,
        className: "border border-gray-200 rounded-lg p-4 bg-white"
      },
        
        // Fecha
        e('div', { className: "font-semibold text-lg mb-3 text-blue-600" },
          formatDate(day.date)
        ),

        // Grid de métricas principales
        e('div', { className: "grid grid-cols-2 gap-4 mb-3" },
          e('div', { className: "text-center" },
            e('div', { className: "text-2xl font-bold" }, day.serviceStart),
            e('div', { className: `text-sm ${theme.textSecondary}` }, 'Servicios')
          ),
          e('div', { className: "text-center" },
            e('div', { className: "text-2xl font-bold text-green-600" }, formatCurrency(day.totalService)),
            e('div', { className: `text-sm ${theme.textSecondary}` }, 'Total')
          )
        ),

        // Detalles expandibles
        e('div', { className: "border-t pt-3 space-y-2" },
          e('div', { className: "flex justify-between" },
            e('span', { className: theme.textSecondary }, 'Gastos:'),
            e('span', { className: "font-medium text-red-600" }, formatCurrency(day.expenses))
          ),
          e('div', { className: "flex justify-between" },
            e('span', { className: theme.textSecondary }, 'Patrón (60%):'),
            e('span', { className: "font-medium text-blue-600" }, formatCurrency(day.distribution60))
          ),
          e('div', { className: "flex justify-between" },
            e('span', { className: theme.textSecondary }, 'Taxista (40%):'),
            e('span', { className: "font-medium text-green-600" }, formatCurrency(day.distribution40))
          )
        )
      )
    )
  );
}

/**
 * Sección de resumen general
 */
function SummarySection({ theme, summary, onToggle }) {
  const { createElement: e } = React;

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)}€`;
  };

  const summaryItems = [
    { label: 'Total Servicios', value: summary.totalServices, color: 'text-blue-600', icon: '🚕' },
    { label: 'Ingresos Brutos', value: formatCurrency(summary.totalServices), color: 'text-green-600', icon: '💰' },
    { label: 'Total Gastos', value: formatCurrency(summary.totalExpenses), color: 'text-red-600', icon: '💸' },
    { label: 'Ingresos Netos', value: formatCurrency(summary.netIncome), color: 'text-green-700', icon: '📈' },
    { label: 'Efectivo', value: formatCurrency(summary.totalCash), color: 'text-yellow-600', icon: '💵' },
    { label: 'Tarjeta', value: formatCurrency(summary.totalCard), color: 'text-purple-600', icon: '💳' },
    { label: 'App', value: formatCurrency(summary.totalApp), color: 'text-indigo-600', icon: '📱' },
    { label: 'Freenow Total', value: formatCurrency(summary.totalFreenow), color: 'text-orange-600', icon: '🟢' }
  ];

  return e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
    
    // Header
    e('div', { className: "p-4 border-b border-gray-200 bg-gray-50" },
      e('div', { className: "flex justify-between items-center" },
        e('h3', { className: "font-semibold flex items-center gap-2" },
          e('span', null, '📈'),
          e('span', null, 'Resumen General')
        ),
        e('button', {
          onClick: onToggle,
          className: "text-gray-500 hover:text-gray-700"
        }, '−')
      )
    ),

    // Grid de métricas
    e('div', { className: "p-6" },
      e('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-6" },
        summaryItems.map(item => 
          e('div', {
            key: item.label,
            className: "text-center"
          },
            e('div', { className: "text-3xl mb-2" }, item.icon),
            e('div', { className: `text-2xl font-bold ${item.color} mb-1` }, 
              typeof item.value === 'string' ? item.value : item.value
            ),
            e('div', { className: `text-sm ${theme.textSecondary}` }, item.label)
          )
        )
      )
    )
  );
}

/**
 * Sección de liquidación final
 */
function SettlementSection({ theme, finalSettlement, summary, onToggle }) {
  const { createElement: e } = React;

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)}€`;
  };

  return e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
    
    // Header
    e('div', { className: "p-4 border-b border-gray-200 bg-gray-50" },
      e('div', { className: "flex justify-between items-center" },
        e('h3', { className: "font-semibold flex items-center gap-2" },
          e('span', null, '🧾'),
          e('span', null, 'Liquidación Final')
        ),
        e('button', {
          onClick: onToggle,
          className: "text-gray-500 hover:text-gray-700"
        }, '−')
      )
    ),

    // Contenido de liquidación
    e('div', { className: "p-6" },
      e('div', { className: "grid md:grid-cols-2 gap-8" },
        
        // Distribución principal
        e('div', { className: "space-y-4" },
          e('h4', { className: "font-semibold text-lg mb-4" }, '💰 Distribución Principal'),
          
          e('div', { className: "bg-blue-50 rounded-lg p-4" },
            e('div', { className: "flex justify-between items-center mb-2" },
              e('span', { className: "font-medium" }, '👔 Patrón (60%)'),
              e('span', { className: "text-2xl font-bold text-blue-600" }, 
                formatCurrency(summary.distribution60)
              )
            ),
            e('div', { className: `text-sm ${theme.textSecondary}` }, 
              `60% de ${formatCurrency(summary.netIncome)} ingresos netos`
            )
          ),

          e('div', { className: "bg-green-50 rounded-lg p-4" },
            e('div', { className: "flex justify-between items-center mb-2" },
              e('span', { className: "font-medium" }, '🚕 Taxista (40%)'),
              e('span', { className: "text-2xl font-bold text-green-600" }, 
                formatCurrency(summary.distribution40)
              )
            ),
            e('div', { className: `text-sm ${theme.textSecondary}` }, 
              `40% de ${formatCurrency(summary.netIncome)} ingresos netos`
            )
          )
        ),

        // Ajustes y extras
        e('div', { className: "space-y-4" },
          e('h4', { className: "font-semibold text-lg mb-4" }, '⚖️ Ajustes y Extras'),
          
          finalSettlement.freenowExtras > 0 && e('div', { className: "bg-orange-50 rounded-lg p-4" },
            e('div', { className: "flex justify-between items-center mb-2" },
              e('span', { className: "font-medium" }, '🟢 Extras Freenow'),
              e('span', { className: "text-xl font-bold text-orange-600" }, 
                formatCurrency(finalSettlement.freenowExtras)
              )
            ),
            e('div', { className: `text-sm ${theme.textSecondary}` }, 
              'Incentivos y propinas Freenow'
            )
          ),

          finalSettlement.externalBalance !== 0 && e('div', { 
            className: `rounded-lg p-4 ${finalSettlement.externalBalance > 0 ? 'bg-green-50' : 'bg-red-50'}`
          },
            e('div', { className: "flex justify-between items-center mb-2" },
              e('span', { className: "font-medium" }, 
                finalSettlement.externalBalance > 0 ? '📈 Saldo Positivo' : '📉 Saldo Negativo'
              ),
              e('span', { 
                className: `text-xl font-bold ${finalSettlement.externalBalance > 0 ? 'text-green-600' : 'text-red-600'}`
              }, 
                formatCurrency(Math.abs(finalSettlement.externalBalance))
              )
            ),
            e('div', { className: `text-sm ${theme.textSecondary}` }, 
              'Diferencias y ajustes externos'
            )
          ),

          // Resumen final
          e('div', { className: "bg-gray-100 rounded-lg p-4 border-2 border-gray-300" },
            e('div', { className: "text-center" },
              e('div', { className: "text-sm font-medium text-gray-600 mb-1" }, 'LIQUIDACIÓN FINAL'),
              e('div', { className: "text-3xl font-bold text-gray-800" }, 
                formatCurrency(
                  finalSettlement.driverAmount + 
                  finalSettlement.freenowExtras + 
                  finalSettlement.externalBalance
                )
              ),
              e('div', { className: `text-sm ${theme.textSecondary} mt-1` }, 
                'Monto total para el taxista'
              )
            )
          )
        )
      )
    )
  );
}

/**
 * Sección de desglose de efectivo
 */
function CashBreakdownSection({ theme, cashBreakdown, onToggle }) {
  const { createElement: e } = React;

  const formatCurrency = (amount) => {
    return `${amount.toFixed(2)}€`;
  };

  const billDenominations = [
    { key: 'fifty', label: '50€', value: 50 },
    { key: 'twenty', label: '20€', value: 20 },
    { key: 'ten', label: '10€', value: 10 },
    { key: 'five', label: '5€', value: 5 },
    { key: 'two', label: '2€', value: 2 },
    { key: 'one', label: '1€', value: 1 }
  ];

  return e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
    
    // Header
    e('div', { className: "p-4 border-b border-gray-200 bg-gray-50" },
      e('div', { className: "flex justify-between items-center" },
        e('h3', { className: "font-semibold flex items-center gap-2" },
          e('span', null, '💵'),
          e('span', null, 'Desglose de Efectivo')
        ),
        e('button', {
          onClick: onToggle,
          className: "text-gray-500 hover:text-gray-700"
        }, '−')
      )
    ),

    // Contenido del desglose
    e('div', { className: "p-6" },
      e('div', { className: "grid md:grid-cols-2 gap-8" },
        
        // Desglose de billetes
        e('div', null,
          e('h4', { className: "font-semibold text-lg mb-4" }, '💴 Desglose de Billetes'),
          e('div', { className: "space-y-3" },
            billDenominations.map(denom => {
              const count = cashBreakdown.bills[denom.key] || 0;
              const total = count * denom.value;
              
              return e('div', {
                key: denom.key,
                className: "flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              },
                e('div', { className: "flex items-center gap-3" },
                  e('span', { className: "font-mono text-lg" }, denom.label),
                  e('span', { className: "text-gray-500" }, `× ${count}`)
                ),
                e('span', { className: "font-semibold" }, formatCurrency(total))
              );
            })
          )
        ),

        // Resumen y diferencias
        e('div', null,
          e('h4', { className: "font-semibold text-lg mb-4" }, '📊 Resumen de Efectivo'),
          
          e('div', { className: "space-y-4" },
            e('div', { className: "bg-blue-50 rounded-lg p-4" },
              e('div', { className: "flex justify-between items-center" },
                e('span', { className: "font-medium" }, 'Total Contado'),
                e('span', { className: "text-xl font-bold text-blue-600" }, 
                  formatCurrency(cashBreakdown.total)
                )
              )
            ),

            cashBreakdown.difference !== 0 && e('div', { 
              className: `rounded-lg p-4 ${cashBreakdown.difference > 0 ? 'bg-green-50' : 'bg-red-50'}`
            },
              e('div', { className: "flex justify-between items-center" },
                e('span', { className: "font-medium" }, 
                  cashBreakdown.difference > 0 ? 'Sobrante' : 'Faltante'
                ),
                e('span', { 
                  className: `text-xl font-bold ${cashBreakdown.difference > 0 ? 'text-green-600' : 'text-red-600'}`
                }, 
                  formatCurrency(Math.abs(cashBreakdown.difference))
                )
              ),
              e('div', { className: `text-sm ${theme.textSecondary} mt-1` }, 
                'Diferencia con efectivo calculado'
              )
            ),

            // Nota explicativa
            e('div', { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-3" },
              e('div', { className: "flex items-start gap-2" },
                e('span', { className: "text-yellow-600" }, '💡'),
                e('div', { className: `text-sm ${theme.textSecondary}` },
                  'El desglose muestra el efectivo físico contado. Las diferencias pueden deberse a cambios dados, propinas, o errores de conteo.'
                )
              )
            )
          )
        )
      )
    )
  );
}

// Exportar componente para uso global
if (typeof window !== 'undefined') {
  window.ReconciliationTable = ReconciliationTable;
}

// También exportar como módulo si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReconciliationTable;
}