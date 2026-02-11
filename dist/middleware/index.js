/**
 * Authorization Middleware Module
 * Exports all middleware components for easy import
 */
export { AuthorizationMiddleware, createAuthorizationContext, DEFAULT_ENCRYPTION_CONFIG, authorizationMiddleware } from './authorization-middleware';
export { MiddlewareIntegration, middlewareIntegration } from './middleware-integration';
// Re-export relevant types from main types module
export { Permission, UserRole, AuthError, AuthErrorCode, ROLE_PERMISSIONS } from '../types';
//# sourceMappingURL=index.js.map