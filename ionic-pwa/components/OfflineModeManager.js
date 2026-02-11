/**
 * OfflineModeManager Component
 * Advanced offline mode management with conflict resolution
 */

class OfflineModeManager {
  constructor() {
    this.isOffline = !navigator.onLine;
    this.offlineQueue = [];
    this.conflictQueue = [];
    this.QUEUE_KEY = 'taxi_offline_queue';
    this.CONFLICT_KEY = 'taxi_conflict_queue';
    this.lastSyncTime = null;
    
    // Setup listeners
    this.setupConnectionListeners();
    this.loadQueues();
  }

  /**
   * Setup connection listeners
   */
  setupConnectionListeners() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Check connection periodically
    setInterval(() => {
      this.checkConnection();
    }, 30000); // Every 30 seconds
  }

  /**
   * Handle online event
   */
  async handleOnline() {
    this.isOffline = false;
    console.log('[Offline Manager] Connection restored');
    
    // Show notification
    this.showNotification('Conexión restaurada', 'Sincronizando datos pendientes...', 'success');
    
    // Auto-sync if enabled
    const autoSync = localStorage.getItem('taxi_auto_sync') !== 'false';
    if (autoSync && this.offlineQueue.length > 0) {
      await this.processOfflineQueue();
    }

    // Update UI
    this.updateConnectionStatus();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOffline = true;
    console.log('[Offline Manager] Connection lost');
    
    // Show notification
    this.showNotification('Sin conexión', 'Trabajando en modo offline', 'warning');
    
    // Update UI
    this.updateConnectionStatus();
  }

  /**
   * Check connection status
   */
  async checkConnection() {
    const wasOffline = this.isOffline;
    this.isOffline = !navigator.onLine;

    // If status changed
    if (wasOffline && !this.isOffline) {
      await this.handleOnline();
    } else if (!wasOffline && this.isOffline) {
      this.handleOffline();
    }
  }

  /**
   * Show offline mode modal
   */
  async show() {
    const modal = await this.createModal();
    await modal.present();
  }

  /**
   * Create offline mode modal
   */
  async createModal() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>📡 Modo Offline</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <!-- Connection Status -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Estado de Conexión</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: ${this.isOffline ? 'var(--ion-color-danger-tint)' : 'var(--ion-color-success-tint)'}; display: flex; align-items: center; justify-content: center;">
                <ion-icon 
                  name="${this.isOffline ? 'cloud-offline' : 'cloud-done'}" 
                  style="font-size: 32px; color: ${this.isOffline ? 'var(--ion-color-danger)' : 'var(--ion-color-success)'};">
                </ion-icon>
              </div>
              <div style="flex: 1;">
                <h2 style="margin: 0; color: ${this.isOffline ? 'var(--ion-color-danger)' : 'var(--ion-color-success)'};">
                  ${this.isOffline ? 'Sin conexión' : 'Conectado'}
                </h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--ion-color-medium);">
                  ${this.isOffline ? 'Modo offline activado' : 'Sincronización disponible'}
                </p>
                ${this.lastSyncTime ? `
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: var(--ion-color-medium);">
                    Última sync: ${new Date(this.lastSyncTime).toLocaleString('es-ES')}
                  </p>
                ` : ''}
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Offline Queue -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              Cola de Operaciones
              ${this.offlineQueue.length > 0 ? `<ion-badge color="warning" style="margin-left: 8px;">${this.offlineQueue.length}</ion-badge>` : ''}
            </ion-card-title>
          </ion-card-header>
          <ion-card-content id="offline-queue-content">
            ${this.renderOfflineQueue()}
          </ion-card-content>
        </ion-card>

        <!-- Conflicts -->
        ${this.conflictQueue.length > 0 ? `
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                Conflictos Detectados
                <ion-badge color="danger" style="margin-left: 8px;">${this.conflictQueue.length}</ion-badge>
              </ion-card-title>
            </ion-card-header>
            <ion-card-content id="conflicts-content">
              ${this.renderConflicts()}
            </ion-card-content>
          </ion-card>
        ` : ''}

        <!-- Actions -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Acciones</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button 
              expand="block" 
              id="process-queue-btn"
              ${this.isOffline || this.offlineQueue.length === 0 ? 'disabled' : ''}>
              <ion-icon name="sync" slot="start"></ion-icon>
              Procesar Cola (${this.offlineQueue.length})
            </ion-button>
            
            <ion-button 
              expand="block" 
              fill="outline"
              id="resolve-conflicts-btn"
              ${this.conflictQueue.length === 0 ? 'disabled' : ''}
              style="margin-top: 8px;">
              <ion-icon name="git-merge" slot="start"></ion-icon>
              Resolver Conflictos (${this.conflictQueue.length})
            </ion-button>

            <ion-button 
              expand="block" 
              fill="outline" 
              color="danger"
              id="clear-queue-btn"
              ${this.offlineQueue.length === 0 ? 'disabled' : ''}
              style="margin-top: 8px;">
              <ion-icon name="trash" slot="start"></ion-icon>
              Limpiar Cola
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Settings -->
        <ion-list>
          <ion-list-header>
            <ion-label>Configuración Offline</ion-label>
          </ion-list-header>
          
          <ion-item>
            <ion-label>
              <h3>Modo Offline Forzado</h3>
              <p>Trabajar offline aunque haya conexión</p>
            </ion-label>
            <ion-toggle id="force-offline-toggle"></ion-toggle>
          </ion-item>

          <ion-item lines="none">
            <ion-label>
              <h3>Resolución Automática</h3>
              <p>Resolver conflictos automáticamente</p>
            </ion-label>
            <ion-toggle id="auto-resolve-toggle"></ion-toggle>
          </ion-item>
        </ion-list>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();

    // Attach event listeners
    this.attachModalEventListeners(modal);

    return modal;
  }

  /**
   * Render offline queue
   */
  renderOfflineQueue() {
    if (this.offlineQueue.length === 0) {
      return `
        <div style="text-align: center; padding: 20px; color: var(--ion-color-medium);">
          <ion-icon name="checkmark-circle" style="font-size: 48px;"></ion-icon>
          <p style="margin-top: 8px;">No hay operaciones pendientes</p>
        </div>
      `;
    }

    return `
      <ion-list>
        ${this.offlineQueue.map((item, index) => `
          <ion-item>
            <ion-icon name="${this.getOperationIcon(item.operation)}" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>${this.getOperationLabel(item.operation)}</h3>
              <p>${new Date(item.timestamp).toLocaleString('es-ES')}</p>
            </ion-label>
            <ion-badge slot="end" color="warning">Pendiente</ion-badge>
          </ion-item>
        `).join('')}
      </ion-list>
    `;
  }

  /**
   * Render conflicts
   */
  renderConflicts() {
    return `
      <ion-list>
        ${this.conflictQueue.map((conflict, index) => `
          <ion-item button onclick="window.offlineModeManager.resolveConflict(${index})">
            <ion-icon name="warning" slot="start" color="danger"></ion-icon>
            <ion-label>
              <h3>Conflicto en ${conflict.type}</h3>
              <p>Local: ${new Date(conflict.localTimestamp).toLocaleString('es-ES')}</p>
              <p>Servidor: ${new Date(conflict.serverTimestamp).toLocaleString('es-ES')}</p>
            </ion-label>
            <ion-icon name="chevron-forward" slot="end"></ion-icon>
          </ion-item>
        `).join('')}
      </ion-list>
    `;
  }

  /**
   * Get operation icon
   */
  getOperationIcon(operation) {
    const icons = {
      'create': 'add-circle',
      'update': 'create',
      'delete': 'trash'
    };
    return icons[operation] || 'document';
  }

  /**
   * Get operation label
   */
  getOperationLabel(operation) {
    const labels = {
      'create': 'Crear registro',
      'update': 'Actualizar registro',
      'delete': 'Eliminar registro'
    };
    return labels[operation] || 'Operación';
  }

  /**
   * Attach modal event listeners
   */
  attachModalEventListeners(modal) {
    // Process queue button
    modal.querySelector('#process-queue-btn')?.addEventListener('click', async () => {
      await this.processOfflineQueue();
      // Refresh modal
      modal.dismiss();
      await this.show();
    });

    // Resolve conflicts button
    modal.querySelector('#resolve-conflicts-btn')?.addEventListener('click', async () => {
      await this.resolveAllConflicts();
      // Refresh modal
      modal.dismiss();
      await this.show();
    });

    // Clear queue button
    modal.querySelector('#clear-queue-btn')?.addEventListener('click', async () => {
      await this.clearOfflineQueue();
      // Refresh modal
      modal.dismiss();
      await this.show();
    });

    // Force offline toggle
    modal.querySelector('#force-offline-toggle')?.addEventListener('ionChange', (e) => {
      localStorage.setItem('taxi_force_offline', e.detail.checked ? 'true' : 'false');
      this.isOffline = e.detail.checked || !navigator.onLine;
      this.updateConnectionStatus();
    });

    // Auto-resolve toggle
    modal.querySelector('#auto-resolve-toggle')?.addEventListener('ionChange', (e) => {
      localStorage.setItem('taxi_auto_resolve', e.detail.checked ? 'true' : 'false');
    });
  }

  /**
   * Add operation to offline queue
   */
  addToQueue(operation, data) {
    const item = {
      id: Date.now() + Math.random(),
      operation,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    this.offlineQueue.push(item);
    this.saveQueues();

    console.log('[Offline Manager] Added to queue:', item);
    return item.id;
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue() {
    if (this.isOffline) {
      ToastManager.showError('No hay conexión a internet');
      return;
    }

    if (this.offlineQueue.length === 0) {
      ToastManager.showInfo('No hay operaciones pendientes');
      return;
    }

    await LoadingManager.show('Procesando cola...');

    let processed = 0;
    let failed = 0;

    for (let i = this.offlineQueue.length - 1; i >= 0; i--) {
      const item = this.offlineQueue[i];

      try {
        // Simulate processing (in real app, make API calls)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Remove from queue on success
        this.offlineQueue.splice(i, 1);
        processed++;
      } catch (error) {
        console.error('[Offline Manager] Error processing item:', error);
        item.retries++;
        failed++;

        // Remove if too many retries
        if (item.retries >= 3) {
          this.offlineQueue.splice(i, 1);
        }
      }
    }

    this.lastSyncTime = new Date().toISOString();
    this.saveQueues();
    await LoadingManager.hide();

    if (failed === 0) {
      ToastManager.showSuccess(`${processed} operación(es) procesada(s)`);
    } else {
      ToastManager.showWarning(`${processed} procesadas, ${failed} fallidas`);
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('offline-queue-processed', {
      detail: { processed, failed }
    }));
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(index) {
    const conflict = this.conflictQueue[index];
    if (!conflict) return;

    const alert = document.createElement('ion-alert');
    alert.header = 'Resolver Conflicto';
    alert.message = '¿Qué versión deseas mantener?';
    alert.buttons = [
      {
        text: 'Versión Local',
        handler: () => {
          this.conflictQueue.splice(index, 1);
          this.saveQueues();
          ToastManager.showSuccess('Conflicto resuelto - Versión local');
        }
      },
      {
        text: 'Versión Servidor',
        handler: () => {
          this.conflictQueue.splice(index, 1);
          this.saveQueues();
          ToastManager.showSuccess('Conflicto resuelto - Versión servidor');
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ];

    document.body.appendChild(alert);
    await alert.present();
  }

  /**
   * Resolve all conflicts
   */
  async resolveAllConflicts() {
    const autoResolve = localStorage.getItem('taxi_auto_resolve') === 'true';

    if (autoResolve) {
      // Auto-resolve: keep local version
      this.conflictQueue = [];
      this.saveQueues();
      ToastManager.showSuccess('Conflictos resueltos automáticamente');
    } else {
      ToastManager.showInfo('Resuelve cada conflicto individualmente');
    }
  }

  /**
   * Clear offline queue
   */
  async clearOfflineQueue() {
    await ActionSheetManager.showConfirmation(
      'Limpiar Cola',
      '¿Estás seguro? Se perderán todas las operaciones pendientes.',
      () => {
        this.offlineQueue = [];
        this.saveQueues();
        ToastManager.showSuccess('Cola limpiada');
      }
    );
  }

  /**
   * Load queues from storage
   */
  loadQueues() {
    try {
      const offlineData = localStorage.getItem(this.QUEUE_KEY);
      const conflictData = localStorage.getItem(this.CONFLICT_KEY);

      if (offlineData) {
        this.offlineQueue = JSON.parse(offlineData);
      }

      if (conflictData) {
        this.conflictQueue = JSON.parse(conflictData);
      }
    } catch (error) {
      console.error('[Offline Manager] Error loading queues:', error);
    }
  }

  /**
   * Save queues to storage
   */
  saveQueues() {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.offlineQueue));
      localStorage.setItem(this.CONFLICT_KEY, JSON.stringify(this.conflictQueue));
    } catch (error) {
      console.error('[Offline Manager] Error saving queues:', error);
    }
  }

  /**
   * Update connection status in UI
   */
  updateConnectionStatus() {
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('connection-status-changed', {
      detail: { isOffline: this.isOffline }
    }));
  }

  /**
   * Show notification
   */
  showNotification(title, message, type = 'info') {
    const notificationsEnabled = localStorage.getItem('taxi_offline_notifications') !== 'false';
    
    if (notificationsEnabled) {
      if (type === 'success') {
        ToastManager.showSuccess(`${title}: ${message}`);
      } else if (type === 'warning') {
        ToastManager.showWarning(`${title}: ${message}`);
      } else {
        ToastManager.showInfo(`${title}: ${message}`);
      }
    }
  }

  /**
   * Get queue length
   */
  getQueueLength() {
    return this.offlineQueue.length;
  }

  /**
   * Get conflicts count
   */
  getConflictsCount() {
    return this.conflictQueue.length;
  }

  /**
   * Check if offline
   */
  isOfflineMode() {
    return this.isOffline;
  }
}

// Create global instance
window.offlineModeManager = new OfflineModeManager();

console.log('OfflineModeManager component loaded');
