// Importar React components
const { useState, useEffect } = React;

// Lucide Icons
const {
    Plus, DollarSign, TrendingUp, Receipt, Settings, 
    Sun, Moon, X, Pencil, Trash2, Download
} = lucide;

const PLATFORMS = ['Emisora', 'Calle', 'Uber', 'Freenow', 'Cabify', 'Bolt', 'DiDi', 'Otra'];
const DEFAULT_EXPENSE_CATEGORIES = ['Gasolina', 'Comida', 'Lavado', 'Peajes', 'Mantenimiento'];

function TaxiControlApp() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [view, setView] = useState('home');
  const [editingService, setEditingService] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(null);
  
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('services');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [expenseCategories, setExpenseCategories] = useState(() => {
    const saved = localStorage.getItem('expenseCategories');
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  // Manejar conectividad y offline manager
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Escuchar eventos del offline manager
    const handleOfflineManagerUpdate = (event) => {
      const { event: eventType, data } = event.detail;
      
      switch (eventType) {
        case 'sync_start':
          setSyncStatus('Sincronizando datos...');
          break;
        case 'sync_complete':
          setSyncStatus(`Sincronización completa: ${data.successful}/${data.total} elementos`);
          setTimeout(() => setSyncStatus(null), 3000);
          break;
        case 'sync_error':
          setSyncStatus(`Error de sincronización: ${data}`);
          setTimeout(() => setSyncStatus(null), 5000);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('offlineManagerUpdate', handleOfflineManagerUpdate);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offlineManagerUpdate', handleOfflineManagerUpdate);
    };
  }, []);

  // Función para mostrar notificaciones offline
  const showOfflineNotification = (message) => {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 left-4 right-4 bg-orange-600 text-white p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 -translate-y-full';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-xl">📡</div>
        <div class="flex-1">
          <div class="font-bold">Modo Offline</div>
          <div class="text-sm opacity-90">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.classList.remove('-translate-y-full');
    }, 100);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
      notification.classList.add('-translate-y-full');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  };

  const addService = (service) => {
    const newService = { ...service, id: Date.now() };
    
    if (navigator.onLine) {
      // Online: guardar directamente
      setServices([...services, newService]);
      setEditingService(null);
      setView('home');
    } else {
      // Offline: usar offline manager
      if (window.offlineManager) {
        window.offlineManager.saveOfflineData('service', newService, 'create');
        // Guardar localmente también para mostrar en la UI
        setServices([...services, newService]);
        setEditingService(null);
        setView('home');
        
        // Mostrar notificación offline
        showOfflineNotification('Servicio guardado offline. Se sincronizará cuando haya conexión.');
      }
    }
  };

  const updateService = (id, updatedService) => {
    const serviceWithId = { ...updatedService, id };
    
    if (navigator.onLine) {
      // Online: actualizar directamente
      setServices(services.map(s => s.id === id ? serviceWithId : s));
      setEditingService(null);
      setView('home');
    } else {
      // Offline: usar offline manager
      if (window.offlineManager) {
        window.offlineManager.saveOfflineData('service', serviceWithId, 'update');
        // Actualizar localmente también para mostrar en la UI
        setServices(services.map(s => s.id === id ? serviceWithId : s));
        setEditingService(null);
        setView('home');
        
        showOfflineNotification('Servicio actualizado offline. Se sincronizará cuando haya conexión.');
      }
    }
  };

  const deleteService = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este servicio?')) {
      const serviceToDelete = services.find(s => s.id === id);
      
      if (navigator.onLine) {
        // Online: eliminar directamente
        setServices(services.filter(s => s.id !== id));
      } else {
        // Offline: usar offline manager
        if (window.offlineManager && serviceToDelete) {
          window.offlineManager.saveOfflineData('service', serviceToDelete, 'delete');
          // Eliminar localmente también para mostrar en la UI
          setServices(services.filter(s => s.id !== id));
          
          showOfflineNotification('Servicio eliminado offline. Se sincronizará cuando haya conexión.');
        }
      }
    }
  };

  const addExpense = (expense) => {
    const newExpense = { ...expense, id: Date.now(), timestamp: new Date().toISOString() };
    
    if (navigator.onLine) {
      // Online: guardar directamente
      setExpenses([...expenses, newExpense]);
      setView('home');
    } else {
      // Offline: usar offline manager
      if (window.offlineManager) {
        window.offlineManager.saveOfflineData('expense', newExpense, 'create');
        // Guardar localmente también para mostrar en la UI
        setExpenses([...expenses, newExpense]);
        setView('home');
        
        showOfflineNotification('Gasto guardado offline. Se sincronizará cuando haya conexión.');
      }
    }
  };

  const deleteExpense = (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este gasto?')) {
      const expenseToDelete = expenses.find(e => e.id === id);
      
      if (navigator.onLine) {
        // Online: eliminar directamente
        setExpenses(expenses.filter(e => e.id !== id));
      } else {
        // Offline: usar offline manager
        if (window.offlineManager && expenseToDelete) {
          window.offlineManager.saveOfflineData('expense', expenseToDelete, 'delete');
          // Eliminar localmente también para mostrar en la UI
          setExpenses(expenses.filter(e => e.id !== id));
          
          showOfflineNotification('Gasto eliminado offline. Se sincronizará cuando haya conexión.');
        }
      }
    }
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayServices = services.filter(s => 
      new Date(s.startTime).toDateString() === today
    );
    const todayExpenses = expenses.filter(e => 
      new Date(e.timestamp).toDateString() === today
    );

    const income = todayServices.reduce((sum, s) => 
      sum + parseFloat(s.price) + parseFloat(s.tip || 0) + parseFloat(s.extras || 0), 0
    );
    const spent = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return {
      services: todayServices.length,
      income: income.toFixed(2),
      expenses: spent.toFixed(2),
      profit: (income - spent).toFixed(2),
      byPlatform: PLATFORMS.reduce((acc, platform) => {
        const platformServices = todayServices.filter(s => s.platform === platform);
        acc[platform] = {
          count: platformServices.length,
          income: platformServices.reduce((sum, s) => 
            sum + parseFloat(s.price) + parseFloat(s.tip || 0) + parseFloat(s.extras || 0), 0
          ).toFixed(2)
        };
        return acc;
      }, {})
    };
  };

  const theme = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    card: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    input: darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
  };

  return React.createElement('div', { className: `min-h-screen ${theme.bg} ${theme.text}` },
    React.createElement('div', { className: `${theme.card} border-b ${theme.border} p-4 sticky top-0 z-10` },
      React.createElement('div', { className: "flex justify-between items-center max-w-4xl mx-auto" },
        React.createElement('div', { className: "flex items-center gap-3" },
          React.createElement('h1', { className: "text-2xl font-bold" }, '🚕 Control de Taxi'),
          !isOnline && React.createElement('div', { className: "flex items-center gap-2 bg-orange-600 text-white px-3 py-1 rounded-full text-sm" },
            React.createElement('div', { className: "w-2 h-2 bg-white rounded-full animate-pulse" }),
            'Offline'
          ),
          syncStatus && React.createElement('div', { className: "flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm" },
            React.createElement('div', { className: "w-2 h-2 bg-white rounded-full animate-spin" }),
            syncStatus
          )
        ),
        React.createElement('button', {
          onClick: () => setDarkMode(!darkMode),
          className: "p-2 rounded-lg hover:bg-gray-700"
        }, darkMode ? React.createElement(Sun, { size: 24 }) : React.createElement(Moon, { size: 24 }))
      )
    ),
    React.createElement('div', { className: "max-w-4xl mx-auto p-4 pb-24" },
      view === 'home' && React.createElement(HomeView, {
        theme: theme,
        stats: getTodayStats(),
        setView: setView,
        services: services,
        onEdit: (service) => { setEditingService(service); setView('newService'); },
        onDelete: deleteService
      }),
      view === 'newService' && React.createElement(NewServiceView, {
        theme: theme,
        onSave: editingService ? (data) => updateService(editingService.id, data) : addService,
        onCancel: () => { setView('home'); setEditingService(null); },
        initialData: editingService
      }),
      view === 'newExpense' && React.createElement(NewExpenseView, {
        theme: theme,
        categories: expenseCategories,
        onSave: addExpense,
        onCancel: () => setView('home')
      }),
      view === 'reports' && React.createElement(ReportsView, {
        theme: theme,
        services: services,
        expenses: expenses,
        onEdit: (service) => { setEditingService(service); setView('newService'); },
        onDelete: deleteService,
        onDeleteExpense: deleteExpense
      }),
      view === 'settings' && React.createElement(SettingsView, {
        theme: theme,
        categories: expenseCategories,
        setCategories: setExpenseCategories,
        onBack: () => setView('home')
      })
    ),
    React.createElement('div', { className: `fixed bottom-0 left-0 right-0 ${theme.card} border-t ${theme.border} p-4` },
      React.createElement('div', { className: "max-w-4xl mx-auto grid grid-cols-4 gap-2" },
        React.createElement(NavButton, { icon: React.createElement(DollarSign), label: "Inicio", active: view === 'home', onClick: () => setView('home'), theme: theme }),
        React.createElement(NavButton, { icon: React.createElement(TrendingUp), label: "Reportes", active: view === 'reports', onClick: () => setView('reports'), theme: theme }),
        React.createElement(NavButton, { icon: React.createElement(Settings), label: "Ajustes", active: view === 'settings', onClick: () => setView('settings'), theme: theme })
      )
    ),
    view === 'home' && React.createElement('button', {
      onClick: () => setView('newService'),
      className: "fixed bottom-24 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-6 shadow-2xl transition-transform hover:scale-110"
    }, React.createElement(Plus, { size: 32 }))
  );
}

