/**
 * ProfileDetailModal Component
 * Displays user profile information with role-specific details
 */

class ProfileDetailModal {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.modal = null;
    this.user = null;
  }

  /**
   * Show the modal
   */
  async show() {
    // Get current user
    this.user = this.authAdapter.getCurrentUser();
    if (!this.user) {
      ToastManager.showError('Usuario no autenticado');
      return;
    }

    // Create modal element
    this.modal = document.createElement('ion-modal');
    this.modal.innerHTML = this.getModalContent();
    
    document.body.appendChild(this.modal);
    
    // Wait for modal to be ready
    await this.modal.componentOnReady();
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Present modal
    await this.modal.present();
  }

  /**
   * Get modal content HTML
   */
  getModalContent() {
    const roleIcon = this.user.rol === 'PATRON' ? '👔' : '🚗';
    const roleLabel = this.user.rol === 'PATRON' ? 'Patrón' : 'Taxista';

    return `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Mi Perfil</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-profile-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <!-- Profile Header -->
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 64px; margin-bottom: 12px;">${roleIcon}</div>
          <h2 style="margin: 0;">${this.user.nombre}</h2>
          <ion-badge color="primary" style="margin-top: 8px;">${roleLabel}</ion-badge>
        </div>

        <!-- Basic Information -->
        <ion-list>
          <ion-list-header>
            <ion-label>Información Básica</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-icon name="person" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Nombre</h3>
              <p>${this.user.nombre}</p>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-icon name="mail" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Email</h3>
              <p>${this.user.email}</p>
            </ion-label>
          </ion-item>

          ${this.user.telefono ? `
            <ion-item>
              <ion-icon name="call" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Teléfono</h3>
                <p>${this.user.telefono}</p>
              </ion-label>
            </ion-item>
          ` : ''}

          <ion-item>
            <ion-icon name="shield-checkmark" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Rol</h3>
              <p>${roleLabel}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Role-Specific Information -->
        ${this.getRoleSpecificContent()}

        <!-- Account Information -->
        <ion-list>
          <ion-list-header>
            <ion-label>Información de Cuenta</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-icon name="calendar" slot="start" color="secondary"></ion-icon>
            <ion-label>
              <h3>Miembro desde</h3>
              <p>${this.formatDate(this.user.createdAt)}</p>
            </ion-label>
          </ion-item>

          ${this.user.lastLogin ? `
            <ion-item>
              <ion-icon name="time" slot="start" color="secondary"></ion-icon>
              <ion-label>
                <h3>Último acceso</h3>
                <p>${this.formatDate(this.user.lastLogin)}</p>
              </ion-label>
            </ion-item>
          ` : ''}
        </ion-list>
      </ion-content>
    `;
  }

  /**
   * Get role-specific content
   */
  getRoleSpecificContent() {
    if (this.user.rol === 'TAXISTA') {
      return `
        <ion-list>
          <ion-list-header>
            <ion-label>Información del Taxista</ion-label>
          </ion-list-header>

          ${this.user.numeroTaxi ? `
            <ion-item>
              <ion-icon name="car" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Número de Taxi</h3>
                <p>${this.user.numeroTaxi}</p>
              </ion-label>
            </ion-item>
          ` : ''}

          ${this.user.patronId ? `
            <ion-item>
              <ion-icon name="people" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Asociado con</h3>
                <p>Patrón (ID: ${this.user.patronId})</p>
              </ion-label>
            </ion-item>
          ` : `
            <ion-item>
              <ion-icon name="alert-circle" slot="start" color="medium"></ion-icon>
              <ion-label>
                <h3>Sin asociación</h3>
                <p>No estás asociado con ningún patrón</p>
              </ion-label>
            </ion-item>
          `}
        </ion-list>
      `;
    } else if (this.user.rol === 'PATRON') {
      // Get associated taxistas count
      const associatedCount = this.getAssociatedTaxistasCount();
      
      return `
        <ion-list>
          <ion-list-header>
            <ion-label>Información del Patrón</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-icon name="people" slot="start" color="warning"></ion-icon>
            <ion-label>
              <h3>Taxistas Asociados</h3>
              <p>${associatedCount} taxista${associatedCount !== 1 ? 's' : ''}</p>
            </ion-label>
          </ion-item>

          ${this.user.companyName ? `
            <ion-item>
              <ion-icon name="business" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Empresa</h3>
                <p>${this.user.companyName}</p>
              </ion-label>
            </ion-item>
          ` : ''}
        </ion-list>
      `;
    }

    return '';
  }

  /**
   * Get associated taxistas count
   */
  getAssociatedTaxistasCount() {
    try {
      const associatedUsers = this.authAdapter.getAssociatedUsers();
      return associatedUsers ? associatedUsers.length : 0;
    } catch (error) {
      console.error('Error getting associated users:', error);
      return 0;
    }
  }

  /**
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    document.getElementById('close-profile-modal')?.addEventListener('click', () => {
      this.close();
    });
  }

  /**
   * Close the modal
   */
  async close() {
    if (this.modal) {
      await this.modal.dismiss();
      this.modal.remove();
    }
  }
}

// Export for use in other modules
window.ProfileDetailModal = ProfileDetailModal;

console.log('ProfileDetailModal component loaded');
