/**
 * ActiveShiftsView - Vista de jornadas activas para PATRON
 * 
 * Responsabilidades:
 * - Mostrar todos los taxistas que están trabajando en tiempo real
 * - Indicar estado (trabajando/en pausa)
 * - Mostrar tiempo transcurrido y horas efectivas
 * - Actualizar automáticamente cada minuto
 * - Permitir ver detalle de jornada activa
 */

class ActiveShiftsView {
  constructor(authAdapter, workShiftAdapter) {
    this.authAdapter = authAdapter;
    this.workShiftAdapter = workShiftAdapter;
    this.modal = null;
    this.activeShifts = [];
    this.refreshInterval = null;
  }

  /**
   * Mostrar modal de jornadas activas
   */
  async show() {
    this.modal = await this.createModal();
    await this.modal.present();
    await this.loadActiveShifts();
    this.startAutoRefresh();
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
          <ion-title>Jornadas Activas</ion-title>
          <ion-buttons slot="end">
            <ion-button id="refresh-active-shifts-btn">
              <ion-icon name="refresh"></ion-icon>
            </ion-button>
            <ion-button id="close-active-shifts-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <div id="active-shifts-container">
          <div class="ion-text-center" style="padding: 40px;">
            <ion-spinner></ion-spinner>
            <p>Cargando jornadas activas...</p>
          </div>
        </div>
      </ion-content>
    `;

    document.body.appendChild(modal);

    // Adjuntar event listeners
    modal.querySelector('#close-active-shifts-modal').addEventListener('click', () => {
      this.stopAutoRefresh();
      modal.dismiss();
    });

    modal.querySelector('#refresh-active-shifts-btn').addEventListener('click', () => {
      this.loadActiveShifts();
    });

    return modal;
  }

  /**
   * Cargar jornadas activas
   */
  async loadActiveShifts() {
    try {
      const currentUser = await this.authAdapter.getCurrentUser();
      if (!currentUser || currentUser.rol !== 'PATRON') {
        if (window.ToastManager) {
          window.ToastManager.showError('Solo los patrones pueden ver esta información');
        }
        return;
      }

      // Obtener TODAS las jornadas sin filtrar por estado primero
      const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const associatedTaxistas = allUsers.filter(u => u.patronId === currentUser.id);
      const allowedUserIds = [currentUser.id, ...associatedTaxistas.map(t => t.id)];

      // Obtener todas las jornadas directamente desde localStorage
      const allShifts = JSON.parse(localStorage.getItem('taxi_work_shifts') || '[]');
      
      // Filtrar jornadas activas y pausadas de usuarios permitidos
      this.activeShifts = allShifts.filter(shift => 
        allowedUserIds.includes(shift.userId) &&
        (shift.status === 'active' || shift.status === 'paused')
      );

      // Enriquecer con información de usuario
      this.activeShifts = this.activeShifts.map(shift => {
        const user = allUsers.find(u => u.id === shift.userId);
        return {
          ...shift,
          userName: user ? user.nombre : 'Desconocido',
          userNumber: user ? user.numeroTaxista : 'N/A',
          isPatron: user && user.id === currentUser.id
        };
      });

      // Ordenar: primero el patrón, luego por nombre
      this.activeShifts.sort((a, b) => {
        if (a.isPatron && !b.isPatron) return -1;
        if (!a.isPatron && b.isPatron) return 1;
        return a.userName.localeCompare(b.userName);
      });

      const container = document.getElementById('active-shifts-container');
      if (container) {
        if (this.activeShifts.length === 0) {
          container.innerHTML = `
            <div class="ion-text-center" style="padding: 40px;">
              <ion-icon name="time-outline" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
              <p style="margin-top: 16px; color: var(--ion-color-medium);">
                No hay jornadas activas en este momento
              </p>
            </div>
          `;
        } else {
          container.innerHTML = this.renderActiveShiftsList(this.activeShifts);
          this.attachShiftListeners();
        }
      }
    } catch (error) {
      console.error('Error loading active shifts:', error);
      if (window.ToastManager) {
        window.ToastManager.showError('Error al cargar jornadas activas');
      }
    }
  }

  /**
   * Renderizar lista de jornadas activas
   * @param {Array} shifts - Array de jornadas activas
   * @returns {string} HTML de la lista
   */
  renderActiveShiftsList(shifts) {
    return `
      <div style="margin-bottom: 16px;">
        <ion-chip color="primary">
          <ion-icon name="people"></ion-icon>
          <ion-label>${shifts.length} ${shifts.length === 1 ? 'persona trabajando' : 'personas trabajando'}</ion-label>
        </ion-chip>
      </div>
      ${shifts.map(shift => this.renderActiveShiftCard(shift)).join('')}
    `;
  }

  /**
   * Renderizar tarjeta de jornada activa
   * @param {Object} shift - Jornada activa
   * @returns {string} HTML de la tarjeta
   */
  renderActiveShiftCard(shift) {
    const statusColor = shift.status === 'active' ? 'success' : 'warning';
    const statusText = shift.status === 'active' ? 'Trabajando' : 'En pausa';
    const statusIcon = shift.status === 'active' ? 'play-circle' : 'pause-circle';

    const startTime = this.workShiftAdapter.formatTime(shift.startTime);
    const elapsed = Date.now() - new Date(shift.startTime);
    const elapsedFormatted = this.formatDurationHumanReadable(elapsed);
    
    const effectiveHours = this.workShiftAdapter.calculateEffectiveHours(shift);
    const effectiveFormatted = this.formatDurationHumanReadable(effectiveHours);

    const pauseCount = shift.pauses ? shift.pauses.filter(p => p.endTime).length : 0;

    // Obtener servicios de la jornada
    const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
    const shiftServices = services.filter(s => s.shiftId === shift.id);
    const serviceCount = shiftServices.length;

    const patronBadge = shift.isPatron ? '<ion-badge color="primary" style="margin-left: 8px;">TÚ</ion-badge>' : '';

    return `
      <ion-card class="active-shift-card" data-shift-id="${shift.id}">
        <ion-card-header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <ion-card-title>
                ${shift.userName} ${patronBadge}
              </ion-card-title>
              <ion-card-subtitle>Nº ${shift.userNumber}</ion-card-subtitle>
            </div>
            <ion-badge color="${statusColor}">
              <ion-icon name="${statusIcon}"></ion-icon>
              ${statusText}
            </ion-badge>
          </div>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <div class="stat-label">Inicio</div>
                <div class="stat-value">${startTime}</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Tiempo Total</div>
                <div class="stat-value">${elapsedFormatted}</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Horas Efectivas</div>
                <div class="stat-value" style="color: var(--ion-color-success);">${effectiveFormatted}</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Pausas</div>
                <div class="stat-value">${pauseCount}</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Servicios</div>
                <div class="stat-value">${serviceCount}</div>
              </ion-col>
            </ion-row>
          </ion-grid>
          
          <ion-button expand="block" size="small" class="view-active-shift-btn" data-shift-id="${shift.id}" style="margin-top: 12px;">
            <ion-icon slot="start" name="eye-outline"></ion-icon>
            Ver Detalle
          </ion-button>
        </ion-card-content>
      </ion-card>
    `;
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
    document.querySelectorAll('.view-active-shift-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shiftId = e.currentTarget.getAttribute('data-shift-id');
        this.handleViewShiftDetail(shiftId);
      });
    });
  }

  /**
   * Manejar ver detalle de jornada
   * @param {string} shiftId - ID de la jornada
   */
  async handleViewShiftDetail(shiftId) {
    if (window.ShiftDetailModal) {
      const detailModal = new window.ShiftDetailModal(
        this.workShiftAdapter,
        window.reconcileAdapter || null
      );
      await detailModal.show(shiftId);
    }
  }

  /**
   * Iniciar actualización automática
   */
  startAutoRefresh() {
    // Actualizar cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.loadActiveShifts();
    }, 30000);
  }

  /**
   * Detener actualización automática
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ActiveShiftsView = ActiveShiftsView;
}
