/**
 * DataSyncView Component
 * Manages data synchronization and offline operations
 */

class DataSyncView {
  constructor() {
    this.pendingOperations = [];
    this.syncInProgress = false;
    this.isOnline = navigator.onLine;
    this.STORAGE_KEY = 'taxi_pending_operations';
    
    // Listen for online/offline events
    this.setupConnectionListeners();
    
    // Load pending operations
    this.loadPendingOperations();
  }

  /**
   * Setup connection listeners
   */
  setupConnectionListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      ToastManager.showSuccess('Conexión restaurada');
      this.autoSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      ToastManager.showWarning('Sin conexión - Modo offline activado');
    });
  }

  /**
   * Show data sync modal
   */
  async show() {
    const modal = await this.createModal();
    await modal.present();
  }

  /**
   * Create sync modal
   */
  async createModal() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>🔄 Sincronización de Datos</ion-title>
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
              <ion-icon 
                name="${this.isOnline ? 'cloud-done' : 'cloud-offline'}" 
                style="font-size: 48px; color: ${this.isOnline ? 'var(--ion-color-success)' : 'var(--ion-color-danger)'};">
              </ion-icon>
              <div>
                <h2 style="margin: 0; color: ${this.isOnline ? 'var(--ion-color-success)' : 'var(--ion-color-danger)'};">
                  ${this.isOnline ? 'En línea' : 'Sin conexión'}
                </h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--ion-color-medium);">
                  ${this.isOnline ? 'Conectado a internet' : 'Trabajando en modo offline'}
                </p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Pending Operations -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              Operaciones Pendientes
              ${this.pendingOperations.length > 0 ? `<ion-badge color="warning" style="margin-left: 8px;">${this.pendingOperations.length}</ion-badge>` : ''}
            </ion-card-title>
          </ion-card-header>
          <ion-card-content id="pending-operations-content">
            ${this.renderPendingOperations()}
          </ion-card-content>
        </ion-card>

        <!-- Sync Actions -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Acciones</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button 
              expand="block" 
              id="manual-sync-btn"
              ${!this.isOnline || this.pendingOperations.length === 0 ? 'disabled' : ''}>
              <ion-icon name="sync" slot="start"></ion-icon>
              Sincronizar Ahora
            </ion-button>
            
            <ion-button 
              expand="block" 
              fill="outline" 
              color="danger"
              id="clear-pending-btn"
              ${this.pendingOperations.length === 0 ? 'disabled' : ''}
              style="margin-top: 8px;">
              <ion-icon name="trash" slot="start"></ion-icon>
              Limpiar Cola
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Sync Settings -->
        <ion-list>
          <ion-list-header>
            <ion-label>Configuración</ion-label>
          </ion-list-header>
          
          <ion-item>
            <ion-label>
              <h3>Sincronización Automática</h3>
              <p>Sincronizar al recuperar conexión</p>
            </ion-label>
            <ion-toggle id="auto-sync-toggle" checked></ion-toggle>
          </ion-item>

          <ion-item lines="none">
            <ion-label>
              <h3>Notificaciones de Sync</h3>
              <p>Avisar cuando se sincronicen datos</p>
            </ion-label>
            <ion-toggle id="sync-notifications-toggle" checked></ion-toggle>
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
   * Render pending operations
   */
  renderPendingOperations() {
    if (this.pendingOperations.length === 0) {
      return `
        <div style="text-align: center; padding: 20px; color: var(--ion-color-medium);">
          <ion-icon name="checkmark-circle" style="font-size: 48px;"></ion-icon>
          <p style="margin-top: 8px;">No hay operaciones pendientes</p>
        </div>
      `;
    }

    return `
      <ion-list>
        ${this.pendingOperations.map((op, index) => `
          <ion-item>
            <ion-icon name="${this.getOperationIcon(op.type)}" slot="start" color="${this.getOperationColor(op.type)}"></ion-icon>
            <ion-label>
              <h3>${this.getOperationLabel(op.type)}</h3>
              <p>${new Date(op.timestamp).toLocaleString('es-ES')}</p>
              ${op.error ? `<p style="color: var(--ion-color-danger); font-size: 11px;">Error: ${op.error}</p>` : ''}
            </ion-label>
            <ion-badge slot="end" color="${op.status === 'pending' ? 'warning' : 'danger'}">
              ${op.status === 'pending' ? 'Pendiente' : 'Error'}
            </ion-badge>
          </ion-item>
        `).join('')}
      </ion-list>
    `;
  }

  /**
   * Get operation icon
   */
  getOperationIcon(type) {
    const icons = {
      'create_service': 'add-circle',
      'update_service': 'create',
      'delete_service': 'trash',
      'create_expense': 'wallet',
      'update_expense': 'create',
      'delete_expense': 'trash',
      'create_reconciliation': 'calculator'
    };
    return icons[type] || 'document';
  }

  /**
   * Get operation color
   */
  getOperationColor(type) {
    if (type.includes('create')) return 'success';
    if (type.includes('update')) return 'primary';
    if (type.includes('delete')) return 'danger';
    return 'medium';
  }

  /**
   * Get operation label
   */
  getOperationLabel(type) {
    const labels = {
      'create_service': 'Crear servicio',
      'update_service': 'Actualizar servicio',
      'delete_service': 'Eliminar servicio',
      'create_expense': 'Crear gasto',
      'update_expense': 'Actualizar gasto',
      'delete_expense': 'Eliminar gasto',
      'create_reconciliation': 'Crear conciliación'
    };
    return labels[type] || 'Operación';
  }

  /**
   * Attach modal event listeners
   */
  attachModalEventListeners(modal) {
    // Manual sync button
    modal.querySelector('#manual-sync-btn')?.addEventListener('click', async () => {
      await this.manualSync();
      // Refresh modal content
      const content = modal.querySelector('#pending-operations-content');
      if (content) {
        content.innerHTML = this.renderPendingOperations();
      }
    });

    // Clear pending button
    modal.querySelector('#clear-pending-btn')?.addEventListener('click', async () => {
      await this.clearPendingOperations();
      // Refresh modal content
      const content = modal.querySelector('#pending-operations-content');
      if (content) {
        content.innerHTML = this.renderPendingOperations();
      }
    });

    // Auto-sync toggle
    modal.querySelector('#auto-sync-toggle')?.addEventListener('ionChange', (e) => {
      localStorage.setItem('taxi_auto_sync', e.detail.checked ? 'true' : 'false');
    });

    // Sync notifications toggle
    modal.querySelector('#sync-notifications-toggle')?.addEventListener('ionChange', (e) => {
      localStorage.setItem('taxi_sync_notifications', e.detail.checked ? 'true' : 'false');
    });
  }

  /**
   * Load pending operations from storage
   */
  loadPendingOperations() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
      this.pendingOperations = [];
    }
  }

  /**
   * Save pending operations to storage
   */
  savePendingOperations() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }

  /**
   * Add operation to queue
   */
  addOperation(type, data) {
    const operation = {
      id: Date.now() + Math.random(),
      type,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retries: 0
    };

    this.pendingOperations.push(operation);
    this.savePendingOperations();

    // Try to sync if online
    if (this.isOnline) {
      this.autoSync();
    }

    return operation.id;
  }

  /**
   * Auto sync when online
   */
  async autoSync() {
    const autoSyncEnabled = localStorage.getItem('taxi_auto_sync') !== 'false';
    
    if (!autoSyncEnabled || !this.isOnline || this.syncInProgress) {
      return;
    }

    await this.syncPendingOperations();
  }

  /**
   * Manual sync
   */
  async manualSync() {
    if (!this.isOnline) {
      ToastManager.showError('No hay conexión a internet');
      return;
    }

    if (this.pendingOperations.length === 0) {
      ToastManager.showInfo('No hay operaciones pendientes');
      return;
    }

    await this.syncPendingOperations();
  }

  /**
   * Sync pending operations
   */
  async syncPendingOperations() {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    await LoadingManager.show('Sincronizando...');

    let successCount = 0;
    let errorCount = 0;

    // Process each operation
    for (let i = this.pendingOperations.length - 1; i >= 0; i--) {
      const operation = this.pendingOperations[i];

      try {
        await this.executeOperation(operation);
        
        // Remove from queue on success
        this.pendingOperations.splice(i, 1);
        successCount++;
      } catch (error) {
        console.error('Error syncing operation:', error);
        operation.status = 'error';
        operation.error = error.message;
        operation.retries++;
        errorCount++;

        // Remove if too many retries
        if (operation.retries >= 3) {
          this.pendingOperations.splice(i, 1);
        }
      }
    }

    this.savePendingOperations();
    this.syncInProgress = false;
    await LoadingManager.hide();

    // Show notification
    const notificationsEnabled = localStorage.getItem('taxi_sync_notifications') !== 'false';
    if (notificationsEnabled) {
      if (errorCount === 0) {
        ToastManager.showSuccess(`${successCount} operación(es) sincronizada(s)`);
      } else {
        ToastManager.showWarning(`${successCount} sincronizadas, ${errorCount} con error`);
      }
    }

    // Dispatch sync complete event
    window.dispatchEvent(new CustomEvent('sync-complete', {
      detail: { successCount, errorCount }
    }));
  }

  /**
   * Execute a single operation
   */
  async executeOperation(operation) {
    // Simulate API call (in real implementation, this would call actual API)
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real implementation, this would make actual API calls
    // For now, we just mark as successful
    console.log('Executing operation:', operation);
    
    return true;
  }

  /**
   * Clear all pending operations
   */
  async clearPendingOperations() {
    await ActionSheetManager.showConfirmation(
      'Limpiar Cola',
      '¿Estás seguro de que deseas eliminar todas las operaciones pendientes? Esta acción no se puede deshacer.',
      () => {
        this.pendingOperations = [];
        this.savePendingOperations();
        ToastManager.showSuccess('Cola limpiada');
      }
    );
  }

  /**
   * Get pending operations count
   */
  getPendingCount() {
    return this.pendingOperations.length;
  }

  /**
   * Check if sync is in progress
   */
  isSyncing() {
    return this.syncInProgress;
  }
}

// Export for use in other modules
window.DataSyncView = DataSyncView;

console.log('DataSyncView component loaded');
