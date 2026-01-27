/**
 * Optimizaciones para tablet y escritorio del módulo de conciliación
 * Aprovecha el espacio adicional y mejora la productividad con atajos de teclado
 * 
 * Tarea 13.2: Optimizar interfaz para tablet y escritorio
 * Requerimientos: 10.2, 10.3
 */

/**
 * Hook para atajos de teclado
 */
function useKeyboardShortcuts(shortcuts) {
  const { useEffect } = React;

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Construir la combinación de teclas
      const keys = [];
      if (event.ctrlKey) keys.push('ctrl');
      if (event.altKey) keys.push('alt');
      if (event.shiftKey) keys.push('shift');
      if (event.metaKey) keys.push('meta');
      keys.push(event.key.toLowerCase());
      
      const combination = keys.join('+');
      
      // Buscar y ejecutar el atajo correspondiente
      if (shortcuts[combination]) {
        event.preventDefault();
        shortcuts[combination]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

/**
 * Componente de ayuda contextual para escritorio
 */
function ContextualHelp({ topic, theme }) {
  const { useState, createElement: e } = React;
  const [isExpanded, setIsExpanded] = useState(false);

  const helpContent = {
    services: {
      title: 'Gestión de Servicios',
      shortcuts: [
        { key: 'Ctrl+N', action: 'Nuevo servicio' },
        { key: 'Ctrl+S', action: 'Guardar cambios' },
        { key: 'Ctrl+F', action: 'Buscar servicios' },
        { key: 'Delete', action: 'Eliminar seleccionado' }
      ],
      tips: [
        'Usa Tab para navegar entre campos',
        'Enter para confirmar acciones',
        'Esc para cancelar formularios'
      ]
    },
    expenses: {
      title: 'Gestión de Gastos',
      shortcuts: [
        { key: 'Ctrl+N', action: 'Nuevo gasto' },
        { key: 'Ctrl+S', action: 'Guardar cambios' },
        { key: 'Ctrl+D', action: 'Duplicar gasto' },
        { key: 'Delete', action: 'Eliminar seleccionado' }
      ],
      tips: [
        'Categoriza gastos para mejor análisis',
        'Adjunta recibos cuando sea posible',
        'Revisa totales regularmente'
      ]
    },
    reconciliation: {
      title: 'Conciliación',
      shortcuts: [
        { key: 'Ctrl+G', action: 'Generar conciliación' },
        { key: 'Ctrl+S', action: 'Guardar conciliación' },
        { key: 'Ctrl+E', action: 'Exportar PDF' },
        { key: 'Ctrl+P', action: 'Imprimir' }
      ],
      tips: [
        'Verifica datos antes de generar',
        'Incluye desglose de efectivo',
        'Exporta regularmente como backup'
      ]
    },
    history: {
      title: 'Historial',
      shortcuts: [
        { key: 'Ctrl+F', action: 'Buscar conciliaciones' },
        { key: 'Ctrl+O', action: 'Abrir seleccionada' },
        { key: 'Delete', action: 'Eliminar seleccionada' }
      ],
      tips: [
        'Organiza por fechas',
        'Mantén backups regulares',
        'Revisa tendencias mensuales'
      ]
    }
  };

  const content = helpContent[topic] || helpContent.services;

  return e('div', { className: "relative" },
    e('button', {
      onClick: () => setIsExpanded(!isExpanded),
      className: "p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700",
      title: "Ayuda y atajos"
    }, '❓'),

    isExpanded && e('div', { 
      className: "absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4"
    },
      e('div', { className: "flex justify-between items-center mb-3" },
        e('h3', { className: "font-semibold text-gray-900" }, content.title),
        e('button', {
          onClick: () => setIsExpanded(false),
          className: "text-gray-400 hover:text-gray-600"
        }, '×')
      ),

      // Atajos de teclado
      e('div', { className: "mb-4" },
        e('h4', { className: "text-sm font-medium text-gray-700 mb-2" }, 'Atajos de Teclado'),
        e('div', { className: "space-y-1" },
          content.shortcuts.map((shortcut, index) =>
            e('div', { key: index, className: "flex justify-between text-xs" },
              e('kbd', { 
                className: "px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono"
              }, shortcut.key),
              e('span', { className: "text-gray-600" }, shortcut.action)
            )
          )
        )
      ),

      // Consejos
      e('div', null,
        e('h4', { className: "text-sm font-medium text-gray-700 mb-2" }, 'Consejos'),
        e('ul', { className: "space-y-1" },
          content.tips.map((tip, index) =>
            e('li', { key: index, className: "text-xs text-gray-600" }, `• ${tip}`)
          )
        )
      )
    )
  );
}

/**
 * Layout de múltiples paneles para escritorio
 */
function MultiPanelLayout({ panels, theme, activePanel, onPanelChange }) {
  const { createElement: e } = React;

  return e('div', { className: "flex h-full" },
    // Panel lateral izquierdo
    e('div', { className: "w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto" },
      e('div', { className: "p-4" },
        e('h3', { className: "font-semibold text-gray-900 mb-4" }, 'Navegación Rápida'),
        e('div', { className: "space-y-2" },
          panels.map(panel =>
            e('button', {
              key: panel.id,
              onClick: () => onPanelChange(panel.id),
              className: `w-full text-left p-3 rounded-lg transition-colors ${
                activePanel === panel.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`
            },
              e('div', { className: "flex items-center gap-3" },
                e('span', { className: "text-xl" }, panel.icon),
                e('div', null,
                  e('div', { className: "font-medium" }, panel.title),
                  e('div', { className: "text-sm opacity-75" }, panel.description)
                )
              )
            )
          )
        )
      )
    ),

    // Panel principal
    e('div', { className: "flex-1 overflow-y-auto" },
      panels.find(p => p.id === activePanel)?.content
    )
  );
}

/**
 * Dashboard de métricas avanzado para escritorio
 */
function AdvancedDashboard({ data, theme, period }) {
  const { createElement: e } = React;

  // Calcular métricas avanzadas
  const metrics = calculateAdvancedMetrics(data, period);

  return e('div', { className: "space-y-6" },
    // Métricas principales en grid expandido
    e('div', { className: "grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4" },
      metrics.primary.map(metric =>
        e(AdvancedMetricCard, {
          key: metric.key,
          metric: metric,
          theme: theme
        })
      )
    ),

    // Gráficos y análisis
    e('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
      // Gráfico de tendencias
      e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
        e('h3', { className: "text-lg font-semibold mb-4" }, '📈 Tendencias'),
        e(TrendChart, { data: metrics.trends, theme: theme })
      ),

      // Distribución de ingresos
      e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
        e('h3', { className: "text-lg font-semibold mb-4" }, '🥧 Distribución'),
        e(DistributionChart, { data: metrics.distribution, theme: theme })
      )
    ),

    // Tabla de análisis detallado
    e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
      e('div', { className: "p-6 border-b border-gray-200" },
        e('h3', { className: "text-lg font-semibold" }, '📊 Análisis Detallado')
      ),
      e(DetailedAnalysisTable, { data: metrics.detailed, theme: theme })
    )
  );
}

