/**
 * TaxistaDetailsModal Component
 * Displays detailed information about a taxista
 */

class TaxistaDetailsModal {
  constructor(authAdapter, reconcileAdapter, taxistaId) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.taxistaId = taxistaId;
  }

  /**
   * Show taxista details modal
   */
  async show() {
    const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
    const taxista = users.find(u => u.id === this.taxistaId);
    
    if (!taxista) {
      ToastManager.showError('Taxista no encontrado');
      return;
    }

    const modal = await this.createModal(taxista);
    await modal.present();
  }

  /**
   * Create modal element
   */
  async createModal(taxista) {
    // Load services for this taxista
    const services = await this.reconcileAdapter.getServices();
    const taxistaServices = services.filter(s => s.userId === this.taxistaId);
    
    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const todayServices = taxistaServices.filter(s => s.date === today);
    const totalEarnings = taxistaServices.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    const todayEarnings = todayServices.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Detalles del Taxista</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <!-- Personal Information -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Información Personal</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label>
                  <p>Nombre</p>
                  <h2>${taxista.nombre}</h2>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <p>Email</p>
                  <h2>${taxista.email}</h2>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <p>Teléfono</p>
                  <h2>${taxista.telefono || 'No especificado'}</h2>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <p>Número de Taxista</p>
                  <h2 style="color: var(--ion-color-primary);">${taxista.numeroTaxista}</h2>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <p>Estado</p>
                  <ion-badge color="success">Activo</ion-badge>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-label>
                  <p>Asociado desde</p>
                  <h2>${new Date(taxista.fechaRegistro || Date.now()).toLocaleDateString()}</h2>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Statistics -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Estadísticas</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col size="6">
                  <div style="background: rgba(59, 130, 246, 0.15); padding: 16px; border-radius: 8px; text-align: center; border: 2px solid #3b82f6;">
                    <p style="margin: 0; font-size: 12px; color: var(--ion-text-color); font-weight: 600;">Servicios Totales</p>
                    <h2 style="margin: 8px 0 0 0; font-size: 28px; font-weight: bold; color: #3b82f6;">${taxistaServices.length}</h2>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div style="background: rgba(16, 185, 129, 0.15); padding: 16px; border-radius: 8px; text-align: center; border: 2px solid #10b981;">
                    <p style="margin: 0; font-size: 12px; color: var(--ion-text-color); font-weight: 600;">Ingresos Totales</p>
                    <h2 style="margin: 8px 0 0 0; font-size: 28px; font-weight: bold; color: #10b981;">€${totalEarnings.toFixed(2)}</h2>
                  </div>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col size="6">
                  <div style="background: rgba(139, 92, 246, 0.15); padding: 16px; border-radius: 8px; text-align: center; border: 2px solid #8b5cf6;">
                    <p style="margin: 0; font-size: 12px; color: var(--ion-text-color); font-weight: 600;">Servicios Hoy</p>
                    <h2 style="margin: 8px 0 0 0; font-size: 28px; font-weight: bold; color: #8b5cf6;">${todayServices.length}</h2>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div style="background: rgba(245, 158, 11, 0.15); padding: 16px; border-radius: 8px; text-align: center; border: 2px solid #f59e0b;">
                    <p style="margin: 0; font-size: 12px; color: var(--ion-text-color); font-weight: 600;">Ingresos Hoy</p>
                    <h2 style="margin: 8px 0 0 0; font-size: 28px; font-weight: bold; color: #f59e0b;">€${todayEarnings.toFixed(2)}</h2>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        ${taxistaServices.length > 0 ? `
          <!-- Recent Services -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Últimos Servicios</ion-card-title>
            </ion-card-header>
            <ion-card-content style="padding: 0;">
              <ion-list>
                ${taxistaServices.slice(-5).reverse().map(service => `
                  <ion-item>
                    <ion-label>
                      <h2>${service.origin || 'Origen'} → ${service.destination || 'Destino'}</h2>
                      <p>${new Date(service.createdAt || service.date).toLocaleDateString()}</p>
                    </ion-label>
                    <ion-badge color="success" slot="end">€${parseFloat(service.totalAmount || 0).toFixed(2)}</ion-badge>
                  </ion-item>
                `).join('')}
              </ion-list>
            </ion-card-content>
          </ion-card>
        ` : ''}
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();

    return modal;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.TaxistaDetailsModal = TaxistaDetailsModal;
}

console.log('TaxistaDetailsModal component loaded');
