/**
 * WorkShiftManager - Componente para gestión de fichaje en el dashboard
 * 
 * Responsabilidades:
 * - Renderizar tarjeta de jornada activa en dashboard
 * - Mostrar timer en tiempo real
 * - Proporcionar botones de control (Iniciar, Pausar, Reanudar, Finalizar)
 * - Actualizar UI cada segundo mientras hay jornada activa
 * - Mostrar lista de pausas con duraciones
 */

class WorkShiftManager {
  constructor(authAdapter, workShiftAdapter) {
    this.authAdapter = authAdapter;
    this.workShiftAdapter = workShiftAdapter;
    this.timerInterval = null;
    this.currentShift = null;
  }

  /**
   * Renderizar componente en el contenedor especificado
   * @param {string} containerId - ID del contenedor
   */
  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('WorkShiftManager: Container not found:', containerId);
      return;
    }

    // Obtener jornada activa
    this.currentShift = await this.workShiftAdapter.getActiveShift();

    if (this.currentShift) {
      container.innerHTML = this.renderActiveShift(this.currentShift);
      this.attachEventListeners();
      this.startTimer();
    } else {
      container.innerHTML = this.renderNoActiveShift();
      this.attachEventListeners();
    }

    // Escuchar eventos de jornada
    this.setupEventListeners();
  }

  /**
   * Renderizar tarjeta de jornada activa
   * @param {Object} shift - Jornada activa
   * @returns {string} HTML de la tarjeta
   */
  renderActiveShift(shift) {
    const statusColor = shift.status === 'active' ? 'success' : 'warning';
    const statusText = shift.status === 'active' ? 'Trabajando' : 'En pausa';
    const statusIcon = shift.status === 'active' ? 'play-circle' : 'pause-circle';

    const startTime = this.workShiftAdapter.formatTime(shift.startTime);
    const effectiveHours = this.workShiftAdapter.calculateEffectiveHours(shift);
    const effectiveFormatted = this.workShiftAdapter.formatDuration(effectiveHours);

    const pausesList = this.renderPausesList(shift.pauses);

    return `
      <ion-card id="active-shift-card" class="shift-card">
        <ion-card-header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <ion-card-title>
              <ion-icon name="time-outline"></ion-icon>
              Jornada Activa
            </ion-card-title>
            <ion-badge color="${statusColor}">
              <ion-icon name="${statusIcon}"></ion-icon>
              ${statusText}
            </ion-badge>
          </div>
        </ion-card-header>
        
        <ion-card-content>
          <!-- Timer en tiempo real -->
          <div class="shift-timer">
            <div class="timer-display" id="shift-timer-display">${effectiveFormatted}</div>
            <div class="timer-label">Horas efectivas</div>
          </div>
          
          <!-- Información de jornada -->
          <ion-list lines="none">
            <ion-item>
              <ion-label>Inicio</ion-label>
              <ion-note slot="end">${startTime}</ion-note>
            </ion-item>
          </ion-list>
          
          ${pausesList}
          
          <!-- Botones de control -->
          ${this.renderShiftControls(shift)}
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Renderizar cuando no hay jornada activa
   * @returns {string} HTML
   */
  renderNoActiveShift() {
    return `
      <ion-card class="shift-card">
        <ion-card-content class="ion-text-center">
          <ion-icon name="time-outline" style="font-size: 48px; color: var(--ion-color-medium);"></ion-icon>
          <p style="margin-top: 16px; color: var(--ion-color-medium);">
            No hay jornada activa
          </p>
          <ion-button expand="block" color="primary" id="start-shift-btn">
            <ion-icon slot="start" name="play"></ion-icon>
            Iniciar Jornada
          </ion-button>
        </ion-card-content>
      </ion-card>
    `;
  }

  /**
   * Renderizar lista de pausas
   * @param {Array} pauses - Array de pausas
   * @returns {string} HTML de la lista
   */
  renderPausesList(pauses) {
    if (!pauses || pauses.length === 0) {
      return '';
    }

    const completedPauses = pauses.filter(p => p.endTime);
    if (completedPauses.length === 0) {
      return '';
    }

    const pausesHtml = completedPauses.map(pause => {
      const start = this.workShiftAdapter.formatTime(pause.startTime);
      const end = this.workShiftAdapter.formatTime(pause.endTime);
      const duration = new Date(pause.endTime) - new Date(pause.startTime);
      const durationFormatted = this.workShiftAdapter.formatDuration(duration);
      
      return `<ion-chip color="medium">
        <ion-icon name="pause"></ion-icon>
        <ion-label>${start} - ${end} (${durationFormatted})</ion-label>
      </ion-chip>`;
    }).join('');

    return `
      <div class="pause-list" style="margin-top: 16px;">
        <h4 style="margin-bottom: 8px;">Pausas (${completedPauses.length})</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${pausesHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renderizar botones de control
   * @param {Object} shift - Jornada activa
   * @returns {string} HTML de los botones
   */
  renderShiftControls(shift) {
    if (shift.status === 'active') {
      return `
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <ion-button expand="block" color="warning" id="pause-shift-btn" style="flex: 1;">
            <ion-icon slot="start" name="pause"></ion-icon>
            Pausar
          </ion-button>
          <ion-button expand="block" color="danger" id="end-shift-btn" style="flex: 1;">
            <ion-icon slot="start" name="stop"></ion-icon>
            Finalizar
          </ion-button>
        </div>
      `;
    } else if (shift.status === 'paused') {
      return `
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <ion-button expand="block" color="success" id="resume-shift-btn" style="flex: 1;">
            <ion-icon slot="start" name="play"></ion-icon>
            Reanudar
          </ion-button>
          <ion-button expand="block" color="danger" id="end-shift-btn" style="flex: 1;">
            <ion-icon slot="start" name="stop"></ion-icon>
            Finalizar
          </ion-button>
        </div>
      `;
    }
    return '';
  }

  /**
   * Adjuntar event listeners a los botones
   */
  attachEventListeners() {
    const startBtn = document.getElementById('start-shift-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.handleStartShift());
    }

    const pauseBtn = document.getElementById('pause-shift-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.handlePauseShift());
    }

    const resumeBtn = document.getElementById('resume-shift-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => this.handleResumeShift());
    }

    const endBtn = document.getElementById('end-shift-btn');
    if (endBtn) {
      endBtn.addEventListener('click', () => this.handleEndShift());
    }
  }

  /**
   * Configurar listeners de eventos globales
   */
  setupEventListeners() {
    window.addEventListener('shift-started', () => this.refresh());
    window.addEventListener('shift-ended', () => this.refresh());
    window.addEventListener('shift-paused', () => this.refresh());
    window.addEventListener('shift-resumed', () => this.refresh());
  }

  /**
   * Refrescar componente
   */
  async refresh() {
    const container = document.getElementById('shift-manager-container');
    if (container) {
      await this.render('shift-manager-container');
    }
  }

  /**
   * Manejar inicio de jornada
   */
  async handleStartShift() {
    try {
      if (window.LoadingManager) {
        window.LoadingManager.show('Iniciando jornada...');
      }

      await this.workShiftAdapter.startShift();

      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Jornada iniciada correctamente');
      }
    } catch (error) {
      console.error('Error starting shift:', error);
      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }
      if (window.ToastManager) {
        window.ToastManager.showError(error.message);
      }
    }
  }

  /**
   * Manejar pausa de jornada
   */
  async handlePauseShift() {
    try {
      if (!this.currentShift) return;

      if (window.LoadingManager) {
        window.LoadingManager.show('Pausando jornada...');
      }

      await this.workShiftAdapter.pauseShift(this.currentShift.id);

      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Jornada pausada');
      }
    } catch (error) {
      console.error('Error pausing shift:', error);
      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }
      if (window.ToastManager) {
        window.ToastManager.showError(error.message);
      }
    }
  }

  /**
   * Manejar reanudación de jornada
   */
  async handleResumeShift() {
    try {
      if (!this.currentShift) return;

      if (window.LoadingManager) {
        window.LoadingManager.show('Reanudando jornada...');
      }

      await this.workShiftAdapter.resumeShift(this.currentShift.id);

      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Jornada reanudada');
      }
    } catch (error) {
      console.error('Error resuming shift:', error);
      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }
      if (window.ToastManager) {
        window.ToastManager.showError(error.message);
      }
    }
  }

  /**
   * Manejar finalización de jornada
   */
  async handleEndShift() {
    try {
      if (!this.currentShift) return;

      // Confirmar con el usuario usando AlertManager
      if (window.AlertManager) {
        const confirmed = await window.AlertManager.confirm(
          'Finalizar Jornada',
          '¿Estás seguro de que quieres finalizar la jornada?'
        );

        if (!confirmed) return;
      }

      if (window.LoadingManager) {
        window.LoadingManager.show('Finalizando jornada...');
      }

      await this.workShiftAdapter.endShift(this.currentShift.id);

      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Jornada finalizada correctamente');
      }
    } catch (error) {
      console.error('Error ending shift:', error);
      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }
      if (window.ToastManager) {
        window.ToastManager.showError(error.message);
      }
    }
  }

  /**
   * Iniciar timer de actualización
   */
  startTimer() {
    // Limpiar timer existente
    this.stopTimer();

    // Actualizar cada segundo
    this.timerInterval = setInterval(() => {
      this.updateTimerDisplay();
    }, 1000);

    // Primera actualización inmediata
    this.updateTimerDisplay();
  }

  /**
   * Detener timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Actualizar display del timer
   */
  async updateTimerDisplay() {
    const timerDisplay = document.getElementById('shift-timer-display');
    if (!timerDisplay) {
      this.stopTimer();
      return;
    }

    // Obtener jornada activa actualizada
    this.currentShift = await this.workShiftAdapter.getActiveShift();
    
    if (!this.currentShift) {
      this.stopTimer();
      return;
    }

    // Solo actualizar si está activa (no pausada)
    if (this.currentShift.status === 'active') {
      const effectiveHours = this.workShiftAdapter.calculateEffectiveHours(this.currentShift);
      const formatted = this.workShiftAdapter.formatDuration(effectiveHours);
      
      // Usar requestAnimationFrame para actualización suave
      requestAnimationFrame(() => {
        if (timerDisplay) {
          timerDisplay.textContent = formatted;
        }
      });
    }
  }

  /**
   * Destruir componente y limpiar recursos
   */
  destroy() {
    this.stopTimer();
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.WorkShiftManager = WorkShiftManager;
}
