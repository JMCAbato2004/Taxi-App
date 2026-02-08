/**
 * RegisterModal Component
 * Handles user registration with role selection and form validation
 * Requirements: 1.4, 1.5, 1.6
 */
class RegisterModal {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.modal = null;
    this.selectedRole = null;
    this.formData = {
      nombre: '',
      email: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      rol: null
    };
  }

  /**
   * Show the registration modal
   * @returns {Promise<void>}
   */
  async show() {
    this.modal = document.createElement('ion-modal');
    this.modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Registrarse</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-register-modal">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <p style="margin-bottom: 16px; color: var(--ion-color-medium);">Selecciona tu rol:</p>
        
        <!-- Role Selection -->
        <ion-grid>
          <ion-row>
            <ion-col size="6">
              <div class="role-selector" data-role="PATRON" id="role-patron">
                <div class="role-icon">👔</div>
                <strong>Patrón</strong>
                <p style="font-size: 12px; margin-top: 4px; color: var(--ion-color-medium);">Gestiona tu flota</p>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="role-selector" data-role="TAXISTA" id="role-taxista">
                <div class="role-icon">🚗</div>
                <strong>Taxista</strong>
                <p style="font-size: 12px; margin-top: 4px; color: var(--ion-color-medium);">Registra servicios</p>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>
        <ion-note color="danger" id="role-error" style="display: none; padding-left: 16px;"></ion-note>
        
        <!-- Registration Form -->
        <ion-list>
          <ion-item id="nombre-item">
            <ion-label position="stacked">Nombre Completo *</ion-label>
            <ion-input 
              type="text" 
              placeholder="Juan Pérez" 
              id="register-nombre"
              autocomplete="name"
            ></ion-input>
          </ion-item>
          <ion-note color="danger" id="nombre-error" style="display: none; padding-left: 16px;"></ion-note>
          
          <ion-item id="email-item">
            <ion-label position="stacked">Email *</ion-label>
            <ion-input 
              type="email" 
              placeholder="juan@email.com" 
              id="register-email"
              autocomplete="email"
            ></ion-input>
          </ion-item>
          <ion-note color="danger" id="email-error" style="display: none; padding-left: 16px;"></ion-note>
          
          <ion-item id="telefono-item">
            <ion-label position="stacked">Teléfono</ion-label>
            <ion-input 
              type="tel" 
              placeholder="+34 600 000 000" 
              id="register-telefono"
              autocomplete="tel"
            ></ion-input>
          </ion-item>
          <ion-note color="danger" id="telefono-error" style="display: none; padding-left: 16px;"></ion-note>
          
          <ion-item id="password-item">
            <ion-label position="stacked">Contraseña *</ion-label>
            <ion-input 
              type="password" 
              placeholder="••••••••" 
              id="register-password"
              autocomplete="new-password"
            ></ion-input>
          </ion-item>
          <ion-note color="danger" id="password-error" style="display: none; padding-left: 16px;"></ion-note>
          
          <ion-item id="confirmPassword-item">
            <ion-label position="stacked">Confirmar Contraseña *</ion-label>
            <ion-input 
              type="password" 
              placeholder="••••••••" 
              id="register-confirmPassword"
              autocomplete="new-password"
            ></ion-input>
          </ion-item>
          <ion-note color="danger" id="confirmPassword-error" style="display: none; padding-left: 16px;"></ion-note>
        </ion-list>
        
        <ion-button 
          expand="block" 
          color="primary" 
          style="margin-top: 20px;" 
          id="register-submit-btn"
        >
          Crear Cuenta
        </ion-button>
        
        <p style="text-align: center; margin-top: 16px; font-size: 12px; color: var(--ion-color-medium);">
          * Campos obligatorios
        </p>
      </ion-content>
    `;
    
    document.body.appendChild(this.modal);
    await this.modal.componentOnReady();
    await this.modal.present();
    
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the modal
   */
  setupEventListeners() {
    // Close button
    this.modal.querySelector('#close-register-modal')?.addEventListener('click', () => {
      this.close();
    });
    
    // Submit button
    this.modal.querySelector('#register-submit-btn')?.addEventListener('click', () => {
      this.handleSubmit();
    });
    
    // Role selectors
    const roleSelectors = this.modal.querySelectorAll('.role-selector');
    roleSelectors.forEach(selector => {
      selector.addEventListener('click', () => {
        this.handleRoleSelection(selector.getAttribute('data-role'));
      });
    });
    
    // Real-time validation on input
    const nombreInput = this.modal.querySelector('#register-nombre');
    const emailInput = this.modal.querySelector('#register-email');
    const telefonoInput = this.modal.querySelector('#register-telefono');
    const passwordInput = this.modal.querySelector('#register-password');
    const confirmPasswordInput = this.modal.querySelector('#register-confirmPassword');
    
    nombreInput?.addEventListener('ionInput', (e) => {
      this.formData.nombre = e.target.value;
      this.clearFieldError('nombre');
    });
    
    emailInput?.addEventListener('ionInput', (e) => {
      this.formData.email = e.target.value;
      this.clearFieldError('email');
    });
    
    telefonoInput?.addEventListener('ionInput', (e) => {
      this.formData.telefono = e.target.value;
      this.clearFieldError('telefono');
    });
    
    passwordInput?.addEventListener('ionInput', (e) => {
      this.formData.password = e.target.value;
      this.clearFieldError('password');
    });
    
    confirmPasswordInput?.addEventListener('ionInput', (e) => {
      this.formData.confirmPassword = e.target.value;
      this.clearFieldError('confirmPassword');
    });
    
    // Submit on Enter key
    confirmPasswordInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSubmit();
      }
    });
  }

  /**
   * Handle role selection with visual feedback
   * @param {string} role - Selected role (PATRON or TAXISTA)
   */
  handleRoleSelection(role) {
    // Update selected role
    this.selectedRole = role;
    this.formData.rol = role;
    
    // Update UI to show selected role
    const roleSelectors = this.modal.querySelectorAll('.role-selector');
    roleSelectors.forEach(selector => {
      if (selector.getAttribute('data-role') === role) {
        selector.classList.add('selected');
      } else {
        selector.classList.remove('selected');
      }
    });
    
    // Clear role error if any
    this.clearFieldError('role');
  }

  /**
   * Validate the registration form
   * @returns {Object} Validation errors object
   */
  validateForm() {
    const errors = {};
    
    // Role validation
    if (!this.selectedRole) {
      errors.role = 'Debes seleccionar un rol';
    }
    
    // Name validation
    if (!this.formData.nombre || this.formData.nombre.trim().length === 0) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (this.formData.nombre.trim().length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }
    
    // Email validation
    if (!this.formData.email) {
      errors.email = 'El email es obligatorio';
    } else if (!this.isValidEmail(this.formData.email)) {
      errors.email = 'El formato del email no es válido';
    }
    
    // Phone validation (optional but if provided, must be valid)
    if (this.formData.telefono && !this.isValidPhone(this.formData.telefono)) {
      errors.telefono = 'El formato del teléfono no es válido';
    }
    
    // Password validation
    if (!this.formData.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (this.formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    // Confirm password validation
    if (!this.formData.confirmPassword) {
      errors.confirmPassword = 'Debes confirmar la contraseña';
    } else if (this.formData.password !== this.formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return errors;
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   * @param {string} phone - Phone to validate
   * @returns {boolean} True if valid
   */
  isValidPhone(phone) {
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9;
  }

  /**
   * Display validation errors
   * @param {Object} errors - Validation errors object
   */
  showErrors(errors) {
    // Clear all previous errors
    this.clearAllErrors();
    
    // Show role error
    if (errors.role) {
      this.showFieldError('role', errors.role);
    }
    
    // Show field errors
    Object.keys(errors).forEach(field => {
      if (field !== 'role') {
        this.showFieldError(field, errors[field]);
      }
    });
  }

  /**
   * Show error for a specific field
   * @param {string} field - Field name
   * @param {string} message - Error message
   */
  showFieldError(field, message) {
    const errorElement = this.modal.querySelector(`#${field}-error`);
    const itemElement = this.modal.querySelector(`#${field}-item`);
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    
    if (itemElement) {
      itemElement.classList.add('ion-invalid');
    }
  }

  /**
   * Clear error for a specific field
   * @param {string} field - Field name
   */
  clearFieldError(field) {
    const errorElement = this.modal.querySelector(`#${field}-error`);
    const itemElement = this.modal.querySelector(`#${field}-item`);
    
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    
    if (itemElement) {
      itemElement.classList.remove('ion-invalid');
    }
  }

  /**
   * Clear all validation errors
   */
  clearAllErrors() {
    const fields = ['role', 'nombre', 'email', 'telefono', 'password', 'confirmPassword'];
    fields.forEach(field => this.clearFieldError(field));
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    // Validate form
    const errors = this.validateForm();
    
    if (Object.keys(errors).length > 0) {
      this.showErrors(errors);
      return;
    }
    
    // Show loading indicator
    await LoadingManager.show('Creando cuenta...');
    
    try {
      // Prepare user data
      const userData = {
        nombre: this.formData.nombre.trim(),
        email: this.formData.email.trim(),
        telefono: this.formData.telefono.trim(),
        password: this.formData.password,
        rol: this.selectedRole
      };
      
      // Attempt registration via AuthAdapter
      const user = await this.authAdapter.register(userData);
      
      // Hide loading
      await LoadingManager.hide();
      
      if (user) {
        // Show success message
        ToastManager.showSuccess('¡Cuenta creada exitosamente! Bienvenido.');
        
        // Close modal
        this.close();
        
        // Trigger registration success event (auto-login handled by adapter)
        this.onRegisterSuccess(user);
      } else {
        // Show error message
        ToastManager.showError('Error al crear la cuenta');
      }
    } catch (error) {
      // Hide loading
      await LoadingManager.hide();
      
      // Show error message
      const errorMessage = error.message || 'Error al crear la cuenta. Por favor, inténtalo de nuevo.';
      ToastManager.showError(errorMessage);
      
      console.error('Registration error:', error);
    }
  }

  /**
   * Handle successful registration
   * @param {Object} user - Registered user
   */
  onRegisterSuccess(user) {
    // Dispatch custom event for app to handle
    const event = new CustomEvent('register-success', { detail: { user } });
    window.dispatchEvent(event);
  }

  /**
   * Close the modal
   */
  close() {
    if (this.modal) {
      this.modal.dismiss();
      this.modal.remove();
      this.modal = null;
    }
    
    // Reset form data
    this.selectedRole = null;
    this.formData = {
      nombre: '',
      email: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      rol: null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RegisterModal;
}
