/**
 * ReconciliationView Component
 * Handles reconciliation configuration, generation, and display
 */

class ReconciliationView {
  constructor(reconcileAdapter) {
    this.reconcileAdapter = reconcileAdapter;
    this.currentReconciliation = null;
    this.showingResults = false;
  }

  /**
   * Render the reconciliation view
   */
  async render() {
    const container = document.getElementById('reconciliation-content');
    if (!container) return;

    if (this.showingResults && this.currentReconciliation) {
      this.renderResults();
    } else {
      this.renderConfiguration();
    }
  }

  /**
   * Render configuration view
   */
  renderConfiguration() {
    const container = document.getElementById('reconciliation-content');
    if (!container) return;

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Nueva Conciliación</ion-card-title>
          <ion-card-subtitle>Configura los parámetros de liquidación</ion-card-subtitle>
        </ion-card-header>
        
        <ion-card-content>
          <form id="reconciliation-form">
            <!-- Client Name -->
            <ion-item>
              <ion-label position="stacked">Nombre del Cliente *</ion-label>
              <ion-input 
                type="text" 
                id="client-name" 
                placeholder="Ej: Juan Pérez"
                required>
              </ion-input>
            </ion-item>
            <div class="error-message" id="client-error"></div>

            <!-- Settlement Type -->
            <ion-item>
              <ion-label position="stacked">Tipo de Liquidación *</ion-label>
              <ion-select id="settlement-type" value="percentage" interface="action-sheet">
                <ion-select-option value="percentage">Porcentaje</ion-select-option>
                <ion-select-option value="fixed">Cantidad Fija</ion-select-option>
              </ion-select>
            </ion-item>

            <!-- Percentage Input (shown when type is percentage) -->
            <div id="percentage-container">
              <ion-item>
                <ion-label position="stacked">Porcentaje del Conductor (%) *</ion-label>
                <ion-input 
                  type="number" 
                  id="driver-percentage" 
                  placeholder="60"
                  min="0"
                  max="100"
                  step="1"
                  value="60">
                </ion-input>
              </ion-item>
              <div class="error-message" id="percentage-error"></div>
              <p style="font-size: 12px; color: var(--ion-color-medium); padding: 0 16px;">
                El propietario recibirá el porcentaje restante
              </p>
            </div>

            <!-- Fixed Amount Input (shown when type is fixed) -->
            <div id="fixed-container" style="display: none;">
              <ion-item>
                <ion-label position="stacked">Cantidad Fija Diaria (€) *</ion-label>
                <ion-input 
                  type="number" 
                  id="fixed-amount" 
                  placeholder="50.00"
                  min="0"
                  step="0.01">
                </ion-input>
              </ion-item>
              <div class="error-message" id="fixed-error"></div>
              <p style="font-size: 12px; color: var(--ion-color-medium); padding: 0 16px;">
                El conductor pagará esta cantidad fija al propietario cada día
              </p>
            </div>

            <!-- Date Range -->
            <ion-list-header>
              <ion-label>Período de Liquidación</ion-label>
            </ion-list-header>

            <ion-item>
              <ion-label position="stacked">Fecha Inicio *</ion-label>
              <ion-input 
                type="date" 
                id="start-date" 
                required>
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Fecha Fin *</ion-label>
              <ion-input 
                type="date" 
                id="end-date" 
                required>
              </ion-input>
            </ion-item>
            <div class="error-message" id="date-error"></div>

            <!-- Generate Button -->
            <ion-button 
              expand="block" 
              type="submit" 
              id="generate-reconciliation-btn"
              style="margin-top: 20px;">
              <ion-icon name="calculator" slot="start"></ion-icon>
              Generar Conciliación
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    `;

    this.attachConfigurationListeners();
  }

  /**
   * Attach configuration event listeners
   */
  attachConfigurationListeners() {
    // Settlement type change
    const settlementType = document.getElementById('settlement-type');
    if (settlementType) {
      settlementType.addEventListener('ionChange', (e) => {
        this.handleSettlementTypeChange(e.detail.value);
      });
    }

    // Form submission
    const form = document.getElementById('reconciliation-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleGenerate();
      });
    }

    // Real-time validation
    document.getElementById('client-name')?.addEventListener('ionInput', () => {
      this.clearError('client-error');
    });

    document.getElementById('driver-percentage')?.addEventListener('ionInput', () => {
      this.clearError('percentage-error');
    });

    document.getElementById('fixed-amount')?.addEventListener('ionInput', () => {
      this.clearError('fixed-error');
    });

    document.getElementById('start-date')?.addEventListener('ionChange', () => {
      this.clearError('date-error');
    });

    document.getElementById('end-date')?.addEventListener('ionChange', () => {
      this.clearError('date-error');
    });
  }

  /**
   * Handle settlement type change
   */
  handleSettlementTypeChange(type) {
    const percentageContainer = document.getElementById('percentage-container');
    const fixedContainer = document.getElementById('fixed-container');

    if (type === 'percentage') {
      if (percentageContainer) percentageContainer.style.display = 'block';
      if (fixedContainer) fixedContainer.style.display = 'none';
    } else {
      if (percentageContainer) percentageContainer.style.display = 'none';
      if (fixedContainer) fixedContainer.style.display = 'block';
    }
  }

  /**
   * Validate configuration form
   */
  validateConfiguration() {
    let isValid = true;

    // Validate client name
    const clientName = document.getElementById('client-name').value.trim();
    if (!clientName || clientName.length < 3) {
      this.showError('client-error', 'El nombre debe tener al menos 3 caracteres');
      isValid = false;
    }

    // Validate settlement type specific fields
    const settlementType = document.getElementById('settlement-type').value;
    
    if (settlementType === 'percentage') {
      const percentage = parseFloat(document.getElementById('driver-percentage').value);
      if (!percentage || percentage < 0 || percentage > 100) {
        this.showError('percentage-error', 'El porcentaje debe estar entre 0 y 100');
        isValid = false;
      }
    } else {
      const fixedAmount = parseFloat(document.getElementById('fixed-amount').value);
      if (!fixedAmount || fixedAmount < 0) {
        this.showError('fixed-error', 'La cantidad debe ser mayor que 0');
        isValid = false;
      }
    }

    // Validate dates
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
      this.showError('date-error', 'Ambas fechas son obligatorias');
      isValid = false;
    } else if (new Date(startDate) > new Date(endDate)) {
      this.showError('date-error', 'La fecha de inicio debe ser anterior a la fecha de fin');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Handle generate reconciliation
   */
  async handleGenerate() {
    if (!this.validateConfiguration()) {
      ToastManager.showError('Por favor, corrige los errores del formulario');
      return;
    }

    try {
      await LoadingManager.show('Generando conciliación...');

      // Collect configuration
      const config = {
        clientName: document.getElementById('client-name').value.trim(),
        settlementType: document.getElementById('settlement-type').value,
        driverPercentage: parseFloat(document.getElementById('driver-percentage').value) || 0,
        fixedAmount: parseFloat(document.getElementById('fixed-amount').value) || 0,
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value
      };

      // Get services and expenses for the period
      const services = await this.reconcileAdapter.getServices();
      const expenses = await this.reconcileAdapter.getExpenses();

      // Filter by date range
      const filteredServices = services.filter(s => 
        s.date >= config.startDate && s.date <= config.endDate
      );
      const filteredExpenses = expenses.filter(e => 
        e.date >= config.startDate && e.date <= config.endDate
      );

      // Calculate reconciliation
      this.currentReconciliation = this.calculateReconciliation(
        config,
        filteredServices,
        filteredExpenses
      );

      await LoadingManager.hide();

      // Show results
      this.showingResults = true;
      this.renderResults();

    } catch (error) {
      await LoadingManager.hide();
      console.error('Error generating reconciliation:', error);
      ToastManager.showError('Error al generar la conciliación');
    }
  }

  /**
   * Calculate reconciliation
   */
  calculateReconciliation(config, services, expenses) {
    // Calculate totals
    const totalIncome = services.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netIncome = totalIncome - totalExpenses;

    // Calculate distribution
    let driverAmount = 0;
    let ownerAmount = 0;

    if (config.settlementType === 'percentage') {
      driverAmount = netIncome * (config.driverPercentage / 100);
      ownerAmount = netIncome - driverAmount;
    } else {
      // Fixed amount per day
      const startDate = new Date(config.startDate);
      const endDate = new Date(config.endDate);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      ownerAmount = config.fixedAmount * days;
      driverAmount = netIncome - ownerAmount;
    }

    // Calculate deductions breakdown
    const deductions = {
      sharedExpenses: expenses.filter(e => e.paidBy === 'shared').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
      driverExpenses: expenses.filter(e => e.paidBy === 'driver').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
      ownerExpenses: expenses.filter(e => e.paidBy === 'owner').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
    };

    return {
      config,
      summary: {
        totalServices: services.length,
        totalIncome,
        totalExpenses,
        netIncome
      },
      distribution: {
        driverAmount,
        ownerAmount
      },
      deductions,
      services,
      expenses,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Render results view
   */
  renderResults() {
    const container = document.getElementById('reconciliation-content');
    if (!container || !this.currentReconciliation) return;

    const { config, summary, distribution, deductions } = this.currentReconciliation;

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Conciliación Generada</ion-card-title>
          <ion-card-subtitle>${config.clientName} • ${config.startDate} - ${config.endDate}</ion-card-subtitle>
        </ion-card-header>
        
        <ion-card-content>
          <!-- Summary Statistics -->
          <div class="reconciliation-summary">
            <ion-grid>
              <ion-row>
                <ion-col size="6">
                  <div class="summary-item">
                    <div class="summary-label">Servicios</div>
                    <div class="summary-value">${summary.totalServices}</div>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div class="summary-item">
                    <div class="summary-label">Ingresos</div>
                    <div class="summary-value">€${summary.totalIncome.toFixed(2)}</div>
                  </div>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="6">
                  <div class="summary-item">
                    <div class="summary-label">Gastos</div>
                    <div class="summary-value">€${summary.totalExpenses.toFixed(2)}</div>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div class="summary-item">
                    <div class="summary-label">Neto</div>
                    <div class="summary-value" style="color: var(--ion-color-success);">€${summary.netIncome.toFixed(2)}</div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </div>

          <!-- Distribution -->
          <ion-list-header>
            <ion-label>Distribución Final</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-icon name="person" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>Conductor</h2>
              <p>${config.settlementType === 'percentage' ? config.driverPercentage + '%' : 'Después de pago fijo'}</p>
            </ion-label>
            <ion-note slot="end" style="font-size: 18px; font-weight: bold; color: var(--ion-color-success);">
              €${distribution.driverAmount.toFixed(2)}
            </ion-note>
          </ion-item>

          <ion-item>
            <ion-icon name="business" slot="start" color="secondary"></ion-icon>
            <ion-label>
              <h2>Propietario</h2>
              <p>${config.settlementType === 'percentage' ? (100 - config.driverPercentage) + '%' : '€' + config.fixedAmount + '/día'}</p>
            </ion-label>
            <ion-note slot="end" style="font-size: 18px; font-weight: bold; color: var(--ion-color-primary);">
              €${distribution.ownerAmount.toFixed(2)}
            </ion-note>
          </ion-item>

          <!-- Deductions Breakdown -->
          <ion-list-header>
            <ion-label>Desglose de Gastos</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-label>
              <h3>Gastos Compartidos</h3>
            </ion-label>
            <ion-note slot="end">€${deductions.sharedExpenses.toFixed(2)}</ion-note>
          </ion-item>

          <ion-item>
            <ion-label>
              <h3>Gastos del Conductor</h3>
            </ion-label>
            <ion-note slot="end">€${deductions.driverExpenses.toFixed(2)}</ion-note>
          </ion-item>

          <ion-item>
            <ion-label>
              <h3>Gastos del Propietario</h3>
            </ion-label>
            <ion-note slot="end">€${deductions.ownerExpenses.toFixed(2)}</ion-note>
          </ion-item>

          <!-- Action Buttons -->
          <div style="margin-top: 20px;">
            <ion-button expand="block" id="save-reconciliation-btn">
              <ion-icon name="save" slot="start"></ion-icon>
              Guardar Conciliación
            </ion-button>
            
            <ion-button expand="block" fill="outline" id="new-reconciliation-btn">
              <ion-icon name="add" slot="start"></ion-icon>
              Nueva Conciliación
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    `;

    this.attachResultsListeners();
  }

