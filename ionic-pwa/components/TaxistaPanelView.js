/**
 * TaxistaPanelView Component
 * Personal panel for taxistas with detailed statistics
 * Based on main branch taxista-panel.html
 */

class TaxistaPanelView {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
  }

  /**
   * Show taxista panel modal
   */
  async show() {
    const user = this.authAdapter.getCurrentUser();
    if (!user || user.rol !== 'TAXISTA') {
      ToastManager.showError('Solo disponible para taxistas');
      return;
    }

    const modal = await this.createModal(user);
    await modal.present();
    
    // Load data after modal is visible
    setTimeout(() => this.loadPanelData(user), 300);
  }

  /**
   * Create panel modal
   */
  async createModal(user) {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>🚗 Mi Panel Personal</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div id="taxista-panel-content">
          <div style="text-align: center; padding: 40px;">
            <ion-spinner name="circles"></ion-spinner>
            <p style="margin-top: 16px; color: var(--ion-color-medium);">Cargando panel...</p>
          </div>
        </div>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();

    return modal;
  }

  /**
   * Load panel data
   */
  async loadPanelData(user) {
    try {
      // Get all services, users, and expenses
      const allServices = JSON.parse(localStorage.getItem('taxi_services') || '[]');
      const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const allExpenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
      
      console.log('Loading panel for user:', user.id);
      console.log('Total services in storage:', allServices.length);
      console.log('Total expenses in storage:', allExpenses.length);
      
      // Filter user's services - use userId field
      const myServices = allServices.filter(s => s.userId === user.id);
      const myExpenses = allExpenses.filter(e => e.userId === user.id);
      
      console.log('My services:', myServices.length);
      console.log('My expenses:', myExpenses.length);
      
      // Get today's services and expenses
      const today = new Date().toISOString().split('T')[0];
      const todayServices = myServices.filter(s => {
        const serviceDate = s.date || new Date(s.datetime).toISOString().split('T')[0];
        return serviceDate === today;
      });
      const todayExpenses = myExpenses.filter(e => {
        const expenseDate = e.date || new Date(e.createdAt).toISOString().split('T')[0];
        return expenseDate === today;
      });
      
      console.log('Today services:', todayServices.length);
      console.log('Today expenses:', todayExpenses.length);
      
      // Calculate statistics
      const stats = this.calculateStats(todayServices, myServices, todayExpenses);
      
      // Get user status
      const userRecord = allUsers.find(u => u.id === user.id);
      const status = this.getUserStatus(userRecord, allUsers);
      
      // Render panel
      this.renderPanel(user, stats, status, myServices);
    } catch (error) {
      console.error('Error loading panel data:', error);
      const container = document.getElementById('taxista-panel-content');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <ion-icon name="alert-circle" style="font-size: 64px; color: var(--ion-color-danger);"></ion-icon>
            <h2>Error al cargar panel</h2>
            <p style="color: var(--ion-color-medium);">${error.message}</p>
          </div>
        `;
      }
    }
  }

  /**
   * Calculate statistics
   */
  calculateStats(todayServices, allServices, todayExpenses) {
    const servicesToday = todayServices.length;
    const grossEarnings = todayServices.reduce((sum, s) => sum + (s.amount || 0), 0);
    const commissions = todayServices.reduce((sum, s) => sum + (s.commission || 0), 0);
    const tips = todayServices.reduce((sum, s) => sum + (s.tip || 0), 0);
    const expenses = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netEarnings = grossEarnings + tips - commissions - expenses;
    
    // Group by source
    const bySource = {};
    todayServices.forEach(service => {
      const source = service.serviceSource || 'otro';
      if (!bySource[source]) {
        bySource[source] = {
          count: 0,
          gross: 0,
          net: 0,
          commissions: 0
        };
      }
      bySource[source].count++;
      bySource[source].gross += service.amount || 0;
      bySource[source].net += service.netAmount || 0;
      bySource[source].commissions += service.commission || 0;
    });
    
    return {
      servicesToday,
      grossEarnings,
      commissions,
      tips,
      expenses,
      netEarnings,
      bySource
    };
  }

  /**
   * Get user status
   */
  getUserStatus(userRecord, allUsers) {
    if (!userRecord) return 'Independiente';
    
    switch (userRecord.estado) {
      case 'solicitando':
        return 'Solicitud Pendiente';
      case 'asociado':
        const patron = allUsers.find(u => u.id === userRecord.patronId);
        return `Asociado a ${patron?.nombre || 'Patrón'}`;
      default:
        return 'Independiente';
    }
  }

  /**
   * Render panel
   */
  renderPanel(user, stats, status, allServices) {
    const container = document.getElementById('taxista-panel-content');
    if (!container) return;
    
    const sourceIcons = {
      emisora: '📻',
      calle: '🚶',
      uber: '🚗',
      freenow: '🚕',
      otro: '📋'
    };
    
    const sourceLabels = {
      emisora: 'Emisora',
      calle: 'Calle',
      uber: 'Uber',
      freenow: 'FreeNow',
      otro: 'Otro'
    };
    
    // Get recent services (last 5)
    const recentServices = allServices.slice(-5).reverse();
    
    container.innerHTML = `
      <!-- User Info Card -->
      <ion-card>
        <ion-card-content>
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="width: 60px; height: 60px; background: var(--ion-color-primary-tint); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
              <ion-icon name="person" style="font-size: 32px; color: var(--ion-color-primary);"></ion-icon>
            </div>
            <div style="flex: 1;">
              <h2 style="margin: 0; font-size: 20px; font-weight: bold;">${user.nombre}</h2>
              <p style="margin: 4px 0 0 0; color: var(--ion-color-medium);">
                Número: <strong style="color: var(--ion-color-primary);">${user.numeroTaxista || 'Sin asignar'}</strong>
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--ion-color-medium);">
                Estado: <strong>${status}</strong>
              </p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
      
      <!-- Stats Grid -->
      <ion-grid>
        <ion-row>
          <ion-col size="6" size-md="4">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-success);">${stats.servicesToday}</div>
                <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Servicios Hoy</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-md="4">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-primary);">€${stats.grossEarnings.toFixed(2)}</div>
                <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Ingresos Brutos</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-md="4">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-tertiary);">€${stats.tips.toFixed(2)}</div>
                <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Propinas</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col size="6" size-md="4">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-danger);">€${stats.commissions.toFixed(2)}</div>
                <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Comisiones</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-md="4">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-warning);">€${stats.expenses.toFixed(2)}</div>
                <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Gastos</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-md="4">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-success);">€${stats.netEarnings.toFixed(2)}</div>
                <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Neto Final</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      <!-- Content Grid -->
      <ion-grid>
        <ion-row>
          <!-- Recent Services -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title style="font-size: 16px;">Servicios Recientes</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                ${this.renderRecentServices(recentServices, sourceIcons)}
              </ion-card-content>
            </ion-card>
          </ion-col>
          
          <!-- Source Breakdown & Balance -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title style="font-size: 16px;">Resumen por Origen</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                ${this.renderSourceBreakdown(stats.bySource, sourceIcons, sourceLabels)}
              </ion-card-content>
            </ion-card>
            
            <ion-card style="margin-top: 16px;">
              <ion-card-header>
                <ion-card-title style="font-size: 16px;">Balance de Hoy</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div style="background: var(--ion-color-light); padding: 16px; border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Ingresos Brutos:</span>
                    <span style="font-weight: bold; color: var(--ion-color-success);">€${stats.grossEarnings.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Comisiones:</span>
                    <span style="font-weight: bold; color: var(--ion-color-danger);">-€${stats.commissions.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span>Propinas:</span>
                    <span style="font-weight: bold; color: var(--ion-color-success);">+€${stats.tips.toFixed(2)}</span>
                  </div>
                  <div style="border-top: 2px solid var(--ion-color-medium); padding-top: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-size: 18px; font-weight: bold;">Total Neto:</span>
                      <span style="font-size: 18px; font-weight: bold; color: var(--ion-color-primary);">€${stats.netEarnings.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    `;
  }

  /**
   * Render recent services
   */
  renderRecentServices(services, sourceIcons) {
    if (services.length === 0) {
      return `
        <div style="text-align: center; padding: 20px;">
          <ion-icon name="car" style="font-size: 48px; color: var(--ion-color-medium);"></ion-icon>
          <p style="color: var(--ion-color-medium); margin-top: 8px;">No hay servicios registrados</p>
        </div>
      `;
    }
    
    return `
      <ion-list style="background: transparent;">
        ${services.map(service => {
          const serviceDate = service.datetime ? new Date(service.datetime) : new Date(service.date);
          const timeStr = serviceDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const dateStr = serviceDate.toLocaleDateString();
          const netAmount = service.netAmount || service.totalAmount || service.amount || 0;
          const baseAmount = service.amount || 0;
          
          return `
            <ion-item lines="full" style="--background: var(--ion-color-light); margin-bottom: 8px; border-radius: 8px;">
              <div slot="start" style="font-size: 24px;">${sourceIcons[service.serviceSource] || '🚕'}</div>
              <ion-label>
                <h3 style="font-weight: 600;">${service.origin || 'Origen'} → ${service.destination || 'Destino'}</h3>
                <p style="font-size: 12px; color: var(--ion-color-medium);">${dateStr} ${timeStr}</p>
              </ion-label>
              <div slot="end" style="text-align: right;">
                <div style="font-weight: bold; color: var(--ion-color-success);">€${parseFloat(netAmount).toFixed(2)}</div>
                ${baseAmount !== netAmount ? `<div style="font-size: 11px; color: var(--ion-color-medium);">Base: €${parseFloat(baseAmount).toFixed(2)}</div>` : ''}
              </div>
            </ion-item>
          `;
        }).join('')}
      </ion-list>
    `;
  }

  /**
   * Render source breakdown
   */
  renderSourceBreakdown(bySource, sourceIcons, sourceLabels) {
    if (Object.keys(bySource).length === 0) {
      return `
        <div style="text-align: center; padding: 20px;">
          <p style="color: var(--ion-color-medium);">No hay servicios hoy</p>
        </div>
      `;
    }
    
    return `
      <ion-list style="background: transparent;">
        ${Object.entries(bySource).map(([source, data]) => `
          <ion-item lines="full" style="--background: var(--ion-color-light); margin-bottom: 8px; border-radius: 8px;">
            <div slot="start" style="font-size: 24px;">${sourceIcons[source] || '📋'}</div>
            <ion-label>
              <h3 style="font-weight: 600; text-transform: capitalize;">${sourceLabels[source] || source}</h3>
              <p style="font-size: 12px; color: var(--ion-color-medium);">${data.count} servicio${data.count !== 1 ? 's' : ''}</p>
            </ion-label>
            <div slot="end" style="text-align: right;">
              <div style="font-weight: bold; color: var(--ion-color-success);">€${data.net.toFixed(2)}</div>
              ${data.commissions > 0 ? `<div style="font-size: 11px; color: var(--ion-color-danger);">-€${data.commissions.toFixed(2)}</div>` : ''}
            </div>
          </ion-item>
        `).join('')}
      </ion-list>
    `;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.TaxistaPanelView = TaxistaPanelView;
}

console.log('TaxistaPanelView component loaded');
