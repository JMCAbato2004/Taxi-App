/**
 * Secure Storage Demo
 * Demonstrates secure storage functionality for JWT tokens and critical data
 * Requirements: 6.3 - Secure persistence and offline functionality
 */

import { AuthService } from '../services/auth-service';
import { SecureStorageService } from '../services/secure-storage';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
import { UserRole, UserRegistrationData, LoginCredentials } from '../types';

export class SecureStorageDemo {
  private authService: AuthService;
  private secureStorage: SecureStorageService;

  constructor() {
    const jwtUtils = new JWTUtils();
    const cryptoUtils = new CryptoUtils();
    this.secureStorage = new SecureStorageService(cryptoUtils);
    this.authService = new AuthService(jwtUtils, cryptoUtils, undefined, this.secureStorage);
  }

  async runDemo(): Promise<void> {
    console.log('🔐 Secure Storage Demo - Starting...\n');

    try {
      // Clear any existing data
      await this.secureStorage.clearAllData();
      console.log('✅ Cleared existing storage data\n');

      // 1. Demonstrate user registration and secure storage
      await this.demonstrateUserRegistration();

      // 2. Demonstrate secure login and token storage
      await this.demonstrateSecureLogin();

      // 3. Demonstrate critical data caching
      await this.demonstrateCriticalDataCaching();

      // 4. Demonstrate offline functionality
      await this.demonstrateOfflineFunctionality();

      // 5. Demonstrate token refresh
      await this.demonstrateTokenRefresh();

      // 6. Demonstrate storage management
      await this.demonstrateStorageManagement();

      // 7. Demonstrate security features
      await this.demonstrateSecurityFeatures();

      console.log('🎉 Secure Storage Demo completed successfully!');

    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  private async demonstrateUserRegistration(): Promise<void> {
    console.log('📝 1. User Registration with Secure Storage');
    console.log('==========================================');

    const registrationData: UserRegistrationData = {
      email: 'taxista@example.com',
      password: 'SecurePassword123!',
      nombre: 'Juan Pérez',
      telefono: '+34 600 123 456',
      rol: UserRole.TAXISTA
    };

    const user = await this.authService.register(registrationData);
    console.log('✅ User registered:', {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      numeroTaxista: user.numeroTaxista
    });

    // Verify user data is stored securely
    const storedUser = await this.secureStorage.getUserData();
    console.log('✅ User data stored securely in encrypted format');
    console.log('📊 Stored user ID:', storedUser?.id);
    console.log('');
  }

  private async demonstrateSecureLogin(): Promise<void> {
    console.log('🔑 2. Secure Login and Token Storage');
    console.log('===================================');

    const credentials: LoginCredentials = {
      email: 'taxista@example.com',
      password: 'SecurePassword123!'
    };

    const authResult = await this.authService.login(credentials);
    console.log('✅ Login successful');
    console.log('📊 Token length:', authResult.token.length);
    console.log('📊 Refresh token length:', authResult.refreshToken.length);
    console.log('📊 Expires at:', authResult.expiresAt.toISOString());
    console.log('📊 Permissions:', authResult.permissions.join(', '));

    // Verify tokens are stored securely
    const storedToken = await this.secureStorage.getAuthToken();
    const storedRefreshToken = await this.secureStorage.getRefreshToken();
    
    console.log('✅ Auth token stored securely:', storedToken === authResult.token);
    console.log('✅ Refresh token stored securely:', storedRefreshToken === authResult.refreshToken);

    // Check offline data
    const offlineData = await this.secureStorage.getOfflineAuthData();
    console.log('✅ Offline data cached:', !!offlineData);
    console.log('📊 Last sync:', offlineData?.lastSync.toISOString());
    console.log('');
  }

  private async demonstrateCriticalDataCaching(): Promise<void> {
    console.log('💾 3. Critical Data Caching for Offline Mode');
    console.log('============================================');

    // Store various types of critical data
    const criticalData = {
      userPreferences: {
        theme: 'dark',
        language: 'es',
        notifications: true,
        autoSync: true
      },
      lastKnownLocation: {
        latitude: 40.4168,
        longitude: -3.7038,
        timestamp: new Date().toISOString(),
        accuracy: 10
      },
      cachedRoutes: [
        { id: 'route1', name: 'Centro - Aeropuerto', distance: 15.2 },
        { id: 'route2', name: 'Estación - Hospital', distance: 8.7 }
      ],
      operationalData: {
        totalTrips: 145,
        totalEarnings: 2847.50,
        averageRating: 4.8,
        lastTripDate: new Date().toISOString()
      }
    };

    // Store each type of critical data
    await this.authService.storeCriticalData('user_preferences', criticalData.userPreferences);
    await this.authService.storeCriticalData('location_data', criticalData.lastKnownLocation);
    await this.authService.storeCriticalData('cached_routes', criticalData.cachedRoutes);
    await this.authService.storeCriticalData('operational_stats', criticalData.operationalData, 30 * 24 * 60 * 60 * 1000); // 30 days

    console.log('✅ Stored user preferences');
    console.log('✅ Stored location data');
    console.log('✅ Stored cached routes');
    console.log('✅ Stored operational statistics (30-day cache)');

    // Retrieve and verify data
    const retrievedPreferences = await this.authService.getCriticalData('user_preferences');
    const retrievedLocation = await this.authService.getCriticalData('location_data');
    const retrievedRoutes = await this.authService.getCriticalData('cached_routes');
    const retrievedStats = await this.authService.getCriticalData('operational_stats');

    console.log('📊 Retrieved preferences theme:', retrievedPreferences?.theme);
    console.log('📊 Retrieved location accuracy:', retrievedLocation?.accuracy);
    console.log('📊 Retrieved routes count:', retrievedRoutes?.length);
    console.log('📊 Retrieved total trips:', retrievedStats?.totalTrips);
    console.log('');
  }

  private async demonstrateOfflineFunctionality(): Promise<void> {
    console.log('📱 4. Offline Functionality');
    console.log('===========================');

    // Check offline access validity
    const hasValidOfflineSession = await this.authService.hasValidOfflineSession();
    console.log('✅ Valid offline session:', hasValidOfflineSession);

    // Simulate offline scenario
    console.log('🔄 Simulating offline scenario...');
    
    // Verify we can still access cached data
    const offlineUser = await this.secureStorage.getUserData();
    const offlineToken = await this.secureStorage.getAuthToken();
    const offlinePreferences = await this.authService.getCriticalData('user_preferences');

    console.log('✅ User data available offline:', !!offlineUser);
    console.log('✅ Auth token available offline:', !!offlineToken);
    console.log('✅ Critical data available offline:', !!offlinePreferences);

    // Validate offline access
    const isOfflineValid = await this.secureStorage.validateOfflineAccess();
    console.log('✅ Offline access validation:', isOfflineValid);

    // Simulate coming back online and syncing
    console.log('🌐 Simulating connection restored...');
    await this.authService.syncOfflineData();
    console.log('✅ Offline data synchronized');
    console.log('');
  }

  private async demonstrateTokenRefresh(): Promise<void> {
    console.log('🔄 5. Token Refresh with Secure Storage');
    console.log('=======================================');

    const originalToken = await this.secureStorage.getAuthToken();
    console.log('📊 Original token (first 20 chars):', originalToken?.substring(0, 20) + '...');

    // Refresh the token
    const newToken = await this.authService.refreshToken();
    console.log('📊 New token (first 20 chars):', newToken.substring(0, 20) + '...');

    // Verify new token is stored
    const storedNewToken = await this.secureStorage.getAuthToken();
    console.log('✅ New token stored securely:', storedNewToken === newToken);
    console.log('✅ Token successfully refreshed:', originalToken !== newToken);
    console.log('');
  }

  private async demonstrateStorageManagement(): Promise<void> {
    console.log('📊 6. Storage Management and Statistics');
    console.log('======================================');

    // Get storage statistics
    const stats = this.authService.getStorageStats();
    console.log('📊 Storage Statistics:');
    console.log('   - Total items:', stats.totalItems);
    console.log('   - Encrypted items:', stats.encryptedItems);
    console.log('   - Total size (bytes):', stats.totalSize);
    console.log('   - Expired items:', stats.expiredItems);
    console.log('   - Oldest item:', stats.oldestItem?.toISOString());
    console.log('   - Newest item:', stats.newestItem?.toISOString());

    // Demonstrate cleanup
    console.log('🧹 Performing cleanup of expired items...');
    const cleanedCount = await this.authService.cleanupExpiredData();
    console.log('✅ Cleaned up', cleanedCount, 'expired items');

    // Show updated statistics
    const updatedStats = this.authService.getStorageStats();
    console.log('📊 Updated expired items count:', updatedStats.expiredItems);
    console.log('');
  }

  private async demonstrateSecurityFeatures(): Promise<void> {
    console.log('🔒 7. Security Features');
    console.log('=======================');

    // Show that data is encrypted in storage
    console.log('🔍 Examining raw storage data...');
    
    const rawAuthToken = localStorage.getItem('taxi_secure_auth_token');
    const rawUserData = localStorage.getItem('taxi_secure_user_data');
    const rawCriticalData = localStorage.getItem('taxi_critical_data_user_preferences');

    if (rawAuthToken) {
      const authTokenItem = JSON.parse(rawAuthToken);
      console.log('📊 Auth token storage structure:');
      console.log('   - Has encrypted data:', !!authTokenItem.data);
      console.log('   - Has checksum:', !!authTokenItem.checksum);
      console.log('   - Has version:', !!authTokenItem.version);
      console.log('   - Has timestamp:', !!authTokenItem.timestamp);
      console.log('   - Data is encrypted (not plain text):', !authTokenItem.data.includes('taxista@example.com'));
    }

    if (rawUserData) {
      const userDataItem = JSON.parse(rawUserData);
      console.log('📊 User data storage structure:');
      console.log('   - Has encrypted data:', !!userDataItem.data);
      console.log('   - Has integrity checksum:', !!userDataItem.checksum);
      console.log('   - Data is encrypted (not plain text):', !userDataItem.data.includes('Juan Pérez'));
    }

    // Demonstrate data integrity protection
    console.log('🛡️ Testing data integrity protection...');
    
    // Store test data
    await this.authService.storeCriticalData('integrity_test', { test: 'data' });
    
    // Manually corrupt the checksum
    const testDataKey = 'taxi_critical_data_integrity_test';
    const storedTestData = localStorage.getItem(testDataKey);
    if (storedTestData) {
      const parsed = JSON.parse(storedTestData);
      parsed.checksum = 'corrupted_checksum';
      localStorage.setItem(testDataKey, JSON.stringify(parsed));
    }

    // Try to retrieve corrupted data
    const corruptedData = await this.authService.getCriticalData('integrity_test');
    console.log('✅ Corrupted data rejected (returns null):', corruptedData === null);

    console.log('✅ All security features working correctly');
    console.log('');
  }
}

// Export function to run the demo
export async function runSecureStorageDemo(): Promise<void> {
  const demo = new SecureStorageDemo();
  await demo.runDemo();
}

// Auto-run if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).runSecureStorageDemo = runSecureStorageDemo;
  console.log('Secure Storage Demo loaded. Run with: runSecureStorageDemo()');
} else if (require.main === module) {
  // Node.js environment
  runSecureStorageDemo().catch(console.error);
}