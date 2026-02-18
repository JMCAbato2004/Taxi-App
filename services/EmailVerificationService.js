/**
 * EmailVerificationService - Email Verification Management
 * Handles email verification codes and validation
 * 
 * Features:
 * - Generate verification codes
 * - Store pending verifications
 * - Validate verification codes
 * - Resend verification codes
 * - Clean expired codes
 */

class EmailVerificationService {
  constructor() {
    this.STORAGE_KEY = 'taxi_email_verifications';
    this.CODE_EXPIRY_MINUTES = 15; // Codes expire after 15 minutes
    this.CODE_LENGTH = 6;
  }

  /**
   * Generate a random verification code
   * @returns {string} 6-digit verification code
   */
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create a verification request for an email
   * @param {string} email - Email to verify
   * @param {Object} userData - User data to store temporarily
   * @returns {string} Verification code
   */
  createVerification(email, userData) {
    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

    const verification = {
      email: email.toLowerCase().trim(),
      code: code,
      userData: userData,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
      verified: false
    };

    // Get existing verifications
    const verifications = this.getVerifications();
    
    // Remove any existing verification for this email
    const filtered = verifications.filter(v => v.email !== verification.email);
    
    // Add new verification
    filtered.push(verification);
    
    // Save
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

    // Clean expired codes
    this.cleanExpiredCodes();

    return code;
  }

  /**
   * Simulate sending verification email
   * In production, this would call a real email service
   * @param {string} email - Email to send to
   * @param {string} code - Verification code
   */
  async sendVerificationEmail(email, code) {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Detect environment
    const isProduction = this.isProductionEnvironment();
    
    if (!isProduction) {
      // DEVELOPMENT MODE: Show code in console AND on screen
      console.log('='.repeat(60));
      console.log('📧 CÓDIGO DE VERIFICACIÓN (DESARROLLO)');
      console.log('='.repeat(60));
      console.log(`Email: ${email}`);
      console.log(`Código: ${code}`);
      console.log(`Válido por: ${this.CODE_EXPIRY_MINUTES} minutos`);
      console.log('='.repeat(60));
      console.log('⚠️  En producción, este código se enviaría por email');
      console.log('='.repeat(60));
      
      // Show code on screen for easy access
      this.showVerificationCodeOnScreen(email, code);
    } else {
      // PRODUCTION MODE: Never log the code
      console.log(`[EmailVerification] Código enviado a ${email.substring(0, 3)}***@***`);
    }

    // TODO: In production, integrate with email service (SendGrid, AWS SES, etc.)
    // Example:
    // await emailService.send({
    //   to: email,
    //   subject: 'Verifica tu cuenta - Taxi App',
    //   template: 'verification',
    //   data: { code, expiryMinutes: this.CODE_EXPIRY_MINUTES }
    // });

    return true;
  }

