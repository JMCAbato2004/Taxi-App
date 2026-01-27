// Authentication types and interfaces
export var UserRole;
(function (UserRole) {
    UserRole["PATRON"] = "patron";
    UserRole["TAXISTA"] = "taxista";
})(UserRole || (UserRole = {}));
export var Permission;
(function (Permission) {
    Permission["VIEW_ALL_DRIVERS"] = "view_all_drivers";
    Permission["MANAGE_ASSOCIATIONS"] = "manage_associations";
    Permission["VIEW_OWN_DATA"] = "view_own_data";
    Permission["EDIT_PROFILE"] = "edit_profile";
    Permission["VIEW_REPORTS"] = "view_reports";
    Permission["MANAGE_SERVICES"] = "manage_services";
    Permission["MANAGE_EXPENSES"] = "manage_expenses";
})(Permission || (Permission = {}));
// Error types
export var AuthErrorCodes;
(function (AuthErrorCodes) {
    AuthErrorCodes["INVALID_CREDENTIALS"] = "AUTH_001";
    AuthErrorCodes["SESSION_EXPIRED"] = "AUTH_002";
    AuthErrorCodes["INSUFFICIENT_PERMISSIONS"] = "AUTH_003";
    AuthErrorCodes["INVALID_TOKEN"] = "AUTH_004";
    AuthErrorCodes["USER_NOT_FOUND"] = "AUTH_005";
    AuthErrorCodes["DUPLICATE_EMAIL"] = "AUTH_006";
    AuthErrorCodes["INVALID_ASSOCIATION"] = "AUTH_007";
    AuthErrorCodes["ROLE_MISMATCH"] = "AUTH_008";
    AuthErrorCodes["VALIDATION_ERROR"] = "AUTH_009";
    AuthErrorCodes["NETWORK_ERROR"] = "AUTH_010";
})(AuthErrorCodes || (AuthErrorCodes = {}));
export class AuthError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AuthError';
    }
}
//# sourceMappingURL=index.js.map