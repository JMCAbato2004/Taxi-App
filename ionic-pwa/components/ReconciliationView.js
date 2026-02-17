/**
 * ReconciliationView Component
 * Handles reconciliation configuration, generation, and display
 */

class ReconciliationView {
  constructor(reconcileAdapter, authAdapter) {
    this.reconcileAdapter = reconcileAdapter;
    this.authAdapter = authAdapter;
    this.currentReconciliation = null;
    this.showingResults = false;
  }

  /**
   * Render the reconciliation view
   */
  async render() {
    const container = document.getElementById('reconciliation-content');
    if (!container) return;

    // Clear any loading spinners
    container.innerHTML = '';

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

    // Get current user
    const user = this.authAdapter ? this.authAdapter.getCurrentUser() : null;
    
    // Build client name field based on user role
    let clientNameField = '';
    if (user && user.rol === 'PATRON') {
      // Get associated taxistas
      const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const associatedTaxistas = allUsers.filter(u => 
        u.rol === 'TAXISTA' && 
        u.estado === 'asociado' && 
        u.patronId === user.id
      );
      
      if (associatedTaxistas.length > 0) {
        clientNameField = `
          <ion-item>
            <ion-label position="stacked">Seleccionar Taxista *</ion-label>
            <ion-select id="client-name" interface="popover" placeholder="Selecciona un taxista">
              ${associatedTaxistas.map(t => `
                <ion-select-option value="${t.nombre}">
                  ${t.nombre} ${t.numeroTaxista ? `(${t.numeroTaxista})` : ''}
                </ion-select-option>
              `).join('')}
            </ion-select>
          </ion-item>
        `;
      } else {
        clientNameField = `
          <ion-item>
            <ion-label position="stacked">Nombre del Cliente *</ion-label>
            <ion-input 
              type="text" 
              id="client-name" 
              placeholder="No tienes taxistas asociados"
              disabled>
            </ion-input>
          </ion-item>
        `;
      }
    } else if (user && user.rol === 'TAXISTA') {
      // For TAXISTA: show their own name (read-only)
      clientNameField = `
        <ion-item>
          <ion-label position="stacked">Taxista</ion-label>
          <ion-input 
            type="text" 
            id="client-name" 
            value="${user.nombre}"
            readonly>
          </ion-input>
        </ion-item>
      `;
    } else {
      // For no user, show text input
      clientNameField = `
        <ion-item>
          <ion-label position="stacked">Nombre del Cliente *</ion-label>
          <ion-input 
            type="text" 
            id="client-name" 
            placeholder="Ej: Juan Pérez"
            required>
          </ion-input>
        </ion-item>
      `;
    }

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Nueva Conciliación</ion-card-title>
          <ion-card-subtitle>Configura los parámetros de liquidación</ion-card-subtitle>
        </ion-card-header>
        
        <ion-card-content>
          <form id="reconciliation-form">
            <!-- Client Name / Taxista Selector -->
            ${clientNameField}
            <div class="error-message" id="client-error"></div>

            <!-- Date Range -->
            <ion-list-header style="margin-top: 16px;">
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

            <p style="font-size: 12px; color: var(--ion-color-medium); padding: 0 16px; margin-top: 12px;">
              ℹ️ Los porcentajes y distribuciones se tomarán de los ajustes configurados para el taxista seleccionado
            </p>

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

    document.getElementById('start-date')?.addEventListener('ionChange', () => {
      this.clearError('date-error');
    });

    document.getElementById('end-date')?.addEventListener('ionChange', () => {
      this.clearError('date-error');
    });
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

      // Get current user
      const user = this.authAdapter ? this.authAdapter.getCurrentUser() : null;
      
      // Collect configuration
      const clientNameElement = document.getElementById('client-name');
      const clientName = clientNameElement.value.trim();
      
      const config = {
        clientName: clientName,
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value
      };

      // Get services and expenses for the period
      let services = await this.reconcileAdapter.getServices();
      let expenses = await this.reconcileAdapter.getExpenses();

      // For PATRON: filter by selected taxista and load their settings
      if (user && user.rol === 'PATRON') {
        // Find the selected taxista by name
        const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
        const selectedTaxista = allUsers.find(u => 
          u.rol === 'TAXISTA' && 
          u.estado === 'asociado' && 
          u.patronId === user.id &&
          (u.nombre === clientName || `${u.nombre} (${u.numeroTaxista})` === clientName)
        );
        
        if (selectedTaxista) {
          // Filter services and expenses by this taxista
          services = services.filter(s => s.userId === selectedTaxista.id);
          expenses = expenses.filter(e => e.userId === selectedTaxista.id);
          
          // Load taxista's individual balance settings
          const allSettings = JSON.parse(localStorage.getItem('taxi_balance_settings_per_taxista') || '{}');
          const taxistaSettings = allSettings[selectedTaxista.id];
          
          if (taxistaSettings) {
            // Use taxista's settings
            config.taxistaSettings = taxistaSettings;
          } else {
            // Use default settings
            config.taxistaSettings = {
              patronPercentage: 30,
              tipDistribution: 'taxista',
              commissionDistribution: 'taxista',
              expenseDistribution: 'taxista'
            };
          }
        } else {
          await LoadingManager.hide();
          ToastManager.showError('No se encontró el taxista seleccionado');
          return;
        }
      } else if (user && user.rol === 'TAXISTA') {
        // For TAXISTA: filter by their own userId and load their settings
        services = services.filter(s => s.userId === user.id);
        expenses = expenses.filter(e => e.userId === user.id);
        
        // Load taxista's individual balance settings
        const allSettings = JSON.parse(localStorage.getItem('taxi_balance_settings_per_taxista') || '{}');
        const taxistaSettings = allSettings[user.id];
        
        if (taxistaSettings) {
          // Use taxista's settings
          config.taxistaSettings = taxistaSettings;
        } else {
          // Use default settings
          config.taxistaSettings = {
            patronPercentage: 30,
            tipDistribution: 'taxista',
            commissionDistribution: 'taxista',
            expenseDistribution: 'taxista'
          };
        }
      } else {
        // For no user: use default settings
        config.taxistaSettings = {
          patronPercentage: 30,
          tipDistribution: 'taxista',
          commissionDistribution: 'taxista',
          expenseDistribution: 'taxista'
        };
      }

      // Filter by date range
      console.log('ReconciliationView: Services before date filter:', services.length);
      console.log('ReconciliationView: Date range:', config.startDate, 'to', config.endDate);
      
      const filteredServices = services.filter(s => {
        const serviceDate = s.date || (s.datetime ? new Date(s.datetime).toISOString().split('T')[0] : null);
        if (!serviceDate) {
          console.log('ReconciliationView: Service without date:', s);
          return false;
        }
        const inRange = serviceDate >= config.startDate && serviceDate <= config.endDate;
        if (!inRange) {
          console.log('ReconciliationView: Service out of range:', serviceDate, s);
        }
        return inRange;
      });
      
      const filteredExpenses = expenses.filter(e => {
        const expenseDate = e.date || (e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : null);
        if (!expenseDate) return false;
        return expenseDate >= config.startDate && expenseDate <= config.endDate;
      });
      
      console.log('ReconciliationView: Filtered services:', filteredServices.length);
      console.log('ReconciliationView: Filtered expenses:', filteredExpenses.length);

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
    const totalIncome = services.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    
    // If taxista has individual settings, use them for calculation
    let driverAmount = 0;
    let ownerAmount = 0;
    
    if (config.taxistaSettings) {
      // Use individual taxista settings
      const settings = config.taxistaSettings;
      const patronPercentage = settings.patronPercentage || 30;
      const taxistaPercentage = 100 - patronPercentage;
      
      // Calculate base amounts
      const patronGross = (totalIncome * patronPercentage) / 100;
      const taxistaGross = (totalIncome * taxistaPercentage) / 100;
      
      // Calculate tips, commissions, and expenses based on distribution settings
      const tips = services.reduce((sum, s) => sum + parseFloat(s.tip || 0), 0);
      const commissions = services.reduce((sum, s) => sum + parseFloat(s.commission || 0), 0);
      
      let patronTips = 0, taxistaTips = 0;
      if (settings.tipDistribution === 'patron') {
        patronTips = tips;
      } else if (settings.tipDistribution === 'taxista') {
        taxistaTips = tips;
      } else {
        patronTips = (tips * patronPercentage) / 100;
        taxistaTips = (tips * taxistaPercentage) / 100;
      }
      
      let patronCommissions = 0, taxistaCommissions = 0;
      if (settings.commissionDistribution === 'patron') {
        patronCommissions = commissions;
      } else if (settings.commissionDistribution === 'taxista') {
        taxistaCommissions = commissions;
      } else {
        patronCommissions = (commissions * patronPercentage) / 100;
        taxistaCommissions = (commissions * taxistaPercentage) / 100;
      }
      
      let patronExpenses = 0, taxistaExpenses = 0;
      if (settings.expenseDistribution === 'patron') {
        patronExpenses = totalExpenses;
      } else if (settings.expenseDistribution === 'taxista') {
        taxistaExpenses = totalExpenses;
      } else {
        patronExpenses = (totalExpenses * patronPercentage) / 100;
        taxistaExpenses = (totalExpenses * taxistaPercentage) / 100;
      }
      
      driverAmount = taxistaGross + taxistaTips - taxistaCommissions - taxistaExpenses;
      ownerAmount = patronGross + patronTips - patronCommissions - patronExpenses;
    } else {
      // Use standard calculation
      const netIncome = totalIncome - totalExpenses;
      
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
        netIncome: totalIncome - totalExpenses
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
            <ion-label>⚖️ Distribución Final Detallada</ion-label>
          </ion-list-header>

          <ion-grid style="margin-top: 16px;">
            <ion-row>
              <ion-col size="6">
                <div style="background: rgba(5, 150, 105, 0.15); padding: 12px; border-radius: 8px; border: 2px solid var(--ion-color-primary);">
                  <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--ion-color-primary);">💼 Propietario</h4>
                  <div style="font-size: 12px; color: var(--ion-text-color);">
                    ${config.taxistaSettings ? `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Ingresos Totales (100%):</span>
                        <span style="font-weight: 600; color: var(--ion-color-success);">€${summary.totalIncome.toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Porcentaje (${config.taxistaSettings.patronPercentage}%):</span>
                        <span style="font-weight: 600; color: var(--ion-color-primary);">€${((summary.totalIncome * config.taxistaSettings.patronPercentage) / 100).toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Propinas (${config.taxistaSettings.tipDistribution === 'patron' ? 'Asume Patrón' : config.taxistaSettings.tipDistribution === 'taxista' ? 'Asume Taxista' : 'Compartidas'}):</span>
                        <span style="font-weight: 600; color: ${config.taxistaSettings.tipDistribution === 'patron' ? 'var(--ion-color-success)' : 'var(--ion-color-danger)'};">${config.taxistaSettings.tipDistribution === 'patron' ? '+' : config.taxistaSettings.tipDistribution === 'taxista' ? '' : '+'}€${(config.taxistaSettings.tipDistribution === 'patron' ? this.currentReconciliation.services.reduce((sum, s) => sum + parseFloat(s.tip || 0), 0) : config.taxistaSettings.tipDistribution === 'shared' ? (this.currentReconciliation.services.reduce((sum, s) => sum + parseFloat(s.tip || 0), 0) * config.taxistaSettings.patronPercentage / 100) : 0).toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Comisiones (${config.taxistaSettings.commissionDistribution === 'patron' ? 'Asume Patrón' : config.taxistaSettings.commissionDistribution === 'taxista' ? 'Asume Taxista' : 'Compartidas'}):</span>
                        <span style="font-weight: 600; color: var(--ion-color-danger);">-€${(config.taxistaSettings.commissionDistribution === 'patron' ? this.currentReconciliation.services.reduce((sum, s) => sum + parseFloat(s.commission || 0), 0) : config.taxistaSettings.commissionDistribution === 'shared' ? (this.currentReconciliation.services.reduce((sum, s) => sum + parseFloat(s.commission || 0), 0) * config.taxistaSettings.patronPercentage / 100) : 0).toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Gastos (${config.taxistaSettings.expenseDistribution === 'patron' ? 'Asume Patrón' : config.taxistaSettings.expenseDistribution === 'taxista' ? 'Asume Taxista' : 'Compartidos'}):</span>
                        <span style="font-weight: 600; color: var(--ion-color-warning);">-€${(config.taxistaSettings.expenseDistribution === 'patron' ? summary.totalExpenses : config.taxistaSettings.expenseDistribution === 'shared' ? (summary.totalExpenses * config.taxistaSettings.patronPercentage / 100) : 0).toFixed(2)}</span>
                      </div>
                    ` : `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Ingresos Totales (100%):</span>
                        <span style="font-weight: 600; color: var(--ion-color-success);">€${summary.totalIncome.toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Gastos:</span>
                        <span style="font-weight: 600; color: var(--ion-color-warning);">-€${summary.totalExpenses.toFixed(2)}</span>
                      </div>
                    `}
                    <div style="border-top: 2px solid var(--ion-color-primary); padding-top: 6px; margin-top: 6px;">
                      <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 700;">Total Propietario:</span>
                        <span style="font-weight: 800; font-size: 16px; color: var(--ion-color-primary);">€${distribution.ownerAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ion-col>
              <ion-col size="6">
                <div style="background: rgba(16, 185, 129, 0.15); padding: 12px; border-radius: 8px; border: 2px solid var(--ion-color-success);">
                  <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--ion-color-success);">🚕 Conductor</h4>
                  <div style="font-size: 12px; color: var(--ion-text-color);">
                    ${config.taxistaSettings ? `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Ingresos Totales (100%):</span>
                        <span style="font-weight: 600; color: var(--ion-color-success);">€${summary.totalIncome.toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Porcentaje (${100 - config.taxistaSettings.patronPercentage}%):</span>
                        <span style="font-weight: 600; color: var(--ion-color-success);">€${((summary.totalIncome * (100 - config.taxistaSettings.patronPercentage)) / 100).toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Propinas (${config.taxistaSettings.tipDistribution === 'patron' ? 'Asume Patrón' : config.taxistaSettings.tipDistribution === 'taxista' ? 'Asume Taxista' : 'Compartidas'}):</span>
                        <span style="font-weight: 600; color: ${config.taxistaSettings.tipDistribution === 'taxista' ? 'var(--ion-color-success)' : 'var(--ion-color-danger)'};">${config.taxistaSettings.tipDistribution === 'taxista' ? '+' : config.taxistaSettings.tipDistribution === 'patron' ? '' : '+'}€${(config.taxistaSettings.tipDistribution === 'taxista' ? this.currentReconciliation.services.reduce((sum, s) => sum + parseFloat(s.tip || 0), 0) : config.taxistaSettings.tipDistribution === 'shared' ? (this.currentReconciliation.services.reduce((sum, s) => sum + parseFloat(s.tip || 0), 0) * (100 - config.taxistaSettings.patronPercentage) / 100) : 0).toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Comisiones (${config.taxistaSettings.commissionDistribution === 'patron' ? 'Asume Patrón' : config.taxistaSettings.commissionDistribution === 'taxista' ? 'Asume Taxista' : 'Compartidas'}):</span>
                        <span style="font-weight: 600; color: var(--ion-color-danger);">-€${(config.taxistaSettings.commissionDistribution === 'taxista' ? this.currentReconciliation.services.reduce((sum, s) => sum + parseFloat(s.commission || 0), 0) : config.taxistaSettings.commissionDistribution === 'shared' ? (this.currentReconciliation.services.reduce((sum, s) => sum + parseFloat(s.commission || 0), 0) * (100 - config.taxistaSettings.patronPercentage) / 100) : 0).toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Gastos (${config.taxistaSettings.expenseDistribution === 'patron' ? 'Asume Patrón' : config.taxistaSettings.expenseDistribution === 'taxista' ? 'Asume Taxista' : 'Compartidos'}):</span>
                        <span style="font-weight: 600; color: var(--ion-color-warning);">-€${(config.taxistaSettings.expenseDistribution === 'taxista' ? summary.totalExpenses : config.taxistaSettings.expenseDistribution === 'shared' ? (summary.totalExpenses * (100 - config.taxistaSettings.patronPercentage) / 100) : 0).toFixed(2)}</span>
                      </div>
                    ` : `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Ingresos Totales (100%):</span>
                        <span style="font-weight: 600; color: var(--ion-color-success);">€${summary.totalIncome.toFixed(2)}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 500;">Porcentaje:</span>
                        <span style="font-weight: 600;">${config.settlementType === 'percentage' ? config.driverPercentage + '%' : 'Variable'}</span>
                      </div>
                    `}
                    <div style="border-top: 2px solid var(--ion-color-success); padding-top: 6px; margin-top: 6px;">
                      <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 700;">Total Conductor:</span>
                        <span style="font-weight: 800; font-size: 16px; color: var(--ion-color-success);">€${distribution.driverAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>

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
    console.log('handleSave called');
    console.log('currentReconciliation:', this.currentReconciliation);
    
    if (!this.currentReconciliation) {
      console.error('No reconciliation data to save');
      ToastManager.showError('No hay datos de conciliación para guardar');
      return;
    }

    try {
      await LoadingManager.show('Guardando...');
      console.log('Calling reconcileAdapter.saveReconciliation...');
      await this.reconcileAdapter.saveReconciliation(this.currentReconciliation);
      console.log('Reconciliation saved successfully');
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
      ToastManager.showError('Error al guardar la conciliación: ' + error.message);
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
