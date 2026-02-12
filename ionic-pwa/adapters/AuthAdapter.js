/**
 * AuthAdapter - Integration layer between Ionic UI and existing auth system
 * Connects the Ionic PWA interface to the TypeScript authentication services
 * 
 * Requirements:
 * - 1.3: Authenticate via Authentication_System
 * - 1.6: Create account via Authentication_System and auto-login
 * - 1.8: Store authentication tokens securely using SecureStorageService
 * - 1.9: Load role-specific permissions from RoleService
 * - 1.10: Clear all authentication data on logout
 */
class AuthAdapter {
  constructor() {
    // Will be initialized with actual auth services when integrated
    this.authService = null;
    this.roleService = null;
    this.secureStorageService = window.secureStorageService || null;
    this.currentUser = null;
    this.currentToken = null;
    
    // Storage keys for fallback localStorage (legacy)
    this.STORAGE_KEY_USER = 'taxi_auth_current_user';
    this.STORAGE_KEY_TOKEN = 'taxi_auth_current_token';
    this.STORAGE_KEY_PERMISSIONS = 'taxi_auth_permissions';
    
    // Try to restore session on initialization
    this.restoreSession();
  }

  /**
   * Initialize the adapter with auth services
   * @param {Object} authService - Authentication service instance
   * @param {Object} roleService - Role service instance
   * @param {Object} secureStorageService - Secure storage service instance
   */
  initialize(authService, roleService, secureStorageService) {
    this.authService = authService;
    this.roleService = roleService;
    this.secureStorageService = secureStorageService;
    
    // Restore session from secure storage if services are available
    if (this.secureStorageService) {
      this.restoreSessionFromSecureStorage();
    }
  }
  
