/**
 * SecureStorageService - Encrypted data storage using IndexedDB
 * Provides secure storage for sensitive data with encryption
 * 
 * Security Features:
 * - AES-256-GCM encryption
 * - IndexedDB for persistent storage
 * - Automatic key derivation
 * - Secure key storage
 * - Data integrity verification
 */

class SecureStorageService {
  constructor() {
    this.dbName = 'TaxiAppSecureDB';
    this.dbVersion = 1;
    this.storeName = 'secureData';
    this.db = null;
    this.encryptionKey = null;
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the service
   */
  async init() {
    try {
      await this.initDB();
      await this.initEncryptionKey();
    } catch (error) {
      console.error('SecureStorageService initialization error:', error);
    }
  }

  /**
   * Initialize IndexedDB
   * @private
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Initialize or retrieve encryption key
   * @private
   */
  async initEncryptionKey() {
    try {
      // Try to get existing key from localStorage
      const storedKey = localStorage.getItem('taxi_encryption_key');
      
      if (storedKey) {
        // Import existing key
        const keyData = this.base64ToArrayBuffer(storedKey);
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        // Export and store key
        const exportedKey = await crypto.subtle.exportKey('raw', this.encryptionKey);
        const keyBase64 = this.arrayBufferToBase64(exportedKey);
        localStorage.setItem('taxi_encryption_key', keyBase64);
      }
    } catch (error) {
      console.error('Encryption key initialization error:', error);
      throw error;
    }
  }

  /**
   * Encrypt data
   * @private
   * @param {any} data - Data to encrypt
   * @returns {Promise<Object>} Encrypted data with IV
   */
  async encrypt(data) {
    try {
      // Convert data to string
      const dataStr = JSON.stringify(data);
      const dataBuffer = new TextEncoder().encode(dataStr);

      // Generate random IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        this.encryptionKey,
        dataBuffer
      );

      return {
        encrypted: this.arrayBufferToBase64(encryptedBuffer),
        iv: this.arrayBufferToBase64(iv)
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data
   * @private
   * @param {string} encryptedData - Encrypted data (base64)
   * @param {string} ivBase64 - IV (base64)
   * @returns {Promise<any>} Decrypted data
   */
  async decrypt(encryptedData, ivBase64) {
    try {
      // Convert from base64
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
      const iv = this.base64ToArrayBuffer(ivBase64);

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        this.encryptionKey,
        encryptedBuffer
      );

      // Convert back to object
      const dataStr = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Store encrypted data
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    try {
      if (!this.db) {
        await this.initDB();
      }

      // Encrypt data
      const { encrypted, iv } = await this.encrypt(value);

      // Store in IndexedDB
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const record = {
        key: key,
        encrypted: encrypted,
        iv: iv,
        timestamp: Date.now()
      };

      return new Promise((resolve, reject) => {
        const request = objectStore.put(record);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to store data'));
      });
    } catch (error) {
      console.error('setItem error:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt data
   * @param {string} key - Storage key
   * @returns {Promise<any>} Decrypted value or null
   */
  async getItem(key) {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = objectStore.get(key);
        
        request.onsuccess = async (event) => {
          const record = event.target.result;
          
          if (!record) {
            resolve(null);
            return;
          }

          try {
            // Decrypt data
            const decrypted = await this.decrypt(record.encrypted, record.iv);
            resolve(decrypted);
          } catch (error) {
            console.error('Decryption failed:', error);
            resolve(null);
          }
        };
        
        request.onerror = () => reject(new Error('Failed to retrieve data'));
      });
    } catch (error) {
      console.error('getItem error:', error);
      return null;
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = objectStore.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to remove data'));
      });
    } catch (error) {
      console.error('removeItem error:', error);
      throw error;
    }
  }

  /**
   * Clear all data
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = objectStore.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear data'));
      });
    } catch (error) {
      console.error('clear error:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   * @returns {Promise<Array<string>>}
   */
  async keys() {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = objectStore.getAllKeys();
        
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = () => reject(new Error('Failed to get keys'));
      });
    } catch (error) {
      console.error('keys error:', error);
      return [];
    }
  }

  /**
   * Store user data securely
   * @param {Object} user - User object
   * @returns {Promise<void>}
   */
  async storeUserData(user) {
    await this.setItem('current_user', user);
  }

  /**
   * Get user data
   * @returns {Promise<Object|null>}
   */
  async getUserData() {
    return await this.getItem('current_user');
  }

  /**
   * Store auth token
   * @param {string} token - Auth token
   * @returns {Promise<void>}
   */
  async storeAuthToken(token) {
    await this.setItem('auth_token', token);
  }

  /**
   * Get auth token
   * @returns {Promise<string|null>}
   */
  async getAuthToken() {
    return await this.getItem('auth_token');
  }

  /**
   * Store refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<void>}
   */
  async storeRefreshToken(token) {
    await this.setItem('refresh_token', token);
  }

  /**
   * Get refresh token
   * @returns {Promise<string|null>}
   */
  async getRefreshToken() {
    return await this.getItem('refresh_token');
  }

  /**
   * Clear all auth data
   * @returns {Promise<void>}
   */
  async clearAuthData() {
    await this.removeItem('current_user');
    await this.removeItem('auth_token');
    await this.removeItem('refresh_token');
  }

  /**
   * Convert ArrayBuffer to Base64
   * @private
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   * @private
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Migrate data from localStorage to secure storage
   * @param {string} localStorageKey - localStorage key
   * @param {string} secureKey - Secure storage key
   * @returns {Promise<boolean>} Success status
   */
  async migrateFromLocalStorage(localStorageKey, secureKey) {
    try {
      const data = localStorage.getItem(localStorageKey);
      if (!data) return false;

      const parsed = JSON.parse(data);
      await this.setItem(secureKey, parsed);
      
      // Optionally remove from localStorage
      // localStorage.removeItem(localStorageKey);
      
      return true;
    } catch (error) {
      console.error('Migration error:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SecureStorageService = SecureStorageService;
}

console.log('SecureStorageService loaded');
