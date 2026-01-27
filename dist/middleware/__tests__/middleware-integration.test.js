/**
 * Unit tests for Middleware Integration Service
 * Tests high-level integration methods and decorators
 */
import { MiddlewareIntegration } from '../middleware-integration';
import { UserRole, Permission, AuthError, AuthErrorCode } from '../../types';
describe('MiddlewareIntegration', () => {
    let integration;
    let mockMiddleware;
    let patronUser;
    let taxistaUser;
    beforeEach(() => {
        // Mock AuthorizationMiddleware
        mockMiddleware = {
            authorize: jest.fn(),
            hasPermission: jest.fn(),
            validateDataAccess: jest.fn(),
            encryptSensitiveData: jest.fn(),
            decryptSensitiveData: jest.fn(),
            getAccessLog: jest.fn(),
            getSecurityStatistics: jest.fn(),
            cleanupAccessLog: jest.fn()
        };
        integration = new MiddlewareIntegration(mockMiddleware);
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
    describe('requirePermission', () => {
        it('should execute operation when authorization succeeds', async () => {
            const mockOperation = jest.fn().mockResolvedValue({ result: 'success' });
            mockMiddleware.authorize.mockResolvedValue({
                authorized: true,
                user: patronUser,
                logEntry: {}
            });
            const result = await integration.requirePermission(patronUser, {
                permission: Permission.MANAGE_ASSOCIATIONS,
                resource: 'associations',
                action: 'create'
            }, mockOperation);
            expect(mockMiddleware.authorize).toHaveBeenCalledWith(expect.objectContaining({
                user: patronUser,
                resource: 'associations',
                action: 'create',
                requiredPermission: Permission.MANAGE_ASSOCIATIONS
            }));
            expect(mockOperation).toHaveBeenCalled();
            expect(result).toEqual({ result: 'success' });
        });
        it('should throw error when authorization fails', async () => {
            const mockOperation = jest.fn();
            const authError = new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Access denied');
            mockMiddleware.authorize.mockResolvedValue({
                authorized: false,
                user: taxistaUser,
                error: authError,
                logEntry: {}
            });
            await expect(integration.requirePermission(taxistaUser, {
                permission: Permission.MANAGE_ASSOCIATIONS,
                resource: 'associations',
                action: 'create'
            }, mockOperation)).rejects.toThrow(authError);
            expect(mockOperation).not.toHaveBeenCalled();
        });
        it('should encrypt sensitive data when requested', async () => {
            const mockOperation = jest.fn().mockResolvedValue({
                name: 'Test',
                email: 'test@example.com'
            });
            mockMiddleware.authorize.mockResolvedValue({
                authorized: true,
                user: patronUser,
                logEntry: {}
            });
            mockMiddleware.encryptSensitiveData.mockResolvedValue({
                name: 'Test',
                email: 'encrypted_email'
            });
            const result = await integration.requirePermission(patronUser, {
                permission: Permission.VIEW_ALL_DRIVERS,
                resource: 'users',
                action: 'read',
                encryptSensitiveData: true,
                encryptionConfig: {
                    encryptFields: ['email'],
                    skipEncryption: false
                }
            }, mockOperation);
            expect(mockMiddleware.encryptSensitiveData).toHaveBeenCalledWith({ name: 'Test', email: 'test@example.com' }, { encryptFields: ['email'], skipEncryption: false });
            expect(result).toEqual({ name: 'Test', email: 'encrypted_email' });
        });
        it('should use default values for optional parameters', async () => {
            const mockOperation = jest.fn().mockResolvedValue('result');
            mockMiddleware.authorize.mockResolvedValue({
                authorized: true,
                user: patronUser,
                logEntry: {}
            });
            await integration.requirePermission(patronUser, { permission: Permission.VIEW_ALL_DRIVERS }, mockOperation);
            expect(mockMiddleware.authorize).toHaveBeenCalledWith(expect.objectContaining({
                resource: 'unknown',
                action: 'execute'
            }));
        });
    });
    describe('validateAndFilterData', () => {
        it('should filter data when authorization succeeds', async () => {
            const testData = [
                { id: '1', userId: patronUser.id, content: 'patron data' },
                { id: '2', userId: taxistaUser.id, content: 'taxista data' },
                { id: '3', userId: 'other_user', content: 'other data' }
            ];
            mockMiddleware.authorize.mockResolvedValue({
                authorized: true,
                user: patronUser,
                logEntry: {}
            });
            // Mock data access validation - patron can access first two items
            mockMiddleware.validateDataAccess
                .mockReturnValueOnce(true) // patron's own data
                .mockReturnValueOnce(true) // associated taxista data
                .mockReturnValueOnce(false); // other user data
            const result = await integration.validateAndFilterData(patronUser, testData, Permission.VIEW_ALL_DRIVERS, 'user-data');
            expect(mockMiddleware.authorize).toHaveBeenCalledWith(expect.objectContaining({
                user: patronUser,
                resource: 'user-data',
                action: 'read',
                requiredPermission: Permission.VIEW_ALL_DRIVERS
            }));
            expect(mockMiddleware.validateDataAccess).toHaveBeenCalledTimes(3);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
        });
        it('should throw error for unauthenticated user', async () => {
            await expect(integration.validateAndFilterData(null, [], Permission.VIEW_OWN_DATA)).rejects.toThrow(expect.objectContaining({
                code: AuthErrorCode.SESSION_EXPIRED
            }));
        });
        it('should throw error when authorization fails', async () => {
            const authError = new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Access denied');
            mockMiddleware.authorize.mockResolvedValue({
                authorized: false,
                user: taxistaUser,
                error: authError,
                logEntry: {}
            });
            await expect(integration.validateAndFilterData(taxistaUser, [{ id: '1', content: 'test' }], Permission.VIEW_ALL_DRIVERS)).rejects.toThrow(authError);
        });
        it('should use default resource name', async () => {
            mockMiddleware.authorize.mockResolvedValue({
                authorized: true,
                user: patronUser,
                logEntry: {}
            });
            await integration.validateAndFilterData(patronUser, [], Permission.VIEW_ALL_DRIVERS);
            expect(mockMiddleware.authorize).toHaveBeenCalledWith(expect.objectContaining({
                resource: 'data'
            }));
        });
    });
    describe('getMiddleware', () => {
        it('should return the middleware instance', () => {
            const middleware = integration.getMiddleware();
            expect(middleware).toBe(mockMiddleware);
        });
    });
});
describe('MiddlewareIntegration with real middleware', () => {
    let integration;
    let patronUser;
    beforeEach(() => {
        localStorage.clear();
        integration = new MiddlewareIntegration();
        patronUser = {
            id: 'patron_1',
            email: 'patron@test.com',
            nombre: 'Test Patron',
            rol: UserRole.PATRON,
            activo: true,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
        };
    });
    it('should work with real authorization middleware', async () => {
        const mockOperation = jest.fn().mockResolvedValue({ data: 'test' });
        const result = await integration.requirePermission(patronUser, {
            permission: Permission.MANAGE_ASSOCIATIONS,
            resource: 'associations',
            action: 'create'
        }, mockOperation);
        expect(mockOperation).toHaveBeenCalled();
        expect(result).toEqual({ data: 'test' });
        // Check that access was logged
        const middleware = integration.getMiddleware();
        const logs = middleware.getAccessLog();
        expect(logs).toHaveLength(1);
        expect(logs[0].success).toBe(true);
        expect(logs[0].userId).toBe(patronUser.id);
    });
});
//# sourceMappingURL=middleware-integration.test.js.map