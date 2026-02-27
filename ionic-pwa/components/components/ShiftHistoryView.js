/**
 * ShiftHistoryView - Componente modal para historial de jornadas
 * 
 * Responsabilidades:
 * - Mostrar lista de jornadas completadas
 * - Filtrar por rango de fechas
 * - Ordenar por fecha descendente
 * - Mostrar resumen de cada jornada
 * - Permitir ver detalle de jornada individual
 * - Exportar jornada a PDF
 */

class ShiftHistoryView {
  constructor(authAdapter, workShiftAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.workShiftAdapter = workShiftAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.modal = null;
    this.shifts = [];
    this.filters = {};
  }

  /**
   * Mostrar modal de historial
   */
  async show() {
    this.modal = await this.createModal();
    await this.modal.present();
    await this.loadShiftHistory();
  }

  /**
   * Crear modal
   * @returns {HTMLIonModalElement} Modal
   */
  async createModal() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Historial de Jornadas</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-history-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
        
        <!-- Filtros de fecha -->
        <ion-toolbar>
          <ion-grid>
            <ion-row>
              <ion-col size="5">
                <ion-item>
                  <ion-label position="stacked">Desde</ion-label>
                  <ion-input type="datetime-local" id="filter-start-date"></ion-input>
                </ion-item>
              </ion-col>
              <ion-col size="5">
                <ion-item>
                  <ion-label position="stacked">Hasta</ion-label>
                  <ion-input type="datetime-local" id="filter-end-date"></ion-input>
                </ion-item>
              </ion-col>
              <ion-col size="2">
                <ion-button expand="block" id="apply-filters-btn" style="margin-top: 25px;">
                  <ion-icon name="funnel"></ion-icon>
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <div id="shift-list-container">
          <div class="ion-text-center" style="padding: 40px;">
            <ion-spinner></ion-spinner>
            <p>Cargando jornadas...</p>
          </div>
        </div>
      </ion-content>
    `;

    document.body.appendChild(modal);

    // Adjuntar event listeners
    modal.querySelector('#close-history-modal').addEventListener('click', () => {
      modal.dismiss();
    });

    modal.querySelector('#apply-filters-btn').addEventListener('click', () => {
      this.handleFilterChange();
    });

    return modal;
  }

  /**
   * Cargar historial de jornadas
   * @param {Object} filters - Filtros opcionales
   */
  async loadShiftHistory(filters = {}) {
    try {
      this.filters = filters;
      this.shifts = await this.workShiftAdapter.getShiftHistory(filters);
      
      const container = document.getElementById('shift-list-container');
      if (container) {
        if (this.shifts.length === 0) {
          container.innerHTML = `
            <div class="ion-text-center" style="padding: 40px;">
              <ion-icon name="calendar-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
              <p style="margin-top: 16px; color: var(--ion-color-medium);">
                No hay jornadas en el historial
              </p>
            </div>
          `;
        } else {
          container.innerHTML = this.renderShiftList(this.shifts);
          this.attachShiftListeners();
        }
      }
    } catch (error) {
      console.error('Error loading shift history:', error);
      if (window.ToastManager) {
        window.ToastManager.showError('Error al cargar historial de jornadas');
      }
    }
  }

  /**
   * Renderizar lista de jornadas
   * @param {Array} shifts - Array de jornadas
   * @returns {string} HTML de la lista
   */
  renderShiftList(shifts) {
    return shifts.map(shift => this.renderShiftCard(shift)).join('');
  }

  /**
   * Renderizar tarjeta de jornada
   * @param {Object} shift - Jornada
   * @returns {string} HTML de la tarjeta
   */
  renderShiftCard(shift) {
    const stats = this.calculateShiftStats(shift);
    
    const startDate = new Date(shift.startTime);
    const dateFormatted = startDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const startTime = this.workShiftAdapter.formatTime(shift.startTime);
    const endTime = shift.endTime ? this.workShiftAdapter.formatTime(shift.endTime) : 'En curso';

    return `
      <ion-card class="shift-history-card" data-shift-id="${shift.id}">
        <ion-card-header>
          <ion-card-title style="text-transform: capitalize; color: var(--ion-color-primary); font-weight: 700; font-size: 19px;">${dateFormatted}</ion-card-title>
          <ion-card-subtitle style="color: #000000; font-weight: 600; font-size: 15px;">${startTime} - ${endTime}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <div class="stat-label">Duración Total</div>
                <div class="stat-value">${stats.totalDurationFormatted}</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Horas Efectivas</div>
                <div class="stat-value" style="color: var(--ion-color-success);">${stats.effectiveHoursFormatted}</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Pausas</div>
                <div class="stat-value">${stats.pauseCount} (${stats.totalPauseTimeFormatted})</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Servicios</div>
                <div class="stat-value">${stats.serviceCount}</div>
              </ion-col>
              <ion-col size="12">
                <div class="stat-label">Ingresos</div>
                <div class="stat-value" style="color: var(--ion-color-primary); font-size: 1.2em;">${stats.totalIncome.toFixed(2)}€</div>
              </ion-col>
            </ion-row>
          </ion-grid>
          
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <ion-button expand="block" size="small" class="view-detail-btn" data-shift-id="${shift.id}" style="flex: 1;">
              <ion-icon slot="start" name="eye-outline"></ion-icon>
              Ver Detalle
            </ion-button>
            <ion-button expand="block" size="small" color="secondary" class="export-pdf-btn" data-shift-id="${shift.id}" style="flex: 1;">
              <ion-icon slot="start" name="download-outline"></ion-icon>
              PDF
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Calcular estadísticas de jornada
   * @param {Object} shift - Jornada
   * @returns {Object} Estadísticas
   */
  calculateShiftStats(shift) {
    const totalDuration = shift.endTime 
      ? new Date(shift.endTime) - new Date(shift.startTime)
      : Date.now() - new Date(shift.startTime);
    
    const effectiveHours = this.workShiftAdapter.calculateEffectiveHours(shift);
    const totalPauseTime = this.workShiftAdapter.calculateTotalPauseTime(shift);
    
    // Obtener servicios de la jornada
    const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
    const shiftServices = services.filter(s => s.shiftId === shift.id);
    
    const totalIncome = shiftServices.reduce((sum, service) => {
      return sum + parseFloat(service.amount || 0);
    }, 0);

    return {
      totalDuration,
      totalDurationFormatted: this.formatDurationHumanReadable(totalDuration),
      effectiveHours,
      effectiveHoursFormatted: this.formatDurationHumanReadable(effectiveHours),
      totalPauseTime,
      totalPauseTimeFormatted: this.formatDurationHumanReadable(totalPauseTime),
      pauseCount: shift.pauses ? shift.pauses.filter(p => p.endTime).length : 0,
      serviceCount: shiftServices.length,
      totalIncome,
      incomePerHour: effectiveHours > 0 ? (totalIncome / (effectiveHours / (1000 * 60 * 60))) : 0
    };
  }

