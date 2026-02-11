// Authentication Service Interface and Implementation
import { 
  User, 
  LoginCredentials, 
  UserRegistrationData,
  AuthResult, 
  UserRole, 
  AuthErrorCode,
  AuthError,
  IAuthService,
  ROLE_PERMISSIONS
} from '../types';
import { validateUserRegistration, validateLogin } from '../types/validation';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
import { 
  SensitiveDataConfirmationService, 
  SensitiveOperationType,
  ConfirmationRequest 
} from './sensitive-data-confirmation';
import { SecureStorageService } from './secure-storage';

/**
 * Offline authentication data interface
 */
interface OfflineAuthData {
  user: User;
  token: string;
  expiresAt: Date;
  lastSync: Date;
}

export class AuthService implements IAuthService {
  private currentUser: User | null = null;
  private currentToken: string | null = null;
  private readonly STORAGE_KEY = 'taxi_auth_data';
  private readonly OFFLINE_KEY = 'taxi_offline_auth';
  private sensitiveDataService: SensitiveDataConfirmationService;
  private secureStorage: SecureStorageService;

  constructor(
    private jwtUtils: JWTUtils,
    private cryptoUtils: CryptoUtils,
    sensitiveDataService?: SensitiveDataConfirmationService,
    secureStorage?: SecureStorageService
  ) {
    this.sensitiveDataService = sensitiveDataService || new SensitiveDataConfirmationService();
    this.secureStorage = secureStorage || new SecureStorageService(this.cryptoUtils);
    // Load stored auth asynchronously
    this.loadStoredAuth().catch(error => {
      console.error('Error during initial auth load:', error);
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      const validation = validateLogin(credentials);
      if (!validation.isValid) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          validation.errors.map((e: any) => e.message).join(', ')
        );
      }

      // In a real implementation, this would make an API call
      // For now, we'll simulate the authentication process
      const user = await this.authenticateUser(credentials);
      
      if (!user) {
        throw new AuthError(
          AuthErrorCode.INVALID_CREDENTIALS,
          'Credenciales inválidas'
        );
      }

      // Generate tokens
      const token = this.jwtUtils.generateToken(user);
      const refreshToken = this.jwtUtils.generateRefreshToken(user);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const authResult: AuthResult = {
        user,
        token,
        refreshToken,
        expiresAt,
        permissions: ROLE_PERMISSIONS[user.rol]
      };

      // Store authentication data
      this.currentUser = user;
      this.currentToken = token;
      await this.storeAuthData(authResult);

      return authResult;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error durante el inicio de sesión',
        error
      );
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear current session
      this.currentUser = null;
      this.currentToken = null;
      
      // Clear stored data using secure storage
      await this.secureStorage.clearAuthData();
      
