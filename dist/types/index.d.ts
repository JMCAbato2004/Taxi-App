/**
 * TypeScript interfaces for authentication with roles system
 * Aligns with database schema and supports business logic requirements
 * Requirements: 1.1, 1.2, 1.3
 */
/**
 * User roles in the system
 * Determines permissions and available functionality
 */
export declare enum UserRole {
    PATRON = "patron",
    TAXISTA = "taxista"
}
/**
 * System permissions based on user roles
 * Used for fine-grained access control
 */
export declare enum Permission {
    VIEW_ALL_DRIVERS = "view_all_drivers",
    MANAGE_ASSOCIATIONS = "manage_associations",
    VIEW_AGGREGATED_REPORTS = "view_aggregated_reports",
    SEARCH_AVAILABLE_TAXISTAS = "search_available_taxistas",
    VIEW_OWN_DATA = "view_own_data",
    EDIT_OWN_PROFILE = "edit_own_profile",
    VIEW_OWN_HISTORY = "view_own_history",
    INPUT_OPERATIONAL_DATA = "input_operational_data",
    EDIT_PROFILE = "edit_profile",
    CHANGE_PASSWORD = "change_password",
    VIEW_NOTIFICATIONS = "view_notifications"
}
/**
 * Authentication error codes for consistent error handling
 */
export declare enum AuthErrorCode {
    INVALID_CREDENTIALS = "AUTH_001",
    SESSION_EXPIRED = "AUTH_002",
    INSUFFICIENT_PERMISSIONS = "AUTH_003",
    INVALID_TOKEN = "AUTH_004",
    USER_NOT_FOUND = "AUTH_005",
    DUPLICATE_EMAIL = "AUTH_006",
    INVALID_ASSOCIATION = "AUTH_007",
    ROLE_MISMATCH = "AUTH_008",
    VALIDATION_ERROR = "AUTH_009",
    NETWORK_ERROR = "AUTH_010"
}
/**
 * Authentication error class for consistent error handling
 */
export declare class AuthError extends Error {
    code: AuthErrorCode;
    details?: any | undefined;
    constructor(code: AuthErrorCode, message: string, details?: any | undefined);
}
/**
 * Base user interface representing a user account
 * Maps to 'usuarios' table in database
 */
export interface User {
    readonly id: string;
    email: string;
    nombre: string;
    telefono?: string | undefined;
    rol: UserRole;
    numeroTaxista?: string | undefined;
    activo: boolean;
    readonly fechaCreacion: Date;
    readonly fechaActualizacion: Date;
}
/**
 * User data for registration (without system-generated fields)
 */
export interface UserRegistrationData {
    email: string;
    password: string;
    nombre: string;
    telefono?: string;
    rol: UserRole;
}
/**
 * User data for updates (excludes immutable fields)
 */
export interface UserUpdateData {
    nombre?: string;
    telefono?: string;
    email?: string;
}
/**
 * Association between patron and taxista
 * Maps to 'asociaciones' table in database
 */
export interface Association {
    readonly id: string;
    readonly patronId: string;
    readonly taxistaId: string;
    readonly fechaAsociacion: Date;
    activa: boolean;
}
/**
 * Extended association with user details for display purposes
 */
export interface AssociationWithDetails extends Association {
    patronNombre: string;
    patronEmail: string;
    taxistaNombre: string;
    taxistaEmail: string;
    taxistaNumero: string;
    taxistaTelefono?: string;
}
/**
 * Session information for JWT token management
 * Maps to 'sesiones' table in database
 */
export interface Session {
    readonly id: string;
    readonly usuarioId: string;
    refreshToken: string;
    dispositivo?: string | undefined;
    ipAddress?: string | undefined;
    readonly fechaCreacion: Date;
    readonly fechaExpiracion: Date;
    activa: boolean;
}
/**
 * Login credentials for authentication
 */
export interface LoginCredentials {
    email: string;
    password: string;
}
/**
 * Authentication result returned after successful login
 */
export interface AuthResult {
    user: User;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    permissions: Permission[];
}
/**
 * JWT token payload structure
 */
export interface JWTPayload {
    sub: string;
    email: string;
    role: UserRole;
    numeroTaxista?: string | undefined;
    permissions: Permission[];
    iat: number;
    exp: number;
}
/**
 * Token refresh request
 */
