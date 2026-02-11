/**
 * Middleware Integration Service
 * Provides decorators and helper functions for easy authorization integration
 * Requirements: 6.1, 6.2
 */
import { User, Permission } from '../types';
import { AuthorizationMiddleware, EncryptionConfig } from './authorization-middleware';
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
export declare class MiddlewareIntegration {
    private authMiddleware;
    constructor(authMiddleware?: AuthorizationMiddleware);
    /**
     * Require permission for method execution
     */
    requirePermission(user: User | null, options: RequirePermissionOptions, operation: () => Promise<any>): Promise<any>;
    /**
     * Validate data access and filter results
     */
    validateAndFilterData<T>(user: User | null, data: T[], permission: Permission, resource?: string): Promise<T[]>;
    /**
     * Get authorization middleware instance
     */
    getMiddleware(): AuthorizationMiddleware;
}
/**
 * Global middleware integration instance
 */
export declare const middlewareIntegration: MiddlewareIntegration;
//# sourceMappingURL=middleware-integration.d.ts.map