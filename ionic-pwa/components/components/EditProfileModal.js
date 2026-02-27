/**
 * EditProfileModal Component
 * Allows users to edit their profile information
 */

class EditProfileModal {
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
    
    // Pre-fill form
    this.prefillForm();
    
    // Present modal
    await this.modal.present();
  }

  /**
   * Get modal content HTML
   */
  getModalContent() {
    return `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Editar Perfil</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-edit-profile-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <form id="edit-profile-form">
          <!-- Name -->
          <ion-item>
            <ion-label position="stacked">Nombre Completo *</ion-label>
            <ion-input 
              type="text" 
              id="edit-nombre" 
              required
              placeholder="Tu nombre completo">
            </ion-input>
          </ion-item>

          <!-- Email (readonly) -->
          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input 
              type="email" 
              id="edit-email" 
              readonly
              disabled>
            </ion-input>
          </ion-item>
          <ion-note color="medium" style="display: block; margin: 8px 16px; font-size: 12px;">
            El email no se puede modificar
          </ion-note>

          <!-- Phone -->
          <ion-item>
            <ion-label position="stacked">Teléfono</ion-label>
            <ion-input 
              type="tel" 
              id="edit-telefono" 
              placeholder="+34 600 000 000">
            </ion-input>
          </ion-item>

          <!-- Role-specific fields -->
          <div id="role-specific-fields">
            <!-- Will be populated based on role -->
          </div>

          <!-- Submit Button -->
          <ion-button 
            expand="block" 
            type="submit" 
            color="primary"
            style="margin-top: 24px;">
            <ion-icon name="save" slot="start"></ion-icon>
            Guardar Cambios
          </ion-button>
        </form>
      </ion-content>
    `;
  }

  /**
   * Pre-fill form with user data
   */
  prefillForm() {
    document.getElementById('edit-nombre').value = this.user.nombre || '';
    document.getElementById('edit-email').value = this.user.email || '';
    document.getElementById('edit-telefono').value = this.user.telefono || '';

    // Add role-specific fields
    const roleFieldsContainer = document.getElementById('role-specific-fields');
    
    if (this.user.rol === 'TAXISTA') {
      roleFieldsContainer.innerHTML = `
        <ion-item>
          <ion-label position="stacked">Número de Taxi</ion-label>
          <ion-input 
            type="text" 
            id="edit-numero-taxi" 
            value="${this.user.numeroTaxi || ''}"
            placeholder="Número de licencia">
          </ion-input>
        </ion-item>
      `;
    } else if (this.user.rol === 'PATRON') {
      roleFieldsContainer.innerHTML = `
        <ion-item>
          <ion-label position="stacked">Nombre de Empresa</ion-label>
          <ion-input 
            type="text" 
            id="edit-company-name" 
            value="${this.user.companyName || ''}"
            placeholder="Nombre de tu empresa">
          </ion-input>
        </ion-item>
      `;
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    document.getElementById('close-edit-profile-modal')?.addEventListener('click', () => {
      this.close();
    });

    // Form submission
    const form = document.getElementById('edit-profile-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    try {
      await LoadingManager.show('Guardando cambios...');

      // Get form values
      const nombre = document.getElementById('edit-nombre').value.trim();
      const telefono = document.getElementById('edit-telefono').value.trim();

      // Validate
      if (!nombre) {
        await LoadingManager.hide();
        ToastManager.showError('El nombre es obligatorio');
        return;
      }

      // Prepare update data
      const updateData = {
        nombre,
        telefono
      };

      // Add role-specific fields
      if (this.user.rol === 'TAXISTA') {
        const numeroTaxi = document.getElementById('edit-numero-taxi')?.value.trim();
        if (numeroTaxi) {
          updateData.numeroTaxi = numeroTaxi;
        }
      } else if (this.user.rol === 'PATRON') {
        const companyName = document.getElementById('edit-company-name')?.value.trim();
        if (companyName) {
          updateData.companyName = companyName;
        }
      }

      // Update user in localStorage
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const userIndex = users.findIndex(u => u.id === this.user.id);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updateData };
        localStorage.setItem('taxi_users', JSON.stringify(users));

        // Update current user in auth adapter
        this.authAdapter.updateCurrentUser(updateData);

        await LoadingManager.hide();
        ToastManager.showSuccess('Perfil actualizado correctamente');

        // Close modal and reopen profile modal
        await this.close();
        
        if (window.ProfileDetailModal) {
          const profileModal = new ProfileDetailModal(this.authAdapter);
          await profileModal.show();
        }
      } else {
        await LoadingManager.hide();
        ToastManager.showError('Usuario no encontrado');
      }
    } catch (error) {
      await LoadingManager.hide();
      console.error('Error updating profile:', error);
      ToastManager.showError('Error al actualizar perfil');
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
window.EditProfileModal = EditProfileModal;

console.log('EditProfileModal component loaded');
