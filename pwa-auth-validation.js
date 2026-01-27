/**
 * PWA Authentication Validation Script
 * Verifies PWA compatibility and offline capabilities for the authentication system
 * Requirements: 10.3 - Verify PWA compatibility and offline capabilities
 */

// Import authentication modules
import { AuthService } from './src/auth/services/auth-service.js';
import { SecureStorageService } from './src/auth/services/secure-storage.js';
import { DataSyncService } from './src/auth/services/data-sync.js';
import { RoleService } from './src/auth/services/role-service.js';
import { ServiceExpenseIntegrationService } from './src/auth/services/service-expense-integration.js';

/**
 * PWA Validation Results
 */
class PWAValidationResults {
  constructor() {
    this.results = {
      manifest: { passed: false, details: [] },
      serviceWorker: { passed: false, details: [] },
      offlineAuth: { passed: false, details: [] },
      secureStorage: { passed: false, details: [] },
      dataSync: { passed: false, details: [] },
      networkDetection: { passed: false, details: [] },
      caching: { passed: false, details: [] },
      overall: { passed: false, score: 0 }
    };
  }

  addResult(category, passed, detail) {
    this.results[category].details.push({
      passed,
      detail,
      timestamp: new Date().toISOString()
    });
    
    // Update category status
    const categoryResults = this.results[category].details;
    this.results[category].passed = categoryResults.every(r => r.passed);
  }

  calculateOverallScore() {
    const categories = Object.keys(this.results).filter(k => k !== 'overall');
    const passedCategories = categories.filter(cat => this.results[cat].passed).length;
    const score = Math.round((passedCategories / categories.length) * 100);
    
    this.results.overall.score = score;
    this.results.overall.passed = score >= 80; // 80% threshold for passing
    
    return score;
  }

  generateReport() {
    const score = this.calculateOverallScore();
    
    let report = `
# PWA Authentication Validation Report
Generated: ${new Date().toISOString()}
Overall Score: ${score}% ${this.results.overall.passed ? '✅ PASSED' : '❌ FAILED'}

## Summary
`;

    Object.entries(this.results).forEach(([category, result]) => {
      if (category === 'overall') return;
      
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      const detailCount = result.details.length;
      const passedCount = result.details.filter(d => d.passed).length;
      
      report += `- **${category.toUpperCase()}**: ${status} (${passedCount}/${detailCount})\n`;
    });

    report += `\n## Detailed Results\n`;

    Object.entries(this.results).forEach(([category, result]) => {
      if (category === 'overall') return;
      
      report += `\n### ${category.toUpperCase()}\n`;
      result.details.forEach(detail => {
        const status = detail.passed ? '✅' : '❌';
        report += `${status} ${detail.detail}\n`;
      });
    });

    return report;
  }
}

/**
 * PWA Authentication Validator
 */
class PWAAuthValidator {
  constructor() {
    this.results = new PWAValidationResults();
    this.authService = null;
    this.secureStorage = null;
    this.dataSync = null;
  }

