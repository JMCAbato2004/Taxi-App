/**
 * Optimizaciones móviles para el módulo de conciliación
 * Implementa diseño adaptativo, scroll horizontal y gestos táctiles
 * 
 * Tarea 13.1: Optimizar interfaz para dispositivos móviles
 * Requerimientos: 10.1, 10.4, 10.5
 */

/**
 * Hook personalizado para detectar dispositivos móviles
 */
function useMobileDetection() {
  const { useState, useEffect } = React;
  
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768;
      const isTablet = width >= 768 && width < 1024;
      
      setIsMobile(isMobileDevice);
      setScreenSize(
        isMobileDevice ? 'mobile' : 
        isTablet ? 'tablet' : 
        'desktop'
      );
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, screenSize };
}

/**
 * Hook para gestos táctiles
 */
function useTouchGestures(onSwipeLeft, onSwipeRight, threshold = 50) {
  const { useRef, useEffect } = React;
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(swipeDistance) > threshold) {
      if (swipeDistance > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (swipeDistance < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
  };

  return { handleTouchStart, handleTouchEnd };
}

/**
 * Componente de navegación móvil optimizada
 */
function MobileNavigation({ activeTab, onTabChange, theme, counts = {} }) {
  const { createElement: e } = React;
  
  const tabs = [
    { id: 'services', label: 'Servicios', icon: '🚕', count: counts.services },
    { id: 'expenses', label: 'Gastos', icon: '💸', count: counts.expenses },
    { id: 'reconciliation', label: 'Conciliación', icon: '📊' },
    { id: 'history', label: 'Historial', icon: '📋', count: counts.reconciliations }
  ];

  return e('div', { className: "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden" },
    e('div', { className: "flex justify-around items-center py-2" },
      tabs.map(tab => 
        e('button', {
          key: tab.id,
          onClick: () => onTabChange(tab.id),
          className: `flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
            activeTab === tab.id 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-500 hover:text-gray-700'
          }`
        },
          e('div', { className: "text-xl mb-1" }, tab.icon),
          e('div', { className: "text-xs font-medium" }, tab.label),
          tab.count !== undefined && e('div', { 
            className: `absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${
              tab.count > 0 ? 'block' : 'hidden'
            }`
          }, tab.count > 99 ? '99+' : tab.count)
        )
      )
    )
  );
}

/**
 * Componente de header móvil compacto
 */
function MobileHeader({ title, onBack, actions = [], theme }) {
  const { createElement: e } = React;
  
  return e('div', { className: `${theme.card} border-b ${theme.border} p-3 sticky top-0 z-40 md:hidden` },
    e('div', { className: "flex items-center justify-between" },
      e('div', { className: "flex items-center gap-3 flex-1 min-w-0" },
        onBack && e('button', {
          onClick: onBack,
          className: "p-2 -ml-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
        }, '←'),
        e('h1', { className: "text-lg font-bold truncate" }, title)
      ),
      actions.length > 0 && e('div', { className: "flex gap-2 flex-shrink-0" },
        actions.map((action, index) => 
          e('button', {
            key: index,
            onClick: action.onClick,
            className: `p-2 rounded-lg ${action.className || 'hover:bg-gray-100'}`
          }, action.icon || action.label)
        )
      )
    )
  );
}

/**
 * Tabla responsiva optimizada para móvil
 */
function MobileResponsiveTable({ columns, data, theme, onRowClick }) {
  const { useState, createElement: e } = React;
  const { isMobile, screenSize } = useMobileDetection();
  
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Función para ordenar datos
  const sortData = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Datos ordenados
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  if (isMobile) {
    return e(MobileCardList, { 
      columns, 
      data: sortedData, 
      theme, 
      onRowClick,
      onSort: sortData,
      sortColumn,
      sortDirection
    });
  }

  return e(DesktopTable, { 
    columns, 
    data: sortedData, 
    theme, 
    onRowClick,
    onSort: sortData,
    sortColumn,
    sortDirection
  });
}

/**
 * Lista de tarjetas para vista móvil
 */
function MobileCardList({ columns, data, theme, onRowClick, onSort, sortColumn, sortDirection }) {
  const { createElement: e } = React;
  
  // Columnas principales para mostrar en móvil
  const primaryColumns = columns.filter(col => col.primary || col.mobile !== false).slice(0, 3);
  const secondaryColumns = columns.filter(col => !col.primary && col.mobile !== false);

  return e('div', { className: "space-y-3" },
    // Header con ordenamiento
    e('div', { className: "flex justify-between items-center p-3 bg-gray-50 rounded-lg" },
      e('span', { className: "font-medium text-gray-700" }, `${data.length} elementos`),
      e('select', {
        value: sortColumn || '',
        onChange: (e) => onSort(e.target.value),
        className: "text-sm border border-gray-300 rounded px-2 py-1"
      },
        e('option', { value: '' }, 'Ordenar por...'),
        columns.map(col => 
          e('option', { key: col.key, value: col.key }, col.label)
        )
      )
    ),

    // Lista de tarjetas
    data.map((row, index) => 
      e('div', {
        key: row.id || index,
        onClick: () => onRowClick && onRowClick(row),
        className: `${theme.card} border ${theme.border} rounded-lg p-4 ${
          onRowClick ? 'cursor-pointer hover:shadow-md' : ''
        } transition-shadow`
      },
        // Información principal
        e('div', { className: "flex justify-between items-start mb-3" },
          e('div', { className: "flex-1 min-w-0" },
            primaryColumns.map(col => 
              e('div', { key: col.key, className: "mb-1" },
                col.key === primaryColumns[0].key && e('div', { 
                  className: "font-semibold text-lg truncate" 
                }, col.format ? col.format(row[col.key]) : row[col.key]),
                col.key !== primaryColumns[0].key && e('div', { 
                  className: "text-sm text-gray-600" 
                }, `${col.label}: ${col.format ? col.format(row[col.key]) : row[col.key]}`)
              )
            )
          ),
          // Acciones rápidas
          row.actions && e('div', { className: "flex gap-2 ml-3" },
            row.actions.map((action, actionIndex) => 
              e('button', {
                key: actionIndex,
                onClick: (e) => {
                  e.stopPropagation();
                  action.onClick(row);
                },
                className: `p-2 rounded-lg ${action.className || 'hover:bg-gray-100'}`
              }, action.icon)
            )
          )
        ),

        // Información secundaria (expandible)
        secondaryColumns.length > 0 && e('div', { className: "border-t pt-3 mt-3" },
          e('div', { className: "grid grid-cols-2 gap-2 text-sm" },
            secondaryColumns.slice(0, 4).map(col => 
              e('div', { key: col.key },
                e('span', { className: "text-gray-500" }, `${col.label}: `),
                e('span', { className: "font-medium" }, 
                  col.format ? col.format(row[col.key]) : row[col.key]
                )
              )
            )
          )
        )
      )
    )
  );
}

/**
 * Tabla de escritorio estándar
 */
function DesktopTable({ columns, data, theme, onRowClick, onSort, sortColumn, sortDirection }) {
  const { createElement: e } = React;
  
  return e('div', { className: "overflow-x-auto" },
    e('table', { className: "w-full" },
      e('thead', { className: "bg-gray-50" },
        e('tr', null,
          columns.map(col => 
            e('th', {
              key: col.key,
              onClick: () => col.sortable !== false && onSort(col.key),
              className: `px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                col.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
              }`
            },
              e('div', { className: "flex items-center gap-2" },
                col.label,
                col.sortable !== false && sortColumn === col.key && e('span', null,
                  sortDirection === 'asc' ? '↑' : '↓'
                )
              )
            )
          )
        )
      ),
      e('tbody', { className: "bg-white divide-y divide-gray-200" },
        data.map((row, index) => 
          e('tr', {
            key: row.id || index,
            onClick: () => onRowClick && onRowClick(row),
            className: `${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`
          },
            columns.map(col => 
              e('td', {
                key: col.key,
                className: "px-4 py-4 whitespace-nowrap text-sm"
              }, col.format ? col.format(row[col.key]) : row[col.key])
            )
          )
        )
      )
    )
  );
}

/**
 * Formulario optimizado para móvil
 */
function MobileOptimizedForm({ fields, values, onChange, onSubmit, theme, title }) {
  const { useState, createElement: e } = React;
  const { isMobile } = useMobileDetection();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(!isMobile);

  // Agrupar campos por pasos en móvil
  const fieldGroups = isMobile ? 
    fields.reduce((groups, field, index) => {
      const groupIndex = Math.floor(index / 3); // 3 campos por paso
      if (!groups[groupIndex]) groups[groupIndex] = [];
      groups[groupIndex].push(field);
      return groups;
    }, []) : 
    [fields];

  const handleNext = () => {
    if (currentStep < fieldGroups.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  if (isMobile) {
    return e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
      // Header del formulario
      e('div', { className: "p-4 border-b border-gray-200 bg-gray-50" },
        e('div', { className: "flex justify-between items-center" },
          e('h3', { className: "font-semibold" }, title),
          e('button', {
            onClick: () => setIsExpanded(!isExpanded),
            className: "text-gray-500 hover:text-gray-700"
          }, isExpanded ? '−' : '+')
        ),
        fieldGroups.length > 1 && e('div', { className: "mt-2 text-sm text-gray-600" },
          `Paso ${currentStep + 1} de ${fieldGroups.length}`
        )
      ),

      // Contenido del formulario
      isExpanded && e('form', { onSubmit: handleSubmit, className: "p-4" },
        // Indicador de progreso
        fieldGroups.length > 1 && e('div', { className: "mb-4" },
          e('div', { className: "flex justify-between mb-2" },
            fieldGroups.map((_, index) => 
              e('div', {
                key: index,
                className: `w-full h-2 rounded-full mx-1 ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`
              })
            )
          )
        ),

        // Campos del paso actual
        e('div', { className: "space-y-4 mb-6" },
          fieldGroups[currentStep].map(field => 
            e(MobileFormField, {
              key: field.key,
              field: field,
              value: values[field.key],
              onChange: (value) => onChange(field.key, value),
              theme: theme
            })
          )
        ),

        // Navegación
        e('div', { className: "flex justify-between" },
          e('button', {
            type: 'button',
            onClick: handlePrevious,
            disabled: currentStep === 0,
            className: "px-4 py-2 text-gray-600 disabled:opacity-50"
          }, 'Anterior'),
          
          currentStep < fieldGroups.length - 1 ? 
            e('button', {
              type: 'button',
              onClick: handleNext,
              className: "px-6 py-2 bg-blue-600 text-white rounded-lg"
            }, 'Siguiente') :
            e('button', {
              type: 'submit',
              className: "px-6 py-2 bg-green-600 text-white rounded-lg"
            }, 'Guardar')
        )
      )
    );
  }

  // Vista de escritorio estándar
  return e('div', { className: `${theme.card} rounded-xl border ${theme.border} p-6` },
    e('h3', { className: "text-lg font-semibold mb-4" }, title),
    e('form', { onSubmit: handleSubmit, className: "space-y-4" },
      e('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        fields.map(field => 
          e(DesktopFormField, {
            key: field.key,
            field: field,
            value: values[field.key],
            onChange: (value) => onChange(field.key, value),
            theme: theme
          })
        )
      ),
      e('div', { className: "flex justify-end pt-4" },
        e('button', {
          type: 'submit',
          className: "px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        }, 'Guardar')
      )
    )
  );
}

/**
 * Campo de formulario optimizado para móvil
 */
function MobileFormField({ field, value, onChange, theme }) {
  const { createElement: e } = React;
  
  const baseInputClass = `w-full px-4 py-3 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base`;

  return e('div', null,
    e('label', { className: "block text-sm font-medium mb-2" }, field.label),
    field.type === 'select' ? 
      e('select', {
        value: value || '',
        onChange: (e) => onChange(e.target.value),
        className: baseInputClass
      },
        e('option', { value: '' }, `Seleccionar ${field.label.toLowerCase()}`),
        field.options.map(option => 
          e('option', { key: option.value, value: option.value }, option.label)
        )
      ) :
    field.type === 'textarea' ?
      e('textarea', {
        value: value || '',
        onChange: (e) => onChange(e.target.value),
        placeholder: field.placeholder,
        rows: 3,
        className: baseInputClass
      }) :
      e('input', {
        type: field.type || 'text',
        value: value || '',
        onChange: (e) => onChange(e.target.value),
        placeholder: field.placeholder,
        className: baseInputClass
      }),
    field.help && e('p', { className: "mt-1 text-sm text-gray-500" }, field.help)
  );
}

/**
 * Campo de formulario para escritorio
 */
function DesktopFormField({ field, value, onChange, theme }) {
  const { createElement: e } = React;
  
  const baseInputClass = `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`;

  return e('div', null,
    e('label', { className: "block text-sm font-medium mb-1" }, field.label),
    field.type === 'select' ? 
      e('select', {
        value: value || '',
        onChange: (e) => onChange(e.target.value),
        className: baseInputClass
      },
        e('option', { value: '' }, `Seleccionar ${field.label.toLowerCase()}`),
        field.options.map(option => 
          e('option', { key: option.value, value: option.value }, option.label)
        )
      ) :
    field.type === 'textarea' ?
      e('textarea', {
        value: value || '',
        onChange: (e) => onChange(e.target.value),
        placeholder: field.placeholder,
        rows: 3,
        className: baseInputClass
      }) :
      e('input', {
        type: field.type || 'text',
        value: value || '',
        onChange: (e) => onChange(e.target.value),
        placeholder: field.placeholder,
        className: baseInputClass
      }),
    field.help && e('p', { className: "mt-1 text-sm text-gray-500" }, field.help)
  );
}

/**
 * Componente de estadísticas optimizado para móvil
 */
function MobileStats({ stats, theme }) {
  const { createElement: e } = React;
  const { isMobile } = useMobileDetection();
  
  if (isMobile) {
    return e('div', { className: "grid grid-cols-2 gap-3" },
      stats.map(stat => 
        e('div', {
          key: stat.key,
          className: `${theme.card} border ${theme.border} rounded-lg p-3 text-center`
        },
          e('div', { className: "text-2xl mb-1" }, stat.icon),
          e('div', { className: "text-lg font-bold" }, stat.value),
          e('div', { className: "text-xs text-gray-600" }, stat.label)
        )
      )
    );
  }

  return e('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
    stats.map(stat => 
      e('div', {
        key: stat.key,
        className: `${theme.card} border ${theme.border} rounded-lg p-4 text-center`
      },
        e('div', { className: "text-3xl mb-2" }, stat.icon),
        e('div', { className: "text-2xl font-bold" }, stat.value),
        e('div', { className: "text-sm text-gray-600" }, stat.label)
      )
    )
  );
}

// Exportar componentes y hooks
if (typeof window !== 'undefined') {
  window.MobileOptimizations = {
    useMobileDetection,
    useTouchGestures,
    MobileNavigation,
    MobileHeader,
    MobileResponsiveTable,
    MobileOptimizedForm,
    MobileStats
  };
}

// También exportar como módulo si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    useMobileDetection,
    useTouchGestures,
    MobileNavigation,
    MobileHeader,
    MobileResponsiveTable,
    MobileOptimizedForm,
    MobileStats
  };
}