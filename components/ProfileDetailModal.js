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
    const photoUrl = this.user.photoUrl || null;

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
          <div style="position: relative; display: inline-block;">
            ${photoUrl ? `
              <img src="${photoUrl}" alt="Foto de perfil" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--ion-color-primary);">
            ` : `
              <div style="width: 120px; height: 120px; border-radius: 50%; background: var(--ion-color-primary-tint); display: flex; align-items: center; justify-content: center; font-size: 64px; border: 4px solid var(--ion-color-primary);">
                ${roleIcon}
              </div>
            `}
            <ion-button id="change-photo-btn" size="small" color="primary" style="position: absolute; bottom: 0; right: 0; --border-radius: 50%;">
              <ion-icon name="camera" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
          <h2 style="margin: 12px 0 0 0;">${this.user.nombre}</h2>
          <ion-badge color="primary" style="margin-top: 8px;">${roleLabel}</ion-badge>
        </div>

        <!-- Action Buttons -->
        <ion-grid style="margin-bottom: 16px;">
          <ion-row>
            <ion-col size="6">
              <ion-button expand="block" fill="outline" size="small" id="edit-profile-btn">
                <ion-icon name="create" slot="start"></ion-icon>
                Editar
              </ion-button>
            </ion-col>
            <ion-col size="6">
              <ion-button expand="block" fill="outline" size="small" id="export-data-btn">
                <ion-icon name="download" slot="start"></ion-icon>
                Exportar
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>

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

        <!-- Danger Zone -->
        <ion-list style="margin-top: 24px;">
          <ion-list-header>
            <ion-label color="danger">Zona de Peligro</ion-label>
          </ion-list-header>

          <ion-item button id="delete-account-btn" lines="none" style="--background: var(--ion-color-danger-tint);">
            <ion-icon name="trash" slot="start" color="danger"></ion-icon>
            <ion-label color="danger">
              <h3>Eliminar Cuenta</h3>
              <p style="font-size: 11px;">Esta acción no se puede deshacer</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Hidden file input for photo upload -->
        <input type="file" id="photo-upload-input" accept="image/*" style="display: none;">
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

    // Change photo button
    document.getElementById('change-photo-btn')?.addEventListener('click', () => {
      this.handleChangePhoto();
    });

    // Photo upload input
    document.getElementById('photo-upload-input')?.addEventListener('change', (e) => {
      this.handlePhotoUpload(e);
    });

    // Edit profile button
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
      this.handleEditProfile();
    });

    // Export data button
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
      this.handleExportData();
    });

    // Delete account button
    document.getElementById('delete-account-btn')?.addEventListener('click', () => {
      this.handleDeleteAccount();
    });
  }

  /**
   * Handle change photo
   */
  handleChangePhoto() {
    const input = document.getElementById('photo-upload-input');
    if (input) {
      input.click();
    }
  }

  /**
   * Handle photo upload
   */
  async handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      ToastManager.showError('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      ToastManager.showError('La imagen debe ser menor a 2MB');
      return;
    }

    try {
      await LoadingManager.show('Subiendo foto...');

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoUrl = e.target.result;

        // Update user photo
        const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.user.id);
        
        if (userIndex !== -1) {
          users[userIndex].photoUrl = photoUrl;
          localStorage.setItem('taxi_users', JSON.stringify(users));

          // Update current user in auth adapter
          this.authAdapter.updateCurrentUser({ photoUrl });

          await LoadingManager.hide();
          ToastManager.showSuccess('Foto actualizada');

          // Refresh modal
          await this.close();
          await this.show();
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      await LoadingManager.hide();
      console.error('Error uploading photo:', error);
      ToastManager.showError('Error al subir la foto');
    }
  }

  /**
   * Handle edit profile
   */
  async handleEditProfile() {
    if (window.EditProfileModal) {
      await this.close();
      const editModal = new EditProfileModal(this.authAdapter);
      await editModal.show();
    } else {
      ToastManager.showInfo('Editar perfil - Próximamente');
    }
  }

  /**
   * Handle export data (RGPD compliance)
   */
  async handleExportData() {
    try {
      await LoadingManager.show('Exportando datos...');

      // Collect all user data
      const userData = {
        perfil: this.user,
        servicios: await this.getUserServices(),
        gastos: await this.getUserExpenses(),
        conciliaciones: await this.getUserReconciliations(),
        exportDate: new Date().toISOString()
      };

      // Convert to JSON
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mis-datos-taxi-${this.user.id}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await LoadingManager.hide();
      ToastManager.showSuccess('Datos exportados correctamente');
    } catch (error) {
      await LoadingManager.hide();
      console.error('Error exporting data:', error);
      ToastManager.showError('Error al exportar datos');
    }
  }

  /**
   * Get user services
   */
  async getUserServices() {
    try {
      const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
      return services.filter(s => s.userId === this.user.id);
    } catch (error) {
      console.error('Error getting services:', error);
      return [];
    }
  }

  /**
   * Get user expenses
   */
  async getUserExpenses() {
    try {
      const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
      return expenses.filter(e => e.userId === this.user.id);
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  /**
   * Get user reconciliations
   */
  async getUserReconciliations() {
    try {
      const reconciliations = JSON.parse(localStorage.getItem('taxi_reconciliations') || '[]');
      return reconciliations.filter(r => r.userId === this.user.id);
    } catch (error) {
      console.error('Error getting reconciliations:', error);
      return [];
    }
  }

  /**
   * Handle delete account
   */
  async handleDeleteAccount() {
    await ActionSheetManager.showConfirmation(
      'Eliminar Cuenta',
      '¿Estás seguro? Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.',
      async () => {
        // Show second confirmation
        await ActionSheetManager.showConfirmation(
          'Confirmación Final',
          'Escribe "ELIMINAR" para confirmar la eliminación de tu cuenta',
          async () => {
            try {
              await LoadingManager.show('Eliminando cuenta...');

              // Delete user data
              await this.deleteUserData();

              // Logout
              await this.authAdapter.logout();

              await LoadingManager.hide();
              ToastManager.showSuccess('Cuenta eliminada correctamente');

              // Close modal and redirect to welcome
              await this.close();
              window.location.reload();
            } catch (error) {
              await LoadingManager.hide();
              console.error('Error deleting account:', error);
              ToastManager.showError('Error al eliminar cuenta');
            }
          }
        );
      }
    );
  }

  /**
   * Delete all user data
   */
  async deleteUserData() {
    try {
      // Delete user from users list
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const filteredUsers = users.filter(u => u.id !== this.user.id);
      localStorage.setItem('taxi_users', JSON.stringify(filteredUsers));

      // Delete user services
      const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
      const filteredServices = services.filter(s => s.userId !== this.user.id);
      localStorage.setItem('taxi_services', JSON.stringify(filteredServices));

      // Delete user expenses
      const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
      const filteredExpenses = expenses.filter(e => e.userId !== this.user.id);
      localStorage.setItem('taxi_expenses', JSON.stringify(filteredExpenses));

      // Delete user reconciliations
      const reconciliations = JSON.parse(localStorage.getItem('taxi_reconciliations') || '[]');
      const filteredReconciliations = reconciliations.filter(r => r.userId !== this.user.id);
      localStorage.setItem('taxi_reconciliations', JSON.stringify(filteredReconciliations));

      // If patron, disassociate taxistas
      if (this.user.rol === 'PATRON') {
        const allUsers = JSON.parse(localStorage.getItem('taxi_users') || '[]');
        allUsers.forEach(u => {
          if (u.patronId === this.user.id) {
            delete u.patronId;
            u.estado = 'independiente';
          }
        });
        localStorage.setItem('taxi_users', JSON.stringify(allUsers));
      }

      // Delete join requests
      const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
      const filteredRequests = requests.filter(r => 
        r.taxistaId !== this.user.id && r.patronId !== this.user.id
      );
      localStorage.setItem('taxi_join_requests', JSON.stringify(filteredRequests));

      console.log('User data deleted successfully');
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
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
