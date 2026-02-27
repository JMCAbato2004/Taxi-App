/**
 * WorkShiftAdapter - Adaptador para gestión de jornadas laborales
 * 
 * Responsabilidades:
 * - CRUD de jornadas (crear, leer, actualizar, eliminar)
 * - Validación de integridad de jornadas
 * - Cálculo de horas efectivas
 * - Filtrado por rol (TAXISTA/PATRON)
 * - Vinculación de servicios a jornadas activas
 */

// Constantes
const STORAGE_KEY = 'taxi_work_shifts';

// Mensajes de error
const ERROR_MESSAGES = {
  SHIFT_ALREADY_ACTIVE: 'Ya tienes una jornada activa. Finalízala antes de iniciar una nueva.',
  SHIFT_NOT_ACTIVE: 'No hay jornada activa para pausar.',
  SHIFT_NOT_PAUSED: 'La jornada no está pausada.',
  SHIFT_NOT_FOUND: 'Jornada no encontrada.',
  INVALID_TIMESTAMP: 'Timestamp inválido.',
  STORAGE_ERROR: 'Error al guardar en LocalStorage. Verifica el espacio disponible.',
  LOAD_ERROR: 'Error al cargar jornadas. Intenta recargar la aplicación.',
  EXPORT_ERROR: 'Error al exportar PDF. Intenta nuevamente.'
};

