/**
 * SecurityMonitoringView Component
 * Dashboard for monitoring security events and system status
 * 
 * Features:
 * - Session status monitoring
 * - Error statistics
 * - Security event log
 * - Rate limiting status
 * - System health indicators
 */

class SecurityMonitoringView {
  constructor() {
    this.container = null;
    this.refreshInterval = null;
    this.autoRefresh = true;
    this.refreshRate = 5000; // 5 seconds
  }

  /**
   * Render the security monitoring dashboard
   * @param {HTMLElement} container - Container element
   */
  async render(container) {
    this.container = container || document.getElementById('security-monitoring-content');
    
    if (!this.container) {
      console.error('Security monitoring container not found');
      return;
    }

    // Check if user has permission to view
    const user = window.authAdapter?.getCurrentUser();
    if (!user || user.rol !== 'PATRON') {
      this.renderNoAccess();
      return;
    }

    // Render dashboard
    this.renderDashboard();

    // Start auto-refresh if enabled
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  /**
   * Render no access message
   * @private
   */
  renderNoAccess() {
    const html = `
      <div style="text-align: center; padding: 40px;">
        <ion-icon name="lock-closed" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
        <h2>Acceso Restringido</h2>
        <p style="color: var(--ion-color-medium);">
          Solo los patrones pueden acceder al panel de monitoreo de seguridad.
        </p>
      </div>
    `;
    
    window.sanitizer.setInnerHTML(this.container, html);
  }

  /**
   * Render the dashboard
   * @private
   */
  renderDashboard() {
    const sessionStatus = this.getSessionStatus();
    const errorStats = this.getErrorStatistics();
    const rateLimitStatus = this.getRateLimitStatus();
    const systemHealth = this.getSystemHealth();

    const html = `
      <div class="security-monitoring-dashboard">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">🔒 Monitoreo de Seguridad</h2>
          <ion-button id="refresh-monitoring-btn" size="small">
            <ion-icon name="refresh" slot="start"></ion-icon>
            Actualizar
          </ion-button>
        </div>

        <!-- System Health Overview -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Estado del Sistema</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col size="6" size-md="3">
                  <div class="health-indicator ${systemHealth.session}">
                    <div class="health-icon">🔐</div>
                    <div class="health-label">Sesión</div>
                    <div class="health-status">${this.getStatusText(systemHealth.session)}</div>
                  </div>
                </ion-col>
                <ion-col size="6" size-md="3">
                  <div class="health-indicator ${systemHealth.errors}">
                    <div class="health-icon">⚠️</div>
                    <div class="health-label">Errores</div>
                    <div class="health-status">${this.getStatusText(systemHealth.errors)}</div>
                  </div>
                </ion-col>
                <ion-col size="6" size-md="3">
                  <div class="health-indicator ${systemHealth.rateLimit}">
                    <div class="health-icon">🛡️</div>
                    <div class="health-label">Rate Limit</div>
                    <div class="health-status">${this.getStatusText(systemHealth.rateLimit)}</div>
                  </div>
                </ion-col>
                <ion-col size="6" size-md="3">
                  <div class="health-indicator ${systemHealth.storage}">
                    <div class="health-icon">💾</div>
                    <div class="health-label">Almacenamiento</div>
                    <div class="health-status">${this.getStatusText(systemHealth.storage)}</div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Session Status -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Estado de Sesión</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label>
                  <h3>Estado</h3>
                  <p>${sessionStatus.active ? '✅ Activa' : '❌ Inactiva'}</p>
                </ion-label>
              </ion-item>
              ${sessionStatus.active ? `
                <ion-item>
                  <ion-label>
                    <h3>Tiempo Restante</h3>
                    <p>${sessionStatus.remainingMinutes} minutos</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h3>Última Actividad</h3>
                    <p>${sessionStatus.lastActivity || 'N/A'}</p>
                  </ion-label>
                </ion-item>
              ` : ''}
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Error Statistics -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Estadísticas de Errores</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div style="margin-bottom: 16px;">
              <strong>Total de Errores:</strong> ${errorStats.total}
            </div>
            <ion-list>
              ${Object.entries(errorStats.byCategory).map(([category, count]) => `
                <ion-item>
                  <ion-label>
                    <h3>${this.getCategoryName(category)}</h3>
                    <p>${count} error${count !== 1 ? 'es' : ''}</p>
                  </ion-label>
                </ion-item>
              `).join('')}
            </ion-list>
            ${errorStats.lastError ? `
              <div style="margin-top: 16px; padding: 12px; background: var(--ion-color-light); border-radius: 8px;">
                <strong>Último Error:</strong><br>
                <small>${errorStats.lastError.category} - ${errorStats.lastError.timestamp}</small><br>
                <small>${errorStats.lastError.message}</small>
              </div>
            ` : ''}
          </ion-card-content>
        </ion-card>

        <!-- Rate Limiting Status -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Estado de Rate Limiting</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label>
                  <h3>Límite de Intentos</h3>
                  <p>5 intentos por hora</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Tiempo de Bloqueo</h3>
                  <p>15 minutos</p>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <h3>Estado</h3>
                  <p>${rateLimitStatus.active ? '✅ Activo' : '⚠️ Inactivo'}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Security Services Status -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Servicios de Seguridad</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              ${this.renderServiceStatus('PasswordService', window.passwordService)}
              ${this.renderServiceStatus('TokenService', window.tokenService)}
              ${this.renderServiceStatus('CSRFService', window.csrfService)}
              ${this.renderServiceStatus('RateLimitService', window.rateLimitService)}
              ${this.renderServiceStatus('SessionService', window.sessionService)}
              ${this.renderServiceStatus('SecureStorageService', window.secureStorageService)}
              ${this.renderServiceStatus('ValidationSchemas', window.validationSchemas)}
              ${this.renderServiceStatus('ErrorHandlerService', window.errorHandlerService)}
              ${this.renderServiceStatus('Logger', window.logger)}
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Actions -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Acciones</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" id="clear-error-history-btn">
              <ion-icon name="trash" slot="start"></ion-icon>
              Limpiar Historial de Errores
            </ion-button>
            <ion-button expand="block" id="reset-rate-limits-btn" color="warning">
              <ion-icon name="refresh" slot="start"></ion-icon>
              Resetear Rate Limits
            </ion-button>
            <ion-button expand="block" id="export-logs-btn" color="secondary">
              <ion-icon name="download" slot="start"></ion-icon>
              Exportar Logs
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    `;

    window.sanitizer.setInnerHTML(this.container, html);

    // Attach event listeners
    this.attachEventListeners();

    // Add custom styles
    this.addStyles();
  }

  /**
   * Render service status
   * @private
   */
  renderServiceStatus(name, service) {
    const available = !!service;
    return `
      <ion-item>
        <ion-icon name="${available ? 'checkmark-circle' : 'close-circle'}" 
                  slot="start" 
                  color="${available ? 'success' : 'danger'}"></ion-icon>
        <ion-label>
          <h3>${name}</h3>
          <p>${available ? 'Disponible' : 'No disponible'}</p>
        </ion-label>
      </ion-item>
    `;
  }

  /**
   * Get session status
   * @private
   */
  getSessionStatus() {
    if (window.sessionService) {
      return window.sessionService.getStatus();
    }
    return { active: false, remainingTime: 0, remainingMinutes: 0 };
  }

  /**
   * Get error statistics
   * @private
   */
  getErrorStatistics() {
    if (window.errorHandlerService) {
      return window.errorHandlerService.getStatistics();
    }
    return { total: 0, byCategory: {}, lastError: null };
  }

  /**
   * Get rate limit status
   * @private
   */
  getRateLimitStatus() {
    return {
      active: !!window.rateLimitService
    };
  }

  /**
   * Get system health
   * @private
   */
  getSystemHealth() {
    const sessionActive = window.sessionService?.isActive();
    const errorCount = window.errorHandlerService?.getStatistics().total || 0;
    const rateLimitActive = !!window.rateLimitService;
    const storageAvailable = !!window.secureStorageService;

    return {
      session: sessionActive ? 'healthy' : 'warning',
      errors: errorCount === 0 ? 'healthy' : errorCount < 10 ? 'warning' : 'critical',
      rateLimit: rateLimitActive ? 'healthy' : 'warning',
      storage: storageAvailable ? 'healthy' : 'critical'
    };
  }

  /**
   * Get status text
   * @private
   */
  getStatusText(status) {
    const texts = {
      healthy: 'Saludable',
      warning: 'Advertencia',
      critical: 'Crítico'
    };
    return texts[status] || 'Desconocido';
  }

  /**
   * Get category name
   * @private
   */
  getCategoryName(category) {
    const names = {
      authentication: 'Autenticación',
      authorization: 'Autorización',
      validation: 'Validación',
      network: 'Red',
      database: 'Base de Datos',
      unknown: 'Desconocido'
    };
    return names[category] || category;
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    // Refresh button
    document.getElementById('refresh-monitoring-btn')?.addEventListener('click', () => {
      this.render();
      window.ToastManager.showSuccess('Dashboard actualizado');
    });

    // Clear error history
    document.getElementById('clear-error-history-btn')?.addEventListener('click', () => {
      if (window.errorHandlerService) {
        window.errorHandlerService.resetStatistics();
        this.render();
        window.ToastManager.showSuccess('Historial de errores limpiado');
      }
    });

    // Reset rate limits
    document.getElementById('reset-rate-limits-btn')?.addEventListener('click', async () => {
      const confirmed = await window.ActionSheetManager.showConfirmation(
        'Resetear Rate Limits',
        '¿Estás seguro? Esto desbloqueará todas las cuentas bloqueadas.',
        () => {
          if (window.rateLimitService) {
            window.rateLimitService.resetAll();
            this.render();
            window.ToastManager.showSuccess('Rate limits reseteados');
          }
        }
      );
    });

    // Export logs
    document.getElementById('export-logs-btn')?.addEventListener('click', () => {
      this.exportLogs();
    });
  }

  /**
   * Export logs to JSON file
   * @private
   */
  exportLogs() {
    const logs = {
      timestamp: new Date().toISOString(),
      session: this.getSessionStatus(),
      errors: this.getErrorStatistics(),
      rateLimit: this.getRateLimitStatus(),
      systemHealth: this.getSystemHealth(),
      errorHistory: window.logger?.getErrorHistory() || []
    };

    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    window.ToastManager.showSuccess('Logs exportados');
  }

  /**
   * Start auto-refresh
   * @private
   */
  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      if (this.container && this.container.isConnected) {
        this.render();
      } else {
        this.stopAutoRefresh();
      }
    }, this.refreshRate);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Add custom styles
   * @private
   */
  addStyles() {
    if (document.getElementById('security-monitoring-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'security-monitoring-styles';
    style.textContent = `
      .health-indicator {
        text-align: center;
        padding: 16px;
        border-radius: 8px;
        background: var(--ion-color-light);
      }
      
      .health-indicator.healthy {
        background: var(--ion-color-success-tint);
        color: var(--ion-color-success-shade);
      }
      
      .health-indicator.warning {
        background: var(--ion-color-warning-tint);
        color: var(--ion-color-warning-shade);
      }
      
      .health-indicator.critical {
        background: var(--ion-color-danger-tint);
        color: var(--ion-color-danger-shade);
      }
      
      .health-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      
      .health-label {
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      
      .health-status {
        font-size: 14px;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Destroy the view
   */
  destroy() {
    this.stopAutoRefresh();
    this.container = null;
  }
}

// Export for use in other modules
window.SecurityMonitoringView = SecurityMonitoringView;

console.log('SecurityMonitoringView component loaded');

