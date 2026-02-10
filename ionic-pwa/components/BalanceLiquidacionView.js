/**
 * BalanceLiquidacionView Component
 * Displays balance and settlement information with platform breakdown
 */

class BalanceLiquidacionView {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.currentPeriod = 'month';
    this.platformConfig = {
      emisora: { name: 'Emisora', icon: '📻', color: 'primary' },
      calle: { name: 'Calle', icon: '🚶', color: 'success' },
      uber: { name: 'Uber', icon: '🚗', color: 'medium' },
      freenow: { name: 'FreeNow', icon: '🚕', color: 'warning' },
      otro: { name: 'Otro', icon: '📋', color: 'tertiary' }
    };
  }

  /**
   * Show balance and settlement modal
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
   * Create modal element
   */
  async createModal(user) {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>💰 Balance y Liquidación</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-segment id="balance-period-segment" value="month">
            <ion-segment-button value="today">
              <ion-label>Hoy</ion-label>
            </ion-segment-button>
            <ion-segment-button value="week">
              <ion-label>Semana</ion-label>
            </ion-segment-button>
            <ion-segment-button value="month">
              <ion-label>Mes</ion-label>
            </ion-segment-button>
          </ion-segment>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div id="balance-content">
          <ion-spinner name="circles"></ion-spinner>
        </div>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();

    // Set up segment change handler
    const segment = modal.querySelector('#balance-period-segment');
    segment.addEventListener('ionChange', async (e) => {
      this.currentPeriod = e.detail.value;
      await this.loadBalance(user, e.detail.value);
    });

    // Load initial data
    await this.loadBalance(user, 'month');

    return modal;
  }

  /**
   * Load balance data
   */
  async loadBalance(user, period) {
    try {
      const services = await this.reconcileAdapter.getServices();
      
      // Filter by period
      const filteredServices = this.filterByPeriod(services, period);
      
      // Filter by role
      const userServices = this.filterByRole(filteredServices, user);
      
      // Calculate totals and platform breakdown
      const totals = this.calculateTotals(userServices);
      const platformStats = this.calculatePlatformStats(userServices);
      const distribution = this.calculateDistribution(totals, user);
      
      // Render balance
      this.renderBalance(totals, platformStats, distribution, user, period);
    } catch (error) {
      console.error('Error loading balance:', error);
      ToastManager.showError('Error al cargar balance');
    }
  }

  /**
   * Filter data by period
   */
  filterByPeriod(data, period) {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return data.filter(item => {
      const itemDate = new Date(item.date || item.createdAt);
      return itemDate >= startDate;
    });
  }

  /**
   * Filter data by user role
   */
  filterByRole(data, user) {
    if (!user || !data) return [];
    
    if (user.rol === 'TAXISTA') {
      return data.filter(item => item.userId === user.id);
    }
    
    if (user.rol === 'PATRON') {
      // For patrons, get services from associated taxistas
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const associatedTaxistas = users.filter(u => 
        u.rol === 'TAXISTA' && 
        u.estado === 'asociado' && 
        u.patronId === user.id
      );
      return data.filter(item => 
        associatedTaxistas.some(t => t.id === item.userId)
      );
    }
    
    return data;
  }

  /**
   * Calculate totals
   */
  calculateTotals(services) {
    return services.reduce((acc, service) => {
      acc.gross += parseFloat(service.amount || 0);
      acc.commissions += parseFloat(service.commission || 0);
      acc.tips += parseFloat(service.tip || 0);
      acc.net += parseFloat(service.netAmount || 0);
      return acc;
    }, { gross: 0, commissions: 0, tips: 0, net: 0, count: services.length });
  }

  /**
   * Calculate platform statistics
   */
  calculatePlatformStats(services) {
    const stats = {};
    
    // Initialize all platforms
    Object.keys(this.platformConfig).forEach(platform => {
      stats[platform] = {
        count: 0,
        gross: 0,
        commissions: 0,
        tips: 0,
        net: 0
      };
    });
    
    // Calculate stats
    services.forEach(service => {
      const platform = service.serviceSource || 'otro';
      if (stats[platform]) {
        stats[platform].count++;
        stats[platform].gross += parseFloat(service.amount || 0);
        stats[platform].commissions += parseFloat(service.commission || 0);
        stats[platform].tips += parseFloat(service.tip || 0);
        stats[platform].net += parseFloat(service.netAmount || 0);
      }
    });
    
    // Filter platforms with services
    const filteredStats = {};
    Object.entries(stats).forEach(([platform, data]) => {
      if (data.count > 0) {
        filteredStats[platform] = data;
      }
    });
    
    return filteredStats;
  }

  /**
   * Calculate distribution between patron and taxista
   */
  calculateDistribution(totals, user) {
    // Load balance settings
    const settings = JSON.parse(localStorage.getItem('taxi_balance_settings') || '{}');
    const defaultSettings = {
      patronPercentage: 30,
      tipDistribution: 'taxista',
      commissionDistribution: 'taxista',
      expenseDistribution: 'taxista'
    };
    const balanceSettings = { ...defaultSettings, ...settings };
    
    const patronPercent = balanceSettings.patronPercentage;
    const taxistaPercent = 100 - patronPercent;
    
    const patronGross = (totals.gross * patronPercent) / 100;
    const taxistaGross = (totals.gross * taxistaPercent) / 100;
    
    let patronTips = 0, taxistaTips = 0;
    if (balanceSettings.tipDistribution === 'patron') {
      patronTips = totals.tips;
    } else if (balanceSettings.tipDistribution === 'taxista') {
      taxistaTips = totals.tips;
    } else {
      patronTips = (totals.tips * patronPercent) / 100;
      taxistaTips = (totals.tips * taxistaPercent) / 100;
    }
    
    let patronCommissions = 0, taxistaCommissions = 0;
    if (balanceSettings.commissionDistribution === 'patron') {
      patronCommissions = totals.commissions;
    } else if (balanceSettings.commissionDistribution === 'taxista') {
      taxistaCommissions = totals.commissions;
    } else {
      patronCommissions = (totals.commissions * patronPercent) / 100;
      taxistaCommissions = (totals.commissions * taxistaPercent) / 100;
    }
    
    return {
      patron: {
        gross: patronGross,
        tips: patronTips,
        commissions: patronCommissions,
        net: patronGross + patronTips - patronCommissions
      },
      taxista: {
        gross: taxistaGross,
        tips: taxistaTips,
        commissions: taxistaCommissions,
        net: taxistaGross + taxistaTips - taxistaCommissions
      },
      settings: balanceSettings
    };
  }

  /**
   * Render balance
   */
  renderBalance(totals, platformStats, distribution, user, period) {
    const container = document.getElementById('balance-content');
    if (!container) return;
    
    const periodLabel = {
      today: 'Hoy',
      week: 'Esta Semana',
      month: 'Este Mes'
    }[period] || 'Este Mes';
    
    container.innerHTML = `
      <!-- Summary Cards -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>📈 Resumen General - ${periodLabel}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <div style="background: rgba(16, 185, 129, 0.15); padding: 12px; border-radius: 8px; text-align: center; border: 2px solid var(--ion-color-success);">
                  <p style="margin: 0; font-size: 11px; color: var(--ion-color-success); font-weight: 600;">Ingresos Brutos</p>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: var(--ion-color-success);">€${totals.gross.toFixed(2)}</h3>
                </div>
              </ion-col>
              <ion-col size="6">
                <div style="background: rgba(239, 68, 68, 0.15); padding: 12px; border-radius: 8px; text-align: center; border: 2px solid var(--ion-color-danger);">
                  <p style="margin: 0; font-size: 11px; color: var(--ion-color-danger); font-weight: 600;">Comisiones</p>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: var(--ion-color-danger);">€${totals.commissions.toFixed(2)}</h3>
                </div>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="6">
                <div style="background: rgba(59, 130, 246, 0.15); padding: 12px; border-radius: 8px; text-align: center; border: 2px solid var(--ion-color-tertiary);">
                  <p style="margin: 0; font-size: 11px; color: var(--ion-color-tertiary); font-weight: 600;">Propinas</p>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: var(--ion-color-tertiary);">€${totals.tips.toFixed(2)}</h3>
                </div>
              </ion-col>
              <ion-col size="6">
                <div style="background: rgba(5, 150, 105, 0.15); padding: 12px; border-radius: 8px; text-align: center; border: 2px solid var(--ion-color-primary);">
                  <p style="margin: 0; font-size: 11px; color: var(--ion-color-primary); font-weight: 600;">Neto Total</p>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: var(--ion-color-primary);">€${totals.net.toFixed(2)}</h3>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Distribution -->
      <ion-card>
        <ion-card-header>
          <div style="display: flex; justify-between; align-items: center;">
            <ion-card-title>⚖️ Distribución del Balance</ion-card-title>
            <ion-button size="small" fill="outline" onclick="window.app.showBalanceSettings()">
              <ion-icon name="settings" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <div style="background: rgba(5, 150, 105, 0.15); padding: 12px; border-radius: 8px; border: 2px solid var(--ion-color-primary);">
                  <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--ion-color-primary);">Patrón (${distribution.settings.patronPercentage}%)</h4>
                  <div style="font-size: 12px; color: var(--ion-text-color);">
                    <div style="display: flex; justify-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Bruto:</span>
                      <span style="font-weight: 600; color: var(--ion-color-success);">€${distribution.patron.gross.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Propinas:</span>
                      <span style="font-weight: 600; color: var(--ion-color-tertiary);">€${distribution.patron.tips.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Comisiones:</span>
                      <span style="font-weight: 600; color: var(--ion-color-danger);">-€${distribution.patron.commissions.toFixed(2)}</span>
                    </div>
                    <div style="border-top: 2px solid var(--ion-color-primary); padding-top: 6px; margin-top: 6px;">
                      <div style="display: flex; justify-between;">
                        <span style="font-weight: 700;">Neto:</span>
                        <span style="font-weight: 800; font-size: 14px; color: var(--ion-color-primary);">€${distribution.patron.net.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ion-col>
              <ion-col size="6">
                <div style="background: rgba(16, 185, 129, 0.15); padding: 12px; border-radius: 8px; border: 2px solid var(--ion-color-success);">
                  <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--ion-color-success);">Taxista (${100 - distribution.settings.patronPercentage}%)</h4>
                  <div style="font-size: 12px; color: var(--ion-text-color);">
                    <div style="display: flex; justify-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Bruto:</span>
                      <span style="font-weight: 600; color: var(--ion-color-success);">€${distribution.taxista.gross.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Propinas:</span>
                      <span style="font-weight: 600; color: var(--ion-color-tertiary);">€${distribution.taxista.tips.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Comisiones:</span>
                      <span style="font-weight: 600; color: var(--ion-color-danger);">-€${distribution.taxista.commissions.toFixed(2)}</span>
                    </div>
                    <div style="border-top: 2px solid var(--ion-color-success); padding-top: 6px; margin-top: 6px;">
                      <div style="display: flex; justify-between;">
                        <span style="font-weight: 700;">Neto:</span>
                        <span style="font-weight: 800; font-size: 14px; color: var(--ion-color-success);">€${distribution.taxista.net.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Platform Breakdown -->
      ${Object.keys(platformStats).length > 0 ? `
        <ion-card>
          <ion-card-header>
            <ion-card-title>🏢 Liquidación por Plataforma</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              ${Object.entries(platformStats).map(([platform, stats]) => {
                const config = this.platformConfig[platform];
                const commissionRate = stats.gross > 0 ? (stats.commissions / stats.gross * 100) : 0;
                return `
                  <ion-item>
                    <div slot="start" style="font-size: 24px;">${config.icon}</div>
                    <ion-label>
                      <h2>${config.name}</h2>
                      <p>${stats.count} servicio${stats.count !== 1 ? 's' : ''} • ${commissionRate.toFixed(1)}% comisión</p>
                      <p style="font-size: 11px;">
                        Bruto: €${stats.gross.toFixed(2)} | 
                        Comisión: €${stats.commissions.toFixed(2)} | 
                        Propinas: €${stats.tips.toFixed(2)}
                      </p>
                    </ion-label>
                    <ion-badge color="${config.color}" slot="end">€${stats.net.toFixed(2)}</ion-badge>
                  </ion-item>
                `;
              }).join('')}
            </ion-list>
          </ion-card-content>
        </ion-card>
      ` : ''}

      <!-- Export Button -->
      <ion-button expand="block" color="success" onclick="window.app.exportBalance()">
        <ion-icon name="download" slot="start"></ion-icon>
        Exportar Balance
      </ion-button>
    `;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.BalanceLiquidacionView = BalanceLiquidacionView;
}

console.log('BalanceLiquidacionView component loaded');
