/**
 * Componente principal del módulo de conciliación
 */
function ReconciliationModule({ theme, onBack }) {
  const { useState, useEffect, createElement: e } = React;

  // Estados principales
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [currentReconciliation, setCurrentReconciliation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Estados para liquidación personalizada
  const [clientName, setClientName] = useState('');
  const [driverRate, setDriverRate] = useState(40);
  const [ownerRate, setOwnerRate] = useState(60);
  const [settlementType, setSettlementType] = useState('percentage'); // 'percentage' o 'fixed'
  const [fixedOwnerAmount, setFixedOwnerAmount] = useState(0);

  // Instancias de los managers
  const [storageManager] = useState(() => new window.ReconciliationStorageManager());
  const [calculationEngine, setCalculationEngine] = useState(null);

  // Hooks de optimización móvil y escritorio
  const { isMobile, screenSize } = window.MobileOptimizations?.useMobileDetection() || { isMobile: false, screenSize: 'desktop' };

  // Gestos táctiles
  const tabs = ['services', 'expenses', 'reconciliation', 'history'];
  const currentTabIndex = tabs.indexOf(activeTab);

  const { handleTouchStart, handleTouchEnd } = window.MobileOptimizations?.useTouchGestures(
    () => currentTabIndex < tabs.length - 1 && setActiveTab(tabs[currentTabIndex + 1]),
    () => currentTabIndex > 0 && setActiveTab(tabs[currentTabIndex - 1])
  ) || { handleTouchStart: () => { }, handleTouchEnd: () => { } };

  // Atajos de teclado
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey) {
        if (e.key === '1') setActiveTab('services');
        if (e.key === '2') setActiveTab('expenses');
        if (e.key === '3') setActiveTab('reconciliation');
        if (e.key === '4') setActiveTab('history');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Cargar datos iniciales
  useEffect(() => { loadInitialData(); }, []);

  // Manejar conectividad
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (settings) {
      setCalculationEngine(new window.CalculationEngine(settings));
      // Sincronizar rates iniciales con los ajustes guardados si existen
      if (settings.distributionRates) {
        setDriverRate(settings.distributionRates.driver * 100);
        setOwnerRate(settings.distributionRates.owner * 100);
      }
    }
  }, [settings]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setServices(storageManager.getServices());
      setExpenses(storageManager.getExpenses());
      setReconciliations(storageManager.getReconciliations());
      setSettings(storageManager.getSettings());
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = (service) => {
    storageManager.saveService(service);
    if (!isOnline && window.offlineManager) {
      window.offlineManager.saveOfflineData('reconciliation_service', service, 'create');
    }
    setServices(storageManager.getServices());
  };

  const handleUpdateService = (id, updates) => {
    storageManager.updateService(id, updates);
    if (!isOnline && window.offlineManager) {
      window.offlineManager.saveOfflineData('reconciliation_service', { ...updates, id }, 'update');
    }
    setServices(storageManager.getServices());
  };

  const handleDeleteService = (id) => {
    const service = services.find(s => s.id === id);
    storageManager.deleteService(id);
    if (!isOnline && window.offlineManager && service) {
      window.offlineManager.saveOfflineData('reconciliation_service', service, 'delete');
    }
    setServices(storageManager.getServices());
  };

  const handleAddExpense = (expense) => {
    storageManager.saveExpense(expense);
    if (!isOnline && window.offlineManager) {
      window.offlineManager.saveOfflineData('reconciliation_expense', expense, 'create');
    }
    setExpenses(storageManager.getExpenses());
  };

  const handleUpdateExpense = (id, updates) => {
    storageManager.updateExpense(id, updates);
    if (!isOnline && window.offlineManager) {
      window.offlineManager.saveOfflineData('reconciliation_expense', { ...updates, id }, 'update');
    }
    setExpenses(storageManager.getExpenses());
  };

  const handleDeleteExpense = (id) => {
    const expense = expenses.find(e => e.id === id);
    storageManager.deleteExpense(id);
    if (!isOnline && window.offlineManager && expense) {
      window.offlineManager.saveOfflineData('reconciliation_expense', expense, 'delete');
    }
    setExpenses(storageManager.getExpenses());
  };

  const generateReconciliation = () => {
    if (!calculationEngine) return;

    // Validar que haya servicios para liquidar
    if (services.length === 0) {
      alert('No hay servicios para liquidar en el período seleccionado');
      return;
    }

    const reconciliation = calculationEngine.generateReconciliation(
      services,
      expenses,
      selectedPeriod,
      {
        bills: {
          fifty: 0,
          twenty: 0,
          ten: 0,
          five: 0,
          two: 0,
          one: 0,
          cents: 0
        }
      },
      {
        driverRate: driverRate / 100,
        ownerRate: ownerRate / 100,
        settlementType,
        fixedOwnerAmount: settlementType === 'fixed' ? parseFloat(fixedOwnerAmount) : 0
      }
    );

    setCurrentReconciliation(reconciliation);
    setActiveTab('reconciliation');
  };

  const handleSaveReconciliation = (reconciliation) => {
    storageManager.saveReconciliation(reconciliation);
    if (!isOnline && window.offlineManager) {
      window.offlineManager.saveOfflineData('reconciliation', reconciliation, 'create');
    }
    setReconciliations(storageManager.getReconciliations());
    setCurrentReconciliation(null);
    setClientName(''); // Resetear nombre para la siguiente
    setActiveTab('history');
  };

  const handleDeleteReconciliation = (id) => {
    if (window.confirm('¿Eliminar esta conciliación?')) {
      storageManager.deleteReconciliation(id);
      setReconciliations(storageManager.getReconciliations());
    }
  };

  if (isLoading) return e('div', { className: "flex justify-center p-12" }, e('div', { className: "w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" }));

  const renderSettlementTypeSelector = () => (
    <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h4 className="text-md font-medium mb-3">Tipo de Liquidación</h4>
      <div className="flex flex-col space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            className="form-radio text-blue-600"
            checked={settlementType === 'percentage'}
            onChange={() => setSettlementType('percentage')}
          />
          <span>Porcentaje (Taxista: {driverRate}% / Dueño: {ownerRate}%)</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            className="form-radio text-blue-600"
            checked={settlementType === 'fixed'}
            onChange={() => setSettlementType('fixed')}
          />
          <span>Monto Fijo</span>
        </label>
        
        {settlementType === 'fixed' && (
          <div className="ml-6 mt-2">
            <label className="block text-sm font-medium mb-1">Monto Fijo para el Dueño</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">€</span>
              <input
                type="number"
                value={fixedOwnerAmount}
                onChange={(e) => setFixedOwnerAmount(e.target.value)}
                className="w-full pl-8 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                min="0"
                step="0.01"
                placeholder="Ej: 50.00"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderReconciliationTab = () => (
    <div className="reconciliation-tab" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Configuración de Liquidación</h3>
        
        {renderSettlementTypeSelector()}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Nombre del cliente"
            />
          </div>
          
          {settlementType === 'percentage' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">% Taxista</label>
                <input
                  type="number"
                  value={driverRate}
                  onChange={(e) => setDriverRate(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">% Dueño</label>
                <input
                  type="number"
                  value={ownerRate}
                  onChange={(e) => setOwnerRate(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  max="100"
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <button
          onClick={generateReconciliation}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Generar Liquidación
        </button>
      </div>
    </div>
  );

  return e('div', {
    className: "min-h-screen pb-24 fade-in px-4",
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  },
    // Custom Header
    e('div', { className: "flex justify-between items-center mb-8 pt-4" },
      e('div', null,
        e('h2', { className: "text-2xl font-black tracking-tight" }, 'Conciliación'),
        e('p', { className: `text-xs font-bold uppercase tracking-widest ${theme.textSecondary}` }, 'Módulo de Taxista')
      ),
      e('button', { onClick: onBack, className: `p-3 ${theme.card} border ${theme.border} rounded-2xl shadow-sm active:scale-95 transition-all` }, '✕')
    ),

    // Tabs
    e('div', { className: "flex p-1.5 rounded-2xl bg-slate-200 dark:bg-slate-800 gap-1 mb-8" },
      [
        { id: 'services', label: 'Servicios', icon: '🚕' },
        { id: 'expenses', label: 'Gastos', icon: '🧾' },
        { id: 'reconciliation', label: 'Cálculo', icon: '⚖️' },
        { id: 'history', label: 'Historial', icon: '📋' }
      ].map(tab =>
        e('button', {
          key: tab.id,
          onClick: () => setActiveTab(tab.id),
          className: `flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? `${theme.card} shadow-sm text-primary-500` : `${theme.textSecondary}`
            }`
        },
          e('span', { className: "text-base" }, tab.icon),
          tab.label
        )
      )
    ),

    // Content based on active tab
    activeTab === 'services' && e(window.ServiceManager, {
      theme,
      services,
      onAdd: handleAddService,
      onUpdate: handleUpdateService,
      onDelete: handleDeleteService
    }),

    activeTab === 'expenses' && e(window.ExpenseManager, {
      theme,
      expenses,
      onAdd: handleAddExpense,
      onUpdate: handleUpdateExpense,
      onDelete: handleDeleteExpense
    }),

    activeTab === 'reconciliation' && (
      currentReconciliation 
        ? e(ReconciliationDisplay, { 
            theme, 
            reconciliation: currentReconciliation, 
            onSave: handleSaveReconciliation 
          })
        : renderReconciliationTab()
    ),

    activeTab === 'history' && e(HistoryTab, { theme, reconciliations, onDelete: handleDeleteReconciliation })
  );
}

function ReconciliationDisplay({ theme, reconciliation, onSave }) {
  const { createElement: e } = React;
  return e('div', { className: "space-y-6 pb-20" },
    e('div', { className: "flex justify-between items-center px-2" },
      e('div', null,
        e('h3', { className: "text-lg font-black" }, 'Resultados'),
        e('p', { className: "text-[10px] font-bold uppercase opacity-50" }, `Liquidación para: ${reconciliation.clientName}`)
      ),
      e('button', {
        onClick: () => onSave(reconciliation),
        className: "bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20"
      }, 'Guardar')
    ),

    e('div', { className: "grid grid-cols-2 gap-4" },
      e(SummaryCard, { label: "Ingresos", value: `${(Number(reconciliation.summary.netIncome) || 0).toFixed(2)}€`, icon: '💰', theme }),
      e(SummaryCard, { label: "Gastos", value: `${(Number(reconciliation.summary.totalExpenses) || 0).toFixed(2)}€`, icon: '📉', theme }),
      e(SummaryCard, { label: "Servicios", value: Number(reconciliation.summary.totalServices) || 0, icon: '🚕', theme }),
      e(SummaryCard, { label: "Neto", value: `${((Number(reconciliation.summary.netIncome) || 0) - (Number(reconciliation.summary.totalExpenses) || 0)).toFixed(2)}€`, icon: '⚖️', theme })
    ),

    reconciliation.finalSettlement && e('div', { className: "space-y-4" },
      e('div', { className: `p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5` },
        e('h4', { className: "text-xs font-black uppercase tracking-widest mb-4 opacity-70 flex justify-between" },
          e('span', null, 'Distribución Final'),
          e('span', null, `${reconciliation.driverRate}% / ${reconciliation.ownerRate}%`)
        ),
        e('div', { className: "flex justify-between gap-4" },
          e('div', { className: "flex-1 text-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-500/20 shadow-sm" },
            e('div', { className: "text-emerald-500 font-black text-xl" }, `${(Number(reconciliation.finalSettlement.driverAmount) || 0).toFixed(2)}€`),
            e('div', { className: "text-[10px] uppercase font-bold opacity-60" }, 'Taxista')
          ),
          e('div', { className: "flex-1 text-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-blue-500/20 shadow-sm" },
            e('div', { className: "text-blue-500 font-black text-xl" }, `${(Number(reconciliation.finalSettlement.ownerAmount) || 0).toFixed(2)}€`),
            e('div', { className: "text-[10px] uppercase font-bold opacity-60" }, 'Patrón')
          )
        )
      ),

      // Desglose de deducciones específicas
      (reconciliation.summary.expensesDriver > 0 || reconciliation.summary.expensesOwner > 0 ||
        reconciliation.summary.commDriver > 0 || reconciliation.summary.commOwner > 0) &&
      e('div', { className: `${theme.card} rounded-3xl p-6 border ${theme.border} text-[10px]` },
        e('h4', { className: "font-black uppercase tracking-widest mb-3 opacity-50" }, 'Deducciones Individuales'),
        e('div', { className: "grid grid-cols-2 gap-6" },
          e('div', { className: "space-y-2" },
            e('div', { className: "font-bold text-emerald-500 uppercase flex justify-between" }, e('span', null, 'Taxista'), e('span', null, '€')),
            reconciliation.summary.expensesDriver > 0 && e('div', { className: "flex justify-between opacity-70" }, e('span', null, 'Gastos Propios'), e('span', null, `-${(Number(reconciliation.summary.expensesDriver) || 0).toFixed(2)}`)),
            reconciliation.summary.commDriver > 0 && e('div', { className: "flex justify-between opacity-70" }, e('span', null, 'Comisiones Propias'), e('span', null, `-${(Number(reconciliation.summary.commDriver) || 0).toFixed(2)}`)),
            reconciliation.summary.freenowExtras > 0 && e('div', { className: "flex justify-between text-emerald-600 font-bold" }, e('span', null, 'Freenow Extras'), e('span', null, `+${(Number(reconciliation.summary.freenowExtras) || 0).toFixed(2)}`))
          ),
          e('div', { className: "space-y-2" },
            e('div', { className: "font-bold text-blue-500 uppercase flex justify-between" }, e('span', null, 'Patrón'), e('span', null, '€')),
            reconciliation.summary.expensesOwner > 0 && e('div', { className: "flex justify-between opacity-70" }, e('span', null, 'Gastos Propios'), e('span', null, `-${(Number(reconciliation.summary.expensesOwner) || 0).toFixed(2)}`)),
            reconciliation.summary.commOwner > 0 && e('div', { className: "flex justify-between opacity-70" }, e('span', null, 'Comisiones Propias'), e('span', null, `-${(Number(reconciliation.summary.commOwner) || 0).toFixed(2)}`))
          )
        )
      )
    )
  );
}

function SummaryCard({ label, value, theme, icon }) {
  const { createElement: e } = React;
  return e('div', { className: `${theme.card} rounded-2xl p-4 border ${theme.border} text-center relative overflow-hidden shadow-sm` },
    e('div', { className: "text-2xl mb-1" }, icon),
    e('div', { className: "text-lg font-black" }, value),
    e('div', { className: `text-[10px] font-bold uppercase tracking-widest opacity-60` }, label)
  );
}

function HistoryTab({ theme, reconciliations, onDelete }) {
  const { createElement: e } = React;
  return e('div', { className: "space-y-4 pb-20" },
    reconciliations.length === 0 ? e('div', { className: "p-12 text-center opacity-40 font-bold" }, 'No hay conciliaciones guardadas') :
      reconciliations.slice().reverse().map(rec => e('div', { key: rec.id, className: `${theme.card} rounded-3xl p-5 border ${theme.border} relative group shadow-sm` },
        e('div', { className: "flex justify-between items-start" },
          e('div', null,
            e('div', { className: "flex items-center gap-2 mb-1" },
              e('span', { className: "text-xs font-black px-2 py-0.5 bg-primary-500/10 text-primary-500 rounded-md" }, rec.clientName || 'Sin Nombre'),
              e('span', { className: "font-bold text-[10px] opacity-40" }, `${new Date(rec.period.start).toLocaleDateString()} - ${new Date(rec.period.end).toLocaleDateString()}`)
            ),
            e('div', { className: "text-[10px] font-bold uppercase opacity-50 space-x-2" },
              e('span', null, `${rec.summary.totalServices} serv.`),
              e('span', null, `•`),
              e('span', { className: "text-emerald-500" }, `€${(Number(rec.summary.netIncome) || 0).toFixed(2)} netos`),
              e('span', null, `•`),
              e('span', { className: "text-blue-500" }, `${rec.driverRate}/${rec.ownerRate}%`)
            )
          ),
          e('button', { onClick: () => onDelete(rec.id), className: "w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold" }, '×')
        )
      ))
  );
}

// Exportar para uso global
if (typeof window !== 'undefined') { window.ReconciliationModule = ReconciliationModule; }