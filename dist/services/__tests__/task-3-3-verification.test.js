/**
 * Verification tests for Task 3.3: Implementar registro de usuarios con selección de rol
 *
 * Task Details:
 * - Crear función de registro que asigne permisos según rol
 * - Generar números únicos de taxista automáticamente
 * - Implementar validación de campos obligatorios
 * - Requisitos: 1.1, 1.2, 1.3, 1.4
 */
import { AuthService } from '../auth-service';
import { JWTUtils } from '../../utils/jwt-utils';
import { CryptoUtils } from '../../utils/crypto-utils';
import { UserRole, AuthError, Permission, ROLE_PERMISSIONS } from '../../types';
describe('Task 3.3: User Registration with Role Selection', () => {
    let authService;
    let jwtUtils;
    let cryptoUtils;
    beforeEach(() => {
        jwtUtils = new JWTUtils();
        cryptoUtils = new CryptoUtils();
        authService = new AuthService(jwtUtils, cryptoUtils);
        localStorage.clear();
    });
    afterEach(() => {
        localStorage.clear();
    });
    describe('Requirement 1.1: Role Selection During Registration', () => {
        it('should allow registration with PATRON role', async () => {
            const userData = {
                email: 'patron@test.com',
                password: 'SecurePass123',
                nombre: 'Test Patron',
                telefono: '+1234567890',
                rol: UserRole.PATRON
            };
            const user = await authService.register(userData);
            expect(user.rol).toBe(UserRole.PATRON);
            expect(user.email).toBe(userData.email);
            expect(user.nombre).toBe(userData.nombre);
            expect(user.telefono).toBe(userData.telefono);
        });
        it('should allow registration with TAXISTA role', async () => {
            const userData = {
                email: 'taxista@test.com',
                password: 'SecurePass123',
                nombre: 'Test Taxista',
                telefono: '+1234567890',
                rol: UserRole.TAXISTA
            };
            const user = await authService.register(userData);
            expect(user.rol).toBe(UserRole.TAXISTA);
            expect(user.email).toBe(userData.email);
            expect(user.nombre).toBe(userData.nombre);
            expect(user.telefono).toBe(userData.telefono);
        });
    });
    describe('Requirement 1.2: Assign Permissions According to Role', () => {
        it('should assign correct permissions to PATRON users', async () => {
            const userData = {
                email: 'patron@test.com',
                password: 'SecurePass123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            await authService.register(userData);
            const authResult = await authService.login({
                email: userData.email,
                password: userData.password
            });
            // Verify patron gets patron permissions
            const expectedPermissions = ROLE_PERMISSIONS[UserRole.PATRON];
            expect(authResult.permissions).toEqual(expect.arrayContaining(expectedPermissions));
            // Verify patron has management permissions
            expect(authResult.permissions).toContain(Permission.MANAGE_ASSOCIATIONS);
            expect(authResult.permissions).toContain(Permission.VIEW_ALL_DRIVERS);
            expect(authResult.permissions).toContain(Permission.SEARCH_AVAILABLE_TAXISTAS);
        });
        it('should assign correct permissions to TAXISTA users', async () => {
            const userData = {
                email: 'taxista@test.com',
                password: 'SecurePass123',
                nombre: 'Test Taxista',
                rol: UserRole.TAXISTA
            };
            await authService.register(userData);
            const authResult = await authService.login({
                email: userData.email,
                password: userData.password
            });
            // Verify taxista gets taxista permissions
            const expectedPermissions = ROLE_PERMISSIONS[UserRole.TAXISTA];
            expect(authResult.permissions).toEqual(expect.arrayContaining(expectedPermissions));
            // Verify taxista has individual permissions
            expect(authResult.permissions).toContain(Permission.VIEW_OWN_DATA);
            expect(authResult.permissions).toContain(Permission.INPUT_OPERATIONAL_DATA);
            expect(authResult.permissions).toContain(Permission.VIEW_OWN_HISTORY);
        });
    });
    describe('Requirement 1.3: Generate Unique Taxista Numbers Automatically', () => {
        it('should generate taxista number for TAXISTA users', async () => {
            const userData = {
                email: 'taxista@test.com',
                password: 'SecurePass123',
                nombre: 'Test Taxista',
                rol: UserRole.TAXISTA
            };
            const user = await authService.register(userData);
            expect(user.numeroTaxista).toBeDefined();
            expect(user.numeroTaxista).toMatch(/^TX\d{3}$/);
        });
        it('should NOT generate taxista number for PATRON users', async () => {
            const userData = {
                email: 'patron@test.com',
                password: 'SecurePass123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const user = await authService.register(userData);
            expect(user.numeroTaxista).toBeUndefined();
        });
        it('should generate sequential unique taxista numbers', async () => {
            const taxista1Data = {
                email: 'taxista1@test.com',
                password: 'SecurePass123',
                nombre: 'Test Taxista 1',
                rol: UserRole.TAXISTA
            };
            const taxista2Data = {
                email: 'taxista2@test.com',
                password: 'SecurePass123',
                nombre: 'Test Taxista 2',
                rol: UserRole.TAXISTA
            };
            const taxista3Data = {
                email: 'taxista3@test.com',
                password: 'SecurePass123',
                nombre: 'Test Taxista 3',
                rol: UserRole.TAXISTA
            };
            const user1 = await authService.register(taxista1Data);
            const user2 = await authService.register(taxista2Data);
            const user3 = await authService.register(taxista3Data);
            expect(user1.numeroTaxista).toBe('TX001');
            expect(user2.numeroTaxista).toBe('TX002');
            expect(user3.numeroTaxista).toBe('TX003');
            // Verify all numbers are unique
            const numbers = [user1.numeroTaxista, user2.numeroTaxista, user3.numeroTaxista];
            const uniqueNumbers = [...new Set(numbers)];
            expect(uniqueNumbers).toHaveLength(3);
        });
    });
    describe('Requirement 1.4: Validate Mandatory Fields', () => {
        it('should reject registration with missing email', async () => {
            const userData = {
                email: '',
                password: 'SecurePass123',
                nombre: 'Test User',
                rol: UserRole.PATRON
            };
            await expect(authService.register(userData))
                .rejects
                .toThrow(AuthError);
        });
        it('should reject registration with missing password', async () => {
            const userData = {
                email: 'test@test.com',
                password: '',
                nombre: 'Test User',
                rol: UserRole.PATRON
            };
            await expect(authService.register(userData))
                .rejects
                .toThrow(AuthError);
        });
        it('should reject registration with missing name', async () => {
            const userData = {
                email: 'test@test.com',
                password: 'SecurePass123',
                nombre: '',
                rol: UserRole.PATRON
            };
            await expect(authService.register(userData))
                .rejects
                .toThrow(AuthError);
        });
        it('should reject registration with invalid email format', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'SecurePass123',
                nombre: 'Test User',
                rol: UserRole.PATRON
            };
            await expect(authService.register(userData))
                .rejects
                .toThrow(AuthError);
        });
        it('should reject registration with weak password', async () => {
            const userData = {
                email: 'test@test.com',
                password: '123', // Too weak
                nombre: 'Test User',
                rol: UserRole.PATRON
            };
            await expect(authService.register(userData))
                .rejects
                .toThrow(AuthError);
        });
        it('should accept registration with optional telefono field', async () => {
            const userData = {
                email: 'test@test.com',
                password: 'SecurePass123',
                nombre: 'Test User',
                rol: UserRole.PATRON
                // telefono is optional
            };
            const user = await authService.register(userData);
            expect(user).toBeDefined();
            expect(user.telefono).toBeUndefined();
        });
        it('should accept registration with valid telefono field', async () => {
            const userData = {
                email: 'test@test.com',
                password: 'SecurePass123',
                nombre: 'Test User',
                telefono: '+1234567890',
                rol: UserRole.PATRON
            };
            const user = await authService.register(userData);
            expect(user).toBeDefined();
            expect(user.telefono).toBe(userData.telefono);
        });
    });
    describe('Requirement 1.5: Reject Duplicate Credentials', () => {
        it('should reject registration with duplicate email', async () => {
            const userData = {
                email: 'duplicate@test.com',
                password: 'SecurePass123',
                nombre: 'Test User',
                rol: UserRole.PATRON
            };
            // Register first user
            await authService.register(userData);
            // Try to register with same email
            await expect(authService.register({
                ...userData,
                nombre: 'Different Name'
            }))
                .rejects
                .toThrow(AuthError);
        });
        it('should allow registration with same name but different email', async () => {
            const userData1 = {
                email: 'user1@test.com',
                password: 'SecurePass123',
                nombre: 'Same Name',
                rol: UserRole.PATRON
            };
            const userData2 = {
                email: 'user2@test.com',
                password: 'SecurePass123',
                nombre: 'Same Name', // Same name is allowed
                rol: UserRole.TAXISTA
            };
            const user1 = await authService.register(userData1);
            const user2 = await authService.register(userData2);
            expect(user1).toBeDefined();
            expect(user2).toBeDefined();
            expect(user1.nombre).toBe(user2.nombre);
            expect(user1.email).not.toBe(user2.email);
        });
    });
    describe('Integration: Complete Registration Flow', () => {
        it('should complete full registration and login flow for patron', async () => {
            const userData = {
                email: 'integration.patron@test.com',
                password: 'SecurePass123',
                nombre: 'Integration Patron',
                telefono: '+1234567890',
                rol: UserRole.PATRON
            };
            // Register
            const user = await authService.register(userData);
            expect(user.rol).toBe(UserRole.PATRON);
            expect(user.numeroTaxista).toBeUndefined();
            // Login
            const authResult = await authService.login({
                email: userData.email,
                password: userData.password
            });
            expect(authResult.user.id).toBe(user.id);
            expect(authResult.permissions).toContain(Permission.MANAGE_ASSOCIATIONS);
            expect(authResult.token).toBeDefined();
            expect(authResult.refreshToken).toBeDefined();
        });
        it('should complete full registration and login flow for taxista', async () => {
            const userData = {
                email: 'integration.taxista@test.com',
                password: 'SecurePass123',
                nombre: 'Integration Taxista',
                telefono: '+1234567890',
                rol: UserRole.TAXISTA
            };
            // Register
            const user = await authService.register(userData);
            expect(user.rol).toBe(UserRole.TAXISTA);
            expect(user.numeroTaxista).toMatch(/^TX\d{3}$/);
            // Login
            const authResult = await authService.login({
                email: userData.email,
                password: userData.password
            });
            expect(authResult.user.id).toBe(user.id);
            expect(authResult.permissions).toContain(Permission.VIEW_OWN_DATA);
            expect(authResult.token).toBeDefined();
            expect(authResult.refreshToken).toBeDefined();
        });
    });
});
//# sourceMappingURL=task-3-3-verification.test.js.map