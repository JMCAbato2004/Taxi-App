/**
 * EmailVerificationModal - Email Verification Component
 * Displays modal for entering email verification code
 */

class EmailVerificationModal {
  constructor(emailVerificationService, authAdapter) {
    this.emailVerificationService = emailVerificationService;
    this.authAdapter = authAdapter;
    this.modal = null;
    this.email = null;
    this.userData = null;
    this.onSuccess = null;
  }

  /**
   * Show verification modal
   * @param {string} email - Email that needs verification
   * @param {Function} onSuccess - Callback on successful verification
   */
  async show(email, onSuccess) {
    this.email = email;
    this.onSuccess = onSuccess;
    
    // Create modal if it doesn't exist
    if (!this.modal) {
      await this.createModal();
    }
    
    // Reset form
    this.resetForm();
    
    // Present modal
    await this.modal.present();
    
    // Focus on first input
    setTimeout(() => {
      const firstInput = this.modal.querySelector('#code-input-0');
      if (firstInput) {
        firstInput.focus();
      }
    }, 300);
  }

  /**
   * Create verification modal
   */
  async createModal() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>✉️ Verifica tu Email</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div style="max-width: 400px; margin: 0 auto;">
          <!-- Instructions -->
          <div style="text-align: center; margin-bottom: 24px;">
            <ion-icon name="mail" style="font-size: 64px; color: var(--ion-color-primary);"></ion-icon>
            <h2 style="margin: 16px 0 8px 0;">Revisa tu correo</h2>
            <p style="color: var(--ion-color-medium); font-size: 14px;">
              Hemos enviado un código de 6 dígitos a:<br>
              <strong id="verification-email" style="color: var(--ion-color-dark);"></strong>
            </p>
          </div>

          <!-- Code Input -->
          <div style="margin-bottom: 24px;">
            <ion-label style="display: block; margin-bottom: 8px; font-weight: 500;">
              Código de Verificación
            </ion-label>
            <div id="code-inputs" style="display: flex; gap: 8px; justify-content: center;">
              <input type="text" id="code-input-0" maxlength="1" 
                style="width: 48px; height: 56px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid var(--ion-color-medium); border-radius: 8px; background: white;">
              <input type="text" id="code-input-1" maxlength="1" 
                style="width: 48px; height: 56px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid var(--ion-color-medium); border-radius: 8px; background: white;">
              <input type="text" id="code-input-2" maxlength="1" 
                style="width: 48px; height: 56px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid var(--ion-color-medium); border-radius: 8px; background: white;">
              <input type="text" id="code-input-3" maxlength="1" 
                style="width: 48px; height: 56px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid var(--ion-color-medium); border-radius: 8px; background: white;">
              <input type="text" id="code-input-4" maxlength="1" 
                style="width: 48px; height: 56px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid var(--ion-color-medium); border-radius: 8px; background: white;">
              <input type="text" id="code-input-5" maxlength="1" 
                style="width: 48px; height: 56px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid var(--ion-color-medium); border-radius: 8px; background: white;">
            </div>
            <div id="code-error" style="color: var(--ion-color-danger); font-size: 12px; margin-top: 8px; text-align: center; display: none;"></div>
          </div>

          <!-- Verify Button -->
          <ion-button id="verify-btn" expand="block" color="primary" style="margin-bottom: 16px;">
            Verificar Código
          </ion-button>

          <!-- Resend Code -->
          <div style="text-align: center;">
            <p style="font-size: 14px; color: var(--ion-color-medium); margin-bottom: 8px;">
              ¿No recibiste el código?
            </p>
            <ion-button id="resend-btn" fill="clear" size="small">
              Reenviar código
            </ion-button>
            <div id="resend-timer" style="font-size: 12px; color: var(--ion-color-medium); margin-top: 4px; display: none;">
              Podrás reenviar en <span id="timer-seconds">60</span>s
            </div>
          </div>

          <!-- Environment-specific Note -->
          <ion-card id="env-note-card" style="margin-top: 24px; background: var(--ion-color-light);">
            <ion-card-content style="padding: 12px;">
              <p id="env-note-text" style="font-size: 12px; color: var(--ion-color-medium); margin: 0;">
                <ion-icon name="information-circle" style="vertical-align: middle;"></ion-icon>
                <span id="env-note-content"></span>
              </p>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-content>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    // Wait for modal to be ready
    try {
      await modal.componentOnReady();
    } catch (e) {
      console.log('componentOnReady not available, continuing...');
    }

