/**
 * ReportsView Component
 * Displays advanced reports and statistics with Chart.js
 * Based on main branch reports.html functionality
 */

console.log('ReportsView: Loading component...');

class ReportsView {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.servicesChart = null;
    this.earningsChart = null;
    this.currentModal = null;
    
    // Initialize date range (default: from day 1 of current month to today)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = firstDayOfMonth.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
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
    
    // Load data after modal is visible
    setTimeout(() => this.loadReports(user), 300);
  }

  /**
   * Create reports modal
   */
  async createModal(user) {
    const modal = document.createElement('ion-modal');
    
    // Build date range selector HTML (only for PATRON)
    const dateRangeHTML = user.rol === 'PATRON' ? `
      <ion-toolbar>
        <ion-grid>
          <ion-row class="ion-align-items-center">
            <ion-col size="12" size-md="5">
              <ion-item lines="none">
                <ion-label position="stacked">Desde</ion-label>
                <ion-input 
                  id="reports-start-date" 
                  type="date" 
                  value="${this.startDate}">
                </ion-input>
              </ion-item>
            </ion-col>
            <ion-col size="12" size-md="5">
              <ion-item lines="none">
                <ion-label position="stacked">Hasta</ion-label>
                <ion-input 
                  id="reports-end-date" 
                  type="date" 
                  value="${this.endDate}">
                </ion-input>
              </ion-item>
            </ion-col>
            <ion-col size="12" size-md="2">
              <ion-button 
                expand="block" 
                id="reports-filter-btn"
                style="margin-top: 20px;">
                <ion-icon slot="start" name="funnel"></ion-icon>
                Filtrar
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-toolbar>
    ` : '';
    
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
        ${dateRangeHTML}
      </ion-header>
      <ion-content class="ion-padding">
        <div id="reports-content">
          <div style="text-align: center; padding: 40px;">
            <ion-spinner name="circles"></ion-spinner>
            <p style="margin-top: 16px; color: var(--ion-color-medium);">Cargando reportes...</p>
          </div>
        </div>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();
    
    this.currentModal = modal;

    // Setup filter button event listener (only for PATRON)
    if (user.rol === 'PATRON') {
      const filterBtn = modal.querySelector('#reports-filter-btn');
      if (filterBtn) {
        filterBtn.addEventListener('click', async () => {
          const startDateInput = modal.querySelector('#reports-start-date');
          const endDateInput = modal.querySelector('#reports-end-date');
          
          this.startDate = startDateInput.value;
          this.endDate = endDateInput.value;
          
          console.log('Filtering reports from', this.startDate, 'to', this.endDate);
          await this.loadReports(user);
        });
      }
    }

    // Listen for service updates to refresh reports
    const serviceUpdateHandler = async () => {
      console.log('Reloading reports due to service-saved event');
      // Only reload if modal is still present
      if (document.body.contains(modal)) {
        await this.loadReports(user);
      }
    };
    window.addEventListener('service-saved', serviceUpdateHandler);

    // Clean up listener when modal is dismissed
    modal.addEventListener('ionModalDidDismiss', () => {
      window.removeEventListener('service-saved', serviceUpdateHandler);
      this.currentModal = null;
    });

    return modal;
  }

  /**
   * Load reports data
   */
  async loadReports(user) {
    try {
      console.log('ReportsView.loadReports: Starting for user:', user.id, user.rol);
      
      // Get all services using ReconcileAdapter (handles role filtering)
      const allServices = await this.reconcileAdapter.getServices();
      console.log('ReportsView.loadReports: Services from adapter:', allServices.length);
      
      // Get all users
      const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      console.log('ReportsView.loadReports: Total users:', allUsers.length);
      
      // Filter services by role
      let relevantServices = [];
      let relevantTaxistas = [];
      
      if (user.rol === 'PATRON') {
        console.log('ReportsView.loadReports: PATRON mode');
        // Get associated taxistas
        relevantTaxistas = allUsers.filter(u => 
          u.rol === 'TAXISTA' && 
          u.estado === 'asociado' && 
          u.patronId === user.id
        );
        console.log('ReportsView.loadReports: Associated taxistas:', relevantTaxistas.length);
        
        // Get services from associated taxistas
        const taxistaIds = relevantTaxistas.map(t => t.id);
        relevantServices = allServices.filter(s => taxistaIds.includes(s.userId));
        
        // Filter by date range
        console.log('ReportsView.loadReports: Filtering by date range:', this.startDate, 'to', this.endDate);
        relevantServices = relevantServices.filter(s => {
          const serviceDate = s.date || new Date(s.datetime).toISOString().split('T')[0];
          return serviceDate >= this.startDate && serviceDate <= this.endDate;
        });
        
        console.log('ReportsView.loadReports: Filtered services for PATRON:', relevantServices.length);
      } else if (user.rol === 'TAXISTA') {
        console.log('ReportsView.loadReports: TAXISTA mode');
        // Only own services
        relevantServices = allServices.filter(s => s.userId === user.id);
        relevantTaxistas = [user];
        console.log('ReportsView.loadReports: Filtered services for TAXISTA:', relevantServices.length);
      }
      
      console.log('ReportsView.loadReports: Calculating stats...');
      // Calculate statistics
      const stats = this.calculateAdvancedStats(relevantServices, relevantTaxistas, allUsers);
      console.log('ReportsView.loadReports: Stats calculated:', stats);
      
      // Render reports
      this.renderAdvancedReports(stats, user, relevantTaxistas);
      
      // Render charts after DOM is ready
      setTimeout(() => {
        this.renderCharts(stats, relevantTaxistas);
      }, 100);
    } catch (error) {
      console.error('Error loading reports:', error);
      const container = document.getElementById('reports-content');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <ion-icon name="alert-circle" style="font-size: 64px; color: var(--ion-color-danger);"></ion-icon>
            <h2>Error al cargar reportes</h2>
            <p style="color: var(--ion-color-medium);">${error.message}</p>
          </div>
        `;
      }
    }
  }

  /**
   * Calculate advanced statistics
   */
  calculateAdvancedStats(services, taxistas, allUsers) {
    const totalServices = services.length;
    const totalEarnings = services.reduce((sum, s) => sum + (s.amount || 0), 0);
    const averageService = totalServices > 0 ? totalEarnings / totalServices : 0;
    const activeTaxistas = taxistas.length;
    
    // Calculate total commissions, tips, and expenses
    const totalCommissions = services.reduce((sum, s) => sum + (s.commission || 0), 0);
    const totalTips = services.reduce((sum, s) => sum + (s.tip || 0), 0);
    
    // Get expenses for all taxistas in the fleet
    const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
    const taxistaIds = taxistas.map(t => t.id);
    
    // Filter expenses by taxistas and date range
    const filteredExpenses = expenses
      .filter(e => {
        if (!taxistaIds.includes(e.userId)) return false;
        
        // Filter by date range (only for PATRON with date filter)
        if (this.startDate && this.endDate) {
          const expenseDate = e.date || new Date(e.createdAt).toISOString().split('T')[0];
          return expenseDate >= this.startDate && expenseDate <= this.endDate;
        }
        
        return true;
      });
    
    const totalExpenses = filteredExpenses
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Calculate Total Neto: Ingresos - Gastos - Comisiones + Propinas
    const totalNeto = totalEarnings - totalExpenses - totalCommissions + totalTips;
    
    // Services by day (last 7 days)
    const last7Days = this.getServicesLast7Days(services);
    
    // Neto by day (last 7 days) - for chart
    const netoLast7Days = this.getNetoLast7Days(services, taxistas);
    
    // Earnings by taxista
    const earningsByTaxista = this.getEarningsByTaxista(services, taxistas);
    
    // Detailed taxista stats
    const taxistaStats = this.getTaxistaDetailedStats(services, taxistas);
    
    return {
      totalServices,
      totalEarnings,
      averageService,
      activeTaxistas,
      totalCommissions,
      totalTips,
      totalExpenses,
      totalNeto,
      last7Days,
      netoLast7Days,
      earningsByTaxista,
      taxistaStats
    };
  }
  
  /**
   * Get services for last 7 days
   */
  getServicesLast7Days(services) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dailyServices = {};
    
    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = days[date.getDay()];
      dailyServices[dayName] = 0;
    }
    
    // Count services per day
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    console.log('getServicesLast7Days: Total services to process:', services.length);
    console.log('getServicesLast7Days: Week ago date:', weekAgo.toISOString());
    
    services.forEach(service => {
      const serviceDate = new Date(service.datetime || service.date);
      console.log('getServicesLast7Days: Service date:', serviceDate.toISOString(), 'is after weekAgo:', serviceDate >= weekAgo);
      
      if (serviceDate >= weekAgo) {
        const dayName = days[serviceDate.getDay()];
        if (dailyServices.hasOwnProperty(dayName)) {
          dailyServices[dayName]++;
          console.log('getServicesLast7Days: Added service to', dayName, '- new count:', dailyServices[dayName]);
        }
      }
    });
    
    console.log('getServicesLast7Days: Final daily services:', dailyServices);
    return dailyServices;
  }
  
  /**
   * Get net earnings for last 7 days (for PATRON view)
   */
  getNetoLast7Days(services, taxistas) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dailyNeto = {};
    
    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = days[date.getDay()];
      dailyNeto[dayName] = 0;
    }
    
    // Get expenses
    const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
    const taxistaIds = taxistas.map(t => t.id);
    
    // Calculate neto per day
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Process services
    services.forEach(service => {
      const serviceDate = new Date(service.datetime || service.date);
      if (serviceDate >= weekAgo) {
        const dayName = days[serviceDate.getDay()];
        if (dailyNeto.hasOwnProperty(dayName)) {
          const amount = service.amount || 0;
          const commission = service.commission || 0;
          const tip = service.tip || 0;
          // Neto = amount - commission + tip
          dailyNeto[dayName] += (amount - commission + tip);
        }
      }
    });
    
    // Subtract expenses per day
    expenses.forEach(expense => {
      if (taxistaIds.includes(expense.userId)) {
        const expenseDate = new Date(expense.date || expense.createdAt);
        if (expenseDate >= weekAgo) {
          const dayName = days[expenseDate.getDay()];
          if (dailyNeto.hasOwnProperty(dayName)) {
            dailyNeto[dayName] -= (expense.amount || 0);
          }
        }
      }
    });
    
    return dailyNeto;
  }
  
  /**
   * Get earnings by taxista
   */
  getEarningsByTaxista(services, taxistas) {
    return taxistas.map(taxista => {
      const taxistaServices = services.filter(s => s.userId === taxista.id);
      const earnings = taxistaServices.reduce((sum, s) => sum + (s.amount || 0), 0);
      return {
        name: taxista.nombre,
        earnings: earnings
      };
    }).filter(t => t.earnings > 0);
  }
  
  /**
   * Get detailed stats per taxista
   */
  getTaxistaDetailedStats(services, taxistas) {
    // Load balance settings for all taxistas
    const balanceSettings = JSON.parse(localStorage.getItem('taxi_balance_settings_per_taxista') || '{}');
    
    return taxistas.map(taxista => {
      const taxistaServices = services.filter(s => s.userId === taxista.id);
      const totalServices = taxistaServices.length;
      const grossEarnings = taxistaServices.reduce((sum, s) => sum + (s.amount || 0), 0);
      const commissions = taxistaServices.reduce((sum, s) => sum + (s.commission || 0), 0);
      const tips = taxistaServices.reduce((sum, s) => sum + (s.tip || 0), 0);
      
      // Get expenses
      const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
      const taxistaExpenses = expenses.filter(e => e.userId === taxista.id);
      const totalExpenses = taxistaExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      // Get balance settings for this taxista
      const settings = balanceSettings[taxista.id] || {
        patronPercentage: 20,
        tipDistribution: 'taxista',
        commissionDistribution: 'patron',
        expenseDistribution: 'taxista'
      };
      
      // Calculate what the patron owes to the taxista
      // Start with gross earnings
      let amountToTaxista = grossEarnings;
      
      // Subtract patron's percentage
      const patronShare = grossEarnings * (settings.patronPercentage / 100);
      amountToTaxista -= patronShare;
      
      // Add/subtract tips based on distribution
      if (settings.tipDistribution === 'taxista') {
        amountToTaxista += tips;
      } else if (settings.tipDistribution === 'patron') {
        // Tips go to patron, don't add to taxista
      } else if (settings.tipDistribution === 'shared') {
        amountToTaxista += tips / 2;
      }
      
      // Add/subtract commissions based on distribution
      if (settings.commissionDistribution === 'taxista') {
        amountToTaxista -= commissions; // Taxista pays commissions
      } else if (settings.commissionDistribution === 'patron') {
        // Patron pays commissions, don't subtract from taxista
      } else if (settings.commissionDistribution === 'shared') {
        amountToTaxista -= commissions / 2;
      }
      
      // Add/subtract expenses based on distribution
      if (settings.expenseDistribution === 'taxista') {
        amountToTaxista -= totalExpenses; // Taxista pays expenses
      } else if (settings.expenseDistribution === 'patron') {
        // Patron pays expenses, don't subtract from taxista
      } else if (settings.expenseDistribution === 'shared') {
        amountToTaxista -= totalExpenses / 2;
      }
      
      const netEarnings = grossEarnings - commissions + tips;
      const averageService = totalServices > 0 ? grossEarnings / totalServices : 0;
      
      return {
        taxista,
        totalServices,
        grossEarnings,
        commissions,
        tips,
        netEarnings,
        averageService,
        totalExpenses,
        patronShare,
        amountToTaxista,
        settings
      };
    });
  }

  /**
   * Render advanced reports
   */
  renderAdvancedReports(stats, user, taxistas) {
    const container = document.getElementById('reports-content');
    if (!container) return;
    
    container.innerHTML = `
      <!-- Summary Cards -->
      <ion-grid>
        <ion-row>
          <ion-col size="6" size-md="3">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-primary);">${stats.totalServices}</div>
                <div style="font-size: 12px; color: var(--ion-text-color); margin-top: 4px; font-weight: 500;">Total Servicios</div>
                <div style="font-size: 10px; color: var(--ion-color-success); margin-top: 2px;">Datos actualizados</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-md="3">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-success);">€${stats.totalEarnings.toFixed(2)}</div>
                <div style="font-size: 12px; color: var(--ion-text-color); margin-top: 4px; font-weight: 500;">Ingresos Totales</div>
                <div style="font-size: 10px; color: var(--ion-color-success); margin-top: 2px;">Datos actualizados</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-md="3">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-tertiary);">€${stats.totalNeto.toFixed(2)}</div>
                <div style="font-size: 12px; color: var(--ion-text-color); margin-top: 4px; font-weight: 500;">Total Neto</div>
                <div style="font-size: 10px; color: var(--ion-color-success); margin-top: 2px;">Datos actualizados</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6" size-md="3">
            <ion-card style="margin: 0;">
              <ion-card-content style="text-align: center; padding: 16px;">
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-warning);">${stats.activeTaxistas}</div>
                <div style="font-size: 12px; color: var(--ion-text-color); margin-top: 4px; font-weight: 500;">Taxistas Activos</div>
                <div style="font-size: 10px; color: var(--ion-color-success); margin-top: 2px;">Datos actualizados</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      <!-- Charts Row -->
      <ion-grid>
        <ion-row>
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title style="font-size: 16px; color: var(--ion-text-color);">Evolución del Neto (Última Semana)</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <canvas id="servicesChart" style="max-height: 250px;"></canvas>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title style="font-size: 16px; color: var(--ion-text-color);">Ingresos por Taxista (Este Mes)</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <canvas id="earningsChart" style="max-height: 250px;"></canvas>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      <!-- Detailed Table -->
      <ion-card>
        <ion-card-header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <ion-card-title style="font-size: 16px; color: var(--ion-text-color);">Detalle por Taxista</ion-card-title>
            <ion-button size="small" color="primary" onclick="window.app.exportReports()">
              <ion-icon name="download" slot="start"></ion-icon>
              Exportar
            </ion-button>
          </div>
        </ion-card-header>
        <ion-card-content style="padding: 0;">
          ${this.renderTaxistaTable(stats.taxistaStats)}
        </ion-card-content>
      </ion-card>
    `;
  }
  
  /**
   * Render taxista table
   */
  renderTaxistaTable(taxistaStats) {
    if (taxistaStats.length === 0) {
      return `
        <div style="text-align: center; padding: 40px;">
          <ion-icon name="people" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
          <h3 style="color: var(--ion-color-medium);">No hay datos para mostrar</h3>
          <p style="color: var(--ion-color-medium); font-size: 14px;">Debes tener servicios registrados para ver los reportes</p>
        </div>
      `;
    }
    
    return `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead style="background: var(--ion-color-step-100);">
            <tr>
              <th style="padding: 14px 12px; text-align: left; font-size: 11px; font-weight: 700; color: var(--ion-color-medium); text-transform: uppercase; border-bottom: 2px solid var(--ion-color-step-150);">Taxista</th>
              <th style="padding: 14px 12px; text-align: center; font-size: 11px; font-weight: 700; color: var(--ion-color-medium); text-transform: uppercase; border-bottom: 2px solid var(--ion-color-step-150);">Servicios</th>
              <th style="padding: 14px 12px; text-align: right; font-size: 11px; font-weight: 700; color: var(--ion-color-medium); text-transform: uppercase; border-bottom: 2px solid var(--ion-color-step-150);">Ingresos</th>
              <th style="padding: 14px 12px; text-align: right; font-size: 11px; font-weight: 700; color: var(--ion-color-medium); text-transform: uppercase; border-bottom: 2px solid var(--ion-color-step-150);">Propinas</th>
              <th style="padding: 14px 12px; text-align: right; font-size: 11px; font-weight: 700; color: var(--ion-color-medium); text-transform: uppercase; border-bottom: 2px solid var(--ion-color-step-150);">Comisiones</th>
              <th style="padding: 14px 12px; text-align: right; font-size: 11px; font-weight: 700; color: var(--ion-color-medium); text-transform: uppercase; border-bottom: 2px solid var(--ion-color-step-150);">Gastos</th>
              <th style="padding: 14px 12px; text-align: right; font-size: 11px; font-weight: 700; color: var(--ion-color-success); text-transform: uppercase; border-bottom: 2px solid var(--ion-color-step-150);">A Pagar</th>
            </tr>
          </thead>
          <tbody>
            ${taxistaStats.map((stats, index) => `
              <tr style="border-bottom: 1px solid var(--ion-color-step-100); transition: background 0.2s;" onmouseover="this.style.background='var(--ion-color-step-50)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 16px 12px;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 36px; height: 36px; background: linear-gradient(135deg, var(--ion-color-success-tint), var(--ion-color-success)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <span style="font-weight: bold; font-size: 13px; color: white;">${stats.taxista.numeroTaxista?.slice(-2) || (index + 1).toString().padStart(2, '0')}</span>
                    </div>
                    <div>
                      <div style="font-weight: 600; font-size: 14px; color: var(--ion-text-color);">${stats.taxista.nombre}</div>
                      <div style="font-size: 11px; color: var(--ion-color-medium);">${stats.taxista.numeroTaxista || 'Sin número'}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 16px 12px; text-align: center;">
                  <span style="background: var(--ion-color-primary); color: white; padding: 6px 14px; border-radius: 16px; font-weight: 700; font-size: 14px; display: inline-block;">${stats.totalServices}</span>
                </td>
                <td style="padding: 16px 12px; text-align: right; font-weight: 600; color: var(--ion-color-success);">€${stats.grossEarnings.toFixed(2)}</td>
                <td style="padding: 16px 12px; text-align: right; color: var(--ion-color-tertiary);">€${stats.tips.toFixed(2)}</td>
                <td style="padding: 16px 12px; text-align: right; color: var(--ion-color-warning);">€${stats.commissions.toFixed(2)}</td>
                <td style="padding: 16px 12px; text-align: right; color: var(--ion-color-danger);">€${stats.totalExpenses.toFixed(2)}</td>
                <td style="padding: 16px 12px; text-align: right;">
                  <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <span style="font-weight: 700; font-size: 15px; color: var(--ion-color-success);">€${stats.amountToTaxista.toFixed(2)}</span>
                    <span style="font-size: 10px; color: var(--ion-color-medium); margin-top: 2px;">${stats.settings.patronPercentage}% patrón</span>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render charts using Chart.js
   */
  renderCharts(stats, taxistas) {
    // Destroy existing charts
    if (this.servicesChart) {
      this.servicesChart.destroy();
    }
    if (this.earningsChart) {
      this.earningsChart.destroy();
    }
    
    // Services chart - now showing Neto evolution
    const servicesCtx = document.getElementById('servicesChart');
    if (servicesCtx && typeof Chart !== 'undefined') {
      this.servicesChart = new Chart(servicesCtx, {
        type: 'line',
        data: {
          labels: Object.keys(stats.netoLast7Days),
          datasets: [{
            label: 'Neto (€)',
            data: Object.values(stats.netoLast7Days),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '€' + value.toFixed(2);
                }
              }
            }
          }
        }
      });
    }
    
    // Earnings chart
    const earningsCtx = document.getElementById('earningsChart');
    if (earningsCtx && typeof Chart !== 'undefined') {
      if (stats.earningsByTaxista.length === 0) {
        // Show empty state
        this.earningsChart = new Chart(earningsCtx, {
          type: 'doughnut',
          data: {
            labels: ['Sin datos'],
            datasets: [{
              data: [1],
              backgroundColor: ['#e5e7eb'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      } else {
        this.earningsChart = new Chart(earningsCtx, {
          type: 'doughnut',
          data: {
            labels: stats.earningsByTaxista.map(t => t.name),
            datasets: [{
              data: stats.earningsByTaxista.map(t => t.earnings),
              backgroundColor: [
                'rgb(34, 197, 94)',
                'rgb(59, 130, 246)',
                'rgb(168, 85, 247)',
                'rgb(245, 158, 11)',
                'rgb(239, 68, 68)',
                'rgb(20, 184, 166)',
                'rgb(251, 146, 60)'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 15,
                  usePointStyle: true,
                  font: {
                    size: 11
                  }
                }
              }
            }
          }
        });
      }
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ReportsView = ReportsView;
}

console.log('ReportsView component loaded');