/**
 * Tarjeta de métrica avanzada
 */
function AdvancedMetricCard({ metric, theme }) {
  const { createElement: e } = React;

  return e('div', { className: `${theme.card} rounded-xl p-4 border ${theme.border} hover:shadow-md transition-shadow` },
    e('div', { className: "flex items-center justify-between mb-2" },
      e('span', { className: "text-2xl" }, metric.icon),
      metric.trend && e('span', { 
        className: `text-xs px-2 py-1 rounded-full ${
          metric.trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`
      }, `${metric.trend > 0 ? '+' : ''}${metric.trend}%`)
    ),
    e('div', { className: "text-2xl font-bold mb-1" }, metric.value),
    e('div', { className: `text-sm ${theme.textSecondary}` }, metric.label),
    metric.subtitle && e('div', { className: "text-xs text-gray-500 mt-1" }, metric.subtitle)
  );
}

/**
 * Gráfico de tendencias simplificado
 */
function TrendChart({ data, theme }) {
  const { createElement: e } = React;

  // Simulación de gráfico con barras ASCII
  const maxValue = Math.max(...data.map(d => d.value));
  
  return e('div', { className: "space-y-3" },
    data.map((item, index) => {
      const percentage = (item.value / maxValue) * 100;
      return e('div', { key: index, className: "flex items-center gap-3" },
        e('div', { className: "w-16 text-sm text-gray-600" }, item.label),
        e('div', { className: "flex-1 bg-gray-200 rounded-full h-4 relative" },
          e('div', { 
            className: "bg-blue-600 h-4 rounded-full transition-all duration-500",
            style: { width: `${percentage}%` }
          }),
          e('span', { 
            className: "absolute inset-0 flex items-center justify-center text-xs font-medium text-white"
          }, item.value)
        )
      );
    })
  );
}

/**
 * Gráfico de distribución simplificado
 */
