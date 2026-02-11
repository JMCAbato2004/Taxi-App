/**
 * Validation types and utilities for authentication system
 * Provides comprehensive type-safe validation for all user inputs
 */
import { UserRole } from './index';
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
/**
 * Validation error codes
 */
export declare enum ValidationErrorCode {
    REQUIRED = "REQUIRED",
    INVALID_FORMAT = "INVALID_FORMAT",
    TOO_SHORT = "TOO_SHORT",
    TOO_LONG = "TOO_LONG",
    PASSWORDS_DONT_MATCH = "PASSWORDS_DONT_MATCH",
    WEAK_PASSWORD = "WEAK_PASSWORD",
    INVALID_EMAIL = "INVALID_EMAIL",
    INVALID_PHONE = "INVALID_PHONE",
    INVALID_ROLE = "INVALID_ROLE",
    INVALID_UUID = "INVALID_UUID",
    DUPLICATE_VALUE = "DUPLICATE_VALUE",
    INVALID_TAXISTA_NUMBER = "INVALID_TAXISTA_NUMBER"
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
/**
 * Required field validation rule
 */
export declare class RequiredRule implements ValidationRule {
    message: string;
    validate(value: any): ValidationRuleResult;
}
/**
 * Email format validation rule
 */
export declare class EmailRule implements ValidationRule<string> {
    message: string;
    validate(value: string): ValidationRuleResult;
}
/**
 * Password strength validation rule
 */
export declare class PasswordStrengthRule implements ValidationRule<string> {
    private requirements;
    message: string;
    constructor(requirements?: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
    });
    validate(value: string): ValidationRuleResult;
}
/**
 * Phone number validation rule
 */
export declare class PhoneRule implements ValidationRule<string> {
    message: string;
    private phoneRegex;
    validate(value: string): ValidationRuleResult;
}
/**
 * String length validation rule
 */
export declare class LengthRule implements ValidationRule<string> {
    private min;
    private max;
    message: string;
    constructor(min: number, max: number, message?: string);
    validate(value: string): ValidationRuleResult;
}
/**
 * UUID format validation rule
 */
export declare class UUIDRule implements ValidationRule<string> {
    message: string;
    private uuidRegex;
    validate(value: string): ValidationRuleResult;
}
/**
 * Taxista number format validation rule
 */
export declare class TaxistaNumberRule implements ValidationRule<string> {
    message: string;
    validate(value: string): ValidationRuleResult;
}
/**
 * Role validation rule
 */
export declare class RoleRule implements ValidationRule<string> {
    message: string;
    validate(value: string): ValidationRuleResult;
}
/**
 * User registration validation schema
 */
export declare const USER_REGISTRATION_SCHEMA: ValidationSchema;
/**
 * Login validation schema
 */
export declare const LOGIN_SCHEMA: ValidationSchema;
/**
 * Profile update validation schema
 */
export declare const PROFILE_UPDATE_SCHEMA: ValidationSchema;
/**
 * Password change validation schema
 */
export declare const PASSWORD_CHANGE_SCHEMA: ValidationSchema;
/**
 * Association creation validation schema
 */
export declare const ASSOCIATION_SCHEMA: ValidationSchema;
/**
 * Validate a single field against its schema
 */
export declare const validateField: (fieldName: string, value: any, schema: ValidationSchema, formData?: any) => DetailedValidationError[];
/**
 * Validate entire form against schema
 */
export declare const validateForm: (formData: Record<string, any>, schema: ValidationSchema) => ComprehensiveValidationResult;
/**
 * Sanitize user input
 */
export declare const sanitizeInput: (input: string) => string;
/**
 * Validate and sanitize user registration data
 */
export declare const validateUserRegistration: (data: any) => ComprehensiveValidationResult;
/**
 * Validate login credentials
 */
export declare const validateLogin: (data: any) => ComprehensiveValidationResult;
//# sourceMappingURL=validation.d.ts.map