// Componentes auxiliares (versión simplificada para que funcione)
function HomeView({ theme, stats, setView, services, onEdit, onDelete }) {
  const today = new Date().toDateString();
  const todayServices = services.filter(s => 
    new Date(s.startTime).toDateString() === today
  ).slice(-5).reverse();

  return React.createElement('div', { className: "space-y-6" },
    React.createElement('div', { className: "grid grid-cols-2 gap-4" },
      React.createElement(StatCard, { theme: theme, label: "Servicios Hoy", value: stats.services, icon: React.createElement(DollarSign) }),
      React.createElement(StatCard, { theme: theme, label: "Ingresos", value: `€${stats.income}`, icon: React.createElement(TrendingUp), color: "green" }),
      React.createElement(StatCard, { theme: theme, label: "Gastos", value: `€${stats.expenses}`, icon: React.createElement(Receipt), color: "red" }),
      React.createElement(StatCard, { theme: theme, label: "Beneficio", value: `€${stats.profit}`, icon: React.createElement(DollarSign), color: "blue" })
    ),
    React.createElement('button', {
      onClick: () => setView('newExpense'),
      className: `w-full ${theme.card} border ${theme.border} rounded-xl p-6 text-left hover:bg-opacity-80`
    },
      React.createElement('div', { className: "flex items-center gap-4" },
        React.createElement(Receipt, { size: 24 }),
        React.createElement('span', { className: "text-lg font-semibold" }, "Registrar Gasto")
      )
    )
  );
}

