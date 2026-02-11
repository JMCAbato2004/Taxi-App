/**
 * Unit tests for AuthService
 * Tests core authentication functionality including login, logout, registration, and JWT management
 */
import { AuthService } from '../auth-service';
import { JWTUtils } from '../../utils/jwt-utils';
import { CryptoUtils } from '../../utils/crypto-utils';
import { UserRole, AuthError } from '../../types';
describe('AuthService', () => {
    let authService;
    let jwtUtils;
    let cryptoUtils;
    beforeEach(() => {
        jwtUtils = new JWTUtils();
        cryptoUtils = new CryptoUtils();
        authService = new AuthService(jwtUtils, cryptoUtils);
        // Clear localStorage before each test
        localStorage.clear();
    });
    afterEach(() => {
        localStorage.clear();
    });
    describe('User Registration', () => {
        it('should register a new patron user successfully', async () => {
            const userData = {
                email: 'patron@test.com',
                password: 'SecurePass123',
                nombre: 'Test Patron',
                telefono: '+1234567890',
                rol: UserRole.PATRON
            };
            const user = await authService.register(userData);
            expect(user).toBeDefined();
            expect(user.email).toBe(userData.email);
            expect(user.nombre).toBe(userData.nombre);
            expect(user.rol).toBe(UserRole.PATRON);
            expect(user.numeroTaxista).toBeUndefined();
            expect(user.activo).toBe(true);
            expect(user.id).toBeDefined();
            expect(user.fechaCreacion).toBeInstanceOf(Date);
        });
        it('should register a new taxista user with numero_taxista', async () => {
            const userData = {
                email: 'taxista@test.com',
                password: 'SecurePass123',
                nombre: 'Test Taxista',
                telefono: '+1234567890',
                rol: UserRole.TAXISTA
            };
            const user = await authService.register(userData);
            expect(user).toBeDefined();
            expect(user.email).toBe(userData.email);
            expect(user.nombre).toBe(userData.nombre);
            expect(user.rol).toBe(UserRole.TAXISTA);
            expect(user.numeroTaxista).toBeDefined();
            expect(user.numeroTaxista).toMatch(/^TX\d{3}$/);
            expect(user.activo).toBe(true);
        });
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
            await expect(authService.register(userData))
                .rejects
                .toThrow(AuthError);
        });
        it('should reject registration with invalid email', async () => {
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
    });
    describe('User Login', () => {
        beforeEach(async () => {
            // Register a test user for login tests
            await authService.register({
                email: 'login@test.com',
                password: 'SecurePass123',
                nombre: 'Login Test',
                rol: UserRole.PATRON
            });
        });
        it('should login successfully with valid credentials', async () => {
            const credentials = {
                email: 'login@test.com',
                password: 'SecurePass123'
            };
            const result = await authService.login(credentials);
            expect(result).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.user.email).toBe(credentials.email);
            expect(result.token).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.expiresAt).toBeInstanceOf(Date);
            expect(result.permissions).toBeDefined();
            expect(result.permissions.length).toBeGreaterThan(0);
        });
        it('should reject login with invalid email', async () => {
            const credentials = {
                email: 'nonexistent@test.com',
                password: 'SecurePass123'
            };
            await expect(authService.login(credentials))
                .rejects
                .toThrow(AuthError);
        });
        it('should reject login with invalid password', async () => {
            const credentials = {
                email: 'login@test.com',
                password: 'WrongPassword'
            };
            await expect(authService.login(credentials))
                .rejects
                .toThrow(AuthError);
        });
        it('should reject login with invalid email format', async () => {
            const credentials = {
                email: 'invalid-email',
                password: 'SecurePass123'
            };
            await expect(authService.login(credentials))
                .rejects
                .toThrow(AuthError);
        });
    });
    describe('Authentication State', () => {
        it('should return null for current user when not authenticated', () => {
            const user = authService.getCurrentUser();
            expect(user).toBeNull();
        });
        it('should return false for isAuthenticated when not logged in', () => {
            const isAuth = authService.isAuthenticated();
            expect(isAuth).toBe(false);
        });
        it('should maintain authentication state after login', async () => {
            // Register and login
            await authService.register({
                email: 'state@test.com',
                password: 'SecurePass123',
                nombre: 'State Test',
                rol: UserRole.TAXISTA
            });
            const result = await authService.login({
                email: 'state@test.com',
                password: 'SecurePass123'
            });
            expect(authService.isAuthenticated()).toBe(true);
            expect(authService.getCurrentUser()).toEqual(result.user);
        });
        it('should clear authentication state after logout', async () => {
            // Register and login
            await authService.register({
                email: 'logout@test.com',
                password: 'SecurePass123',
                nombre: 'Logout Test',
                rol: UserRole.PATRON
            });
            await authService.login({
                email: 'logout@test.com',
                password: 'SecurePass123'
            });
            expect(authService.isAuthenticated()).toBe(true);
            // Logout
            await authService.logout();
            expect(authService.isAuthenticated()).toBe(false);
            expect(authService.getCurrentUser()).toBeNull();
        });
    });
    describe('Token Management', () => {
        it('should refresh token successfully', async () => {
            // Register and login
            await authService.register({
                email: 'refresh@test.com',
                password: 'SecurePass123',
                nombre: 'Refresh Test',
                rol: UserRole.PATRON
            });
            await authService.login({
                email: 'refresh@test.com',
                password: 'SecurePass123'
            });
            const newToken = await authService.refreshToken();
            expect(newToken).toBeDefined();
            expect(typeof newToken).toBe('string');
        });
        it('should validate offline access correctly', async () => {
            // Register and login to create offline data
            await authService.register({
                email: 'offline@test.com',
                password: 'SecurePass123',
                nombre: 'Offline Test',
                rol: UserRole.TAXISTA
            });
            await authService.login({
                email: 'offline@test.com',
                password: 'SecurePass123'
            });
            const hasOfflineAccess = authService.validateOfflineAccess();
            expect(hasOfflineAccess).toBe(true);
        });
    });
    describe('Password Management', () => {
        it('should change password successfully', async () => {
            // Register and login
            await authService.register({
                email: 'password@test.com',
                password: 'OldPassword123',
                nombre: 'Password Test',
                rol: UserRole.PATRON
            });
            await authService.login({
                email: 'password@test.com',
                password: 'OldPassword123'
            });
            // Change password
            await expect(authService.changePassword('OldPassword123', 'NewPassword123'))
                .resolves
                .not.toThrow();
        });
        it('should reject password change with wrong current password', async () => {
            // Register and login
            await authService.register({
                email: 'wrongpass@test.com',
                password: 'CorrectPassword123',
                nombre: 'Wrong Pass Test',
                rol: UserRole.PATRON
            });
            await authService.login({
                email: 'wrongpass@test.com',
                password: 'CorrectPassword123'
            });
            // Try to change with wrong current password
            await expect(authService.changePassword('WrongPassword123', 'NewPassword123'))
                .rejects
                .toThrow(AuthError);
        });
        it('should reject password change with weak new password', async () => {
            // Register and login
            await authService.register({
                email: 'weakpass@test.com',
                password: 'StrongPassword123',
                nombre: 'Weak Pass Test',
                rol: UserRole.PATRON
            });
            await authService.login({
                email: 'weakpass@test.com',
                password: 'StrongPassword123'
            });
            // Try to change to weak password
            await expect(authService.changePassword('StrongPassword123', '123'))
                .rejects
                .toThrow(AuthError);
        });
    });
    describe('Taxista Number Generation', () => {
        it('should generate sequential taxista numbers', async () => {
            const taxista1 = await authService.register({
                email: 'taxista1@test.com',
                password: 'SecurePass123',
                nombre: 'Taxista 1',
                rol: UserRole.TAXISTA
            });
            const taxista2 = await authService.register({
                email: 'taxista2@test.com',
                password: 'SecurePass123',
                nombre: 'Taxista 2',
                rol: UserRole.TAXISTA
            });
            expect(taxista1.numeroTaxista).toBe('TX001');
            expect(taxista2.numeroTaxista).toBe('TX002');
        });
        it('should not assign taxista numbers to patrones', async () => {
            const patron = await authService.register({
                email: 'patron@test.com',
                password: 'SecurePass123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            });
            expect(patron.numeroTaxista).toBeUndefined();
        });
    });
});
//# sourceMappingURL=auth-service.test.js.map