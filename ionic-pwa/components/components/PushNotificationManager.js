/**
 * PushNotificationManager Component
 * Manages push notifications for the PWA
 */

class PushNotificationManager {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.subscription = null;
    
    // Load settings
    this.loadSettings();
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported() {
    return this.isSupported;
  }

  /**
   * Get current permission status
   */
  getPermission() {
    return this.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported) {
      ToastManager.showError('Las notificaciones no están soportadas en este navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;

      if (permission === 'granted') {
        ToastManager.showSuccess('Notificaciones activadas');
        await this.subscribe();
        return true;
      } else if (permission === 'denied') {
        ToastManager.showWarning('Notificaciones bloqueadas');
        return false;
      } else {
        ToastManager.showInfo('Permiso de notificaciones pendiente');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      ToastManager.showError('Error al solicitar permisos');
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    if (!this.isSupported || this.permission !== 'granted') {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
        });
      }

      this.subscription = subscription;
      
      // Save subscription to server (in real app)
      await this.saveSubscription(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      
      // Remove subscription from server (in real app)
      await this.removeSubscription();
      
      ToastManager.showSuccess('Notificaciones desactivadas');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      ToastManager.showError('Error al desactivar notificaciones');
      return false;
    }
  }

  /**
   * Show notification settings modal
   */
  async show() {
    const modal = await this.createModal();
    await modal.present();
  }

  /**
   * Create notification settings modal
   */
  async createModal() {
    const user = this.authAdapter.getCurrentUser();
    const isPatron = user && user.rol === 'PATRON';

    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>🔔 Notificaciones</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <!-- Permission Status -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Estado de Permisos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div style="display: flex; align-items: center; gap: 12px;">
              <ion-icon 
                name="${this.permission === 'granted' ? 'checkmark-circle' : this.permission === 'denied' ? 'close-circle' : 'help-circle'}" 
                style="font-size: 48px; color: ${this.permission === 'granted' ? 'var(--ion-color-success)' : this.permission === 'denied' ? 'var(--ion-color-danger)' : 'var(--ion-color-warning)'};">
              </ion-icon>
              <div style="flex: 1;">
                <h2 style="margin: 0;">
                  ${this.permission === 'granted' ? 'Activadas' : this.permission === 'denied' ? 'Bloqueadas' : 'Pendientes'}
                </h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--ion-color-medium);">
                  ${this.permission === 'granted' ? 'Recibirás notificaciones' : this.permission === 'denied' ? 'Debes activarlas en configuración del navegador' : 'Solicita permisos para recibir notificaciones'}
                </p>
              </div>
            </div>

            ${this.permission !== 'granted' ? `
              <ion-button 
                expand="block" 
                id="request-permission-btn"
                style="margin-top: 16px;">
                <ion-icon name="notifications" slot="start"></ion-icon>
                Activar Notificaciones
              </ion-button>
            ` : ''}
          </ion-card-content>
        </ion-card>

        <!-- Notification Types -->
        <ion-list>
          <ion-list-header>
            <ion-label>Tipos de Notificaciones</ion-label>
          </ion-list-header>

          ${isPatron ? `
            <ion-item>
              <ion-icon name="person-add" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Nuevas Solicitudes</h3>
                <p>Cuando un taxista solicita unirse</p>
              </ion-label>
              <ion-toggle id="notify-requests-toggle" checked ${this.permission !== 'granted' ? 'disabled' : ''}></ion-toggle>
            </ion-item>

            <ion-item>
              <ion-icon name="car" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Nuevos Servicios</h3>
                <p>Cuando se registra un servicio</p>
              </ion-label>
              <ion-toggle id="notify-services-toggle" checked ${this.permission !== 'granted' ? 'disabled' : ''}></ion-toggle>
            </ion-item>

            <ion-item>
              <ion-icon name="stats-chart" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <h3>Reportes Diarios</h3>
                <p>Resumen al final del día</p>
              </ion-label>
              <ion-toggle id="notify-reports-toggle" ${this.permission !== 'granted' ? 'disabled' : ''}></ion-toggle>
            </ion-item>
          ` : `
            <ion-item>
              <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
              <ion-label>
                <h3>Solicitud Aprobada</h3>
                <p>Cuando el patrón aprueba tu solicitud</p>
              </ion-label>
              <ion-toggle id="notify-approved-toggle" checked ${this.permission !== 'granted' ? 'disabled' : ''}></ion-toggle>
            </ion-item>

            <ion-item>
              <ion-icon name="close-circle" slot="start" color="danger"></ion-icon>
              <ion-label>
                <h3>Solicitud Rechazada</h3>
                <p>Cuando el patrón rechaza tu solicitud</p>
              </ion-label>
              <ion-toggle id="notify-rejected-toggle" checked ${this.permission !== 'granted' ? 'disabled' : ''}></ion-toggle>
            </ion-item>

            <ion-item>
              <ion-icon name="cash" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Liquidaciones</h3>
                <p>Cuando hay una nueva liquidación</p>
              </ion-label>
              <ion-toggle id="notify-payments-toggle" checked ${this.permission !== 'granted' ? 'disabled' : ''}></ion-toggle>
            </ion-item>
          `}