class WorkShiftAdapter {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.shifts = [];
    this.loadShifts();
  }

  /**
   * Cargar jornadas desde LocalStorage
   */
  loadShifts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.shifts = JSON.parse(stored);
        console.log('WorkShiftAdapter: Loaded shifts:', this.shifts.length);
      } else {
        this.shifts = [];
      }
    } catch (error) {
      console.error('WorkShiftAdapter: Error loading shifts:', error);
      this.shifts = [];
      throw new Error(ERROR_MESSAGES.LOAD_ERROR);
    }
  }

  /**
   * Guardar jornadas en LocalStorage
   */
  saveShifts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.shifts));
    } catch (error) {
      console.error('WorkShiftAdapter: Error saving shifts:', error);
      throw new Error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }

  /**
   * Iniciar nueva jornada
   * @returns {Object} Nueva jornada creada
   */
  async startShift() {
    const currentUser = await this.authAdapter.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Validar que no exista jornada activa o pausada
    const activeShift = await this.getActiveShift();
    if (activeShift) {
      throw new Error(ERROR_MESSAGES.SHIFT_ALREADY_ACTIVE);
    }

    // Crear nueva jornada
    const now = new Date().toISOString();
    const shift = {
      id: `shift-${Date.now()}`,
      userId: currentUser.id,
      startTime: now,
      endTime: null,
      status: 'active',
      pauses: [],
      createdAt: now,
      updatedAt: now
    };

    this.shifts.push(shift);
    this.saveShifts();

    console.log('WorkShiftAdapter: Shift started:', shift.id);

    // Emitir evento
    window.dispatchEvent(new CustomEvent('shift-started', {
      detail: { shift }
    }));

    return shift;
  }

  /**
   * Finalizar jornada
   * @param {string} shiftId - ID de la jornada
   * @returns {Object} Jornada finalizada
   */
  async endShift(shiftId) {
    const shift = await this.getShiftById(shiftId);
    if (!shift) {
      throw new Error(ERROR_MESSAGES.SHIFT_NOT_FOUND);
    }

    // Auto-completar pausas incompletas
    if (shift.pauses && shift.pauses.length > 0) {
      const lastPause = shift.pauses[shift.pauses.length - 1];
      if (!lastPause.endTime) {
        lastPause.endTime = new Date().toISOString();
        console.log('WorkShiftAdapter: Auto-completed incomplete pause');
      }
    }

    // Finalizar jornada
    const now = new Date().toISOString();
    shift.endTime = now;
    shift.status = 'completed';
    shift.updatedAt = now;

    this.saveShifts();

    console.log('WorkShiftAdapter: Shift ended:', shift.id);

    // Emitir evento
    window.dispatchEvent(new CustomEvent('shift-ended', {
      detail: { shift }
    }));

    return shift;
  }

  /**
   * Pausar jornada
   * @param {string} shiftId - ID de la jornada
   * @returns {Object} Jornada pausada
   */
  async pauseShift(shiftId) {
    const shift = await this.getShiftById(shiftId);
    if (!shift) {
      throw new Error(ERROR_MESSAGES.SHIFT_NOT_FOUND);
    }

    if (shift.status !== 'active') {
      throw new Error(ERROR_MESSAGES.SHIFT_NOT_ACTIVE);
    }

    // Agregar nueva pausa
    const now = new Date().toISOString();
    shift.pauses.push({
      startTime: now,
      endTime: null
    });
    shift.status = 'paused';
    shift.updatedAt = now;

    this.saveShifts();

    console.log('WorkShiftAdapter: Shift paused:', shift.id);

    // Emitir evento
    window.dispatchEvent(new CustomEvent('shift-paused', {
      detail: { shift }
    }));

    return shift;
  }

  /**
   * Reanudar jornada
   * @param {string} shiftId - ID de la jornada
   * @returns {Object} Jornada reanudada
   */
  async resumeShift(shiftId) {
    const shift = await this.getShiftById(shiftId);
    if (!shift) {
      throw new Error(ERROR_MESSAGES.SHIFT_NOT_FOUND);
    }

    if (shift.status !== 'paused') {
      throw new Error(ERROR_MESSAGES.SHIFT_NOT_PAUSED);
    }

    // Completar última pausa
    const now = new Date().toISOString();
    if (shift.pauses && shift.pauses.length > 0) {
      const lastPause = shift.pauses[shift.pauses.length - 1];
      if (!lastPause.endTime) {
        lastPause.endTime = now;
      }
    }

    shift.status = 'active';
    shift.updatedAt = now;

    this.saveShifts();

    console.log('WorkShiftAdapter: Shift resumed:', shift.id);

    // Emitir evento
    window.dispatchEvent(new CustomEvent('shift-resumed', {
      detail: { shift }
    }));

    return shift;
  }

  /**
   * Obtener jornada activa del usuario actual
   * @returns {Object|null} Jornada activa o null
   */
  async getActiveShift() {
    const currentUser = await this.authAdapter.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    return this.shifts.find(shift => 
      shift.userId === currentUser.id && 
      (shift.status === 'active' || shift.status === 'paused')
    ) || null;
  }

  /**
   * Obtener jornada por ID
   * @param {string} shiftId - ID de la jornada
   * @returns {Object|null} Jornada o null
   */
  async getShiftById(shiftId) {
    return this.shifts.find(shift => shift.id === shiftId) || null;
  }

  /**
   * Obtener historial de jornadas con filtros
   * @param {Object} filters - Filtros opcionales
   * @returns {Array} Lista de jornadas
   */
  async getShiftHistory(filters = {}) {
    const currentUser = await this.authAdapter.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    let filtered = [...this.shifts];

    // Filtrar por rol
    if (currentUser.rol === 'TAXISTA') {
      // TAXISTA solo ve sus propias jornadas
      filtered = filtered.filter(shift => shift.userId === currentUser.id);
    } else if (currentUser.rol === 'PATRON') {
      // PATRON ve jornadas de sus taxistas asociados + propias
      const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const associatedTaxistas = allUsers.filter(u => u.patronId === currentUser.id);
      const allowedUserIds = [currentUser.id, ...associatedTaxistas.map(t => t.id)];
      filtered = filtered.filter(shift => allowedUserIds.includes(shift.userId));
    }

    // Filtrar por estado
    if (filters.status) {
      filtered = filtered.filter(shift => shift.status === filters.status);
    } else {
      // Por defecto, solo mostrar completadas en historial
      filtered = filtered.filter(shift => shift.status === 'completed');
    }

    // Filtrar por rango de fechas
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(shift => new Date(shift.startTime) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(shift => new Date(shift.startTime) <= endDate);
    }

    // Filtrar por IDs de usuario específicos (para PATRON)
    if (filters.userIds && filters.userIds.length > 0) {
      filtered = filtered.filter(shift => filters.userIds.includes(shift.userId));
    }

    // Ordenar por fecha descendente (más reciente primero)
    filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return filtered;
  }

  /**
   * Calcular horas efectivas de una jornada
   * @param {Object} shift - Jornada
   * @returns {number} Horas efectivas en milisegundos
   */
  calculateEffectiveHours(shift) {
    if (!shift.startTime) {
      return 0;
    }

    const start = new Date(shift.startTime);
    const end = shift.endTime ? new Date(shift.endTime) : new Date();
    const totalDuration = end - start;

    const pauseTime = this.calculateTotalPauseTime(shift);

    return Math.max(0, totalDuration - pauseTime);
  }

  /**
   * Calcular tiempo total de pausas
   * @param {Object} shift - Jornada
   * @returns {number} Tiempo de pausas en milisegundos
   */
  calculateTotalPauseTime(shift) {
    if (!shift.pauses || shift.pauses.length === 0) {
      return 0;
    }

    return shift.pauses.reduce((total, pause) => {
      if (pause.startTime && pause.endTime) {
        const pauseStart = new Date(pause.startTime);
        const pauseEnd = new Date(pause.endTime);
        return total + (pauseEnd - pauseStart);
      }
      return total;
    }, 0);
  }

  /**
   * Vincular servicio a jornada activa
   * @param {string} serviceId - ID del servicio
   */
  async linkServiceToActiveShift(serviceId) {
    const activeShift = await this.getActiveShift();
    if (!activeShift) {
      return; // No hay jornada activa, no vincular
    }

    // Actualizar servicio con shiftId
    const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
    const service = services.find(s => s.id === serviceId);
    if (service) {
      service.shiftId = activeShift.id;
      localStorage.setItem('taxi_services', JSON.stringify(services));
      console.log('WorkShiftAdapter: Service linked to shift:', serviceId, activeShift.id);
    }
  }

  /**
   * Obtener servicios de una jornada
   * @param {string} shiftId - ID de la jornada
   * @returns {Array} Lista de servicios
   */
  async getShiftServices(shiftId) {
    const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
    return services.filter(service => service.shiftId === shiftId);
  }

  /**
   * Validar integridad de jornada
   * @param {Object} shift - Jornada
   * @returns {Object} Resultado de validación
   */
  validateShiftIntegrity(shift) {
    const errors = [];

    // Validar campos requeridos
    if (!shift.id) errors.push('ID requerido');
    if (!shift.userId) errors.push('userId requerido');
    if (!shift.startTime) errors.push('startTime requerido');
    if (!shift.status) errors.push('status requerido');
    if (!Array.isArray(shift.pauses)) errors.push('pauses debe ser un array');

    // Validar timestamps
    if (shift.startTime && isNaN(new Date(shift.startTime).getTime())) {
      errors.push('startTime inválido');
    }

    if (shift.endTime && isNaN(new Date(shift.endTime).getTime())) {
      errors.push('endTime inválido');
    }

    // Validar orden cronológico
    if (shift.startTime && shift.endTime) {
      if (new Date(shift.endTime) <= new Date(shift.startTime)) {
        errors.push('endTime debe ser posterior a startTime');
      }
    }

    // Validar pausas
    if (shift.pauses) {
      shift.pauses.forEach((pause, index) => {
        if (!pause.startTime) {
          errors.push(`Pausa ${index + 1}: startTime requerido`);
        }
        if (pause.startTime && pause.endTime) {
          if (new Date(pause.endTime) <= new Date(pause.startTime)) {
            errors.push(`Pausa ${index + 1}: endTime debe ser posterior a startTime`);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatear duración en formato legible
   * @param {number} milliseconds - Duración en milisegundos
   * @returns {string} Duración formateada
   */
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Formatear fecha y hora
   * @param {string} isoString - Fecha en formato ISO
   * @returns {string} Fecha formateada
   */
  formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatear solo hora
   * @param {string} isoString - Fecha en formato ISO
   * @returns {string} Hora formateada
   */
  formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.WorkShiftAdapter = WorkShiftAdapter;
}
