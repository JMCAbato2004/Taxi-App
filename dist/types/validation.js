/**
 * Validation types and utilities for authentication system
 * Provides comprehensive type-safe validation for all user inputs
 */
import { UserRole, EMAIL_REGEX, TAXISTA_NUMBER_REGEX } from './index';
// ============================================================================
// VALIDATION ERROR TYPES
// ============================================================================
/**
 * Validation error codes
 */
export var ValidationErrorCode;
(function (ValidationErrorCode) {
    ValidationErrorCode["REQUIRED"] = "REQUIRED";
    ValidationErrorCode["INVALID_FORMAT"] = "INVALID_FORMAT";
    ValidationErrorCode["TOO_SHORT"] = "TOO_SHORT";
    ValidationErrorCode["TOO_LONG"] = "TOO_LONG";
    ValidationErrorCode["PASSWORDS_DONT_MATCH"] = "PASSWORDS_DONT_MATCH";
    ValidationErrorCode["WEAK_PASSWORD"] = "WEAK_PASSWORD";
    ValidationErrorCode["INVALID_EMAIL"] = "INVALID_EMAIL";
    ValidationErrorCode["INVALID_PHONE"] = "INVALID_PHONE";
    ValidationErrorCode["INVALID_ROLE"] = "INVALID_ROLE";
    ValidationErrorCode["INVALID_UUID"] = "INVALID_UUID";
    ValidationErrorCode["DUPLICATE_VALUE"] = "DUPLICATE_VALUE";
    ValidationErrorCode["INVALID_TAXISTA_NUMBER"] = "INVALID_TAXISTA_NUMBER";
})(ValidationErrorCode || (ValidationErrorCode = {}));
// ============================================================================
// VALIDATION RULE IMPLEMENTATIONS
// ============================================================================
/**
 * Required field validation rule
 */
export class RequiredRule {
    constructor() {
        this.message = 'Este campo es obligatorio';
    }
    validate(value) {
        const isValid = value !== null && value !== undefined && value !== '';
        return {
            isValid,
            ...(isValid ? {} : { message: this.message })
        };
    }
}
/**
 * Email format validation rule
 */
export class EmailRule {
    constructor() {
        this.message = 'Formato de email inválido';
    }
    validate(value) {
        if (!value)
            return { isValid: true }; // Let required rule handle empty values
        const isValid = EMAIL_REGEX.test(value);
        return {
            isValid,
            ...(isValid ? {} : { message: this.message })
        };
    }
}
/**
 * Password strength validation rule
 */
export class PasswordStrengthRule {
    constructor(requirements = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
    }) {
        this.requirements = requirements;
        this.message = 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números';
    }
    validate(value) {
        if (!value)
            return { isValid: true }; // Let required rule handle empty values
        const errors = [];
        if (value.length < this.requirements.minLength) {
            errors.push(`al menos ${this.requirements.minLength} caracteres`);
        }
        if (this.requirements.requireUppercase && !/[A-Z]/.test(value)) {
            errors.push('al menos una mayúscula');
        }
        if (this.requirements.requireLowercase && !/[a-z]/.test(value)) {
            errors.push('al menos una minúscula');
        }
        if (this.requirements.requireNumbers && !/\d/.test(value)) {
            errors.push('al menos un número');
        }
        if (this.requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            errors.push('al menos un carácter especial');
        }
        const isValid = errors.length === 0;
        return {
            isValid,
            ...(isValid ? {} : { message: `La contraseña debe incluir: ${errors.join(', ')}` })
        };
    }
}
/**
 * Phone number validation rule
 */
export class PhoneRule {
    constructor() {
        this.message = 'Formato de teléfono inválido';
        this.phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
    }
    validate(value) {
        if (!value)
            return { isValid: true }; // Optional field
        const isValid = this.phoneRegex.test(value);
        return {
            isValid,
            ...(isValid ? {} : { message: this.message })
        };
    }
}
/**
 * String length validation rule
 */
export class LengthRule {
    constructor(min, max, message = `Debe tener entre ${min} y ${max} caracteres`) {
        this.min = min;
        this.max = max;
        this.message = message;
    }
    validate(value) {
        if (!value)
            return { isValid: true }; // Let required rule handle empty values
        const isValid = value.length >= this.min && value.length <= this.max;
        return {
            isValid,
            ...(isValid ? {} : { message: this.message })
        };
    }
}
/**
 * UUID format validation rule
 */
export class UUIDRule {
    constructor() {
        this.message = 'Formato de ID inválido';
        this.uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    }
    validate(value) {
        if (!value)
            return { isValid: true };
        const isValid = this.uuidRegex.test(value);
        return {
            isValid,
            ...(isValid ? {} : { message: this.message })
        };
    }
}
/**
 * Taxista number format validation rule
 */
export class TaxistaNumberRule {
    constructor() {
        this.message = 'Número de taxista debe tener formato TX001-TX999';
    }
    validate(value) {
        if (!value)
            return { isValid: true };
        const isValid = TAXISTA_NUMBER_REGEX.test(value);
        return {
            isValid,
            ...(isValid ? {} : { message: this.message })
        };
    }
}
/**
 * Role validation rule
 */
