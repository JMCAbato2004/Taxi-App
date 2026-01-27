/**
 * Componente ServiceManager para gestión CRUD de servicios de taxi
 * Implementa formulario de registro, lista con edición/eliminación y validaciones
 * Requerimientos: 1.1, 1.2, 1.3, 1.4, 1.5
 */

/**
 * Componente principal para gestión de servicios
 */
function ServiceManager({ theme, services, onAdd, onUpdate, onDelete }) {
  const { useState, useEffect, createElement: e } = React;

  // Estados del componente
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filtrar y ordenar servicios
  const filteredServices = services
    .filter(service => {
      // Filtro por término de búsqueda
      const matchesSearch = !searchTerm ||
        service.totalAmount.toString().includes(searchTerm) ||
        (service.platform && service.platform.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro por tipo de pago
      const matchesType = filterType === 'all' || service.paymentType === filterType;

      // Filtro por rango de fechas
      const serviceDate = new Date(service.date);
      const matchesDateFrom = !dateFrom || serviceDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || serviceDate <= new Date(dateTo);

      return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'type':
          aValue = a.paymentType;
          bValue = b.paymentType;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handlers
  const handleAddService = (serviceData) => {
    onAdd(serviceData);
    setShowForm(false);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleUpdateService = (serviceData) => {
    onUpdate(editingService.id, serviceData);
    setEditingService(null);
    setShowForm(false);
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setShowForm(false);
  };

  const handleDeleteService = (service) => {
    if (window.confirm(`¿Seguro que quieres eliminar el servicio de ${service.totalAmount}€?`)) {
      onDelete(service.id);
    }
  };

  // Handlers para filtros de fecha rápidos
  const setDateRange = (days) => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - days);

    setDateFrom(fromDate.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  const setCurrentMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
  };

  const setLastMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
  };

  // Estadísticas rápidas (basadas en servicios filtrados)
  const stats = {
    total: filteredServices.length,
    totalAmount: filteredServices.reduce((sum, s) => sum + s.totalAmount, 0),
    cash: filteredServices.filter(s => s.paymentType === 'cash').length,
    card: filteredServices.filter(s => s.paymentType === 'card').length,
    app: filteredServices.filter(s => s.paymentType === 'app').length,
    articulated: filteredServices.filter(s => s.isArticulated).length
  };

  // Estadísticas totales (sin filtros)
  const totalStats = {
    total: services.length,
    totalAmount: services.reduce((sum, s) => sum + s.totalAmount, 0)
  };

  const hasActiveFilters = searchTerm || filterType !== 'all' || dateFrom || dateTo;

  return e('div', { className: "space-y-6" },
    // Header con estadísticas
    e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
      e('div', { className: "flex justify-between items-start mb-4" },
        e('div', null,
          e('h2', { className: "text-2xl font-bold mb-2" }, '🚕 Gestión de Servicios'),
          e('p', { className: theme.textSecondary },
            'Registra y gestiona todos los servicios de taxi realizados'
          )
        ),
        e('button', {
          onClick: () => setShowForm(true),
          className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
        },
          e('span', null, '+'),
          e('span', null, 'Nuevo Servicio')
        )
      ),

      // Estadísticas rápidas
      e('div', null,
        hasActiveFilters && e('div', { className: "mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg" },
          e('p', { className: "text-sm text-blue-700" },
            `📊 Mostrando ${stats.total} de ${totalStats.total} servicios (${stats.totalAmount.toFixed(2)}€ de ${totalStats.totalAmount.toFixed(2)}€)`
          )
        ),
        e('div', { className: "grid grid-cols-2 md:grid-cols-6 gap-4" },
          e(StatCard, {
            label: "Total",
            value: stats.total,
            theme: theme,
            icon: "📊"
          }),
          e(StatCard, {
            label: "Importe",
            value: `${stats.totalAmount.toFixed(2)}€`,
            theme: theme,
            icon: "💰"
          }),
          e(StatCard, {
            label: "Efectivo",
            value: stats.cash,
            theme: theme,
            icon: "💵"
          }),
          e(StatCard, {
            label: "Tarjeta",
            value: stats.card,
            theme: theme,
            icon: "💳"
          }),
          e(StatCard, {
            label: "App",
            value: stats.app,
            theme: theme,
            icon: "📱"
          }),
          e(StatCard, {
            label: "Articulados",
            value: stats.articulated,
            theme: theme,
            icon: "🚌"
          })
        )
      )
    ),

    // Filtros y búsqueda
    e('div', { className: `${theme.card} rounded-xl p-4 border ${theme.border}` },
      e('div', { className: "space-y-4" },
        // Primera fila: Búsqueda y filtros básicos
        e('div', { className: "flex flex-col md:flex-row gap-4" },
          // Búsqueda
          e('div', { className: "flex-1" },
            e('input', {
              type: 'text',
              placeholder: 'Buscar por importe o plataforma...',
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
            })
          ),

          // Filtro por tipo
          e('select', {
            value: filterType,
            onChange: (e) => setFilterType(e.target.value),
            className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
          },
            e('option', { value: 'all' }, 'Todos los tipos'),
            e('option', { value: 'cash' }, 'Efectivo'),
            e('option', { value: 'card' }, 'Tarjeta'),
            e('option', { value: 'app' }, 'Aplicación')
          ),

          // Ordenar por
          e('select', {
            value: sortBy,
            onChange: (e) => setSortBy(e.target.value),
            className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
          },
            e('option', { value: 'date' }, 'Fecha'),
            e('option', { value: 'amount' }, 'Importe'),
            e('option', { value: 'type' }, 'Tipo')
          ),

          // Orden
          e('button', {
            onClick: () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'),
            className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input} hover:bg-gray-50 flex items-center gap-2`
          },
            e('span', null, sortOrder === 'asc' ? '↑' : '↓'),
            e('span', null, sortOrder === 'asc' ? 'Asc' : 'Desc')
          )
        ),

        // Segunda fila: Filtros de fecha
        e('div', { className: "flex flex-col md:flex-row gap-4 items-end" },
          e('div', { className: "flex-1" },
            e('label', { className: "block text-sm font-medium mb-2" }, '📅 Filtrar por rango de fechas'),
            e('div', { className: "flex gap-2 items-center" },
              e('input', {
                type: 'date',
                value: dateFrom,
                onChange: (e) => setDateFrom(e.target.value),
                className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`,
                placeholder: 'Desde'
              }),
              e('span', { className: theme.textSecondary }, 'hasta'),
              e('input', {
                type: 'date',
                value: dateTo,
                onChange: (e) => setDateTo(e.target.value),
                className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`,
                placeholder: 'Hasta'
              })
            )
          ),

          // Botones de rango rápido
          e('div', { className: "flex flex-wrap gap-2" },
            e('button', {
              onClick: () => setDateRange(7),
              className: "px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            }, 'Últimos 7 días'),
            e('button', {
              onClick: () => setDateRange(30),
              className: "px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            }, 'Últimos 30 días'),
            e('button', {
              onClick: setCurrentMonth,
              className: "px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            }, 'Este mes'),
            e('button', {
              onClick: setLastMonth,
              className: "px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            }, 'Mes anterior')
          ),

          // Botón para limpiar filtros
          (searchTerm || filterType !== 'all' || dateFrom || dateTo) && e('button', {
            onClick: () => {
              setSearchTerm('');
              setFilterType('all');
              setDateFrom('');
              setDateTo('');
            },
            className: "px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          },
            e('span', null, '🗑️'),
            e('span', null, 'Limpiar filtros')
          )
        )
      )
    ),

    // Formulario de servicio (modal)
    showForm && e(ServiceFormModal, {
      theme: theme,
      service: editingService,
      onSave: editingService ? handleUpdateService : handleAddService,
      onCancel: handleCancelEdit
    }),

    // Lista de servicios
    e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
      e('div', { className: "p-4 border-b border-gray-200" },
        e('h3', { className: "font-semibold" },
          `Servicios (${filteredServices.length}${filteredServices.length !== services.length ? ` de ${services.length}` : ''})`
        )
      ),

      filteredServices.length === 0 ? (
        e('div', { className: "p-8 text-center" },
          e('div', { className: "text-4xl mb-4" }, '📭'),
          e('p', { className: theme.textSecondary },
            searchTerm || filterType !== 'all'
              ? 'No se encontraron servicios con los filtros aplicados'
              : 'No hay servicios registrados. ¡Añade el primero!'
          )
        )
      ) : (
        e('div', { className: "divide-y divide-gray-200" },
          filteredServices.map(service =>
            e(ServiceListItem, {
              key: service.id,
              service: service,
              theme: theme,
              onEdit: () => handleEditService(service),
              onDelete: () => handleDeleteService(service)
            })
          )
        )
      )
    )
  );
}

/**
 * Componente para tarjetas de estadísticas
 */
function StatCard({ label, value, theme, icon }) {
  const { createElement: e } = React;

  return e('div', { className: "text-center" },
    e('div', { className: "text-2xl mb-1" }, icon),
    e('div', { className: "text-lg font-bold" }, value),
    e('div', { className: `text-sm ${theme.textSecondary}` }, label)
  );
}

/**
 * Componente para elementos de la lista de servicios
 */
function ServiceListItem({ service, theme, onEdit, onDelete }) {
  const { createElement: e } = React;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time || '--:--';
  };

  const getPaymentTypeIcon = (type) => {
    switch (type) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'app': return '📱';
      default: return '❓';
    }
  };

  const getPlatformBadge = (platform) => {
    if (!platform || platform === 'other') return null;

    return e('span', {
      className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
    }, platform);
  };

  return e('div', { className: "p-4 hover:bg-gray-50 transition-colors" },
    e('div', { className: "flex items-center justify-between" },
      // Información principal
      e('div', { className: "flex-1" },
        e('div', { className: "flex items-center gap-3 mb-2" },
          e('span', { className: "text-2xl" }, getPaymentTypeIcon(service.paymentType)),
          e('div', null,
            e('div', { className: "font-semibold text-lg" }, `${service.totalAmount.toFixed(2)}€`),
            e('div', { className: `text-sm ${theme.textSecondary}` },
              `${formatDate(service.date)} • ${formatTime(service.startTime)}`
            )
          )
        ),

        // Badges y detalles
        e('div', { className: "flex items-center gap-2 flex-wrap" },
          getPlatformBadge(service.platform),
          service.isArticulated && e('span', {
            key: 'articulated',
            className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
          }, '🚌 Articulado'),
          service.commission && e('span', {
            key: 'commission',
            className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
          }, `Comisión: ${service.commission.toFixed(2)}€`),
          (service.incentives || service.tips) && e('span', {
            key: 'extras',
            className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
          }, `Extras: ${((service.incentives || 0) + (service.tips || 0)).toFixed(2)}€`)
        )
      ),

      // Acciones
      e('div', { className: "flex items-center gap-2 ml-4" },
        e('button', {
          onClick: onEdit,
          className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
          title: "Editar servicio"
        }, '✏️'),
        e('button', {
          onClick: onDelete,
          className: "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
          title: "Eliminar servicio"
        }, '🗑️')
      )
    )
  );
}

/**
 * Modal para formulario de servicio
 */
function ServiceFormModal({ theme, service, onSave, onCancel }) {
  const { useState, useEffect, createElement: e } = React;

  // Estados del formulario
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    totalAmount: '',
    paymentType: 'cash',
    platform: 'other',
    isArticulated: false,
    commission: '',
    incentives: '',
    tips: '',
    commissionPaidBy: 'shared'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar formulario con datos del servicio si está editando
  useEffect(() => {
    if (service) {
      setFormData({
        date: service.date ? new Date(service.date).toISOString().split('T')[0] : '',
        startTime: service.startTime || '',
        totalAmount: service.totalAmount?.toString() || '',
        paymentType: service.paymentType || 'cash',
        platform: service.platform || 'other',
        isArticulated: service.isArticulated || false,
        commission: service.commission?.toString() || '',
        incentives: service.incentives?.toString() || '',
        tips: service.tips?.toString() || '',
        commissionPaidBy: service.commissionPaidBy || 'shared'
      });
    } else {
      // Valores por defecto para nuevo servicio
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().slice(0, 5);
      setFormData(prev => ({
        ...prev,
        date: today,
        startTime: now
      }));
    }
  }, [service]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Fecha obligatoria
    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria';
    }

    // Monto obligatorio y válido
    if (!formData.totalAmount) {
      newErrors.totalAmount = 'El importe es obligatorio';
    } else {
      const amount = parseFloat(formData.totalAmount);
      if (isNaN(amount) || amount < 0) {
        newErrors.totalAmount = 'El importe debe ser un número positivo';
      } else if (amount > 1000) {
        newErrors.totalAmount = 'El importe no puede superar los 1000€';
      }
    }

    // Tipo de pago obligatorio
    if (!formData.paymentType) {
      newErrors.paymentType = 'El tipo de pago es obligatorio';
    }

    // Validar campos numéricos opcionales
    ['commission', 'incentives', 'tips'].forEach(field => {
      if (formData[field] && formData[field] !== '') {
        const value = parseFloat(formData[field]);
        if (isNaN(value) || value < 0) {
          newErrors[field] = 'Debe ser un número positivo';
        }
      }
    });

    // Si es app, debe tener plataforma
    if (formData.paymentType === 'app' && (!formData.platform || formData.platform === 'other')) {
      newErrors.platform = 'Debe especificar la plataforma para pagos por aplicación';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para guardar
      const serviceData = {
        date: new Date(formData.date),
        startTime: formData.startTime,
        totalAmount: parseFloat(formData.totalAmount),
        paymentType: formData.paymentType,
        platform: formData.platform === 'other' ? undefined : formData.platform,
        isArticulated: formData.isArticulated,
        commission: formData.commission ? parseFloat(formData.commission) : undefined,
        incentives: formData.incentives ? parseFloat(formData.incentives) : undefined,
        tips: formData.tips ? parseFloat(formData.tips) : undefined,
        commissionPaidBy: formData.commissionPaidBy
      };

      onSave(serviceData);
    } catch (error) {
      console.error('Error guardando servicio:', error);
      setErrors({ submit: 'Error guardando el servicio. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return e('div', { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" },
    e('div', { className: `${theme.card} rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto` },
      // Header
      e('div', { className: "p-6 border-b border-gray-200" },
        e('h3', { className: "text-xl font-bold" },
          service ? 'Editar Servicio' : 'Nuevo Servicio'
        )
      ),

      // Formulario
      e('form', { onSubmit: handleSubmit, className: "p-6 space-y-4" },
        // Fecha y hora
        e('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          e(FormField, {
            label: "Fecha",
            type: "date",
            value: formData.date,
            onChange: (value) => handleChange('date', value),
            error: errors.date,
            required: true,
            theme: theme
          }),
          e(FormField, {
            label: "Hora de inicio",
            type: "time",
            value: formData.startTime,
            onChange: (value) => handleChange('startTime', value),
            error: errors.startTime,
            theme: theme
          })
        ),

        // Importe
        e(FormField, {
          label: "Importe total",
          type: "number",
          step: "0.01",
          min: "0",
          max: "1000",
          value: formData.totalAmount,
          onChange: (value) => handleChange('totalAmount', value),
          error: errors.totalAmount,
          required: true,
          theme: theme,
          suffix: "€"
        }),

        // Tipo de pago y plataforma
        e('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          e('div', null,
            e('label', { className: "block text-sm font-medium mb-2" }, 'Tipo de pago *'),
            e('select', {
              value: formData.paymentType,
              onChange: (e) => handleChange('paymentType', e.target.value),
              className: `w-full px-3 py-2 border ${errors.paymentType ? 'border-red-500' : theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
            },
              e('option', { value: 'cash' }, '💵 Efectivo'),
              e('option', { value: 'card' }, '💳 Tarjeta'),
              e('option', { value: 'app' }, '📱 Aplicación')
            ),
            errors.paymentType && e('p', { className: "text-red-500 text-sm mt-1" }, errors.paymentType)
          ),

          formData.paymentType === 'app' && e('div', null,
            e('label', { className: "block text-sm font-medium mb-2" }, 'Plataforma'),
            e('select', {
              value: formData.platform,
              onChange: (e) => handleChange('platform', e.target.value),
              className: `w-full px-3 py-2 border ${errors.platform ? 'border-red-500' : theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
            },
              e('option', { value: 'other' }, 'Otra'),
              e('option', { value: 'freenow' }, 'Freenow'),
              e('option', { value: 'uber' }, 'Uber'),
              e('option', { value: 'cabify' }, 'Cabify')
            ),
            errors.platform && e('p', { className: "text-red-500 text-sm mt-1" }, errors.platform)
          )
        ),

        // Checkbox articulado
        e('div', { className: "flex items-center gap-3" },
          e('input', {
            type: 'checkbox',
            id: 'isArticulated',
            checked: formData.isArticulated,
            onChange: (e) => handleChange('isArticulated', e.target.checked),
            className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          }),
          e('label', { htmlFor: 'isArticulated', className: "text-sm font-medium" },
            '🚌 Servicio articulado'
          )
        ),

        // Campos adicionales para aplicaciones
        (formData.paymentType === 'app' || formData.platform === 'freenow') && e('div', null,
          e('h4', { className: "font-medium mb-3" }, 'Información adicional'),
          e('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
            e(FormField, {
              label: "Comisión",
              type: "number",
              step: "0.01",
              min: "0",
              value: formData.commission,
              onChange: (value) => handleChange('commission', value),
              error: errors.commission,
              theme: theme,
              suffix: "€"
            }),
            e(FormField, {
              label: "Incentivos",
              type: "number",
              step: "0.01",
              min: "0",
              value: formData.incentives,
              onChange: (value) => handleChange('incentives', value),
              error: errors.incentives,
              theme: theme,
              suffix: "€"
            }),
            e(FormField, {
              label: "Propinas",
              type: "number",
              step: "0.01",
              min: "0",
              value: formData.tips,
              onChange: (value) => handleChange('tips', value),
              error: errors.tips,
              theme: theme,
              suffix: "€"
            })
          ),
          formData.commission > 0 && e('div', { className: "mt-4" },
            e('label', { className: "block text-sm font-medium mb-2" }, 'Comisión pagada por:'),
            e('div', { className: "flex gap-2" },
              [
                { id: 'shared', label: 'Compartido', icon: '⚖️' },
                { id: 'driver', label: 'Taxista', icon: '🚕' },
                { id: 'owner', label: 'Patrón', icon: '👤' }
              ].map(payer =>
                e('button', {
                  key: payer.id,
                  type: 'button',
                  onClick: () => handleChange('commissionPaidBy', payer.id),
                  className: `flex-1 flex flex-col items-center p-3 rounded-xl border transition-all ${formData.commissionPaidBy === payer.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : `border-slate-200 ${theme.card} opacity-60`
                    }`
                },
                  e('span', { className: "text-lg mb-1" }, payer.icon),
                  e('span', { className: "text-[10px] font-bold uppercase tracking-tight" }, payer.label)
                )
              )
            )
          )
        ),

        // Error general
        errors.submit && e('div', { className: "p-3 bg-red-50 border border-red-200 rounded-lg" },
          e('p', { className: "text-red-600 text-sm" }, errors.submit)
        )
      ),

      // Footer con botones
      e('div', { className: "p-6 border-t border-gray-200 flex justify-end gap-3" },
        e('button', {
          type: 'button',
          onClick: onCancel,
          disabled: isSubmitting,
          className: "px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
        }, 'Cancelar'),
        e('button', {
          type: 'submit',
          onClick: handleSubmit,
          disabled: isSubmitting,
          className: "px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
        },
          isSubmitting && e('div', { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }),
          service ? 'Actualizar' : 'Guardar'
        )
      )
    )
  );
}

/**
 * Componente reutilizable para campos de formulario
 */
function FormField({ label, type, value, onChange, error, required, theme, suffix, ...props }) {
  const { createElement: e } = React;

  return e('div', null,
    e('label', { className: "block text-sm font-medium mb-2" },
      label,
      required && e('span', { className: "text-red-500 ml-1" }, '*')
    ),
    e('div', { className: "relative" },
      e('input', {
        type: type,
        value: value,
        onChange: (e) => onChange(e.target.value),
        className: `w-full px-3 py-2 border ${error ? 'border-red-500' : theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${suffix ? 'pr-8' : ''}`,
        ...props
      }),
      suffix && e('span', { className: "absolute right-3 top-2 text-gray-500 text-sm" }, suffix)
    ),
    error && e('p', { className: "text-red-500 text-sm mt-1" }, error)
  );
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ServiceManager = ServiceManager;
}

// También exportar como módulo si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServiceManager;
}