  /**
   * Restore session from localStorage (fallback)
   * @private
   */
  async restoreSession() {
    try {
      // Try secure storage first
      if (this.secureStorageService) {
        const authData = await this.secureStorageService.getAuthData();
        if (authData) {
          this.currentUser = authData.user;
          this.currentToken = authData.token;
          console.log('Session restored from secure storage');
          return;
        }
      }
      
      // Fallback to localStorage (legacy)
      const storedUser = localStorage.getItem(this.STORAGE_KEY_USER);
      const storedToken = localStorage.getItem(this.STORAGE_KEY_TOKEN);
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.currentToken = storedToken;
        
        // Migrate to secure storage
        if (this.secureStorageService) {
          const permissions = JSON.parse(localStorage.getItem(this.STORAGE_KEY_PERMISSIONS) || '[]');
          await this.secureStorageService.storeAuthData({
            user: this.currentUser,
            token: this.currentToken,
            permissions: permissions
          });
          
          // Clear old localStorage data
          this.clearLocalStorage();
          console.log('Session migrated to secure storage');
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      // Clear potentially corrupted data
      this.clearLocalStorage();
      if (this.secureStorageService) {
        await this.secureStorageService.clearAuthData();
      }
    }
  }
  
  /**
   * Restore session from SecureStorageService
   * @private
   */
  async restoreSessionFromSecureStorage() {
    try {
      if (!this.secureStorageService) return;
      
      const user = await this.secureStorageService.getUserData();
      const token = await this.secureStorageService.getAuthToken();
      
      if (user && token) {
        this.currentUser = user;
        this.currentToken = token;
      }
    } catch (error) {
      console.error('Error restoring session from secure storage:', error);
    }
  }

  /**
   * Login with credentials
   * Requirements: 1.3, 1.8, 1.9
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} AuthResult with user data
   */
  async login(credentials) {
    try {
      // If authService is available, use it
      if (this.authService) {
        const authResult = await this.authService.login(credentials);
        
        // Store user and token
        this.currentUser = authResult.user;
        this.currentToken = authResult.token;
        
        // Store in secure storage if available
        if (this.secureStorageService) {
          await this.secureStorageService.storeOfflineAuthData(authResult);
        }
        
        // Fallback to localStorage
        this.storeInLocalStorage(authResult.user, authResult.token, authResult.permissions);
        
        return {
          success: true,
          user: authResult.user,
          token: authResult.token,
          permissions: authResult.permissions
        };
      }
      
      // Fallback: Check against registered users in localStorage
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const user = users.find(u => u.email === credentials.email);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verify password using CryptoService
      if (!user.passwordHash || !user.passwordSalt) {
        throw new Error('Cuenta no configurada correctamente. Por favor, contacta al administrador.');
      }

      const isValidPassword = await window.cryptoService.verifyPassword(
        credentials.password,
        user.passwordHash,
        user.passwordSalt
      );

      if (!isValidPassword) {
        throw new Error('Contraseña incorrecta');
      }
      
      // Update last login
      user.lastLogin = new Date().toISOString();
      
      // Remove password fields before storing
      const { passwordHash, passwordSalt, ...userWithoutPassword } = user;
      
      // Update user in storage
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem('taxi_users', JSON.stringify(users));
      }

      this.currentUser = userWithoutPassword;
      this.currentToken = 'token-' + user.id + '-' + Date.now();
      
      // Determine permissions based on role
      const permissions = user.rol === 'PATRON' 
        ? ['VIEW_ALL_DRIVERS', 'VIEW_AGGREGATED_DATA', 'MANAGE_ASSOCIATIONS', 'VIEW_OWN_DATA', 'EDIT_OWN_PROFILE']
        : ['VIEW_OWN_DATA', 'INPUT_OPERATIONAL_DATA', 'EDIT_OWN_PROFILE'];
      
      // Store in secure storage (without password fields)
      await this.storeInSecureStorage(userWithoutPassword, this.currentToken, permissions);
      
      return {
        success: true,
        user: userWithoutPassword,
        token: this.currentToken,
        permissions: permissions
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Error al iniciar sesión: ' + (error.message || 'Credenciales inválidas'));
    }
  }

  /**
   * Register a new user
   * Requirements: 1.6, 1.8, 1.9
   * @param {Object} userData - { nombre, email, telefono, password, rol }
   * @returns {Promise<Object>} User object
   */
  async register(userData) {
    try {
      // If authService is available, use it
      if (this.authService) {
        // Register the user
        const user = await this.authService.register(userData);
        
        // Auto-login after registration
        const loginResult = await this.login({
          email: userData.email,
          password: userData.password
        });
        
        return loginResult.user;
      }
      
      // Validate password strength
      const passwordValidation = window.cryptoService.validatePasswordStrength(userData.password);
      if (!passwordValidation.valid) {
        throw new Error('Contraseña débil: ' + passwordValidation.feedback.join(', '));
      }
      
      // Hash password using CryptoService
      const { hash, salt } = await window.cryptoService.hashPassword(userData.password);
      
      // Fallback: simulate registration for development
      const user = {
        id: 'user-' + Date.now(),
        email: userData.email,
        nombre: userData.nombre,
        telefono: userData.telefono,
        rol: userData.rol,
        numeroTaxista: userData.rol === 'TAXISTA' ? 'T-' + Math.floor(Math.random() * 1000) : null,
        codigoInvitacion: userData.rol === 'PATRON' ? this.generateInvitationCode() : null,
        estado: 'independiente',
        activo: true,
        fechaCreacion: new Date().toISOString(),
        passwordHash: hash,
        passwordSalt: salt
      };

      // Save user to taxi_users
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      
      // Check if email already exists
      if (users.some(u => u.email === userData.email)) {
        throw new Error('El email ya está registrado');
      }
      
      users.push(user);
      localStorage.setItem('taxi_users', JSON.stringify(users));

      // Auto-login after registration
      // Remove password fields before storing in session
      const { passwordHash, passwordSalt, ...userWithoutPassword } = user;
      
      this.currentUser = userWithoutPassword;
      this.currentToken = 'demo-token-' + Date.now();
      
      await this.storeInSecureStorage(userWithoutPassword, this.currentToken, ['VIEW_OWN_DATA']);

      return userWithoutPassword;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Error al registrarse: ' + (error.message || 'Error desconocido'));
    }
  }

  /**
   * Logout current user
   * Requirements: 1.10
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // If authService is available, use it
      if (this.authService) {
        await this.authService.logout();
      }
      
      // Clear secure storage
      if (this.secureStorageService) {
        await this.secureStorageService.clearAuthData();
      }
      
      // Clear local state
      this.currentUser = null;
      this.currentToken = null;
      
      // Clear localStorage (legacy)
      this.clearLocalStorage();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, clear local data
      this.currentUser = null;
      this.currentToken = null;
      this.clearLocalStorage();
      if (this.secureStorageService) {
        await this.secureStorageService.clearAuthData();
      }
      throw new Error('Error al cerrar sesión: ' + (error.message || 'Error desconocido'));
    }
  }

  /**
   * Get current authenticated user (synchronous)
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Fallback to localStorage for sync access
    const stored = localStorage.getItem(this.STORAGE_KEY_USER);
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.clearLocalStorage();
      }
    }

    return null;
  }
  
  /**
   * Get current authenticated user from secure storage (async)
   * @returns {Promise<Object|null>} Current user or null
   */
  async getCurrentUserAsync() {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to load from secure storage
    if (this.secureStorageService) {
      try {
        const user = await this.secureStorageService.getUserData();
        if (user) {
          this.currentUser = user;
          return this.currentUser;
        }
      } catch (error) {
        console.error('Error loading user from secure storage:', error);
      }
    }

    // Fallback to localStorage
    return this.getCurrentUser();
  }

  /**
   * Update current user data
   * @param {Object} updates - Object with fields to update
   * @returns {Promise<Object>} Updated user
   */
  async updateCurrentUser(updates) {
    if (!this.currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    // Merge updates with current user
    this.currentUser = { ...this.currentUser, ...updates };

    // Save to secure storage
    if (this.secureStorageService) {
      await this.secureStorageService.storeUserData(this.currentUser);
    }
    
    // Fallback to localStorage
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));

    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const user = this.getCurrentUser();
    const token = this.currentToken || localStorage.getItem(this.STORAGE_KEY_TOKEN);
    
    return !!(user && token);
  }