export interface TokenRefreshRequest {
    refreshToken: string;
}
/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
    token: string;
    expiresAt: Date;
}
/**
 * Patron-specific user interface with additional properties
 */
export interface PatronUser extends User {
    rol: UserRole.PATRON;
    numeroTaxista?: undefined;
}
/**
 * Taxista-specific user interface with required numero_taxista
 */
export interface TaxistaUser extends User {
    rol: UserRole.TAXISTA;
    numeroTaxista: string;
}
/**
 * Available taxista for association (not currently associated)
 */
export interface AvailableTaxista {
    id: string;
    email: string;
    nombre: string;
    telefono?: string | undefined;
    numeroTaxista: string;
    fechaCreacion: Date;
}
/**
 * Patron dashboard data with aggregated information
 */
export interface PatronDashboard {
    patronId: string;
    patronNombre: string;
    patronEmail: string;
    totalTaxistasAsociados: number;
    nuevasAsociacionesMes: number;
}
/**
 * Validation result for form inputs
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
/**
 * Individual validation error
 */
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
/**
 * Password validation requirements
 */
export interface PasswordRequirements {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
}
/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
}
/**
 * API error structure
 */
export interface ApiError {
    code: AuthErrorCode;
    message: string;
    details?: Record<string, any>;
}
/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
/**
 * Authentication service interface
 */
export interface IAuthService {
    login(credentials: LoginCredentials): Promise<AuthResult>;
    logout(): Promise<void>;
    register(userData: UserRegistrationData): Promise<User>;
    getCurrentUser(): User | null;
    isAuthenticated(): boolean;
    refreshToken(): Promise<string>;
    validateOfflineAccess(): boolean;
    changePassword(currentPassword: string, newPassword: string): Promise<void>;
}
/**
 * Role service interface for permission management
 */
export interface IRoleService {
    getUserRole(): UserRole | null;
    hasPermission(permission: Permission): boolean;
    getPermissions(): Permission[];
    getAssociatedUsers(): Promise<User[]>;
    createAssociation(patronId: string, taxistaId: string): Promise<Association>;
    removeAssociation(associationId: string): Promise<void>;
    searchAvailableTaxistas(query?: string): Promise<AvailableTaxista[]>;
    searchAvailableTaxistasAdvanced(options?: {
        searchTerm?: string;
        sortBy?: 'nombre' | 'email' | 'numeroTaxista' | 'fechaCreacion';
        sortOrder?: 'asc' | 'desc';
        limit?: number;
    }): Promise<AvailableTaxista[]>;
    filterDataByRole<T>(data: T[], userContext?: any): T[];
    canAccessUserData(targetUserId: string): boolean;
    getAccessibleUsers(): User[];
    validateDataAccess(targetData: any, operation?: 'read' | 'write' | 'delete'): boolean;
    getAggregatedDataSummary<T>(data: T[], aggregationField?: string): any;
    getNotifications(unreadOnly?: boolean): any[];
    markNotificationAsRead(notificationId: string): boolean;
    markAllNotificationsAsRead(): number;
    getUnreadNotificationCount(): number;
    getAssociationStatistics(): any;
}
/**
 * Type guard to check if user is a patron
 */
export declare const isPatronUser: (user: User) => user is PatronUser;
/**
 * Type guard to check if user is a taxista
 */
export declare const isTaxistaUser: (user: User) => user is TaxistaUser;
/**
 * Permission mapping by role
 */
export declare const ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
/**
 * Default password requirements
 */
export declare const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements;
/**
 * Taxista number format regex
 */
export declare const TAXISTA_NUMBER_REGEX: RegExp;
/**
 * Email format regex
 */
export declare const EMAIL_REGEX: RegExp;
/**
 * JWT token expiration times
 */
export declare const TOKEN_EXPIRATION: {
    readonly ACCESS_TOKEN: "15m";
    readonly REFRESH_TOKEN: "7d";
};
/**
 * Maximum number of active sessions per user
 */
export declare const MAX_SESSIONS_PER_USER = 5;
/**
 * Association notification types
 */
export declare enum NotificationType {
    ASSOCIATION_CREATED = "association_created",
    ASSOCIATION_REMOVED = "association_removed",
    PROFILE_UPDATED = "profile_updated",
    PASSWORD_CHANGED = "password_changed"
}
/**
 * Notification interface
 */
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    data?: Record<string, any>;
}
//# sourceMappingURL=index.d.ts.map