/**
 * Authorization Middleware for Role-Based Access Control
 * Implements permission validation, access logging, and data encryption
 * Requirements: 6.1, 6.2, 6.5
 */
import { User, Permission, AuthError, AuthErrorCode, UserRole } from '../types';
import { CryptoUtils } from '../utils/crypto-utils';
/**
 * Access attempt log entry
 */
export interface AccessAttempt {
    id: string;
    userId?: string;
    userEmail?: string;
    userRole?: UserRole;
    resource: string;
    action: string;
    permission: Permission;
    timestamp: Date;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    errorCode?: AuthErrorCode;
    errorMessage?: string;
    additionalData?: Record<string, any>;
}
/**
 * Authorization context for middleware operations
 */
export interface AuthorizationContext {
    user: User | null;
    resource: string;
    action: string;
    requiredPermission: Permission;
    data?: any;
    ipAddress?: string;
    userAgent?: string;
}
/**
 * Authorization result
 */
export interface AuthorizationResult {
    authorized: boolean;
    user: User | null;
    error?: AuthError;
    logEntry: AccessAttempt;
}
/**
 * Sensitive data encryption configuration
 */
export interface EncryptionConfig {
    encryptFields: string[];
    encryptionKey?: string;
    skipEncryption?: boolean;
}
/**
 * Authorization Middleware Class
 * Provides comprehensive access control, logging, and data protection
 */
export declare class AuthorizationMiddleware {
    private readonly ACCESS_LOG_KEY;
    private readonly MAX_LOG_ENTRIES;
    private cryptoUtils;
    constructor(cryptoUtils?: CryptoUtils);
    /**
     * Main authorization check method
     * Validates permissions and logs access attempts
     */
    authorize(context: AuthorizationContext): Promise<AuthorizationResult>;
    /**
     * Check if user has specific permission
     */
    hasPermission(user: User, permission: Permission): boolean;
    /**
     * Validate data access permissions
     * Checks if user can access specific data based on ownership and associations
     */
    validateDataAccess(user: User | null, targetData: any, operation?: 'read' | 'write' | 'delete'): Promise<boolean>;
    /**
     * Encrypt sensitive data fields
     */
    encryptSensitiveData<T extends Record<string, any>>(data: T, config: EncryptionConfig): Promise<T>;
    /**
     * Decrypt sensitive data fields
     */
    decryptSensitiveData<T extends Record<string, any>>(data: T, config: EncryptionConfig): Promise<T>;
    /**
     * Get access log entries
     */
    getAccessLog(options?: {
        userId?: string;
        resource?: string;
        success?: boolean;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    }): AccessAttempt[];
    /**
     * Get security statistics
     */
    getSecurityStatistics(timeframe?: 'day' | 'week' | 'month'): {
        totalAttempts: number;
        successfulAttempts: number;
        failedAttempts: number;
        uniqueUsers: number;
        topFailedResources: Array<{
            resource: string;
            count: number;
        }>;
        suspiciousActivity: AccessAttempt[];
    };
    /**
     * Clear old access log entries to prevent storage bloat
     */
    cleanupAccessLog(maxAge?: number): number;
    private createLogEntry;
    private logAccessAttempt;
    private isOwnData;
    private canPatronAccessData;
    private isAssociatedTaxistaNumber;
    private getStoredAccessLog;
    private storeAccessLog;
    private getStoredUsers;
    private getStoredAssociations;
    private generateLogId;
}
/**
 * Convenience function to create authorization context
 */
export declare function createAuthorizationContext(user: User | null, resource: string, action: string, requiredPermission: Permission, options?: {
    data?: any;
    ipAddress?: string;
    userAgent?: string;
}): AuthorizationContext;
/**
 * Default encryption configuration for common sensitive fields
 */
export declare const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig;
/**
 * Singleton instance for global use
 */
export declare const authorizationMiddleware: AuthorizationMiddleware;
//# sourceMappingURL=authorization-middleware.d.ts.map