          <ion-item lines="none">
            <ion-icon name="sync" slot="start" color="medium"></ion-icon>
            <ion-label>
              <h3>Sincronización</h3>
              <p>Cuando se sincronizan datos</p>
            </ion-label>
            <ion-toggle id="notify-sync-toggle" ${this.permission !== 'granted' ? 'disabled' : ''}></ion-toggle>
          </ion-item>
        </ion-list>

        <!-- Test Notification -->
        ${this.permission === 'granted' ? `
          <ion-card>
            <ion-card-header>
              <ion-card-title>Probar Notificación</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-button expand="block" id="test-notification-btn">
                <ion-icon name="notifications" slot="start"></ion-icon>
                Enviar Notificación de Prueba
              </ion-button>
            </ion-card-content>
          </ion-card>
        ` : ''}
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();

    // Load saved settings
    this.loadToggleStates(modal);

    // Attach event listeners
    this.attachModalEventListeners(modal);

    return modal;
  }

  /**
   * Load toggle states from settings
   */
  loadToggleStates(modal) {
    const settings = this.loadSettings();

    // Set toggle states
    Object.keys(settings).forEach(key => {
      const toggle = modal.querySelector(`#${key}-toggle`);
      if (toggle) {
        toggle.checked = settings[key];
      }
    });
  }

  /**
   * Attach modal event listeners
   */
  attachModalEventListeners(modal) {
    // Request permission button
    modal.querySelector('#request-permission-btn')?.addEventListener('click', async () => {
      const granted = await this.requestPermission();
      if (granted) {
        // Refresh modal
        modal.dismiss();
        await this.show();
      }
    });

    // Test notification button
    modal.querySelector('#test-notification-btn')?.addEventListener('click', () => {
      this.sendTestNotification();
    });

    // Save toggle states
    const toggles = modal.querySelectorAll('ion-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('ionChange', (e) => {
        const settingKey = e.target.id.replace('-toggle', '');
        this.saveSetting(settingKey, e.detail.checked);
      });
    });
  }

  /**
   * Send test notification
   */
  sendTestNotification() {
    if (this.permission !== 'granted') {
      ToastManager.showError('Permisos de notificación no concedidos');
      return;
    }

    const notification = new Notification('Control de Taxi', {
      body: 'Esta es una notificación de prueba',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
      requireInteraction: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    ToastManager.showSuccess('Notificación enviada');
  }

  /**
   * Send notification
   */
  sendNotification(title, body, options = {}) {
    if (this.permission !== 'granted') {
      return null;
    }

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false
    };

    const notification = new Notification(title, {
      body,
      ...defaultOptions,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Handle notification click
      if (options.onClick) {
        options.onClick();
      }
    };

    return notification;
  }

  /**
   * Load settings from storage
   */
  loadSettings() {
    try {
      const stored = localStorage.getItem('taxi_notification_settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }

    // Default settings
    return {
      'notify-requests': true,
      'notify-services': true,
      'notify-reports': false,
      'notify-approved': true,
      'notify-rejected': true,
      'notify-payments': true,
      'notify-sync': false
    };
  }

  /**
   * Save setting
   */
  saveSetting(key, value) {
    const settings = this.loadSettings();
    settings[key] = value;
    localStorage.setItem('taxi_notification_settings', JSON.stringify(settings));
  }

  /**
   * Save subscription to server
   */
  async saveSubscription(subscription) {
    // In a real app, send subscription to server
    console.log('Saving subscription:', subscription);
    localStorage.setItem('taxi_push_subscription', JSON.stringify(subscription));
  }

  /**
   * Remove subscription from server
   */
  async removeSubscription() {
    // In a real app, remove subscription from server
    console.log('Removing subscription');
    localStorage.removeItem('taxi_push_subscription');
  }

  /**
   * Get VAPID public key
   */
  getVapidPublicKey() {
    // In a real app, this would be your actual VAPID public key
    return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrysGRcck3-MF8Cq_mvjqT6VcKQvN3ZWwP6RXq6gjEuQplSgeL4';
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export for use in other modules
window.PushNotificationManager = PushNotificationManager;

console.log('PushNotificationManager component loaded');
