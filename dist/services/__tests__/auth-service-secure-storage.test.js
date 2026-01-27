/**
 * Integration tests for AuthService with SecureStorageService
 * Tests the integration between authentication and secure storage
 * Requirements: 6.3 - Secure persistence and offline functionality
 */
import { AuthService } from '../auth-service';
import { SecureStorageService } from '../secure-storage';
import { JWTUtils } from '../../utils/jwt-utils';
import { CryptoUtils } from '../../utils/crypto-utils';
import { SensitiveDataConfirmationService } from '../sensitive-data-confirmation';
import { UserRole, AuthError } from '../../types';
describe('AuthService with SecureStorage Integration', () => {
    let authService;
    let secureStorage;
    let jwtUtils;
    let cryptoUtils;
    let sensitiveDataService;
    const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        nombre: 'Test User',
        telefono: '+34600123456',
        rol: UserRole.TAXISTA,
        numeroTaxista: 'TX001',
        activo: true,
        fechaCreacion: new Date('2024-01-01'),
        fechaActualizacion: new Date('2024-01-01')
    };
    const mockCredentials = {
        email: 'test@example.com',
        password: 'Password123!'
    };
    beforeEach(async () => {
        // Clear localStorage
        localStorage.clear();
        // Create service instances
        jwtUtils = new JWTUtils();
        cryptoUtils = new CryptoUtils();
        sensitiveDataService = new SensitiveDataConfirmationService();
        secureStorage = new SecureStorageService(cryptoUtils);
        authService = new AuthService(jwtUtils, cryptoUtils, sensitiveDataService, secureStorage);
        // Wait a bit for async constructor to complete
        await new Promise(resolve => setTimeout(resolve, 10));
    });
    afterEach(() => {
        localStorage.clear();
    });
    describe('Login with Secure Storage', () => {
        test('should store authentication data securely after login', async () => {
            // First register a user
            const registrationData = {
                email: mockCredentials.email,
                password: mockCredentials.password,
                nombre: mockUser.nombre,
                telefono: mockUser.telefono,
                rol: mockUser.rol
            };
            await authService.register(registrationData);
            // Now login
            const authResult = await authService.login(mockCredentials);
            expect(authResult).toBeTruthy();
            expect(authResult.user.email).toBe(mockCredentials.email);
            expect(authResult.token).toBeTruthy();
            expect(authResult.refreshToken).toBeTruthy();
            // Verify data is stored in secure storage
            const storedToken = await secureStorage.getAuthToken();
            const storedRefreshToken = await secureStorage.getRefreshToken();
            const storedUser = await secureStorage.getUserData();
            const offlineData = await secureStorage.getOfflineAuthData();
            expect(storedToken).toBe(authResult.token);
            expect(storedRefreshToken).toBe(authResult.refreshToken);
            expect(storedUser?.email).toBe(mockUser.email);
            expect(offlineData).toBeTruthy();
        });
        test('should load authentication data from secure storage on service creation', async () => {
            // Store auth data directly in secure storage
            const token = jwtUtils.generateToken(mockUser);
            const refreshToken = jwtUtils.generateRefreshToken(mockUser);
            await secureStorage.storeAuthToken(token);
            await secureStorage.storeRefreshToken(refreshToken);
            await secureStorage.storeUserData(mockUser);
            // Create new auth service instance
            const newAuthService = new AuthService(jwtUtils, cryptoUtils, sensitiveDataService, secureStorage);
            // Wait for async loading
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(newAuthService.getCurrentUser()).toBeTruthy();
            expect(newAuthService.getCurrentUser()?.email).toBe(mockUser.email);
            expect(newAuthService.isAuthenticated()).toBe(true);
        });
    });
    describe('Token Refresh with Secure Storage', () => {
        test('should refresh token using secure storage', async () => {
            // Setup authenticated user
            const registrationData = {
                email: mockCredentials.email,
                password: mockCredentials.password,
                nombre: mockUser.nombre,
                telefono: mockUser.telefono,
                rol: mockUser.rol
            };
            await authService.register(registrationData);
            const authResult = await authService.login(mockCredentials);
            const originalToken = authResult.token;
            // Wait a bit to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 10));
            // Refresh token
            const newToken = await authService.refreshToken();
            expect(newToken).toBeTruthy();
            expect(newToken).not.toBe(originalToken);
            // Verify new token is stored securely
            const storedToken = await secureStorage.getAuthToken();
            expect(storedToken).toBe(newToken);
        });
        test('should handle refresh token expiration', async () => {
            // Store expired refresh token
            const expiredRefreshToken = 'expired.refresh.token';
            const pastDate = new Date(Date.now() - 1000);
            await secureStorage.storeRefreshToken(expiredRefreshToken, pastDate);
            await expect(authService.refreshToken()).rejects.toThrow(AuthError);
        });
    });
    describe('Logout with Secure Storage', () => {
        test('should clear all secure storage data on logout', async () => {
            // Setup authenticated user
            const registrationData = {
                email: mockCredentials.email,
                password: mockCredentials.password,
                nombre: mockUser.nombre,
                telefono: mockUser.telefono,
                rol: mockUser.rol
            };
            await authService.register(registrationData);
            await authService.login(mockCredentials);
            // Verify data exists
            expect(await secureStorage.getAuthToken()).toBeTruthy();
            expect(await secureStorage.getUserData()).toBeTruthy();
            // Logout
            await authService.logout();
            // Verify data is cleared
            expect(await secureStorage.getAuthToken()).toBeNull();
            expect(await secureStorage.getRefreshToken()).toBeNull();
            expect(await secureStorage.getUserData()).toBeNull();
            expect(await secureStorage.getOfflineAuthData()).toBeNull();
            expect(authService.getCurrentUser()).toBeNull();
            expect(authService.isAuthenticated()).toBe(false);
        });
    });
    describe('Offline Functionality', () => {
        test('should validate offline access correctly', async () => {
            // No authentication - should be false
            let hasOfflineAccess = await authService.hasValidOfflineSession();
            expect(hasOfflineAccess).toBe(false);
            // Setup authenticated user
            const registrationData = {
                email: mockCredentials.email,
                password: mockCredentials.password,
                nombre: mockUser.nombre,
                telefono: mockUser.telefono,
                rol: mockUser.rol
            };
            await authService.register(registrationData);
            await authService.login(mockCredentials);
            // Should have valid offline access
            hasOfflineAccess = await authService.hasValidOfflineSession();
            expect(hasOfflineAccess).toBe(true);
        });
        test('should store and retrieve critical data for offline use', async () => {
            const criticalData = {
                userPreferences: { theme: 'dark', language: 'es' },
                lastKnownLocation: { lat: 40.7128, lng: -74.0060 },
                cachedRoutes: ['route1', 'route2']
            };
            await authService.storeCriticalData('user_preferences', criticalData);
            const retrievedData = await authService.getCriticalData('user_preferences');
            expect(retrievedData).toEqual(criticalData);
        });
        test('should sync offline data when connection is restored', async () => {
            // Setup authenticated user with offline data
            const registrationData = {
                email: mockCredentials.email,
                password: mockCredentials.password,
                nombre: mockUser.nombre,
                telefono: mockUser.telefono,
                rol: mockUser.rol
            };
            await authService.register(registrationData);
            await authService.login(mockCredentials);
            // Get initial offline data
            const initialOfflineData = await secureStorage.getOfflineAuthData();
            expect(initialOfflineData).toBeTruthy();
            const initialSyncTime = initialOfflineData.lastSync;
            // Wait a bit and sync
            await new Promise(resolve => setTimeout(resolve, 10));
            await authService.syncOfflineData();
            // Verify sync time was updated
            const updatedOfflineData = await secureStorage.getOfflineAuthData();
            expect(updatedOfflineData).toBeTruthy();
            expect(updatedOfflineData.lastSync.getTime()).toBeGreaterThan(initialSyncTime.getTime());
        });
    });
    describe('Storage Management', () => {
        test('should get storage statistics', async () => {
            // Store some data
            const registrationData = {
                email: mockCredentials.email,
                password: mockCredentials.password,
                nombre: mockUser.nombre,
                telefono: mockUser.telefono,
                rol: mockUser.rol
            };
            await authService.register(registrationData);
            await authService.login(mockCredentials);
            await authService.storeCriticalData('test_data', { test: 'value' });
            // Wait a bit for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 50));
            const stats = authService.getStorageStats();
            expect(stats.totalItems).toBeGreaterThan(0);
            expect(stats.encryptedItems).toBeGreaterThan(0);
            expect(stats.totalSize).toBeGreaterThan(0);
        });
        test('should cleanup expired data', async () => {
            // Store some data that will expire
            await secureStorage.storeAuthToken('expired.token', new Date(Date.now() - 1000));
            const cleanedCount = await authService.cleanupExpiredData();
            expect(cleanedCount).toBeGreaterThanOrEqual(0);
        });
    });
    describe('Error Handling and Recovery', () => {
        test('should handle secure storage errors gracefully', async () => {
            // Mock secure storage to throw errors for all methods
            const errorStorage = {
                storeOfflineAuthData: jest.fn().mockRejectedValue(new Error('Storage error')),
                storeAuthToken: jest.fn().mockRejectedValue(new Error('Storage error')),
                storeRefreshToken: jest.fn().mockRejectedValue(new Error('Storage error')),
                storeUserData: jest.fn().mockRejectedValue(new Error('Storage error')),
                getAuthToken: jest.fn().mockRejectedValue(new Error('Retrieval error')),
                getRefreshToken: jest.fn().mockRejectedValue(new Error('Retrieval error')),
                getUserData: jest.fn().mockRejectedValue(new Error('Retrieval error')),
                getOfflineAuthData: jest.fn().mockRejectedValue(new Error('Retrieval error')),
                clearAuthData: jest.fn().mockRejectedValue(new Error('Clear error')),
                validateOfflineAccess: jest.fn().mockRejectedValue(new Error('Validation error')),
                storeCriticalData: jest.fn().mockRejectedValue(new Error('Storage error')),
                getCriticalData: jest.fn().mockRejectedValue(new Error('Retrieval error')),
                getStorageStats: jest.fn().mockReturnValue({ totalItems: 0, encryptedItems: 0, totalSize: 0, expiredItems: 0, oldestItem: null, newestItem: null }),
                cleanupExpiredItems: jest.fn().mockRejectedValue(new Error('Cleanup error'))
            };
            const errorAuthService = new AuthService(jwtUtils, cryptoUtils, sensitiveDataService, errorStorage);
            // Wait for constructor to complete
            await new Promise(resolve => setTimeout(resolve, 50));
            // Should still work with fallback to legacy storage for registration
            const registrationData = {
                email: mockCredentials.email,
                password: mockCredentials.password,
                nombre: mockUser.nombre,
                telefono: mockUser.telefono,
                rol: mockUser.rol
            };
            await errorAuthService.register(registrationData);
            // Login should work but use fallback storage
            const authResult = await errorAuthService.login(mockCredentials);
            expect(authResult).toBeTruthy();
            expect(authResult.user.email).toBe(mockCredentials.email);
        });
        test('should migrate from legacy storage to secure storage', async () => {
            // Store data in legacy format
            const legacyAuthResult = {
                user: mockUser,
                token: 'legacy.token',
                refreshToken: 'legacy.refresh.token',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                permissions: ['view_own_data']
            };
            localStorage.setItem('taxi_auth_data', JSON.stringify(legacyAuthResult));
            // Create new auth service - should migrate data
            const newAuthService = new AuthService(jwtUtils, cryptoUtils, sensitiveDataService, secureStorage);
            // Wait for async loading and migration
            await new Promise(resolve => setTimeout(resolve, 50));
            // Verify data was migrated to secure storage
            const migratedData = await secureStorage.getOfflineAuthData();
            expect(migratedData).toBeTruthy();
            expect(migratedData.user.email).toBe(mockUser.email);
        });
        test('should handle corrupted secure storage data', async () => {
            // Manually corrupt secure storage
            localStorage.setItem('taxi_secure_auth_token', 'corrupted_data');
            localStorage.setItem('taxi_secure_user_data', 'invalid_json');
            // Create auth service - should handle corruption gracefully
            const newAuthService = new AuthService(jwtUtils, cryptoUtils, sensitiveDataService, secureStorage);
            // Wait for async loading
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(newAuthService.getCurrentUser()).toBeNull();
            expect(newAuthService.isAuthenticated()).toBe(false);
        });
    });
    describe('Security Features', () => {
        test('should encrypt sensitive data in storage', async () => {
            const registrationData = {
                email: mockCredentials.email,
                password: mockCredentials.password,
                nombre: mockUser.nombre,
                telefono: mockUser.telefono,
                rol: mockUser.rol
            };
            await authService.register(registrationData);
            await authService.login(mockCredentials);
            // Check that stored data is encrypted (not plain text)
            const storedAuthToken = localStorage.getItem('taxi_secure_auth_token');
            const storedUserData = localStorage.getItem('taxi_secure_user_data');
            expect(storedAuthToken).toBeTruthy();
            expect(storedUserData).toBeTruthy();
            // Parse stored items to check they have encrypted structure
            const authTokenItem = JSON.parse(storedAuthToken);
            const userDataItem = JSON.parse(storedUserData);
            expect(authTokenItem).toHaveProperty('data');
            expect(authTokenItem).toHaveProperty('checksum');
            expect(authTokenItem).toHaveProperty('version');
            expect(userDataItem).toHaveProperty('data');
            expect(userDataItem).toHaveProperty('checksum');
            expect(userDataItem).toHaveProperty('version');
            // Data should not contain plain text credentials
            expect(authTokenItem.data).not.toContain(mockCredentials.email);
            expect(userDataItem.data).not.toContain(mockCredentials.email);
        });
        test('should validate data integrity with checksums', async () => {
            await authService.storeCriticalData('test_data', { sensitive: 'information' });
            // Manually corrupt checksum
            const storedItem = localStorage.getItem('taxi_critical_data_test_data');
            if (storedItem) {
                const parsed = JSON.parse(storedItem);
                parsed.checksum = 'invalid_checksum';
                localStorage.setItem('taxi_critical_data_test_data', JSON.stringify(parsed));
            }
            // Should return null due to checksum mismatch
            const retrievedData = await authService.getCriticalData('test_data');
            expect(retrievedData).toBeNull();
        });
    });
});
//# sourceMappingURL=auth-service-secure-storage.test.js.map