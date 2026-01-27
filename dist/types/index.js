/**
 * TypeScript interfaces for authentication with roles system
 * Aligns with database schema and supports business logic requirements
 * Requirements: 1.1, 1.2, 1.3
 */
// ============================================================================
// ENUMS
// ============================================================================
/**
 * User roles in the system
 * Determines permissions and available functionality
 */
export var UserRole;
(function (UserRole) {
    UserRole["PATRON"] = "patron";
    UserRole["TAXISTA"] = "taxista";
})(UserRole || (UserRole = {}));
/**
 * System permissions based on user roles
 * Used for fine-grained access control
 */
export var Permission;
(function (Permission) {
    // Patron permissions
    Permission["VIEW_ALL_DRIVERS"] = "view_all_drivers";
    Permission["MANAGE_ASSOCIATIONS"] = "manage_associations";
    Permission["VIEW_AGGREGATED_REPORTS"] = "view_aggregated_reports";
    Permission["SEARCH_AVAILABLE_TAXISTAS"] = "search_available_taxistas";
    // Taxista permissions
    Permission["VIEW_OWN_DATA"] = "view_own_data";
    Permission["EDIT_OWN_PROFILE"] = "edit_own_profile";
    Permission["VIEW_OWN_HISTORY"] = "view_own_history";
    Permission["INPUT_OPERATIONAL_DATA"] = "input_operational_data";
    // Common permissions
    Permission["EDIT_PROFILE"] = "edit_profile";
    Permission["CHANGE_PASSWORD"] = "change_password";
    Permission["VIEW_NOTIFICATIONS"] = "view_notifications";
})(Permission || (Permission = {}));
/**
 * Authentication error codes for consistent error handling
 */
export var AuthErrorCode;
(function (AuthErrorCode) {
    AuthErrorCode["INVALID_CREDENTIALS"] = "AUTH_001";
    AuthErrorCode["SESSION_EXPIRED"] = "AUTH_002";
    AuthErrorCode["INSUFFICIENT_PERMISSIONS"] = "AUTH_003";
    AuthErrorCode["INVALID_TOKEN"] = "AUTH_004";
    AuthErrorCode["USER_NOT_FOUND"] = "AUTH_005";
    AuthErrorCode["DUPLICATE_EMAIL"] = "AUTH_006";
    AuthErrorCode["INVALID_ASSOCIATION"] = "AUTH_007";
    AuthErrorCode["ROLE_MISMATCH"] = "AUTH_008";
    AuthErrorCode["VALIDATION_ERROR"] = "AUTH_009";
    AuthErrorCode["NETWORK_ERROR"] = "AUTH_010";
})(AuthErrorCode || (AuthErrorCode = {}));
/**
 * Authentication error class for consistent error handling
 */
export class AuthError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AuthError';
    }
}
// ============================================================================
// UTILITY TYPES
// ============================================================================
/**
 * Type guard to check if user is a patron
 */
export const isPatronUser = (user) => {
    return user.rol === UserRole.PATRON && !user.numeroTaxista;
};
/**
 * Type guard to check if user is a taxista
 */
export const isTaxistaUser = (user) => {
    return user.rol === UserRole.TAXISTA && !!user.numeroTaxista;
};
/**
 * Permission mapping by role
 */
export const ROLE_PERMISSIONS = {
    [UserRole.PATRON]: [
        Permission.VIEW_ALL_DRIVERS,
        Permission.MANAGE_ASSOCIATIONS,
        Permission.VIEW_AGGREGATED_REPORTS,
        Permission.SEARCH_AVAILABLE_TAXISTAS,
        Permission.EDIT_PROFILE,
        Permission.CHANGE_PASSWORD,
        Permission.VIEW_NOTIFICATIONS
    ],
    [UserRole.TAXISTA]: [
        Permission.VIEW_OWN_DATA,
        Permission.EDIT_OWN_PROFILE,
        Permission.VIEW_OWN_HISTORY,
        Permission.INPUT_OPERATIONAL_DATA,
        Permission.EDIT_PROFILE,
        Permission.CHANGE_PASSWORD,
        Permission.VIEW_NOTIFICATIONS
    ]
};
/**
 * Default password requirements
 */
export const DEFAULT_PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
};
// ============================================================================
// CONSTANTS
// ============================================================================
/**
 * Taxista number format regex
 */
export const TAXISTA_NUMBER_REGEX = /^TX\d{3}$/;
/**
 * Email format regex
 */
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
/**
 * JWT token expiration times
 */
export const TOKEN_EXPIRATION = {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '7d'
};
/**
 * Maximum number of active sessions per user
 */
export const MAX_SESSIONS_PER_USER = 5;
/**
 * Association notification types
 */
export var NotificationType;
(function (NotificationType) {
    NotificationType["ASSOCIATION_CREATED"] = "association_created";
    NotificationType["ASSOCIATION_REMOVED"] = "association_removed";
    NotificationType["PROFILE_UPDATED"] = "profile_updated";
    NotificationType["PASSWORD_CHANGED"] = "password_changed";
})(NotificationType || (NotificationType = {}));
//# sourceMappingURL=index.js.map