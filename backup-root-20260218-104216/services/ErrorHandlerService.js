/**
 * ErrorHandlerService - Secure Error Handling
 * Handles errors securely without exposing sensitive information
 * 
 * Security Features:
 * - Sanitized error messages for users
 * - Detailed logging for developers (development only)
 * - Error categorization
 * - Automatic error reporting
 * - Stack trace sanitization
 */

class ErrorHandlerService {
  constructor() {
    // Error categories
    this.categories = {
      AUTHENTICATION: 'authentication',
      AUTHORIZATION: 'authorization',
      VALIDATION: 'validation',
      NETWORK: 'network',
      DATABASE: 'database',
      UNKNOWN: 'unknown'
    };
    
    // User-friendly error messages (no sensitive info)
    this.userMessages = {
      authentication: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
      authorization: 'No tienes permisos para realizar esta acción.',
      validation: 'Los datos ingresados no son válidos. Por favor, verifica e intenta de nuevo.',
      network: 'Error de conexión. Por favor, verifica tu conexión a internet.',
      database: 'Error al procesar la solicitud. Por favor, intenta de nuevo.',
      unknown: 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.'
    };
    
    // Error statistics
    this.errorStats = {
      total: 0,
      byCategory: {},
      lastError: null
    };
    
    // Initialize categories
    Object.values(this.categories).forEach(category => {
      this.errorStats.byCategory[category] = 0;
    });
    
    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  /**
   * Setup global error handlers
   * @private
   */
  setupGlobalHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error || event.message, 'Uncaught Error');
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(event.reason, 'Unhandled Promise Rejection');
    });
    
    console.log('ErrorHandlerService: Global error handlers installed');
  }

  /**
   * Handle global errors
   * @private
   * @param {Error|string} error - Error object or message
   * @param {string} context - Error context
   */
  handleGlobalError(error, context) {
    // Log to logger if available
    if (window.logger) {
      window.logger.error(`${context}:`, error);
    } else {
      console.error(`${context}:`, error);
    }
    
    // Categorize and handle
    const category = this.categorizeError(error);
    this.recordError(category, error);
    
    // Show user-friendly message
    if (window.ToastManager) {
      const userMessage = this.getUserMessage(category);
      window.ToastManager.showError(userMessage);
    }
  }

  /**
   * Handle error with context
   * @param {Error|string} error - Error object or message
   * @param {string} context - Error context (e.g., 'Login', 'CreateService')
   * @param {Object} options - Additional options
   * @returns {Object} Processed error information
   */
  handle(error, context = 'Unknown', options = {}) {
    const {
      showToUser = true,
      category = null,
      logToConsole = true
    } = options;
    
    // Categorize error
    const errorCategory = category || this.categorizeError(error);
    
    // Record error
    this.recordError(errorCategory, error, context);
    
    // Log error
    if (logToConsole) {
      if (window.logger) {
        window.logger.error(`Error in ${context}:`, error);
      } else {
        console.error(`Error in ${context}:`, error);
      }
    }
    
    // Get user-friendly message
    const userMessage = this.getUserMessage(errorCategory, error);
    
    // Show to user if requested
    if (showToUser && window.ToastManager) {
      window.ToastManager.showError(userMessage);
    }
    
    return {
      category: errorCategory,
      userMessage,
      originalError: error,
      context
    };
  }

  /**
   * Categorize error
   * @private
   * @param {Error|string} error - Error to categorize
   * @returns {string} Error category
   */
  categorizeError(error) {
    if (!error) {
      return this.categories.UNKNOWN;
    }
    
    const errorMessage = typeof error === 'string' ? error : error.message || '';
    const errorLower = errorMessage.toLowerCase();
    
    // Authentication errors
    if (errorLower.includes('auth') || 
        errorLower.includes('login') || 
        errorLower.includes('token') ||
        errorLower.includes('sesión') ||
        errorLower.includes('contraseña')) {
      return this.categories.AUTHENTICATION;
    }
    
    // Authorization errors
    if (errorLower.includes('permiso') || 
        errorLower.includes('autoriza') ||
        errorLower.includes('forbidden') ||
        errorLower.includes('unauthorized')) {
      return this.categories.AUTHORIZATION;
    }
    
    // Validation errors
    if (errorLower.includes('validación') || 
        errorLower.includes('inválido') ||
        errorLower.includes('requerido') ||
        errorLower.includes('validation') ||
        errorLower.includes('invalid')) {
      return this.categories.VALIDATION;
    }
    
    // Network errors
    if (errorLower.includes('network') || 
        errorLower.includes('conexión') ||
        errorLower.includes('fetch') ||
        errorLower.includes('timeout')) {
      return this.categories.NETWORK;
    }
    
    // Database errors
    if (errorLower.includes('database') || 
        errorLower.includes('storage') ||
        errorLower.includes('indexeddb')) {
      return this.categories.DATABASE;
    }
    
    return this.categories.UNKNOWN;
  }

  /**
   * Get user-friendly error message
   * @private
   * @param {string} category - Error category
   * @param {Error|string} error - Original error
   * @returns {string} User-friendly message
   */
  getUserMessage(category, error) {
    // Check if error has a user-friendly message
    if (error && typeof error === 'object' && error.userMessage) {
      return error.userMessage;
    }
    
    // Check if error message is already user-friendly (no technical details)
    if (error && typeof error === 'string' && this.isUserFriendly(error)) {
      return error;
    }
    
    if (error && error.message && this.isUserFriendly(error.message)) {
      return error.message;
    }
    
    // Return category-based message
    return this.userMessages[category] || this.userMessages.unknown;
  }

  /**
   * Check if message is user-friendly (no technical details)
   * @private
   * @param {string} message - Message to check
   * @returns {boolean} True if user-friendly
   */
  isUserFriendly(message) {
    const technicalTerms = [
      'undefined',
      'null',
      'function',
      'object',
      'stack',
      'trace',
      'exception',
      'TypeError',
      'ReferenceError',
      'SyntaxError',
      'at ',
      '.js:',
      'line '
    ];
    
    const messageLower = message.toLowerCase();
    
    // Check if message contains technical terms
    for (const term of technicalTerms) {
      if (messageLower.includes(term.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Record error in statistics
   * @private
   * @param {string} category - Error category
   * @param {Error|string} error - Error object
   * @param {string} context - Error context
   */
  recordError(category, error, context = '') {
    this.errorStats.total++;
    this.errorStats.byCategory[category]++;
    this.errorStats.lastError = {
      category,
      message: error?.message || error,
      context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Sanitize error for logging (remove sensitive data)
   * @param {Error|Object} error - Error to sanitize
   * @returns {Object} Sanitized error
   */
  sanitizeError(error) {
    if (!error) {
      return { message: 'Unknown error' };
    }
    
    const sanitized = {
      message: error.message || String(error),
      name: error.name || 'Error',
      category: this.categorizeError(error)
    };
    
    // Include stack trace only in development
    if (window.logger && window.logger.isDevelopment && error.stack) {
      sanitized.stack = error.stack;
    }
    
    return sanitized;
  }

  /**
   * Create custom error with user message
   * @param {string} message - Technical error message
   * @param {string} userMessage - User-friendly message
   * @param {string} category - Error category
   * @returns {Error} Custom error object
   */
  createError(message, userMessage, category = this.categories.UNKNOWN) {
    const error = new Error(message);
    error.userMessage = userMessage;
    error.category = category;
    return error;
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStatistics() {
    return {
      ...this.errorStats,
      byCategory: { ...this.errorStats.byCategory }
    };
  }

  /**
   * Reset error statistics
   */
  resetStatistics() {
    this.errorStats.total = 0;
    Object.keys(this.errorStats.byCategory).forEach(category => {
      this.errorStats.byCategory[category] = 0;
    });
    this.errorStats.lastError = null;
  }

  /**
   * Handle authentication error
   * @param {Error|string} error - Error object or message
   * @param {string} context - Error context
   */
  handleAuthError(error, context = 'Authentication') {
    return this.handle(error, context, {
      category: this.categories.AUTHENTICATION,
      showToUser: true
    });
  }

  /**
   * Handle validation error
   * @param {Error|string} error - Error object or message
   * @param {string} context - Error context
   */
  handleValidationError(error, context = 'Validation') {
    return this.handle(error, context, {
      category: this.categories.VALIDATION,
      showToUser: true
    });
  }

  /**
   * Handle network error
   * @param {Error|string} error - Error object or message
   * @param {string} context - Error context
   */
  handleNetworkError(error, context = 'Network') {
    return this.handle(error, context, {
      category: this.categories.NETWORK,
      showToUser: true
    });
  }
}

// Create singleton instance
const errorHandlerService = new ErrorHandlerService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ErrorHandlerService = ErrorHandlerService;
  window.errorHandlerService = errorHandlerService;
}

console.log('ErrorHandlerService loaded');

