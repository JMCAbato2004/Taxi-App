/**
 * TokenService - JWT Token Management with Expiration
 * Implements token generation, validation, and refresh mechanism
 * 
 * IMPORTANT: This is a frontend implementation for demonstration.
 * In production, JWT tokens MUST be generated and validated on the backend.
 * 
 * Features:
 * - JWT-like token structure with expiration
 * - Access tokens (short-lived: 1 hour)
 * - Refresh tokens (long-lived: 7 days)
 * - Automatic token refresh before expiration
 * - Token validation and expiration checking
 * - Secure token storage
 */

class TokenService {
  constructor() {
    // Token configuration
    this.ACCESS_TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour
    this.REFRESH_TOKEN_LIFETIME = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry
    
    // Storage keys
    this.ACCESS_TOKEN_KEY = 'access_token';
    this.REFRESH_TOKEN_KEY = 'refresh_token';
    this.TOKEN_METADATA_KEY = 'token_metadata';
    
    // Auto-refresh interval
    this.refreshInterval = null;
    
    // Initialize auto-refresh
    this.startAutoRefresh();
  }

  /**
   * Generate a JWT-like token
   * @param {Object} payload - Token payload
   * @param {number} expiresIn - Expiration time in milliseconds
   * @returns {Object} Token object with token string and metadata
   */
  generateToken(payload, expiresIn) {
    const now = Date.now();
    const expiresAt = now + expiresIn;
    
    // Create token payload
    const tokenPayload = {
      ...payload,
      iat: now, // Issued at
      exp: expiresAt, // Expires at
      jti: this._generateTokenId() // JWT ID (unique identifier)
    };
    
    // In production, this would be signed with a secret key on the backend
    // For demo, we'll use base64 encoding
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this._base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this._base64UrlEncode(JSON.stringify(tokenPayload));
    
    // Simulate signature (in production, use HMAC-SHA256 with secret)
    const signature = this._generateSignature(encodedHeader, encodedPayload);
    
    const token = `${encodedHeader}.${encodedPayload}.${signature}`;
    
    return {
      token: token,
      expiresAt: expiresAt,
      expiresIn: expiresIn,
      issuedAt: now
    };
  }

