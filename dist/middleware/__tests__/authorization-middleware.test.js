/**
 * Unit tests for Authorization Middleware
 * Tests permission validation, access logging, and data encryption
 */
import { AuthorizationMiddleware, createAuthorizationContext } from '../authorization-middleware';
import { UserRole, Permission, AuthErrorCode } from '../../types';
describe('AuthorizationMiddleware', () => {
    let middleware;
    let mockCryptoUtils;
    let patronUser;
    let taxistaUser;
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        // Mock CryptoUtils
        mockCryptoUtils = {
            encryptSensitiveData: jest.fn(),
            decryptSensitiveData: jest.fn(),
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
            generateSecureToken: jest.fn(),
            validatePasswordStrength: jest.fn()
        };
        middleware = new AuthorizationMiddleware(mockCryptoUtils);
        // Create test users
        patronUser = {
            id: 'patron_1',
            email: 'patron@test.com',
            nombre: 'Test Patron',
            rol: UserRole.PATRON,
            activo: true,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
        };
        taxistaUser = {
            id: 'taxista_1',
            email: 'taxista@test.com',
            nombre: 'Test Taxista',
            rol: UserRole.TAXISTA,
            numeroTaxista: 'TX001',
            activo: true,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
        };
    });
    describe('authorize', () => {
        it('should deny access for unauthenticated user', async () => {
            const context = createAuthorizationContext(null, 'test-resource', 'read', Permission.VIEW_OWN_DATA);
            const result = await middleware.authorize(context);
            expect(result.authorized).toBe(false);
            expect(result.error?.code).toBe(AuthErrorCode.SESSION_EXPIRED);
            expect(result.logEntry.success).toBe(false);
        });
        it('should grant access for user with correct permission', async () => {
            const context = createAuthorizationContext(patronUser, 'associations', 'create', Permission.MANAGE_ASSOCIATIONS);
            const result = await middleware.authorize(context);
            expect(result.authorized).toBe(true);
            expect(result.user).toBe(patronUser);
            expect(result.logEntry.success).toBe(true);
            expect(result.logEntry.userId).toBe(patronUser.id);
        });
        it('should deny access for user without required permission', async () => {
            const context = createAuthorizationContext(taxistaUser, 'associations', 'create', Permission.MANAGE_ASSOCIATIONS);
            const result = await middleware.authorize(context);
            expect(result.authorized).toBe(false);
            expect(result.error?.code).toBe(AuthErrorCode.INSUFFICIENT_PERMISSIONS);
            expect(result.logEntry.success).toBe(false);
            expect(result.logEntry.userId).toBe(taxistaUser.id);
        });
        it('should log access attempts', async () => {
            const context = createAuthorizationContext(patronUser, 'test-resource', 'read', Permission.VIEW_ALL_DRIVERS);
            await middleware.authorize(context);
            const logs = middleware.getAccessLog();
            expect(logs).toHaveLength(1);
            expect(logs[0].resource).toBe('test-resource');
            expect(logs[0].action).toBe('read');
            expect(logs[0].userId).toBe(patronUser.id);
            expect(logs[0].success).toBe(true);
        });
    });
    describe('hasPermission', () => {
        it('should return true for patron with manage associations permission', () => {
            const result = middleware.hasPermission(patronUser, Permission.MANAGE_ASSOCIATIONS);
            expect(result).toBe(true);
        });
        it('should return false for taxista with manage associations permission', () => {
            const result = middleware.hasPermission(taxistaUser, Permission.MANAGE_ASSOCIATIONS);
            expect(result).toBe(false);
        });
        it('should return true for taxista with view own data permission', () => {
            const result = middleware.hasPermission(taxistaUser, Permission.VIEW_OWN_DATA);
            expect(result).toBe(true);
        });
        it('should return false for null user', () => {
            const result = middleware.hasPermission(null, Permission.VIEW_OWN_DATA);
            expect(result).toBe(false);
        });
    });
    describe('validateDataAccess', () => {
        it('should allow access to own data', async () => {
            const ownData = { userId: taxistaUser.id, content: 'test' };
            const result = await middleware.validateDataAccess(taxistaUser, ownData, 'read');
            expect(result).toBe(true);
        });
        it('should deny access to other users data for taxista', async () => {
            const otherData = { userId: 'other_user', content: 'test' };
            const result = await middleware.validateDataAccess(taxistaUser, otherData, 'read');
            expect(result).toBe(false);
        });
        it('should allow patron to read associated taxista data', async () => {
            // Setup association
            const associations = [{
                    id: 'assoc_1',
                    patronId: patronUser.id,
                    taxistaId: taxistaUser.id,
                    fechaAsociacion: new Date(),
                    activa: true
                }];
            localStorage.setItem('taxi_associations', JSON.stringify(associations));
            const taxistaData = { userId: taxistaUser.id, content: 'test' };
            const result = await middleware.validateDataAccess(patronUser, taxistaData, 'read');
            expect(result).toBe(true);
        });
        it('should deny access for null user', async () => {
            const data = { userId: 'test', content: 'test' };
            const result = await middleware.validateDataAccess(null, data, 'read');
            expect(result).toBe(false);
        });
    });
    describe('encryptSensitiveData', () => {
        it('should encrypt specified fields', async () => {
            mockCryptoUtils.encryptSensitiveData.mockResolvedValue('encrypted_value');
            const data = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'secret123'
            };
            const config = {
                encryptFields: ['email', 'password'],
                skipEncryption: false
            };
            const result = await middleware.encryptSensitiveData(data, config);
            expect(mockCryptoUtils.encryptSensitiveData).toHaveBeenCalledTimes(2);
            expect(result.email).toBe('encrypted_value');
            expect(result.password).toBe('encrypted_value');
            expect(result.name).toBe('Test User'); // Not encrypted
        });
        it('should skip encryption when configured', async () => {
            const data = { email: 'test@example.com' };
            const config = { encryptFields: ['email'], skipEncryption: true };
            const result = await middleware.encryptSensitiveData(data, config);
            expect(mockCryptoUtils.encryptSensitiveData).not.toHaveBeenCalled();
            expect(result.email).toBe('test@example.com');
        });
    });
    describe('decryptSensitiveData', () => {
        it('should decrypt specified fields', async () => {
            mockCryptoUtils.decryptSensitiveData.mockResolvedValue('decrypted_value');
            const data = {
                name: 'Test User',
                email: 'encrypted_email',
                password: 'encrypted_password'
            };
            const config = {
                encryptFields: ['email', 'password'],
                skipEncryption: false
            };
            const result = await middleware.decryptSensitiveData(data, config);
            expect(mockCryptoUtils.decryptSensitiveData).toHaveBeenCalledTimes(2);
            expect(result.email).toBe('decrypted_value');
            expect(result.password).toBe('decrypted_value');
            expect(result.name).toBe('Test User'); // Not decrypted
        });
    });
    describe('getAccessLog', () => {
        beforeEach(async () => {
            // Create some test log entries
            const contexts = [
                createAuthorizationContext(patronUser, 'resource1', 'read', Permission.VIEW_ALL_DRIVERS),
                createAuthorizationContext(taxistaUser, 'resource2', 'write', Permission.VIEW_OWN_DATA),
                createAuthorizationContext(null, 'resource3', 'read', Permission.VIEW_OWN_DATA)
            ];
            for (const context of contexts) {
                await middleware.authorize(context);
            }
        });
        it('should return all logs when no filters applied', () => {
            const logs = middleware.getAccessLog();
            expect(logs).toHaveLength(3);
        });
        it('should filter logs by user ID', () => {
            const logs = middleware.getAccessLog({ userId: patronUser.id });
            expect(logs).toHaveLength(1);
            expect(logs[0].userId).toBe(patronUser.id);
        });
        it('should filter logs by success status', () => {
            const successLogs = middleware.getAccessLog({ success: true });
            const failLogs = middleware.getAccessLog({ success: false });
            expect(successLogs).toHaveLength(2); // patron and taxista successful
            expect(failLogs).toHaveLength(1); // null user failed
        });
        it('should limit results', () => {
            const logs = middleware.getAccessLog({ limit: 2 });
            expect(logs).toHaveLength(2);
        });
    });
    describe('getSecurityStatistics', () => {
        beforeEach(async () => {
            // Create test log entries
            const contexts = [
                createAuthorizationContext(patronUser, 'resource1', 'read', Permission.VIEW_ALL_DRIVERS),
                createAuthorizationContext(taxistaUser, 'resource1', 'read', Permission.MANAGE_ASSOCIATIONS), // Will fail
                createAuthorizationContext(taxistaUser, 'resource1', 'read', Permission.MANAGE_ASSOCIATIONS), // Will fail
                createAuthorizationContext(null, 'resource2', 'read', Permission.VIEW_OWN_DATA) // Will fail
            ];
            for (const context of contexts) {
                await middleware.authorize(context);
            }
        });
        it('should return correct statistics', () => {
            const stats = middleware.getSecurityStatistics('day');
            expect(stats.totalAttempts).toBe(4);
            expect(stats.successfulAttempts).toBe(1);
            expect(stats.failedAttempts).toBe(3);
            expect(stats.uniqueUsers).toBe(2); // patron and taxista (null user doesn't count)
            expect(stats.topFailedResources).toHaveLength(2);
            expect(stats.topFailedResources[0].resource).toBe('resource1');
            expect(stats.topFailedResources[0].count).toBe(2);
        });
    });
    describe('cleanupAccessLog', () => {
        it('should remove old log entries', () => {
            // Create old log entry
            const oldLog = {
                id: 'old_log',
                resource: 'test',
                action: 'read',
                permission: Permission.VIEW_OWN_DATA,
                timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
                success: true
            };
            const recentLog = {
                id: 'recent_log',
                resource: 'test',
                action: 'read',
                permission: Permission.VIEW_OWN_DATA,
                timestamp: new Date(),
                success: true
            };
            localStorage.setItem('taxi_access_log', JSON.stringify([oldLog, recentLog]));
            const removedCount = middleware.cleanupAccessLog(30); // Remove entries older than 30 days
            expect(removedCount).toBe(1);
            const remainingLogs = middleware.getAccessLog();
            expect(remainingLogs).toHaveLength(1);
            expect(remainingLogs[0].id).toBe('recent_log');
        });
    });
});
describe('createAuthorizationContext', () => {
    it('should create context with all parameters', () => {
        const user = {
            id: 'test_user',
            email: 'test@example.com',
            nombre: 'Test User',
            rol: UserRole.PATRON,
            activo: true,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
        };
        const context = createAuthorizationContext(user, 'test-resource', 'read', Permission.VIEW_ALL_DRIVERS, {
            data: { test: 'data' },
            ipAddress: '192.168.1.1',
            userAgent: 'Test Agent'
        });
        expect(context.user).toBe(user);
        expect(context.resource).toBe('test-resource');
        expect(context.action).toBe('read');
        expect(context.requiredPermission).toBe(Permission.VIEW_ALL_DRIVERS);
        expect(context.data).toEqual({ test: 'data' });
        expect(context.ipAddress).toBe('192.168.1.1');
        expect(context.userAgent).toBe('Test Agent');
    });
    it('should create context with minimal parameters', () => {
        const context = createAuthorizationContext(null, 'resource', 'action', Permission.VIEW_OWN_DATA);
        expect(context.user).toBeNull();
        expect(context.resource).toBe('resource');
        expect(context.action).toBe('action');
        expect(context.requiredPermission).toBe(Permission.VIEW_OWN_DATA);
        expect(context.data).toBeUndefined();
        expect(context.ipAddress).toBeUndefined();
        expect(context.userAgent).toBeUndefined();
    });
});
//# sourceMappingURL=authorization-middleware.test.js.map