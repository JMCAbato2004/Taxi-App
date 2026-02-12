/**
 * CSRFProtectionService - Cross-Site Request Forgery Protection
 * Implements CSRF token generation and validation
 * 
 * IMPORTANT: This is a frontend implementation for demonstration.
 * In production, CSRF protection MUST be implemented on the backend:
 * 1. Backend generates CSRF token on login
 * 2. Token sent to frontend in response (not in cookie)
 * 3. Frontend includes token in all state-changing requests
 * 4. Backend validates token on each request
 * 
 * Features:
 * - Secure random token generation
 * - Token rotation on sensitive operations
 * - Automatic token inclusion in requests
 * - Token validation before operations
 * - Session-based token storage
 */

class CSRFProtectionService {
  constructor() {
    // Storage key for CSRF token
    this.CSRF_TOKEN_KEY = 'csrf_token';
    this.CSRF_TOKEN_HEADER = 'X-CSRF-Token';
    
    // Token settings
    this.TOKEN_LENGTH = 32; // bytes
    this.TOKEN_ROTATION_INTERVAL = 30 * 60 * 1000; // 30 minutes
    
    // Current token
    this.currentToken = null;
    this.tokenGeneratedAt = null;
    
    // Initialize token
    this.initializeToken();
  }

  /**
   * Initialize or restore CSRF token
   */
  initializeToken() {
    try {
      // Try to restore from sessionStorage
      const storedData = sessionStorage.getItem(this.CSRF_TOKEN_KEY);
      
      if (storedData) {
        const { token, generatedAt } = JSON.parse(storedData);
        
        // Check if token is still valid (not expired)
        if (Date.now() - generatedAt < this.TOKEN_ROTATION_INTERVAL) {
          this.currentToken = token;
          this.tokenGeneratedAt = generatedAt;
          console.log('CSRF token restored from session');
          return;
        }
      }
      
      // Generate new token if none exists or expired
      this.generateNewToken();
    } catch (error) {
      console.error('Error initializing CSRF token:', error);
      this.generateNewToken();
    }
  }

