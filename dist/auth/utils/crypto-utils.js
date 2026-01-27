// Crypto utilities for password hashing and validation
import { AuthError, AuthErrorCodes } from '../types';
export class CryptoUtils {
    constructor() {
        this.SALT_ROUNDS = 12;
    }
    async hashPassword(password) {
        try {
            // In a real implementation, use bcrypt
            // For now, we'll use a simple hash with salt
            const salt = this.generateSalt();
            const hash = await this.simpleHash(password + salt);
            return `${salt}:${hash}`;
        }
        catch (error) {
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error al encriptar contraseña', error);
        }
    }
    async comparePassword(password, hashedPassword) {
        try {
            const [salt, hash] = hashedPassword.split(':');
            if (!salt || !hash) {
                return false;
            }
            const computedHash = await this.simpleHash(password + salt);
            return this.secureCompare(hash, computedHash);
        }
        catch (error) {
            console.error('Error comparing password:', error);
            return false;
        }
    }
    generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        // Use crypto.getRandomValues if available, otherwise fallback to Math.random
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            for (let i = 0; i < length; i++) {
                result += chars[array[i] % chars.length];
            }
        }
        else {
            for (let i = 0; i < length; i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        return result;
    }
    async encryptSensitiveData(data, key) {
        // Simple encryption for demo purposes
        // In production, use proper encryption libraries
        const encryptionKey = key || this.getDefaultEncryptionKey();
        try {
            let encrypted = '';
            for (let i = 0; i < data.length; i++) {
                const dataChar = data.charCodeAt(i);
                const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
                encrypted += String.fromCharCode(dataChar ^ keyChar);
            }
            return btoa(encrypted);
        }
        catch (error) {
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error al encriptar datos', error);
        }
    }
    async decryptSensitiveData(encryptedData, key) {
        const encryptionKey = key || this.getDefaultEncryptionKey();
        try {
            const encrypted = atob(encryptedData);
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                const encryptedChar = encrypted.charCodeAt(i);
                const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
                decrypted += String.fromCharCode(encryptedChar ^ keyChar);
            }
            return decrypted;
        }
        catch (error) {
            throw new AuthError(AuthErrorCodes.NETWORK_ERROR, 'Error al desencriptar datos', error);
        }
    }
    validatePasswordStrength(password) {
        const feedback = [];
        let score = 0;
        // Length check
        if (password.length >= 8) {
            score += 1;
        }
        else {
            feedback.push('La contraseña debe tener al menos 8 caracteres');
        }
        if (password.length >= 12) {
            score += 1;
        }
        // Character variety checks
        if (/[a-z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Incluye al menos una letra minúscula');
        }
        if (/[A-Z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Incluye al menos una letra mayúscula');
        }
        if (/\d/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Incluye al menos un número');
        }
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Incluye al menos un carácter especial');
        }
        // Common patterns check
        if (!/(.)\1{2,}/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Evita repetir el mismo carácter más de 2 veces');
        }
        const isValid = score >= 4 && password.length >= 8;
        return {
            isValid,
            score,
            feedback
        };
    }
    // Private helper methods
    generateSalt() {
        return this.generateSecureToken(16);
    }
    async simpleHash(input) {
        // Simple hash function for demo purposes
        // In production, use proper hashing algorithms like bcrypt or Argon2
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            // Use Web Crypto API if available
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        else {
            // Fallback simple hash
            let hash = 0;
            for (let i = 0; i < input.length; i++) {
                const char = input.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(16);
        }
    }
    secureCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }
    getDefaultEncryptionKey() {
        // In production, this should come from environment variables
        return 'taxi_app_encryption_key_2024_secure';
    }
}
//# sourceMappingURL=crypto-utils.js.map