      // Also clear legacy storage for backward compatibility
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.OFFLINE_KEY);

      // In a real implementation, invalidate server-side session
      // await this.invalidateServerSession();
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if server logout fails, clear local data
      this.currentUser = null;
      this.currentToken = null;
      await this.secureStorage.clearAuthData();
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.OFFLINE_KEY);
    }
  }

  async register(userData: UserRegistrationData): Promise<User> {
    try {
      // Create validation data with confirmPassword for validation
      const validationData = {
        ...userData,
        confirmPassword: userData.password // For validation purposes
      };
      
      // Validate input
      const validation = validateUserRegistration(validationData);
      if (!validation.isValid) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          validation.errors.map((e: any) => e.message).join(', ')
        );
      }

      // Check for duplicate email (in real implementation, this would be server-side)
      if (await this.emailExists(userData.email)) {
        throw new AuthError(
          AuthErrorCode.DUPLICATE_EMAIL,
          'El email ya está registrado'
        );
      }

      // Hash password
      const hashedPassword = await this.cryptoUtils.hashPassword(userData.password);

      // Create user
      const user = await this.createUser({
        ...userData,
        password: hashedPassword
      });

      return user;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error durante el registro',
        error
      );
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    if (!this.currentUser || !this.currentToken) {
      return false;
    }

    // Check if token is still valid
    try {
      const payload = this.jwtUtils.verifyToken(this.currentToken);
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  async refreshToken(): Promise<string> {
    try {
      // Try to get refresh token from secure storage first
      let refreshToken = await this.secureStorage.getRefreshToken();
      
      // Fallback to legacy storage if not found
      if (!refreshToken) {
        const storedData = this.getStoredAuthData();
        refreshToken = storedData?.refreshToken;
      }
      
      if (!refreshToken) {
        throw new AuthError(
          AuthErrorCode.SESSION_EXPIRED,
          'Sesión expirada'
        );
      }

      // In a real implementation, validate refresh token with server
      const currentUser = this.currentUser || await this.secureStorage.getUserData();
      if (!currentUser) {
        throw new AuthError(
          AuthErrorCode.SESSION_EXPIRED,
          'Usuario no encontrado'
        );
      }

      const newToken = this.jwtUtils.generateToken(currentUser);
      this.currentToken = newToken;

      // Store new token securely
      await this.secureStorage.storeAuthToken(newToken);

      // Update legacy storage for backward compatibility
      const storedData = this.getStoredAuthData();
      if (storedData) {
        const updatedAuthResult: AuthResult = {
          ...storedData,
          token: newToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        this.storeAuthData(updatedAuthResult);
      }

      return newToken;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al renovar token',
        error
      );
    }
  }

  validateOfflineAccess(): boolean {
    // Use secure storage validation
    return this.secureStorage.validateOfflineAccess().then(isValid => isValid).catch(() => false);
  }

  /**
   * Store critical data for offline access
   * Requirements: 6.3 - Cache essential data for offline mode
   */
  async storeCriticalData(key: string, data: any, maxAge?: number): Promise<void> {
    try {
      await this.secureStorage.storeCriticalData(key, data, {
        maxAge: maxAge || 7 * 24 * 60 * 60 * 1000, // 7 days default
        encrypt: true
      });
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        `Error storing critical data: ${key}`,
        error
      );
    }
  }

  /**
   * Retrieve critical data from cache
   */
  async getCriticalData(key: string): Promise<any | null> {
    try {
      return await this.secureStorage.getCriticalData(key);
    } catch (error) {
      console.error(`Error retrieving critical data: ${key}`, error);
      return null;
    }
  }

  /**
   * Get storage statistics for monitoring
   */
  getStorageStats() {
    return this.secureStorage.getStorageStats();
  }

  /**
   * Clean up expired cached data
   */
  async cleanupExpiredData(): Promise<number> {
    try {
      return await this.secureStorage.cleanupExpiredItems();
    } catch (error) {
      console.error('Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Check if user has valid offline session
   * Requirements: 6.3 - Support offline functionality
   */
  async hasValidOfflineSession(): Promise<boolean> {
    try {
      const offlineData = await this.secureStorage.getOfflineAuthData();
      const authToken = await this.secureStorage.getAuthToken();
      
      if (!offlineData || !authToken) {
        return false;
      }

      // Check if token is still valid
      try {
        const payload = this.jwtUtils.verifyToken(authToken);
        return payload.exp > Date.now() / 1000;
      } catch {
        return false;
      }
    } catch (error) {
      console.error('Error checking offline session:', error);
      return false;
    }
  }

  /**
   * Sync offline data when connection is restored
   * Requirements: 6.3 - Handle synchronization when coming back online
   */
  async syncOfflineData(): Promise<void> {
    try {
      const offlineData = await this.secureStorage.getOfflineAuthData();
      
      if (!offlineData) {
        return;
      }

      // In a real implementation, this would sync with the server
      // For now, just update the last sync timestamp
      const updatedOfflineData = {
        ...offlineData,
        lastSync: new Date()
      };

      await this.secureStorage.storeOfflineAuthData({
        user: updatedOfflineData.user,
        token: updatedOfflineData.token,
        refreshToken: updatedOfflineData.refreshToken,
        expiresAt: updatedOfflineData.expiresAt,
        permissions: updatedOfflineData.permissions.map(p => p as any)
      });

    } catch (error) {
      console.error('Error syncing offline data:', error);
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error syncing offline data',
        error
      );
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    try {
      // In a real implementation, verify current password first
      const users = this.getStoredUsers();
      const user = users.find(u => u.id === this.currentUser!.id);
      
      if (!user) {
        throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Usuario no encontrado');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.cryptoUtils.comparePassword(
        currentPassword, 
        user.passwordHash
      );
      
      if (!isCurrentPasswordValid) {
        throw new AuthError(
          AuthErrorCode.INVALID_CREDENTIALS,
          'Contraseña actual incorrecta'
        );
      }

      // Validate new password using validation utilities
      const validation = validateUserRegistration({ 
        email: 'dummy@example.com', 
        password: newPassword, 
        confirmPassword: newPassword,
        nombre: 'dummy',
        rol: UserRole.PATRON
      });
      
      const passwordErrors = validation.errors.filter((e: any) => e.field === 'password');
      if (passwordErrors.length > 0) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          passwordErrors.map((e: any) => e.message).join(', ')
        );
      }

      // Hash new password and update
      const hashedNewPassword = await this.cryptoUtils.hashPassword(newPassword);
      await this.updateUserPassword(this.currentUser.id, hashedNewPassword);
      
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al cambiar contraseña',
        error
      );
    }
  }

  /**
   * Initiate password change with confirmation requirement
   * Requirements: 6.4 - Additional confirmation for sensitive data
   */
  async initiatePasswordChange(
    currentPassword: string, 
    newPassword: string
  ): Promise<ConfirmationRequest> {
    if (!this.currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    try {
      // Pre-validate the current password and new password format
      const users = this.getStoredUsers();
      const user = users.find(u => u.id === this.currentUser!.id);
      
      if (!user) {
        throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Usuario no encontrado');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.cryptoUtils.comparePassword(
        currentPassword, 
        user.passwordHash
      );
      
      if (!isCurrentPasswordValid) {
        throw new AuthError(
          AuthErrorCode.INVALID_CREDENTIALS,
          'Contraseña actual incorrecta'
        );
      }

      // Validate new password format
      const validation = validateUserRegistration({ 
        email: 'dummy@example.com', 
        password: newPassword, 
        confirmPassword: newPassword,
        nombre: 'dummy',
        rol: UserRole.PATRON
      });
      
      const passwordErrors = validation.errors.filter((e: any) => e.field === 'password');
      if (passwordErrors.length > 0) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          passwordErrors.map((e: any) => e.message).join(', ')
        );
      }

      // Initiate confirmation process
      return await this.sensitiveDataService.initiateConfirmation(
        this.currentUser,
        SensitiveOperationType.PASSWORD_CHANGE,
        { currentPassword, newPassword }
      );
      
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al iniciar cambio de contraseña',
        error
      );
    }
  }

  /**
   * Initiate email change with confirmation requirement
   * Requirements: 6.4 - Additional confirmation for sensitive data
   */
  async initiateEmailChange(newEmail: string): Promise<ConfirmationRequest> {
    if (!this.currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    try {
      // Validate new email format
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          'Formato de email inválido'
        );
      }

      // Check if email is already in use
      if (await this.emailExists(newEmail)) {
        throw new AuthError(
          AuthErrorCode.DUPLICATE_EMAIL,
          'El email ya está en uso'
        );
      }

      // Initiate confirmation process
      return await this.sensitiveDataService.initiateConfirmation(
        this.currentUser,
        SensitiveOperationType.EMAIL_CHANGE,
        { newEmail, currentEmail: this.currentUser.email }
      );
      
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al iniciar cambio de email',
        error
      );
    }
  }

  /**
   * Initiate profile update with confirmation requirement
   * Requirements: 6.4 - Additional confirmation for sensitive data
   */
  async initiateProfileUpdate(updateData: UserUpdateData): Promise<ConfirmationRequest> {
    if (!this.currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    try {
      // Validate update data
      if (updateData.email && updateData.email !== this.currentUser.email) {
        // Email changes require separate confirmation
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          'Use initiateEmailChange para cambiar el email'
        );
      }

      // Check if this is a sensitive update (phone number, name changes)
      const isSensitiveUpdate = !!(updateData.telefono || updateData.nombre);
      
      if (!isSensitiveUpdate) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          'No hay cambios sensibles que requieran confirmación'
        );
      }

      // Initiate confirmation process
      return await this.sensitiveDataService.initiateConfirmation(
        this.currentUser,
        SensitiveOperationType.PROFILE_UPDATE,
        { updateData, currentData: { 
          nombre: this.currentUser.nombre, 
          telefono: this.currentUser.telefono 
        }}
      );
      
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al iniciar actualización de perfil',
        error
      );
    }
  }

  /**
   * Execute confirmed password change
   * Requirements: 6.4 - Additional confirmation for sensitive data
   */
  async executeConfirmedPasswordChange(confirmationRequestId: string): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    try {
      // Execute the confirmed operation
      const result = await this.sensitiveDataService.executeConfirmedOperation(
        confirmationRequestId,
        this.currentUser
      );

      if (result.operationType === SensitiveOperationType.PASSWORD_CHANGE) {
        const { newPassword } = result.operationData;
        const hashedNewPassword = await this.cryptoUtils.hashPassword(newPassword);
        await this.updateUserPassword(this.currentUser.id, hashedNewPassword);
      }
      
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al ejecutar cambio de contraseña confirmado',
        error
      );
    }
  }

  /**
   * Execute confirmed email change
   * Requirements: 6.4 - Additional confirmation for sensitive data
   */
  async executeConfirmedEmailChange(confirmationRequestId: string): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    try {
      // Execute the confirmed operation
      const result = await this.sensitiveDataService.executeConfirmedOperation(
        confirmationRequestId,
        this.currentUser
      );

      if (result.operationType === SensitiveOperationType.EMAIL_CHANGE) {
        const { newEmail } = result.operationData;
        await this.updateUserEmail(this.currentUser.id, newEmail);
        
        // Update current user object
        this.currentUser = { ...this.currentUser, email: newEmail };
      }
      
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al ejecutar cambio de email confirmado',
        error
      );
    }
  }

  /**
   * Execute confirmed profile update
   * Requirements: 6.4 - Additional confirmation for sensitive data
   */
  async executeConfirmedProfileUpdate(confirmationRequestId: string): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    try {
      // Execute the confirmed operation
      const result = await this.sensitiveDataService.executeConfirmedOperation(
        confirmationRequestId,
        this.currentUser
      );

      if (result.operationType === SensitiveOperationType.PROFILE_UPDATE) {
        const { updateData } = result.operationData;
        await this.updateUserProfile(this.currentUser.id, updateData);
        
        // Update current user object
        this.currentUser = { 
          ...this.currentUser, 
          ...updateData,
          fechaActualizacion: new Date()
        };
      }
      
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al ejecutar actualización de perfil confirmada',
        error
      );
    }
  }

  // Private helper methods
  private async loadStoredAuth(): Promise<void> {
    try {
      // Try to load from secure storage first
      const secureUser = await this.secureStorage.getUserData();
      const secureToken = await this.secureStorage.getAuthToken();
      
      if (secureUser && secureToken) {
        this.currentUser = secureUser;
        this.currentToken = secureToken;
        return;
      }

      // Fallback to legacy storage
      const storedData = this.getStoredAuthData();
      if (storedData && new Date(storedData.expiresAt) > new Date()) {
        this.currentUser = storedData.user;
        this.currentToken = storedData.token;
        
        // Migrate to secure storage
        await this.secureStorage.storeOfflineAuthData(storedData);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      // Clear potentially corrupted data
      await this.secureStorage.clearAuthData();
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private async storeAuthData(authResult: AuthResult): Promise<void> {
    try {
      // Store in secure storage
      await this.secureStorage.storeOfflineAuthData(authResult);
      
      // Also maintain legacy storage for backward compatibility
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authResult));
      
      // Store offline data in legacy format
      const offlineData: OfflineAuthData = {
        user: authResult.user,
        token: authResult.token,
        expiresAt: authResult.expiresAt,
        lastSync: new Date()
      };
      localStorage.setItem(this.OFFLINE_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error storing auth data:', error);
      // Fallback to legacy storage only
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authResult));
      } catch (fallbackError) {
        console.error('Error with fallback storage:', fallbackError);
      }
    }
  }

  private getStoredAuthData(): AuthResult | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      return {
        ...data,
        expiresAt: new Date(data.expiresAt),
        user: {
          ...data.user,
          fechaCreacion: new Date(data.user.fechaCreacion),
          fechaActualizacion: new Date(data.user.fechaActualizacion)
        }
      };
    } catch {
      return null;
    }
  }

  private getOfflineAuthData(): OfflineAuthData | null {
    try {
      const stored = localStorage.getItem(this.OFFLINE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      return {
        ...data,
        expiresAt: new Date(data.expiresAt),
        lastSync: new Date(data.lastSync),
        user: {
          ...data.user,
          fechaCreacion: new Date(data.user.fechaCreacion),
          fechaActualizacion: new Date(data.user.fechaActualizacion)
        }
      };
    } catch {
      return null;
    }
  }

  // Simulated backend methods (would be replaced with actual API calls)
  private async authenticateUser(credentials: LoginCredentials): Promise<User | null> {
    // This would be an API call in a real implementation
    // For now, simulate with localStorage-based user storage
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === credentials.email);
    
    if (!user) return null;
    
    // In a real implementation, compare hashed passwords
    const isValidPassword = await this.cryptoUtils.comparePassword(
      credentials.password, 
      user.passwordHash
    );
    
    if (!isValidPassword) return null;
    
    // Remove password hash from returned user
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  private async emailExists(email: string): Promise<boolean> {
    const users = this.getStoredUsers();
    return users.some(u => u.email === email);
  }

  private async createUser(userData: UserRegistrationData & { password: string }): Promise<User> {
    const users = this.getStoredUsers();
    
    // Generate unique ID and taxista number if needed
    const id = this.generateUserId();
    const numeroTaxista = userData.rol === UserRole.TAXISTA 
      ? this.generateTaxistaNumber() 
      : undefined;

    const newUser = {
      id,
      email: userData.email,
      nombre: userData.nombre,
      telefono: userData.telefono,
      rol: userData.rol,
      numeroTaxista,
      activo: true as const,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      passwordHash: userData.password
    };

    users.push(newUser);
    this.storeUsers(users);

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  private async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    const users = this.getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Usuario no encontrado');
    }

    const user = users[userIndex];
    if (user) {
      // Create updated user object
      const updatedUser = {
        ...user,
        passwordHash: hashedPassword,
        fechaActualizacion: new Date()
      };
      users[userIndex] = updatedUser;
      this.storeUsers(users);
    }
  }

  private async updateUserEmail(userId: string, newEmail: string): Promise<void> {
    const users = this.getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Usuario no encontrado');
    }

    const user = users[userIndex];
    if (user) {
      // Create updated user object
      const updatedUser = {
        ...user,
        email: newEmail,
        fechaActualizacion: new Date()
      };
      users[userIndex] = updatedUser;
      this.storeUsers(users);
    }
  }

  private async updateUserProfile(userId: string, updateData: UserUpdateData): Promise<void> {
    const users = this.getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Usuario no encontrado');
    }

    const user = users[userIndex];
    if (user) {
      // Create updated user object
      const updatedUser = {
        ...user,
        ...updateData,
        fechaActualizacion: new Date()
      };
      users[userIndex] = updatedUser;
      this.storeUsers(users);
    }
  }

  private getStoredUsers(): Array<User & { passwordHash: string }> {
    try {
      const stored = localStorage.getItem('taxi_users');
      if (!stored) return [];
      
      const users = JSON.parse(stored);
      return users.map((user: any) => ({
        ...user,
        fechaCreacion: new Date(user.fechaCreacion),
        fechaActualizacion: new Date(user.fechaActualizacion)
      }));
    } catch {
      return [];
    }
  }

  private storeUsers(users: Array<User & { passwordHash: string }>): void {
    try {
      localStorage.setItem('taxi_users', JSON.stringify(users));
    } catch (error) {
      console.error('Error storing users:', error);
    }
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  private generateTaxistaNumber(): string {
    const users = this.getStoredUsers();
    const taxistaNumbers = users
      .filter(u => u.numeroTaxista)
      .map(u => parseInt(u.numeroTaxista!.replace('TX', '')))
      .filter(n => !isNaN(n));
    
    const nextNumber = taxistaNumbers.length > 0 
      ? Math.max(...taxistaNumbers) + 1 
      : 1;
    
    return `TX${nextNumber.toString().padStart(3, '0')}`;
  }
}