function DistributionChart({ data, theme }) {
  const { createElement: e } = React;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return e('div', { className: "space-y-3" },
    data.map((item, index) => {
      const percentage = ((item.value / total) * 100).toFixed(1);
      return e('div', { key: index, className: "flex items-center justify-between" },
        e('div', { className: "flex items-center gap-2" },
          e('div', { 
            className: "w-4 h-4 rounded-full",
            style: { backgroundColor: item.color }
          }),
          e('span', { className: "text-sm" }, item.label)
        ),
        e('div', { className: "text-right" },
          e('div', { className: "font-semibold" }, `${item.value.toFixed(2)}€`),
          e('div', { className: "text-xs text-gray-500" }, `${percentage}%`)
        )
      );
    })
  );
}

/**
 * Tabla de análisis detallado
 */
function DetailedAnalysisTable({ data, theme }) {
  const { createElement: e } = React;

  const columns = [
    { key: 'date', label: 'Fecha', width: 'w-24' },
    { key: 'services', label: 'Servicios', width: 'w-20' },
    { key: 'income', label: 'Ingresos', width: 'w-24' },
    { key: 'expenses', label: 'Gastos', width: 'w-24' },
    { key: 'net', label: 'Neto', width: 'w-24' },
    { key: 'efficiency', label: 'Eficiencia', width: 'w-24' },
    { key: 'avgService', label: 'Promedio/Servicio', width: 'w-32' }
  ];

  return e('div', { className: "overflow-x-auto" },
    e('table', { className: "w-full" },
      e('thead', { className: "bg-gray-50" },
        e('tr', null,
          columns.map(col =>
            e('th', {
              key: col.key,
              className: `px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.width}`
            }, col.label)
          )
        )
      ),
      e('tbody', { className: "bg-white divide-y divide-gray-200" },
        data.map((row, index) =>
          e('tr', { key: index, className: "hover:bg-gray-50" },
            columns.map(col =>
              e('td', {
                key: col.key,
                className: "px-4 py-4 whitespace-nowrap text-sm"
              }, formatTableValue(row[col.key], col.key))
            )
          )
        )
      )
    )
  );
}

/**
 * Barra de herramientas avanzada para escritorio
 */
function AdvancedToolbar({ actions, theme, searchValue, onSearchChange }) {
  const { createElement: e } = React;

  return e('div', { className: `${theme.card} border-b ${theme.border} p-4` },
    e('div', { className: "flex items-center justify-between" },
      // Búsqueda avanzada
      e('div', { className: "flex items-center gap-4" },
        e('div', { className: "relative" },
          e('input', {
            type: 'text',
            placeholder: 'Buscar... (Ctrl+F)',
            value: searchValue,
            onChange: (e) => onSearchChange(e.target.value),
            className: `pl-10 pr-4 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64`
          }),
          e('div', { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" },
            e('span', { className: "text-gray-400" }, '🔍')
          )
        ),
        
        // Filtros rápidos
        e('div', { className: "flex gap-2" },
          e('select', { className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input}` },
            e('option', { value: '' }, 'Todos los períodos'),
            e('option', { value: 'today' }, 'Hoy'),
            e('option', { value: 'week' }, 'Esta semana'),
            e('option', { value: 'month' }, 'Este mes')
          ),
          e('select', { className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input}` },
            e('option', { value: '' }, 'Todos los tipos'),
            e('option', { value: 'cash' }, 'Efectivo'),
            e('option', { value: 'card' }, 'Tarjeta'),
            e('option', { value: 'app' }, 'App')
          )
        )
      ),

      // Acciones principales
      e('div', { className: "flex items-center gap-2" },
        actions.map((action, index) =>
          e('button', {
            key: index,
            onClick: action.onClick,
            className: `px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${action.className || 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`,
            title: action.shortcut ? `${action.label} (${action.shortcut})` : action.label
          },
            action.icon && e('span', null, action.icon),
            e('span', null, action.label),
            action.shortcut && e('kbd', { 
              className: "ml-2 px-1 py-0.5 bg-gray-200 border border-gray-300 rounded text-xs"
            }, action.shortcut)
          )
        )
      )
    )
  );
}

/**
 * Panel lateral de información contextual
 */