  /**
   * Formatear duración en formato legible
   * @param {number} milliseconds - Duración en milisegundos
   * @returns {string} Duración formateada
   */
  formatDurationHumanReadable(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  }

  /**
   * Adjuntar listeners a las tarjetas
   */
  attachShiftListeners() {
    // Botones de ver detalle
    document.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shiftId = e.currentTarget.getAttribute('data-shift-id');
        this.handleShiftClick(shiftId);
      });
    });

    // Botones de exportar PDF
    document.querySelectorAll('.export-pdf-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shiftId = e.currentTarget.getAttribute('data-shift-id');
        this.handleExportPDF(shiftId);
      });
    });
  }

  /**
   * Manejar cambio de filtros
   */
  async handleFilterChange() {
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');

    const filters = {};

    if (startDateInput && startDateInput.value) {
      filters.startDate = new Date(startDateInput.value).toISOString();
    }

    if (endDateInput && endDateInput.value) {
      filters.endDate = new Date(endDateInput.value).toISOString();
    }

    await this.loadShiftHistory(filters);
  }

  /**
   * Manejar clic en jornada
   * @param {string} shiftId - ID de la jornada
   */
  async handleShiftClick(shiftId) {
    if (window.ShiftDetailModal) {
      const detailModal = new window.ShiftDetailModal(
        this.workShiftAdapter,
        this.reconcileAdapter
      );
      await detailModal.show(shiftId);
    }
  }

  /**
   * Manejar exportación a PDF
   * @param {string} shiftId - ID de la jornada
   */
  async handleExportPDF(shiftId) {
    try {
      if (window.LoadingManager) {
        window.LoadingManager.show('Generando PDF...');
      }

      const shift = await this.workShiftAdapter.getShiftById(shiftId);
      if (!shift) {
        throw new Error('Jornada no encontrada');
      }

      const services = await this.workShiftAdapter.getShiftServices(shiftId);

      if (window.ShiftPDFExporter) {
        const exporter = new window.ShiftPDFExporter();
        await exporter.exportShift(shift, services);
      }

      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }

      if (window.ToastManager) {
        window.ToastManager.showSuccess('PDF generado correctamente');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }
      if (window.ToastManager) {
        window.ToastManager.showError('Error al generar PDF: ' + error.message);
      }
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ShiftHistoryView = ShiftHistoryView;
}
