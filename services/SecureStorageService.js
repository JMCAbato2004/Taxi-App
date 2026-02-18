/**
 * SecureStorageService - Encrypted Storage Management
 * Provides encrypted storage for sensitive data using AES-GCM
 * 
 * IMPORTANT: This is a frontend implementation for demonstration.
 * In production, sensitive data should be:
 * 1. Stored in httpOnly cookies (tokens)
 * 2. Kept on backend with minimal exposure to frontend
 * 3. Use sessionStorage instead of localStorage when possible
 * 
 * Features:
 * - AES-GCM encryption for all stored data
 * - Automatic key derivation from user session
 * - Encrypted tokens and user data
 * - Automatic cleanup on logout
 * - Session-based encryption keys
 */

class SecureStorageService {
  constructor() {
    // Storage keys
    this.STORAGE_PREFIX = 'taxi_secure_';
    this.SESSION_KEY_NAME = 'session_key';
    
    // Encryption settings
    this.ALGORITHM = 'AES-GCM';
    this.KEY_LENGTH = 256;
    
    // Session key (generated per session, stored in memory only)
    this.sessionKey = null;
    
    // Initialize session key
    this.initializeSessionKey();
  }

  /**
   * Initialize or restore session key
   * Session key is stored in sessionStorage (cleared when browser closes)
   */
  async initializeSessionKey() {
    try {
      // Try to restore from sessionStorage
      const storedKey = sessionStorage.getItem(this.SESSION_KEY_NAME);
      
      if (storedKey) {
        // Import stored key
        const keyData = this._hexToUint8Array(storedKey);
        this.sessionKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: this.ALGORITHM, length: this.KEY_LENGTH },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new session key
        await this.generateNewSessionKey();
      }
    } catch (error) {
      console.error('Error initializing session key:', error);
      // Generate new key on error
      await this.generateNewSessionKey();
    }
  }

  /**
   * Generate a new session key
   */
  async generateNewSessionKey() {
    try {
      // Generate new AES key
      this.sessionKey = await crypto.subtle.generateKey(
        { name: this.ALGORITHM, length: this.KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
      );

      // Export and store in sessionStorage
      const exportedKey = await crypto.subtle.exportKey('raw', this.sessionKey);
      const keyHex = this._arrayBufferToHex(exportedKey);
      sessionStorage.setItem(this.SESSION_KEY_NAME, keyHex);
    } catch (error) {
      console.error('Error generating session key:', error);
      throw new Error('Error al generar clave de sesión');
    }
  }

  /**
   * Encrypt and store data
   * @param {string} key - Storage key
   * @param {any} data - Data to store (will be JSON stringified)
   * @returns {Promise<boolean>} Success status
   */
  async setItem(key, data) {
    try {
      if (!this.sessionKey) {
        await this.initializeSessionKey();
      }

      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encoder = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv: iv },
        this.sessionKey,
        encoder.encode(jsonData)
      );

      // Store encrypted data with IV
      const storageData = {
        iv: this._arrayBufferToHex(iv),
        data: this._arrayBufferToHex(encrypted),
        timestamp: Date.now()
      };

      localStorage.setItem(
        this.STORAGE_PREFIX + key,
        JSON.stringify(storageData)
      );

      return true;
    } catch (error) {
      console.error('Error storing encrypted data:', error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt data
   * @param {string} key - Storage key
   * @returns {Promise<any>} Decrypted data or null
   */
  async getItem(key) {
    try {
      if (!this.sessionKey) {
        await this.initializeSessionKey();
      }

      // Get encrypted data
      const storedData = localStorage.getItem(this.STORAGE_PREFIX + key);
      
      if (!storedData) {
        return null;
      }

      const { iv, data } = JSON.parse(storedData);
      
      // Convert hex to Uint8Array
      const ivArray = this._hexToUint8Array(iv);
      const encryptedArray = this._hexToUint8Array(data);

      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv: ivArray },
        this.sessionKey,
        encryptedArray
      );

      // Convert to string and parse JSON
      const decoder = new TextDecoder();
      const jsonData = decoder.decode(decrypted);
      
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      // If decryption fails, remove corrupted data
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    localStorage.removeItem(this.STORAGE_PREFIX + key);
  }

  /**
   * Clear all secure storage
   */
  clearAll() {
    // Remove all items with our prefix
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });

    // Clear session key
    sessionStorage.removeItem(this.SESSION_KEY_NAME);
    this.sessionKey = null;
  }

  /**
   * Store authentication token securely
   * @param {string} token - Auth token
   * @returns {Promise<boolean>} Success status
   */
  async storeAuthToken(token) {
    return await this.setItem('auth_token', token);
  }

  /**
   * Get authentication token
   * @returns {Promise<string|null>} Auth token or null
   */
  async getAuthToken() {
    return await this.getItem('auth_token');
  }

  /**
   * Store user data securely
   * @param {Object} user - User object
   * @returns {Promise<boolean>} Success status
   */
  async storeUserData(user) {
    // Remove sensitive fields before storing
    const { passwordHash, passwordSalt, ...safeUser } = user;
    return await this.setItem('user_data', safeUser);
  }

  /**
   * Get user data
   * @returns {Promise<Object|null>} User object or null
   */
  async getUserData() {
    return await this.getItem('user_data');
  }

  /**
   * Store permissions securely
   * @param {Array<string>} permissions - User permissions
   * @returns {Promise<boolean>} Success status
   */
  async storePermissions(permissions) {
    return await this.setItem('permissions', permissions);
  }

  /**
   * Get permissions
   * @returns {Promise<Array<string>|null>} Permissions array or null
   */
  async getPermissions() {
    return await this.getItem('permissions');
  }

  /**
   * Store complete auth data
   * @param {Object} authData - { user, token, permissions }
   * @returns {Promise<boolean>} Success status
   */
  async storeAuthData(authData) {
    try {
      await this.storeUserData(authData.user);
      await this.storeAuthToken(authData.token);
      await this.storePermissions(authData.permissions || []);
      return true;
    } catch (error) {
      console.error('Error storing auth data:', error);
      return false;
    }
  }

  /**
   * Get complete auth data
   * @returns {Promise<Object|null>} Auth data or null
   */
  async getAuthData() {
    try {
      const user = await this.getUserData();
      const token = await this.getAuthToken();
      const permissions = await this.getPermissions();

      if (!user || !token) {
        return null;
      }

      return { user, token, permissions: permissions || [] };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  }

  /**
   * Clear all auth data
   */
  async clearAuthData() {
    this.removeItem('auth_token');
    this.removeItem('user_data');
    this.removeItem('permissions');
  }

  /**
   * Check if user is authenticated (has valid encrypted session)
   * @returns {Promise<boolean>} True if authenticated
   */
  async isAuthenticated() {
    const token = await this.getAuthToken();
    const user = await this.getUserData();
    return !!(token && user);
  }

  /**
   * Store data with expiration
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @param {number} expiryMinutes - Expiry time in minutes
   * @returns {Promise<boolean>} Success status
   */
  async setItemWithExpiry(key, data, expiryMinutes) {
    const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
    const dataWithExpiry = {
      data: data,
      expiry: expiryTime
    };
    return await this.setItem(key, dataWithExpiry);
  }

  /**
   * Get data with expiration check
   * @param {string} key - Storage key
   * @returns {Promise<any>} Data or null if expired
   */
  async getItemWithExpiry(key) {
    const stored = await this.getItem(key);
    
    if (!stored) {
      return null;
    }

    // Check if expired
    if (Date.now() > stored.expiry) {
      this.removeItem(key);
      return null;
    }

    return stored.data;
  }

  /**
   * Migrate data from localStorage to secure storage
   * @param {string} oldKey - Old localStorage key
   * @param {string} newKey - New secure storage key
   * @returns {Promise<boolean>} Success status
   */
  async migrateFromLocalStorage(oldKey, newKey) {
    try {
      const oldData = localStorage.getItem(oldKey);
      
      if (!oldData) {
        return false;
      }

      // Parse and store securely
      const data = JSON.parse(oldData);
      await this.setItem(newKey, data);
      
      // Remove old data
      localStorage.removeItem(oldKey);
      
      return true;
    } catch (error) {
      console.error('Error migrating data:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage stats
   */
  getStorageStats() {
    const keys = Object.keys(localStorage);
    const secureKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));
    
    let totalSize = 0;
    secureKeys.forEach(key => {
      const item = localStorage.getItem(key);
      totalSize += item ? item.length : 0;
    });

    return {
      itemCount: secureKeys.length,
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      hasSessionKey: !!this.sessionKey
    };
  }

  /**
   * Convert ArrayBuffer to hex string
   * @private
   */
  _arrayBufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to Uint8Array
   * @private
   */
  _hexToUint8Array(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
}

// Create singleton instance
const secureStorageService = new SecureStorageService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SecureStorageService = SecureStorageService;
  window.secureStorageService = secureStorageService;
}

console.log('SecureStorageService loaded');