    // Update environment note
    this.updateEnvironmentNote();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Update environment note based on current environment
   */
  updateEnvironmentNote() {
    const noteContent = this.modal.querySelector('#env-note-content');
    const noteCard = this.modal.querySelector('#env-note-card');
    
    if (!noteContent || !noteCard) return;
    
    const isProduction = this.emailVerificationService.isProductionEnvironment();
    
    if (isProduction) {
      // Production mode
      noteContent.innerHTML = '<strong>Revisa tu bandeja de entrada</strong> y la carpeta de spam. El código fue enviado a tu correo electrónico.';
      noteCard.style.background = 'var(--ion-color-primary-tint)';
    } else {
      // Development mode
      noteContent.innerHTML = '<strong>Modo desarrollo:</strong> El código se muestra en la consola del navegador (F12)';
      noteCard.style.background = 'var(--ion-color-warning-tint)';
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Code inputs - auto-advance
    for (let i = 0; i < 6; i++) {
      const input = this.modal.querySelector(`#code-input-${i}`);
      
      input.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Only allow numbers
        if (!/^\d*$/.test(value)) {
          e.target.value = '';
          return;
        }
        
        // Auto-advance to next input
        if (value && i < 5) {
          const nextInput = this.modal.querySelector(`#code-input-${i + 1}`);
          if (nextInput) {
            nextInput.focus();
          }
        }
        
        // Clear error when typing
        this.clearError();
        
        // Auto-verify when all 6 digits entered
        if (i === 5 && value) {
          setTimeout(() => this.handleVerify(), 100);
        }
      });
      
      // Handle backspace
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && i > 0) {
          const prevInput = this.modal.querySelector(`#code-input-${i - 1}`);
          if (prevInput) {
            prevInput.focus();
            prevInput.value = '';
          }
        }
      });
      
      // Handle paste
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        // Only allow 6-digit numbers
        if (/^\d{6}$/.test(pastedData)) {
          for (let j = 0; j < 6; j++) {
            const input = this.modal.querySelector(`#code-input-${j}`);
            if (input) {
              input.value = pastedData[j];
            }
          }
          // Auto-verify
          setTimeout(() => this.handleVerify(), 100);
        }
      });
    }

    // Verify button
    const verifyBtn = this.modal.querySelector('#verify-btn');
    verifyBtn.addEventListener('click', () => this.handleVerify());

    // Resend button
    const resendBtn = this.modal.querySelector('#resend-btn');
    resendBtn.addEventListener('click', () => this.handleResend());
  }

  /**
   * Handle verification
   */
  async handleVerify() {
    // Get code from inputs
    let code = '';
    for (let i = 0; i < 6; i++) {
      const input = this.modal.querySelector(`#code-input-${i}`);
      code += input.value;
    }

    // Validate code length
    if (code.length !== 6) {
      this.showError('Por favor, ingresa los 6 dígitos del código');
      return;
    }

    // Show loading
    await LoadingManager.show('Verificando...');

    try {
      // Verify code
      const result = this.emailVerificationService.verifyCode(this.email, code);

      if (result.success) {
        // Code is valid! Complete registration
        const user = await this.completeRegistration(result.userData);
        
        await LoadingManager.hide();
        
        if (user) {
          ToastManager.showSuccess('¡Email verificado! Cuenta creada exitosamente.');
          
          // Close modal
          await this.modal.dismiss();
          
          // Call success callback
          if (this.onSuccess) {
            this.onSuccess(user);
          }
        }
      } else {
        await LoadingManager.hide();
        this.showError(result.error);
        
        // Clear inputs on error
        this.clearInputs();
      }
    } catch (error) {
      await LoadingManager.hide();
      console.error('Verification error:', error);
      this.showError('Error al verificar el código');
    }
  }

  /**
   * Complete registration after email verification
   */
  async completeRegistration(userData) {
    try {
      // Register user through AuthAdapter
      const user = await this.authAdapter.register(userData);
      
      // If taxista, create join request
      if (userData.rol === 'TAXISTA' && userData.codigoPatron) {
        await this.createJoinRequest(user, userData.codigoPatron);
      }
      
      return user;
    } catch (error) {
      console.error('Registration completion error:', error);
      throw error;
    }
  }

  /**
   * Create join request for taxista
   */
  async createJoinRequest(user, codigoInvitacion) {
    try {
      // Find patron by invitation code
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const patron = users.find(u => 
        u.rol === 'PATRON' && 
        u.codigoInvitacion === codigoInvitacion.toUpperCase()
      );

      if (!patron) {
        console.error('Patron not found for code:', codigoInvitacion);
        return;
      }

      // Create join request
      const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
      const request = {
        id: Date.now(),
        taxistaId: user.id,
        patronId: patron.id,
        estado: 'pendiente',
        fechaSolicitud: new Date().toISOString()
      };

      requests.push(request);
      localStorage.setItem('taxi_join_requests', JSON.stringify(requests));

      console.log('Join request created:', request);
    } catch (error) {
      console.error('Error creating join request:', error);
    }
  }

  /**
   * Handle resend code
   */
  async handleResend() {
    const resendBtn = this.modal.querySelector('#resend-btn');
    const timerDiv = this.modal.querySelector('#resend-timer');
    const timerSeconds = this.modal.querySelector('#timer-seconds');

    // Disable resend button
    resendBtn.disabled = true;
    timerDiv.style.display = 'block';

    // Show loading
    await LoadingManager.show('Reenviando código...');

    try {
      // Resend code
      const result = await this.emailVerificationService.resendCode(this.email);

      await LoadingManager.hide();

      if (result.success) {
        ToastManager.showSuccess('Código reenviado. Revisa tu correo.');
        
        // Clear inputs
        this.clearInputs();
        
        // Start countdown timer (60 seconds)
        let seconds = 60;
        timerSeconds.textContent = seconds;
        
        const countdown = setInterval(() => {
          seconds--;
          timerSeconds.textContent = seconds;
          
          if (seconds <= 0) {
            clearInterval(countdown);
            resendBtn.disabled = false;
            timerDiv.style.display = 'none';
          }
        }, 1000);
      } else {
        ToastManager.showError(result.error);
        resendBtn.disabled = false;
        timerDiv.style.display = 'none';
      }
    } catch (error) {
      await LoadingManager.hide();
      console.error('Resend error:', error);
      ToastManager.showError('Error al reenviar el código');
      resendBtn.disabled = false;
      timerDiv.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = this.modal.querySelector('#code-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Highlight inputs in red
    for (let i = 0; i < 6; i++) {
      const input = this.modal.querySelector(`#code-input-${i}`);
      input.style.borderColor = 'var(--ion-color-danger)';
    }
  }

  /**
   * Clear error message
   */
  clearError() {
    const errorDiv = this.modal.querySelector('#code-error');
    errorDiv.style.display = 'none';
    
    // Reset input borders
    for (let i = 0; i < 6; i++) {
      const input = this.modal.querySelector(`#code-input-${i}`);
      input.style.borderColor = 'var(--ion-color-medium)';
    }
  }

  /**
   * Clear all inputs
   */
  clearInputs() {
    for (let i = 0; i < 6; i++) {
      const input = this.modal.querySelector(`#code-input-${i}`);
      input.value = '';
    }
    
    // Focus first input
    const firstInput = this.modal.querySelector('#code-input-0');
    if (firstInput) {
      firstInput.focus();
    }
  }

  /**
   * Reset form
   */
  resetForm() {
    // Set email in display
    const emailDisplay = this.modal.querySelector('#verification-email');
    if (emailDisplay) {
      emailDisplay.textContent = this.email;
    }
    
    // Clear inputs
    this.clearInputs();
    
    // Clear error
    this.clearError();
    
    // Reset resend button
    const resendBtn = this.modal.querySelector('#resend-btn');
    const timerDiv = this.modal.querySelector('#resend-timer');
    if (resendBtn) resendBtn.disabled = false;
    if (timerDiv) timerDiv.style.display = 'none';
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.EmailVerificationModal = EmailVerificationModal;
}

console.log('EmailVerificationModal component loaded');
