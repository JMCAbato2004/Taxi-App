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
    this.reconcileMode = 'dates'; // 'dates' | 'shifts'
    this.selectedShiftIds = new Set();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Load completed shifts for the current user (or a specific taxista)
   */
  async _loadShifts(taxistaId = null) {
    if (!window.workShiftAdapter) return [];
    try {
      const uid = taxistaId || this.authAdapter?.getCurrentUser()?.id;
      const all = JSON.parse(localStorage.getItem('taxi_work_shifts') || '[]');
      return all
        .filter(s => s.status === 'completed' && String(s.userId) === String(uid))
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    } catch { return []; }
  }

  /** Format ISO date to readable string */
  _fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  /** Format milliseconds to "Xh Ym" */
  _fmtDuration(ms) {
    if (!ms || ms < 0) return '0h 0m';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  /** Calculate effective work time for a shift */
  _effectiveMs(shift) {
    if (!shift.endTime) return 0;
    const total = new Date(shift.endTime) - new Date(shift.startTime);
    const paused = (shift.pauses || []).reduce((acc, p) => {
      if (p.startTime && p.endTime) acc += new Date(p.endTime) - new Date(p.startTime);
      return acc;
    }, 0);
    return total - paused;
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

    const user = this.authAdapter ? this.authAdapter.getCurrentUser() : null;

    // ── Taxista selector (PATRON only) ──────────────────────────────────────
    let clientNameField = '';
    if (user && user.rol === 'PATRON') {
      const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const associatedTaxistas = allUsers.filter(u =>
        u.rol === 'TAXISTA' && u.estado === 'asociado' && u.patronId === user.id
      );
      const patronAsTaxista = { id: user.id, nombre: user.nombre + ' (Patrón)', numeroTaxista: 'PATRON' };
      const allTaxistas = [patronAsTaxista, ...associatedTaxistas];

      clientNameField = allTaxistas.length > 0 ? `
        <ion-item>
          <ion-label position="stacked">Nombre del Taxista *</ion-label>
          <ion-select id="client-name" interface="action-sheet" placeholder="Selecciona un taxista">
            ${allTaxistas.map(t => `
              <ion-select-option value="${t.nombre}">
                ${t.nombre} ${t.numeroTaxista ? `(${t.numeroTaxista})` : ''}
              </ion-select-option>`).join('')}
          </ion-select>
        </ion-item>
        <p style="font-size:12px;color:var(--ion-color-medium);padding:0 16px;margin-top:-8px;">
          💡 Selecciona el taxista para generar su liquidación
        </p>` : `
        <ion-item>
          <ion-label position="stacked">Nombre del Taxista *</ion-label>
          <ion-input type="text" id="client-name" placeholder="No tienes taxistas asociados" disabled></ion-input>
        </ion-item>`;
    } else if (user && user.rol === 'TAXISTA') {
      clientNameField = `
        <ion-item>
          <ion-label position="stacked">Taxista</ion-label>
          <ion-input type="text" id="client-name" value="${user.nombre}" readonly></ion-input>
        </ion-item>`;
    } else {
      clientNameField = `
        <ion-item>
          <ion-label position="stacked">Nombre del Cliente *</ion-label>
          <ion-input type="text" id="client-name" placeholder="Ej: Juan Pérez" required></ion-input>
        </ion-item>`;
    }

    container.innerHTML = `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Nueva Conciliación</ion-card-title>
          <ion-card-subtitle>Configura los parámetros de liquidación</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <form id="reconciliation-form">
            ${clientNameField}
            <div class="error-message" id="client-error"></div>

            <!-- ── Modo de conciliación ── -->
            <ion-list-header style="margin-top:16px;">
              <ion-label>Modo de Conciliación</ion-label>
            </ion-list-header>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0 16px;">
              <button type="button" id="mode-btn-dates"
                style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                       gap:8px;padding:16px 8px;border-radius:12px;border:none;cursor:pointer;
                       background:${this.reconcileMode==='dates'?'#1e3a6e':'var(--ion-color-light)'};
                       color:${this.reconcileMode==='dates'?'#fff':'var(--ion-color-dark)'};
                       font-weight:700;font-size:12px;text-transform:uppercase;
                       box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                <ion-icon name="calendar-outline" style="font-size:28px;"></ion-icon>
                Por Fechas
              </button>
              <button type="button" id="mode-btn-shifts"
                style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                       gap:8px;padding:16px 8px;border-radius:12px;border:none;cursor:pointer;
                       background:${this.reconcileMode==='shifts'?'#1e3a6e':'var(--ion-color-light)'};
                       color:${this.reconcileMode==='shifts'?'#fff':'var(--ion-color-dark)'};
                       font-weight:700;font-size:12px;text-transform:uppercase;
                       box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                <ion-icon name="time-outline" style="font-size:28px;"></ion-icon>
                Por Jornadas
              </button>
            </div>

            <!-- ── Panel: Por Fechas ── -->
            <div id="panel-dates" style="display:${this.reconcileMode==='dates'?'block':'none'};">
              <ion-list-header>
                <ion-label>Período de Liquidación</ion-label>
              </ion-list-header>
              <ion-item>
                <ion-label position="stacked">Fecha y Hora Inicio *</ion-label>
                <ion-input type="datetime-local" id="start-date"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Fecha y Hora Fin *</ion-label>
                <ion-input type="datetime-local" id="end-date"></ion-input>
              </ion-item>
              <div class="error-message" id="date-error"></div>
            </div>

            <!-- ── Panel: Por Jornadas ── -->
            <div id="panel-shifts" style="display:${this.reconcileMode==='shifts'?'block':'none'};">
              <ion-list-header>
                <ion-label>Selecciona las Jornadas</ion-label>
              </ion-list-header>
              <div id="shifts-list-container">
                <div style="text-align:center;padding:20px;">
                  <ion-spinner name="circles"></ion-spinner>
                  <p style="color:var(--ion-color-medium);margin-top:8px;font-size:13px;">Cargando jornadas...</p>
                </div>
              </div>
              <div class="error-message" id="shifts-error"></div>
            </div>

            <p style="font-size:12px;color:var(--ion-color-medium);padding:0 16px;margin-top:12px;">
              ℹ️ Los porcentajes y distribuciones se tomarán de los ajustes configurados para el taxista seleccionado
            </p>

            <ion-button expand="block" type="submit" id="generate-reconciliation-btn" style="margin-top:20px;">
              <ion-icon name="calculator" slot="start"></ion-icon>
              Generar Conciliación
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    `;

    this.attachConfigurationListeners();

    // Load shifts if mode is shifts
    if (this.reconcileMode === 'shifts') {
      this._renderShiftsList();
    }
  }

  /**
   * Render the shifts checklist inside the shifts panel
   */
  async _renderShiftsList(taxistaId = null) {
    const container = document.getElementById('shifts-list-container');
    if (!container) return;

    const uid = taxistaId || this.authAdapter?.getCurrentUser()?.id;
    const shifts = await this._loadShifts(uid);

    // ── Collect already-reconciled shift IDs ──────────────────────────────
    const savedReconciliations = JSON.parse(localStorage.getItem('taxi_reconciliations') || '[]');
    const reconciledShiftIds = new Set(
      savedReconciliations.flatMap(r => (r.config?.shifts || []).map(s => s.id))
    );

    // Only show shifts that have NOT been reconciled yet
    const availableShifts = shifts.filter(s => !reconciledShiftIds.has(s.id));

    if (availableShifts.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px;">
          <ion-icon name="checkmark-circle-outline" style="font-size:48px;color:var(--ion-color-success);"></ion-icon>
          <p style="color:var(--ion-color-medium);margin-top:8px;font-size:13px;">
            ${shifts.length === 0
              ? 'No hay jornadas completadas para este taxista'
              : 'Todas las jornadas ya han sido conciliadas'}
          </p>
        </div>`;
      return;
    }

    // Keep existing selections valid
    this.selectedShiftIds = new Set(
      [...this.selectedShiftIds].filter(id => availableShifts.some(s => s.id === id))
    );

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px 8px;">
        <span style="font-size:12px;color:var(--ion-color-medium);">${availableShifts.length} jornada${availableShifts.length!==1?'s':''} pendiente${availableShifts.length!==1?'s':''} de conciliar</span>
        <div style="display:flex;gap:8px;">
          <ion-button size="small" fill="clear" id="select-all-shifts">Seleccionar todas</ion-button>
          <ion-button size="small" fill="clear" color="medium" id="deselect-all-shifts">Ninguna</ion-button>
        </div>
      </div>
      ${availableShifts.map(shift => {
        const checked = this.selectedShiftIds.has(shift.id);
        const effMs = this._effectiveMs(shift);
        const allServices = JSON.parse(localStorage.getItem('taxi_services') || '[]');
        const shiftServices = allServices.filter(s => s.shiftId === shift.id);
        const shiftIncome = shiftServices.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        return `
          <div class="shift-check-item" data-shift-id="${shift.id}"
            style="display:flex;align-items:flex-start;gap:12px;padding:12px;margin-bottom:8px;
                   border-radius:12px;cursor:pointer;
                   border:2px solid ${checked ? 'var(--ion-color-primary)' : 'var(--ion-color-step-200)'};
                   background:${checked ? 'var(--ion-color-primary-tint)' : 'var(--ion-color-step-50)'};
                   transition:all 0.15s;">
            <div style="margin-top:2px;">
              <ion-icon name="${checked ? 'checkbox' : 'square-outline'}"
                style="font-size:22px;color:${checked ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)'};">
              </ion-icon>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:13px;color:var(--ion-text-color);">
                📅 ${this._fmtDate(shift.startTime)}
              </div>
              <div style="font-size:12px;color:var(--ion-color-medium);margin-top:2px;">
                🏁 ${this._fmtDate(shift.endTime)}
              </div>
              <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
                <span style="font-size:11px;background:var(--ion-color-primary-tint);color:var(--ion-color-primary);
                             padding:2px 8px;border-radius:20px;font-weight:600;">
                  ⏱ ${this._fmtDuration(effMs)}
                </span>
                <span style="font-size:11px;background:var(--ion-color-success-tint);color:var(--ion-color-success);
                             padding:2px 8px;border-radius:20px;font-weight:600;">
                  🚕 ${shiftServices.length} · €${shiftIncome.toFixed(2)}
                </span>
              </div>
            </div>
          </div>`;
      }).join('')}
    `;

    // Attach shift item click handlers
    container.querySelectorAll('.shift-check-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-shift-id');
        if (this.selectedShiftIds.has(id)) {
          this.selectedShiftIds.delete(id);
        } else {
          this.selectedShiftIds.add(id);
        }
        this._renderShiftsList(uid);
      });
    });

    document.getElementById('select-all-shifts')?.addEventListener('click', (e) => {
      e.stopPropagation();
      availableShifts.forEach(s => this.selectedShiftIds.add(s.id));
      this._renderShiftsList(uid);
    });

    document.getElementById('deselect-all-shifts')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectedShiftIds.clear();
      this._renderShiftsList(uid);
    });
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

    // Mode toggle buttons
    const btnDates = document.getElementById('mode-btn-dates');
    const btnShifts = document.getElementById('mode-btn-shifts');

    const activateStyle = 'background:#1e3a6e;color:#fff;';
    const inactiveStyle = 'background:var(--ion-color-light);color:var(--ion-color-dark);';

    btnDates?.addEventListener('click', () => {
      this.reconcileMode = 'dates';
      btnDates.style.cssText += activateStyle;
      if (btnShifts) btnShifts.style.cssText += inactiveStyle;
      document.getElementById('panel-dates').style.display = 'block';
      document.getElementById('panel-shifts').style.display = 'none';
    });

    btnShifts?.addEventListener('click', () => {
      this.reconcileMode = 'shifts';
      btnShifts.style.cssText += activateStyle;
      if (btnDates) btnDates.style.cssText += inactiveStyle;
      document.getElementById('panel-dates').style.display = 'none';
      document.getElementById('panel-shifts').style.display = 'block';
      this._renderShiftsList();
    });

    // When patron changes taxista, reload shifts list
    document.getElementById('client-name')?.addEventListener('ionChange', () => {
      this.clearError('client-error');
      this.selectedShiftIds.clear();
      if (this.reconcileMode === 'shifts') {
        this._resolveSelectedTaxistaId().then(uid => this._renderShiftsList(uid));
      }
    });

    document.getElementById('start-date')?.addEventListener('ionChange', () => this.clearError('date-error'));
    document.getElementById('end-date')?.addEventListener('ionChange', () => this.clearError('date-error'));
  }

  /**
   * Resolve the userId of the selected taxista (for PATRON) or current user (for TAXISTA)
   */
  async _resolveSelectedTaxistaId() {
    const user = this.authAdapter?.getCurrentUser();
    if (!user) return null;
    if (user.rol === 'TAXISTA') return user.id;

    const clientName = document.getElementById('client-name')?.value?.trim();
    if (!clientName) return user.id;

    const patronName = `${user.nombre} (Patrón)`;
    if (clientName === patronName || clientName === user.nombre) return user.id;

    const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
    const found = allUsers.find(u =>
      u.rol === 'TAXISTA' && u.estado === 'asociado' && u.patronId === user.id &&
      (u.nombre === clientName || `${u.nombre} (${u.numeroTaxista})` === clientName ||
       `${u.nombre}` === clientName)
    );
    return found ? found.id : user.id;
  }

  /**
   * Validate configuration form
   */
  validateConfiguration() {
    let isValid = true;

    const clientName = document.getElementById('client-name')?.value?.trim();
    if (!clientName || clientName.length < 3) {
      this.showError('client-error', 'El nombre debe tener al menos 3 caracteres');
      isValid = false;
    }

    if (this.reconcileMode === 'dates') {
      const startDate = document.getElementById('start-date')?.value;
      const endDate = document.getElementById('end-date')?.value;
      if (!startDate || !endDate) {
        this.showError('date-error', 'Ambas fechas son obligatorias');
        isValid = false;
      } else if (new Date(startDate) > new Date(endDate)) {
        this.showError('date-error', 'La fecha de inicio debe ser anterior a la fecha de fin');
        isValid = false;
      }
    } else {
      if (this.selectedShiftIds.size === 0) {
        this.showError('shifts-error', 'Selecciona al menos una jornada');
        isValid = false;
      }
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

      const user = this.authAdapter ? this.authAdapter.getCurrentUser() : null;
      const clientName = document.getElementById('client-name')?.value?.trim();

      // ── Build config ──────────────────────────────────────────────────────
      const config = { clientName, mode: this.reconcileMode };

      // ── Get all services & expenses ───────────────────────────────────────
      let services = await this.reconcileAdapter.getServices();
      let expenses = await this.reconcileAdapter.getExpenses();

      // ── Apply taxista settings (same logic for both modes) ────────────────
      if (user && user.rol === 'PATRON') {
        const patronName = `${user.nombre} (Patrón)`;
        if (clientName === patronName || clientName === user.nombre) {
          services = services.filter(s => s.userId === user.id);
          expenses = expenses.filter(e => e.userId === user.id);
          config.taxistaSettings = { patronPercentage: 100, tipDistribution: 'patron', commissionDistribution: 'patron', expenseDistribution: 'patron' };
        } else {
          const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
          const selectedTaxista = allUsers.find(u =>
            u.rol === 'TAXISTA' && u.estado === 'asociado' && u.patronId === user.id &&
            (u.nombre === clientName || `${u.nombre} (${u.numeroTaxista})` === clientName)
          );
          if (!selectedTaxista) {
            await LoadingManager.hide();
            ToastManager.showError('No se encontró el taxista seleccionado');
            return;
          }
          services = services.filter(s => s.userId === selectedTaxista.id);
          expenses = expenses.filter(e => e.userId === selectedTaxista.id);
          const allSettings = JSON.parse(localStorage.getItem('taxi_balance_settings_per_taxista') || '{}');
          config.taxistaSettings = allSettings[selectedTaxista.id] || { patronPercentage: 30, tipDistribution: 'taxista', commissionDistribution: 'taxista', expenseDistribution: 'taxista' };
        }
      } else if (user && user.rol === 'TAXISTA') {
        services = services.filter(s => s.userId === user.id);
        expenses = expenses.filter(e => e.userId === user.id);
        const allSettings = JSON.parse(localStorage.getItem('taxi_balance_settings_per_taxista') || '{}');
        config.taxistaSettings = allSettings[user.id] || { patronPercentage: 30, tipDistribution: 'taxista', commissionDistribution: 'taxista', expenseDistribution: 'taxista' };
      } else {
        config.taxistaSettings = { patronPercentage: 30, tipDistribution: 'taxista', commissionDistribution: 'taxista', expenseDistribution: 'taxista' };
      }

      // ── Filter by mode ────────────────────────────────────────────────────
      let filteredServices, filteredExpenses;

      if (this.reconcileMode === 'shifts') {
        // Filter by selected shiftIds
        const selectedIds = [...this.selectedShiftIds];
        filteredServices = services.filter(s => selectedIds.includes(s.shiftId));

        // For expenses: use the time range covered by selected shifts
        const allShifts = JSON.parse(localStorage.getItem('taxi_work_shifts') || '[]');
        const selectedShifts = allShifts.filter(s => selectedIds.includes(s.id));

        if (selectedShifts.length > 0) {
          const minStart = new Date(Math.min(...selectedShifts.map(s => new Date(s.startTime))));
          const maxEnd = new Date(Math.max(...selectedShifts.map(s => new Date(s.endTime || s.startTime))));
          filteredExpenses = expenses.filter(e => {
            const d = new Date(e.datetime || e.date || e.createdAt);
            return d >= minStart && d <= maxEnd;
          });
          config.startDate = minStart.toISOString();
          config.endDate = maxEnd.toISOString();
          config.shifts = selectedShifts;
        } else {
          filteredExpenses = [];
        }
      } else {
        // Filter by date range
        config.startDate = document.getElementById('start-date').value;
        config.endDate = document.getElementById('end-date').value;

        filteredServices = services.filter(s => {
          let dt = s.datetime ? new Date(s.datetime) : s.date && s.time ? new Date(`${s.date}T${s.time}`) : s.date ? new Date(`${s.date}T00:00:00`) : null;
          if (!dt) return false;
          return dt >= new Date(config.startDate) && dt <= new Date(config.endDate);
        });

        filteredExpenses = expenses.filter(e => {
          let dt = e.datetime ? new Date(e.datetime) : e.date ? new Date(`${e.date}T00:00:00`) : e.createdAt ? new Date(e.createdAt) : null;
          if (!dt) return false;
          return dt >= new Date(config.startDate) && dt <= new Date(config.endDate);
        });
      }

      this.currentReconciliation = this.calculateReconciliation(config, filteredServices, filteredExpenses);

      await LoadingManager.hide();
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
          <ion-card-subtitle>${config.clientName} • ${
            config.mode === 'shifts' && config.shifts
              ? `${config.shifts.length} jornada${config.shifts.length!==1?'s':''} · ${this._fmtDate(config.startDate)} – ${this._fmtDate(config.endDate)}`
              : `${config.startDate} - ${config.endDate}`
          }</ion-card-subtitle>
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
