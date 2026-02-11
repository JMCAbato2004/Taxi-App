/**
 * Middleware Integration Service
 * Provides decorators and helper functions for easy authorization integration
 * Requirements: 6.1, 6.2
 */

import { 
  User, 
  Permission, 
  AuthError, 
  AuthErrorCode 
} from '../types';
import { 
  AuthorizationMiddleware, 
  AuthorizationContext,
  createAuthorizationContext,
  EncryptionConfig,
  DEFAULT_ENCRYPTION_CONFIG
} from './authorization-middleware';

/**
 * Method decorator options
 */
export interface RequirePermissionOptions {
  permission: Permission;
  resource?: string;
  action?: string;
  encryptSensitiveData?: boolean;
  encryptionConfig?: EncryptionConfig;
}

/**
 * Middleware Integration Service
 * Provides high-level integration methods for authorization
 */
export class MiddlewareIntegration {
  private authMiddleware: AuthorizationMiddleware;

  constructor(authMiddleware?: AuthorizationMiddleware) {
    this.authMiddleware = authMiddleware || new AuthorizationMiddleware();
  }

  /**
   * Require permission for method execution
   */
  async requirePermission(
    user: User | null,
    options: RequirePermissionOptions,
    operation: () => Promise<any>
  ): Promise<any> {
    const context = createAuthorizationContext(
      user,
      options.resource || 'unknown',
      options.action || 'execute',
      options.permission
    );

    const result = await this.authMiddleware.authorize(context);
    
    if (!result.authorized) {
      throw result.error || new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Acceso denegado'
      );
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
  async validateAndFilterData<T>(
    user: User | null,
    data: T[],
    permission: Permission,
    resource: string = 'data'
  ): Promise<T[]> {
    if (!user) {
      throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
    }

    const context = createAuthorizationContext(user, resource, 'read', permission);
    const result = await this.authMiddleware.authorize(context);
    
    if (!result.authorized) {
      throw result.error || new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para acceder a los datos'
      );
    }

    // Filter data based on user permissions
    return data.filter(item => 
      this.authMiddleware.validateDataAccess(user, item, 'read')
    );
  }

  /**
   * Get authorization middleware instance
   */
  getMiddleware(): AuthorizationMiddleware {
    return this.authMiddleware;
  }
}

/**
 * Global middleware integration instance
 */
export const middlewareIntegration = new MiddlewareIntegration();