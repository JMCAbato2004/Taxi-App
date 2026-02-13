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
      </ion-header>
      <ion-content class="ion-padding">
        <!-- Real-time Stats -->
        <div id="fleet-stats-container">
          <div style="text-align: center; padding: 20px;">
            <ion-spinner name="circles"></ion-spinner>
          </div>
        </div>
        
        <!-- Tabs -->
        <ion-segment id="fleet-segment" value="fleet" style="margin-top: 16px;">
          <ion-segment-button value="fleet">
            <ion-label>Mi Flota</ion-label>
          </ion-segment-button>
          <ion-segment-button value="requests">
            <ion-label>Solicitudes</ion-label>
            <ion-badge id="requests-badge" color="danger" style="margin-left: 4px;">0</ion-badge>
          </ion-segment-button>
        </ion-segment>
        
        <!-- Tab Contents -->
        <div id="fleet-tab-content" style="margin-top: 16px;">
          <div style="text-align: center; padding: 20px;">
            <ion-spinner name="circles"></ion-spinner>
          </div>
        </div>
        <div id="requests-tab-content" style="display: none; margin-top: 16px;">
          <div style="text-align: center; padding: 20px;">
            <ion-spinner name="circles"></ion-spinner>
          </div>
        </div>
      </ion-content>
    `;

    document.body.appendChild(modal);
    
    // Store modal reference for use in render methods
    this.currentModal = modal;
    
    // Wait for modal to be ready
    try {
      await modal.componentOnReady();
    } catch (e) {
      console.log('componentOnReady not available, continuing...');
    }
    
    // Add a small delay to ensure DOM is fully ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Set up segment change handler
    const segment = modal.querySelector('#fleet-segment');
    if (segment) {
      console.log('Setting up segment change handler');
      segment.addEventListener('ionChange', (e) => {
        console.log('Segment changed to:', e.detail.value);
        const fleetContent = modal.querySelector('#fleet-tab-content');
        const requestsContent = modal.querySelector('#requests-tab-content');
        
        console.log('Fleet content:', fleetContent, 'Requests content:', requestsContent);
        
        if (e.detail.value === 'fleet') {
          console.log('Showing fleet tab');
          fleetContent.style.display = 'block';
          requestsContent.style.display = 'none';
        } else {
          console.log('Showing requests tab');
          fleetContent.style.display = 'none';
          requestsContent.style.display = 'block';
        }
      });
    } else {
      console.error('Segment not found!');
    }

    // Listen for taxista updates
    const updateHandler = async () => {
      console.log('Reloading fleet data due to taxista-updated event');
      // Only reload if modal is still present
      if (document.body.contains(modal)) {
        await this.loadFleet(user);
        await this.loadRequests(user);
      }
    };
    window.addEventListener('taxista-updated', updateHandler);
    
    // Listen for service updates to refresh stats
    const serviceUpdateHandler = async () => {
      console.log('Reloading fleet data due to service-saved event');
      // Only reload if modal is still present
      if (document.body.contains(modal)) {
        await this.loadFleet(user);
      }
    };
    window.addEventListener('service-saved', serviceUpdateHandler);

    // Clean up listeners when modal is dismissed
    modal.addEventListener('ionModalDidDismiss', () => {
      window.removeEventListener('taxista-updated', updateHandler);
      window.removeEventListener('service-saved', serviceUpdateHandler);
      this.currentModal = null;
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
    console.log('loadFleet called for user:', user.id);
    
    // Use modal reference if available, otherwise fall back to document
    const container = this.currentModal || document;
    const statsContainer = container.querySelector('#fleet-stats-container');
    const fleetContainer = container.querySelector('#fleet-tab-content');
    
    console.log('Containers found:', { 
      statsContainer: !!statsContainer, 
      fleetContainer: !!fleetContainer,
      hasModal: !!this.currentModal
    });
    
    if (!statsContainer || !fleetContainer) {
      console.error('Required containers not found in DOM');
      return;
    }
    
    try {
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const services = await this.reconcileAdapter.getServices();
      const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
      
      console.log('Data loaded:', { 
        totalUsers: users.length, 
        totalServices: services.length, 
        totalRequests: requests.length 
      });
      
      console.log('All users:', users);
      console.log('Current patron ID:', user.id);
      
      // Get associated taxistas
      const associatedTaxistas = users.filter(u => {
        const isTaxista = u.rol === 'TAXISTA';
        const isAsociado = u.estado === 'asociado';
        const hasPatronId = u.patronId === user.id;
        
        console.log('Checking user:', u.nombre, {
          rol: u.rol,
          isTaxista,
          estado: u.estado,
          isAsociado,
          patronId: u.patronId,
          expectedPatronId: user.id,
          hasPatronId,
          matches: isTaxista && isAsociado && hasPatronId
        });
        
        return isTaxista && isAsociado && hasPatronId;
      });
      
      console.log('Associated taxistas:', associatedTaxistas.length);
      console.log('Associated taxistas details:', associatedTaxistas);
      
      // Calculate stats for each taxista
      const today = new Date().toISOString().split('T')[0];
      const taxistasWithStats = associatedTaxistas.map(taxista => {
        const taxistaServices = services.filter(s => s.userId === taxista.id);
        const todayServices = taxistaServices.filter(s => {
          const serviceDate = s.date || new Date(s.datetime).toISOString().split('T')[0];
          return serviceDate === today;
        });
        const totalIncome = taxistaServices.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        const todayIncome = todayServices.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        
        return {
          ...taxista,
          totalServices: taxistaServices.length,
          todayServices: todayServices.length,
          totalIncome,
          todayIncome
        };
      });
      
      // Calculate fleet-wide stats
      const pendingRequests = requests.filter(r => 
        r.estado === 'pendiente' && r.patronId === user.id
      );
      
      const todayServicesCount = taxistasWithStats.reduce((sum, t) => sum + t.todayServices, 0);
      const todayIncomeTotal = taxistasWithStats.reduce((sum, t) => sum + t.todayIncome, 0);
      
      const stats = {
        activeTaxistas: associatedTaxistas.length,
        pendingRequests: pendingRequests.length,
        todayServices: todayServicesCount,
        todayIncome: todayIncomeTotal
      };
      
      console.log('Fleet stats calculated:', stats);
      
      this.renderFleetStats(stats);
      this.renderFleet(taxistasWithStats, user);
      
      console.log('Fleet data rendered successfully');
    } catch (error) {
      console.error('Error loading fleet:', error);
      
      // Clear spinners on error
      if (statsContainer) {
        statsContainer.innerHTML = '<p style="text-align: center; color: var(--ion-color-danger);">Error al cargar estadísticas</p>';
      }
      if (fleetContainer) {
        fleetContainer.innerHTML = '<p style="text-align: center; color: var(--ion-color-danger);">Error al cargar flota</p>';
      }
      
      ToastManager.showError('Error al cargar flota');
    }
  }

  /**
   * Render fleet statistics
   */
  renderFleetStats(stats) {
    console.log('renderFleetStats called with:', stats);
    const container = this.currentModal || document;
    const statsContainer = container.querySelector('#fleet-stats-container');
    
    if (!statsContainer) {
      console.error('fleet-stats-container not found!');
      return;
    }
    
    console.log('Rendering stats into container');
    
    // Clear any loading spinners
    statsContainer.innerHTML = '';
    
    const statsHTML = `
      <ion-grid style="padding: 0;">
        <ion-row>
          <ion-col size="6">
            <ion-card style="margin: 0; height: 100%;">
              <ion-card-content style="padding: 12px; text-align: center;">
                <ion-icon name="people" style="font-size: 24px; color: var(--ion-color-primary);"></ion-icon>
                <h2 style="margin: 8px 0 4px 0; font-size: 24px; font-weight: bold; color: var(--ion-color-primary);">${stats.activeTaxistas}</h2>
                <p style="margin: 0; font-size: 12px; color: var(--ion-color-medium);">Taxistas Activos</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card style="margin: 0; height: 100%;">
              <ion-card-content style="padding: 12px; text-align: center;">
                <ion-icon name="mail" style="font-size: 24px; color: var(--ion-color-warning);"></ion-icon>
                <h2 style="margin: 8px 0 4px 0; font-size: 24px; font-weight: bold; color: var(--ion-color-warning);">
                  ${stats.pendingRequests}
                  ${stats.pendingRequests > 0 ? '<ion-badge color="danger" style="margin-left: 4px; font-size: 10px;">!</ion-badge>' : ''}
                </h2>
                <p style="margin: 0; font-size: 12px; color: var(--ion-color-medium);">Solicitudes Pendientes</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col size="6">
            <ion-card style="margin: 0; height: 100%;">
              <ion-card-content style="padding: 12px; text-align: center;">
                <ion-icon name="car" style="font-size: 24px; color: var(--ion-color-tertiary);"></ion-icon>
                <h2 style="margin: 8px 0 4px 0; font-size: 24px; font-weight: bold; color: var(--ion-color-tertiary);">${stats.todayServices}</h2>
                <p style="margin: 0; font-size: 12px; color: var(--ion-color-medium);">Servicios Hoy</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card style="margin: 0; height: 100%;">
              <ion-card-content style="padding: 12px; text-align: center;">
                <ion-icon name="cash" style="font-size: 24px; color: var(--ion-color-success);"></ion-icon>
                <h2 style="margin: 8px 0 4px 0; font-size: 24px; font-weight: bold; color: var(--ion-color-success);">€${stats.todayIncome.toFixed(2)}</h2>
                <p style="margin: 0; font-size: 12px; color: var(--ion-color-medium);">Ingresos Hoy</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    `;
    
    statsContainer.innerHTML = statsHTML;
  }

  /**
   * Load pending requests
   */
  async loadRequests(user) {
    const container = this.currentModal || document;
    const requestsContainer = container.querySelector('#requests-tab-content');
    
    if (!requestsContainer) {
      console.error('requests-tab-content not found!');
      return;
    }
    
    try {
      const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      
      console.log('All requests:', requests);
      console.log('Current user ID:', user.id);
      console.log('Current user:', user);
      
      const pendingRequests = requests.filter(r => {
        console.log('Checking request:', r, 'estado:', r.estado, 'patronId:', r.patronId, 'matches:', r.estado === 'pendiente' && r.patronId === user.id);
        return r.estado === 'pendiente' && r.patronId === user.id;
      });
      
      console.log('Pending requests found:', pendingRequests);
      
      // Update badge
      const badge = container.querySelector('#requests-badge');
      if (badge) {
        badge.textContent = pendingRequests.length;
        badge.style.display = pendingRequests.length > 0 ? 'inline-block' : 'none';
      }
      
      // Add user info to requests
      const requestsWithUsers = pendingRequests.map(request => {
        const taxista = users.find(u => u.id === request.taxistaId);
        console.log('Request with user:', { request, taxista });
        return {
          ...request,
          taxista
        };
      });
      
      this.renderRequests(requestsWithUsers);
    } catch (error) {
      console.error('Error loading requests:', error);
      
      // Clear spinner on error
      if (requestsContainer) {
        requestsContainer.innerHTML = '<p style="text-align: center; color: var(--ion-color-danger);">Error al cargar solicitudes</p>';
      }
      
      ToastManager.showError('Error al cargar solicitudes');
    }
  }

  /**
   * Render fleet list
   */
  renderFleet(taxistas, user) {
    console.log('renderFleet called with', taxistas.length, 'taxistas');
    
    const container = this.currentModal || document;
    const fleetContainer = container.querySelector('#fleet-tab-content');
    
    console.log('fleetContainer found:', !!fleetContainer);
    
    if (!fleetContainer) {
      console.error('fleet-tab-content not found!');
      return;
    }
    
    if (taxistas.length === 0) {
      console.log('No taxistas, showing empty state');
      const safeCode = sanitizer.escapeHTML(user.codigoInvitacion || 'No disponible');
      const html = `
        <div style="text-align: center; padding: 40px 20px;">
          <ion-icon name="people" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
          <h2 style="color: var(--ion-text-color);">No tienes taxistas en tu flota</h2>
          <p style="color: var(--ion-color-medium);">Comparte tu código de invitación para que se unan</p>
          <ion-card style="margin-top: 20px;">
            <ion-card-content style="text-align: center;">
              <p style="font-size: 12px; color: var(--ion-color-medium); margin-bottom: 8px;">Tu código de invitación:</p>
              <div style="font-size: 24px; font-weight: bold; color: var(--ion-color-primary); background: var(--ion-color-step-100); padding: 12px; border-radius: 8px;">
                ${safeCode}
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      `;
      // Use direct innerHTML for Ionic components
      fleetContainer.innerHTML = html;
      return;
    }
    
    console.log('Building HTML for', taxistas.length, 'taxistas');
    
    const safeCode = sanitizer.escapeHTML(user.codigoInvitacion || 'No disponible');
    const taxistaItems = taxistas.map((taxista, index) => {
      console.log('Processing taxista', index, ':', taxista.nombre);
      const safeName = sanitizer.escapeHTML(taxista.nombre);
      const safeNumero = sanitizer.escapeHTML(taxista.numeroTaxista || 'Sin número');
      const safeEmail = sanitizer.escapeHTML(taxista.email);
      const safeId = sanitizer.escapeHTML(taxista.id);
      
      return `
        <ion-item>
          <ion-avatar slot="start">
            <div style="background: var(--ion-color-success); color: white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold;">
              ${safeNumero.slice(-2) || '??'}
            </div>
          </ion-avatar>
          <ion-label>
            <h2 style="color: var(--ion-text-color);">${safeName}</h2>
            <p style="color: var(--ion-color-medium);">${safeNumero} • ${safeEmail}</p>
            <p style="font-size: 11px; color: var(--ion-color-medium);">
              Total: ${taxista.totalServices} servicios • €${taxista.totalIncome.toFixed(2)}
            </p>
            <p style="font-size: 11px; color: var(--ion-color-success);">
              Hoy: ${taxista.todayServices} servicios • €${taxista.todayIncome.toFixed(2)}
            </p>
          </ion-label>
          <div slot="end" style="display: flex; gap: 4px;">
            <ion-button fill="clear" onclick="window.app.viewTaxistaDetails('${safeId}')">
              <ion-icon name="eye"></ion-icon>
            </ion-button>
            <ion-button fill="clear" color="primary" onclick="window.app.editTaxista('${safeId}')">
              <ion-icon name="create"></ion-icon>
            </ion-button>
            <ion-button fill="clear" color="danger" onclick="window.app.removeTaxista('${safeId}')">
              <ion-icon name="trash"></ion-icon>
            </ion-button>
          </div>
        </ion-item>
      `;
    }).join('');
    
    console.log('Taxista items HTML length:', taxistaItems.length);
    
    const html = `
      <!-- Invitation Code -->
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle style="color: var(--ion-color-medium);">Código de Invitación</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content style="text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: var(--ion-color-primary); background: var(--ion-color-step-100); padding: 12px; border-radius: 8px;">
            ${safeCode}
          </div>
          <p style="font-size: 12px; color: var(--ion-color-medium); margin-top: 8px;">
            Comparte este código con nuevos taxistas
          </p>
        </ion-card-content>
      </ion-card>
      
      <!-- Fleet List -->
      <ion-list>
        ${taxistaItems}
      </ion-list>
    `;
    
    console.log('Final HTML length:', html.length);
    console.log('Setting HTML to fleetContainer');
    
    // Use direct innerHTML since we've already sanitized individual values
    fleetContainer.innerHTML = html;
    
    console.log('Fleet HTML set successfully');
  }

  /**
   * Render requests list
   */
  renderRequests(requests) {
    try {
      console.log('renderRequests called with:', requests.length, 'requests');
      
      const container = this.currentModal || document;
      const requestsContainer = container.querySelector('#requests-tab-content');
      
      if (!requestsContainer) {
        console.error('requests-tab-content not found!');
        return;
      }
      
      console.log('requestsContainer found, checking if empty...');
      
      if (requests.length === 0) {
        console.log('No requests, showing empty state');
        const html = `
          <div style="text-align: center; padding: 40px 20px;">
            <ion-icon name="mail-open" style="font-size: 64px; color: var(--ion-color-medium);"></ion-icon>
            <h2 style="color: var(--ion-text-color);">No hay solicitudes pendientes</h2>
            <p style="color: var(--ion-color-medium);">Las solicitudes de unión aparecerán aquí</p>
          </div>
        `;
        requestsContainer.innerHTML = html;
        return;
      }
      
      console.log('Building HTML for', requests.length, 'requests...');
      
      const requestItems = requests.map((request, index) => {
        console.log('Processing request', index, ':', request);
        
        const safeName = sanitizer.escapeHTML(request.taxista?.nombre || 'Usuario desconocido');
        const safeEmail = sanitizer.escapeHTML(request.taxista?.email || '');
        const safeNumero = sanitizer.escapeHTML(request.taxista?.numeroTaxista || 'N/A');
        const safeId = String(request.id); // Convert to string
        const safeDate = new Date(request.fechaSolicitud).toLocaleDateString();
        
        console.log('Sanitized data:', { safeName, safeEmail, safeNumero, safeId, safeDate });
        
        return `
          <ion-item>
            <ion-avatar slot="start">
              <div style="background: var(--ion-color-warning); color: white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold;">
                ${safeNumero.slice(-2) || '??'}
              </div>
            </ion-avatar>
            <ion-label>
              <h2 style="color: var(--ion-text-color);">${safeName}</h2>
              <p style="color: var(--ion-color-medium);">${safeEmail}</p>
              <p style="font-size: 11px; color: var(--ion-color-medium);">Número: ${safeNumero}</p>
              <p style="font-size: 11px; color: var(--ion-color-medium);">
                Solicitado: ${safeDate}
              </p>
            </ion-label>
            <div slot="end" style="display: flex; flex-direction: column; gap: 4px;">
              <ion-button size="small" color="success" onclick="window.app.approveRequest('${safeId}')">
                <ion-icon name="checkmark" slot="icon-only"></ion-icon>
              </ion-button>
              <ion-button size="small" color="danger" onclick="window.app.rejectRequest('${safeId}')">
                <ion-icon name="close" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        `;
      }).join('');
      
      console.log('Request items built, length:', requestItems.length);
      
      const html = `
        <ion-list>
          ${requestItems}
        </ion-list>
      `;
      
      console.log('Final HTML built, length:', html.length);
      console.log('Setting innerHTML...');
      
      requestsContainer.innerHTML = html;
      
      console.log('innerHTML set successfully!');
    } catch (error) {
      console.error('Error in renderRequests:', error);
      console.error('Error stack:', error.stack);
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.FleetManagementView = FleetManagementView;
}

console.log('FleetManagementView component loaded');
