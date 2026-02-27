/**
 * RegisterModal Component
 * Handles user registration with role selection and form validation
 * Requirements: 1.4, 1.5, 1.6
 */
class RegisterModal {
  constructor(authAdapter, emailVerificationService) {
    this.authAdapter = authAdapter;
    this.emailVerificationService = emailVerificationService;
    this.modal = null;
    this.selectedRole = null;
    this.formData = {
      nombre: '',
      email: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      codigoInvitacion: '',
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
          
          <!-- Invitation Code (REQUIRED for TAXISTA) -->
          <ion-item id="codigoInvitacion-item" style="display: none;">
            <ion-label position="stacked">Código de Invitación *</ion-label>
            <ion-input 
              type="text" 
              placeholder="ABC123" 
              id="register-codigoInvitacion"
              maxlength="6"
              style="text-transform: uppercase;"
            ></ion-input>
          </ion-item>
          <ion-note id="codigoInvitacion-note" style="display: none; padding-left: 16px; font-size: 11px; color: var(--ion-color-medium);">
            Solicita este código a tu patrón para asociarte a su flota
          </ion-note>
          <ion-note color="danger" id="codigoInvitacion-error" style="display: none; padding-left: 16px;"></ion-note>
          
          <ion-item id="password-item">
            <ion-label position="stacked">Contraseña *</ion-label>
            <ion-input 
              type="password" 
              placeholder="••••••••" 
              id="register-password"
              autocomplete="new-password"
            ></ion-input>
          </ion-item>
          <div id="password-strength" style="padding: 8px 16px; display: none;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <div style="flex: 1; height: 4px; background: var(--ion-color-light); border-radius: 2px; overflow: hidden;">
                <div id="password-strength-bar" style="height: 100%; width: 0%; transition: all 0.3s;"></div>
              </div>
              <span id="password-strength-label" style="font-size: 12px; font-weight: 500;"></span>
            </div>
            <div id="password-feedback" style="font-size: 11px; color: var(--ion-color-medium);"></div>
          </div>
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
    
    const codigoInvitacionInput = this.modal.querySelector('#register-codigoInvitacion');
    codigoInvitacionInput?.addEventListener('ionInput', (e) => {
      this.formData.codigoInvitacion = e.target.value.toUpperCase();
      this.clearFieldError('codigoInvitacion');
    });
    
    passwordInput?.addEventListener('ionInput', (e) => {
      this.formData.password = e.target.value;
      this.clearFieldError('password');
      this.updatePasswordStrength(e.target.value);
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
   * Update password strength indicator
   * @param {string} password - Password to validate
   */
  updatePasswordStrength(password) {
    const strengthContainer = this.modal.querySelector('#password-strength');
    const strengthBar = this.modal.querySelector('#password-strength-bar');
    const strengthLabel = this.modal.querySelector('#password-strength-label');
    const feedbackDiv = this.modal.querySelector('#password-feedback');
    
    if (!password) {
      strengthContainer.style.display = 'none';
      return;
    }
    
    strengthContainer.style.display = 'block';
    
    // Validate password strength
    const validation = window.cryptoService.validatePasswordStrength(password);
    
    // Update bar
    const percentage = (validation.score / 7) * 100;
    strengthBar.style.width = percentage + '%';
    strengthBar.style.backgroundColor = `var(--ion-color-${validation.color})`;
    
    // Update label
    strengthLabel.textContent = validation.strength;
    strengthLabel.style.color = `var(--ion-color-${validation.color})`;
    
    // Update feedback
    if (validation.feedback.length > 0) {
      feedbackDiv.innerHTML = '• ' + validation.feedback.join('<br>• ');
      feedbackDiv.style.color = 'var(--ion-color-warning)';
    } else {
      feedbackDiv.innerHTML = '✓ Contraseña segura';
      feedbackDiv.style.color = 'var(--ion-color-success)';
    }
  }

  /**
   * Handle role selection with visual feedback
   * @param {string} role - Selected role (PATRON or TAXISTA)
   */
  handleRoleSelection(role) {
    console.log('Role selected:', role);
    
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
    
    // Show/hide invitation code field based on role
    const codigoInvitacionItem = this.modal.querySelector('#codigoInvitacion-item');
    const codigoInvitacionNote = this.modal.querySelector('#codigoInvitacion-note');
    
    console.log('Invitation code item found:', !!codigoInvitacionItem);
    console.log('Invitation code note found:', !!codigoInvitacionNote);
    
    if (codigoInvitacionItem && codigoInvitacionNote) {
      if (role === 'TAXISTA') {
        console.log('Showing invitation code field');
        codigoInvitacionItem.style.display = 'block';
        codigoInvitacionNote.style.display = 'block';
      } else {
        console.log('Hiding invitation code field');
        codigoInvitacionItem.style.display = 'none';
        codigoInvitacionNote.style.display = 'none';
      }
    } else {
      console.error('Invitation code elements not found in modal');
    }
    
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
    
    // Invitation code validation (REQUIRED for TAXISTA)
    if (this.selectedRole === 'TAXISTA') {
      if (!this.formData.codigoInvitacion || this.formData.codigoInvitacion.trim().length === 0) {
        errors.codigoInvitacion = 'El código de invitación es obligatorio para taxistas';
      } else if (this.formData.codigoInvitacion.trim().length !== 6) {
        errors.codigoInvitacion = 'El código debe tener 6 caracteres';
      } else {
        // Validate that the code exists
        const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
        const patron = users.find(u => u.rol === 'PATRON' && u.codigoInvitacion === this.formData.codigoInvitacion.trim().toUpperCase());
        if (!patron) {
          errors.codigoInvitacion = 'Código de invitación inválido';
        }
      }
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
    if (!this.modal) return; // Guard clause
    
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
    const fields = ['role', 'nombre', 'email', 'telefono', 'codigoInvitacion', 'password', 'confirmPassword'];
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
    await LoadingManager.show('Enviando código de verificación...');
    
    try {
      // Hash password before storing in userData
      const hashedPassword = await window.cryptoService.hashPassword(this.formData.password);
      
      // Prepare user data
      const userData = {
        nombre: this.formData.nombre.trim(),
        email: this.formData.email.trim(),
        telefono: this.formData.telefono.trim(),
        password: hashedPassword, // Store hashed password
        rol: this.selectedRole
      };
      
      // Add invitation code for taxistas (already validated)
      if (this.selectedRole === 'TAXISTA') {
        userData.codigoPatron = this.formData.codigoInvitacion.trim().toUpperCase();
      }
      
      // Create verification and send code
      const code = this.emailVerificationService.createVerification(
        userData.email, 
        userData
      );
      
      await this.emailVerificationService.sendVerificationEmail(
        userData.email, 
        code
      );
      
      // Hide loading
      await LoadingManager.hide();
      
      // Show success message
      ToastManager.showSuccess('Código de verificación enviado a tu email');
      
      // Close registration modal
      this.close();
      
      // Show verification modal with code (for development/staging)
      const verificationModal = new EmailVerificationModal(
        this.emailVerificationService,
        this.authAdapter
      );
      
      await verificationModal.show(userData.email, (user) => {
        // On successful verification and registration
        this.onRegisterSuccess(user);
      }, code); // Pass code for development display
      
    } catch (error) {
      // Hide loading
      await LoadingManager.hide();
      
      // Show error message
      const errorMessage = error.message || 'Error al enviar código de verificación. Por favor, inténtalo de nuevo.';
      ToastManager.showError(errorMessage);
      
      console.error('Registration error:', error);
    }
  }

  /**
   * Create join request for taxista with invitation code
   * @param {Object} user - The taxista user
   * @param {string} codigoInvitacion - Invitation code from patron (already validated)
   */
  async createJoinRequest(user, codigoInvitacion) {
    try {
      // Get all users to find patron with this invitation code
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const patron = users.find(u => u.rol === 'PATRON' && u.codigoInvitacion === codigoInvitacion);
      
      // Code already validated in validateForm, but double-check
      if (!patron) {
        console.error('Patron not found with code:', codigoInvitacion);
        return;
      }
      
      // Get existing requests
      const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
      
      // Check if request already exists
      const existingRequest = requests.find(r => 
        r.taxistaId === user.id && r.patronId === patron.id && r.estado === 'pendiente'
      );
      
      if (existingRequest) {
        return; // Request already exists
      }
      
      // Create new join request
      const newRequest = {
        id: Date.now(),
        taxistaId: user.id,
        patronId: patron.id,
        estado: 'pendiente',
        fechaSolicitud: new Date().toISOString()
      };
      
      requests.push(newRequest);
      localStorage.setItem('taxi_join_requests', JSON.stringify(requests));
      
      // Update user status to 'solicitando'
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex].estado = 'solicitando';
        users[userIndex].patronIdSolicitado = patron.id;
        localStorage.setItem('taxi_users', JSON.stringify(users));
        
        // Update current user in auth adapter
        const updatedUser = users[userIndex];
        localStorage.setItem('taxi_auth_current_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error creating join request:', error);
      throw error; // Re-throw to be caught by handleSubmit
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
      codigoInvitacion: '',
      rol: null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RegisterModal;
}
