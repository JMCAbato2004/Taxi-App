/**
 * Demo del componente ExpenseManager
 * Muestra el funcionamiento completo del gestor de gastos
 */

// Datos de ejemplo para gastos
const sampleExpenses = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    concept: 'Gasolina Shell',
    amount: 65.50,
    category: 'fuel'
  },
  {
    id: '2',
    date: new Date('2024-01-10'),
    concept: 'Cambio de aceite y filtros',
    amount: 85.00,
    category: 'maintenance'
  },
  {
    id: '3',
    date: new Date('2024-01-05'),
    concept: 'Seguro anual del vehículo',
    amount: 450.00,
    category: 'insurance'
  },
  {
    id: '4',
    date: new Date('2024-01-20'),
    concept: 'Lavado del coche',
    amount: 12.00,
    category: 'other'
  },
  {
    id: '5',
    date: new Date('2024-01-18'),
    concept: 'Gasolina BP',
    amount: 58.75,
    category: 'fuel'
  },
  {
    id: '6',
    date: new Date('2024-01-12'),
    concept: 'Revisión técnica',
    amount: 120.00,
    category: 'maintenance'
  },
  {
    id: '7',
    date: new Date('2024-01-08'),
    concept: 'Peaje autopista',
    amount: 8.50,
    category: 'other'
  },
  {
    id: '8',
    date: new Date('2024-01-22'),
    concept: 'Gasolina Repsol',
    amount: 72.30,
    category: 'fuel'
  },
  {
    id: '9',
    date: new Date('2024-01-14'),
    concept: 'Cambio de neumáticos',
    amount: 280.00,
    category: 'maintenance'
  },
  {
    id: '10',
    date: new Date('2024-01-25'),
    concept: 'Parking aeropuerto',
    amount: 15.00,
    category: 'other'
  }
];

/**
 * Componente principal del demo
 */
