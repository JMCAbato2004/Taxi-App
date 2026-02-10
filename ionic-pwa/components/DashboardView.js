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
    const user = this.authAdapter.getCurrentUser();
    
    if (!user) {
      this.renderWelcome();
    } else {
      await this.renderDashboard(user);
    }
    
    // Set up pull-to-refresh
    this.setupPullToRefresh();
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
    const welcomeSection = document.getElementById('welcome-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (welcomeSection) {
      welcomeSection.style.display = 'none';
    }
    
    if (dashboardSection) {
      dashboardSection.style.display = 'block';
    }
    
    // Display user role badge prominently
    this.displayUserRole(user);
    
    // Load and display stats
    await this.loadStats(user);
    this.displayStats();
    this.displayRecentActivity();
    this.displayActionButtons(user);
    
    // If patron, display fleet info
    if (user.rol === 'PATRON') {
      await this.displayFleetInfo(user);
    }
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
      <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">${user.nombre}</div>
      ${user.numeroTaxista ? `<div style="font-size: 14px; color: var(--ion-color-medium);">Nº ${user.numeroTaxista}</div>` : ''}
    `;
  }

  /**
   * Load statistics based on user role
   * @param {Object} user - The authenticated user
   */
  async loadStats(user) {
    try {
      // Load services and expenses
      const services = await this.reconcileAdapter.getServices();
      const expenses = await this.reconcileAdapter.getExpenses();
      
      // Filter data based on role
      const filteredServices = this.filterByRole(services, user);
      const filteredExpenses = this.filterByRole(expenses, user);
      
      // Calculate statistics for today
      const today = new Date().toISOString().split('T')[0];
      const todayServices = filteredServices.filter(s => s.date === today);
      const todayExpenses = filteredExpenses.filter(e => e.date === today);
      
      const totalIncome = todayServices.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
      const totalExpenses = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const netAmount = totalIncome - totalExpenses;
      
      this.stats = {
        servicesCount: todayServices.length,
        totalIncome,
        totalExpenses,
        netAmount,
        recentServices: filteredServices.slice(-5).reverse()
      };
      
      return this.stats;
    } catch (error) {
      console.error('Error loading stats:', error);
      this.stats = {
        servicesCount: 0,
        totalIncome: 0,
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
    if (!user || !data) return [];
    
    // TAXISTA: only their own data
    if (user.rol === 'TAXISTA') {
      return data.filter(item => item.userId === user.id);
    }
    
    // PATRON: aggregated data from all associated taxistas
    if (user.rol === 'PATRON') {
      // For now, return all data
      // In a real implementation, this would filter by associated taxistas
      return data;
    }
    
    return data;
  }

  /**
   * Display statistics in the UI
   */
  displayStats() {
    if (!this.stats) return;
    
    const statServices = document.getElementById('stat-services');
    const statIncome = document.getElementById('stat-income');
    const statExpenses = document.getElementById('stat-expenses');
    const statNet = document.getElementById('stat-net');
    
    if (statServices) {
      statServices.textContent = this.stats.servicesCount;
    }
    
    if (statIncome) {
      statIncome.textContent = '€' + this.stats.totalIncome.toFixed(2);
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
      buttons = `
        <ion-button expand="block" color="primary" onclick="window.app.showFleetManagement()">
          <ion-icon slot="start" name="people"></ion-icon>
          Gestionar Flota
        </ion-button>
        <ion-button expand="block" color="success" onclick="window.app.showReports()">
          <ion-icon slot="start" name="bar-chart"></ion-icon>
          Ver Reportes
        </ion-button>
        <ion-button expand="block" color="tertiary" onclick="window.app.showBalanceSettings()">
          <ion-icon slot="start" name="settings"></ion-icon>
          Ajustes de Balance
        </ion-button>
      `;
    } else {
      buttons = `
        <ion-button expand="block" color="primary" onclick="window.app.showTaxistaPanel()">
          <ion-icon slot="start" name="person-circle"></ion-icon>
          Mi Panel Personal
        </ion-button>
        <ion-button expand="block" color="success" onclick="window.app.showBalanceLiquidacion()">
          <ion-icon slot="start" name="cash"></ion-icon>
          Balance y Liquidación
        </ion-button>
        <ion-button expand="block" color="tertiary" onclick="window.app.showReports()">
          <ion-icon slot="start" name="bar-chart"></ion-icon>
          Ver Reportes
        </ion-button>
      `;
    }
    
    // Common buttons for both roles
    buttons += `
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
    
    try {
      // Get all users and requests
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
      
      // Filter associated taxistas
      const associatedTaxistas = users.filter(u => 
        u.rol === 'TAXISTA' && 
        u.estado === 'asociado' && 
        u.patronId === user.id
      );
      
      // Count pending requests
      const pendingRequests = requests.filter(r => 
        r.estado === 'pendiente' && r.patronId === user.id
      );
      
      // Get services for today
      const services = await this.reconcileAdapter.getServices();
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate today's stats
      const todayServices = services.filter(s => {
        const serviceDate = new Date(s.datetime || s.date).toISOString().split('T')[0];
        return serviceDate === today && associatedTaxistas.some(t => t.id === s.userId);
      });
      const todayIncome = todayServices.reduce((sum, s) => sum + parseFloat(s.netAmount || s.totalAmount || 0), 0);
      
      // Build HTML
      let html = `
        <!-- Invitation Code Card -->
        <ion-card color="primary">
          <ion-card-header>
            <ion-card-subtitle style="color: rgba(255,255,255,0.8);">Tu Código de Invitación</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content style="text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: white; background: rgba(255,255,255,0.2); padding: 16px; border-radius: 12px; letter-spacing: 4px;">
              ${user.codigoInvitacion || 'No disponible'}
            </div>
            <p style="font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 12px;">
              Comparte este código con nuevos taxistas para que se unan a tu flota
            </p>
          </ion-card-content>
        </ion-card>
        
        <!-- Fleet Stats -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <ion-card style="margin: 0;">
            <ion-card-content style="text-align: center; padding: 16px;">
              <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-primary);">${associatedTaxistas.length}</div>
              <div style="font-size: 12px; color: var(--ion-color-medium);">Taxistas</div>
            </ion-card-content>
          </ion-card>
          <ion-card style="margin: 0;">
            <ion-card-content style="text-align: center; padding: 16px;">
              <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-warning);">${pendingRequests.length}</div>
              <div style="font-size: 12px; color: var(--ion-color-medium);">Solicitudes</div>
            </ion-card-content>
          </ion-card>
          <ion-card style="margin: 0;">
            <ion-card-content style="text-align: center; padding: 16px;">
              <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-success);">${todayServices.length}</div>
              <div style="font-size: 12px; color: var(--ion-color-medium);">Servicios Hoy</div>
            </ion-card-content>
          </ion-card>
          <ion-card style="margin: 0;">
            <ion-card-content style="text-align: center; padding: 16px;">
              <div style="font-size: 20px; font-weight: bold; color: var(--ion-color-tertiary);">€${todayIncome.toFixed(2)}</div>
              <div style="font-size: 12px; color: var(--ion-color-medium);">Ingresos Hoy</div>
            </ion-card-content>
          </ion-card>
        </div>
      `;
      
      // Show pending requests alert if any
      if (pendingRequests.length > 0) {
        html += `
          <ion-card color="warning">
            <ion-card-content>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <ion-icon name="alert-circle" style="font-size: 32px;"></ion-icon>
                  <div>
                    <div style="font-weight: bold;">Tienes ${pendingRequests.length} solicitud${pendingRequests.length > 1 ? 'es' : ''} pendiente${pendingRequests.length > 1 ? 's' : ''}</div>
                    <div style="font-size: 12px; opacity: 0.9;">Revisa y aprueba las solicitudes de unión</div>
                  </div>
                </div>
                <ion-button fill="solid" color="light" onclick="window.app.showFleetManagement()">
                  Ver
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        `;
      }
      
      // Show fleet list or empty state
      if (associatedTaxistas.length === 0) {
        html += `
          <ion-card>
            <ion-card-content style="text-align: center; padding: 40px 20px;">
              <ion-icon name="people" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
              <h2 style="margin-top: 16px;">No tienes taxistas en tu flota</h2>
              <p style="color: var(--ion-color-medium); margin-bottom: 20px;">
                Comparte tu código de invitación para que se unan
              </p>
              <ion-button expand="block" color="primary" onclick="window.app.showFleetManagement()">
                <ion-icon slot="start" name="add-circle"></ion-icon>
                Gestionar Flota
              </ion-button>
            </ion-card-content>
          </ion-card>
        `;
      } else {
        const taxistaList = associatedTaxistas.slice(0, 3).map(taxista => {
          const taxistaServices = services.filter(s => {
            const serviceDate = new Date(s.datetime || s.date).toISOString().split('T')[0];
            return s.userId === taxista.id && serviceDate === today;
          });
          const todayIncome = taxistaServices.reduce((sum, s) => 
            sum + parseFloat(s.netAmount || s.totalAmount || 0), 0
          );
          
          return `
            <ion-item button onclick="window.app.viewTaxistaDetails(${taxista.id})">
              <ion-avatar slot="start">
                <div style="background: var(--ion-color-success); color: white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold; font-size: 14px;">
                  ${taxista.numeroTaxista?.slice(-2) || '??'}
                </div>
              </ion-avatar>
              <ion-label>
                <h2>${taxista.nombre}</h2>
                <p>${taxista.numeroTaxista || 'Sin número'}</p>
                <p style="font-size: 11px; color: var(--ion-color-success);">
                  Hoy: ${taxistaServices.length} servicios • €${todayIncome.toFixed(2)}
                </p>
              </ion-label>
              <ion-badge color="success" slot="end">Activo</ion-badge>
            </ion-item>
          `;
        }).join('');
        
        html += `
          <ion-card>
            <ion-card-header>
              <ion-card-title>Tu Flota</ion-card-title>
            </ion-card-header>
            <ion-card-content style="padding: 0;">
              <ion-list>
                ${taxistaList}
              </ion-list>
              <div style="padding: 16px;">
                <ion-button expand="block" color="primary" onclick="window.app.showFleetManagement()">
                  <ion-icon slot="start" name="people"></ion-icon>
                  Ver Todos (${associatedTaxistas.length})
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        `;
      }
      
      container.innerHTML = html;
    } catch (error) {
      console.error('Error displaying fleet info:', error);
      container.innerHTML = '';
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.DashboardView = DashboardView;
}

console.log('DashboardView component loaded');
