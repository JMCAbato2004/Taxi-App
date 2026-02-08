/**
 * FleetManagementView Component
 * Displays fleet management for patrons
 */

class FleetManagementView {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
  }

  /**
   * Show fleet management modal
   */
  async show() {
    const user = this.authAdapter.getCurrentUser();
    if (!user) {
      ToastManager.showError('Debes iniciar sesión');
      return;
    }

    if (user.rol !== 'PATRON') {
      ToastManager.showError('Solo los patrones pueden acceder a esta función');
      return;
    }

    const modal = await this.createModal(user);
    await modal.present();
  }

  /**
   * Create fleet management modal
   */
  async createModal(user) {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>👥 Gestión de Flota</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-segment id="fleet-segment" value="fleet">
            <ion-segment-button value="fleet">
              <ion-label>Mi Flota</ion-label>
            </ion-segment-button>
            <ion-segment-button value="requests">
              <ion-label>Solicitudes</ion-label>
              <ion-badge id="requests-badge" color="danger" style="margin-left: 4px;">0</ion-badge>
            </ion-segment-button>
          </ion-segment>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div id="fleet-tab-content">
          <ion-spinner name="circles"></ion-spinner>
        </div>
        <div id="requests-tab-content" style="display: none;">
          <ion-spinner name="circles"></ion-spinner>
        </div>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();

    // Set up segment change handler
    const segment = modal.querySelector('#fleet-segment');
    segment.addEventListener('ionChange', (e) => {
      const fleetContent = modal.querySelector('#fleet-tab-content');
      const requestsContent = modal.querySelector('#requests-tab-content');
      
      if (e.detail.value === 'fleet') {
        fleetContent.style.display = 'block';
        requestsContent.style.display = 'none';
      } else {
        fleetContent.style.display = 'none';
        requestsContent.style.display = 'block';
      }
    });

    // Listen for taxista updates
    const updateHandler = async () => {
      await this.loadFleet(user);
      await this.loadRequests(user);
    };
    window.addEventListener('taxista-updated', updateHandler);

    // Clean up listener when modal is dismissed
    modal.addEventListener('ionModalDidDismiss', () => {
      window.removeEventListener('taxista-updated', updateHandler);
    });

    // Load fleet data
    await this.loadFleet(user);
    await this.loadRequests(user);

    return modal;
  }

  /**
   * Load fleet data
   */
  async loadFleet(user) {
    try {
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const services = await this.reconcileAdapter.getServices();
      
      // Get associated taxistas
      const associatedTaxistas = users.filter(u => 
        u.rol === 'TAXISTA' && 
        u.estado === 'asociado' && 
        u.patronId === user.id
      );
      
      // Calculate stats for each taxista
      const today = new Date().toISOString().split('T')[0];
      const taxistasWithStats = associatedTaxistas.map(taxista => {
        const taxistaServices = services.filter(s => s.userId === taxista.id);
        const todayServices = taxistaServices.filter(s => s.date === today);
        const totalIncome = taxistaServices.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
        const todayIncome = todayServices.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
        
        return {
          ...taxista,
          totalServices: taxistaServices.length,
          todayServices: todayServices.length,
          totalIncome,
          todayIncome
        };
      });
      
      this.renderFleet(taxistasWithStats, user);
    } catch (error) {
      console.error('Error loading fleet:', error);
      ToastManager.showError('Error al cargar flota');
    }
  }

  /**
   * Load pending requests
   */
  async loadRequests(user) {
    try {
      const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      
      const pendingRequests = requests.filter(r => 
        r.estado === 'pendiente' && r.patronId === user.id
      );
      
      // Update badge
      const badge = document.getElementById('requests-badge');
      if (badge) {
        badge.textContent = pendingRequests.length;
        badge.style.display = pendingRequests.length > 0 ? 'inline-block' : 'none';
      }
      
      // Add user info to requests
      const requestsWithUsers = pendingRequests.map(request => {
        const taxista = users.find(u => u.id === request.taxistaId);
        return {
          ...request,
          taxista
        };
      });
      
      this.renderRequests(requestsWithUsers);
    } catch (error) {
      console.error('Error loading requests:', error);
      ToastManager.showError('Error al cargar solicitudes');
    }
  }

  /**
   * Render fleet list
   */
  renderFleet(taxistas, user) {
    const container = document.getElementById('fleet-tab-content');
    if (!container) return;
    
    if (taxistas.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <ion-icon name="people" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
          <h2>No tienes taxistas en tu flota</h2>
          <p style="color: var(--ion-color-medium);">Comparte tu código de invitación para que se unan</p>
          <ion-card style="margin-top: 20px;">
            <ion-card-content style="text-align: center;">
              <p style="font-size: 12px; color: var(--ion-color-medium); margin-bottom: 8px;">Tu código de invitación:</p>
              <div style="font-size: 24px; font-weight: bold; color: var(--ion-color-primary); background: var(--ion-color-primary-tint); padding: 12px; border-radius: 8px;">
                ${user.codigoInvitacion || 'No disponible'}
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <!-- Invitation Code -->
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Código de Invitación</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content style="text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: var(--ion-color-primary); background: var(--ion-color-primary-tint); padding: 12px; border-radius: 8px;">
            ${user.codigoInvitacion || 'No disponible'}
          </div>
          <p style="font-size: 12px; color: var(--ion-color-medium); margin-top: 8px;">
            Comparte este código con nuevos taxistas
          </p>
        </ion-card-content>
      </ion-card>
      
      <!-- Fleet List -->
      <ion-list>
        ${taxistas.map(taxista => `
          <ion-item>
            <ion-avatar slot="start">
              <div style="background: var(--ion-color-success); color: white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold;">
                ${taxista.numeroTaxista?.slice(-2) || '??'}
              </div>
            </ion-avatar>
            <ion-label>
              <h2>${taxista.nombre}</h2>
              <p>${taxista.numeroTaxista || 'Sin número'} • ${taxista.email}</p>
              <p style="font-size: 11px;">
                Total: ${taxista.totalServices} servicios • €${taxista.totalIncome.toFixed(2)}
              </p>
              <p style="font-size: 11px; color: var(--ion-color-success);">
                Hoy: ${taxista.todayServices} servicios • €${taxista.todayIncome.toFixed(2)}
              </p>
            </ion-label>
            <div slot="end" style="display: flex; gap: 4px;">
              <ion-button fill="clear" onclick="window.app.viewTaxistaDetails(${taxista.id})">
                <ion-icon name="eye"></ion-icon>
              </ion-button>
              <ion-button fill="clear" color="primary" onclick="window.app.editTaxista(${taxista.id})">
                <ion-icon name="create"></ion-icon>
              </ion-button>
              <ion-button fill="clear" color="danger" onclick="window.app.removeTaxista(${taxista.id})">
                <ion-icon name="trash"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        `).join('')}
      </ion-list>
    `;
  }

  /**
   * Render requests list
   */
  renderRequests(requests) {
    const container = document.getElementById('requests-tab-content');
    if (!container) return;
    
    if (requests.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <ion-icon name="mail-open" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
          <h2>No hay solicitudes pendientes</h2>
          <p style="color: var(--ion-color-medium);">Las solicitudes de unión aparecerán aquí</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <ion-list>
        ${requests.map(request => `
          <ion-item>
            <ion-avatar slot="start">
              <div style="background: var(--ion-color-warning); color: white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold;">
                ${request.taxista?.numeroTaxista?.slice(-2) || '??'}
              </div>
            </ion-avatar>
            <ion-label>
              <h2>${request.taxista?.nombre || 'Usuario desconocido'}</h2>
              <p>${request.taxista?.email || ''}</p>
              <p style="font-size: 11px;">Número: ${request.taxista?.numeroTaxista || 'N/A'}</p>
              <p style="font-size: 11px; color: var(--ion-color-medium);">
                Solicitado: ${new Date(request.fechaSolicitud).toLocaleDateString()}
              </p>
            </ion-label>
            <div slot="end" style="display: flex; flex-direction: column; gap: 4px;">
              <ion-button size="small" color="success" onclick="window.app.approveRequest(${request.id})">
                <ion-icon name="checkmark" slot="icon-only"></ion-icon>
              </ion-button>
              <ion-button size="small" color="danger" onclick="window.app.rejectRequest(${request.id})">
                <ion-icon name="close" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        `).join('')}
      </ion-list>
    `;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.FleetManagementView = FleetManagementView;
}

console.log('FleetManagementView component loaded');
