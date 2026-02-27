/**
 * ShiftDetailModal - Modal para mostrar detalle completo de una jornada
 * 
 * Responsabilidades:
 * - Mostrar información completa de jornada
 * - Listar todas las pausas con timestamps
 * - Mostrar servicios realizados durante la jornada
 * - Calcular y mostrar métricas de productividad
 * - Permitir exportar a PDF
 */

class ShiftDetailModal {
  constructor(workShiftAdapter, reconcileAdapter) {
    this.workShiftAdapter = workShiftAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.modal = null;
    this.shift = null;
    this.services = [];
  }

  /**
   * Mostrar modal con detalle de jornada
   * @param {string} shiftId - ID de la jornada
   */
  async show(shiftId) {
    this.shift = await this.workShiftAdapter.getShiftById(shiftId);
    if (!this.shift) {
      if (window.ToastManager) {
        window.ToastManager.showError('Jornada no encontrada');
      }
      return;
    }

    this.services = await this.workShiftAdapter.getShiftServices(shiftId);

    this.modal = await this.createModal(this.shift);
    await this.modal.present();
  }

  /**
   * Crear modal
   * @param {Object} shift - Jornada
   * @returns {HTMLIonModalElement} Modal
   */
  async createModal(shift) {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Detalle de Jornada</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-detail-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        ${this.renderShiftInfo(shift)}
        ${this.renderPauseList(shift.pauses)}
        ${this.renderServiceList(this.services)}
        ${this.renderMetrics(shift, this.services)}
        
        <ion-button expand="block" color="secondary" id="export-shift-pdf-btn" style="margin-top: 20px;">
          <ion-icon slot="start" name="download-outline"></ion-icon>
          Exportar a PDF
        </ion-button>
      </ion-content>
    `;

    document.body.appendChild(modal);

    // Adjuntar event listeners
    modal.querySelector('#close-detail-modal').addEventListener('click', () => {
      modal.dismiss();
    });

    modal.querySelector('#export-shift-pdf-btn').addEventListener('click', () => {
      this.exportToPDF(shift);
    });

    return modal;
  }

  /**
   * Renderizar información de jornada
   * @param {Object} shift - Jornada
   * @returns {string} HTML
   */
  renderShiftInfo(shift) {
    const startDate = new Date(shift.startTime);
    const dateFormatted = startDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const startTime = this.workShiftAdapter.formatTime(shift.startTime);
    const endTime = shift.endTime ? this.workShiftAdapter.formatTime(shift.endTime) : 'En curso';

    const totalDuration = shift.endTime 
      ? new Date(shift.endTime) - new Date(shift.startTime)
      : Date.now() - new Date(shift.startTime);
    
    const effectiveHours = this.workShiftAdapter.calculateEffectiveHours(shift);

    return `
      <ion-card>
        <ion-card-header>
          <ion-card-title style="text-transform: capitalize;">${dateFormatted}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="full">
            <ion-item>
              <ion-label>Hora de Inicio</ion-label>
              <ion-note slot="end">${startTime}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Hora de Fin</ion-label>
              <ion-note slot="end">${endTime}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>Duración Total</ion-label>
              <ion-note slot="end">${this.workShiftAdapter.formatDuration(totalDuration)}</ion-note>
            </ion-item>
            <ion-item>
              <ion-label><strong>Horas Efectivas</strong></ion-label>
              <ion-note slot="end" color="success"><strong>${this.workShiftAdapter.formatDuration(effectiveHours)}</strong></ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Renderizar lista de pausas
   * @param {Array} pauses - Array de pausas
   * @returns {string} HTML
   */
  renderPauseList(pauses) {
    if (!pauses || pauses.length === 0) {
      return '';
    }

    const completedPauses = pauses.filter(p => p.endTime);
    if (completedPauses.length === 0) {
      return '';
    }

    const pausesHtml = completedPauses.map((pause, index) => {
      const start = this.workShiftAdapter.formatTime(pause.startTime);
      const end = this.workShiftAdapter.formatTime(pause.endTime);
      const duration = new Date(pause.endTime) - new Date(pause.startTime);
      const durationFormatted = this.workShiftAdapter.formatDuration(duration);

      return `
        <ion-item>
          <ion-label>Pausa ${index + 1}</ion-label>
          <ion-note slot="end">${start} - ${end} (${durationFormatted})</ion-note>
        </ion-item>
      `;
    }).join('');

    return `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Pausas (${completedPauses.length})</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="full">
            ${pausesHtml}
          </ion-list>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Renderizar lista de servicios
   * @param {Array} services - Array de servicios
   * @returns {string} HTML
   */
  renderServiceList(services) {
    if (!services || services.length === 0) {
      return `
        <ion-card>
          <ion-card-header>
            <ion-card-title>Servicios Realizados</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p class="ion-text-center" style="color: var(--ion-color-medium);">
              No hay servicios registrados en esta jornada
            </p>
          </ion-card-content>
        </ion-card>
      `;
    }

    const servicesHtml = services.map((service, index) => {
      const serviceTime = service.datetime || service.date;
      const timeFormatted = serviceTime ? this.workShiftAdapter.formatTime(serviceTime) : 'N/A';
      const amount = parseFloat(service.amount || 0);

      return `
        <ion-item>
          <ion-label>
            <h3>Servicio ${index + 1}</h3>
            <p>${timeFormatted}</p>
          </ion-label>
          <ion-note slot="end" color="primary"><strong>${amount.toFixed(2)}€</strong></ion-note>
        </ion-item>
      `;
    }).join('');

    return `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Servicios Realizados (${services.length})</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="full">
            ${servicesHtml}
          </ion-list>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Renderizar métricas de productividad
   * @param {Object} shift - Jornada
   * @param {Array} services - Array de servicios
   * @returns {string} HTML
   */
  renderMetrics(shift, services) {
    const effectiveHours = this.workShiftAdapter.calculateEffectiveHours(shift);
    const effectiveHoursInHours = effectiveHours / (1000 * 60 * 60);

    const totalIncome = services.reduce((sum, service) => {
      return sum + parseFloat(service.amount || 0);
    }, 0);

    const incomePerHour = effectiveHoursInHours > 0 
      ? totalIncome / effectiveHoursInHours 
      : 0;

    const servicesPerHour = effectiveHoursInHours > 0 
      ? services.length / effectiveHoursInHours 
      : 0;

    return `
      <ion-card>
        <ion-card-header>
          <ion-card-title>Métricas de Productividad</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <div class="stat-label">Total Servicios</div>
                <div class="stat-value">${services.length}</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Ingresos Totales</div>
                <div class="stat-value" style="color: var(--ion-color-primary);">${totalIncome.toFixed(2)}€</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Ingreso por Hora</div>
                <div class="stat-value" style="color: var(--ion-color-success);">${incomePerHour.toFixed(2)}€/h</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Servicios por Hora</div>
                <div class="stat-value">${servicesPerHour.toFixed(2)}</div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Exportar jornada a PDF
   * @param {Object} shift - Jornada
   */
  async exportToPDF(shift) {
    try {
      if (window.LoadingManager) {
        window.LoadingManager.show('Generando PDF...');
      }

      if (window.ShiftPDFExporter) {
        const exporter = new window.ShiftPDFExporter();
        await exporter.exportShift(shift, this.services);
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
  window.ShiftDetailModal = ShiftDetailModal;
}
