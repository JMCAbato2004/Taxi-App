/**
 * Authorization Middleware Module
 * Exports all middleware components for easy import
 */

export {
  AuthorizationMiddleware,
  AccessAttempt,
  AuthorizationContext,
  AuthorizationResult,
  EncryptionConfig,
  createAuthorizationContext,
  DEFAULT_ENCRYPTION_CONFIG,
  authorizationMiddleware
} from './authorization-middleware';

export {
  MiddlewareIntegration,
  RequirePermissionOptions,
  middlewareIntegration
} from './middleware-integration';

// Re-export relevant types from main types module
export {
  Permission,
  UserRole,
  AuthError,
  AuthErrorCode,
  ROLE_PERMISSIONS
} from '../types';