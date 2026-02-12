}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.BalanceLiquidacionView = BalanceLiquidacionView;
}

console.log('BalanceLiquidacionView component loaded');

  /**
   * Render balance for PATRON (with per-taxista breakdown)
   */
  renderPatronBalance(container, totals, platformStats, distributionData, periodLabel) {
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
                  <p style="margin: 0; font-size: 11px; color: var(--ion-color-primary); font-weight: 600;">Tu Neto Total</p>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: var(--ion-color-primary);">€${distributionData.totalPatronNet.toFixed(2)}</h3>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Per-Taxista Distribution -->
      <ion-card>
        <ion-card-header>
          <div style="display: flex; justify-between; align-items: center;">
            <ion-card-title>⚖️ Distribución por Taxista</ion-card-title>
            <ion-button size="small" fill="outline" onclick="window.app.showBalanceSettings()">
              <ion-icon name="settings" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
          <ion-card-subtitle>Ajustes individuales por cada taxista</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          ${distributionData.taxistaDistributions.map(item => `
            <ion-card style="margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <ion-card-header style="padding-bottom: 8px;">
                <ion-card-title style="font-size: 16px;">
                  ${item.taxista.nombre} ${item.taxista.numeroTaxista ? `(${item.taxista.numeroTaxista})` : ''}
                </ion-card-title>
                <ion-card-subtitle style="font-size: 12px;">
                  ${item.totals.count} servicio${item.totals.count !== 1 ? 's' : ''} • 
                  Patrón ${item.distribution.settings.patronPercentage}% / Taxista ${100 - item.distribution.settings.patronPercentage}%
                </ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <ion-grid>
                  <ion-row>
                    <ion-col size="6">
                      <div style="background: rgba(5, 150, 105, 0.15); padding: 10px; border-radius: 8px; border: 2px solid var(--ion-color-primary);">
                        <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: var(--ion-color-primary);">Tu Parte</h4>
                        <div style="font-size: 11px; color: var(--ion-text-color);">
                          <div style="display: flex; justify-between; margin-bottom: 3px;">
                            <span>Bruto:</span>
                            <span style="font-weight: 600; color: var(--ion-color-success);">€${item.distribution.patron.gross.toFixed(2)}</span>
                          </div>
                          <div style="display: flex; justify-between; margin-bottom: 3px;">
                            <span>Propinas:</span>
                            <span style="font-weight: 600; color: var(--ion-color-tertiary);">€${item.distribution.patron.tips.toFixed(2)}</span>
                          </div>
                          <div style="display: flex; justify-between; margin-bottom: 3px;">
                            <span>Comisiones:</span>
                            <span style="font-weight: 600; color: var(--ion-color-danger);">-€${item.distribution.patron.commissions.toFixed(2)}</span>
                          </div>
                          <div style="border-top: 2px solid var(--ion-color-primary); padding-top: 4px; margin-top: 4px;">
                            <div style="display: flex; justify-between; font-weight: 700;">
                              <span>Neto:</span>
                              <span style="font-size: 13px; color: var(--ion-color-primary);">€${item.distribution.patron.net.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ion-col>
                    <ion-col size="6">
                      <div style="background: rgba(16, 185, 129, 0.15); padding: 10px; border-radius: 8px; border: 2px solid var(--ion-color-success);">
                        <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: var(--ion-color-success);">Parte Taxista</h4>
                        <div style="font-size: 11px; color: var(--ion-text-color);">
                          <div style="display: flex; justify-between; margin-bottom: 3px;">
                            <span>Bruto:</span>
                            <span style="font-weight: 600; color: var(--ion-color-success);">€${item.distribution.taxista.gross.toFixed(2)}</span>
                          </div>
                          <div style="display: flex; justify-between; margin-bottom: 3px;">
                            <span>Propinas:</span>
                            <span style="font-weight: 600; color: var(--ion-color-tertiary);">€${item.distribution.taxista.tips.toFixed(2)}</span>
                          </div>
                          <div style="display: flex; justify-between; margin-bottom: 3px;">
                            <span>Comisiones:</span>
                            <span style="font-weight: 600; color: var(--ion-color-danger);">-€${item.distribution.taxista.commissions.toFixed(2)}</span>
                          </div>
                          <div style="border-top: 2px solid var(--ion-color-success); padding-top: 4px; margin-top: 4px;">
                            <div style="display: flex; justify-between; font-weight: 700;">
                              <span>Neto:</span>
                              <span style="font-size: 13px; color: var(--ion-color-success);">€${item.distribution.taxista.net.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </ion-card-content>
            </ion-card>
          `).join('')}
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

  /**
   * Render balance for TAXISTA (single distribution)
   */
  renderTaxistaBalance(container, totals, platformStats, distribution, periodLabel) {
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
                  <p style="margin: 0; font-size: 11px; color: var(--ion-color-primary); font-weight: 600;">Tu Neto</p>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: var(--ion-color-primary);">€${distribution.taxista.net.toFixed(2)}</h3>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Distribution -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>⚖️ Distribución del Balance</ion-card-title>
          <ion-card-subtitle>Configurado por tu patrón</ion-card-subtitle>
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
                  <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--ion-color-success);">Tu Parte (${100 - distribution.settings.patronPercentage}%)</h4>
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
