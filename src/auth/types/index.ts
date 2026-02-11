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
export enum UserRole {
  PATRON = 'patron',
  TAXISTA = 'taxista'
}

/**
 * System permissions based on user roles
 * Used for fine-grained access control
 */
export enum Permission {
  // Patron permissions
  VIEW_ALL_DRIVERS = 'view_all_drivers',
  MANAGE_ASSOCIATIONS = 'manage_associations',
  VIEW_AGGREGATED_REPORTS = 'view_aggregated_reports',
  SEARCH_AVAILABLE_TAXISTAS = 'search_available_taxistas',
  
  // Taxista permissions
  VIEW_OWN_DATA = 'view_own_data',
  EDIT_OWN_PROFILE = 'edit_own_profile',
  VIEW_OWN_HISTORY = 'view_own_history',
  INPUT_OPERATIONAL_DATA = 'input_operational_data',
  
  // Common permissions
  EDIT_PROFILE = 'edit_profile',
  CHANGE_PASSWORD = 'change_password',
  VIEW_NOTIFICATIONS = 'view_notifications'
}

/**
 * Authentication error codes for consistent error handling
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_001',
  SESSION_EXPIRED = 'AUTH_002',
  INSUFFICIENT_PERMISSIONS = 'AUTH_003',
  INVALID_TOKEN = 'AUTH_004',
  USER_NOT_FOUND = 'AUTH_005',
  DUPLICATE_EMAIL = 'AUTH_006',
  INVALID_ASSOCIATION = 'AUTH_007',
  ROLE_MISMATCH = 'AUTH_008',
  VALIDATION_ERROR = 'AUTH_009',
  NETWORK_ERROR = 'AUTH_010'
}

/**
 * Authentication error class for consistent error handling
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ============================================================================
// CORE DATA MODELS
// ============================================================================

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
  numeroTaxista?: string | undefined; // Only for taxistas, format: TX001-TX999
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

// ============================================================================
// AUTHENTICATION INTERFACES
// ============================================================================

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
  sub: string; // user id
  email: string;
  role: UserRole;
  numeroTaxista?: string | undefined; // only for taxistas
  permissions: Permission[];
  iat: number; // issued at
  exp: number; // expires at
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

// ============================================================================
// ROLE-SPECIFIC INTERFACES
// ============================================================================

/**
 * Patron-specific user interface with additional properties
 */
export interface PatronUser extends User {
  rol: UserRole.PATRON;
  numeroTaxista?: undefined; // Patrones don't have taxista numbers
}

/**
 * Taxista-specific user interface with required numero_taxista
 */
export interface TaxistaUser extends User {
  rol: UserRole.TAXISTA;
  numeroTaxista: string; // Required for taxistas
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

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

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

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

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

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

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

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if user is a patron
 */
export const isPatronUser = (user: User): user is PatronUser => {
  return user.rol === UserRole.PATRON && !user.numeroTaxista;
};

/**
 * Type guard to check if user is a taxista
 */
export const isTaxistaUser = (user: User): user is TaxistaUser => {
  return user.rol === UserRole.TAXISTA && !!user.numeroTaxista;
};

/**
 * Permission mapping by role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
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
} as const;

/**
 * Maximum number of active sessions per user
 */
export const MAX_SESSIONS_PER_USER = 5;

/**
 * Association notification types
 */
export enum NotificationType {
  ASSOCIATION_CREATED = 'association_created',
  ASSOCIATION_REMOVED = 'association_removed',
  PROFILE_UPDATED = 'profile_updated',
  PASSWORD_CHANGED = 'password_changed'
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