  /**
   * Generate a new CSRF token
   * @returns {string} New CSRF token
   */
  generateNewToken() {
    try {
      // Generate secure random token
      const tokenBytes = crypto.getRandomValues(new Uint8Array(this.TOKEN_LENGTH));
      const token = Array.from(tokenBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      
      this.currentToken = token;
      this.tokenGeneratedAt = Date.now();
      
      // Store in sessionStorage
      sessionStorage.setItem(
        this.CSRF_TOKEN_KEY,
        JSON.stringify({
          token: this.currentToken,
          generatedAt: this.tokenGeneratedAt
        })
      );
      
      console.log('New CSRF token generated');
      return this.currentToken;
    } catch (error) {
      console.error('Error generating CSRF token:', error);
      throw new Error('Error al generar token CSRF');
    }
  }

  /**
   * Get current CSRF token
   * @returns {string} Current CSRF token
   */
  getToken() {
    // Check if token needs rotation
    if (this.shouldRotateToken()) {
      return this.generateNewToken();
    }
    
    if (!this.currentToken) {
      return this.generateNewToken();
    }
    
    return this.currentToken;
  }

  /**
   * Check if token should be rotated
   * @returns {boolean} True if token should be rotated
   */
  shouldRotateToken() {
    if (!this.tokenGeneratedAt) {
      return true;
    }
    
    const tokenAge = Date.now() - this.tokenGeneratedAt;
    return tokenAge >= this.TOKEN_ROTATION_INTERVAL;
  }

  /**
   * Validate CSRF token
   * @param {string} token - Token to validate
   * @returns {boolean} True if token is valid
   */
  validateToken(token) {
    if (!token || !this.currentToken) {
      console.warn('CSRF token validation failed: missing token');
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    if (token.length !== this.currentToken.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ this.currentToken.charCodeAt(i);
    }
    
    const isValid = result === 0;
    
    if (!isValid) {
      console.warn('CSRF token validation failed: token mismatch');
    }
    
    return isValid;
  }

  /**
   * Add CSRF token to request headers
   * @param {Object} headers - Request headers object
   * @returns {Object} Headers with CSRF token
   */
  addTokenToHeaders(headers = {}) {
    const token = this.getToken();
    return {
      ...headers,
      [this.CSRF_TOKEN_HEADER]: token
    };
  }

  /**
   * Add CSRF token to form data
   * @param {FormData} formData - Form data object
   * @returns {FormData} Form data with CSRF token
   */
  addTokenToFormData(formData) {
    const token = this.getToken();
    formData.append('csrf_token', token);
    return formData;
  }

  /**
   * Add CSRF token to URL parameters
   * @param {string} url - URL string
   * @returns {string} URL with CSRF token parameter
   */
  addTokenToURL(url) {
    const token = this.getToken();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}csrf_token=${encodeURIComponent(token)}`;
  }

  /**
   * Validate request has valid CSRF token
   * @param {Object} request - Request object with headers or body
   * @returns {boolean} True if request has valid token
   */
  validateRequest(request) {
    // Check header
    if (request.headers && request.headers[this.CSRF_TOKEN_HEADER]) {
      return this.validateToken(request.headers[this.CSRF_TOKEN_HEADER]);
    }
    
    // Check body
    if (request.body && request.body.csrf_token) {
      return this.validateToken(request.body.csrf_token);
    }
    
    // Check URL params
    if (request.url) {
      const url = new URL(request.url, window.location.origin);
      const token = url.searchParams.get('csrf_token');
      if (token) {
        return this.validateToken(token);
      }
    }
    
    console.warn('CSRF token validation failed: no token in request');
    return false;
  }

  /**
   * Rotate token (generate new one)
   * Should be called after sensitive operations
   */
  rotateToken() {
    console.log('Rotating CSRF token');
    return this.generateNewToken();
  }

  /**
   * Clear CSRF token (on logout)
   */
  clearToken() {
    this.currentToken = null;
    this.tokenGeneratedAt = null;
    sessionStorage.removeItem(this.CSRF_TOKEN_KEY);
    console.log('CSRF token cleared');
  }

  /**
   * Create a protected fetch wrapper
   * Automatically adds CSRF token to requests
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async protectedFetch(url, options = {}) {
    // Only add CSRF token to state-changing methods
    const method = (options.method || 'GET').toUpperCase();
    const stateMutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (stateMutatingMethods.includes(method)) {
      // Add CSRF token to headers
      options.headers = this.addTokenToHeaders(options.headers || {});
      
      console.log(`Protected ${method} request to ${url} with CSRF token`);
    }
    
    try {
      const response = await fetch(url, options);
      
      // Rotate token after successful state-changing operation
      if (stateMutatingMethods.includes(method) && response.ok) {
        this.rotateToken();
      }
      
      return response;
    } catch (error) {
      console.error('Protected fetch error:', error);
      throw error;
    }
  }

  /**
   * Validate operation before execution
   * Throws error if validation fails
   * @param {string} operation - Operation name for logging
   * @param {Object} context - Optional context with token
   */
  validateOperation(operation, context = {}) {
    const token = context.csrfToken || context.csrf_token;
    
    if (!token) {
      throw new Error(`Operación bloqueada: falta token CSRF para ${operation}`);
    }
    
    if (!this.validateToken(token)) {
      throw new Error(`Operación bloqueada: token CSRF inválido para ${operation}`);
    }
    
    console.log(`CSRF validation passed for operation: ${operation}`);
    return true;
  }

  /**
   * Create a protected operation wrapper
   * Validates CSRF token before executing operation
   * @param {Function} operation - Operation to protect
   * @param {string} operationName - Operation name for logging
   * @returns {Function} Protected operation
   */
  protectOperation(operation, operationName) {
    return async (...args) => {
      // Get token from context (last argument if it's an object with csrfToken)
      const lastArg = args[args.length - 1];
      const context = (lastArg && typeof lastArg === 'object' && lastArg.csrfToken) 
        ? lastArg 
        : { csrfToken: this.getToken() };
      
      // Validate token
      this.validateOperation(operationName, context);
      
      // Execute operation
      const result = await operation(...args);
      
      // Rotate token after successful operation
      this.rotateToken();
      
      return result;
    };
  }

  /**
   * Get token info for debugging
   * @returns {Object} Token information
   */
  getTokenInfo() {
    return {
      hasToken: !!this.currentToken,
      tokenAge: this.tokenGeneratedAt ? Date.now() - this.tokenGeneratedAt : null,
      tokenAgeMinutes: this.tokenGeneratedAt ? Math.floor((Date.now() - this.tokenGeneratedAt) / 60000) : null,
      shouldRotate: this.shouldRotateToken(),
      rotationInterval: this.TOKEN_ROTATION_INTERVAL / 60000 // in minutes
    };
  }

  /**
   * Create CSRF token meta tag for HTML forms
   * @returns {string} HTML meta tag
   */
  createMetaTag() {
    const token = this.getToken();
    return `<meta name="csrf-token" content="${token}">`;
  }

  /**
   * Get token from meta tag (for compatibility with backend frameworks)
   * @returns {string|null} Token from meta tag or null
   */
  getTokenFromMetaTag() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  }
}

// Create singleton instance
const csrfProtectionService = new CSRFProtectionService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.CSRFProtectionService = CSRFProtectionService;
  window.csrfProtectionService = csrfProtectionService;
  
  // Add global protected fetch
  window.protectedFetch = csrfProtectionService.protectedFetch.bind(csrfProtectionService);
}

console.log('CSRFProtectionService loaded');
