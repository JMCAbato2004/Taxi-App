/**
 * CryptoService - Password Hashing and Encryption
 * Uses Web Crypto API for secure password hashing
 * 
 * IMPORTANT: This is a frontend implementation for demonstration.
 * In production, password hashing MUST be done on the backend using bcrypt or argon2.
 * 
 * Features:
 * - PBKDF2 password hashing with salt
 * - Secure random salt generation
 * - Constant-time comparison
 * - Configurable iterations for security/performance balance
 */

class CryptoService {
  constructor() {
    // PBKDF2 configuration
    this.HASH_ALGORITHM = 'PBKDF2';
    this.HASH_ITERATIONS = 100000; // OWASP recommends 100,000+ for PBKDF2-SHA256
    this.HASH_LENGTH = 256; // bits
    this.SALT_LENGTH = 16; // bytes
    
    // Encoding
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  /**
   * Hash a password with a random salt
   * @param {string} password - Plain text password
   * @returns {Promise<Object>} Object with hash and salt (both as hex strings)
   */
  async hashPassword(password) {
    try {
      // Generate random salt
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      
      // Hash password with salt
      const hash = await this._pbkdf2(password, salt);
      
      return {
        hash: this._arrayBufferToHex(hash),
        salt: this._arrayBufferToHex(salt)
      };
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Error al procesar la contraseña');
    }
  }

  /**
   * Verify a password against a stored hash
   * @param {string} password - Plain text password to verify
   * @param {string} storedHash - Stored hash (hex string)
   * @param {string} storedSalt - Stored salt (hex string)
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, storedHash, storedSalt) {
    try {
      // Convert stored salt from hex to Uint8Array
      const salt = this._hexToUint8Array(storedSalt);
      
      // Hash the provided password with the stored salt
      const hash = await this._pbkdf2(password, salt);
      const hashHex = this._arrayBufferToHex(hash);
      
      // Constant-time comparison to prevent timing attacks
      return this._constantTimeCompare(hashHex, storedHash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * PBKDF2 key derivation
   * @private
   * @param {string} password - Password to hash
   * @param {Uint8Array} salt - Salt bytes
   * @returns {Promise<ArrayBuffer>} Derived key
   */
  async _pbkdf2(password, salt) {
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.HASH_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      this.HASH_LENGTH
    );

    return derivedBits;
  }

  /**
   * Convert ArrayBuffer to hex string
   * @private
   * @param {ArrayBuffer} buffer - Buffer to convert
   * @returns {string} Hex string
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
   * @param {string} hex - Hex string
   * @returns {Uint8Array} Byte array
   */
  _hexToUint8Array(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * @private
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} True if strings match
   */
  _constantTimeCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Generate a secure random token
   * @param {number} length - Length in bytes (default 32)
   * @returns {string} Random token as hex string
   */
  generateSecureToken(length = 32) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return this._arrayBufferToHex(bytes);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with score and feedback
   */
  validatePasswordStrength(password) {
    const result = {
      valid: false,
      score: 0,
      feedback: []
    };

    // Minimum length
    if (password.length < 8) {
      result.feedback.push('La contraseña debe tener al menos 8 caracteres');
      return result;
    }

    // Length score
    if (password.length >= 8) result.score += 1;
    if (password.length >= 12) result.score += 1;
    if (password.length >= 16) result.score += 1;

    // Character variety
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (hasLowercase) result.score += 1;
    if (hasUppercase) result.score += 1;
    if (hasNumbers) result.score += 1;
    if (hasSpecialChars) result.score += 1;

    // Feedback
    if (!hasLowercase) result.feedback.push('Añade letras minúsculas');
    if (!hasUppercase) result.feedback.push('Añade letras mayúsculas');
    if (!hasNumbers) result.feedback.push('Añade números');
    if (!hasSpecialChars) result.feedback.push('Añade caracteres especiales (!@#$%^&*)');

    // Common patterns to avoid
    const commonPatterns = [
      /^123456/,
      /^password/i,
      /^qwerty/i,
      /^abc123/i,
      /^111111/,
      /^admin/i
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        result.feedback.push('Evita patrones comunes o contraseñas obvias');
        result.score = Math.max(0, result.score - 2);
        break;
      }
    }

    // Sequential characters
    if (/(.)\1{2,}/.test(password)) {
      result.feedback.push('Evita caracteres repetidos consecutivos');
      result.score = Math.max(0, result.score - 1);
    }

    // Determine validity
    result.valid = result.score >= 4 && result.feedback.length === 0;

    // Strength label
    if (result.score <= 2) {
      result.strength = 'Débil';
      result.color = 'danger';
    } else if (result.score <= 4) {
      result.strength = 'Media';
      result.color = 'warning';
    } else if (result.score <= 6) {
      result.strength = 'Fuerte';
      result.color = 'success';
    } else {
      result.strength = 'Muy Fuerte';
      result.color = 'success';
    }

    return result;
  }

  /**
   * Encrypt data using AES-GCM
   * @param {string} data - Data to encrypt
   * @param {string} password - Password for encryption
   * @returns {Promise<Object>} Encrypted data with IV and salt
   */
  async encryptData(data, password) {
    try {
      // Generate salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Derive key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        this.encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        this.encoder.encode(data)
      );

      return {
        encrypted: this._arrayBufferToHex(encrypted),
        iv: this._arrayBufferToHex(iv),
        salt: this._arrayBufferToHex(salt)
      };
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Error al encriptar datos');
    }
  }

  /**
   * Decrypt data using AES-GCM
   * @param {string} encryptedHex - Encrypted data (hex string)
   * @param {string} ivHex - IV (hex string)
   * @param {string} saltHex - Salt (hex string)
   * @param {string} password - Password for decryption
   * @returns {Promise<string>} Decrypted data
   */
  async decryptData(encryptedHex, ivHex, saltHex, password) {
    try {
      // Convert hex to Uint8Array
      const encrypted = this._hexToUint8Array(encryptedHex);
      const iv = this._hexToUint8Array(ivHex);
      const salt = this._hexToUint8Array(saltHex);

      // Derive key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        this.encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      return this.decoder.decode(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Error al desencriptar datos');
    }
  }
}

// Create singleton instance
const cryptoService = new CryptoService();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.CryptoService = CryptoService;
  window.cryptoService = cryptoService;
}

console.log('CryptoService loaded');