function StatCard({ theme, label, value, icon, color = 'default' }) {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    default: theme.text
  };

  return React.createElement('div', { className: `${theme.card} rounded-xl p-6 border ${theme.border}` },
    React.createElement('div', { className: "flex items-center justify-between mb-2" },
      React.createElement('span', { className: `text-sm ${theme.textSecondary}` }, label),
      icon && React.createElement('div', { className: theme.textSecondary }, icon)
    ),
    React.createElement('div', { className: `text-2xl font-bold ${colorClasses[color]}` }, value)
  );
}

function NavButton({ icon, label, active, onClick, theme }) {
  return React.createElement('button', {
    onClick: onClick,
    className: `flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600 text-white' 
        : `${theme.textSecondary} hover:${theme.text} hover:bg-opacity-10 hover:bg-gray-500`
    }`
  },
    React.createElement('div', { className: "mb-1" }, icon),
    React.createElement('span', { className: "text-xs font-medium" }, label)
  );
}

// Componentes de vista simplificados
function NewServiceView({ theme, onSave, onCancel, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    platform: 'Emisora',
    price: '',
    tip: '',
    extras: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date().toISOString().slice(0, 16),
    origin: '',
    destination: ''
  });

  const handleSave = () => {
    if (formData.price) {
      onSave(formData);
    } else {
      alert('El precio es obligatorio');
    }
  };

  return React.createElement('div', null,
    React.createElement('div', { className: "flex justify-between items-center mb-6" },
      React.createElement('h2', { className: "text-2xl font-bold" }, initialData ? 'Editar Servicio' : 'Nuevo Servicio'),
      React.createElement('button', { onClick: onCancel, className: "p-2 hover:bg-gray-700 rounded-lg" },
        React.createElement(X, { size: 24 })
      )
    ),
    React.createElement('div', { className: "space-y-4" },
      React.createElement('div', null,
        React.createElement('label', { className: `block mb-2 ${theme.textSecondary}` }, 'Precio (€) *'),
        React.createElement('input', {
          type: "number",
          step: "0.01",
          value: formData.price,
          onChange: (e) => setFormData({ ...formData, price: e.target.value }),
          className: `w-full p-4 rounded-lg ${theme.input} border ${theme.border} text-lg`,
          placeholder: "15.50"
        })
      ),
      React.createElement('button', {
        onClick: handleSave,
        className: "w-full bg-green-600 hover:bg-green-700 text-white p-5 rounded-xl text-lg font-bold mt-6"
      }, initialData ? 'Actualizar Servicio' : 'Guardar Servicio')
    )
  );
}

