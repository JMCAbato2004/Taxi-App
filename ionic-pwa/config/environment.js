/**
 * Environment Configuration
 * Centralized environment detection and configuration
 * 
 * Usage:
 * - Set window.PRODUCTION_MODE = true to force production mode
 * - Automatically detects based on hostname and protocol
 */

class EnvironmentConfig {
  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.getConfig();
  }

  /**
   * Detect current environment
   * @returns {string} 'production', 'staging', or 'development'
   */
  detectEnvironment() {
    // Check for manual override
    if (window.PRODUCTION_MODE === true) {
      return 'production';
    }
    
    if (window.STAGING_MODE === true) {
      return 'staging';
    }
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production indicators
    const productionDomains = [
      'github.io',
      'taxi-app.com',
      'taxiapp.com',
      'taxi-app.es',
      'taxiapp.es'
    ];
    
    const isProductionDomain = productionDomains.some(domain => hostname.includes(domain));
    
    // Staging indicators
    const stagingDomains = [
      'staging',
      'test',
      'qa'
    ];
    
    const isStagingDomain = stagingDomains.some(domain => hostname.includes(domain));
    
    // Development indicators
    const isDevelopmentHost = hostname === 'localhost' || 
                              hostname === '127.0.0.1' || 
                              hostname.startsWith('192.168.') ||
                              hostname.startsWith('10.0.');
    
    // Determine environment
    if (isProductionDomain && protocol === 'https:') {
      return 'production';
    }
    
    if (isStagingDomain) {
      return 'staging';
    }
    
    if (isDevelopmentHost) {
      return 'development';
    }
    
    // Default to production if HTTPS and not localhost
    if (protocol === 'https:' && !isDevelopmentHost) {
      return 'production';
    }
    
    return 'development';
  }

  /**
   * Get configuration for current environment
   * @returns {Object} Environment configuration
   */
  getConfig() {
    const baseConfig = {
      appName: 'Taxi App',
      version: '1.0.0'
    };

    const configs = {
      production: {
        ...baseConfig,
        apiUrl: 'https://api.taxi-app.com',
        debug: false,
        showDevTools: false,
        logLevel: 'error',
        enableAnalytics: true,
        enableErrorReporting: true,
        showVerificationCodeInConsole: false,
        enableSecurityLogging: true,
        strictMode: true
      },
      staging: {
        ...baseConfig,
        apiUrl: 'https://staging-api.taxi-app.com',
        debug: true,
        showDevTools: true,
        logLevel: 'warn',
        enableAnalytics: false,
        enableErrorReporting: true,
        showVerificationCodeInConsole: true,
        enableSecurityLogging: true,
        strictMode: true
      },
      development: {
        ...baseConfig,
        apiUrl: 'http://localhost:3000',
        debug: true,
        showDevTools: true,
        logLevel: 'debug',
        enableAnalytics: false,
        enableErrorReporting: false,
        showVerificationCodeInConsole: true,
        enableSecurityLogging: true,
        strictMode: false
      }
    };

    return configs[this.environment] || configs.development;
  }

  /**
   * Check if running in production
   * @returns {boolean} True if production
   */
  isProduction() {
    return this.environment === 'production';
  }

  /**
   * Check if running in staging
   * @returns {boolean} True if staging
   */
  isStaging() {
    return this.environment === 'staging';
  }

  /**
   * Check if running in development
   * @returns {boolean} True if development
   */
  isDevelopment() {
    return this.environment === 'development';
  }

  /**
   * Get environment name
   * @returns {string} Environment name
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @returns {any} Configuration value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Get all configuration
   * @returns {Object} All configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Log environment info
   */
  logInfo() {
    if (this.config.debug) {
      console.log('='.repeat(60));
      console.log('🌍 ENVIRONMENT CONFIGURATION');
      console.log('='.repeat(60));
      console.log(`Environment: ${this.environment}`);
      console.log(`Hostname: ${window.location.hostname}`);
      console.log(`Protocol: ${window.location.protocol}`);
      console.log(`Debug Mode: ${this.config.debug}`);
      console.log(`API URL: ${this.config.apiUrl}`);
      console.log(`Log Level: ${this.config.logLevel}`);
      console.log('='.repeat(60));
    }
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

// Log environment info on load
environmentConfig.logInfo();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.EnvironmentConfig = EnvironmentConfig;
  window.environmentConfig = environmentConfig;
  
  // Expose environment helpers globally
  window.isProduction = () => environmentConfig.isProduction();
  window.isDevelopment = () => environmentConfig.isDevelopment();
  window.isStaging = () => environmentConfig.isStaging();
}

console.log(`Environment: ${environmentConfig.getEnvironment()}`);
