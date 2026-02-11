/**
 * Logger Utility
 * Secure logging with environment-based control
 * 
 * Features:
 * - Environment detection (development/production)
 * - Log levels (debug, info, warn, error)
 * - Automatic log suppression in production
 * - Structured logging
 * - Error tracking
 */

class Logger {
  constructor() {
    // Detect environment
    this.isDevelopment = this.detectEnvironment();
    
    // Log levels
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    };
    
    // Current log level (INFO in production, DEBUG in development)
    this.currentLevel = this.isDevelopment ? this.levels.DEBUG : this.levels.INFO;
    
    // Error history (keep last 50 errors)
    this.errorHistory = [];
    this.maxErrorHistory = 50;
    
    // Performance tracking
    this.performanceMarks = new Map();
    
    console.log(`Logger initialized - Environment: ${this.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  }

  /**
   * Detect environment
   * @private
   * @returns {boolean} True if development environment
   */
  detectEnvironment() {
    // Check various environment indicators
    
    // 1. Check hostname
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168')) {
      return true;
    }
    
    // 2. Check for development port
    const port = window.location.port;
    if (port && (port === '3000' || port === '8080' || port === '5173' || port === '4200')) {
      return true;
    }
    
    // 3. Check for file:// protocol (local development)
    if (window.location.protocol === 'file:') {
      return true;
    }
    
    // 4. Check for explicit environment variable (if available)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }
    
    // 5. Check for debug flag in localStorage
    if (localStorage.getItem('debug_mode') === 'true') {
      return true;
    }
    
    // Default to production for safety
    return false;
  }

  /**
   * Check if logging is enabled for a level
   * @private
   * @param {number} level - Log level to check
   * @returns {boolean} True if logging is enabled
   */
  isLevelEnabled(level) {
    return level >= this.currentLevel;
  }

  /**
   * Format log message
   * @private
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Additional data
   * @returns {string} Formatted message
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${level}] ${message}`;
    
    if (data !== undefined) {
      formatted += ' ' + JSON.stringify(data, null, 2);
    }
    
    return formatted;
  }

  /**
   * Log debug message (only in development)
   * @param {string} message - Debug message
   * @param {*} data - Additional data
   */
  debug(message, data) {
    if (!this.isLevelEnabled(this.levels.DEBUG)) {
      return;
    }
    
    if (this.isDevelopment) {
      if (data !== undefined) {
        console.log(`🔍 ${message}`, data);
      } else {
        console.log(`🔍 ${message}`);
      }
    }
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {*} data - Additional data
   */
  info(message, data) {
    if (!this.isLevelEnabled(this.levels.INFO)) {
      return;
    }
    
    if (this.isDevelopment) {
      if (data !== undefined) {
        console.info(`ℹ️ ${message}`, data);
      } else {
        console.info(`ℹ️ ${message}`);
      }
    }
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {*} data - Additional data
   */
  warn(message, data) {
    if (!this.isLevelEnabled(this.levels.WARN)) {
      return;
    }
    
    if (data !== undefined) {
      console.warn(`⚠️ ${message}`, data);
    } else {
      console.warn(`⚠️ ${message}`);
    }
  }

  /**
   * Log error message (always logged)
   * @param {string} message - Error message
   * @param {Error|*} error - Error object or data
   */
  error(message, error) {
    // Always log errors, even in production
    if (error instanceof Error) {
      console.error(`❌ ${message}`, error);
      
      // Store in error history
      this.addToErrorHistory({
        message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        timestamp: new Date().toISOString()
      });
    } else if (error !== undefined) {
      console.error(`❌ ${message}`, error);
      
      // Store in error history
      this.addToErrorHistory({
        message,
        data: error,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ ${message}`);
      
      // Store in error history
      this.addToErrorHistory({
        message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Add error to history
   * @private
   * @param {Object} errorData - Error data
   */
  addToErrorHistory(errorData) {
    this.errorHistory.push(errorData);
    
    // Keep only last N errors
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }
  }

  /**
   * Get error history
   * @returns {Array} Error history
   */
  getErrorHistory() {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }

  /**
   * Start performance measurement
   * @param {string} label - Performance mark label
   */
  startPerformance(label) {
    if (!this.isDevelopment) {
      return;
    }
    
    this.performanceMarks.set(label, performance.now());
    this.debug(`Performance start: ${label}`);
  }

  /**
   * End performance measurement
   * @param {string} label - Performance mark label
   * @returns {number} Duration in milliseconds
   */
  endPerformance(label) {
    if (!this.isDevelopment) {
      return 0;
    }
    
    const startTime = this.performanceMarks.get(label);
    if (!startTime) {
      this.warn(`Performance mark not found: ${label}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.performanceMarks.delete(label);
    
    this.debug(`Performance end: ${label} - ${duration.toFixed(2)}ms`);
    
    return duration;
  }

  /**
   * Log security event (always logged)
   * @param {string} event - Security event type
   * @param {Object} details - Event details
   */
  security(event, details) {
    // Always log security events
    const message = `🔒 Security Event: ${event}`;
    
    if (this.isDevelopment) {
      console.log(message, details);
    } else {
      // In production, log to console but with minimal details
      console.log(message);
    }
    
    // Store in error history for review
    this.addToErrorHistory({
      type: 'security',
      event,
      details: this.isDevelopment ? details : { event }, // Minimal details in production
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Set log level
   * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
   */
  setLevel(level) {
    const upperLevel = level.toUpperCase();
    if (this.levels[upperLevel] !== undefined) {
      this.currentLevel = this.levels[upperLevel];
      this.info(`Log level set to: ${upperLevel}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Enable debug mode (for production debugging)
   */
  enableDebugMode() {
    localStorage.setItem('debug_mode', 'true');
    this.isDevelopment = true;
    this.currentLevel = this.levels.DEBUG;
    console.log('🔧 Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode() {
    localStorage.removeItem('debug_mode');
    this.isDevelopment = this.detectEnvironment();
    this.currentLevel = this.isDevelopment ? this.levels.DEBUG : this.levels.INFO;
    console.log('🔧 Debug mode disabled');
  }

  /**
   * Get logger status
   * @returns {Object} Logger status
   */
  getStatus() {
    return {
      environment: this.isDevelopment ? 'development' : 'production',
      currentLevel: Object.keys(this.levels).find(key => this.levels[key] === this.currentLevel),
      errorCount: this.errorHistory.length,
      debugMode: localStorage.getItem('debug_mode') === 'true'
    };
  }
}

// Create singleton instance
const logger = new Logger();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.Logger = Logger;
  window.logger = logger;
}

// Replace console methods in production (optional - commented out for safety)
// if (!logger.isDevelopment) {
//   const noop = () => {};
//   console.log = noop;
//   console.debug = noop;
//   console.info = noop;
// }

console.log('Logger utility loaded');

