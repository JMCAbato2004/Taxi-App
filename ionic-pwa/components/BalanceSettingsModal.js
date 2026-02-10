/**
 * BalanceSettingsModal Component
 * Modal for configuring balance distribution settings
 */

class BalanceSettingsModal {
  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    const defaultSettings = {
      patronPercentage: 30,
      tipDistribution: 'taxista',
      commissionDistribution: 'taxista',
      expenseDistribution: 'taxista'
    };

    const saved = localStorage.getItem('taxi_balance_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    localStorage.setItem('taxi_balance_settings', JSON.stringify(this.settings));
  }

  /**
   * Show the modal
   */
  async show() {
    const modal = await this.createModal();
    await modal.present();
  }

  /**
   * Create the modal
   */
  async createModal() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>⚙️ Ajustes de Balance</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <!-- Distribución de Ingresos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>📊 Distribución de Ingresos</ion-card-title>
            <ion-card-subtitle>Define qué porcentaje corresponde a cada parte</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Porcentaje del Patrón</ion-label>
              <ion-input 
                id="patron-percentage" 
                type="number" 
                min="0" 
                max="100" 
                value="${this.settings.patronPercentage}">
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Porcentaje del Taxista (automático)</ion-label>
              <ion-input 
                id="taxista-percentage" 
                type="number" 
                readonly 
                value="${100 - this.settings.patronPercentage}">
              </ion-input>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Gestión de Propinas -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>💰 Gestión de Propinas</ion-card-title>
            <ion-card-subtitle>Define cómo se distribuyen las propinas</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-radio-group id="tip-distribution" value="${this.settings.tipDistribution}">
              <ion-item>
                <ion-label>
                  <h2>Para el Patrón</h2>
                  <p>Todas las propinas van al patrón</p>
                </ion-label>
                <ion-radio slot="start" value="patron"></ion-radio>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h2>Para el Taxista</h2>
                  <p>Todas las propinas van al taxista</p>
                </ion-label>
                <ion-radio slot="start" value="taxista"></ion-radio>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h2>Compartidas</h2>
                  <p>Se distribuyen según el porcentaje de ingresos</p>
                </ion-label>
                <ion-radio slot="start" value="shared"></ion-radio>
              </ion-item>
            </ion-radio-group>
          </ion-card-content>
        </ion-card>

        <!-- Gestión de Comisiones -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>📱 Gestión de Comisiones</ion-card-title>
            <ion-card-subtitle>Define quién asume las comisiones de plataformas</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-radio-group id="commission-distribution" value="${this.settings.commissionDistribution}">
              <ion-item>
                <ion-label>
                  <h2>Asume el Patrón</h2>
                  <p>El patrón paga todas las comisiones</p>
                </ion-label>
                <ion-radio slot="start" value="patron"></ion-radio>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h2>Asume el Taxista</h2>
                  <p>El taxista paga todas las comisiones</p>
                </ion-label>
                <ion-radio slot="start" value="taxista"></ion-radio>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h2>Compartidas</h2>
                  <p>Se distribuyen según el porcentaje de ingresos</p>
                </ion-label>
                <ion-radio slot="start" value="shared"></ion-radio>
              </ion-item>
            </ion-radio-group>
          </ion-card-content>
        </ion-card>

        <!-- Gestión de Gastos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>⛽ Gestión de Gastos</ion-card-title>
            <ion-card-subtitle>Define cómo se distribuyen los gastos operativos</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-radio-group id="expense-distribution" value="${this.settings.expenseDistribution}">
              <ion-item>
                <ion-label>
                  <h2>Asume el Patrón</h2>
                  <p>El patrón paga todos los gastos</p>
                </ion-label>
                <ion-radio slot="start" value="patron"></ion-radio>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h2>Asume el Taxista</h2>
                  <p>El taxista paga todos los gastos</p>
                </ion-label>
                <ion-radio slot="start" value="taxista"></ion-radio>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h2>Compartidos</h2>
                  <p>Se distribuyen según el porcentaje de ingresos</p>
                </ion-label>
                <ion-radio slot="start" value="shared"></ion-radio>
              </ion-item>
            </ion-radio-group>
          </ion-card-content>
        </ion-card>

        <!-- Vista Previa -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>👁️ Vista Previa</ion-card-title>
            <ion-card-subtitle>Ejemplo: €100 ingresos, €5 propina, €10 comisión</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div id="preview-content">
              <!-- Preview will be rendered here -->
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Save Button -->
        <ion-button expand="block" color="success" onclick="window.balanceSettingsModal.handleSave()">
          <ion-icon slot="start" name="save"></ion-icon>
          Guardar Ajustes
        </ion-button>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();

    // Set up event listeners
    this.setupEventListeners(modal);
    
    // Initial preview update
    this.updatePreview(modal);

    // Store reference for save handler
    window.balanceSettingsModal = this;

    return modal;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners(modal) {
    const patronInput = modal.querySelector('#patron-percentage');
    const taxistaInput = modal.querySelector('#taxista-percentage');

    patronInput.addEventListener('ionChange', (e) => {
      const patronPercent = parseInt(e.detail.value) || 0;
      const taxistaPercent = Math.max(0, 100 - patronPercent);
      taxistaInput.value = taxistaPercent;
      this.updatePreview(modal);
    });

    modal.querySelectorAll('ion-radio-group').forEach(group => {
      group.addEventListener('ionChange', () => {
        this.updatePreview(modal);
      });
    });
  }