  /**
   * Generate access and refresh tokens
   * @param {Object} user - User object
   * @returns {Object} Token pair with metadata
   */
  generateTokenPair(user) {
    // Create minimal payload (don't include sensitive data)
    const payload = {
      userId: user.id,
      email: user.email,
      rol: user.rol,
      type: 'access'
    };
    
    // Generate access token
    const accessToken = this.generateToken(payload, this.ACCESS_TOKEN_LIFETIME);
    
    // Generate refresh token with different payload
    const refreshPayload = {
      userId: user.id,
      type: 'refresh',
      tokenId: accessToken.token.split('.')[2] // Link to access token
    };
    
    const refreshToken = this.generateToken(refreshPayload, this.REFRESH_TOKEN_LIFETIME);
    
    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      tokenType: 'Bearer'
    };
  }

  /**
   * Store tokens securely
   * @param {Object} tokens - Token pair
   */
  async storeTokens(tokens) {
    try {
      // Use secure storage if available
      if (window.secureStorageService) {
        await window.secureStorageService.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
        await window.secureStorageService.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
        await window.secureStorageService.setItem(this.TOKEN_METADATA_KEY, {
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
          issuedAt: Date.now()
        });
      } else {
        // Fallback to sessionStorage (better than localStorage for tokens)
        sessionStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
        sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
        sessionStorage.setItem(this.TOKEN_METADATA_KEY, JSON.stringify({
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
          issuedAt: Date.now()
        }));
      }
      
      console.log('Tokens stored securely');
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Error al almacenar tokens');
    }
  }

  /**
   * Get access token
   * @returns {Promise<string|null>} Access token or null
   */
  async getAccessToken() {
    try {
      if (window.secureStorageService) {
        return await window.secureStorageService.getItem(this.ACCESS_TOKEN_KEY);
      } else {
        return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   * @returns {Promise<string|null>} Refresh token or null
   */
  async getRefreshToken() {
    try {
      if (window.secureStorageService) {
        return await window.secureStorageService.getItem(this.REFRESH_TOKEN_KEY);
      } else {
        return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get token metadata
   * @returns {Promise<Object|null>} Token metadata or null
   */
  async getTokenMetadata() {
    try {
      if (window.secureStorageService) {
        return await window.secureStorageService.getItem(this.TOKEN_METADATA_KEY);
      } else {
        const stored = sessionStorage.getItem(this.TOKEN_METADATA_KEY);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error('Error getting token metadata:', error);
      return null;
    }
  }

  /**
   * Decode token payload
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded payload or null
   */
  decodeToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = this._base64UrlDecode(parts[1]);
      return JSON.parse(payload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Validate token
   * @param {string} token - JWT token
   * @returns {Object} Validation result
   */
  validateToken(token) {
    if (!token) {
      return { valid: false, reason: 'Token missing' };
    }
    
    const payload = this.decodeToken(token);
    
    if (!payload) {
      return { valid: false, reason: 'Invalid token format' };
    }
    
    // Check expiration
    if (Date.now() >= payload.exp) {
      return { valid: false, reason: 'Token expired', expired: true };
    }
    
    // Check if token was issued in the future (clock skew)
    if (payload.iat > Date.now() + 60000) { // Allow 1 minute skew
      return { valid: false, reason: 'Token issued in the future' };
    }
    
    return { valid: true, payload: payload };
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  isTokenExpired(token) {
    const validation = this.validateToken(token);
    return validation.expired || !validation.valid;
  }

  /**
   * Check if token needs refresh
   * @param {string} token - JWT token
   * @returns {boolean} True if needs refresh
   */
  needsRefresh(token) {
    const payload = this.decodeToken(token);
    
    if (!payload) {
      return true;
    }
    
    const timeUntilExpiry = payload.exp - Date.now();
    return timeUntilExpiry <= this.REFRESH_THRESHOLD;
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<Object|null>} New token pair or null
   */
  async refreshAccessToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        console.warn('No refresh token available');
        return null;
      }
      
      // Validate refresh token
      const validation = this.validateToken(refreshToken);
      
      if (!validation.valid) {
        console.warn('Refresh token invalid:', validation.reason);
        await this.clearTokens();
        return null;
      }
      
      // Decode refresh token to get user info
      const payload = validation.payload;
      
      // In production, this would call backend API to refresh token
      // For demo, we'll get user from storage and generate new tokens
      const user = await this._getUserFromStorage(payload.userId);
      
      if (!user) {
        console.warn('User not found for token refresh');
        await this.clearTokens();
        return null;
      }
      
      // Generate new token pair
      const newTokens = this.generateTokenPair(user);
      
      // Store new tokens
      await this.storeTokens(newTokens);
      
      console.log('Access token refreshed successfully');
      
      return newTokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Get user from storage (helper for token refresh)
   * @private
   */
  async _getUserFromStorage(userId) {
    try {
      // Try secure storage first
      if (window.secureStorageService) {
        const user = await window.secureStorageService.getUserData();
        if (user && user.id === userId) {
          return user;
        }
      }
      
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      return users.find(u => u.id === userId);
    } catch (error) {
      console.error('Error getting user from storage:', error);
      return null;
    }
  }

  /**
   * Clear all tokens
   */
  async clearTokens() {
    try {
      if (window.secureStorageService) {
        window.secureStorageService.removeItem(this.ACCESS_TOKEN_KEY);
        window.secureStorageService.removeItem(this.REFRESH_TOKEN_KEY);
        window.secureStorageService.removeItem(this.TOKEN_METADATA_KEY);
      } else {
        sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(this.TOKEN_METADATA_KEY);
      }
      
      console.log('Tokens cleared');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Start automatic token refresh
   */
  startAutoRefresh() {
    // Check every minute if token needs refresh
    this.refreshInterval = setInterval(async () => {
      const accessToken = await this.getAccessToken();
      
      if (accessToken && this.needsRefresh(accessToken)) {
        console.log('Auto-refreshing access token');
        await this.refreshAccessToken();
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop automatic token refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Get token info for debugging
   * @returns {Promise<Object>} Token information
   */
  async getTokenInfo() {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    const metadata = await this.getTokenMetadata();
    
    let accessTokenInfo = null;
    let refreshTokenInfo = null;
    
    if (accessToken) {
      const payload = this.decodeToken(accessToken);
      const validation = this.validateToken(accessToken);
      accessTokenInfo = {
        valid: validation.valid,
        expired: validation.expired,
        expiresAt: payload ? new Date(payload.exp) : null,
        timeUntilExpiry: payload ? payload.exp - Date.now() : null,
        needsRefresh: this.needsRefresh(accessToken)
      };
    }
    
    if (refreshToken) {
      const payload = this.decodeToken(refreshToken);
      const validation = this.validateToken(refreshToken);
      refreshTokenInfo = {
        valid: validation.valid,
        expired: validation.expired,
        expiresAt: payload ? new Date(payload.exp) : null,
        timeUntilExpiry: payload ? payload.exp - Date.now() : null
      };
    }
    
    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessToken: accessTokenInfo,
      refreshToken: refreshTokenInfo,
      metadata: metadata
    };
  }

  /**
   * Generate unique token ID
   * @private
   */
  _generateTokenId() {
    return crypto.randomUUID ? crypto.randomUUID() : this._generateRandomString(32);
  }

  /**
   * Generate random string
   * @private
   */
  _generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  }

  /**
   * Base64 URL encode
   * @private
   */
  _base64UrlEncode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   * @private
   */
  _base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  /**
   * Generate signature (simulated)
   * @private
   */
  _generateSignature(header, payload) {
    // In production, use HMAC-SHA256 with secret key
    // For demo, use a simple hash
    const data = header + '.' + payload;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Create singleton instance
const tokenService = new TokenService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.TokenService = TokenService;
  window.tokenService = tokenService;
}

console.log('TokenService loaded');
