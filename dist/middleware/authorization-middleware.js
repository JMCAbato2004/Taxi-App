/**
 * Authorization Middleware for Role-Based Access Control
 * Implements permission validation, access logging, and data encryption
 * Requirements: 6.1, 6.2, 6.5
 */
import { AuthError, AuthErrorCode, UserRole, ROLE_PERMISSIONS } from '../types';
import { CryptoUtils } from '../utils/crypto-utils';
/**
 * Authorization Middleware Class
 * Provides comprehensive access control, logging, and data protection
 */
export class AuthorizationMiddleware {
    constructor(cryptoUtils) {
        this.ACCESS_LOG_KEY = 'taxi_access_log';
        this.MAX_LOG_ENTRIES = 1000;
        this.cryptoUtils = cryptoUtils || new CryptoUtils();
    }
    /**
     * Main authorization check method
     * Validates permissions and logs access attempts
     */
    async authorize(context) {
        const logEntry = this.createLogEntry(context);
        try {
            // Check if user is authenticated
            if (!context.user) {
                const error = new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
                logEntry.success = false;
                logEntry.errorCode = error.code;
                logEntry.errorMessage = error.message;
                await this.logAccessAttempt(logEntry);
                return {
                    authorized: false,
                    user: null,
                    error,
                    logEntry
                };
            }
            // Check if user has required permission
            const hasPermission = this.hasPermission(context.user, context.requiredPermission);
            if (!hasPermission) {
                const error = new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, `Sin permisos para ${context.action} en ${context.resource}`);
                logEntry.success = false;
                logEntry.errorCode = error.code;
                logEntry.errorMessage = error.message;
                logEntry.userId = context.user.id;
                logEntry.userEmail = context.user.email;
                logEntry.userRole = context.user.rol;
                await this.logAccessAttempt(logEntry);
                return {
                    authorized: false,
                    user: context.user,
                    error,
                    logEntry
                };
            }
            // Authorization successful
            logEntry.success = true;
            logEntry.userId = context.user.id;
            logEntry.userEmail = context.user.email;
            logEntry.userRole = context.user.rol;
            await this.logAccessAttempt(logEntry);
            return {
                authorized: true,
                user: context.user,
                logEntry
            };
        }
        catch (error) {
            const authError = error instanceof AuthError
                ? error
                : new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error durante la autorización', error);
            logEntry.success = false;
            logEntry.errorCode = authError.code;
            logEntry.errorMessage = authError.message;
            if (context.user) {
                logEntry.userId = context.user.id;
                logEntry.userEmail = context.user.email;
                logEntry.userRole = context.user.rol;
            }
            await this.logAccessAttempt(logEntry);
            return {
                authorized: false,
                user: context.user,
                error: authError,
                logEntry
            };
        }
    }
    /**
     * Check if user has specific permission
     */
    hasPermission(user, permission) {
        if (!user || !user.rol) {
            return false;
        }
        const userPermissions = ROLE_PERMISSIONS[user.rol];
        return userPermissions.includes(permission);
    }
    /**
     * Validate data access permissions
     * Checks if user can access specific data based on ownership and associations
     */
    async validateDataAccess(user, targetData, operation = 'read') {
        if (!user) {
            return false;
        }
        try {
            // Users can always access their own data
            if (this.isOwnData(user, targetData)) {
                return true;
            }
            // Patrones can access data from associated taxistas
            if (user.rol === UserRole.PATRON && operation === 'read') {
                return await this.canPatronAccessData(user, targetData);
            }
            // Taxistas cannot access other users' data
            return false;
        }
        catch (error) {
            console.error('Error validating data access:', error);
            return false;
        }
    }
    /**
     * Encrypt sensitive data fields
     */
    async encryptSensitiveData(data, config) {
        if (config.skipEncryption || config.encryptFields.length === 0) {
            return data;
        }
        try {
            const encryptedData = { ...data };
            for (const field of config.encryptFields) {
                if (encryptedData[field] && typeof encryptedData[field] === 'string') {
                    encryptedData[field] = await this.cryptoUtils.encryptSensitiveData(encryptedData[field], config.encryptionKey);
                }
            }
            return encryptedData;
        }
        catch (error) {
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al encriptar datos sensibles', error);
        }
    }
    /**
     * Decrypt sensitive data fields
     */
    async decryptSensitiveData(data, config) {
        if (config.skipEncryption || config.encryptFields.length === 0) {
            return data;
        }
        try {
            const decryptedData = { ...data };
            for (const field of config.encryptFields) {
                if (decryptedData[field] && typeof decryptedData[field] === 'string') {
                    decryptedData[field] = await this.cryptoUtils.decryptSensitiveData(decryptedData[field], config.encryptionKey);
                }
            }
            return decryptedData;
        }
        catch (error) {
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Error al desencriptar datos sensibles', error);
        }
    }
    /**
     * Get access log entries
     */
    getAccessLog(options = {}) {
        try {
            const allLogs = this.getStoredAccessLog();
            let filteredLogs = allLogs;
            // Apply filters
            if (options.userId) {
                filteredLogs = filteredLogs.filter(log => log.userId === options.userId);
            }
            if (options.resource) {
                filteredLogs = filteredLogs.filter(log => log.resource.toLowerCase().includes(options.resource.toLowerCase()));
            }
            if (options.success !== undefined) {
                filteredLogs = filteredLogs.filter(log => log.success === options.success);
            }
            if (options.startDate) {
                filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= options.startDate);
            }
            if (options.endDate) {
                filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= options.endDate);
            }
            // Sort by timestamp (newest first)
            filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            // Apply limit
            if (options.limit && options.limit > 0) {
                filteredLogs = filteredLogs.slice(0, options.limit);
            }
            return filteredLogs;
        }
        catch (error) {
            console.error('Error getting access log:', error);
            return [];
        }
    }
    /**
     * Get security statistics
     */
    getSecurityStatistics(timeframe = 'day') {
        try {
            const logs = this.getStoredAccessLog();
            // Calculate timeframe
            const now = new Date();
            const timeframeDays = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
            const startDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));
            const recentLogs = logs.filter(log => new Date(log.timestamp) >= startDate);
            const totalAttempts = recentLogs.length;
            const successfulAttempts = recentLogs.filter(log => log.success).length;
            const failedAttempts = totalAttempts - successfulAttempts;
            const uniqueUsers = new Set(recentLogs.filter(log => log.userId).map(log => log.userId)).size;
            // Top failed resources
            const failedResourceCounts = {};
            recentLogs
                .filter(log => !log.success)
                .forEach(log => {
                failedResourceCounts[log.resource] = (failedResourceCounts[log.resource] || 0) + 1;
            });
            const topFailedResources = Object.entries(failedResourceCounts)
                .map(([resource, count]) => ({ resource, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            // Suspicious activity (multiple failed attempts from same user)
            const userFailureCounts = {};
            recentLogs
                .filter(log => !log.success && log.userId)
                .forEach(log => {
                userFailureCounts[log.userId] = (userFailureCounts[log.userId] || 0) + 1;
            });
            const suspiciousActivity = recentLogs.filter(log => log.userId && userFailureCounts[log.userId] >= 5);
            return {
                totalAttempts,
                successfulAttempts,
                failedAttempts,
                uniqueUsers,
                topFailedResources,
                suspiciousActivity
            };
        }
        catch (error) {
            console.error('Error getting security statistics:', error);
            return {
                totalAttempts: 0,
                successfulAttempts: 0,
                failedAttempts: 0,
                uniqueUsers: 0,
                topFailedResources: [],
                suspiciousActivity: []
            };
        }
    }
    /**
     * Clear old access log entries to prevent storage bloat
     */
    cleanupAccessLog(maxAge = 30) {
        try {
            const logs = this.getStoredAccessLog();
            const cutoffDate = new Date(Date.now() - (maxAge * 24 * 60 * 60 * 1000));
            const filteredLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
            const removedCount = logs.length - filteredLogs.length;
            if (removedCount > 0) {
                this.storeAccessLog(filteredLogs);
            }
            return removedCount;
        }
        catch (error) {
            console.error('Error cleaning up access log:', error);
            return 0;
        }
    }
    // Private helper methods
    createLogEntry(context) {
        return {
            id: this.generateLogId(),
            resource: context.resource,
            action: context.action,
            permission: context.requiredPermission,
            timestamp: new Date(),
            success: false, // Will be updated based on authorization result
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            additionalData: context.data ? { dataType: typeof context.data } : undefined
        };
    }
    async logAccessAttempt(logEntry) {
        try {
            const logs = this.getStoredAccessLog();
            logs.push(logEntry);
            // Keep only the most recent entries to prevent storage bloat
            if (logs.length > this.MAX_LOG_ENTRIES) {
                logs.splice(0, logs.length - this.MAX_LOG_ENTRIES);
            }
            this.storeAccessLog(logs);
            // Log to console for development/debugging
            if (logEntry.success) {
                console.log(`✓ Access granted: ${logEntry.userEmail || 'Anonymous'} -> ${logEntry.action} on ${logEntry.resource}`);
            }
            else {
                console.warn(`✗ Access denied: ${logEntry.userEmail || 'Anonymous'} -> ${logEntry.action} on ${logEntry.resource} (${logEntry.errorCode})`);
            }
        }
        catch (error) {
            console.error('Error logging access attempt:', error);
            // Don't throw error - logging failure shouldn't break authorization
        }
    }
    isOwnData(user, targetData) {
        if (!targetData)
            return false;
        // Check common patterns for user ownership
        return (targetData.userId === user.id ||
            targetData.taxistaId === user.id ||
            targetData.patronId === user.id ||
            targetData.createdBy === user.id ||
            (targetData.numeroTaxista && targetData.numeroTaxista === user.numeroTaxista));
    }
    async canPatronAccessData(patron, targetData) {
        if (patron.rol !== UserRole.PATRON) {
            return false;
        }
        try {
            // Get patron's associations
            const associations = this.getStoredAssociations();
            const patronAssociations = associations.filter(a => a.patronId === patron.id && a.activa);
            if (patronAssociations.length === 0) {
                return false;
            }
            const associatedTaxistaIds = patronAssociations.map(a => a.taxistaId);
            // Check if data belongs to an associated taxista
            return ((targetData.userId && associatedTaxistaIds.includes(targetData.userId)) ||
                (targetData.taxistaId && associatedTaxistaIds.includes(targetData.taxistaId)) ||
                (targetData.createdBy && associatedTaxistaIds.includes(targetData.createdBy)) ||
                (targetData.numeroTaxista && this.isAssociatedTaxistaNumber(patron.id, targetData.numeroTaxista)));
        }
        catch (error) {
            console.error('Error checking patron data access:', error);
            return false;
        }
    }
    isAssociatedTaxistaNumber(patronId, numeroTaxista) {
        try {
            const users = this.getStoredUsers();
            const taxista = users.find(u => u.numeroTaxista === numeroTaxista);
            if (!taxista)
                return false;
            const associations = this.getStoredAssociations();
            return associations.some(a => a.patronId === patronId &&
                a.taxistaId === taxista.id &&
                a.activa);
        }
        catch (error) {
            console.error('Error checking taxista number association:', error);
            return false;
        }
    }
    getStoredAccessLog() {
        try {
            const stored = localStorage.getItem(this.ACCESS_LOG_KEY);
            if (!stored)
                return [];
            const logs = JSON.parse(stored);
            return logs.map((log) => ({
                ...log,
                timestamp: new Date(log.timestamp)
            }));
        }
        catch (error) {
            console.error('Error loading access log:', error);
            return [];
        }
    }
    storeAccessLog(logs) {
        try {
            localStorage.setItem(this.ACCESS_LOG_KEY, JSON.stringify(logs));
        }
        catch (error) {
            console.error('Error storing access log:', error);
        }
    }
    getStoredUsers() {
        try {
            const stored = localStorage.getItem('taxi_users');
            return stored ? JSON.parse(stored) : [];
        }
        catch {
            return [];
        }
    }
    getStoredAssociations() {
        try {
            const stored = localStorage.getItem('taxi_associations');
            return stored ? JSON.parse(stored) : [];
        }
        catch {
            return [];
        }
    }
    generateLogId() {
        return 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }
}
/**
 * Convenience function to create authorization context
 */
export function createAuthorizationContext(user, resource, action, requiredPermission, options = {}) {
    return {
        user,
        resource,
        action,
        requiredPermission,
        data: options.data,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
    };
}
/**
 * Default encryption configuration for common sensitive fields
 */
export const DEFAULT_ENCRYPTION_CONFIG = {
    encryptFields: ['password', 'telefono', 'email', 'personalData'],
    skipEncryption: false
};
/**
 * Singleton instance for global use
 */
export const authorizationMiddleware = new AuthorizationMiddleware();
//# sourceMappingURL=authorization-middleware.js.map