  /**
   * Update preview
   */
  updatePreview(modal) {
    const patronPercent = parseInt(modal.querySelector('#patron-percentage').value) || 30;
    const taxistaPercent = 100 - patronPercent;
    
    const tipDistribution = modal.querySelector('#tip-distribution').value;
    const commissionDistribution = modal.querySelector('#commission-distribution').value;
    const expenseDistribution = modal.querySelector('#expense-distribution').value;

    // Example values
    const grossAmount = 100;
    const tips = 5;
    const commissions = 10;
    const expenses = 0;

    // Calculate distribution
    const patronGross = (grossAmount * patronPercent) / 100;
    const taxistaGross = (grossAmount * taxistaPercent) / 100;

    let patronTips = 0, taxistaTips = 0;
    if (tipDistribution === 'patron') {
      patronTips = tips;
    } else if (tipDistribution === 'taxista') {
      taxistaTips = tips;
    } else {
      patronTips = (tips * patronPercent) / 100;
      taxistaTips = (tips * taxistaPercent) / 100;
    }

    let patronCommissions = 0, taxistaCommissions = 0;
    if (commissionDistribution === 'patron') {
      patronCommissions = commissions;
    } else if (commissionDistribution === 'taxista') {
      taxistaCommissions = commissions;
    } else {
      patronCommissions = (commissions * patronPercent) / 100;
      taxistaCommissions = (commissions * taxistaPercent) / 100;
    }

    let patronExpenses = 0, taxistaExpenses = 0;
    if (expenseDistribution === 'patron') {
      patronExpenses = expenses;
    } else if (expenseDistribution === 'taxista') {
      taxistaExpenses = expenses;
    } else {
      patronExpenses = (expenses * patronPercent) / 100;
      taxistaExpenses = (expenses * taxistaPercent) / 100;
    }

    const patronNet = patronGross + patronTips - patronCommissions - patronExpenses;
    const taxistaNet = taxistaGross + taxistaTips - taxistaCommissions - taxistaExpenses;

    const previewContent = modal.querySelector('#preview-content');
    previewContent.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="background: rgba(5, 150, 105, 0.15); padding: 12px; border-radius: 8px; border: 2px solid var(--ion-color-primary);">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: var(--ion-color-primary);">Patrón</h3>
          <div style="font-size: 13px; color: var(--ion-text-color);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">Ingresos:</span>
              <span style="font-weight: 600; color: var(--ion-color-success);">€${patronGross.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">Propinas:</span>
              <span style="font-weight: 600; color: var(--ion-color-tertiary);">€${patronTips.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">Comisiones:</span>
              <span style="font-weight: 600; color: var(--ion-color-danger);">-€${patronCommissions.toFixed(2)}</span>
            </div>
            <hr style="margin: 8px 0; border: none; border-top: 2px solid var(--ion-color-primary);">
            <div style="display: flex; justify-content: space-between; font-weight: 700;">
              <span>Neto:</span>
              <span style="font-size: 15px; color: var(--ion-color-primary);">€${patronNet.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div style="background: rgba(16, 185, 129, 0.15); padding: 12px; border-radius: 8px; border: 2px solid var(--ion-color-success);">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: var(--ion-color-success);">Taxista</h3>
          <div style="font-size: 13px; color: var(--ion-text-color);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">Ingresos:</span>
              <span style="font-weight: 600; color: var(--ion-color-success);">€${taxistaGross.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">Propinas:</span>
              <span style="font-weight: 600; color: var(--ion-color-tertiary);">€${taxistaTips.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">Comisiones:</span>
              <span style="font-weight: 600; color: var(--ion-color-danger);">-€${taxistaCommissions.toFixed(2)}</span>
            </div>
            <hr style="margin: 8px 0; border: none; border-top: 2px solid var(--ion-color-success);">
            <div style="display: flex; justify-content: space-between; font-weight: 700;">
              <span>Neto:</span>
              <span style="font-size: 15px; color: var(--ion-color-success);">€${taxistaNet.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Handle save button click
   */
  async handleSave() {
    try {
      const modal = document.querySelector('ion-modal');
      
      this.settings = {
        patronPercentage: parseInt(modal.querySelector('#patron-percentage').value) || 30,
        tipDistribution: modal.querySelector('#tip-distribution').value,
        commissionDistribution: modal.querySelector('#commission-distribution').value,
        expenseDistribution: modal.querySelector('#expense-distribution').value
      };

      this.saveSettings();
      
      ToastManager.showSuccess('Ajustes guardados correctamente');
      
      // Dispatch event to refresh balance views
      window.dispatchEvent(new CustomEvent('balance-settings-updated'));
      
      await modal.dismiss();
    } catch (error) {
      console.error('Error saving settings:', error);
      ToastManager.showError('Error al guardar ajustes');
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.BalanceSettingsModal = BalanceSettingsModal;
}

console.log('BalanceSettingsModal component loaded');
