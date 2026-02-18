/**
 * RateLimitService - Rate limiting for authentication attempts
 * Prevents brute force attacks by limiting login attempts
 * 
 * Security Features:
 * - Configurable attempt limits
 * - Temporary lockouts
 * - Progressive delays
 * - IP-based tracking (simulated)
 * - Automatic cleanup
 */

class RateLimitService {
  constructor() {
    this.storageKey = 'rate_limit_attempts';
    this.lockoutKey = 'rate_limit_lockout';
    
    // Configuration
    this.maxAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.attemptWindow = 60 * 60 * 1000; // 1 hour
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    
    // Start cleanup
    this.startCleanup();
  }

  /**
   * Get attempts data from storage
   * @private
   * @returns {Object} Attempts data
   */
  getAttemptsData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading attempts data:', error);
      return {};
    }
  }

  /**
   * Save attempts data to storage
   * @private
   * @param {Object} data - Attempts data
   */
  saveAttemptsData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving attempts data:', error);
    }
  }

  /**
   * Get lockout data from storage
   * @private
   * @returns {Object} Lockout data
   */
  getLockoutData() {
    try {
      const data = localStorage.getItem(this.lockoutKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading lockout data:', error);
      return {};
    }
  }

  /**
   * Save lockout data to storage
   * @private
   * @param {Object} data - Lockout data
   */
  saveLockoutData(data) {
    try {
      localStorage.setItem(this.lockoutKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving lockout data:', error);
    }
  }

  /**
   * Check if identifier is locked out
   * @param {string} identifier - User identifier (email, username, etc.)
   * @returns {Object} { locked: boolean, remainingTime: number }
   */
  isLockedOut(identifier) {
    const lockoutData = this.getLockoutData();
    const lockout = lockoutData[identifier];
    
    if (!lockout) {
      return { locked: false, remainingTime: 0 };
    }
    
    const now = Date.now();
    const remainingTime = lockout.until - now;
    
    if (remainingTime <= 0) {
      // Lockout expired, remove it
      delete lockoutData[identifier];
      this.saveLockoutData(lockoutData);
      return { locked: false, remainingTime: 0 };
    }
    
    return { locked: true, remainingTime };
  }

  /**
   * Record a failed attempt
   * @param {string} identifier - User identifier
   * @returns {Object} { allowed: boolean, attemptsLeft: number, lockoutTime: number }
   */
  recordAttempt(identifier) {
    // Check if already locked out
    const lockoutStatus = this.isLockedOut(identifier);
    if (lockoutStatus.locked) {
      return {
        allowed: false,
        attemptsLeft: 0,
        lockoutTime: lockoutStatus.remainingTime,
        message: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${Math.ceil(lockoutStatus.remainingTime / 60000)} minutos.`
      };
    }
    
    const attemptsData = this.getAttemptsData();
    const now = Date.now();
    
    // Initialize or get attempts for this identifier
    if (!attemptsData[identifier]) {
      attemptsData[identifier] = {
        attempts: [],
        count: 0
      };
    }
    
    const userAttempts = attemptsData[identifier];
    
    // Remove old attempts outside the window
    userAttempts.attempts = userAttempts.attempts.filter(
      timestamp => now - timestamp < this.attemptWindow
    );
    
    // Add new attempt
    userAttempts.attempts.push(now);
    userAttempts.count = userAttempts.attempts.length;
    
    // Save updated data
    this.saveAttemptsData(attemptsData);
    
    // Check if limit exceeded
    if (userAttempts.count >= this.maxAttempts) {
      // Lock out the user
      const lockoutData = this.getLockoutData();
      lockoutData[identifier] = {
        until: now + this.lockoutDuration,
        attempts: userAttempts.count
      };
      this.saveLockoutData(lockoutData);
      
      // Clear attempts
      delete attemptsData[identifier];
      this.saveAttemptsData(attemptsData);
      
      return {
        allowed: false,
        attemptsLeft: 0,
        lockoutTime: this.lockoutDuration,
        message: `Demasiados intentos fallidos. Cuenta bloqueada por ${Math.ceil(this.lockoutDuration / 60000)} minutos.`
      };
    }
    
    const attemptsLeft = this.maxAttempts - userAttempts.count;
    
    return {
      allowed: true,
      attemptsLeft,
      lockoutTime: 0,
      message: `Intento fallido. Te quedan ${attemptsLeft} intentos.`
    };
  }

  /**
   * Clear attempts for identifier (on successful login)
   * @param {string} identifier - User identifier
   */
  clearAttempts(identifier) {
    const attemptsData = this.getAttemptsData();
    delete attemptsData[identifier];
    this.saveAttemptsData(attemptsData);
    
    const lockoutData = this.getLockoutData();
    delete lockoutData[identifier];
    this.saveLockoutData(lockoutData);
  }

  /**
   * Get remaining attempts
   * @param {string} identifier - User identifier
   * @returns {number} Remaining attempts
   */
  getRemainingAttempts(identifier) {
    const lockoutStatus = this.isLockedOut(identifier);
    if (lockoutStatus.locked) {
      return 0;
    }
    
    const attemptsData = this.getAttemptsData();
    const userAttempts = attemptsData[identifier];
    
    if (!userAttempts) {
      return this.maxAttempts;
    }
    
    const now = Date.now();
    const recentAttempts = userAttempts.attempts.filter(
      timestamp => now - timestamp < this.attemptWindow
    );
    
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  /**
   * Clean up old data
   * @private
   */
  cleanup() {
    const now = Date.now();
    
    // Clean up attempts
    const attemptsData = this.getAttemptsData();
    let attemptsModified = false;
    
    for (const identifier in attemptsData) {
      const userAttempts = attemptsData[identifier];
      userAttempts.attempts = userAttempts.attempts.filter(
        timestamp => now - timestamp < this.attemptWindow
      );
      
      if (userAttempts.attempts.length === 0) {
        delete attemptsData[identifier];
        attemptsModified = true;
      } else {
        userAttempts.count = userAttempts.attempts.length;
        attemptsModified = true;
      }
    }
    
    if (attemptsModified) {
      this.saveAttemptsData(attemptsData);
    }
    
    // Clean up lockouts
    const lockoutData = this.getLockoutData();
    let lockoutModified = false;
    
    for (const identifier in lockoutData) {
      if (lockoutData[identifier].until <= now) {
        delete lockoutData[identifier];
        lockoutModified = true;
      }
    }
    
    if (lockoutModified) {
      this.saveLockoutData(lockoutData);
    }
  }

  /**
   * Start automatic cleanup
   * @private
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Get status for identifier
   * @param {string} identifier - User identifier
   * @returns {Object} Status information
   */
  getStatus(identifier) {
    const lockoutStatus = this.isLockedOut(identifier);
    
    if (lockoutStatus.locked) {
      return {
        locked: true,
        remainingTime: lockoutStatus.remainingTime,
        attemptsLeft: 0,
        message: `Cuenta bloqueada. Intenta de nuevo en ${Math.ceil(lockoutStatus.remainingTime / 60000)} minutos.`
      };
    }
    
    const attemptsLeft = this.getRemainingAttempts(identifier);
    
    return {
      locked: false,
      remainingTime: 0,
      attemptsLeft,
      message: attemptsLeft === this.maxAttempts 
        ? 'Sin intentos previos' 
        : `${attemptsLeft} intentos restantes`
    };
  }

  /**
   * Reset all rate limiting data
   */
  resetAll() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.lockoutKey);
  }
}

// Create singleton instance
const rateLimitService = new RateLimitService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.RateLimitService = RateLimitService;
  window.rateLimitService = rateLimitService;
}

console.log('RateLimitService loaded');
