/**
 * CSRFService - Cross-Site Request Forgery Protection
 * Generates and validates CSRF tokens for form submissions
 * 
 * Security Features:
 * - Cryptographically secure token generation
 * - Token validation
 * - Automatic token rotation
 * - Session-based storage
 */

class CSRFService {
  constructor() {
    this.tokenKey = 'csrf_token';
    this.tokenTimestampKey = 'csrf_token_timestamp';
    this.tokenLifetime = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Initialize token
    this.ensureToken();
  }

  /**
   * Generate a new CSRF token
   * @returns {string} CSRF token
   */
  generateToken() {
    const array = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    // Store in sessionStorage (cleared when tab closes)
    sessionStorage.setItem(this.tokenKey, token);
    sessionStorage.setItem(this.tokenTimestampKey, Date.now().toString());
    
    return token;
  }

  /**
   * Get current CSRF token
   * @returns {string} CSRF token
   */
  getToken() {
    return sessionStorage.getItem(this.tokenKey);
  }

  /**
   * Ensure a valid token exists
   * @returns {string} CSRF token
   */
  ensureToken() {
    const token = this.getToken();
    const timestamp = sessionStorage.getItem(this.tokenTimestampKey);
    
    // Generate new token if none exists or if expired
    if (!token || !timestamp || this.isTokenExpired(parseInt(timestamp))) {
      return this.generateToken();
    }
    
    return token;
  }

  /**
   * Check if token is expired
   * @private
   * @param {number} timestamp - Token timestamp
   * @returns {boolean} True if expired
   */
  isTokenExpired(timestamp) {
    return Date.now() - timestamp > this.tokenLifetime;
  }

  /**
   * Validate CSRF token
   * @param {string} token - Token to validate
   * @returns {boolean} True if valid
   */
  validateToken(token) {
    if (!token) {
      console.error('CSRF token is missing');
      return false;
    }
    
    const storedToken = this.getToken();
    const timestamp = sessionStorage.getItem(this.tokenTimestampKey);
    
    if (!storedToken) {
      console.error('No CSRF token in storage');
      return false;
    }
    
    if (this.isTokenExpired(parseInt(timestamp))) {
      console.error('CSRF token has expired');
      return false;
    }
    
    // Timing-safe comparison
    if (token.length !== storedToken.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Rotate token (generate new one)
   * @returns {string} New CSRF token
   */
  rotateToken() {
    return this.generateToken();
  }

  /**
   * Clear token
   */
  clearToken() {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenTimestampKey);
  }

  /**
   * Add CSRF token to form data
   * @param {FormData} formData - Form data object
   * @returns {FormData} Form data with CSRF token
   */
  addTokenToFormData(formData) {
    const token = this.ensureToken();
    formData.append('csrf_token', token);
    return formData;
  }

  /**
   * Add CSRF token to request headers
   * @param {Object} headers - Request headers
   * @returns {Object} Headers with CSRF token
   */
  addTokenToHeaders(headers = {}) {
    const token = this.ensureToken();
    return {
      ...headers,
      'X-CSRF-Token': token
    };
  }

  /**
   * Add CSRF token to object
   * @param {Object} data - Data object
   * @returns {Object} Data with CSRF token
   */
  addTokenToData(data = {}) {
    const token = this.ensureToken();
    return {
      ...data,
      csrf_token: token
    };
  }

  /**
   * Validate and remove token from data
   * @param {Object} data - Data object with CSRF token
   * @returns {Object} { valid: boolean, data: Object }
   */
  validateAndRemoveToken(data) {
    const token = data.csrf_token || data['X-CSRF-Token'];
    const valid = this.validateToken(token);
    
    // Remove token from data
    const cleanData = { ...data };
    delete cleanData.csrf_token;
    delete cleanData['X-CSRF-Token'];
    
    return { valid, data: cleanData };
  }
}

// Create singleton instance
const csrfService = new CSRFService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.CSRFService = CSRFService;
  window.csrfService = csrfService;
}

console.log('CSRFService loaded');