  /**
   * Run all PWA validation tests
   */
  async runValidation() {
    console.log('🚀 Starting PWA Authentication Validation...');
    
    try {
      await this.validateManifest();
      await this.validateServiceWorker();
      await this.initializeServices();
      await this.validateOfflineAuth();
      await this.validateSecureStorage();
      await this.validateDataSync();
      await this.validateNetworkDetection();
      await this.validateCaching();
      
      const report = this.results.generateReport();
      console.log(report);
      
      // Save report to file
      await this.saveReport(report);
      
      return this.results.results.overall.passed;
      
    } catch (error) {
      console.error('❌ Validation failed with error:', error);
      this.results.addResult('overall', false, `Validation error: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate PWA Manifest
   */
  async validateManifest() {
    console.log('📋 Validating PWA Manifest...');
    
    try {
      const response = await fetch('./manifest.json');
      const manifest = await response.json();
      
      // Check required fields
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      requiredFields.forEach(field => {
        if (manifest[field]) {
          this.results.addResult('manifest', true, `Required field '${field}' present`);
        } else {
          this.results.addResult('manifest', false, `Missing required field '${field}'`);
        }
      });
      
      // Check icons
      if (manifest.icons && manifest.icons.length > 0) {
        const hasLargeIcon = manifest.icons.some(icon => 
          icon.sizes.includes('512x512') || icon.sizes.includes('192x192')
        );
        this.results.addResult('manifest', hasLargeIcon, 
          hasLargeIcon ? 'Large icons (192x192 or 512x512) available' : 'Missing large icons');
      }
      
      // Check display mode
      const validDisplayModes = ['standalone', 'fullscreen', 'minimal-ui'];
      const hasValidDisplay = validDisplayModes.includes(manifest.display);
      this.results.addResult('manifest', hasValidDisplay, 
        `Display mode '${manifest.display}' ${hasValidDisplay ? 'is valid' : 'is not optimal for PWA'}`);
      
      // Check theme colors
      this.results.addResult('manifest', !!manifest.theme_color, 
        manifest.theme_color ? 'Theme color defined' : 'Theme color missing');
      
    } catch (error) {
      this.results.addResult('manifest', false, `Manifest validation error: ${error.message}`);
    }
  }

  /**
   * Validate Service Worker
   */
  async validateServiceWorker() {
    console.log('⚙️ Validating Service Worker...');
    
    try {
      // Check if service worker is supported
      if ('serviceWorker' in navigator) {
        this.results.addResult('serviceWorker', true, 'Service Worker API supported');
        
        // Check if service worker is registered
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          this.results.addResult('serviceWorker', true, 'Service Worker registered');
          
          // Check service worker state
          if (registration.active) {
            this.results.addResult('serviceWorker', true, 'Service Worker active');
          } else {
            this.results.addResult('serviceWorker', false, 'Service Worker not active');
          }
          
          // Test service worker messaging
          try {
            const messageChannel = new MessageChannel();
            const messagePromise = new Promise((resolve) => {
              messageChannel.port1.onmessage = (event) => resolve(event.data);
            });
            
            registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
            const response = await Promise.race([
              messagePromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            
            this.results.addResult('serviceWorker', true, 'Service Worker messaging works');
          } catch (error) {
            this.results.addResult('serviceWorker', false, `Service Worker messaging failed: ${error.message}`);
          }
          
        } else {
          this.results.addResult('serviceWorker', false, 'Service Worker not registered');
        }
      } else {
        this.results.addResult('serviceWorker', false, 'Service Worker API not supported');
      }
      
      // Check Cache API
      if ('caches' in window) {
        this.results.addResult('serviceWorker', true, 'Cache API supported');
        
        // Test cache functionality
        try {
          const testCache = await caches.open('pwa-test-cache');
          await testCache.put(new Request('/test'), new Response('test'));
          const cachedResponse = await testCache.match('/test');
          await caches.delete('pwa-test-cache');
          
          this.results.addResult('serviceWorker', !!cachedResponse, 
            cachedResponse ? 'Cache API functional' : 'Cache API not working');
        } catch (error) {
          this.results.addResult('serviceWorker', false, `Cache API test failed: ${error.message}`);
        }
      } else {
        this.results.addResult('serviceWorker', false, 'Cache API not supported');
      }
      
    } catch (error) {
      this.results.addResult('serviceWorker', false, `Service Worker validation error: ${error.message}`);
    }
  }

  /**
   * Initialize authentication services
   */
  async initializeServices() {
    console.log('🔧 Initializing Authentication Services...');
    
    try {
      // Initialize secure storage
      this.secureStorage = new SecureStorageService();
      
      // Initialize auth service
      this.authService = new AuthService(this.secureStorage);
      
      // Initialize role service
      this.roleService = new RoleService(this.authService, this.secureStorage);
      
      // Initialize service expense integration
      this.serviceExpenseIntegration = new ServiceExpenseIntegrationService(
        this.authService,
        this.roleService
      );
      
      // Initialize data sync service
      this.dataSync = new DataSyncService(
        this.secureStorage,
        this.roleService,
        this.serviceExpenseIntegration,
        () => this.authService.getCurrentUser()
      );
      
      console.log('✅ Authentication services initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Validate offline authentication capabilities
   */
  async validateOfflineAuth() {
    console.log('🔐 Validating Offline Authentication...');
    
    try {
      // Test secure storage availability
      const testKey = 'pwa_test_key';
      const testValue = { test: 'data', timestamp: Date.now() };
      
      await this.secureStorage.storeCriticalData(testKey, testValue);
      const retrievedValue = await this.secureStorage.getCriticalData(testKey);
      await this.secureStorage.removeCriticalData(testKey);
      
      this.results.addResult('offlineAuth', 
        JSON.stringify(retrievedValue) === JSON.stringify(testValue),
        'Secure storage read/write operations work');
      
      // Test JWT token storage and retrieval
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      await this.secureStorage.storeToken(testToken);
      const retrievedToken = await this.secureStorage.getToken();
      await this.secureStorage.clearToken();
      
      this.results.addResult('offlineAuth', retrievedToken === testToken,
        'JWT token storage and retrieval works');
      
      // Test offline user session persistence
      const testUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        nombre: 'Test User',
        rol: 'TAXISTA',
        numeroTaxista: 'TX001',
        activo: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      };
      
      await this.secureStorage.storeCriticalData('current_user', testUser);
      const retrievedUser = await this.secureStorage.getCriticalData('current_user');
      await this.secureStorage.removeCriticalData('current_user');
      
      this.results.addResult('offlineAuth', 
        retrievedUser && retrievedUser.id === testUser.id,
        'User session persistence works offline');
      
      // Test role-based data filtering offline
      if (this.roleService) {
        const testPermissions = this.roleService.getUserPermissions({ rol: 'PATRON' });
        this.results.addResult('offlineAuth', 
          testPermissions && testPermissions.length > 0,
          'Role-based permissions work offline');
      }
      
    } catch (error) {
      this.results.addResult('offlineAuth', false, `Offline auth validation error: ${error.message}`);
    }
  }

  /**
   * Validate secure storage implementation
   */
  async validateSecureStorage() {
    console.log('🔒 Validating Secure Storage...');
    
    try {
      // Test encryption/decryption
      const sensitiveData = {
        password: 'test-password-123',
        personalInfo: 'sensitive-info',
        timestamp: Date.now()
      };
      
      await this.secureStorage.storeCriticalData('sensitive_test', sensitiveData);
      
      // Check that data is encrypted in localStorage
      const rawStoredData = localStorage.getItem('taxi_secure_sensitive_test');
      const isEncrypted = rawStoredData && !rawStoredData.includes('test-password-123');
      
      this.results.addResult('secureStorage', isEncrypted,
        isEncrypted ? 'Data is encrypted in storage' : 'Data is not properly encrypted');
      
      // Test decryption
      const decryptedData = await this.secureStorage.getCriticalData('sensitive_test');
      const decryptionWorks = decryptedData && decryptedData.password === sensitiveData.password;
      
      this.results.addResult('secureStorage', decryptionWorks,
        decryptionWorks ? 'Data decryption works correctly' : 'Data decryption failed');
      
      // Cleanup
      await this.secureStorage.removeCriticalData('sensitive_test');
      
      // Test storage quota and limits
      try {
        const largeData = { data: 'x'.repeat(1000000) }; // 1MB of data
        await this.secureStorage.storeCriticalData('large_test', largeData);
        await this.secureStorage.removeCriticalData('large_test');
        
        this.results.addResult('secureStorage', true, 'Large data storage works');
      } catch (error) {
        this.results.addResult('secureStorage', false, `Large data storage failed: ${error.message}`);
      }
      
      // Test storage persistence across sessions
      const persistenceTestData = { sessionTest: Date.now() };
      await this.secureStorage.storeCriticalData('persistence_test', persistenceTestData);
      
      // Simulate page reload by creating new instance
      const newSecureStorage = new SecureStorageService();
      const persistedData = await newSecureStorage.getCriticalData('persistence_test');
      await newSecureStorage.removeCriticalData('persistence_test');
      
      this.results.addResult('secureStorage', 
        persistedData && persistedData.sessionTest === persistenceTestData.sessionTest,
        'Data persists across sessions');
      
    } catch (error) {
      this.results.addResult('secureStorage', false, `Secure storage validation error: ${error.message}`);
    }
  }

  /**
   * Validate data synchronization capabilities
   */
  async validateDataSync() {
    console.log('🔄 Validating Data Synchronization...');
    
    try {
      // Mock current user for testing
      const mockUser = {
        id: 'test-user-sync',
        email: 'sync@test.com',
        nombre: 'Sync Test User',
        rol: 'TAXISTA',
        numeroTaxista: 'TX999',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };
      
      // Override getCurrentUser for testing
      const originalGetCurrentUser = this.dataSync.getCurrentUser;
      this.dataSync.getCurrentUser = () => mockUser;
      
      // Test operation queuing
      const operationId = await this.dataSync.queueOperation('CREATE_SERVICE', {
        description: 'Test service',
        amount: 100,
        timestamp: Date.now()
      });
      
      this.results.addResult('dataSync', !!operationId,
        operationId ? 'Operation queuing works' : 'Operation queuing failed');
      
      // Test pending operations retrieval
      const pendingOps = this.dataSync.getPendingOperations();
      this.results.addResult('dataSync', pendingOps.length > 0,
        `Pending operations retrieval works (${pendingOps.length} operations)`);
      
      // Test sync statistics
      const syncStats = await this.dataSync.getSyncStats();
      this.results.addResult('dataSync', 
        syncStats && typeof syncStats.totalOperations === 'number',
        'Sync statistics generation works');
      
      // Test network status detection
      this.results.addResult('dataSync', 
        syncStats.networkStatus && typeof syncStats.networkStatus.isOnline === 'boolean',
        'Network status detection works');
      
      // Test operation cancellation
      try {
        await this.dataSync.cancelOperation(operationId);
        const remainingOps = this.dataSync.getPendingOperations();
        this.results.addResult('dataSync', 
          remainingOps.length === 0,
          'Operation cancellation works');
      } catch (error) {
        this.results.addResult('dataSync', false, `Operation cancellation failed: ${error.message}`);
      }
      
      // Test configuration updates
      try {
        await this.dataSync.updateConfig({ maxRetries: 5, syncInterval: 60000 });
        this.results.addResult('dataSync', true, 'Configuration updates work');
      } catch (error) {
        this.results.addResult('dataSync', false, `Configuration update failed: ${error.message}`);
      }
      
      // Restore original function
      this.dataSync.getCurrentUser = originalGetCurrentUser;
      
    } catch (error) {
      this.results.addResult('dataSync', false, `Data sync validation error: ${error.message}`);
    }
  }

  /**
   * Validate network detection capabilities
   */
  async validateNetworkDetection() {
    console.log('🌐 Validating Network Detection...');
    
    try {
      // Test navigator.onLine
      this.results.addResult('networkDetection', 'onLine' in navigator,
        'navigator.onLine API available');
      
      // Test online/offline event listeners
      let onlineEventFired = false;
      let offlineEventFired = false;
      
      const onlineHandler = () => { onlineEventFired = true; };
      const offlineHandler = () => { offlineEventFired = true; };
      
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      // Simulate events (in real scenario these would fire automatically)
      this.results.addResult('networkDetection', true,
        'Online/offline event listeners can be registered');
      
      // Cleanup
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
      
      // Test connection information (if available)
      if ('connection' in navigator) {
        const connection = navigator.connection;
        this.results.addResult('networkDetection', true,
          `Network connection info available: ${connection.effectiveType || 'unknown'}`);
      } else {
        this.results.addResult('networkDetection', true,
          'Network connection info not available (not critical)');
      }
      
      // Test fetch with timeout for network testing
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('https://httpbin.org/status/200', {
          signal: controller.signal,
          mode: 'no-cors'
        });
        
        clearTimeout(timeoutId);
        this.results.addResult('networkDetection', true, 'Network connectivity test passed');
      } catch (error) {
        this.results.addResult('networkDetection', false, 
          `Network connectivity test failed: ${error.message}`);
      }
      
    } catch (error) {
      this.results.addResult('networkDetection', false, 
        `Network detection validation error: ${error.message}`);
    }
  }

  /**
   * Validate caching strategies
   */
  async validateCaching() {
    console.log('💾 Validating Caching Strategies...');
    
    try {
      // Test cache creation and storage
      const testCacheName = 'pwa-auth-test-cache';
      const testCache = await caches.open(testCacheName);
      
      this.results.addResult('caching', !!testCache, 'Cache creation works');
      
      // Test cache storage and retrieval
      const testRequest = new Request('/test-auth-endpoint');
      const testResponse = new Response(JSON.stringify({ test: 'auth-data' }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      await testCache.put(testRequest, testResponse.clone());
      const cachedResponse = await testCache.match(testRequest);
      
      this.results.addResult('caching', !!cachedResponse, 
        'Cache storage and retrieval works');
      
      // Test cached response content
      if (cachedResponse) {
        const cachedData = await cachedResponse.json();
        this.results.addResult('caching', cachedData.test === 'auth-data',
          'Cached response content is correct');
      }
      
      // Test cache deletion
      await caches.delete(testCacheName);
      const deletedCache = await caches.open(testCacheName);
      const shouldBeEmpty = await deletedCache.match(testRequest);
      
      this.results.addResult('caching', !shouldBeEmpty, 'Cache deletion works');
      
      // Cleanup
      await caches.delete(testCacheName);
      
      // Test existing app caches
      const cacheNames = await caches.keys();
      const hasAppCaches = cacheNames.some(name => 
        name.includes('sales-') || name.includes('taxi-')
      );
      
      this.results.addResult('caching', hasAppCaches,
        hasAppCaches ? 'Application caches exist' : 'No application caches found');
      
      // Test cache size limits (basic test)
      try {
        const limitTestCache = await caches.open('limit-test-cache');
        const largeResponse = new Response('x'.repeat(100000)); // 100KB
        
        await limitTestCache.put(new Request('/large-test'), largeResponse);
        const retrievedLarge = await limitTestCache.match('/large-test');
        
        this.results.addResult('caching', !!retrievedLarge, 'Large response caching works');
        
        await caches.delete('limit-test-cache');
      } catch (error) {
        this.results.addResult('caching', false, `Large response caching failed: ${error.message}`);
      }
      
    } catch (error) {
      this.results.addResult('caching', false, `Caching validation error: ${error.message}`);
    }
  }

  /**
   * Save validation report to file
   */
  async saveReport(report) {
    try {
      // Save to localStorage for persistence
      localStorage.setItem('pwa_auth_validation_report', JSON.stringify({
        report,
        timestamp: new Date().toISOString(),
        results: this.results.results
      }));
      
      console.log('📄 Validation report saved to localStorage');
      
      // Also try to save as downloadable file
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: `pwa-auth-validation-${Date.now()}.md`,
            types: [{
              description: 'Markdown files',
              accept: { 'text/markdown': ['.md'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(report);
          await writable.close();
          
          console.log('📄 Validation report saved as file');
        } catch (error) {
          console.log('📄 File save cancelled or failed:', error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to save report:', error);
    }
  }
}

/**
 * Run PWA validation when script is loaded
 */
async function runPWAValidation() {
  const validator = new PWAAuthValidator();
  const passed = await validator.runValidation();
  
  if (passed) {
    console.log('🎉 PWA Authentication validation PASSED!');
  } else {
    console.log('⚠️ PWA Authentication validation FAILED. Check the report for details.');
  }
  
  return passed;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PWAAuthValidator, runPWAValidation };
}

// Auto-run if loaded directly
if (typeof window !== 'undefined' && window.location) {
  // Run validation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runPWAValidation);
  } else {
    runPWAValidation();
  }
}