function NewExpenseView({ theme, categories, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    category: categories[0],
    amount: '',
    notes: '',
    photo: null
  });

  const handleSave = () => {
    if (formData.amount && formData.category) {
      onSave(formData);
    } else {
      alert('El importe y la categoría son obligatorios');
    }
  };

  return React.createElement('div', null,
    React.createElement('div', { className: "flex justify-between items-center mb-6" },
      React.createElement('h2', { className: "text-2xl font-bold" }, 'Nuevo Gasto'),
      React.createElement('button', { onClick: onCancel, className: "p-2 hover:bg-gray-700 rounded-lg" },
        React.createElement(X, { size: 24 })
      )
    ),
    React.createElement('div', { className: "space-y-4" },
      React.createElement('div', null,
        React.createElement('label', { className: `block mb-2 ${theme.textSecondary}` }, 'Importe (€) *'),
        React.createElement('input', {
          type: "number",
          step: "0.01",
          value: formData.amount,
          onChange: (e) => setFormData({ ...formData, amount: e.target.value }),
          className: `w-full p-4 rounded-lg ${theme.input} border ${theme.border} text-lg`,
          placeholder: "25.00"
        })
      ),
      React.createElement('button', {
        onClick: handleSave,
        className: "w-full bg-red-600 hover:bg-red-700 text-white p-5 rounded-xl text-lg font-bold mt-6"
      }, 'Guardar Gasto')
    )
  );
}

function ReportsView({ theme }) {
  return React.createElement('div', { className: "text-center p-8" },
    React.createElement('h2', { className: "text-2xl font-bold mb-4" }, 'Reportes'),
    React.createElement('p', { className: theme.textSecondary }, 'Funcionalidad de reportes en desarrollo')
  );
}

function SettingsView({ theme, onBack }) {
  return React.createElement('div', null,
    React.createElement('div', { className: "flex justify-between items-center mb-6" },
      React.createElement('h2', { className: "text-2xl font-bold" }, 'Ajustes'),
      React.createElement('button', { onClick: onBack, className: "p-2 hover:bg-gray-700 rounded-lg" },
        React.createElement(X, { size: 24 })
      )
    ),
    React.createElement('div', { className: "text-center p-8" },
      React.createElement('p', { className: theme.textSecondary }, 'Configuración en desarrollo')
    )
  );
}

// Renderizar la aplicación
window.TaxiControlApp = TaxiControlApp;