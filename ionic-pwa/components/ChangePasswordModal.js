/**
 * ChangePasswordModal Component
 * Modal for changing user password with validation
 */

class ChangePasswordModal {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.modal = null;
  }

  /**
   * Show the modal
   */
  async show() {
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
    return `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Cambiar Contraseña</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-password-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <form id="change-password-form">
          <!-- Current Password -->
          <ion-item>
            <ion-label position="stacked">Contraseña Actual *</ion-label>
            <ion-input 
              type="password" 
              id="current-password" 
              placeholder="Ingresa tu contraseña actual"
              required>
            </ion-input>
          </ion-item>
          <div class="error-message" id="current-password-error"></div>

          <!-- New Password -->
          <ion-item>
            <ion-label position="stacked">Nueva Contraseña *</ion-label>
            <ion-input 
              type="password" 
              id="new-password" 
              placeholder="Mínimo 8 caracteres"
              required>
            </ion-input>
          </ion-item>
          <div class="error-message" id="new-password-error"></div>
          <p style="font-size: 12px; color: var(--ion-color-medium); padding: 0 16px; margin-top: -8px;">
            La contraseña debe tener al menos 8 caracteres
          </p>

          <!-- Confirm New Password -->
          <ion-item>
            <ion-label position="stacked">Confirmar Nueva Contraseña *</ion-label>
            <ion-input 
              type="password" 
              id="confirm-password" 
              placeholder="Repite la nueva contraseña"
              required>
            </ion-input>
          </ion-item>
          <div class="error-message" id="confirm-password-error"></div>

          <!-- Password Strength Indicator -->
          <div id="password-strength" style="padding: 0 16px; margin-top: 8px; display: none;">
            <div style="font-size: 12px; margin-bottom: 4px;">
              Seguridad: <span id="strength-label">Débil</span>
            </div>
            <ion-progress-bar id="strength-bar" value="0" color="danger"></ion-progress-bar>
          </div>

          <!-- Submit Button -->
          <ion-button 
            expand="block" 
            type="submit" 
            id="submit-password-btn"
            style="margin-top: 20px;">
            <ion-icon name="key" slot="start"></ion-icon>
            Cambiar Contraseña
          </ion-button>
        </form>

        <!-- Security Tips -->
        <ion-card style="margin-top: 20px;">
          <ion-card-header>
            <ion-card-subtitle>Consejos de Seguridad</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: var(--ion-color-medium);">
              <li>Usa al menos 8 caracteres</li>
              <li>Combina letras, números y símbolos</li>
              <li>No uses información personal</li>
              <li>No reutilices contraseñas</li>
            </ul>
          </ion-card-content>
        </ion-card>
      </ion-content>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    document.getElementById('close-password-modal')?.addEventListener('click', () => {
      this.close();
    });

    // Form submission
    const form = document.getElementById('change-password-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Real-time validation
    document.getElementById('current-password')?.addEventListener('ionInput', () => {
      this.clearError('current-password-error');
    });

    document.getElementById('new-password')?.addEventListener('ionInput', (e) => {
      this.clearError('new-password-error');
      this.updatePasswordStrength(e.target.value);
    });

    document.getElementById('confirm-password')?.addEventListener('ionInput', () => {
      this.clearError('confirm-password-error');
    });
  }

  /**
   * Update password strength indicator
   */
  updatePasswordStrength(password) {
    const strengthIndicator = document.getElementById('password-strength');
    const strengthBar = document.getElementById('strength-bar');
    const strengthLabel = document.getElementById('strength-label');

    if (!password) {
      if (strengthIndicator) strengthIndicator.style.display = 'none';
      return;
    }

    if (strengthIndicator) strengthIndicator.style.display = 'block';

    // Calculate strength
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    // Update UI
    if (strengthBar) {
      strengthBar.value = strength / 100;
      
      if (strength < 40) {
        strengthBar.color = 'danger';
        if (strengthLabel) strengthLabel.textContent = 'Débil';
      } else if (strength < 70) {
        strengthBar.color = 'warning';
        if (strengthLabel) strengthLabel.textContent = 'Media';
      } else {
        strengthBar.color = 'success';
        if (strengthLabel) strengthLabel.textContent = 'Fuerte';
      }
    }
  }

  /**
   * Validate form using ValidationSchemas
   */
  validateForm() {
    let isValid = true;

    // Use ValidationSchemas if available
    if (window.validationSchemas) {
      const validation = window.validationSchemas.validatePasswordChange({
        currentPassword: document.getElementById('current-password').value,
        newPassword: document.getElementById('new-password').value,
        confirmPassword: document.getElementById('confirm-password').value
      });
      
      if (!validation.valid) {
        // Show errors
        if (validation.errors.currentPassword) {
          this.showError('current-password-error', validation.errors.currentPassword[0]);
          isValid = false;
        }
        if (validation.errors.newPassword) {
          this.showError('new-password-error', validation.errors.newPassword[0]);
          isValid = false;
        }
        if (validation.errors.confirmPassword) {
          this.showError('confirm-password-error', validation.errors.confirmPassword[0]);
          isValid = false;
        }
      }
      
      return isValid;
    }

    // Fallback validation
    // Validate current password
    const currentPassword = document.getElementById('current-password').value;
    if (!currentPassword) {
      this.showError('current-password-error', 'La contraseña actual es obligatoria');
      isValid = false;
    }

    // Validate new password
    const newPassword = document.getElementById('new-password').value;
    if (!newPassword) {
      this.showError('new-password-error', 'La nueva contraseña es obligatoria');
      isValid = false;
    } else if (newPassword.length < 8) {
      this.showError('new-password-error', 'La contraseña debe tener al menos 8 caracteres');
      isValid = false;
    } else if (newPassword === currentPassword) {
      this.showError('new-password-error', 'La nueva contraseña debe ser diferente a la actual');
      isValid = false;
    }

    // Validate confirm password
    const confirmPassword = document.getElementById('confirm-password').value;
    if (!confirmPassword) {
      this.showError('confirm-password-error', 'Debes confirmar la nueva contraseña');
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      this.showError('confirm-password-error', 'Las contraseñas no coinciden');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Show error message
   */
  showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Clear error message
   */
  clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    // Validate form
    if (!this.validateForm()) {
      ToastManager.showError('Por favor, corrige los errores del formulario');
      return;
    }

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    try {
      await LoadingManager.show('Cambiando contraseña...');

      // Validate current password first
      const user = this.authAdapter.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Attempt to change password
      await this.authAdapter.changePassword(currentPassword, newPassword);

      await LoadingManager.hide();

      ToastManager.showSuccess('Contraseña cambiada correctamente');

      // Close modal
      await this.close();

    } catch (error) {
      await LoadingManager.hide();
      console.error('Error changing password:', error);
      
      if (error.message.includes('actual incorrecta') || error.message.includes('current password')) {
        this.showError('current-password-error', 'La contraseña actual es incorrecta');
      } else {
        ToastManager.showError('Error al cambiar la contraseña');
      }
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
window.ChangePasswordModal = ChangePasswordModal;

console.log('ChangePasswordModal component loaded');