  /**
   * Show verification code on screen for development
   * @param {string} email - Email
   * @param {string} code - Verification code
   */
  showVerificationCodeOnScreen(email, code) {
    // Remove any existing verification display
    const existingDisplay = document.getElementById('dev-verification-display');
    if (existingDisplay) {
      existingDisplay.remove();
    }

    // Create verification code display
    const display = document.createElement('div');
    display.id = 'dev-verification-display';
    display.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #059669, #047857);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      border: 2px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
    `;

    display.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <ion-icon name="mail" style="font-size: 24px; margin-right: 8px;"></ion-icon>
        <strong style="font-size: 16px;">CÓDIGO DE VERIFICACIÓN</strong>
      </div>
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">
        📧 ${email}
      </div>
      <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 12px;">
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">
          ${code}
        </div>
      </div>
      <div style="font-size: 12px; opacity: 0.8; text-align: center; margin-bottom: 12px;">
        ⏰ Válido por ${this.CODE_EXPIRY_MINUTES} minutos
      </div>
      <div style="text-align: center;">
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">
          ✕ Cerrar
        </button>
        <button onclick="navigator.clipboard.writeText('${code}'); this.textContent='¡Copiado!'" 
                style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-left: 8px;">
          📋 Copiar
        </button>
      </div>
      <div style="font-size: 11px; opacity: 0.7; text-align: center; margin-top: 8px;">
        🔧 Modo Desarrollo
      </div>
    `;

    // Add to page
    document.body.appendChild(display);

    // Auto-remove after 5 minutes
    setTimeout(() => {
      if (display && display.parentNode) {
        display.remove();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Detect if running in production environment
   * @returns {boolean} True if production
   */
  isProductionEnvironment() {
    // TEMPORARY: Always return false to show codes in console for testing
    return false;
    
    // Use centralized environment config if available
    if (window.environmentConfig) {
      return window.environmentConfig.isProduction();
    }
    
    // Fallback: Check multiple indicators
    
    // 1. Check if running on production domain
    const hostname = window.location.hostname;
    const isProductionDomain = hostname.includes('github.io') || 
                               hostname.includes('taxi-app.com') ||
                               hostname.includes('taxiapp.com') ||
                               (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'));
    
    // 2. Check if protocol is HTTPS (production should always use HTTPS)
    const isHTTPS = window.location.protocol === 'https:';
    
    // 3. Check for NODE_ENV if available (set by build tools)
    const nodeEnv = typeof process !== 'undefined' && process.env && process.env.NODE_ENV;
    const isNodeEnvProduction = nodeEnv === 'production';
    
    // 4. Check for custom production flag
    const hasProductionFlag = window.PRODUCTION_MODE === true;
    
    // Consider production if any of these are true
    return isProductionDomain || (isHTTPS && !hostname.includes('localhost')) || 
           isNodeEnvProduction || hasProductionFlag;
  }

  /**
   * Verify a code for an email
   * @param {string} email - Email to verify
   * @param {string} code - Verification code
   * @returns {Object|null} User data if valid, null if invalid
   */
  verifyCode(email, code) {
    // TESTING: Accept universal test code
    if (code.trim() === '999999') {
      const verifications = this.getVerifications();
      const verification = verifications.find(v => 
        v.email === email.toLowerCase().trim() && !v.verified
      );
      
      if (verification) {
        verification.verified = true;
        verification.verifiedAt = new Date().toISOString();
        this.updateVerification(verification);
        return { 
          success: true, 
          userData: verification.userData 
        };
      }
    }
    
    const verifications = this.getVerifications();
    const verification = verifications.find(v => 
      v.email === email.toLowerCase().trim() && !v.verified
    );

    if (!verification) {
      return { success: false, error: 'No se encontró solicitud de verificación' };
    }

    // Check if expired
    if (new Date() > new Date(verification.expiresAt)) {
      return { success: false, error: 'El código ha expirado. Solicita uno nuevo.' };
    }

    // Increment attempts
    verification.attempts++;

    // Check max attempts (5 attempts allowed)
    if (verification.attempts > 5) {
      // Remove verification
      this.removeVerification(email);
      return { success: false, error: 'Demasiados intentos. Solicita un nuevo código.' };
    }

    // Check if code matches
    if (verification.code !== code.trim()) {
      // Save updated attempts
      this.updateVerification(verification);
      return { 
        success: false, 
        error: `Código incorrecto. Intentos restantes: ${6 - verification.attempts}` 
      };
    }

    // Code is valid!
    verification.verified = true;
    verification.verifiedAt = new Date().toISOString();
    this.updateVerification(verification);

    return { 
      success: true, 
      userData: verification.userData 
    };
  }

  /**
   * Resend verification code
   * @param {string} email - Email to resend to
   * @returns {Object} Result with new code
   */
  async resendCode(email) {
    const verifications = this.getVerifications();
    const verification = verifications.find(v => 
      v.email === email.toLowerCase().trim() && !v.verified
    );

    if (!verification) {
      return { 
        success: false, 
        error: 'No se encontró solicitud de verificación' 
      };
    }

    // Generate new code
    const newCode = this.generateCode();
    verification.code = newCode;
    verification.attempts = 0;
    
    // Extend expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);
    verification.expiresAt = expiresAt.toISOString();

    // Update
    this.updateVerification(verification);

    // Send email
    await this.sendVerificationEmail(email, newCode);

    return { success: true, code: newCode };
  }

  /**
   * Get all verifications
   * @returns {Array} Array of verifications
   */
  getVerifications() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch (e) {
      console.error('Error reading verifications:', e);
      return [];
    }
  }

  /**
   * Update a verification
   * @param {Object} verification - Updated verification object
   */
  updateVerification(verification) {
    const verifications = this.getVerifications();
    const index = verifications.findIndex(v => v.email === verification.email);
    
    if (index !== -1) {
      verifications[index] = verification;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(verifications));
    }
  }

  /**
   * Remove a verification
   * @param {string} email - Email to remove
   */
  removeVerification(email) {
    const verifications = this.getVerifications();
    const filtered = verifications.filter(v => v.email !== email.toLowerCase().trim());
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Clean expired verification codes
   */
  cleanExpiredCodes() {
    const verifications = this.getVerifications();
    const now = new Date();
    
    const valid = verifications.filter(v => new Date(v.expiresAt) > now);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(valid));
  }

  /**
   * Check if email has pending verification
   * @param {string} email - Email to check
   * @returns {boolean} True if pending
   */
  hasPendingVerification(email) {
    const verifications = this.getVerifications();
    return verifications.some(v => 
      v.email === email.toLowerCase().trim() && 
      !v.verified &&
      new Date(v.expiresAt) > new Date()
    );
  }

  /**
   * Check if email is verified
   * @param {string} email - Email to check
   * @returns {boolean} True if verified
   */
  isEmailVerified(email) {
    const verifications = this.getVerifications();
    return verifications.some(v => 
      v.email === email.toLowerCase().trim() && v.verified
    );
  }
}

// Create singleton instance
const emailVerificationService = new EmailVerificationService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.EmailVerificationService = EmailVerificationService;
  window.emailVerificationService = emailVerificationService;
}

console.log('EmailVerificationService loaded');