function ExpenseManagerDemo() {
  const { useState, createElement: e } = React;

  // Estado para los gastos
  const [expenses, setExpenses] = useState(sampleExpenses);

  // Tema por defecto
  const theme = {
    card: 'bg-white',
    border: 'border-gray-200',
    input: 'bg-white',
    textSecondary: 'text-gray-600'
  };

  // Handlers para CRUD de gastos
  const handleAddExpense = (expenseData) => {
    const newExpense = {
      id: Date.now().toString(),
      ...expenseData
    };
    setExpenses(prev => [newExpense, ...prev]);
    console.log('Gasto añadido:', newExpense);
  };

  const handleUpdateExpense = (id, expenseData) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...expenseData } : expense
    ));
    console.log('Gasto actualizado:', id, expenseData);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    console.log('Gasto eliminado:', id);
  };

  // Estadísticas generales
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  return e('div', { className: "min-h-screen bg-gray-50 p-4" },
    e('div', { className: "max-w-7xl mx-auto space-y-6" },
      // Header del demo
      e('div', { className: "bg-white rounded-xl p-6 border border-gray-200" },
        e('div', { className: "text-center mb-6" },
          e('h1', { className: "text-3xl font-bold text-gray-900 mb-2" }, 
            '💰 Demo ExpenseManager'
          ),
          e('p', { className: "text-gray-600" }, 
            'Demostración completa del componente de gestión de gastos'
          )
        ),

        // Estadísticas del demo
        e('div', { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" },
          e('div', { className: "text-center p-4 bg-red-50 rounded-lg" },
            e('div', { className: "text-2xl font-bold text-red-600" }, totalExpenses),
            e('div', { className: "text-sm text-red-700" }, 'Total Gastos')
          ),
          e('div', { className: "text-center p-4 bg-red-50 rounded-lg" },
            e('div', { className: "text-2xl font-bold text-red-600" }, `${totalAmount.toFixed(2)}€`),
            e('div', { className: "text-sm text-red-700" }, 'Importe Total')
          ),
          e('div', { className: "text-center p-4 bg-red-50 rounded-lg" },
            e('div', { className: "text-2xl font-bold text-red-600" }, `${averageExpense.toFixed(2)}€`),
            e('div', { className: "text-sm text-red-700" }, 'Promedio')
          ),
          e('div', { className: "text-center p-4 bg-red-50 rounded-lg" },
            e('div', { className: "text-2xl font-bold text-red-600" }, Object.keys(categoryTotals).length),
            e('div', { className: "text-sm text-red-700" }, 'Categorías')
          )
        ),

        // Desglose por categorías
        e('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
          Object.entries(categoryTotals).map(([category, amount]) => {
            const categoryInfo = {
              fuel: { name: 'Combustible', icon: '⛽', color: 'yellow' },
              maintenance: { name: 'Mantenimiento', icon: '🔧', color: 'blue' },
              insurance: { name: 'Seguro', icon: '🛡️', color: 'green' },
              other: { name: 'Otros', icon: '📋', color: 'gray' }
            };
            
            const info = categoryInfo[category] || { name: category, icon: '❓', color: 'gray' };
            
            return e('div', { 
              key: category,
              className: `text-center p-3 bg-${info.color}-50 rounded-lg border border-${info.color}-200`
            },
              e('div', { className: "text-xl mb-1" }, info.icon),
              e('div', { className: `text-lg font-bold text-${info.color}-600` }, `${amount.toFixed(2)}€`),
              e('div', { className: `text-sm text-${info.color}-700` }, info.name)
            );
          })
        )
      ),

      // Componente ExpenseManager
      e(ExpenseManager, {
        theme: theme,
        expenses: expenses,
        onAdd: handleAddExpense,
        onUpdate: handleUpdateExpense,
        onDelete: handleDeleteExpense
      }),

      // Información adicional
      e('div', { className: "bg-white rounded-xl p-6 border border-gray-200" },
        e('h3', { className: "text-lg font-bold mb-4" }, '📋 Funcionalidades Implementadas'),
        e('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          e('div', null,
            e('h4', { className: "font-semibold mb-2 text-green-600" }, '✅ CRUD Completo'),
            e('ul', { className: "text-sm text-gray-600 space-y-1" },
              e('li', null, '• Crear nuevos gastos'),
              e('li', null, '• Editar gastos existentes'),
              e('li', null, '• Eliminar gastos con confirmación'),
              e('li', null, '• Validación de formularios')
            )
          ),
          e('div', null,
            e('h4', { className: "font-semibold mb-2 text-green-600" }, '✅ Filtros y Búsqueda'),
            e('ul', { className: "text-sm text-gray-600 space-y-1" },
              e('li', null, '• Búsqueda por concepto e importe'),
              e('li', null, '• Filtro por categoría'),
              e('li', null, '• Filtro por rango de fechas'),
              e('li', null, '• Ordenación múltiple')
            )
          ),
          e('div', null,
            e('h4', { className: "font-semibold mb-2 text-green-600" }, '✅ Estadísticas'),
            e('ul', { className: "text-sm text-gray-600 space-y-1" },
              e('li', null, '• Totales por categoría'),
              e('li', null, '• Contadores dinámicos'),
              e('li', null, '• Estadísticas filtradas'),
              e('li', null, '• Indicadores visuales')
            )
          ),
          e('div', null,
            e('h4', { className: "font-semibold mb-2 text-green-600" }, '✅ Interfaz'),
            e('ul', { className: "text-sm text-gray-600 space-y-1" },
              e('li', null, '• Diseño responsivo'),
              e('li', null, '• Modal para formularios'),
              e('li', null, '• Iconos por categoría'),
              e('li', null, '• Filtros rápidos de fecha')
            )
          )
        )
      ),

      // Datos de prueba
      e('div', { className: "bg-white rounded-xl p-6 border border-gray-200" },
        e('h3', { className: "text-lg font-bold mb-4" }, '🧪 Datos de Prueba'),
        e('p', { className: "text-gray-600 mb-4" }, 
          'El demo incluye 10 gastos de ejemplo distribuidos en diferentes categorías y fechas para probar todas las funcionalidades.'
        ),
        e('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" },
          e('div', null,
            e('h4', { className: "font-semibold mb-2" }, 'Categorías incluidas:'),
            e('ul', { className: "text-gray-600 space-y-1" },
              e('li', null, '⛽ Combustible (3 gastos)'),
              e('li', null, '🔧 Mantenimiento (3 gastos)'),
              e('li', null, '🛡️ Seguro (1 gasto)'),
              e('li', null, '📋 Otros (3 gastos)')
            )
          ),
          e('div', null,
            e('h4', { className: "font-semibold mb-2" }, 'Rangos de importes:'),
            e('ul', { className: "text-gray-600 space-y-1" },
              e('li', null, '• Desde 8,50€ (peaje)'),
              e('li', null, '• Hasta 450€ (seguro)'),
              e('li', null, '• Promedio: ' + averageExpense.toFixed(2) + '€'),
              e('li', null, '• Total: ' + totalAmount.toFixed(2) + '€')
            )
          )
        )
      )
    )
  );
}

// Renderizar el demo
if (typeof window !== 'undefined' && window.React && window.ReactDOM) {
  const container = document.getElementById('expense-manager-demo');
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(ExpenseManagerDemo));
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ExpenseManagerDemo = ExpenseManagerDemo;
}