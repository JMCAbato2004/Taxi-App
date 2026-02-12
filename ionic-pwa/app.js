/**
 * Main Application Logic
 * Initializes adapters and handles UI interactions
 */

// Initialize adapters
const authAdapter = new AuthAdapter();
const reconcileAdapter = new ReconcileAdapter();
const rgpdAdapter = new RGPDAdapter();

// Initialize data sync
const dataSyncView = new DataSyncView();

// Initialize push notifications (will be initialized after auth)
let pushNotificationManager = null;

// Initialize components
let tabNavigation = null;
let dashboardView = null;
let fabButton = null;
let serviceListView = null;
let expenseListView = null;
let reconciliationView = null;
let reconciliationHistoryView = null;
let reportsView = null;
let balanceLiquidacionView = null;
let fleetManagementView = null;

// Theme management
let isDarkMode = false;

/**
 * Initialize the application
 */
function initializeApp() {
  console.log('Initializing Ionic PWA...');
  
  // Clean up any invalid or demo data
  cleanupInvalidData();
  
  // Initialize components
  initializeComponents();
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('taxi_theme');
  if (savedTheme === 'dark') {
    enableDarkMode();
  } else if (savedTheme === 'light') {
    enableLightMode();
  } else {
    // Detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      enableDarkMode();
    }
  }
  
  // Check authentication status
  checkAuthStatus();
  
  // Show RGPD consent if needed
  checkRGPDConsent();
}

/**
 * Clean up invalid or demo data from localStorage
 */
function cleanupInvalidData() {
  try {
    const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
    
    // Remove any users with "Demo" in their name or invalid data
    const validUsers = users.filter(user => {
      // Check if user has required fields
      if (!user.id || !user.email || !user.nombre || !user.rol) {
        console.log('Removing invalid user:', user);
        return false;
      }
      
      // Remove demo users
      if (user.nombre.includes('Demo') || user.email.includes('demo')) {
        console.log('Removing demo user:', user);
        return false;
      }
      
      return true;
    });
    
    // Only update if we removed something
    if (validUsers.length !== users.length) {
      localStorage.setItem('taxi_users', JSON.stringify(validUsers));
      console.log(`Cleaned up ${users.length - validUsers.length} invalid/demo users`);
    }
  } catch (error) {
    console.error('Error cleaning up data:', error);
  }
}

/**
 * Initialize components
 */
function initializeComponents() {
  // Initialize TabNavigation
  if (window.TabNavigation) {
    tabNavigation = new TabNavigation();
    tabNavigation.initialize();
  }
  
  // Initialize DashboardView
  if (window.DashboardView) {
    dashboardView = new DashboardView(authAdapter, reconcileAdapter);
  }
  
  // Initialize FABButton
  if (window.FABButton) {
    fabButton = new FABButton();
    fabButton.initialize();
  }

  // Initialize ServiceListView
  if (window.ServiceListView) {
    serviceListView = new ServiceListView(authAdapter, reconcileAdapter);
  }

  // Initialize ExpenseListView
  if (window.ExpenseListView) {
    expenseListView = new ExpenseListView(authAdapter, reconcileAdapter);
  }

  // Initialize ReconciliationView
  if (window.ReconciliationView) {
    reconciliationView = new ReconciliationView(reconcileAdapter);
  }

  // Initialize ReconciliationHistoryView
  if (window.ReconciliationHistoryView) {
    reconciliationHistoryView = new ReconciliationHistoryView(authAdapter, reconcileAdapter);
  }

  // Initialize ReportsView
  if (window.ReportsView) {
    reportsView = new ReportsView(authAdapter, reconcileAdapter);
  }

  // Initialize BalanceLiquidacionView
  if (window.BalanceLiquidacionView) {
    balanceLiquidacionView = new BalanceLiquidacionView(authAdapter, reconcileAdapter);
  }

  // Initialize FleetManagementView
  if (window.FleetManagementView) {
    fleetManagementView = new FleetManagementView(authAdapter, reconcileAdapter);
  }
}

