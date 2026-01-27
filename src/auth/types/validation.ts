/**
 * Validation types and utilities for authentication system
 * Provides comprehensive type-safe validation for all user inputs
 */

import { UserRole, EMAIL_REGEX, TAXISTA_NUMBER_REGEX } from './index';

// ============================================================================
// VALIDATION RULE TYPES
// ============================================================================

/**
 * Base validation rule interface
 */
export interface ValidationRule<T = any> {
  validate(value: T): ValidationRuleResult;
  message: string;
}

/**
 * Validation rule result
 */
export interface ValidationRuleResult {
  isValid: boolean;
  message?: string;
}

/**
 * Field validation configuration
 */
export interface FieldValidation {
  required?: boolean;
  rules?: ValidationRule[];
  customValidator?: (value: any, formData?: any) => ValidationRuleResult;
}

/**
 * Form validation schema
 */
export interface ValidationSchema {
  [fieldName: string]: FieldValidation;
}

// ============================================================================
// SPECIFIC VALIDATION TYPES
// ============================================================================

/**
 * User registration validation schema
 */
export interface UserRegistrationValidation {
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  telefono?: string;
  rol: UserRole;
}

/**
 * Login validation schema
 */
export interface LoginValidation {
  email: string;
  password: string;
}

/**
 * Profile update validation schema
 */
export interface ProfileUpdateValidation {
  nombre?: string;
  telefono?: string;
  email?: string;
}

/**
 * Password change validation schema
 */
export interface PasswordChangeValidation {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Association creation validation schema
 */
export interface AssociationValidation {
  patronId: string;
  taxistaId: string;
}

// ============================================================================
// VALIDATION ERROR TYPES
// ============================================================================

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  REQUIRED = 'REQUIRED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  TOO_SHORT = 'TOO_SHORT',
  TOO_LONG = 'TOO_LONG',
  PASSWORDS_DONT_MATCH = 'PASSWORDS_DONT_MATCH',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_ROLE = 'INVALID_ROLE',
  INVALID_UUID = 'INVALID_UUID',
  DUPLICATE_VALUE = 'DUPLICATE_VALUE',
  INVALID_TAXISTA_NUMBER = 'INVALID_TAXISTA_NUMBER'
}

/**
 * Detailed validation error
 */
export interface DetailedValidationError {
  field: string;
  code: ValidationErrorCode;
  message: string;
  value?: any;
  constraint?: any;
}

/**
 * Comprehensive validation result
 */
export interface ComprehensiveValidationResult {
  isValid: boolean;
  errors: DetailedValidationError[];
  warnings?: DetailedValidationError[];
}

// ============================================================================
// VALIDATION RULE IMPLEMENTATIONS
// ============================================================================

/**
 * Required field validation rule
 */
export class RequiredRule implements ValidationRule {
  message = 'Este campo es obligatorio';

  validate(value: any): ValidationRuleResult {
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
export class EmailRule implements ValidationRule<string> {
  message = 'Formato de email inválido';

  validate(value: string): ValidationRuleResult {
    if (!value) return { isValid: true }; // Let required rule handle empty values
    
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
export class PasswordStrengthRule implements ValidationRule<string> {
  message = 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números';

  constructor(
    private requirements = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    }
  ) {}

  validate(value: string): ValidationRuleResult {
    if (!value) return { isValid: true }; // Let required rule handle empty values

    const errors: string[] = [];

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
export class PhoneRule implements ValidationRule<string> {
  message = 'Formato de teléfono inválido';
  private phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;

  validate(value: string): ValidationRuleResult {
    if (!value) return { isValid: true }; // Optional field
    
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
export class LengthRule implements ValidationRule<string> {
  constructor(
    private min: number,
    private max: number,
    public message = `Debe tener entre ${min} y ${max} caracteres`
  ) {}

  validate(value: string): ValidationRuleResult {
    if (!value) return { isValid: true }; // Let required rule handle empty values
    
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
export class UUIDRule implements ValidationRule<string> {
  message = 'Formato de ID inválido';
  private uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  validate(value: string): ValidationRuleResult {
    if (!value) return { isValid: true };
    
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
export class TaxistaNumberRule implements ValidationRule<string> {
  message = 'Número de taxista debe tener formato TX001-TX999';

  validate(value: string): ValidationRuleResult {
    if (!value) return { isValid: true };
    
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
export class RoleRule implements ValidationRule<string> {
  message = 'Rol inválido';

  validate(value: string): ValidationRuleResult {
    if (!value) return { isValid: true };
    
    const isValid = Object.values(UserRole).includes(value as UserRole);
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
export const USER_REGISTRATION_SCHEMA: ValidationSchema = {
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
    customValidator: (value: any, formData?: any) => {
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
export const LOGIN_SCHEMA: ValidationSchema = {
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
export const PROFILE_UPDATE_SCHEMA: ValidationSchema = {
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
export const PASSWORD_CHANGE_SCHEMA: ValidationSchema = {
  currentPassword: {
    required: true
  },
  newPassword: {
    required: true,
    rules: [new PasswordStrengthRule()]
  },
  confirmNewPassword: {
    required: true,
    customValidator: (value: any, formData?: any) => {
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
export const ASSOCIATION_SCHEMA: ValidationSchema = {
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
export const validateField = (
  fieldName: string,
  value: any,
  schema: ValidationSchema,
  formData?: any
): DetailedValidationError[] => {
  const fieldValidation = schema[fieldName];
  if (!fieldValidation) return [];

  const errors: DetailedValidationError[] = [];

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
export const validateForm = (
  formData: Record<string, any>,
  schema: ValidationSchema
): ComprehensiveValidationResult => {
  const errors: DetailedValidationError[] = [];

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
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Validate and sanitize user registration data
 */
export const validateUserRegistration = (data: any): ComprehensiveValidationResult => {
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
export const validateLogin = (data: any): ComprehensiveValidationResult => {
  const sanitizedData = {
    email: sanitizeInput(data.email).toLowerCase(),
    password: data.password // Don't sanitize passwords
  };

  return validateForm(sanitizedData, LOGIN_SCHEMA);
};