export class RoleRule {
    constructor() {
        this.message = 'Rol inválido';
    }
    validate(value) {
        if (!value)
            return { isValid: true };
        const isValid = Object.values(UserRole).includes(value);
        return {
            isValid,
            ...(isValid ? {} : { message: this.message })
        };
    }
}
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
/**
 * User registration validation schema
 */
export const USER_REGISTRATION_SCHEMA = {
    email: {
        required: true,
        rules: [new EmailRule()]
    },
    password: {
        required: true,
        rules: [new PasswordStrengthRule()]
    },
    confirmPassword: {
        required: true,
        customValidator: (value, formData) => {
            if (!formData || value !== formData.password) {
                return {
                    isValid: false,
                    message: 'Las contraseñas no coinciden'
                };
            }
            return { isValid: true };
        }
    },
    nombre: {
        required: true,
        rules: [new LengthRule(2, 255)]
    },
    telefono: {
        required: false,
        rules: [new PhoneRule()]
    },
    rol: {
        required: true,
        rules: [new RoleRule()]
    }
};
/**
 * Login validation schema
 */
export const LOGIN_SCHEMA = {
    email: {
        required: true,
        rules: [new EmailRule()]
    },
    password: {
        required: true
    }
};
/**
 * Profile update validation schema
 */
export const PROFILE_UPDATE_SCHEMA = {
    nombre: {
        required: false,
        rules: [new LengthRule(2, 255)]
    },
    telefono: {
        required: false,
        rules: [new PhoneRule()]
    },
    email: {
        required: false,
        rules: [new EmailRule()]
    }
};
/**
 * Password change validation schema
 */
export const PASSWORD_CHANGE_SCHEMA = {
    currentPassword: {
        required: true
    },
    newPassword: {
        required: true,
        rules: [new PasswordStrengthRule()]
    },
    confirmNewPassword: {
        required: true,
        customValidator: (value, formData) => {
            if (!formData || value !== formData.newPassword) {
                return {
                    isValid: false,
                    message: 'Las contraseñas no coinciden'
                };
            }
            return { isValid: true };
        }
    }
};
/**
 * Association creation validation schema
 */
export const ASSOCIATION_SCHEMA = {
    patronId: {
        required: true,
        rules: [new UUIDRule()]
    },
    taxistaId: {
        required: true,
        rules: [new UUIDRule()]
    }
};
// ============================================================================
// VALIDATION UTILITIES
// ============================================================================
/**
 * Validate a single field against its schema
 */
export const validateField = (fieldName, value, schema, formData) => {
    const fieldValidation = schema[fieldName];
    if (!fieldValidation)
        return [];
    const errors = [];
    // Check required
    if (fieldValidation.required) {
        const requiredRule = new RequiredRule();
        const result = requiredRule.validate(value);
        if (!result.isValid) {
            errors.push({
                field: fieldName,
                code: ValidationErrorCode.REQUIRED,
                message: result.message || requiredRule.message,
                value
            });
            return errors; // Don't continue if required field is empty
        }
    }
    // Check rules
    if (fieldValidation.rules) {
        for (const rule of fieldValidation.rules) {
            const result = rule.validate(value);
            if (!result.isValid) {
                errors.push({
                    field: fieldName,
                    code: ValidationErrorCode.INVALID_FORMAT,
                    message: result.message || rule.message,
                    value
                });
            }
        }
    }
    // Check custom validator
    if (fieldValidation.customValidator) {
        const result = fieldValidation.customValidator(value, formData);
        if (!result.isValid) {
            errors.push({
                field: fieldName,
                code: ValidationErrorCode.INVALID_FORMAT,
                message: result.message || 'Valor inválido',
                value
            });
        }
    }
    return errors;
};
/**
 * Validate entire form against schema
 */
export const validateForm = (formData, schema) => {
    const errors = [];
    for (const fieldName in schema) {
        const fieldErrors = validateField(fieldName, formData[fieldName], schema, formData);
        errors.push(...fieldErrors);
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
/**
 * Sanitize user input
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string')
        return '';
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000); // Limit length
};
/**
 * Validate and sanitize user registration data
 */
export const validateUserRegistration = (data) => {
    // Sanitize inputs
    const sanitizedData = {
        email: sanitizeInput(data.email).toLowerCase(),
        password: data.password, // Don't sanitize passwords
        confirmPassword: data.confirmPassword,
        nombre: sanitizeInput(data.nombre),
        telefono: data.telefono ? sanitizeInput(data.telefono) : undefined,
        rol: data.rol
    };
    return validateForm(sanitizedData, USER_REGISTRATION_SCHEMA);
};
/**
 * Validate login credentials
 */
export const validateLogin = (data) => {
    const sanitizedData = {
        email: sanitizeInput(data.email).toLowerCase(),
        password: data.password // Don't sanitize passwords
    };
    return validateForm(sanitizedData, LOGIN_SCHEMA);
};
//# sourceMappingURL=validation.js.map