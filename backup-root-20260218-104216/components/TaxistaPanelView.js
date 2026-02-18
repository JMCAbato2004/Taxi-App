/**
 * TaxistaPanelView Component
 * Personal panel for taxistas with detailed statistics
 * Based on main branch taxista-panel.html
 */

class TaxistaPanelView {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    
    // Date range for filtering
    this.selectedStartDate = null;
    this.selectedEndDate = null;
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
    // Set default date range: from first day of current month to today
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    this.selectedStartDate = firstDay.toISOString().split('T')[0];
    this.selectedEndDate = now.toISOString().split('T')[0];
    
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
        <ion-toolbar>
          <div style="display: flex; gap: 8px; padding: 8px; align-items: center; flex-wrap: wrap;">
            <ion-label style="font-size: 14px; font-weight: 500;">Período:</ion-label>
            <input 
              type="date" 
              id="panelStartDate" 
              value="${this.selectedStartDate}"
              style="padding: 8px; border: 1px solid var(--ion-color-medium); border-radius: 4px; font-size: 14px;"
            />
            <ion-label style="font-size: 14px;">-</ion-label>
            <input 
              type="date" 
              id="panelEndDate" 
              value="${this.selectedEndDate}"
              style="padding: 8px; border: 1px solid var(--ion-color-medium); border-radius: 4px; font-size: 14px;"
            />
            <ion-button size="small" id="applyPanelDateRange">
              <ion-icon name="checkmark" slot="start"></ion-icon>
              Aplicar
            </ion-button>
          </div>
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
    
    // Add event listener for date range filter
    const applyButton = modal.querySelector('#applyPanelDateRange');
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        const startDateInput = modal.querySelector('#panelStartDate');
        const endDateInput = modal.querySelector('#panelEndDate');
        
        if (startDateInput && endDateInput) {
          this.selectedStartDate = startDateInput.value;
          this.selectedEndDate = endDateInput.value;
          this.loadPanelData(user);
        }
      });
    }

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
      let myServices = allServices.filter(s => s.userId === user.id);
      let myExpenses = allExpenses.filter(e => e.userId === user.id);
      
      console.log('My services:', myServices.length);
      console.log('My expenses:', myExpenses.length);
      
      // Filter by date range
      if (this.selectedStartDate && this.selectedEndDate) {
        const startDate = new Date(this.selectedStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(this.selectedEndDate);
        endDate.setHours(23, 59, 59, 999);
        
        myServices = myServices.filter(s => {
          const serviceDate = new Date(s.datetime || s.date);
          return serviceDate >= startDate && serviceDate <= endDate;
        });
        
        myExpenses = myExpenses.filter(e => {
          const expenseDate = new Date(e.date || e.createdAt);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
        
        console.log('Filtered services:', myServices.length);
        console.log('Filtered expenses:', myExpenses.length);
      }
      
      // Calculate statistics for the selected period
      const stats = this.calculateStats(myServices, myExpenses);
      
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
  calculateStats(services, expenses) {
    const totalServices = services.length;
    const grossEarnings = services.reduce((sum, s) => sum + (s.amount || 0), 0);
    const commissions = services.reduce((sum, s) => sum + (s.commission || 0), 0);
    const tips = services.reduce((sum, s) => sum + (s.tip || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Calculate total income (earnings + tips)
    const totalIncome = grossEarnings + tips;
    
    // Calculate net earnings (income - commissions - expenses)
    const netEarnings = grossEarnings + tips - commissions - totalExpenses;
    
    // Group by source
    const bySource = {};
    services.forEach(service => {
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
      totalServices,
      grossEarnings,
      commissions,
      tips,
      totalExpenses,
      totalIncome,
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
      
      <!-- Period Info -->
      <div style="margin-bottom: 12px; text-align: center; color: var(--ion-color-medium); font-size: 14px;">
        ${this.selectedStartDate && this.selectedEndDate ? 
          `Del ${new Date(this.selectedStartDate).toLocaleDateString('es-ES')} al ${new Date(this.selectedEndDate).toLocaleDateString('es-ES')}` : 
          'Período actual'}
      </div>
      
      <!-- Stats Grid - 6 cards in 3 rows (2 per row) -->
      <ion-grid>
        <ion-row>
          <ion-col size="6">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-primary);">${stats.totalServices}</div>
                <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Total Servicios</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-success);">€${stats.totalIncome.toFixed(2)}</div>
                <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Ingresos Totales</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col size="6">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-tertiary);">€${stats.tips.toFixed(2)}</div>
                <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Propinas</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-danger);">€${stats.totalExpenses.toFixed(2)}</div>
                <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Gastos</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col size="6">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-warning);">€${stats.commissions.toFixed(2)}</div>
                <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Comisiones</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card style="margin: 0; background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 32px; font-weight: bold; color: white;">€${stats.netEarnings.toFixed(2)}</div>
                <div style="font-size: 13px; color: white; margin-top: 4px; font-weight: 500;">Neto</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      ${stats.totalServices === 0 ? `
        <div style="text-align: center; padding: 40px; margin-top: 20px;">
          <ion-icon name="calendar-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
          <h3 style="color: var(--ion-color-medium); margin-top: 16px;">No hay servicios en este período</h3>
          <p style="color: var(--ion-color-medium); font-size: 14px;">Selecciona otro rango de fechas para ver tus servicios</p>
        </div>
      ` : ''}
      
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
                <ion-card-title style="font-size: 16px;">Balance del Período</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div style="background: var(--ion-color-light); padding: 16px; border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Ingresos Brutos:</span>
                    <span style="font-weight: bold; color: var(--ion-color-success);">€${stats.grossEarnings.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Propinas:</span>
                    <span style="font-weight: bold; color: var(--ion-color-success);">+€${stats.tips.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Comisiones:</span>
                    <span style="font-weight: bold; color: var(--ion-color-danger);">-€${stats.commissions.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span>Gastos:</span>
                    <span style="font-weight: bold; color: var(--ion-color-danger);">-€${stats.totalExpenses.toFixed(2)}</span>
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