  /**
   * Check if user has a specific permission
   * Requirements: 1.9
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasPermission(permission) {
    // If roleService is available, use it
    if (this.roleService) {
      return this.roleService.hasPermission(permission);
    }
    
    // Fallback: check from stored permissions
    const user = this.getCurrentUser();
    if (!user) return false;

    try {
      const storedPermissions = localStorage.getItem(this.STORAGE_KEY_PERMISSIONS);
      if (storedPermissions) {
        const permissions = JSON.parse(storedPermissions);
        return permissions.includes(permission);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }

    // Basic role-based permissions fallback
    if (user.rol === 'PATRON') {
      return true; // Patrons have all permissions
    }

    // Taxistas have limited permissions
    return ['VIEW_OWN_DATA', 'INPUT_OPERATIONAL_DATA', 'EDIT_OWN_PROFILE'].includes(permission);
  }
  
  /**
   * Get all permissions for current user
   * Requirements: 1.9
   * @returns {Array<string>} Array of permission strings
   */
  getPermissions() {
    // If roleService is available, use it
    if (this.roleService) {
      return this.roleService.getPermissions();
    }
    
    // Fallback: get from stored permissions
    try {
      const storedPermissions = localStorage.getItem(this.STORAGE_KEY_PERMISSIONS);
      if (storedPermissions) {
        return JSON.parse(storedPermissions);
      }
    } catch (error) {
      console.error('Error getting permissions:', error);
    }
    
    // Default permissions based on role
    const user = this.getCurrentUser();
    if (!user) return [];
    
    if (user.rol === 'PATRON') {
      return [
        'VIEW_ALL_DRIVERS',
        'VIEW_AGGREGATED_DATA',
        'MANAGE_ASSOCIATIONS',
        'VIEW_OWN_DATA',
        'EDIT_OWN_PROFILE'
      ];
    }
    
    return ['VIEW_OWN_DATA', 'INPUT_OPERATIONAL_DATA', 'EDIT_OWN_PROFILE'];
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(currentPassword, newPassword) {
    try {
      // If authService is available, use it
      if (this.authService) {
        await this.authService.changePassword(currentPassword, newPassword);
        return;
      }
      
      // Get current user
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      
      // Get full user data from storage
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const fullUser = users.find(u => u.id === user.id);
      
      if (!fullUser) {
        throw new Error('Usuario no encontrado');
      }
      
      // Verify current password
      const isValidPassword = await window.cryptoService.verifyPassword(
        currentPassword,
        fullUser.passwordHash,
        fullUser.passwordSalt
      );
      
      if (!isValidPassword) {
        throw new Error('La contraseña actual es incorrecta');
      }
      
      // Validate new password strength
      const passwordValidation = window.cryptoService.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        throw new Error('Contraseña débil: ' + passwordValidation.feedback.join(', '));
      }
      
      // Hash new password
      const { hash, salt } = await window.cryptoService.hashPassword(newPassword);
      
      // Update user in storage
      fullUser.passwordHash = hash;
      fullUser.passwordSalt = salt;
      fullUser.passwordChangedAt = new Date().toISOString();
      
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = fullUser;
        localStorage.setItem('taxi_users', JSON.stringify(users));
      }
      
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   * Requirements: 1.8
   * @returns {Promise<string>} New token
   */
  async refreshToken() {
    try {
      // If authService is available, use it
      if (this.authService) {
        const newToken = await this.authService.refreshToken();
        this.currentToken = newToken;
        
        // Update in secure storage if available
        if (this.secureStorageService) {
          await this.secureStorageService.storeAuthToken(newToken);
        }
        
        // Update in localStorage
        localStorage.setItem(this.STORAGE_KEY_TOKEN, newToken);
        
        return newToken;
      }
      
      // Fallback: generate new token for development
      const newToken = 'refreshed-token-' + Date.now();
      this.currentToken = newToken;
      localStorage.setItem(this.STORAGE_KEY_TOKEN, newToken);
      
      return newToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Error al refrescar el token');
    }
  }
  
  /**
   * Get user role
   * @returns {string|null} User role or null
   */
  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.rol : null;
  }
  
