/**
 * ExpenseManager Simplificado - Versión mínima para depuración
 * Implementa funcionalidad básica de gestión de gastos
 */

console.log('📄 Cargando expense-manager-simple.js');

/**
 * Componente simplificado para gestión de gastos
 */
function ExpenseManagerSimple({ theme, expenses, onAdd, onUpdate, onDelete }) {
  const { useState, createElement: e } = React;

  // Estados básicos
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Handlers básicos
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

  // Estadísticas básicas
  const stats = {
    total: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    fuel: expenses.filter(e => e.category === 'fuel').length,
    maintenance: expenses.filter(e => e.category === 'maintenance').length,
    insurance: expenses.filter(e => e.category === 'insurance').length,
    other: expenses.filter(e => e.category === 'other').length
  };

  return e('div', { className: "space-y-6" },
    // Header simplificado
    e('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
      e('div', { className: "flex justify-between items-start mb-4" },
        e('div', null,
          e('h2', { className: "text-2xl font-bold mb-2" }, '💰 Gestión de Gastos (Simple)'),
          e('p', { className: theme.textSecondary }, 'Versión simplificada para depuración')
        ),
        e('button', {
          onClick: () => setShowForm(true),
          className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
        }, '+ Nuevo Gasto')
      ),

      // Estadísticas básicas
      e('div', { className: "grid grid-cols-2 md:grid-cols-6 gap-4" },
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
          e('div', { className: "text-2xl mb-1" }, '⛽'),
          e('div', { className: "text-lg font-bold" }, stats.fuel),
          e('div', { className: `text-sm ${theme.textSecondary}` }, 'Combustible')
        ),
        e('div', { className: "text-center" },
          e('div', { className: "text-2xl mb-1" }, '🔧'),
          e('div', { className: "text-lg font-bold" }, stats.maintenance),
          e('div', { className: `text-sm ${theme.textSecondary}` }, 'Mantenimiento')
        ),
        e('div', { className: "text-center" },
          e('div', { className: "text-2xl mb-1" }, '🛡️'),
          e('div', { className: "text-lg font-bold" }, stats.insurance),
          e('div', { className: `text-sm ${theme.textSecondary}` }, 'Seguro')
        ),
        e('div', { className: "text-center" },
          e('div', { className: "text-2xl mb-1" }, '📋'),
          e('div', { className: "text-lg font-bold" }, stats.other),
          e('div', { className: `text-sm ${theme.textSecondary}` }, 'Otros')
        )
      )
    ),

    // Formulario simplificado
    showForm && e(SimpleExpenseForm, {
      theme: theme,
      expense: editingExpense,
      onSave: editingExpense ? handleUpdateExpense : handleAddExpense,
      onCancel: handleCancelEdit
    }),

    // Lista simplificada
    e('div', { className: `${theme.card} rounded-xl border ${theme.border} overflow-hidden` },
      e('div', { className: "p-4 border-b border-gray-200" },
        e('h3', { className: "font-semibold" }, `Gastos (${expenses.length})`)
      ),

      expenses.length === 0 ? (
        e('div', { className: "p-8 text-center" },
          e('div', { className: "text-4xl mb-4" }, '📭'),
          e('p', { className: theme.textSecondary }, 'No hay gastos registrados')
        )
      ) : (
        e('div', { className: "divide-y divide-gray-200" },
          expenses.map(expense =>
            e(SimpleExpenseItem, {
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
 * Formulario simplificado de gasto
 */
function SimpleExpenseForm({ theme, expense, onSave, onCancel }) {
  const { useState, useEffect, createElement: e } = React;

  const [formData, setFormData] = useState({
    date: '',
    concept: '',
    amount: '',
    category: 'fuel'
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        concept: expense.concept || '',
        amount: expense.amount?.toString() || '',
        category: expense.category || 'fuel'
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, date: today }));
    }
  }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.concept || !formData.amount) {
      alert('Fecha, concepto e importe son obligatorios');
      return;
    }

    const expenseData = {
      date: new Date(formData.date),
      concept: formData.concept.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category
    };

    onSave(expenseData);
  };

  return e('div', { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" },
    e('div', { className: `${theme.card} rounded-xl max-w-md w-full` },
      e('div', { className: "p-6 border-b border-gray-200" },
        e('h3', { className: "text-xl font-bold" }, expense ? 'Editar Gasto' : 'Nuevo Gasto')
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
          e('label', { className: "block text-sm font-medium mb-2" }, 'Concepto *'),
          e('input', {
            type: 'text',
            placeholder: 'Ej: Gasolina, Cambio de aceite...',
            value: formData.concept,
            onChange: (e) => setFormData(prev => ({ ...prev, concept: e.target.value })),
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
            value: formData.amount,
            onChange: (e) => setFormData(prev => ({ ...prev, amount: e.target.value })),
            className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`,
            required: true
          })
        ),

        e('div', null,
          e('label', { className: "block text-sm font-medium mb-2" }, 'Categoría'),
          e('select', {
            value: formData.category,
            onChange: (e) => setFormData(prev => ({ ...prev, category: e.target.value })),
            className: `w-full px-3 py-2 border ${theme.border} rounded-lg ${theme.input}`
          },
            e('option', { value: 'fuel' }, '⛽ Combustible'),
            e('option', { value: 'maintenance' }, '🔧 Mantenimiento'),
            e('option', { value: 'insurance' }, '🛡️ Seguro'),
            e('option', { value: 'other' }, '📋 Otros')
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
          className: "px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
        }, expense ? 'Actualizar' : 'Guardar')
      )
    )
  );
}

/**
 * Item simplificado de gasto
 */
function SimpleExpenseItem({ expense, theme, onEdit, onDelete }) {
  const { createElement: e } = React;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES');
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

  return e('div', { className: "p-4 hover:bg-gray-50 transition-colors" },
    e('div', { className: "flex items-center justify-between" },
      e('div', { className: "flex items-center gap-3" },
        e('span', { className: "text-2xl" }, getCategoryIcon(expense.category)),
        e('div', null,
          e('div', { className: "font-semibold text-lg" }, `${expense.amount.toFixed(2)}€`),
          e('div', { className: "font-medium" }, expense.concept),
          e('div', { className: `text-sm ${theme.textSecondary}` }, formatDate(expense.date))
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
  window.ExpenseManagerSimple = ExpenseManagerSimple;
  console.log('✅ ExpenseManagerSimple exportado globalmente');
}

console.log('📄 expense-manager-simple.js cargado completamente');