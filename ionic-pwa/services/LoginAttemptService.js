/**
 * LoginAttemptService - Brute Force Protection
 * Tracks login attempts and implements account lockout
 * 
 * Features:
 * - Track failed login attempts per email
 * - Progressive delays after failed attempts
 * - Temporary account lockout after max attempts
 * - Automatic unlock after lockout period
 * - IP-based tracking (simulated in frontend)
 * - Suspicious activity detection
 */

class LoginAttemptService {
  constructor() {
    // Storage key
    this.STORAGE_KEY = 'taxi_login_attempts';
    
    // Configuration
    this.MAX_ATTEMPTS = 5; // Maximum failed attempts before lockout
    this.LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
    this.ATTEMPT_WINDOW = 30 * 60 * 1000; // 30 minutes window for attempts
    this.PROGRESSIVE_DELAY_BASE = 2000; // Base delay in ms (2 seconds)
    
    // Warning thresholds
    this.WARNING_THRESHOLD = 3; // Show warning after 3 attempts
    
    // Load attempts from storage
    this.attempts = this.loadAttempts();
    
    // Clean expired attempts periodically
    this.startCleanupInterval();
  }

  /**
   * Load attempts from storage
   * @returns {Map} Map of email to attempt data
   */
  loadAttempts() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Error loading login attempts:', error);
    }
    return new Map();
  }

  /**
   * Save attempts to storage
   */
  saveAttempts() {
    try {
      const data = Object.fromEntries(this.attempts);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving login attempts:', error);
    }
  }

  /**
   * Check if user can attempt login
   * @param {string} email - User email
   * @returns {Object} { allowed: boolean, reason: string, remainingAttempts: number, lockoutEndsAt: Date }
   */
  canAttemptLogin(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const record = this.attempts.get(normalizedEmail);

    if (!record) {
      return {
        allowed: true,
        remainingAttempts: this.MAX_ATTEMPTS
      };
    }

    // Check if account is locked
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      return {
        allowed: false,
        reason: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''}.`,
        lockoutEndsAt: new Date(record.lockedUntil),
        remainingAttempts: 0
      };
    }

    // Check if attempts are within the window
    const recentAttempts = this.getRecentAttempts(record);
    
    if (recentAttempts >= this.MAX_ATTEMPTS) {
      // Lock the account
      record.lockedUntil = Date.now() + this.LOCKOUT_DURATION;
      this.saveAttempts();
      
      const minutesLeft = Math.ceil(this.LOCKOUT_DURATION / 60000);
      return {
        allowed: false,
        reason: `Demasiados intentos fallidos. Cuenta bloqueada por ${minutesLeft} minutos.`,
        lockoutEndsAt: new Date(record.lockedUntil),
        remainingAttempts: 0
      };
    }

    const remainingAttempts = this.MAX_ATTEMPTS - recentAttempts;
    
    return {
      allowed: true,
      remainingAttempts: remainingAttempts,
      warning: recentAttempts >= this.WARNING_THRESHOLD 
        ? `Quedan ${remainingAttempts} intento${remainingAttempts !== 1 ? 's' : ''} antes del bloqueo.`
        : null
    };
  }

  /**
   * Get recent attempts count within the attempt window
   * @param {Object} record - Attempt record
   * @returns {number} Number of recent attempts
   */
  getRecentAttempts(record) {
    if (!record.attemptTimestamps) {
      return 0;
    }

    const cutoffTime = Date.now() - this.ATTEMPT_WINDOW;
    return record.attemptTimestamps.filter(timestamp => timestamp > cutoffTime).length;
  }

  /**
   * Record a failed login attempt
   * @param {string} email - User email
   * @param {Object} context - Additional context (IP, user agent, etc.)
   */
  recordFailedAttempt(email, context = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    let record = this.attempts.get(normalizedEmail);

    if (!record) {
      record = {
        email: normalizedEmail,
        attemptTimestamps: [],
        failedCount: 0,
        firstAttempt: Date.now(),
        lastAttempt: Date.now(),
        lockedUntil: null,
        suspiciousActivity: []
      };
    }

    // Update record
    record.attemptTimestamps.push(Date.now());
    record.failedCount++;
    record.lastAttempt = Date.now();

    // Track suspicious activity
    if (context.userAgent) {
      record.suspiciousActivity.push({
        timestamp: Date.now(),
        userAgent: context.userAgent,
        type: 'failed_login'
      });
    }

    // Check if should lock
    const recentAttempts = this.getRecentAttempts(record);
    if (recentAttempts >= this.MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + this.LOCKOUT_DURATION;
      console.warn(`Account locked for ${normalizedEmail} due to too many failed attempts`);
    }

    this.attempts.set(normalizedEmail, record);
    this.saveAttempts();

    // Log security event
    this.logSecurityEvent('failed_login_attempt', {
      email: normalizedEmail,
      attemptCount: recentAttempts,
      locked: !!record.lockedUntil
    });
  }

  /**
   * Record a successful login
   * @param {string} email - User email
   */
  recordSuccessfulLogin(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Clear attempts for this email
    this.attempts.delete(normalizedEmail);
    this.saveAttempts();

    // Log security event
    this.logSecurityEvent('successful_login', {
      email: normalizedEmail
    });
  }

  /**
   * Calculate progressive delay based on attempt count
   * @param {string} email - User email
   * @returns {number} Delay in milliseconds
   */
  getProgressiveDelay(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const record = this.attempts.get(normalizedEmail);

    if (!record) {
      return 0;
    }

    const recentAttempts = this.getRecentAttempts(record);
    
    if (recentAttempts === 0) {
      return 0;
    }

    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    const delay = this.PROGRESSIVE_DELAY_BASE * Math.pow(2, recentAttempts - 1);
    
    // Cap at 1 minute
    return Math.min(delay, 60000);
  }

  /**
   * Apply progressive delay before allowing next attempt
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async applyProgressiveDelay(email) {
    const delay = this.getProgressiveDelay(email);
    
    if (delay > 0) {
      console.log(`Applying progressive delay of ${delay}ms for ${email}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Manually unlock an account (admin function)
   * @param {string} email - User email
   */
  unlockAccount(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const record = this.attempts.get(normalizedEmail);

    if (record) {
      record.lockedUntil = null;
      record.attemptTimestamps = [];
      this.saveAttempts();
      
      console.log(`Account manually unlocked: ${normalizedEmail}`);
      
      this.logSecurityEvent('account_unlocked', {
        email: normalizedEmail,
        manual: true
      });
    }
  }

  /**
   * Get attempt statistics for an email
   * @param {string} email - User email
   * @returns {Object} Attempt statistics
   */
  getAttemptStats(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const record = this.attempts.get(normalizedEmail);

    if (!record) {
      return {
        hasAttempts: false,
        failedCount: 0,
        recentAttempts: 0,
        isLocked: false
      };
    }

    const recentAttempts = this.getRecentAttempts(record);
    const isLocked = record.lockedUntil && Date.now() < record.lockedUntil;

    return {
      hasAttempts: true,
      failedCount: record.failedCount,
      recentAttempts: recentAttempts,
      isLocked: isLocked,
      lockedUntil: isLocked ? new Date(record.lockedUntil) : null,
      firstAttempt: new Date(record.firstAttempt),
      lastAttempt: new Date(record.lastAttempt),
      remainingAttempts: Math.max(0, this.MAX_ATTEMPTS - recentAttempts)
    };
  }

  /**
   * Clean expired attempts and lockouts
   */
  cleanExpiredAttempts() {
    const now = Date.now();
    let cleaned = 0;

    for (const [email, record] of this.attempts.entries()) {
      // Remove if lockout expired and no recent attempts
      if (record.lockedUntil && now > record.lockedUntil) {
        const recentAttempts = this.getRecentAttempts(record);
        if (recentAttempts === 0) {
          this.attempts.delete(email);
          cleaned++;
        } else {
          // Clear lockout but keep recent attempts
          record.lockedUntil = null;
        }
      }
      
      // Remove old attempt timestamps
      if (record.attemptTimestamps) {
        const cutoffTime = now - this.ATTEMPT_WINDOW;
        record.attemptTimestamps = record.attemptTimestamps.filter(
          timestamp => timestamp > cutoffTime
        );
        
        // If no recent attempts, remove record
        if (record.attemptTimestamps.length === 0) {
          this.attempts.delete(email);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      this.saveAttempts();
      console.log(`Cleaned ${cleaned} expired login attempt records`);
    }
  }

  /**
   * Start periodic cleanup of expired attempts
   */
  startCleanupInterval() {
    // Clean every 5 minutes
    setInterval(() => {
      this.cleanExpiredAttempts();
    }, 5 * 60 * 1000);
  }

  /**
   * Log security event
   * @param {string} eventType - Type of security event
   * @param {Object} data - Event data
   */
  logSecurityEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: data,
      userAgent: navigator.userAgent
    };

    // In production, send to backend security logging service
    console.log('[Security Event]', event);

    // Store in local security log (limited to last 100 events)
    try {
      const securityLog = JSON.parse(localStorage.getItem('taxi_security_log') || '[]');
      securityLog.push(event);
      
      // Keep only last 100 events
      if (securityLog.length > 100) {
        securityLog.shift();
      }
      
      localStorage.setItem('taxi_security_log', JSON.stringify(securityLog));
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Get all security events
   * @returns {Array} Security events
   */
  getSecurityLog() {
    try {
      return JSON.parse(localStorage.getItem('taxi_security_log') || '[]');
    } catch (error) {
      console.error('Error reading security log:', error);
      return [];
    }
  }

  /**
   * Clear all attempt records (admin function)
   */
  clearAllAttempts() {
    this.attempts.clear();
    this.saveAttempts();
    console.log('All login attempt records cleared');
  }

  /**
   * Get global statistics
   * @returns {Object} Global statistics
   */
  getGlobalStats() {
    let totalAttempts = 0;
    let lockedAccounts = 0;
    let accountsWithAttempts = 0;

    for (const [email, record] of this.attempts.entries()) {
      accountsWithAttempts++;
      totalAttempts += record.failedCount;
      
      if (record.lockedUntil && Date.now() < record.lockedUntil) {
        lockedAccounts++;
      }
    }

    return {
      accountsWithAttempts,
      totalAttempts,
      lockedAccounts,
      maxAttempts: this.MAX_ATTEMPTS,
      lockoutDurationMinutes: this.LOCKOUT_DURATION / 60000
    };
  }
}

// Create singleton instance
const loginAttemptService = new LoginAttemptService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.LoginAttemptService = LoginAttemptService;
  window.loginAttemptService = loginAttemptService;
}

console.log('LoginAttemptService loaded');
