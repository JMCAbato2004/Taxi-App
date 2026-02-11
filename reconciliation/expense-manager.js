/**
 * Componente ExpenseManager para gestión CRUD de gastos del vehículo
 * Implementa formulario de registro, lista con edición/eliminación y validaciones
 * Requerimientos: 4.1, 4.2
 */

/**
 * Componente principal para gestión de gastos
 */
function ExpenseManager({ theme, expenses, onAdd, onUpdate, onDelete }) {
  const { useState, useEffect, createElement: e } = React;

  // Estados del componente
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filtrar y ordenar gastos
  const filteredExpenses = expenses
    .filter(expense => {
      // Filtro por término de búsqueda
      const matchesSearch = !searchTerm ||
        expense.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.amount.toString().includes(searchTerm);

      // Filtro por categoría
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;

      // Filtro por rango de fechas
      const expenseDate = new Date(expense.date);
      const matchesDateFrom = !dateFrom || expenseDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || expenseDate <= new Date(dateTo);

      return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'concept':
          aValue = a.concept.toLowerCase();
          bValue = b.concept.toLowerCase();
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
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
  const handleAddExpense = (expenseData) => {
    onAdd(expenseData);
    setShowForm(false);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleUpdateExpense = (expenseData) => {
    onUpdate(editingExpense.id, expenseData);
    setEditingExpense(null);
    setShowForm(false);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setShowForm(false);
  };

  const handleDeleteExpense = (expense) => {
    if (window.confirm(`¿Seguro que quieres eliminar el gasto "${expense.concept}" de ${expense.amount}€?`)) {
      onDelete(expense.id);
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

  // Estadísticas rápidas (basadas en gastos filtrados)
  const stats = {
    total: filteredExpenses.length,
    totalAmount: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    fuel: filteredExpenses.filter(e => e.category === 'fuel').length,
    maintenance: filteredExpenses.filter(e => e.category === 'maintenance').length,
    insurance: filteredExpenses.filter(e => e.category === 'insurance').length,
    other: filteredExpenses.filter(e => e.category === 'other').length
  };

  // Estadísticas por categoría (montos)
  const categoryStats = {
    fuel: filteredExpenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0),
    maintenance: filteredExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
    insurance: filteredExpenses.filter(e => e.category === 'insurance').reduce((sum, e) => sum + e.amount, 0),
    other: filteredExpenses.filter(e => e.category === 'other').reduce((sum, e) => sum + e.amount, 0)
  };

  // Estadísticas totales (sin filtros)
  const totalStats = {
    total: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0)
  };

  const hasActiveFilters = searchTerm || filterCategory !== 'all' || dateFrom || dateTo;

  return e('div', { className: "space-y-6" },
    // Header con estadísticas
    e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
      e('div', { className: "flex justify-between items-start mb-4" },
        e('div', null,
          e('h2', { className: "text-2xl font-bold mb-2" }, '💰 Gestión de Gastos'),
          e('p', { className: theme.textSecondary },
            'Registra y gestiona todos los gastos del vehículo'
          )
        ),
        e('button', {
          onClick: () => setShowForm(true),
          className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
        },
          e('span', null, '+'),
          e('span', null, 'Nuevo Gasto')
        )
      ),

      // Estadísticas rápidas
      e('div', null,
        hasActiveFilters && e('div', { className: "mb-3 p-2 bg-red-50 border border-red-200 rounded-lg" },
          e('p', { className: "text-sm text-red-700" },
            `📊 Mostrando ${stats.total} de ${totalStats.total} gastos (${stats.totalAmount.toFixed(2)}€ de ${totalStats.totalAmount.toFixed(2)}€)`
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
            label: "Combustible",
            value: stats.fuel,
            theme: theme,
            icon: "⛽",
            subtitle: `${categoryStats.fuel.toFixed(2)}€`
          }),
          e(StatCard, {
            label: "Mantenimiento",
            value: stats.maintenance,
            theme: theme,
            icon: "🔧",
            subtitle: `${categoryStats.maintenance.toFixed(2)}€`
          }),
          e(StatCard, {
            label: "Seguro",
            value: stats.insurance,
            theme: theme,
            icon: "🛡️",
            subtitle: `${categoryStats.insurance.toFixed(2)}€`
          }),
          e(StatCard, {
            label: "Otros",
            value: stats.other,
            theme: theme,
            icon: "📋",
            subtitle: `${categoryStats.other.toFixed(2)}€`
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
              placeholder: 'Buscar por concepto o importe...',
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-red-500 focus:border-red-500`
            })
          ),

          // Filtro por categoría
          e('select', {
            value: filterCategory,
            onChange: (e) => setFilterCategory(e.target.value),
            className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-red-500 focus:border-red-500`
          },
            e('option', { value: 'all' }, 'Todas las categorías'),
            e('option', { value: 'fuel' }, '⛽ Combustible'),
            e('option', { value: 'maintenance' }, '🔧 Mantenimiento'),
            e('option', { value: 'insurance' }, '🛡️ Seguro'),
            e('option', { value: 'other' }, '📋 Otros')
          ),

          // Ordenar por
          e('select', {
            value: sortBy,
            onChange: (e) => setSortBy(e.target.value),
            className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-red-500 focus:border-red-500`
          },
            e('option', { value: 'date' }, 'Fecha'),
            e('option', { value: 'amount' }, 'Importe'),
            e('option', { value: 'concept' }, 'Concepto'),
            e('option', { value: 'category' }, 'Categoría')
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
                className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-red-500 focus:border-red-500`,
                placeholder: 'Desde'
              }),
              e('span', { className: theme.textSecondary }, 'hasta'),
              e('input', {
                type: 'date',
                value: dateTo,
                onChange: (e) => setDateTo(e.target.value),
                className: `px-3 py-2 border ${theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-red-500 focus:border-red-500`,
                placeholder: 'Hasta'
              })
            )
          ),

          // Botones de rango rápido
          e('div', { className: "flex flex-wrap gap-2" },
            e('button', {
              onClick: () => setDateRange(7),
              className: "px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            }, 'Últimos 7 días'),
            e('button', {
              onClick: () => setDateRange(30),
              className: "px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
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
          (searchTerm || filterCategory !== 'all' || dateFrom || dateTo) && e('button', {
            onClick: () => {
              setSearchTerm('');
              setFilterCategory('all');
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

    // Formulario de gasto (modal)
    showForm && e(ExpenseFormModal, {
      theme: theme,
      expense: editingExpense,
      onSave: editingExpense ? handleUpdateExpense : handleAddExpense,
      onCancel: handleCancelEdit
    }),

    // Lista de gastos
    e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
      e('div', { className: "p-4 border-b border-gray-200" },
        e('h3', { className: "font-semibold" },
          `Gastos (${filteredExpenses.length}${filteredExpenses.length !== expenses.length ? ` de ${expenses.length}` : ''})`
        )
      ),

      filteredExpenses.length === 0 ? (
        e('div', { className: "p-8 text-center" },
          e('div', { className: "text-4xl mb-4" }, '📭'),
          e('p', { className: theme.textSecondary },
            searchTerm || filterCategory !== 'all'
              ? 'No se encontraron gastos con los filtros aplicados'
              : 'No hay gastos registrados. ¡Añade el primero!'
          )
        )
      ) : (
        e('div', { className: "divide-y divide-gray-200" },
          filteredExpenses.map(expense =>
            e(ExpenseListItem, {
              key: expense.id,
              expense: expense,
              theme: theme,
              onEdit: () => handleEditExpense(expense),
              onDelete: () => handleDeleteExpense(expense)
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
function StatCard({ label, value, theme, icon, subtitle }) {
  const { createElement: e } = React;

  return e('div', { className: "text-center" },
    e('div', { className: "text-2xl mb-1" }, icon),
    e('div', { className: "text-lg font-bold" }, value),
    e('div', { className: `text-sm ${theme.textSecondary}` }, label),
    subtitle && e('div', { className: `text-xs ${theme.textSecondary} mt-1` }, subtitle)
  );
}

/**
 * Componente para elementos de la lista de gastos
 */
function ExpenseListItem({ expense, theme, onEdit, onDelete }) {
  const { createElement: e } = React;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'fuel': return '⛽';
      case 'maintenance': return '🔧';
      case 'insurance': return '🛡️';
      case 'other': return '📋';
      default: return '❓';
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'fuel': return 'Combustible';
      case 'maintenance': return 'Mantenimiento';
      case 'insurance': return 'Seguro';
      case 'other': return 'Otros';
      default: return 'Desconocido';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'fuel': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'insurance': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return e('div', { className: "p-4 hover:bg-gray-50 transition-colors" },
    e('div', { className: "flex items-center justify-between" },
      // Información principal
      e('div', { className: "flex-1" },
        e('div', { className: "flex items-center gap-3 mb-2" },
          e('span', { className: "text-2xl" }, getCategoryIcon(expense.category)),
          e('div', null,
            e('div', { className: "font-semibold text-lg" }, `${expense.amount.toFixed(2)}€`),
            e('div', { className: `text-sm ${theme.textSecondary}` },
              formatDate(expense.date)
            )
          )
        ),

        // Concepto y categoría
        e('div', { className: "mb-2" },
          e('p', { className: "font-medium" }, expense.concept),
          e('span', {
            className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`
          },
            getCategoryIcon(expense.category) + ' ' + getCategoryName(expense.category)
          )
        )
      ),

      // Acciones
      e('div', { className: "flex items-center gap-2 ml-4" },
        e('button', {
          onClick: onEdit,
          className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors",
          title: "Editar gasto"
        }, '✏️'),
        e('button', {
          onClick: onDelete,
          className: "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
          title: "Eliminar gasto"
        }, '🗑️')
      )
    )
  );
}

/**
 * Modal para formulario de gasto
 */
function ExpenseFormModal({ theme, expense, onSave, onCancel }) {
  const { useState, useEffect, createElement: e } = React;

  // Estados del formulario
  const [formData, setFormData] = useState({
    date: '',
    concept: '',
    amount: '',
    category: 'fuel',
    paidBy: 'shared'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar formulario con datos del gasto si está editando
  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        concept: expense.concept || '',
        amount: expense.amount?.toString() || '',
        category: expense.category || 'fuel',
        paidBy: expense.paidBy || 'shared'
      });
    } else {
      // Valores por defecto para nuevo gasto
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: today
      }));
    }
  }, [expense]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Fecha obligatoria
    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria';
    }

    // Concepto obligatorio
    if (!formData.concept) {
      newErrors.concept = 'El concepto es obligatorio';
    } else if (formData.concept.length < 3) {
      newErrors.concept = 'El concepto debe tener al menos 3 caracteres';
    } else if (formData.concept.length > 100) {
      newErrors.concept = 'El concepto no puede superar los 100 caracteres';
    }

    // Monto obligatorio y válido
    if (!formData.amount) {
      newErrors.amount = 'El importe es obligatorio';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount < 0) {
        newErrors.amount = 'El importe debe ser un número positivo';
      } else if (amount > 10000) {
        newErrors.amount = 'El importe no puede superar los 10.000€';
      }
    }

    // Categoría obligatoria
    if (!formData.category) {
      newErrors.category = 'La categoría es obligatoria';
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
      const expenseData = {
        date: new Date(formData.date),
        concept: formData.concept.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        paidBy: formData.paidBy
      };

      onSave(expenseData);
    } catch (error) {
      console.error('Error guardando gasto:', error);
      setErrors({ submit: 'Error guardando el gasto. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return e('div', { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" },
    e('div', { className: `${theme.card} rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto` },
      // Header
      e('div', { className: "p-6 border-b border-gray-200" },
        e('h3', { className: "text-xl font-bold" },
          expense ? 'Editar Gasto' : 'Nuevo Gasto'
        )
      ),

      // Formulario
      e('form', { onSubmit: handleSubmit, className: "p-6 space-y-4" },
        // Fecha
        e(FormField, {
          label: "Fecha",
          type: "date",
          value: formData.date,
          onChange: (value) => handleChange('date', value),
          error: errors.date,
          required: true,
          theme: theme
        }),

        // Concepto
        e(FormField, {
          label: "Concepto",
          type: "text",
          placeholder: "Ej: Gasolina, Cambio de aceite, Seguro anual...",
          value: formData.concept,
          onChange: (value) => handleChange('concept', value),
          error: errors.concept,
          required: true,
          theme: theme,
          maxLength: 100
        }),

        // Importe
        e(FormField, {
          label: "Importe",
          type: "number",
          step: "0.01",
          min: "0",
          max: "10000",
          value: formData.amount,
          onChange: (value) => handleChange('amount', value),
          error: errors.amount,
          required: true,
          theme: theme,
          suffix: "€"
        }),

        // Categoría
        e('div', null,
          e('label', { className: "block text-sm font-medium mb-2" }, 'Categoría *'),
          e('select', {
            value: formData.category,
            onChange: (e) => handleChange('category', e.target.value),
            className: `w-full px-3 py-2 border ${errors.category ? 'border-red-500' : theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-red-500 focus:border-red-500`
          },
            e('option', { value: 'fuel' }, '⛽ Combustible'),
            e('option', { value: 'maintenance' }, '🔧 Mantenimiento'),
            e('option', { value: 'insurance' }, '🛡️ Seguro'),
            e('option', { value: 'other' }, '📋 Otros')
          ),
          errors.category && e('p', { className: "text-red-500 text-sm mt-1" }, errors.category)
        ),

        // Aplicar a (Quién lo paga)
        e('div', null,
          e('label', { className: "block text-sm font-medium mb-2" }, 'Aplicar gasto a:'),
          e('div', { className: "flex gap-2" },
            [
              { id: 'shared', label: 'Compartido', icon: '⚖️' },
              { id: 'driver', label: 'Taxista', icon: '🚕' },
              { id: 'owner', label: 'Patrón', icon: '👤' }
            ].map(payer =>
              e('button', {
                key: payer.id,
                type: 'button',
                onClick: () => handleChange('paidBy', payer.id),
                className: `flex-1 flex flex-col items-center p-3 rounded-xl border transition-all ${formData.paidBy === payer.id
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : `border-slate-200 ${theme.card} opacity-60`
                  }`
              },
                e('span', { className: "text-lg mb-1" }, payer.icon),
                e('span', { className: "text-[10px] font-bold uppercase tracking-tight" }, payer.label)
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
          className: "px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
        },
          isSubmitting && e('div', { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }),
          expense ? 'Actualizar' : 'Guardar'
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
        className: `w-full px-3 py-2 border ${error ? 'border-red-500' : theme.border} rounded-lg ${theme.input} focus:ring-2 focus:ring-red-500 focus:border-red-500 ${suffix ? 'pr-8' : ''}`,
        ...props
      }),
      suffix && e('span', { className: "absolute right-3 top-2 text-gray-500 text-sm" }, suffix)
    ),
    error && e('p', { className: "text-red-500 text-sm mt-1" }, error)
  );
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ExpenseManager = ExpenseManager;
}

// También exportar como módulo si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExpenseManager;
}