/**
 * Check authentication status and update UI
 */
function checkAuthStatus() {
  const user = authAdapter.getCurrentUser();
  
  if (user) {
    showDashboard();
  } else {
    showWelcome();
  }
}

/**
 * Check RGPD consent status
 */
function checkRGPDConsent() {
  const consent = rgpdAdapter.getConsent();
  if (!consent || !consent.accepted) {
    // Show RGPD consent dialog
    showRGPDConsentDialog();
  }
}

/**
 * Show RGPD consent dialog
 */
async function showRGPDConsentDialog() {
  const alert = document.createElement('ion-alert');
  alert.header = 'Política de Privacidad';
  alert.message = 'Para usar esta aplicación, necesitamos tu consentimiento para procesar tus datos personales de acuerdo con el RGPD.';
  alert.buttons = [
    {
      text: 'Leer Política',
      handler: () => {
        window.open('../politica-privacidad.html', '_blank');
        return false; // Keep alert open
      }
    },
    {
      text: 'Rechazar',
      role: 'cancel',
      handler: () => {
        ToastManager.showWarning('Debes aceptar la política para usar la aplicación');
      }
    },
    {
      text: 'Aceptar',
      handler: () => {
        rgpdAdapter.grantConsent();
        ToastManager.showSuccess('Consentimiento registrado');
      }
    }
  ];

  document.body.appendChild(alert);
  await alert.present();
}

/**
 * Show welcome section
 */
