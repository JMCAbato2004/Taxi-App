/**
 * DashboardView Component
 * Displays welcome screen or dashboard based on authentication state
 */

class DashboardView {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.stats = null;
    this.refresher = null;
  }

  /**
   * Render the dashboard view
   */
  async render() {
    console.log('DashboardView.render: Starting render');
    const user = this.authAdapter.getCurrentUser();
    console.log('DashboardView.render: Current user:', user ? user.id : 'none');
    
    if (!user) {
      console.log('DashboardView.render: No user, showing welcome');
      this.renderWelcome();
    } else {
      console.log('DashboardView.render: User found, rendering dashboard');
      await this.renderDashboard(user);
    }
    
    // Set up pull-to-refresh
    this.setupPullToRefresh();
    console.log('DashboardView.render: Render complete');
  }

  /**
   * Render welcome screen for unauthenticated users
   */
  renderWelcome() {
    const welcomeSection = document.getElementById('welcome-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (welcomeSection) {
      welcomeSection.style.display = 'block';
    }
    
    if (dashboardSection) {
      dashboardSection.style.display = 'none';
    }
  }

  /**
   * Render dashboard for authenticated users
   * @param {Object} user - The authenticated user
   */
  async renderDashboard(user) {
    console.log('renderDashboard: Starting render for user:', user.id);
    
    const welcomeSection = document.getElementById('welcome-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    console.log('renderDashboard: Sections found:', {
      welcomeSection: !!welcomeSection,
      dashboardSection: !!dashboardSection
    });
    
    if (welcomeSection) {
      welcomeSection.style.display = 'none';
    }
    
    if (dashboardSection) {
      dashboardSection.style.display = 'block';
    }
    
    // Display user role badge prominently
    this.displayUserRole(user);
    
    // Load and display stats
    console.log('renderDashboard: Loading stats...');
    await this.loadStats(user);
    console.log('renderDashboard: Displaying stats...');
    this.displayStats();
    
    // Renderizar jornada activa si WorkShiftManager está disponible
    if (window.WorkShiftManager && window.workShiftAdapter) {
      console.log('renderDashboard: Rendering work shift manager...');
      const shiftManager = new window.WorkShiftManager(this.authAdapter, window.workShiftAdapter);
      await shiftManager.render('shift-manager-container');
    }
    
    console.log('renderDashboard: Displaying recent activity...');
    this.displayRecentActivity();
    console.log('renderDashboard: Displaying action buttons...');
    this.displayActionButtons(user);
    
    // If patron, display fleet info
    if (user.rol === 'PATRON') {
      console.log('renderDashboard: Displaying fleet info...');
      await this.displayFleetInfo(user);
    } else {
      // Clear fleet info for taxistas
      const fleetInfoContainer = document.getElementById('fleet-info');
      if (fleetInfoContainer) {
        fleetInfoContainer.innerHTML = '';
      }
    }
    
    console.log('renderDashboard: Render complete');
  }

  /**
   * Display user role badge prominently
   * @param {Object} user - The authenticated user
   */
  displayUserRole(user) {
    const container = document.getElementById('user-role-badge');
    if (!container) return;
    
    const roleIcon = user.rol === 'PATRON' ? '👔' : '🚗';
    const roleText = user.rol === 'PATRON' ? 'PATRÓN' : 'TAXISTA';
    const roleColor = user.rol === 'PATRON' ? 'primary' : 'success';
    
    container.innerHTML = `
      <ion-chip color="${roleColor}" style="font-size: 14px; font-weight: bold;">
        <ion-label>${roleIcon} ${roleText}</ion-label>
      </ion-chip>
      <div style="font-size: 18px; font-weight: bold; margin-top: 4px; color: var(--ion-color-dark);">${user.nombre}</div>
      ${user.numeroTaxista ? `<div style="font-size: 14px; color: var(--ion-color-medium);">Nº ${user.numeroTaxista}</div>` : ''}
    `;
  }

  /**
   * Load statistics based on user role
   * @param {Object} user - The authenticated user
   */
  async loadStats(user) {
    try {
      console.log('loadStats: Loading stats for user:', user.id, user.rol);
      
      // Load services and expenses
      const services = await this.reconcileAdapter.getServices();
      const expenses = await this.reconcileAdapter.getExpenses();
      
      console.log('loadStats: Total services:', services.length);
      console.log('loadStats: Total expenses:', expenses.length);
      
      // Filter data based on role
      const filteredServices = this.filterByRole(services, user);
      const filteredExpenses = this.filterByRole(expenses, user);
      
      console.log('loadStats: Filtered services:', filteredServices.length);
      console.log('loadStats: Filtered expenses:', filteredExpenses.length);
      
      // Calculate statistics for today
      const today = new Date().toISOString().split('T')[0];
      console.log('loadStats: Today date:', today);
      console.log('loadStats: All filtered services:', filteredServices.length);
      
      const todayServices = filteredServices.filter(s => {
        const serviceDate = s.date || new Date(s.datetime).toISOString().split('T')[0];
        const isToday = serviceDate === today;
        console.log(`loadStats: Service ${s.id} - date: ${s.date}, datetime: ${s.datetime}, serviceDate: ${serviceDate}, isToday: ${isToday}`);
        return isToday;
      });
      const todayExpenses = filteredExpenses.filter(e => {
        const expenseDate = e.date || new Date(e.createdAt).toISOString().split('T')[0];
        return expenseDate === today;
      });
      
      console.log('loadStats: Today services:', todayServices.length);
      console.log('loadStats: Today expenses:', todayExpenses.length);
      
      // Calculate total income (gross amount)
      const totalIncomeBase = todayServices.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
      
      // Calculate tips
      const totalTips = todayServices.reduce((sum, s) => sum + parseFloat(s.tip || 0), 0);
      
      // For both TAXISTA and PATRON: Income includes tips
      const totalIncome = totalIncomeBase + totalTips;
      
      // Calculate total expenses
      const totalExpenses = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      
      // Calculate commissions
      const totalCommissions = todayServices.reduce((sum, s) => sum + parseFloat(s.commission || 0), 0);
      
      // Calculate net amount (income - commissions - expenses)
      // Income already includes tips for both roles
      const netAmount = totalIncome - totalCommissions - totalExpenses;
      
      this.stats = {
        servicesCount: todayServices.length,
        totalIncome,
        totalCommissions,
        totalTips,
        totalExpenses,
        netAmount,
        recentServices: filteredServices.slice(-5).reverse()
      };
      
      console.log('loadStats: Calculated stats:', this.stats);
      
      return this.stats;
    } catch (error) {
      console.error('Error loading stats:', error);
      this.stats = {
        servicesCount: 0,
        totalIncome: 0,
        totalCommissions: 0,
        totalTips: 0,
        totalExpenses: 0,
        netAmount: 0,
        recentServices: []
      };
      return this.stats;
    }
  }

  /**
   * Filter data by user role
   * @param {Array} data - The data to filter
   * @param {Object} user - The user object
   * @returns {Array} Filtered data
   */
  filterByRole(data, user) {
    console.log('filterByRole: Input data:', data);
    console.log('filterByRole: User:', user);
    
    if (!user || !data) {
      console.log('filterByRole: No user or data, returning empty array');
      return [];
    }
    
    // TAXISTA: only their own data
    if (user.rol === 'TAXISTA') {
      console.log('filterByRole: Filtering for TAXISTA, userId:', user.id);
      const filtered = data.filter(item => {
        console.log('filterByRole: Checking item:', item.id, 'userId:', item.userId, 'matches:', item.userId === user.id);
        return item.userId === user.id;
      });
      console.log('filterByRole: Filtered result:', filtered);
      return filtered;
    }
    
    // PATRON: aggregated data from all associated taxistas
    if (user.rol === 'PATRON') {
      console.log('filterByRole: PATRON, returning all data');
      // For now, return all data
      // In a real implementation, this would filter by associated taxistas
      return data;
    }
    
    console.log('filterByRole: No role match, returning all data');
    return data;
  }

  /**
   * Display statistics in the UI
   */
  displayStats() {
    if (!this.stats) {
      console.warn('displayStats: No stats available');
      return;
    }
    
    console.log('displayStats: Updating with stats:', this.stats);
    
    const statServices = document.getElementById('stat-services');
    const statIncome = document.getElementById('stat-income');
    const statTips = document.getElementById('stat-tips');
    const statCommissions = document.getElementById('stat-commissions');
    const statExpenses = document.getElementById('stat-expenses');
    const statNet = document.getElementById('stat-net');
    
    console.log('displayStats: DOM elements found:', {
      statServices: !!statServices,
      statIncome: !!statIncome,
      statTips: !!statTips,
      statCommissions: !!statCommissions,
      statExpenses: !!statExpenses,
      statNet: !!statNet
    });
    
    if (statServices) {
      statServices.textContent = this.stats.servicesCount;
    }
    
    if (statIncome) {
      statIncome.textContent = '€' + this.stats.totalIncome.toFixed(2);
    }
    
    if (statTips) {
      statTips.textContent = '€' + this.stats.totalTips.toFixed(2);
      statTips.style.color = 'var(--ion-color-tertiary)';
    }
    
    if (statCommissions) {
      statCommissions.textContent = '€' + this.stats.totalCommissions.toFixed(2);
      statCommissions.style.color = 'var(--ion-color-danger)';
    }
    
    if (statExpenses) {
      statExpenses.textContent = '€' + this.stats.totalExpenses.toFixed(2);
    }
    
    if (statNet) {
      statNet.textContent = '€' + this.stats.netAmount.toFixed(2);
      
      // Color code the net amount
      if (this.stats.netAmount > 0) {
        statNet.style.color = 'var(--ion-color-success)';
      } else if (this.stats.netAmount < 0) {
        statNet.style.color = 'var(--ion-color-danger)';
      } else {
        statNet.style.color = 'var(--ion-color-medium)';
      }
    }
    
    console.log('displayStats: Stats updated successfully');
  }

  /**
   * Display recent activity
   */
  displayRecentActivity() {
    if (!this.stats) return;
    
    const container = document.getElementById('recent-activity');
    if (!container) return;
    
    if (this.stats.recentServices.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--ion-color-medium);">No hay actividad reciente</p>';
      return;
    }
    
    container.innerHTML = this.stats.recentServices.map(service => {
      const paymentIcon = this.getPaymentIcon(service.paymentType);
      const timeAgo = this.getTimeAgo(service.createdAt);
      
      return `
        <div class="activity-item">
          <div class="activity-icon" style="background: var(--ion-color-success-tint);">${paymentIcon}</div>
          <div class="activity-content">
            <div class="activity-title">Servicio #${service.id ? service.id.slice(-4) : 'N/A'}</div>
            <div class="activity-subtitle">${timeAgo} • €${service.totalAmount}</div>
          </div>
          <ion-badge color="success">Completado</ion-badge>
        </div>
      `;
    }).join('');
  }

  /**
   * Get payment type icon
   * @param {string} paymentType - The payment type
   * @returns {string} The icon emoji
   */
  getPaymentIcon(paymentType) {
    const icons = {
      cash: '💵',
      card: '💳',
      app: '📱'
    };
    return icons[paymentType] || '💵';
  }

  /**
   * Get time ago string
   * @param {string|Date} timestamp - The timestamp
   * @returns {string} Human-readable time ago
   */
  getTimeAgo(timestamp) {
    if (!timestamp) return 'Reciente';
    
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
   * Set up pull-to-refresh functionality
   */
  setupPullToRefresh() {
    // Find the ion-content element in the home tab
    const homeTab = document.querySelector('ion-tab[tab="home"]');
    if (!homeTab) return;
    
    const content = homeTab.querySelector('ion-content');
    if (!content) return;
    
    // Check if refresher already exists
    let refresher = content.querySelector('ion-refresher');
    
    if (!refresher) {
      // Create refresher element
      refresher = document.createElement('ion-refresher');
      refresher.slot = 'fixed';
      
      const refresherContent = document.createElement('ion-refresher-content');
      refresherContent.setAttribute('pulling-icon', 'chevron-down-circle-outline');
      refresherContent.setAttribute('refreshing-spinner', 'circles');
      refresherContent.setAttribute('pulling-text', 'Desliza para actualizar');
      refresherContent.setAttribute('refreshing-text', 'Actualizando...');
      
      refresher.appendChild(refresherContent);
      content.insertBefore(refresher, content.firstChild);
    }
    
    // Add event listener
    refresher.addEventListener('ionRefresh', async (event) => {
      await this.refresh();
      event.target.complete();
    });
    
    this.refresher = refresher;
  }

  /**
   * Refresh dashboard data
   */
  async refresh() {
    const user = this.authAdapter.getCurrentUser();
    
    if (!user) {
      this.renderWelcome();
      return;
    }
    
    try {
      await this.loadStats(user);
      this.displayStats();
      this.displayRecentActivity();
      this.displayActionButtons(user);
      
      if (user.rol === 'PATRON') {
        await this.displayFleetInfo(user);
      }
      
      if (window.ToastManager) {
        ToastManager.showSuccess('Datos actualizados');
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      
      if (window.ToastManager) {
        ToastManager.showError('Error al actualizar datos');
      }
    }
  }

  /**
   * Display action buttons based on user role
   * @param {Object} user - The authenticated user
   */
  displayActionButtons(user) {
    const container = document.getElementById('action-buttons');
    if (!container) return;
    
    let buttons = '';
    
    if (user.rol === 'PATRON') {
      // Count pending requests
      const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
      const pendingRequests = requests.filter(r => 
        r.patronId === user.id && 
        r.estado === 'pendiente'
      );
      const pendingCount = pendingRequests.length;
      
      // Create badge HTML if there are pending requests
      const badgeHTML = pendingCount > 0 
        ? `<ion-badge color="danger" style="margin-left: 8px;">${pendingCount}</ion-badge>` 
        : '';
      
      buttons = `
        <ion-button expand="block" color="tertiary" onclick="window.app.showActiveShifts()">
          <ion-icon slot="start" name="people-circle"></ion-icon>
          Jornadas Activas
        </ion-button>
        <ion-button expand="block" color="primary" onclick="window.app.showFleetManagement()">
          <ion-icon slot="start" name="people"></ion-icon>
          Gestionar Flota
          ${badgeHTML}
        </ion-button>
        <ion-button expand="block" color="success" onclick="window.app.showReports()">
          <ion-icon slot="start" name="bar-chart"></ion-icon>
          Ver Reportes
        </ion-button>
      `;
    } else {
      buttons = `
        <ion-button expand="block" color="primary" onclick="window.app.showTaxistaPanel()">
          <ion-icon slot="start" name="person-circle"></ion-icon>
          Mi Panel Personal
        </ion-button>
        <ion-button expand="block" color="tertiary" onclick="window.app.showReports()">
          <ion-icon slot="start" name="bar-chart"></ion-icon>
          Ver Reportes
        </ion-button>
      `;
    }
    
    // Common buttons for both roles
    buttons += `
      <ion-button expand="block" color="secondary" onclick="window.app.showShiftHistory()">
        <ion-icon slot="start" name="time-outline"></ion-icon>
        Historial de Jornadas
      </ion-button>
      <ion-button expand="block" color="medium" onclick="window.app.showDataSync()">
        <ion-icon slot="start" name="sync"></ion-icon>
        Sincronización
      </ion-button>
      <ion-button expand="block" color="warning" onclick="window.app.toggleOfflineMode()">
        <ion-icon slot="start" name="cloud-offline"></ion-icon>
        Modo Offline
      </ion-button>
    `;
    
    container.innerHTML = buttons;
  }

  /**
   * Display fleet information for patrons
   * @param {Object} user - The patron user
   */
  async displayFleetInfo(user) {
    const container = document.getElementById('fleet-info');
    if (!container) return;
    
    // For PATRON users, clear the fleet info section
    container.innerHTML = '';
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.DashboardView = DashboardView;
}

console.log('DashboardView component loaded');
