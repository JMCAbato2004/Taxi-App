/**
 * LoginModal Component
 * Handles user login with email and password validation
 * Requirements: 1.2, 1.3, 1.7
 */
class LoginModal {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.modal = null;
    this.formData = {
      email: '',
      password: ''
    };
  }

  /**
   * Show the login modal
   * @returns {Promise<void>}
   */
  async show() {
    this.modal = document.createElement('ion-modal');
    this.modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Iniciar Sesión</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-login-modal">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list>
          <ion-item id="email-item">
            <ion-label position="stacked">Email</ion-label>
            <ion-input 
              type="email" 
              placeholder="tu@email.com" 
              id="login-email"
              autocomplete="email"
            ></ion-input>
          </ion-item>
          <ion-note color="danger" id="email-error" style="display: none; padding-left: 16px;"></ion-note>
          
          <ion-item id="password-item">
            <ion-label position="stacked">Contraseña</ion-label>
            <ion-input 
              type="password" 
              placeholder="••••••••" 
              id="login-password"
              autocomplete="current-password"
            ></ion-input>
          </ion-item>
          <ion-note color="danger" id="password-error" style="display: none; padding-left: 16px;"></ion-note>
        </ion-list>
        
        <ion-button 
          expand="block" 
          color="primary" 
          style="margin-top: 20px;" 
          id="login-submit-btn"
        >
          Iniciar Sesión
        </ion-button>
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
    this.modal.querySelector('#close-login-modal')?.addEventListener('click', () => {
      this.close();
    });
    
    // Submit button
    this.modal.querySelector('#login-submit-btn')?.addEventListener('click', () => {
      this.handleSubmit();
    });
    
    // Real-time validation on input
    const emailInput = this.modal.querySelector('#login-email');
    const passwordInput = this.modal.querySelector('#login-password');
    
    emailInput?.addEventListener('ionInput', (e) => {
      this.formData.email = e.target.value;
      this.clearFieldError('email');
    });
    
    passwordInput?.addEventListener('ionInput', (e) => {
      this.formData.password = e.target.value;
      this.clearFieldError('password');
    });
    
    // Submit on Enter key
    passwordInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSubmit();
      }
    });
  }

  /**
   * Validate the login form using ValidationSchemas
   * @returns {Object} Validation errors object
   */
  validateForm() {
    // Use ValidationSchemas for comprehensive validation
    if (window.validationSchemas) {
      const validation = window.validationSchemas.validateLogin(this.formData);
      return validation.errors;
    }
    
    // Fallback validation if ValidationSchemas not loaded
    const errors = {};
    
    // Email validation
    if (!this.formData.email) {
      errors.email = ['El email es obligatorio'];
    } else if (!this.isValidEmail(this.formData.email)) {
      errors.email = ['El formato del email no es válido'];
    }
    
    // Password validation
    if (!this.formData.password) {
      errors.password = ['La contraseña es obligatoria'];
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
   * Display validation errors
   * @param {Object} errors - Validation errors object
   */
  showErrors(errors) {
    // Clear all previous errors
    this.clearAllErrors();
    
    // Show email error (handle both array and string formats)
    if (errors.email) {
      const emailError = Array.isArray(errors.email) ? errors.email[0] : errors.email;
      this.showFieldError('email', emailError);
    }
    
    // Show password error (handle both array and string formats)
    if (errors.password) {
      const passwordError = Array.isArray(errors.password) ? errors.password[0] : errors.password;
      this.showFieldError('password', passwordError);
    }
  }

  /**
   * Show error for a specific field
   * @param {string} field - Field name (email or password)
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
   * @param {string} field - Field name (email or password)
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
    this.clearFieldError('email');
    this.clearFieldError('password');
  }

  /**
   * Handle form submission with CSRF protection and rate limiting
   */
  async handleSubmit() {
    // Validate form
    const errors = this.validateForm();
    
    if (Object.keys(errors).length > 0) {
      this.showErrors(errors);
      return;
    }
    
    // Check rate limiting BEFORE attempting login
    if (window.rateLimitService) {
      const lockoutStatus = window.rateLimitService.isLockedOut(this.formData.email);
      if (lockoutStatus.locked) {
        const minutes = Math.ceil(lockoutStatus.remainingTime / 60000);
        ToastManager.showError(`Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutes} minutos.`);
        return;
      }
    }
    
    // Show loading indicator
    await LoadingManager.show('Iniciando sesión...');
    
    try {
      // Add CSRF token to login data
      let loginData = {
        email: this.formData.email,
        password: this.formData.password
      };
      
      if (window.csrfService) {
        loginData = window.csrfService.addTokenToData(loginData);
      }
      
      // Attempt login via AuthAdapter
      const result = await this.authAdapter.login(loginData);
      
      // Hide loading
      await LoadingManager.hide();
      
      if (result.success) {
        // Clear rate limit attempts on successful login
        if (window.rateLimitService) {
          window.rateLimitService.clearAttempts(this.formData.email);
        }
        
        // Show success message
        ToastManager.showSuccess('¡Bienvenido!');
        
        // Close modal
        this.close();
        
        // Trigger login success event
        this.onLoginSuccess(result.user);
      } else {
        // Record failed attempt for rate limiting
        if (window.rateLimitService) {
          const attemptResult = window.rateLimitService.recordAttempt(this.formData.email);
          if (!attemptResult.allowed) {
            ToastManager.showError(attemptResult.message);
            return;
          } else if (attemptResult.attemptsLeft <= 2) {
            ToastManager.showWarning(attemptResult.message);
          }
        }
        
        // Show error message
        ToastManager.showError(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      // Hide loading
      await LoadingManager.hide();
      
      // Record failed attempt for rate limiting
      if (window.rateLimitService) {
        const attemptResult = window.rateLimitService.recordAttempt(this.formData.email);
        if (!attemptResult.allowed) {
          ToastManager.showError(attemptResult.message);
          return;
        } else if (attemptResult.attemptsLeft <= 2) {
          ToastManager.showWarning(attemptResult.message);
        }
      }
      
      // Show error message
      const errorMessage = error.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
      ToastManager.showError(errorMessage);
      
      console.error('Login error:', error);
    }
  }

  /**
   * Handle successful login
   * @param {Object} user - Logged in user
   */
  onLoginSuccess(user) {
    // Dispatch custom event for app to handle
    const event = new CustomEvent('login-success', { detail: { user } });
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
    this.formData = {
      email: '',
      password: ''
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoginModal;
}