  /**
   * Check if user is a PATRON
   * @returns {boolean}
   */
  isPatron() {
    return this.getUserRole() === 'PATRON';
  }
  
  /**
   * Check if user is a TAXISTA
   * @returns {boolean}
   */
  isTaxista() {
    return this.getUserRole() === 'TAXISTA';
  }
  
  /**
   * Get associated users (for PATRON: taxistas, for TAXISTA: patrones)
   * Requirements: 1.9
   * @returns {Promise<Array>} Array of associated users
   */
  async getAssociatedUsers() {
    try {
      // If roleService is available, use it
      if (this.roleService) {
        return await this.roleService.getAssociatedUsers();
      }
      
      // Fallback: return empty array
      return [];
    } catch (error) {
      console.error('Error getting associated users:', error);
      return [];
    }
  }
  
  /**
   * Generate a unique invitation code for patrons
   * @private
   * @returns {string} 6-character invitation code
   */
  generateInvitationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking characters
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  /**
   * Store user, token, and permissions in secure storage
   * @private
   * @param {Object} user - User object
   * @param {string} token - Auth token
   * @param {Array<string>} permissions - User permissions
   */
  async storeInSecureStorage(user, token, permissions) {
    try {
      if (this.secureStorageService) {
        await this.secureStorageService.storeAuthData({
          user: user,
          token: token,
          permissions: permissions || []
        });
      } else {
        // Fallback to localStorage
        this.storeInLocalStorage(user, token, permissions);
      }
    } catch (error) {
      console.error('Error storing in secure storage:', error);
      // Fallback to localStorage on error
      this.storeInLocalStorage(user, token, permissions);
    }
  }
  
  /**
   * Store user, token, and permissions in localStorage (legacy fallback)
   * @private
   * @param {Object} user - User object
   * @param {string} token - Auth token
   * @param {Array<string>} permissions - User permissions
   */
  storeInLocalStorage(user, token, permissions) {
    try {
      localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(this.STORAGE_KEY_TOKEN, token);
      localStorage.setItem(this.STORAGE_KEY_PERMISSIONS, JSON.stringify(permissions || []));
    } catch (error) {
      console.error('Error storing in localStorage:', error);
    }
  }
  
  /**
   * Clear all auth data from localStorage
   * @private
   */
  clearLocalStorage() {
    try {
      localStorage.removeItem(this.STORAGE_KEY_USER);
      localStorage.removeItem(this.STORAGE_KEY_TOKEN);
      localStorage.removeItem(this.STORAGE_KEY_PERMISSIONS);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
  
  /**
   * Validate if current session is still valid
   * @returns {Promise<boolean>}
   */
  async validateSession() {
    try {
      // Check if we have a user and token
      if (!this.isAuthenticated()) {
        return false;
      }
      
      // If secureStorageService is available, validate offline access
      if (this.secureStorageService) {
        return await this.secureStorageService.validateOfflineAccess();
      }
      
      // Fallback: basic check
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }
  
  /**
   * Get authentication token
   * @returns {string|null} Current token or null
   */
  getToken() {
    if (this.currentToken) {
      return this.currentToken;
    }
    
    // Try to load from storage
    const stored = localStorage.getItem(this.STORAGE_KEY_TOKEN);
    if (stored) {
      this.currentToken = stored;
      return this.currentToken;
    }
    
    return null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthAdapter;
}
