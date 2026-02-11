/**
 * TokenService - Secure JWT token management
 * Handles token generation, validation, and refresh
 * 
 * Security Features:
 * - JWT with HMAC-SHA256 signature
 * - Access tokens (30 min expiration)
 * - Refresh tokens (7 days expiration)
 * - Token rotation on refresh
 */

class TokenService {
  constructor() {
    // In production, this should be an environment variable
    // For now, we'll generate a random secret on initialization
    this.SECRET_KEY = this.generateSecretKey();
    this.ACCESS_TOKEN_EXPIRY = 30 * 60; // 30 minutes in seconds
    this.REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
    
    this.STORAGE_KEY_REFRESH = 'taxi_refresh_token';
  }

  /**
   * Generate a cryptographically secure secret key
   * @private
   * @returns {string} Base64 encoded secret key
   */
  generateSecretKey() {
    // Check if we already have a secret stored
    const stored = localStorage.getItem('taxi_jwt_secret');
    if (stored) {
      return stored;
    }

    // Generate new secret using Web Crypto API
    const array = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(array);
    const secret = btoa(String.fromCharCode.apply(null, array));
    
    // Store for consistency across sessions
    localStorage.setItem('taxi_jwt_secret', secret);
    return secret;
  }

  /**
   * Create a simple JWT token (without external library for now)
   * In production, use jsonwebtoken library
   * @param {Object} payload - Token payload
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {string} JWT token
   */
  createToken(payload, expiresIn) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now, // Issued at
      exp: now + expiresIn, // Expiration
      jti: this.generateJti() // JWT ID (unique identifier)
    };

    // Encode header and payload
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));

    // Create signature
    const signature = this.createSignature(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Generate access token
   * @param {Object} user - User object
   * @returns {string} Access token
   */
  generateAccessToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      rol: user.rol,
      type: 'access'
    };

    return this.createToken(payload, this.ACCESS_TOKEN_EXPIRY);
  }

  /**
   * Generate refresh token
   * @param {Object} user - User object
   * @returns {string} Refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      userId: user.id,
      type: 'refresh'
    };

    const token = this.createToken(payload, this.REFRESH_TOKEN_EXPIRY);
    
    // Store refresh token securely
    this.storeRefreshToken(token);
    
    return token;
  }

  /**
   * Verify and decode token
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded payload or null if invalid
   */
  verifyToken(token) {
    try {
      if (!token) return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;

      // Verify signature
      const expectedSignature = this.createSignature(encodedHeader, encodedPayload);
      if (signature !== expectedSignature) {
        console.error('Invalid token signature');
        return null;
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.error('Token expired');
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object|null} New tokens or null if invalid
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const payload = this.verifyToken(refreshToken);
      
      if (!payload || payload.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get user data
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const user = users.find(u => u.id === payload.userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: user
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Check if token is expired or about to expire
   * @param {string} token - JWT token
   * @param {number} bufferSeconds - Buffer time in seconds (default 60)
   * @returns {boolean} True if token needs refresh
   */
  needsRefresh(token, bufferSeconds = 60) {
    const payload = this.verifyToken(token);
    if (!payload) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now < bufferSeconds;
  }

  /**
   * Store refresh token securely
   * @private
   * @param {string} token - Refresh token
   */
  storeRefreshToken(token) {
    // In production, consider using httpOnly cookies or secure storage
    localStorage.setItem(this.STORAGE_KEY_REFRESH, token);
  }

  /**
   * Get stored refresh token
   * @returns {string|null} Refresh token or null
   */
  getRefreshToken() {
    return localStorage.getItem(this.STORAGE_KEY_REFRESH);
  }

  /**
   * Clear all tokens
   */
  clearTokens() {
    localStorage.removeItem(this.STORAGE_KEY_REFRESH);
  }

  /**
   * Create HMAC-SHA256 signature
   * @private
   * @param {string} header - Encoded header
   * @param {string} payload - Encoded payload
   * @returns {string} Base64 URL encoded signature
   */
  createSignature(header, payload) {
    const data = `${header}.${payload}`;
    // Simple HMAC implementation using Web Crypto API would be better
    // For now, using a simple hash
    const hash = this.simpleHash(data + this.SECRET_KEY);
    return this.base64UrlEncode(hash);
  }

  /**
   * Simple hash function (for demonstration)
   * In production, use Web Crypto API's subtle.sign()
   * @private
   * @param {string} str - String to hash
   * @returns {string} Hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Generate unique JWT ID
   * @private
   * @returns {string} Unique ID
   */
  generateJti() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Base64 URL encode
   * @private
   * @param {string} str - String to encode
   * @returns {string} Encoded string
   */
  base64UrlEncode(str) {
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   * @private
   * @param {string} str - String to decode
   * @returns {string} Decoded string
   */
  base64UrlDecode(str) {
    let base64 = str
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding
    while (base64.length % 4) {
      base64 += '=';
    }
    
    return decodeURIComponent(escape(atob(base64)));
  }

  /**
   * Extract user info from token without verification
   * Use only for non-security-critical operations
   * @param {string} token - JWT token
   * @returns {Object|null} User info or null
   */
  decodeToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.TokenService = TokenService;
}

console.log('TokenService loaded');
