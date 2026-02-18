/**
 * ReportsView Component
 * Displays advanced reports and statistics with Chart.js
 * Based on main branch reports.html functionality
 */

class ReportsView {
  constructor(authAdapter, reconcileAdapter) {
      this.authAdapter = authAdapter;
      this.reconcileAdapter = reconcileAdapter;
      this.servicesChart = null;
      this.earningsChart = null;

      // Date range for TAXISTA view
      this.selectedStartDate = null;
      this.selectedEndDate = null;
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
    this.currentUser = user;
    
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    this.selectedStartDate = firstDay.toISOString().split('T')[0];
    this.selectedEndDate = lastDay.toISOString().split('T')[0];
    
    const modal = document.createElement('ion-modal');
    
    // Different header for TAXISTA vs PATRON
    const dateRangeSelector = user.rol === 'TAXISTA' ? `
      <ion-toolbar>
        <div style="display: flex; gap: 8px; padding: 8px; align-items: center; flex-wrap: wrap;">
          <ion-label style="font-size: 14px; font-weight: 500;">Período:</ion-label>
          <input 
            type="date" 
            id="startDate" 
            value="${this.selectedStartDate}"
            style="padding: 8px; border: 1px solid var(--ion-color-medium); border-radius: 4px; font-size: 14px;"
          />
          <ion-label style="font-size: 14px;">-</ion-label>
          <input 
            type="date" 
            id="endDate" 
            value="${this.selectedEndDate}"
            style="padding: 8px; border: 1px solid var(--ion-color-medium); border-radius: 4px; font-size: 14px;"
          />
          <ion-button size="small" id="applyDateRange">
            <ion-icon name="checkmark" slot="start"></ion-icon>
            Aplicar
          </ion-button>
        </div>
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
        ${dateRangeSelector}
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
    
    // Add event listener for date range filter (TAXISTA only)
    if (user.rol === 'TAXISTA') {
      const applyButton = modal.querySelector('#applyDateRange');
      if (applyButton) {
        applyButton.addEventListener('click', () => {
          const startDateInput = modal.querySelector('#startDate');
          const endDateInput = modal.querySelector('#endDate');
          
          if (startDateInput && endDateInput) {
            this.selectedStartDate = startDateInput.value;
            this.selectedEndDate = endDateInput.value;
            this.loadReports(user);
          }
        });
      }
    }

    return modal;
  }

  /**
   * Load reports data
   */
  async loadReports(user) {
    try {
      // Get all services and users
      const allServices = JSON.parse(localStorage.getItem('taxi_services') || '[]');
      const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      
      // Filter services by role
      let relevantServices = [];
      let relevantTaxistas = [];
      
      if (user.rol === 'PATRON') {
        // Get associated taxistas
        relevantTaxistas = allUsers.filter(u => 
          u.rol === 'TAXISTA' && 
          u.estado === 'asociado' && 
          u.patronId === user.id
        );
        
        // Get services from associated taxistas
        const taxistaIds = relevantTaxistas.map(t => t.id);
        relevantServices = allServices.filter(s => taxistaIds.includes(s.userId));
      } else if (user.rol === 'TAXISTA') {
        // Only own services
        relevantServices = allServices.filter(s => s.userId === user.id);
        
        // Filter by date range for TAXISTA
        if (this.selectedStartDate && this.selectedEndDate) {
          const startDate = new Date(this.selectedStartDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(this.selectedEndDate);
          endDate.setHours(23, 59, 59, 999);
          
          relevantServices = relevantServices.filter(s => {
            const serviceDate = new Date(s.datetime || s.date);
            return serviceDate >= startDate && serviceDate <= endDate;
          });
        }
        
        relevantTaxistas = [user];
      }
      
      // Calculate statistics
      const stats = this.calculateAdvancedStats(relevantServices, relevantTaxistas, allUsers, user);
      
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
  calculateAdvancedStats(services, taxistas, allUsers, user) {
    const totalServices = services.length;
    const totalEarnings = services.reduce((sum, s) => sum + (s.amount || 0), 0);
    const averageService = totalServices > 0 ? totalEarnings / totalServices : 0;
    const activeTaxistas = taxistas.length;
    
    // Services by day (last 7 days)
    const last7Days = this.getServicesLast7Days(services);
    
    // Earnings by taxista
    const earningsByTaxista = this.getEarningsByTaxista(services, taxistas);
    
    // Detailed taxista stats (with date filtering for expenses if TAXISTA)
    const taxistaStats = this.getTaxistaDetailedStats(services, taxistas, user);
    
    return {
      totalServices,
      totalEarnings,
      averageService,
      activeTaxistas,
      last7Days,
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
    
    services.forEach(service => {
      const serviceDate = new Date(service.datetime || service.date);
      if (serviceDate >= weekAgo) {
        const dayName = days[serviceDate.getDay()];
        if (dailyServices.hasOwnProperty(dayName)) {
          dailyServices[dayName]++;
        }
      }
    });
    
    return dailyServices;
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
  getTaxistaDetailedStats(services, taxistas, user) {
    return taxistas.map(taxista => {
      const taxistaServices = services.filter(s => s.userId === taxista.id);
      const totalServices = taxistaServices.length;
      const grossEarnings = taxistaServices.reduce((sum, s) => sum + (s.amount || 0), 0);
      const commissions = taxistaServices.reduce((sum, s) => sum + (s.commission || 0), 0);
      const tips = taxistaServices.reduce((sum, s) => sum + (s.tip || 0), 0);
      const netEarnings = grossEarnings - commissions + tips;
      const averageService = totalServices > 0 ? grossEarnings / totalServices : 0;
      
      // Get expenses (if available)
      const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
      let taxistaExpenses = expenses.filter(e => e.userId === taxista.id);
      
      // Filter expenses by date range if TAXISTA
      if (user && user.rol === 'TAXISTA' && this.selectedStartDate && this.selectedEndDate) {
        const startDate = new Date(this.selectedStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(this.selectedEndDate);
        endDate.setHours(23, 59, 59, 999);
        
        taxistaExpenses = taxistaExpenses.filter(e => {
          const expenseDate = new Date(e.date || e.createdAt);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      }
      
      const totalExpenses = taxistaExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      return {
        taxista,
        totalServices,
        grossEarnings,
        commissions,
        tips,
        netEarnings,
        averageService,
        totalExpenses
      };
    });
  }

  /**
   * Render advanced reports
   */
  renderAdvancedReports(stats, user, taxistas) {
    const container = document.getElementById('reports-content');
    if (!container) return;
    
    // Different view for TAXISTA vs PATRON
    if (user.rol === 'TAXISTA') {
      // Calculate additional stats for TAXISTA
      const taxistaStats = stats.taxistaStats[0] || {
        totalServices: 0,
        grossEarnings: 0,
        commissions: 0,
        tips: 0,
        totalExpenses: 0,
        netEarnings: 0
      };
      
      // Calculate total income (earnings + tips)
      const totalIncome = taxistaStats.grossEarnings + taxistaStats.tips;
      
      // View for TAXISTA - 6 cards
      container.innerHTML = `
        <!-- Summary Cards for TAXISTA -->
        <div style="margin-bottom: 12px; text-align: center; color: var(--ion-color-medium); font-size: 14px;">
          ${this.selectedStartDate && this.selectedEndDate ? 
            `Del ${new Date(this.selectedStartDate).toLocaleDateString('es-ES')} al ${new Date(this.selectedEndDate).toLocaleDateString('es-ES')}` : 
            'Período actual'}
        </div>
        
        <ion-grid>
          <ion-row>
            <ion-col size="6" size-md="4">
              <ion-card style="margin: 0;">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-primary);">${taxistaStats.totalServices}</div>
                  <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Total Servicios</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            
            <ion-col size="6" size-md="4">
              <ion-card style="margin: 0;">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-success);">€${totalIncome.toFixed(2)}</div>
                  <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Ingresos Totales</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            
            <ion-col size="6" size-md="4">
              <ion-card style="margin: 0;">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-tertiary);">€${taxistaStats.tips.toFixed(2)}</div>
                  <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Propinas</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            
            <ion-col size="6" size-md="4">
              <ion-card style="margin: 0;">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-danger);">€${taxistaStats.totalExpenses.toFixed(2)}</div>
                  <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Gastos</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            
            <ion-col size="6" size-md="4">
              <ion-card style="margin: 0;">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-warning);">€${taxistaStats.commissions.toFixed(2)}</div>
                  <div style="font-size: 13px; color: var(--ion-color-medium); margin-top: 4px; font-weight: 500;">Comisiones</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            
            <ion-col size="6" size-md="4">
              <ion-card style="margin: 0; background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 32px; font-weight: bold; color: white;">€${taxistaStats.netEarnings.toFixed(2)}</div>
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
      `;
    } else {
      // Full view for PATRON (unchanged)
      container.innerHTML = `
        <!-- Summary Cards -->
        <ion-grid>
          <ion-row>
            <ion-col size="6" size-md="3">
              <ion-card style="margin: 0;">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-primary);">${stats.totalServices}</div>
                  <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Total Servicios</div>
                  <div style="font-size: 10px; color: var(--ion-color-success); margin-top: 2px;">Datos actualizados</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-md="3">
              <ion-card style="margin: 0;">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-success);">€${stats.totalEarnings.toFixed(2)}</div>
                  <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Ingresos Totales</div>
                  <div style="font-size: 10px; color: var(--ion-color-success); margin-top: 2px;">Datos actualizados</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-md="3">
              <ion-card style="margin: 0;">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-tertiary);">€${stats.averageService.toFixed(2)}</div>
                  <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Promedio/Servicio</div>
                  <div style="font-size: 10px; color: var(--ion-color-success); margin-top: 2px;">Datos actualizados</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6" size-md="3">
              <ion-card style="margin: 0;">
                <ion-card-content style="text-align: center; padding: 16px;">
                  <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-warning);">${stats.activeTaxistas}</div>
                  <div style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px;">Taxistas Activos</div>
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
                  <ion-card-title style="font-size: 16px;">Servicios por Día (Última Semana)</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <canvas id="servicesChart" style="max-height: 250px;"></canvas>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="12" size-md="6">
              <ion-card>
                <ion-card-header>
                  <ion-card-title style="font-size: 16px;">Ingresos por Taxista (Este Mes)</ion-card-title>
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
              <ion-card-title style="font-size: 16px;">Detalle por Taxista</ion-card-title>
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
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background: var(--ion-color-light);">
            <tr>
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: var(--ion-color-medium);">TAXISTA</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: var(--ion-color-medium);">SERVICIOS</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: var(--ion-color-medium);">INGRESOS</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: var(--ion-color-medium);">PROMEDIO</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: var(--ion-color-medium);">GASTOS</th>
              <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: var(--ion-color-medium);">NETO</th>
            </tr>
          </thead>
          <tbody>
            ${taxistaStats.map((stats, index) => `
              <tr style="border-bottom: 1px solid var(--ion-color-light);">
                <td style="padding: 12px;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 32px; height: 32px; background: var(--ion-color-success-tint); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                      <span style="font-weight: bold; font-size: 12px; color: var(--ion-color-success);">${stats.taxista.numeroTaxista?.slice(-2) || (index + 1).toString().padStart(2, '0')}</span>
                    </div>
                    <div>
                      <div style="font-weight: 500; font-size: 14px;">${stats.taxista.nombre}</div>
                      <div style="font-size: 12px; color: var(--ion-color-medium);">${stats.taxista.numeroTaxista || 'Sin número'}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 12px; font-size: 14px;">${stats.totalServices}</td>
                <td style="padding: 12px; font-size: 14px; font-weight: 600; color: var(--ion-color-success);">€${stats.grossEarnings.toFixed(2)}</td>
                <td style="padding: 12px; font-size: 14px;">€${stats.averageService.toFixed(2)}</td>
                <td style="padding: 12px; font-size: 14px; color: var(--ion-color-danger);">€${stats.totalExpenses.toFixed(2)}</td>
                <td style="padding: 12px; font-size: 14px; font-weight: 600; color: var(--ion-color-primary);">€${stats.netEarnings.toFixed(2)}</td>
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
    
    // Services chart
    const servicesCtx = document.getElementById('servicesChart');
    if (servicesCtx && typeof Chart !== 'undefined') {
      this.servicesChart = new Chart(servicesCtx, {
        type: 'line',
        data: {
          labels: Object.keys(stats.last7Days),
          datasets: [{
            label: 'Servicios',
            data: Object.values(stats.last7Days),
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
                precision: 0
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
