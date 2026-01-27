/**
 * Middleware Integration Service
 * Provides decorators and helper functions for easy authorization integration
 * Requirements: 6.1, 6.2
 */
import { AuthError, AuthErrorCode } from '../types';
import { AuthorizationMiddleware, createAuthorizationContext, DEFAULT_ENCRYPTION_CONFIG } from './authorization-middleware';
/**
 * Middleware Integration Service
 * Provides high-level integration methods for authorization
 */
export class MiddlewareIntegration {
    constructor(authMiddleware) {
        this.authMiddleware = authMiddleware || new AuthorizationMiddleware();
    }
    /**
     * Require permission for method execution
     */
    async requirePermission(user, options, operation) {
        const context = createAuthorizationContext(user, options.resource || 'unknown', options.action || 'execute', options.permission);
        const result = await this.authMiddleware.authorize(context);
        if (!result.authorized) {
            throw result.error || new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Acceso denegado');
        }
        const operationResult = await operation();
        // Encrypt sensitive data if requested
        if (options.encryptSensitiveData && operationResult) {
            const config = options.encryptionConfig || DEFAULT_ENCRYPTION_CONFIG;
            return await this.authMiddleware.encryptSensitiveData(operationResult, config);
        }
        return operationResult;
    }
    /**
     * Validate data access and filter results
     */
    async validateAndFilterData(user, data, permission, resource = 'data') {
        if (!user) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        const context = createAuthorizationContext(user, resource, 'read', permission);
        const result = await this.authMiddleware.authorize(context);
        if (!result.authorized) {
            throw result.error || new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para acceder a los datos');
        }
        // Filter data based on user permissions
        return data.filter(item => this.authMiddleware.validateDataAccess(user, item, 'read'));
    }
    /**
     * Get authorization middleware instance
     */
    getMiddleware() {
        return this.authMiddleware;
    }
}
/**
 * Global middleware integration instance
 */
export const middlewareIntegration = new MiddlewareIntegration();
//# sourceMappingURL=middleware-integration.js.map