  /**
   * Attach results event listeners
   */
  attachResultsListeners() {
    document.getElementById('save-reconciliation-btn')?.addEventListener('click', () => {
      this.handleSave();
    });

    document.getElementById('new-reconciliation-btn')?.addEventListener('click', () => {
      this.showingResults = false;
      this.currentReconciliation = null;
      this.renderConfiguration();
    });
  }

  /**
   * Handle save reconciliation
   */
  async handleSave() {
    if (!this.currentReconciliation) return;

    try {
      await LoadingManager.show('Guardando...');
      await this.reconcileAdapter.saveReconciliation(this.currentReconciliation);
      await LoadingManager.hide();

      ToastManager.showSuccess('Conciliación guardada');

      // Dispatch event
      window.dispatchEvent(new CustomEvent('reconciliation-saved'));

      // Reset view
      this.showingResults = false;
      this.currentReconciliation = null;
      this.renderConfiguration();

    } catch (error) {
      await LoadingManager.hide();
      console.error('Error saving reconciliation:', error);
      ToastManager.showError('Error al guardar la conciliación');
    }
  }

  /**
   * Show error message
   */
  showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Clear error message
   */
  clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }
}

// Export for use in other modules
window.ReconciliationView = ReconciliationView;

console.log('ReconciliationView component loaded');