function ContextualSidebar({ content, theme, isVisible, onToggle }) {
  const { createElement: e } = React;

  if (!isVisible) {
    return e('button', {
      onClick: onToggle,
      className: "fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg z-40",
      title: "Mostrar panel de información"
    }, '📊');
  }

  return e('div', { className: "fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 overflow-y-auto" },
    // Header del panel
    e('div', { className: "p-4 border-b border-gray-200 bg-gray-50" },
      e('div', { className: "flex justify-between items-center" },
        e('h3', { className: "font-semibold text-gray-900" }, 'Información'),
        e('button', {
          onClick: onToggle,
          className: "text-gray-400 hover:text-gray-600"
        }, '×')
      )
    ),

    // Contenido del panel
    e('div', { className: "p-4 space-y-6" },
      // Resumen rápido
      content.summary && e('div', null,
        e('h4', { className: "font-medium text-gray-900 mb-3" }, 'Resumen'),
        e('div', { className: "space-y-2" },
          content.summary.map((item, index) =>
            e('div', { key: index, className: "flex justify-between text-sm" },
              e('span', { className: "text-gray-600" }, item.label),
              e('span', { className: "font-medium" }, item.value)
            )
          )
        )
      ),

      // Acciones rápidas
      content.quickActions && e('div', null,
        e('h4', { className: "font-medium text-gray-900 mb-3" }, 'Acciones Rápidas'),
        e('div', { className: "space-y-2" },
          content.quickActions.map((action, index) =>
            e('button', {
              key: index,
              onClick: action.onClick,
              className: "w-full text-left p-2 rounded-lg hover:bg-gray-100 text-sm"
            },
              e('div', { className: "flex items-center gap-2" },
                e('span', null, action.icon),
                e('span', null, action.label)
              )
            )
          )
        )
      ),

      // Información adicional
      content.info && e('div', null,
        e('h4', { className: "font-medium text-gray-900 mb-3" }, 'Información'),
        e('div', { className: "text-sm text-gray-600 space-y-2" },
          content.info.map((info, index) =>
            e('p', { key: index }, info)
          )
        )
      )
    )
  );
}

// Funciones auxiliares

/**
 * Calcula métricas avanzadas para el dashboard
 */
function calculateAdvancedMetrics(data, period) {
  const services = data.services || [];
  const expenses = data.expenses || [];

  // Métricas primarias
  const totalServices = services.length;
  const totalIncome = services.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  const avgPerService = totalServices > 0 ? totalIncome / totalServices : 0;
  const efficiency = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  const primary = [
    { key: 'services', icon: '🚕', value: totalServices, label: 'Servicios', trend: 5 },
    { key: 'income', icon: '💰', value: `${totalIncome.toFixed(2)}€`, label: 'Ingresos', trend: 12 },
    { key: 'expenses', icon: '💸', value: `${totalExpenses.toFixed(2)}€`, label: 'Gastos', trend: -3 },
    { key: 'net', icon: '📈', value: `${netIncome.toFixed(2)}€`, label: 'Neto', trend: 8 },
    { key: 'avg', icon: '📊', value: `${avgPerService.toFixed(2)}€`, label: 'Promedio/Servicio', trend: 2 },
    { key: 'efficiency', icon: '⚡', value: `${efficiency.toFixed(1)}%`, label: 'Eficiencia', trend: 1 }
  ];

  // Tendencias (simuladas)
  const trends = [
    { label: 'Lun', value: 120 },
    { label: 'Mar', value: 150 },
    { label: 'Mié', value: 180 },
    { label: 'Jue', value: 165 },
    { label: 'Vie', value: 200 },
    { label: 'Sáb', value: 250 },
    { label: 'Dom', value: 180 }
  ];

  // Distribución
  const distribution = [
    { label: 'Efectivo', value: totalIncome * 0.4, color: '#10b981' },
    { label: 'Tarjeta', value: totalIncome * 0.35, color: '#3b82f6' },
    { label: 'App', value: totalIncome * 0.25, color: '#8b5cf6' }
  ];

  // Análisis detallado (simulado)
  const detailed = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES'),
    services: Math.floor(Math.random() * 20) + 10,
    income: Math.random() * 300 + 100,
    expenses: Math.random() * 50 + 20,
    net: 0, // Se calculará
    efficiency: 0, // Se calculará
    avgService: 0 // Se calculará
  })).map(day => {
    day.net = day.income - day.expenses;
    day.efficiency = (day.net / day.income) * 100;
    day.avgService = day.income / day.services;
    return day;
  });

  return { primary, trends, distribution, detailed };
}

/**
 * Formatea valores para mostrar en tablas
 */
function formatTableValue(value, key) {
  if (typeof value === 'number') {
    if (key.includes('efficiency')) {
      return `${value.toFixed(1)}%`;
    }
    if (key.includes('income') || key.includes('expenses') || key.includes('net') || key.includes('avg')) {
      return `${value.toFixed(2)}€`;
    }
    return value.toString();
  }
  return value;
}

// Exportar componentes y hooks
if (typeof window !== 'undefined') {
  window.DesktopOptimizations = {
    useKeyboardShortcuts,
    ContextualHelp,
    MultiPanelLayout,
    AdvancedDashboard,
    AdvancedToolbar,
    ContextualSidebar
  };
}

// También exportar como módulo si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    useKeyboardShortcuts,
    ContextualHelp,
    MultiPanelLayout,
    AdvancedDashboard,
    AdvancedToolbar,
    ContextualSidebar
  };
}