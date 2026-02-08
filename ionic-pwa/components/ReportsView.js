/**
 * ReportsView Component
 * Displays reports and statistics
 */

class ReportsView {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
  }

  /**
   * Show reports modal
   */
  async show() {
    const user = this.authAdapter.getCurrentUser();
    if (!user) {
      ToastManager.showError('Debes iniciar sesión');
      return;
    }

    const modal = await this.createModal(user);
    await modal.present();
  }

  /**
   * Create reports modal
   */
  async createModal(user) {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>📊 Reportes y Estadísticas</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div id="reports-content">
          <ion-spinner name="circles"></ion-spinner>
        </div>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();

    // Load reports data
    await this.loadReports(user);

    return modal;
  }

  /**
   * Load reports data
   */
  async loadReports(user) {
    try {
      const services = await this.reconcileAdapter.getServices();
      const expenses = await this.reconcileAdapter.getExpenses();
      
      // Filter by role
      const filteredServices = this.filterByRole(services, user);
      const filteredExpenses = this.filterByRole(expenses, user);
      
      // Calculate statistics
      const stats = this.calculateStats(filteredServices, filteredExpenses);
      
      // Render reports
      this.renderReports(stats, user);
    } catch (error) {
      console.error('Error loading reports:', error);
      ToastManager.showError('Error al cargar reportes');
    }
  }

  /**
   * Filter data by role
   */
  filterByRole(data, user) {
    if (!user || !data) return [];
    
    if (user.rol === 'TAXISTA') {
      return data.filter(item => item.userId === user.id);
    }
    
    if (user.rol === 'PATRON') {
      // Get associated taxistas
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const associatedTaxistas = users.filter(u => 
        u.rol === 'TAXISTA' && 
        u.estado === 'asociado' && 
        u.patronId === user.id
      );
      const taxistaIds = associatedTaxistas.map(t => t.id);
      
      return data.filter(item => taxistaIds.includes(item.userId));
    }
    
    return data;
  }

  /**
   * Calculate statistics
   */
  calculateStats(services, expenses) {
    const totalServices = services.length;
    const totalIncome = services.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netAmount = totalIncome - totalExpenses;
    const averageService = totalServices > 0 ? totalIncome / totalServices : 0;
    
    // Group by date (last 7 days)
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayServices = services.filter(s => s.date === dateStr);
      const dayIncome = dayServices.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
      
      last7Days.push({
        date: dateStr,
        label: this.formatDateLabel(date),
        services: dayServices.length,
        income: dayIncome
      });
    }
    
    // Group by payment type
    const byPaymentType = {};
    services.forEach(service => {
      const type = service.paymentType || 'cash';
      if (!byPaymentType[type]) {
        byPaymentType[type] = {
          count: 0,
          income: 0
        };
      }
      byPaymentType[type].count++;
      byPaymentType[type].income += parseFloat(service.totalAmount || 0);
    });
    
    return {
      totalServices,
      totalIncome,
      totalExpenses,
      netAmount,
      averageService,
      last7Days,
      byPaymentType
    };
  }

  /**
   * Format date label
   */
  formatDateLabel(date) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  }

  /**
   * Render reports
   */
  renderReports(stats, user) {
    const container = document.getElementById('reports-content');
    if (!container) return;
    
    const paymentIcons = {
      cash: '💵',
      card: '💳',
      app: '📱'
    };
    
    const paymentLabels = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      app: 'App'
    };
    
    container.innerHTML = `
      <!-- Summary Cards -->
      <ion-grid>
        <ion-row>
          <ion-col size="6">
            <ion-card color="primary">
              <ion-card-content style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">${stats.totalServices}</div>
                <div style="font-size: 12px;">Total Servicios</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card color="success">
              <ion-card-content style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">€${stats.totalIncome.toFixed(2)}</div>
                <div style="font-size: 12px;">Ingresos Totales</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col size="6">
            <ion-card color="warning">
              <ion-card-content style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">€${stats.averageService.toFixed(2)}</div>
                <div style="font-size: 12px;">Promedio/Servicio</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card color="tertiary">
              <ion-card-content style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold;">€${stats.netAmount.toFixed(2)}</div>
                <div style="font-size: 12px;">Neto</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      <!-- Last 7 Days Chart -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Últimos 7 Días</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 150px; border-bottom: 1px solid var(--ion-color-medium);">
            ${stats.last7Days.map(day => {
              const maxIncome = Math.max(...stats.last7Days.map(d => d.income), 1);
              const height = (day.income / maxIncome) * 100;
              return `
                <div style="text-align: center; flex: 1;">
                  <div style="background: var(--ion-color-primary); height: ${height}%; min-height: 5px; margin: 0 5px; border-radius: 4px 4px 0 0;"></div>
                  <div style="font-size: 10px; margin-top: 5px;">${day.label}</div>
                  <div style="font-size: 10px; color: var(--ion-color-medium);">${day.services}</div>
                </div>
              `;
            }).join('')}
          </div>
        </ion-card-content>
      </ion-card>
      
      <!-- By Payment Type -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Por Método de Pago</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            ${Object.entries(stats.byPaymentType).map(([type, data]) => `
              <ion-item>
                <div slot="start" style="font-size: 24px;">${paymentIcons[type] || '💵'}</div>
                <ion-label>
                  <h2>${paymentLabels[type] || type}</h2>
                  <p>${data.count} servicio${data.count !== 1 ? 's' : ''}</p>
                </ion-label>
                <ion-note slot="end" color="success">€${data.income.toFixed(2)}</ion-note>
              </ion-item>
            `).join('')}
          </ion-list>
        </ion-card-content>
      </ion-card>
      
      <!-- Export Button -->
      <ion-button expand="block" color="primary" onclick="window.app.exportReports()">
        <ion-icon name="download" slot="start"></ion-icon>
        Exportar Reporte
      </ion-button>
    `;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ReportsView = ReportsView;
}

console.log('ReportsView component loaded');
