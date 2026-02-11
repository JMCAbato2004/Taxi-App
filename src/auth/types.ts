/**
 * Main types export file for authentication system
 * Provides centralized access to all type definitions
 */

// Core types and interfaces
export * from './types/index';

// Database-specific types
export * from './types/database';

// Validation types and utilities
export * from './types/validation';

// Re-export commonly used types for convenience
export type {
  User,
  PatronUser,
  TaxistaUser,
  Association,
  Session,
  LoginCredentials,
  AuthResult,
  JWTPayload,
  UserRegistrationData,
  UserUpdateData,
  AssociationWithDetails,
  AvailableTaxista,
  PatronDashboard,
  ValidationResult,
  ValidationError,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  IAuthService,
  IRoleService
} from './types/index';

export {
  UserRole,
  Permission,
  AuthErrorCode,
  NotificationType,
  isPatronUser,
  isTaxistaUser,
  ROLE_PERMISSIONS,
  DEFAULT_PASSWORD_REQUIREMENTS,
  TAXISTA_NUMBER_REGEX,
  EMAIL_REGEX,
  TOKEN_EXPIRATION,
  MAX_SESSIONS_PER_USER
} from './types/index';

export type {
  UserEntity,
  AssociationEntity,
  SessionEntity,
  CreateUserParams,
  UpdateUserParams,
  CreateAssociationParams,
  CreateSessionParams,
  UserQueryFilters,
  AssociationQueryFilters,
  SessionQueryFilters,
  PaginationParams,
  PaginatedQueryResult,
  DatabaseConnection,
  DatabaseTransaction,
  IUserRepository,
  IAssociationRepository,
  ISessionRepository
} from './types/database';

export {
  transformUserEntity,
  transformAssociationEntity,
  transformSessionEntity,
  DEFAULT_SEED_DATA
} from './types/database';

export type {
  ValidationRule,
  ValidationRuleResult,
  FieldValidation,
  ValidationSchema,
  UserRegistrationValidation,
  LoginValidation,
  ProfileUpdateValidation,
  PasswordChangeValidation,
  AssociationValidation,
  DetailedValidationError,
  ComprehensiveValidationResult
} from './types/validation';

export {
  ValidationErrorCode,
  RequiredRule,
  EmailRule,
  PasswordStrengthRule,
  PhoneRule,
  LengthRule,
  UUIDRule,
  TaxistaNumberRule,
  RoleRule,
  USER_REGISTRATION_SCHEMA,
  LOGIN_SCHEMA,
  PROFILE_UPDATE_SCHEMA,
  PASSWORD_CHANGE_SCHEMA,
  ASSOCIATION_SCHEMA,
  validateField,
  validateForm,
  validateUserRegistration,
  validateLogin,
  sanitizeInput
} from './types/validation';