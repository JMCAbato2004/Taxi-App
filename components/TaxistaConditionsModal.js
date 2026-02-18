/**
 * TaxistaConditionsModal - Modal para mostrar las condiciones de balance del taxista
 * Solo lectura - el taxista puede ver pero no modificar sus condiciones
 */

class TaxistaConditionsModal {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.modal = null;
  }

  /**
   * Show conditions modal
   */
  async show() {
    const user = this.authAdapter.getCurrentUser();
    if (!user || user.rol !== 'TAXISTA') {
      ToastManager.showError('Solo disponible para taxistas');
      return;
    }

    // Load taxista's conditions
    const conditions = this.loadTaxistaConditions(user.id);
    
    // Create and show modal
    await this.createModal(user, conditions);
    await this.modal.present();
  }

  /**
   * Load taxista's balance conditions
   */
  loadTaxistaConditions(taxistaId) {
    const allSettings = JSON.parse(localStorage.getItem('taxi_balance_settings_per_taxista') || '{}');
    const taxistaSettings = allSettings[taxistaId];
    
    // Default settings if none configured
    const defaultSettings = {
      patronPercentage: 30,
      taxistaPercentage: 70,
      expenseDistribution: 'taxista', // 'taxista', 'patron', 'shared'
      tipDistribution: 'taxista', // 'taxista', 'patron', 'shared'
      commissionDistribution: 'taxista' // 'taxista', 'patron', 'shared'
    };

    return taxistaSettings || defaultSettings;
  }

  /**
   * Get patron info
   */
  getPatronInfo(user) {
    const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
    
    if (user.estado === 'asociado' && user.patronId) {
      const patron = allUsers.find(u => u.id === user.patronId);
      return patron ? {
        nombre: patron.nombre,
        asociado: true
      } : {
        nombre: 'Patrón no encontrado',
        asociado: true
      };
    }
    
    return {
      nombre: 'Independiente',
      asociado: false
    };
  }

  /**
   * Create modal
   */
  async createModal(user, conditions) {
    const patronInfo = this.getPatronInfo(user);
    
    this.modal = document.createElement('ion-modal');
    this.modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="secondary">
          <ion-title>📋 Mis Condiciones de Trabajo</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        
        <!-- Status Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title style="display: flex; align-items: center; gap: 8px;">
              <ion-icon name="person-circle" color="primary"></ion-icon>
              Estado Actual
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-weight: 500;">Taxista:</span>
              <span style="color: var(--ion-color-primary); font-weight: bold;">${user.nombre}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-weight: 500;">Número:</span>
              <span style="color: var(--ion-color-primary); font-weight: bold;">${user.numeroTaxista || 'Sin asignar'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 500;">Estado:</span>
              <ion-badge color="${patronInfo.asociado ? 'success' : 'medium'}">
                ${patronInfo.asociado ? `Asociado a ${patronInfo.nombre}` : 'Independiente'}
              </ion-badge>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Distribution Percentages -->
        <ion-card>
          <ion-card-header>
            <ion-card-title style="display: flex; align-items: center; gap: 8px;">
              <ion-icon name="pie-chart" color="primary"></ion-icon>
              Distribución de Ingresos
            </ion-card-title>
            <ion-card-subtitle>Porcentajes aplicados a los servicios</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="text-align: center; padding: 16px; background: var(--ion-color-step-100); border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-success);">
                  ${conditions.taxistaPercentage}%
                </div>
                <div style="font-size: 14px; color: var(--ion-color-medium); margin-top: 4px;">
                  Para el Taxista
                </div>
              </div>
              <div style="text-align: center; padding: 16px; background: var(--ion-color-step-100); border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: var(--ion-color-warning);">
                  ${conditions.patronPercentage}%
                </div>
                <div style="font-size: 14px; color: var(--ion-color-medium); margin-top: 4px;">
                  ${patronInfo.asociado ? `Para ${patronInfo.nombre}` : 'Para el Patrón'}
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Distribution Details -->
        <ion-card>
          <ion-card-header>
            <ion-card-title style="display: flex; align-items: center; gap: 8px;">
              <ion-icon name="settings" color="primary"></ion-icon>
              Distribución Detallada
            </ion-card-title>
            <ion-card-subtitle>Quién asume cada concepto</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            
            <!-- Expenses -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--ion-color-step-200);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <ion-icon name="receipt" color="danger"></ion-icon>
                <span style="font-weight: 500;">Gastos</span>
              </div>
              <ion-badge color="${this.getDistributionColor(conditions.expenseDistribution)}">
                ${this.getDistributionLabel(conditions.expenseDistribution, patronInfo.nombre)}
              </ion-badge>
            </div>

            <!-- Tips -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--ion-color-step-200);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <ion-icon name="gift" color="tertiary"></ion-icon>
                <span style="font-weight: 500;">Propinas</span>
              </div>
              <ion-badge color="${this.getDistributionColor(conditions.tipDistribution)}">
                ${this.getDistributionLabel(conditions.tipDistribution, patronInfo.nombre)}
              </ion-badge>
            </div>

            <!-- Commissions -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <ion-icon name="card" color="warning"></ion-icon>
                <span style="font-weight: 500;">Comisiones</span>
              </div>
              <ion-badge color="${this.getDistributionColor(conditions.commissionDistribution)}">
                ${this.getDistributionLabel(conditions.commissionDistribution, patronInfo.nombre)}
              </ion-badge>
            </div>

          </ion-card-content>
        </ion-card>

        <!-- Calculation Example -->
        <ion-card>
          <ion-card-header>
            <ion-card-title style="display: flex; align-items: center; gap: 8px;">
              <ion-icon name="calculator" color="primary"></ion-icon>
              Ejemplo de Cálculo
            </ion-card-title>
            <ion-card-subtitle>Servicio de €20 con €2 de propina</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            ${this.renderCalculationExample(conditions, patronInfo.nombre)}
          </ion-card-content>
        </ion-card>

        <!-- Info Note -->
        <ion-card color="light">
          <ion-card-content>
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <ion-icon name="information-circle" color="primary" style="font-size: 24px; margin-top: 2px;"></ion-icon>
              <div>
                <p style="margin: 0; font-size: 14px; line-height: 1.4;">
                  <strong>Nota:</strong> Estas condiciones son establecidas por ${patronInfo.asociado ? patronInfo.nombre : 'el patrón'} 
                  y se aplican automáticamente a todos tus servicios y liquidaciones.
                </p>
                ${patronInfo.asociado ? `
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: var(--ion-color-medium);">
                    Para modificar estas condiciones, contacta con ${patronInfo.nombre}.
                  </p>
                ` : ''}
              </div>
            </div>
          </ion-card-content>
        </ion-card>

      </ion-content>
    `;

    document.body.appendChild(this.modal);
    await this.modal.componentOnReady();
  }

  /**
   * Get distribution color for badges
   */
  getDistributionColor(distribution) {
    switch (distribution) {
      case 'taxista': return 'success';
      case 'patron': return 'warning';
      case 'shared': return 'secondary';
      default: return 'medium';
    }
  }

  /**
   * Get distribution label
   */
  getDistributionLabel(distribution, patronName) {
    switch (distribution) {
      case 'taxista': return 'Asume el Taxista';
      case 'patron': return `Asume ${patronName || 'el Patrón'}`;
      case 'shared': return 'Compartido 50/50';
      default: return 'No definido';
    }
  }

  /**
   * Render calculation example
   */
  renderCalculationExample(conditions, patronName) {
    const serviceAmount = 20;
    const tip = 2;
    const commission = 1.5; // Example commission
    const expense = 3; // Example expense
    
    const taxistaFromService = serviceAmount * (conditions.taxistaPercentage / 100);
    const patronFromService = serviceAmount * (conditions.patronPercentage / 100);
    
    let taxistaTotal = taxistaFromService;
    let patronTotal = patronFromService;
    
    // Apply tip distribution
    if (conditions.tipDistribution === 'taxista') {
      taxistaTotal += tip;
    } else if (conditions.tipDistribution === 'patron') {
      patronTotal += tip;
    } else { // shared
      taxistaTotal += tip / 2;
      patronTotal += tip / 2;
    }
    
    // Apply commission distribution
    if (conditions.commissionDistribution === 'taxista') {
      taxistaTotal -= commission;
    } else if (conditions.commissionDistribution === 'patron') {
      patronTotal -= commission;
    } else { // shared
      taxistaTotal -= commission / 2;
      patronTotal -= commission / 2;
    }
    
    // Apply expense distribution
    if (conditions.expenseDistribution === 'taxista') {
      taxistaTotal -= expense;
    } else if (conditions.expenseDistribution === 'patron') {
      patronTotal -= expense;
    } else { // shared
      taxistaTotal -= expense / 2;
      patronTotal -= expense / 2;
    }
    
    return `
      <div style="background: var(--ion-color-step-100); padding: 16px; border-radius: 8px;">
        <div style="margin-bottom: 12px;">
          <strong>Servicio:</strong> €${serviceAmount} + €${tip} propina = €${serviceAmount + tip}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
          <div>
            <div style="font-weight: bold; color: var(--ion-color-success); margin-bottom: 4px;">Para el Taxista:</div>
            <div style="font-size: 13px;">Servicio: €${taxistaFromService.toFixed(2)} (${conditions.taxistaPercentage}%)</div>
            <div style="font-size: 13px;">Propina: €${conditions.tipDistribution === 'taxista' ? tip.toFixed(2) : conditions.tipDistribution === 'shared' ? (tip/2).toFixed(2) : '0.00'}</div>
            <div style="font-size: 13px; color: var(--ion-color-danger);">Comisión: -€${conditions.commissionDistribution === 'taxista' ? commission.toFixed(2) : conditions.commissionDistribution === 'shared' ? (commission/2).toFixed(2) : '0.00'}</div>
            <div style="font-size: 13px; color: var(--ion-color-danger);">Gastos: -€${conditions.expenseDistribution === 'taxista' ? expense.toFixed(2) : conditions.expenseDistribution === 'shared' ? (expense/2).toFixed(2) : '0.00'}</div>
          </div>
          
          <div>
            <div style="font-weight: bold; color: var(--ion-color-warning); margin-bottom: 4px;">Para ${patronName || 'el Patrón'}:</div>
            <div style="font-size: 13px;">Servicio: €${patronFromService.toFixed(2)} (${conditions.patronPercentage}%)</div>
            <div style="font-size: 13px;">Propina: €${conditions.tipDistribution === 'patron' ? tip.toFixed(2) : conditions.tipDistribution === 'shared' ? (tip/2).toFixed(2) : '0.00'}</div>
            <div style="font-size: 13px; color: var(--ion-color-danger);">Comisión: -€${conditions.commissionDistribution === 'patron' ? commission.toFixed(2) : conditions.commissionDistribution === 'shared' ? (commission/2).toFixed(2) : '0.00'}</div>
            <div style="font-size: 13px; color: var(--ion-color-danger);">Gastos: -€${conditions.expenseDistribution === 'patron' ? expense.toFixed(2) : conditions.expenseDistribution === 'shared' ? (expense/2).toFixed(2) : '0.00'}</div>
          </div>
        </div>
        
        <div style="border-top: 2px solid var(--ion-color-step-250); padding-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: var(--ion-color-success);">
              €${taxistaTotal.toFixed(2)}
            </div>
            <div style="font-size: 12px; color: var(--ion-color-medium);">Total Taxista</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: var(--ion-color-warning);">
              €${patronTotal.toFixed(2)}
            </div>
            <div style="font-size: 12px; color: var(--ion-color-medium);">Total ${patronName || 'Patrón'}</div>
          </div>
        </div>
      </div>
    `;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.TaxistaConditionsModal = TaxistaConditionsModal;
}

console.log('TaxistaConditionsModal component loaded');