// Validation utilities for authentication data
import { UserRole, AuthError, AuthErrorCodes } from '../types';
export class ValidationUtils {
    constructor() {
        this.EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;
        this.NAME_REGEX = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]{2,50}$/;
    }
    validateLoginCredentials(credentials) {
        const errors = [];
        if (!credentials.email) {
            errors.push('El email es obligatorio');
        }
        else if (!this.isValidEmail(credentials.email)) {
            errors.push('El formato del email no es válido');
        }
        if (!credentials.password) {
            errors.push('La contraseña es obligatoria');
        }
        else if (credentials.password.length < 6) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }
        if (errors.length > 0) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'Datos de inicio de sesión inválidos', { errors });
        }
    }
    validateRegisterData(userData) {
        const errors = [];
        // Email validation
        if (!userData.email) {
            errors.push('El email es obligatorio');
        }
        else if (!this.isValidEmail(userData.email)) {
            errors.push('El formato del email no es válido');
        }
        // Password validation
        if (!userData.password) {
            errors.push('La contraseña es obligatoria');
        }
        else {
            const passwordValidation = this.validatePasswordStrength(userData.password);
            if (!passwordValidation.isValid) {
                errors.push(...passwordValidation.errors);
            }
        }
        // Name validation
        if (!userData.nombre) {
            errors.push('El nombre es obligatorio');
        }
        else if (!this.isValidName(userData.nombre)) {
            errors.push('El nombre debe tener entre 2 y 50 caracteres y solo contener letras y espacios');
        }
        // Phone validation (optional)
        if (userData.telefono && !this.isValidPhone(userData.telefono)) {
            errors.push('El formato del teléfono no es válido');
        }
        // Role validation
        if (!userData.rol) {
            errors.push('El rol es obligatorio');
        }
        else if (!Object.values(UserRole).includes(userData.rol)) {
            errors.push('El rol especificado no es válido');
        }
        if (errors.length > 0) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'Datos de registro inválidos', { errors });
        }
    }
    validatePassword(password) {
        const validation = this.validatePasswordStrength(password);
        if (!validation.isValid) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'La contraseña no cumple con los requisitos de seguridad', { errors: validation.errors });
        }
    }
    validateEmail(email) {
        if (!email) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'El email es obligatorio');
        }
        if (!this.isValidEmail(email)) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'El formato del email no es válido');
        }
    }
    validateName(name) {
        if (!name) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'El nombre es obligatorio');
        }
        if (!this.isValidName(name)) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'El nombre debe tener entre 2 y 50 caracteres y solo contener letras y espacios');
        }
    }
    validatePhone(phone) {
        if (phone && !this.isValidPhone(phone)) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'El formato del teléfono no es válido');
        }
    }
    validateRole(role) {
        if (!role) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'El rol es obligatorio');
        }
        if (!Object.values(UserRole).includes(role)) {
            throw new AuthError(AuthErrorCodes.VALIDATION_ERROR, 'El rol especificado no es válido');
        }
    }
    sanitizeInput(input) {
        if (!input)
            return '';
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes
            .substring(0, 255); // Limit length
    }
    sanitizeEmail(email) {
        return email.toLowerCase().trim();
    }
    sanitizeName(name) {
        return name
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, ''); // Remove non-letter characters except spaces
    }
    sanitizePhone(phone) {
        return phone
            .replace(/[^\d\+]/g, '') // Keep only digits and plus sign
            .trim();
    }
    // Private validation methods
    isValidEmail(email) {
        return this.EMAIL_REGEX.test(email.toLowerCase());
    }
    isValidPhone(phone) {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        return this.PHONE_REGEX.test(cleanPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
    }
    isValidName(name) {
        return this.NAME_REGEX.test(name.trim());
    }
    validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('La contraseña debe incluir al menos una letra minúscula');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('La contraseña debe incluir al menos una letra mayúscula');
        }
        if (!/\d/.test(password)) {
            errors.push('La contraseña debe incluir al menos un número');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('La contraseña debe incluir al menos un carácter especial');
        }
        // Check for common weak patterns
        if (/(.)\1{2,}/.test(password)) {
            errors.push('La contraseña no debe repetir el mismo carácter más de 2 veces consecutivas');
        }
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('La contraseña es demasiado común, elige una más segura');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
//# sourceMappingURL=validation-utils.js.map