/**
 * PasswordService - Secure password hashing and verification
 * Uses bcrypt-like algorithm for password security
 * 
 * Security Features:
 * - Salted hashing
 * - Configurable work factor
 * - Timing-safe comparison
 * - Password strength validation
 */

class PasswordService {
  constructor() {
    // Work factor (cost) - higher is more secure but slower
    // 10 = ~10 hashes/sec, 12 = ~2.5 hashes/sec
    this.WORK_FACTOR = 10;
    
    // Password requirements
    this.MIN_LENGTH = 8;
    this.MAX_LENGTH = 128;
  }

  /**
   * Hash a password using PBKDF2
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password with salt
   */
  async hashPassword(password) {
    try {
      // Validate password
      this.validatePassword(password);

      // Generate random salt
      const salt = this.generateSalt();

      // Hash password with salt using PBKDF2
      const hash = await this.pbkdf2(password, salt, this.WORK_FACTOR);

      // Format: $algorithm$workFactor$salt$hash
      return `$pbkdf2$${this.WORK_FACTOR}$${salt}$${hash}`;
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Error al procesar la contraseña');
    }
  }

  /**
   * Verify a password against a hash
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hashedPassword) {
    try {
      // Parse hashed password
      const parts = hashedPassword.split('$');
      if (parts.length !== 5 || parts[1] !== 'pbkdf2') {
        throw new Error('Invalid hash format');
      }

      const [, algorithm, workFactor, salt, hash] = parts;

      // Hash the provided password with the same salt
      const testHash = await this.pbkdf2(password, salt, parseInt(workFactor));

      // Timing-safe comparison
      return this.timingSafeEqual(hash, testHash);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * PBKDF2 implementation using Web Crypto API
   * @private
   * @param {string} password - Password to hash
   * @param {string} salt - Salt (hex string)
   * @param {number} iterations - Number of iterations
   * @returns {Promise<string>} Hash (hex string)
   */
  async pbkdf2(password, salt, iterations) {
    try {
      // Convert password to ArrayBuffer
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);

      // Convert salt from hex to ArrayBuffer
      const saltBuffer = this.hexToArrayBuffer(salt);

      // Import password as key
      const key = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      // Derive bits using PBKDF2
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: Math.pow(2, iterations), // 2^10 = 1024 iterations
          hash: 'SHA-256'
        },
        key,
        256 // 256 bits = 32 bytes
      );

      // Convert to hex string
      return this.arrayBufferToHex(derivedBits);
    } catch (error) {
      console.error('PBKDF2 error:', error);
      throw error;
    }
  }

  /**
   * Generate random salt
   * @private
   * @returns {string} Salt (hex string)
   */
  generateSalt() {
    const array = new Uint8Array(16); // 128 bits
    crypto.getRandomValues(array);
    return this.arrayBufferToHex(array);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {Error} If password doesn't meet requirements
   */
  validatePassword(password) {
    if (!password) {
      throw new Error('La contraseña es obligatoria');
    }

    if (password.length < this.MIN_LENGTH) {
      throw new Error(`La contraseña debe tener al menos ${this.MIN_LENGTH} caracteres`);
    }

    if (password.length > this.MAX_LENGTH) {
      throw new Error(`La contraseña no puede tener más de ${this.MAX_LENGTH} caracteres`);
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new Error('La contraseña debe contener al menos un número');
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      throw new Error('La contraseña debe contener al menos una letra');
    }
  }

  /**
   * Check password strength
   * @param {string} password - Password to check
   * @returns {Object} Strength analysis
   */
  checkPasswordStrength(password) {
    const strength = {
      score: 0,
      level: 'weak',
      feedback: []
    };

    if (!password) {
      return strength;
    }

    // Length check
    if (password.length >= 8) strength.score += 1;
    if (password.length >= 12) strength.score += 1;
    if (password.length >= 16) strength.score += 1;

    // Character variety
    if (/[a-z]/.test(password)) strength.score += 1;
    if (/[A-Z]/.test(password)) strength.score += 1;
    if (/\d/.test(password)) strength.score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength.score += 1;

    // Determine level
    if (strength.score <= 2) {
      strength.level = 'weak';
      strength.feedback.push('Contraseña débil');
    } else if (strength.score <= 4) {
      strength.level = 'medium';
      strength.feedback.push('Contraseña media');
    } else if (strength.score <= 6) {
      strength.level = 'strong';
      strength.feedback.push('Contraseña fuerte');
    } else {
      strength.level = 'very-strong';
      strength.feedback.push('Contraseña muy fuerte');
    }

    // Specific feedback
    if (password.length < 12) {
      strength.feedback.push('Usa al menos 12 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      strength.feedback.push('Añade mayúsculas');
    }
    if (!/[a-z]/.test(password)) {
      strength.feedback.push('Añade minúsculas');
    }
    if (!/\d/.test(password)) {
      strength.feedback.push('Añade números');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      strength.feedback.push('Añade símbolos especiales');
    }

    return strength;
  }

  /**
   * Timing-safe string comparison
   * Prevents timing attacks
   * @private
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} True if strings are equal
   */
  timingSafeEqual(a, b) {
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
   * Convert ArrayBuffer to hex string
   * @private
   * @param {ArrayBuffer} buffer - Buffer to convert
   * @returns {string} Hex string
   */
  arrayBufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  /**
   * Convert hex string to ArrayBuffer
   * @private
   * @param {string} hex - Hex string
   * @returns {ArrayBuffer} Buffer
   */
  hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }

  /**
   * Generate a secure random password
   * @param {number} length - Password length (default 16)
   * @returns {string} Random password
   */
  generateSecurePassword(length = 16) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + symbols;

    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    let password = '';
    
    // Ensure at least one of each type
    password += lowercase[array[0] % lowercase.length];
    password += uppercase[array[1] % uppercase.length];
    password += numbers[array[2] % numbers.length];
    password += symbols[array[3] % symbols.length];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[array[i] % allChars.length];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.PasswordService = PasswordService;
}

console.log('PasswordService loaded');