function showWelcome() {
  if (dashboardView) {
    dashboardView.renderWelcome();
  } else {
    // Fallback to direct DOM manipulation
    document.getElementById('welcome-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
  }
}

/**
 * Show dashboard section
 */
async function showDashboard() {
  if (dashboardView) {
    await dashboardView.render();
  } else {
    // Fallback to direct DOM manipulation
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    await loadDashboardData();
  }

  // Render service and expense lists
  if (serviceListView) {
    await serviceListView.render();
  }

  if (expenseListView) {
    await expenseListView.render();
  }

  if (reconciliationView) {
    await reconciliationView.render();
  }

  if (reconciliationHistoryView) {
    await reconciliationHistoryView.render();
  }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
  try {
    const services = await reconcileAdapter.getServices();
    const expenses = await reconcileAdapter.getExpenses();
    
    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayServices = services.filter(s => s.date === today);
    const todayExpenses = expenses.filter(e => e.date === today);
    
    const totalIncome = todayServices.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netAmount = totalIncome - totalExpenses;
    
    // Update stats
    document.getElementById('stat-services').textContent = todayServices.length;
    document.getElementById('stat-income').textContent = '€' + totalIncome.toFixed(2);
    document.getElementById('stat-expenses').textContent = '€' + totalExpenses.toFixed(2);
    document.getElementById('stat-net').textContent = '€' + netAmount.toFixed(2);
    
    // Update recent activity
    updateRecentActivity(services.slice(-5).reverse());
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

/**
 * Update recent activity list
 */
function updateRecentActivity(services) {
  const container = document.getElementById('recent-activity');
  
  if (services.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--ion-color-medium);">No hay actividad reciente</p>';
    return;
  }
  
  container.innerHTML = services.map(service => {
    const paymentIcon = getPaymentIcon(service.paymentType);
    const timeAgo = getTimeAgo(service.createdAt);
    
    return `
      <div class="activity-item">
        <div class="activity-icon" style="background: #d1fae5;">${paymentIcon}</div>
        <div class="activity-content">
          <div class="activity-title">Servicio #${service.id.slice(-4)}</div>
          <div class="activity-subtitle">${timeAgo} • €${service.totalAmount}</div>
        </div>
        <ion-badge color="success">Completado</ion-badge>
      </div>
    `;
  }).join('');
}

/**
 * Get payment type icon
 */
function getPaymentIcon(paymentType) {
  const icons = {
    cash: '💵',
    card: '💳',
    app: '📱'
  };
  return icons[paymentType] || '💵';
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

/**
 * Enable dark mode
 */
function enableDarkMode() {
  document.body.classList.add('dark');
  isDarkMode = true;
  localStorage.setItem('taxi_theme', 'dark');
  
  const themeIcon = document.querySelector('#theme-toggle-btn ion-icon');
  if (themeIcon) {
    themeIcon.setAttribute('name', 'sunny-outline');
  }
}

/**
 * Enable light mode
 */
function enableLightMode() {
  document.body.classList.remove('dark');
  isDarkMode = false;
  localStorage.setItem('taxi_theme', 'light');
  
  const themeIcon = document.querySelector('#theme-toggle-btn ion-icon');
  if (themeIcon) {
    themeIcon.setAttribute('name', 'moon-outline');
  }
}

/**
 * Toggle theme
 */
function toggleTheme() {
  if (isDarkMode) {
    enableLightMode();
  } else {
    enableDarkMode();
  }
}

// Wait for Ionic to be ready
customElements.whenDefined('ion-modal').then(() => {
  console.log('Ionic components ready');
  
  // Initialize app
  initializeApp();
  
  // Listen for login success event
  window.addEventListener('login-success', () => {
    handleLoginSuccess();
  });
  
  // Listen for register success event
  window.addEventListener('register-success', () => {
    handleRegisterSuccess();
  });
  
  // Theme toggle
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
  
  // Show login modal
  document.getElementById('show-login-btn')?.addEventListener('click', async () => {
    await showLoginModal();
  });
  
  // Show register modal
  document.getElementById('show-register-btn')?.addEventListener('click', async () => {
    await showRegisterModal();
  });
  
  // Menu button
  document.getElementById('menu-button')?.addEventListener('click', async () => {
    await showMenuActionSheet();
  });
  
  // FAB button
  document.getElementById('fab-button')?.addEventListener('click', async () => {
    await showFabActionSheet();
  });
  
  // Profile buttons
  document.getElementById('view-profile-btn')?.addEventListener('click', () => {
    showProfileDetailModal();
  });
  
  document.getElementById('change-password-btn')?.addEventListener('click', () => {
    showChangePasswordModal();
  });
  
  document.getElementById('privacy-btn')?.addEventListener('click', () => {
    window.open('../politica-privacidad.html', '_blank');
  });
  
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await handleLogout();
  });

  // Add service button
  document.getElementById('add-service-btn')?.addEventListener('click', async () => {
    await showServiceFormModal();
  });

  // Add expense button
  document.getElementById('add-expense-btn')?.addEventListener('click', async () => {
    await showExpenseFormModal();
  });

  // Listen for service saved event
  window.addEventListener('service-saved', async () => {
    console.log('service-saved event received');
    if (serviceListView) {
      await serviceListView.refresh();
    }
    if (dashboardView) {
      await dashboardView.render();
    }
  });
  
  // Listen for taxista updated event (also refresh dashboard for patrons)
  window.addEventListener('taxista-updated', async () => {
    console.log('taxista-updated event received');
    const user = authAdapter.getCurrentUser();
    if (user && user.rol === 'PATRON' && dashboardView) {
      await dashboardView.displayFleetInfo(user);
    }
  });

  // Listen for expense saved event
  window.addEventListener('expense-saved', async () => {
    if (expenseListView) {
      await expenseListView.refresh();
    }
    if (dashboardView) {
      await dashboardView.render();
    }
  });

  // Listen for edit service event
  window.addEventListener('edit-service', async (e) => {
    await showServiceFormModal(e.detail);
  });

  // Listen for edit expense event
  window.addEventListener('edit-expense', async (e) => {
    await showExpenseFormModal(e.detail);
  });

  // Balance segment change
  document.getElementById('balance-segment')?.addEventListener('ionChange', (e) => {
    handleBalanceSegmentChange(e.detail.value);
  });

  // Listen for reconciliation saved event
  window.addEventListener('reconciliation-saved', async () => {
    if (reconciliationHistoryView) {
      await reconciliationHistoryView.refresh();
    }
  });
});

/**
 * Show login modal
 */
async function showLoginModal() {
  const loginModal = new LoginModal(authAdapter);
  await loginModal.show();
}

/**
 * Handle login success event
 */
async function handleLoginSuccess() {
  // Initialize push notifications after login
  if (window.PushNotificationManager && !pushNotificationManager) {
    pushNotificationManager = new PushNotificationManager(authAdapter);
  }
  
  await showDashboard();
}

/**
 * Handle register success event
 */
async function handleRegisterSuccess() {
  // Initialize push notifications after register
  if (window.PushNotificationManager && !pushNotificationManager) {
    pushNotificationManager = new PushNotificationManager(authAdapter);
  }
  
  await showDashboard();
}

/**
 * Show register modal
 */
async function showRegisterModal() {
  const registerModal = new RegisterModal(authAdapter, emailVerificationService);
  await registerModal.show();
}

/**
 * Handle logout
 */
async function handleLogout() {
  await ActionSheetManager.showConfirmation(
    'Cerrar Sesión',
    '¿Estás seguro de que deseas cerrar sesión?',
    async () => {
      try {
        await LoadingManager.show('Cerrando sesión...');
        await authAdapter.logout();
        await LoadingManager.hide();
        
        ToastManager.showSuccess('Sesión cerrada');
        
        // Clear all views and return to welcome screen
        if (dashboardView) {
          dashboardView.renderWelcome();
        }
        
        // Clear service and expense lists
        const servicesContent = document.getElementById('services-content');
        if (servicesContent) {
          servicesContent.innerHTML = '<p style="text-align: center; color: var(--ion-color-medium); padding: 20px;">Inicia sesión para ver tus servicios</p>';
        }
        
        const expensesContent = document.getElementById('expenses-content');
        if (expensesContent) {
          expensesContent.innerHTML = '<p style="text-align: center; color: var(--ion-color-medium); padding: 20px;">Inicia sesión para ver tus gastos</p>';
        }
        
        const reconciliationContent = document.getElementById('reconciliation-content');
        if (reconciliationContent) {
          reconciliationContent.innerHTML = '<p style="text-align: center; color: var(--ion-color-medium); padding: 20px;">Inicia sesión para ver conciliaciones</p>';
        }
        
        const historyContent = document.getElementById('reconciliation-history-content');
        if (historyContent) {
          historyContent.innerHTML = '<p style="text-align: center; color: var(--ion-color-medium); padding: 20px;">Inicia sesión para ver el historial</p>';
        }
        
        // Switch to home tab
        const tabs = document.querySelector('ion-tabs');
        if (tabs) {
          tabs.select('home');
        }
      } catch (error) {
        await LoadingManager.hide();
        console.error('Logout error:', error);
        ToastManager.showError('Error al cerrar sesión');
      }
    }
  );
}

/**
 * Show menu action sheet
 */
async function showMenuActionSheet() {
  await ActionSheetManager.show('Menú', [
    {
      text: 'Mi Perfil',
      icon: 'person',
      handler: () => ToastManager.showInfo('Ver perfil - Próximamente')
    },
    {
      text: 'Notificaciones',
      icon: 'notifications',
      handler: async () => {
        if (pushNotificationManager) {
          await pushNotificationManager.show();
        } else {
          ToastManager.showError('Notificaciones no disponibles');
        }
      }
    },
    {
      text: 'Configuración',
      icon: 'settings',
      handler: () => ToastManager.showInfo('Configuración - Próximamente')
    },
    {
      text: 'Limpiar Todos los Datos',
      icon: 'trash',
      handler: async () => {
        await clearAllData();
      }
    },
    {
      text: 'Privacidad (RGPD)',
      icon: 'shield-checkmark',
      handler: () => window.open('../politica-privacidad.html', '_blank')
    },
    {
      text: 'Cerrar Sesión',
      icon: 'log-out',
      role: 'destructive',
      handler: handleLogout
    },
    {
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    }
  ]);
}

/**
 * Clear all application data
 */
async function clearAllData() {
  await ActionSheetManager.showConfirmation(
    'Limpiar Todos los Datos',
    '¿Estás seguro? Se eliminarán TODOS los usuarios, servicios, gastos y configuraciones. Esta acción no se puede deshacer.',
    async () => {
      try {
        await LoadingManager.show('Limpiando datos...');
        
        // Clear all localStorage data
        const keysToRemove = [
          'taxi_users',
          'taxi_services',
          'taxi_expenses',
          'taxi_reconciliations',
          'taxi_join_requests',
          'taxi_auth_current_user',
          'taxi_auth_current_token',
          'taxi_auth_permissions',
          'taxi_balance_settings',
          'taxi_pending_operations',
          'taxi_offline_queue',
          'taxi_conflict_queue',
          'taxi_notification_settings',
          'taxi_push_subscription'
        ];
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        await LoadingManager.hide();
        ToastManager.showSuccess('Todos los datos han sido eliminados');
        
        // Reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        await LoadingManager.hide();
        console.error('Error clearing data:', error);
        ToastManager.showError('Error al limpiar datos');
      }
    }
  );
}

/**
 * Show FAB action sheet
 */
async function showFabActionSheet() {
  await ActionSheetManager.show('Nueva Acción', [
    {
      text: 'Nuevo Servicio',
      icon: 'car',
      handler: () => showServiceFormModal()
    },
    {
      text: 'Nuevo Gasto',
      icon: 'wallet',
      handler: () => showExpenseFormModal()
    },
    {
      text: 'Ver Reportes',
      icon: 'bar-chart',
      handler: () => ToastManager.showInfo('Reportes - Próximamente')
    },
    {
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    }
  ]);
}

/**
 * Show service form modal
 */
async function showServiceFormModal(service = null) {
  const modal = new ServiceFormModal(reconcileAdapter, service);
  await modal.show();
}

/**
 * Show expense form modal
 */
async function showExpenseFormModal(expense = null) {
  const modal = new ExpenseFormModal(reconcileAdapter, expense);
  await modal.show();
}

/**
 * Show profile detail modal
 */
async function showProfileDetailModal() {
  const modal = new ProfileDetailModal(authAdapter);
  await modal.show();
}

/**
 * Show change password modal
 */
async function showChangePasswordModal() {
  const modal = new ChangePasswordModal(authAdapter);
  await modal.show();
}

/**
 * Handle balance segment change
 */
function handleBalanceSegmentChange(value) {
  const expensesContent = document.getElementById('expenses-content');
  const reconciliationContent = document.getElementById('reconciliation-content');
  const historyContent = document.getElementById('reconciliation-history-content');

  // Hide all
  if (expensesContent) expensesContent.style.display = 'none';
  if (reconciliationContent) reconciliationContent.style.display = 'none';
  if (historyContent) historyContent.style.display = 'none';

  // Show selected
  if (value === 'expenses' && expensesContent) {
    expensesContent.style.display = 'block';
  } else if (value === 'reconciliation' && reconciliationContent) {
    reconciliationContent.style.display = 'block';
  } else if (value === 'history' && historyContent) {
    historyContent.style.display = 'block';
  }
}

console.log('App.js loaded');

// Export app functions for global access
window.app = {
  showReports: async () => {
    if (reportsView) {
      await reportsView.show();
    } else {
      ToastManager.showError('Reportes no disponibles');
    }
  },
  
  showTaxistaPanel: async () => {
    if (window.TaxistaPanelView) {
      const taxistaPanelView = new TaxistaPanelView(authAdapter);
      await taxistaPanelView.show();
    } else {
      ToastManager.showError('Panel personal no disponible');
    }
  },
  
  showBalanceLiquidacion: async () => {
    if (balanceLiquidacionView) {
      await balanceLiquidacionView.show();
    } else {
      ToastManager.showError('Balance no disponible');
    }
  },
  
  showFleetManagement: async () => {
    if (fleetManagementView) {
      await fleetManagementView.show();
    } else {
      ToastManager.showError('Gestión de flota no disponible');
    }
  },
  
  showBalanceSettings: async () => {
    const modal = new BalanceSettingsModal();
    await modal.show();
  },
  
  showDataSync: async () => {
    if (dataSyncView) {
      await dataSyncView.show();
    } else {
      ToastManager.showError('Sincronización no disponible');
    }
  },
  
  toggleOfflineMode: async () => {
    if (window.offlineModeManager) {
      await window.offlineModeManager.show();
    } else {
      ToastManager.showError('Modo offline no disponible');
    }
  },
  
  viewTaxistaDetails: async (taxistaId) => {
    if (window.TaxistaDetailsModal) {
      const modal = new TaxistaDetailsModal(authAdapter, reconcileAdapter, taxistaId);
      await modal.show();
    } else {
      ToastManager.showError('Modal no disponible');
    }
  },
  
  editTaxista: async (taxistaId) => {
    if (window.EditTaxistaModal) {
      const modal = new EditTaxistaModal(authAdapter, taxistaId);
      await modal.show();
    } else {
      ToastManager.showError('Modal no disponible');
    }
  },
  
  removeTaxista: async (taxistaId) => {
    // CSRF Protection
    try {
      if (window.csrfProtectionService) {
        const csrfToken = window.csrfProtectionService.getToken();
        window.csrfProtectionService.validateOperation('removeTaxista', { csrfToken });
      }
    } catch (error) {
      console.error('CSRF validation failed:', error);
      ToastManager.showError('Operación bloqueada por seguridad. Recarga la página.');
      return;
    }
    
    const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
    const taxista = users.find(u => u.id === taxistaId);
    
    if (!taxista) {
      ToastManager.showError('Taxista no encontrado');
      return;
    }
    
    await ActionSheetManager.showConfirmation(
      'Eliminar de la Flota',
      `¿Estás seguro de que deseas eliminar a ${taxista.nombre} de tu flota?`,
      async () => {
        try {
          await LoadingManager.show('Eliminando...');
          
          // Update taxista status
          delete taxista.patronId;
          taxista.estado = 'independiente';
          
          // Save changes
          localStorage.setItem('taxi_users', JSON.stringify(users));
          
          await LoadingManager.hide();
          ToastManager.showSuccess(`${taxista.nombre} eliminado de la flota`);
          
          // Dispatch event to refresh fleet management
          window.dispatchEvent(new CustomEvent('taxista-updated'));
        } catch (error) {
          await LoadingManager.hide();
          console.error('Error removing taxista:', error);
          ToastManager.showError('Error al eliminar taxista');
        }
      }
    );
  },
  
  approveRequest: async (requestId) => {
    console.log('approveRequest called with:', requestId);
    
    // CSRF Protection
    try {
      if (window.csrfProtectionService) {
        const csrfToken = window.csrfProtectionService.getToken();
        window.csrfProtectionService.validateOperation('approveRequest', { csrfToken });
      }
    } catch (error) {
      console.error('CSRF validation failed:', error);
      ToastManager.showError('Operación bloqueada por seguridad. Recarga la página.');
      return;
    }
    
    const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
    const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
    
    console.log('All requests:', requests);
    console.log('All users:', users);
    
    // Convert requestId to number if it's a string
    const id = typeof requestId === 'string' ? parseInt(requestId, 10) : requestId;
    
    console.log('Looking for request with id:', id);
    
    const request = requests.find(r => r.id === id);
    if (!request) {
      console.error('Request not found:', id);
      ToastManager.showError('Solicitud no encontrada');
      return;
    }
    
    console.log('Request found:', request);
    
    // Update request status
    request.estado = 'aprobada';
    request.fechaAprobacion = new Date().toISOString();
    
    console.log('Looking for taxista with id:', request.taxistaId);
    
    // Update taxista
    const taxista = users.find(u => u.id === request.taxistaId);
    if (taxista) {
      console.log('Taxista found:', taxista);
      const currentUser = authAdapter.getCurrentUser();
      console.log('Current user (patron):', currentUser);
      
      taxista.patronId = currentUser.id;
      taxista.estado = 'asociado';
      
      console.log('Taxista updated:', taxista);
    } else {
      console.error('Taxista not found with id:', request.taxistaId);
    }
    
    // Save changes
    localStorage.setItem('taxi_join_requests', JSON.stringify(requests));
    localStorage.setItem('taxi_users', JSON.stringify(users));
    
    console.log('Changes saved to localStorage');
    
    ToastManager.showSuccess('Solicitud aprobada');
    
    // Refresh fleet management
    console.log('fleetManagementView exists?', !!fleetManagementView);
    
    if (fleetManagementView) {
      const user = authAdapter.getCurrentUser();
      console.log('Reloading fleet for user:', user);
      
      // Reload both tabs
      await fleetManagementView.loadFleet(user);
      await fleetManagementView.loadRequests(user);
      
      // Switch to fleet tab to show the new taxista
      const modal = fleetManagementView.currentModal;
      if (modal) {
        const segment = modal.querySelector('#fleet-segment');
        if (segment) {
          segment.value = 'fleet';
          // Trigger the change event manually
          const fleetContent = modal.querySelector('#fleet-tab-content');
          const requestsContent = modal.querySelector('#requests-tab-content');
          if (fleetContent && requestsContent) {
            fleetContent.style.display = 'block';
            requestsContent.style.display = 'none';
          }
        }
      }
      
      console.log('Fleet reloaded and switched to fleet tab');
    } else {
      console.warn('fleetManagementView not available, dispatching event instead');
      window.dispatchEvent(new CustomEvent('taxista-updated'));
    }
  },
  
  rejectRequest: async (requestId) => {
    // CSRF Protection
    try {
      if (window.csrfProtectionService) {
        const csrfToken = window.csrfProtectionService.getToken();
        window.csrfProtectionService.validateOperation('rejectRequest', { csrfToken });
      }
    } catch (error) {
      console.error('CSRF validation failed:', error);
      ToastManager.showError('Operación bloqueada por seguridad. Recarga la página.');
      return;
    }
    
    const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
    const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
    
    // Convert requestId to number if it's a string
    const id = typeof requestId === 'string' ? parseInt(requestId, 10) : requestId;
    
    const request = requests.find(r => r.id === id);
    if (!request) {
      console.error('Request not found:', id);
      ToastManager.showError('Solicitud no encontrada');
      return;
    }
    
    // Update request status
    request.estado = 'rechazada';
    request.fechaRechazo = new Date().toISOString();
    
    // Update taxista status
    const taxista = users.find(u => u.id === request.taxistaId);
    if (taxista) {
      taxista.estado = 'independiente';
    }
    
    // Save changes
    localStorage.setItem('taxi_join_requests', JSON.stringify(requests));
    localStorage.setItem('taxi_users', JSON.stringify(users));
    
    ToastManager.showInfo('Solicitud rechazada');
    
    // Refresh fleet management
    if (fleetManagementView) {
      const user = authAdapter.getCurrentUser();
      await fleetManagementView.loadFleet(user);
      await fleetManagementView.loadRequests(user);
    }
  },
  
  exportReports: async () => {
    ToastManager.showInfo('Exportar reportes - Próximamente');
  },
  
  exportBalance: async () => {
    ToastManager.showInfo('Exportar balance - Próximamente');
  }
};
