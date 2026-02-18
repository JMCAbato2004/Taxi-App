/**
 * SessionService - Session Management with Auto-Timeout
 * Manages user sessions with automatic timeout and activity tracking
 * 
 * Security Features:
 * - Automatic session timeout (30 minutes of inactivity)
 * - Activity tracking (mouse, keyboard, touch events)
 * - Warning before timeout (2 minutes)
 * - Secure session cleanup
 * - Session validation
 */

class SessionService {
  constructor() {
    // Configuration
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
    this.warningTime = 2 * 60 * 1000; // 2 minutes before timeout
    this.checkInterval = 60 * 1000; // Check every minute
    
    // State
    this.lastActivity = Date.now();
    this.sessionActive = false;
    this.timeoutTimer = null;
    this.checkTimer = null;
    this.warningShown = false;
    
    // Callbacks
    this.onTimeout = null;
    this.onWarning = null;
    this.onActivity = null;
    
    // Activity events to track
    this.activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];
    
    // Bind methods
    this.handleActivity = this.handleActivity.bind(this);
    this.checkSession = this.checkSession.bind(this);
  }

  /**
   * Start session monitoring
   * @param {Object} callbacks - { onTimeout, onWarning, onActivity }
   */
  start(callbacks = {}) {
    if (this.sessionActive) {
      console.warn('Session already active');
      return;
    }
    
    // Set callbacks
    this.onTimeout = callbacks.onTimeout || null;
    this.onWarning = callbacks.onWarning || null;
    this.onActivity = callbacks.onActivity || null;
    
    // Initialize
    this.lastActivity = Date.now();
    this.sessionActive = true;
    this.warningShown = false;
    
    // Attach activity listeners
    this.attachActivityListeners();
    
    // Start checking session
    this.checkTimer = setInterval(this.checkSession, this.checkInterval);
    
    console.log('SessionService started - timeout:', this.sessionTimeout / 60000, 'minutes');
  }

  /**
   * Stop session monitoring
   */
  stop() {
    if (!this.sessionActive) {
      return;
    }
    
    // Remove activity listeners
    this.removeActivityListeners();
    
    // Clear timers
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    
    // Reset state
    this.sessionActive = false;
    this.warningShown = false;
    
    console.log('SessionService stopped');
  }

  /**
   * Attach activity event listeners
   * @private
   */
  attachActivityListeners() {
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity, true);
    });
  }

  /**
   * Remove activity event listeners
   * @private
   */
  removeActivityListeners() {
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleActivity, true);
    });
  }

  /**
   * Handle user activity
   * @private
   */
  handleActivity() {
    if (!this.sessionActive) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    
    // Only update if more than 1 second has passed (avoid excessive updates)
    if (timeSinceLastActivity > 1000) {
      this.lastActivity = now;
      this.warningShown = false;
      
      // Call activity callback if provided
      if (this.onActivity) {
        this.onActivity(this.getRemainingTime());
      }
    }
  }

  /**
   * Check session status
   * @private
   */
  checkSession() {
    if (!this.sessionActive) {
      return;
    }
    
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    const remainingTime = this.sessionTimeout - inactiveTime;
    
    // Session expired
    if (remainingTime <= 0) {
      this.handleTimeout();
      return;
    }
    
    // Show warning if approaching timeout
    if (remainingTime <= this.warningTime && !this.warningShown) {
      this.handleWarning(remainingTime);
    }
  }

  /**
   * Handle session timeout
   * @private
   */
  handleTimeout() {
    console.warn('Session timeout - logging out');
    
    // Stop monitoring
    this.stop();
    
    // Call timeout callback
    if (this.onTimeout) {
      this.onTimeout();
    }
  }

  /**
   * Handle timeout warning
   * @private
   * @param {number} remainingTime - Time remaining in milliseconds
   */
  handleWarning(remainingTime) {
    this.warningShown = true;
    
    console.warn('Session timeout warning -', Math.ceil(remainingTime / 60000), 'minutes remaining');
    
    // Call warning callback
    if (this.onWarning) {
      this.onWarning(remainingTime);
    }
  }

  /**
   * Get remaining session time
   * @returns {number} Remaining time in milliseconds
   */
  getRemainingTime() {
    if (!this.sessionActive) {
      return 0;
    }
    
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    const remainingTime = this.sessionTimeout - inactiveTime;
    
    return Math.max(0, remainingTime);
  }

  /**
   * Get remaining time in minutes
   * @returns {number} Remaining time in minutes
   */
  getRemainingMinutes() {
    return Math.ceil(this.getRemainingTime() / 60000);
  }

  /**
   * Extend session (reset activity timer)
   */
  extendSession() {
    if (!this.sessionActive) {
      return;
    }
    
    this.lastActivity = Date.now();
    this.warningShown = false;
    
    console.log('Session extended');
  }

  /**
   * Check if session is active
   * @returns {boolean} True if session is active
   */
  isActive() {
    return this.sessionActive;
  }

  /**
   * Get session status
   * @returns {Object} Session status information
   */
  getStatus() {
    if (!this.sessionActive) {
      return {
        active: false,
        remainingTime: 0,
        remainingMinutes: 0,
        warningShown: false
      };
    }
    
    const remainingTime = this.getRemainingTime();
    
    return {
      active: true,
      remainingTime: remainingTime,
      remainingMinutes: Math.ceil(remainingTime / 60000),
      warningShown: this.warningShown,
      lastActivity: new Date(this.lastActivity).toISOString()
    };
  }

  /**
   * Update session timeout duration
   * @param {number} minutes - New timeout in minutes
   */
  setTimeoutDuration(minutes) {
    if (minutes < 1 || minutes > 120) {
      console.error('Invalid timeout duration. Must be between 1 and 120 minutes');
      return;
    }
    
    this.sessionTimeout = minutes * 60 * 1000;
    this.warningTime = Math.min(2 * 60 * 1000, this.sessionTimeout / 10); // 2 min or 10% of timeout
    
    console.log('Session timeout updated to', minutes, 'minutes');
  }

  /**
   * Validate session token
   * @param {string} token - Session token to validate
   * @returns {boolean} True if token is valid
   */
  validateToken(token) {
    if (!token) {
      return false;
    }
    
    // Check if token is expired (using TokenService if available)
    if (window.tokenService) {
      try {
        const payload = window.tokenService.verifyToken(token);
        return !!payload;
      } catch (error) {
        console.error('Token validation failed:', error);
        return false;
      }
    }
    
    // Fallback: basic validation
    return token.length > 0;
  }

  /**
   * Clear session data
   */
  clearSession() {
    // Clear from secure storage if available
    if (window.secureStorageService) {
      window.secureStorageService.clearAuthData();
    }
    
    // Clear from localStorage
    localStorage.removeItem('taxi_auth_current_user');
    localStorage.removeItem('taxi_auth_current_token');
    localStorage.removeItem('taxi_auth_permissions');
    
    // Clear from sessionStorage
    sessionStorage.clear();
    
    console.log('Session data cleared');
  }
}

// Create singleton instance
const sessionService = new SessionService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SessionService = SessionService;
  window.sessionService = sessionService;
}

console.log('SessionService loaded');

