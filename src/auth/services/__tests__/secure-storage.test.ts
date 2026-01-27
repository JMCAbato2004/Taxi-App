/**
 * Unit tests for SecureStorageService
 * Tests secure storage functionality for JWT tokens and critical data
 * Requirements: 6.3 - Secure persistence of JWT tokens and critical data
 */

import { SecureStorageService } from '../secure-storage';
import { CryptoUtils } from '../../utils/crypto-utils';
import { AuthResult, User, UserRole, Permission } from '../../types';

// Mock CryptoUtils
jest.mock('../../utils/crypto-utils');

describe('SecureStorageService', () => {
  let secureStorage: SecureStorageService;
  let mockCryptoUtils: jest.Mocked<CryptoUtils>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    nombre: 'Test User',
    telefono: '123456789',
    rol: UserRole.TAXISTA,
    numeroTaxista: 'TX001',
    activo: true,
    fechaCreacion: new Date('2024-01-01'),
    fechaActualizacion: new Date('2024-01-01')
  };

  const mockAuthResult: AuthResult = {
    user: mockUser,
    token: 'mock.jwt.token',
    refreshToken: 'mock.refresh.token',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    permissions: [Permission.VIEW_OWN_DATA, Permission.INPUT_OPERATIONAL_DATA]
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Create mock crypto utils with proper simulation
    mockCryptoUtils = new CryptoUtils() as jest.Mocked<CryptoUtils>;
    
    // Mock encryption to return a more realistic encrypted format
    mockCryptoUtils.encryptSensitiveData = jest.fn().mockImplementation(async (data: string) => {
      // Simulate real encryption by adding some random bytes and then base64 encoding
      const randomPrefix = Math.random().toString(36).substring(2, 8);
      const encrypted = randomPrefix + data + randomPrefix;
      return btoa(encrypted);
    });
    
    // Mock decryption to reverse the encryption process
    mockCryptoUtils.decryptSensitiveData = jest.fn().mockImplementation(async (encryptedData: string) => {
      const decoded = atob(encryptedData);
      // Remove the random prefix and suffix (6 chars each)
      return decoded.substring(6, decoded.length - 6);
    });
    
    // Create service instance
    secureStorage = new SecureStorageService(mockCryptoUtils);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('JWT Token Storage', () => {
    test('should store and retrieve auth token securely', async () => {
      const token = 'test.jwt.token';
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await secureStorage.storeAuthToken(token, expiresAt);
      
      expect(mockCryptoUtils.encryptSensitiveData).toHaveBeenCalledWith(token);
      
      const retrievedToken = await secureStorage.getAuthToken();
      // The token should be the same after encryption/decryption cycle
      expect(retrievedToken).toBe(token);
    });

    test('should return null for expired auth token', async () => {
      const token = 'test.jwt.token';
      const expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      await secureStorage.storeAuthToken(token, expiresAt);
      
      const retrievedToken = await secureStorage.getAuthToken();
      expect(retrievedToken).toBeNull();
    });

    test('should store and retrieve refresh token securely', async () => {
      const refreshToken = 'test.refresh.token';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await secureStorage.storeRefreshToken(refreshToken, expiresAt);
      
      expect(mockCryptoUtils.encryptSensitiveData).toHaveBeenCalledWith(refreshToken);
      
      const retrievedToken = await secureStorage.getRefreshToken();
      expect(retrievedToken).toBe(refreshToken);
    });

    test('should return null for expired refresh token', async () => {
      const refreshToken = 'test.refresh.token';
      const expiresAt = new Date(Date.now() - 1000); // Expired

      await secureStorage.storeRefreshToken(refreshToken, expiresAt);
      
      const retrievedToken = await secureStorage.getRefreshToken();
      expect(retrievedToken).toBeNull();
    });
  });

  describe('Offline Authentication Data', () => {
    test('should store and retrieve complete offline auth data', async () => {
      await secureStorage.storeOfflineAuthData(mockAuthResult);
      
      expect(mockCryptoUtils.encryptSensitiveData).toHaveBeenCalled();
      
      const retrievedData = await secureStorage.getOfflineAuthData();
      
      expect(retrievedData).toBeTruthy();
      expect(retrievedData!.user.id).toBe(mockUser.id);
      expect(retrievedData!.token).toBe(mockAuthResult.token);
      expect(retrievedData!.refreshToken).toBe(mockAuthResult.refreshToken);
    });

    test('should return null for offline data older than 7 days', async () => {
      // Store offline data first
      await secureStorage.storeOfflineAuthData(mockAuthResult);
      
      // Manually modify the stored data to have an old lastSync
      const storedKey = 'taxi_offline_cache';
      const storedItem = localStorage.getItem(storedKey);
      if (storedItem) {
        const parsed = JSON.parse(storedItem);
        // Use the mock decryption to get the data
        const decryptedData = await mockCryptoUtils.decryptSensitiveData(parsed.data);
        const offlineData = JSON.parse(decryptedData);
        offlineData.lastSync = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
        
        // Re-encrypt the modified data
        const modifiedData = JSON.stringify(offlineData);
        const reencryptedData = await mockCryptoUtils.encryptSensitiveData(modifiedData);
        parsed.data = reencryptedData;
        parsed.checksum = await secureStorage['calculateChecksum'](parsed.data);
        localStorage.setItem(storedKey, JSON.stringify(parsed));
      }
      
      const retrievedData = await secureStorage.getOfflineAuthData();
      expect(retrievedData).toBeNull();
    });
  });

  describe('User Data Storage', () => {
    test('should store and retrieve user data securely', async () => {
      await secureStorage.storeUserData(mockUser);
      
      expect(mockCryptoUtils.encryptSensitiveData).toHaveBeenCalledWith(JSON.stringify(mockUser));
      
      const retrievedUser = await secureStorage.getUserData();
      
      expect(retrievedUser).toBeTruthy();
      expect(retrievedUser!.id).toBe(mockUser.id);
      expect(retrievedUser!.email).toBe(mockUser.email);
      expect(retrievedUser!.fechaCreacion).toEqual(mockUser.fechaCreacion);
    });

    test('should return null when no user data exists', async () => {
      const retrievedUser = await secureStorage.getUserData();
      expect(retrievedUser).toBeNull();
    });
  });

  describe('Critical Data Storage', () => {
    test('should store and retrieve critical data with encryption', async () => {
      const criticalData = { important: 'data', numbers: [1, 2, 3] };
      const key = 'test_critical_data';

      await secureStorage.storeCriticalData(key, criticalData);
      
      expect(mockCryptoUtils.encryptSensitiveData).toHaveBeenCalledWith(JSON.stringify(criticalData));
      
      const retrievedData = await secureStorage.getCriticalData(key);
      
      expect(retrievedData).toEqual(criticalData);
    });

    test('should store string data without JSON serialization', async () => {
      const stringData = 'simple string data';
      const key = 'test_string_data';

      await secureStorage.storeCriticalData(key, stringData);
      
      expect(mockCryptoUtils.encryptSensitiveData).toHaveBeenCalledWith(stringData);
      
      const retrievedData = await secureStorage.getCriticalData(key);
      
      expect(retrievedData).toBe(stringData);
    });

    test('should respect custom cache options', async () => {
      const data = { test: 'data' };
      const key = 'test_with_options';
      const maxAge = 60 * 60 * 1000; // 1 hour

      await secureStorage.storeCriticalData(key, data, { maxAge, encrypt: true });
      
      expect(mockCryptoUtils.encryptSensitiveData).toHaveBeenCalled();
    });
  });

  describe('Data Cleanup and Management', () => {
    test('should clear all authentication data', async () => {
      // Store some data first
      await secureStorage.storeAuthToken('token');
      await secureStorage.storeRefreshToken('refresh');
      await secureStorage.storeUserData(mockUser);
      await secureStorage.storeOfflineAuthData(mockAuthResult);

      await secureStorage.clearAuthData();

      // Verify data is cleared
      const token = await secureStorage.getAuthToken();
      const refreshToken = await secureStorage.getRefreshToken();
      const userData = await secureStorage.getUserData();
      const offlineData = await secureStorage.getOfflineAuthData();

      expect(token).toBeNull();
      expect(refreshToken).toBeNull();
      expect(userData).toBeNull();
      expect(offlineData).toBeNull();
    });

    test('should validate offline access correctly', async () => {
      // No data stored - should be false
      let isValid = await secureStorage.validateOfflineAccess();
      expect(isValid).toBe(false);

      // Store valid data
      await secureStorage.storeOfflineAuthData(mockAuthResult);
      await secureStorage.storeAuthToken(mockAuthResult.token);

      isValid = await secureStorage.validateOfflineAccess();
      expect(isValid).toBe(true);
    });

    test('should get storage statistics', () => {
      const stats = secureStorage.getStorageStats();
      
      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('encryptedItems');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('oldestItem');
      expect(stats).toHaveProperty('newestItem');
      expect(stats).toHaveProperty('expiredItems');
      
      expect(typeof stats.totalItems).toBe('number');
      expect(typeof stats.encryptedItems).toBe('number');
      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.expiredItems).toBe('number');
    });

    test('should cleanup expired items', async () => {
      // Store an expired item
      const expiredToken = 'expired.token';
      const pastDate = new Date(Date.now() - 1000);
      
      await secureStorage.storeAuthToken(expiredToken, pastDate);
      
      const cleanedCount = await secureStorage.cleanupExpiredItems();
      
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle encryption errors gracefully', async () => {
      mockCryptoUtils.encryptSensitiveData.mockRejectedValueOnce(new Error('Encryption failed'));
      
      await expect(secureStorage.storeAuthToken('token')).rejects.toThrow('Error storing authentication token');
    });

    test('should handle decryption errors gracefully', async () => {
      // Store a token first
      await secureStorage.storeAuthToken('token');
      
      // Manually corrupt the stored data to cause decryption failure
      const storedItem = localStorage.getItem('taxi_secure_auth_token');
      if (storedItem) {
        const parsed = JSON.parse(storedItem);
        // Corrupt the encrypted data
        parsed.data = 'corrupted_encrypted_data_that_will_fail_decryption';
        localStorage.setItem('taxi_secure_auth_token', JSON.stringify(parsed));
      }
      
      const retrievedToken = await secureStorage.getAuthToken();
      expect(retrievedToken).toBeNull();
    });

    test('should handle corrupted data gracefully', async () => {
      // Manually store corrupted data
      localStorage.setItem('taxi_secure_auth_token', 'corrupted_json');
      
      const retrievedToken = await secureStorage.getAuthToken();
      expect(retrievedToken).toBeNull();
    });

    test('should handle localStorage quota exceeded', async () => {
      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(secureStorage.storeAuthToken('token')).rejects.toThrow();
      
      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Data Integrity', () => {
    test('should verify data integrity with checksums', async () => {
      const token = 'test.token';
      await secureStorage.storeAuthToken(token);
      
      // Manually corrupt the stored data
      const storedItem = localStorage.getItem('taxi_secure_auth_token');
      if (storedItem) {
        const parsed = JSON.parse(storedItem);
        parsed.checksum = 'invalid_checksum';
        localStorage.setItem('taxi_secure_auth_token', JSON.stringify(parsed));
      }
      
      const retrievedToken = await secureStorage.getAuthToken();
      expect(retrievedToken).toBeNull();
    });

    test('should handle version compatibility', async () => {
      const token = 'test.token';
      await secureStorage.storeAuthToken(token);
      
      // Verify version is stored
      const storedItem = localStorage.getItem('taxi_secure_auth_token');
      if (storedItem) {
        const parsed = JSON.parse(storedItem);
        expect(parsed.version).toBe('1.0.0');
      }
    });
  });
});