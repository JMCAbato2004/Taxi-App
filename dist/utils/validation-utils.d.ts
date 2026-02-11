import { LoginCredentials, UserRegistrationData } from '../types';
export declare class ValidationUtils {
    private readonly EMAIL_REGEX;
    private readonly PHONE_REGEX;
    private readonly NAME_REGEX;
    validateLoginCredentials(credentials: LoginCredentials): void;
    validateRegisterData(userData: UserRegistrationData): void;
    validatePassword(password: string): void;
    validateEmail(email: string): void;
    validateName(name: string): void;
    validatePhone(phone: string): void;
    validateRole(role: string): void;
    sanitizeInput(input: string): string;
    sanitizeEmail(email: string): string;
    sanitizeName(name: string): string;
    sanitizePhone(phone: string): string;
    private isValidEmail;
    private isValidPhone;
    private isValidName;
    private validatePasswordStrength;
}
//# sourceMappingURL=validation-utils.d.ts.map