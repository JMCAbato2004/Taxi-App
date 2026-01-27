/**
 * ServiceManager Simplificado - Versión mínima para depuración
 * Implementa funcionalidad básica de gestión de servicios
 */

console.log('📄 Cargando service-manager-simple.js');

/**
 * Componente simplificado para gestión de servicios
 */
function ServiceManagerSimple({ theme, services, onAdd, onUpdate, onDelete }) {
  const { useState, createElement: e } = React;

  // Estados básicos
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Handlers básicos
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

  // Estadísticas básicas
  const stats = {
    total: services.length,
    totalAmount: services.reduce((sum, s) => sum + s.totalAmount, 0),
    cash: services.filter(s => s.paymentType === 'cash').length,
    card: services.filter(s => s.paymentType === 'card').length,
    app: services.filter(s => s.paymentType === 'app').length
  };

  return e('div', { className: "space-y-6" },
    // Header simplificado
    e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
      e('div', { className: "flex justify-between items-start mb-4" },
        e('div', null,
          e('h2', { className: "text-2xl font-bold mb-2" }, '🚕 Gestión de Servicios (Simple)'),
          e('p', { className: theme.textSecondary }, 'Versión simplificada para depuración')
        ),
        e('button', {
          onClick: () => setShowForm(true),
          className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
        }, '+ Nuevo Servicio')
      ),

      // Estadísticas básicas
      e('div', { className: "grid grid-cols-2 md:grid-cols-5 gap-4" },
        e('div', { className: "text-center" },
          e('div', { className: "text-2xl mb-1" }, '📊'),
          e('div', { className: "text-lg font-bold" }, stats.total),
          e('div', { className: `text-sm ${theme.textSecondary}` }, 'Total')
        ),
        e('div', { className: "text-center" },
          e('div', { className: "text-2xl mb-1" }, '💰'),
          e('div', { className: "text-lg font-bold" }, `${stats.totalAmount.toFixed(2)}€`),
          e('div', { className: `text-sm ${theme.textSecondary}` }, 'Importe')
        ),
        e('div', { className: "text-center" },
          e('div', { className: "text-2xl mb-1" }, '💵'),
          e('div', { className: "text-lg font-bold" }, stats.cash),
          e('div', { className: `text-sm ${theme.textSecondary}` }, 'Efectivo')
        ),
        e('div', { className: "text-center" },
          e('div', { className: "text-2xl mb-1" }, '💳'),
          e('div', { className: "text-lg font-bold" }, stats.card),
          e('div', { className: `text-sm ${theme.textSecondary}` }, 'Tarjeta')
        ),
        e('div', { className: "text-center" },
          e('div', { className: "text-2xl mb-1" }, '📱'),
          e('div', { className: "text-lg font-bold" }, stats.app),
          e('div', { className: `text-sm ${theme.textSecondary}` }, 'App')
        )
      )
    ),

    // Formulario simplificado
    showForm && e(SimpleServiceForm, {
      theme: theme,
      service: editingService,
      onSave: editingService ? handleUpdateService : handleAddService,
      onCancel: handleCancelEdit
    }),

    // Lista simplificada
    e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
      e('div', { className: "p-4 border-b border-gray-200" },
        e('h3', { className: "font-semibold" }, `Servicios (${services.length})`)
      ),

      services.length === 0 ? (
        e('div', { className: "p-8 text-center" },
          e('div', { className: "text-4xl mb-4" }, '📭'),
          e('p', { className: theme.textSecondary }, 'No hay servicios registrados')
        )
      ) : (
        e('div', { className: "divide-y divide-gray-200" },
          services.map(service =>
            e(SimpleServiceItem, {
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
 * Formulario simplificado de servicio
 */
function SimpleServiceForm({ theme, service, onSave, onCancel }) {
  const { useState, useEffect, createElement: e } = React;

  const [formData, setFormData] = useState({
    date: '',
    totalAmount: '',
    paymentType: 'cash',
    platform: 'street',
    commission: '',
    tips: ''
  });

  useEffect(() => {
    if (service) {
      setFormData({
        date: service.date ? new Date(service.date).toISOString().split('T')[0] : '',
        totalAmount: service.totalAmount?.toString() || '',
        paymentType: service.paymentType || 'cash',
        platform: service.platform || 'street',
        commission: service.commission?.toString() || '',
        tips: service.tips?.toString() || ''
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, date: today, platform: 'street' }));
    }
  }, [service]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.totalAmount) {
      alert('Fecha e importe son obligatorios');
      return;
    }

    const serviceData = {
      date: new Date(formData.date),
      totalAmount: parseFloat(formData.totalAmount),
      paymentType: formData.paymentType,
      platform: formData.platform,
      commission: formData.commission ? parseFloat(formData.commission) : 0,
      tips: formData.tips ? parseFloat(formData.tips) : 0
    };

    onSave(serviceData);
  };

  return e('div', { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" },
    e('div', { className: `${theme.card} rounded-xl max-w-md w-full` },
      e('div', { className: "p-6 border-b border-gray-200" },
        e('h3', { className: "text-xl font-bold" }, service ? 'Editar Servicio' : 'Nuevo Servicio')
      ),

      e('form', { onSubmit: handleSubmit, className: "p-6 space-y-4" },
        e('div', null,
          e('label', { className: "block text-sm font-medium mb-2" }, 'Fecha *'),
          e('input', {
            type: 'date',
            value: formData.date,
            onChange: (e) => setFormData(prev => ({ ...prev, date: e.target.value })),
            className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`,
            required: true
          })
        ),

        e('div', null,
          e('label', { className: "block text-sm font-medium mb-2" }, 'Importe *'),
          e('input', {
            type: 'number',
            step: '0.01',
            min: '0',
            value: formData.totalAmount,
            onChange: (e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value })),
            className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`,
            required: true
          })
        ),

        e('div', null,
          e('label', { className: "block text-sm font-medium mb-2" }, 'Tipo de pago'),
          e('select', {
            value: formData.paymentType,
            onChange: (e) => setFormData(prev => ({ ...prev, paymentType: e.target.value })),
            className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`
          },
            e('option', { value: 'cash' }, '💵 Efectivo'),
            e('option', { value: 'card' }, '💳 Tarjeta'),
            e('option', { value: 'app' }, '📱 Aplicación')
          )
        ),

        e('div', null,
          e('label', { className: "block text-sm font-medium mb-2" }, 'Plataforma'),
          e('select', {
            value: formData.platform,
            onChange: (e) => setFormData(prev => ({ ...prev, platform: e.target.value })),
            className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`
          },
            e('option', { value: 'street' }, '🚕 Calle'),
            e('option', { value: 'radio' }, '📻 Emisora'),
            e('option', { value: 'freenow' }, '📱 Freenow'),
            e('option', { value: 'uber' }, '📱 Uber'),
            e('option', { value: 'cabify' }, '📱 Cabify'),
            e('option', { value: 'other' }, '❓ Otra')
          )
        ),

        e('div', { className: "grid grid-cols-2 gap-4" },
          e('div', null,
            e('label', { className: "block text-sm font-medium mb-2" }, 'Comisión (€)'),
            e('input', {
              type: 'number',
              step: '0.01',
              min: '0',
              value: formData.commission,
              onChange: (e) => setFormData(prev => ({ ...prev, commission: e.target.value })),
              className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`,
              placeholder: '0.00'
            })
          ),
          e('div', null,
            e('label', { className: "block text-sm font-medium mb-2" }, 'Propina (€)'),
            e('input', {
              type: 'number',
              step: '0.01',
              min: '0',
              value: formData.tips,
              onChange: (e) => setFormData(prev => ({ ...prev, tips: e.target.value })),
              className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`,
              placeholder: '0.00'
            })
          )
        )
      ),

      e('div', { className: "p-6 border-t border-gray-200 flex justify-end gap-3" },
        e('button', {
          type: 'button',
          onClick: onCancel,
          className: "px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
        }, 'Cancelar'),
        e('button', {
          type: 'submit',
          onClick: handleSubmit,
          className: "px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
        }, service ? 'Actualizar' : 'Guardar')
      )
    )
  );
}

/**
 * Item simplificado de servicio
 */
function SimpleServiceItem({ service, theme, onEdit, onDelete }) {
  const { createElement: e } = React;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'street': return '🚕';
      case 'radio': return '📻';
      case 'freenow': return '📱';
      case 'uber': return '📱';
      case 'cabify': return '📱';
      default: return '❓';
    }
  };

  const getPlatformName = (platform) => {
    switch (platform) {
      case 'street': return 'Calle';
      case 'radio': return 'Emisora';
      case 'freenow': return 'Freenow';
      case 'uber': return 'Uber';
      case 'cabify': return 'Cabify';
      default: return 'Otra';
    }
  };

  return e('div', { className: "p-4 hover:bg-gray-50 transition-colors" },
    e('div', { className: "flex items-center justify-between" },
      e('div', { className: "flex items-center gap-3" },
        e('span', { className: "text-2xl" }, getPlatformIcon(service.platform)),
        e('div', null,
          e('div', { className: "font-semibold text-lg" }, `${service.totalAmount.toFixed(2)}€`),
          e('div', { className: `text-sm ${theme.textSecondary} flex items-center gap-2` }, 
            formatDate(service.date),
            e('span', null, '•'),
            getPlatformName(service.platform),
            (service.commission > 0 || service.tips > 0) && e('span', null, '•'),
            service.commission > 0 && e('span', { className: "text-red-600" }, `Com: -${service.commission.toFixed(2)}€`),
            service.tips > 0 && e('span', { className: "text-green-600" }, `Prop: +${service.tips.toFixed(2)}€`)
          )
        )
      ),
      e('div', { className: "flex items-center gap-2" },
        e('button', {
          onClick: onEdit,
          className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg",
          title: "Editar"
        }, '✏️'),
        e('button', {
          onClick: onDelete,
          className: "p-2 text-red-600 hover:bg-red-50 rounded-lg",
          title: "Eliminar"
        }, '🗑️')
      )
    )
  );
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.ServiceManagerSimple = ServiceManagerSimple;
  console.log('✅ ServiceManagerSimple exportado globalmente');
}

console.log('📄 service-manager-simple.js cargado completamente');