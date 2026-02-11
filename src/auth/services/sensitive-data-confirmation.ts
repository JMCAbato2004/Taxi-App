/**
 * Sensitive Data Confirmation Service
 * Implements additional confirmation mechanisms for critical data modifications
 * Requirements: 6.4
 */

import { 
  User, 
  AuthError, 
  AuthErrorCode,
  UserRole,
  Permission
} from '../types';
import { CryptoUtils } from '../utils/crypto-utils';
import { AuthorizationMiddleware } from '../middleware/authorization-middleware';

/**
 * Types of sensitive operations that require confirmation
 */
export enum SensitiveOperationType {
  PASSWORD_CHANGE = 'password_change',
  EMAIL_CHANGE = 'email_change',
  PROFILE_UPDATE = 'profile_update',
  ASSOCIATION_CREATE = 'association_create',
  ASSOCIATION_REMOVE = 'association_remove',
  ACCOUNT_DEACTIVATION = 'account_deactivation',
  ROLE_CHANGE = 'role_change',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access'
}

/**
 * Confirmation methods available
 */
export enum ConfirmationMethod {
  PASSWORD_VERIFICATION = 'password_verification',
  EMAIL_VERIFICATION = 'email_verification',
  TWO_FACTOR_AUTH = 'two_factor_auth',
  SECURITY_QUESTION = 'security_question'
}

/**
 * Confirmation request data
 */
export interface ConfirmationRequest {
  id: string;
  userId: string;
  operationType: SensitiveOperationType;
  operationData: any;
  requiredMethods: ConfirmationMethod[];
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  completed: boolean;
  completedMethods: ConfirmationMethod[];
}

/**
 * Confirmation attempt data
 */
export interface ConfirmationAttempt {
  method: ConfirmationMethod;
  data: any; // password, verification code, etc.
}

/**
 * Confirmation result
 */
export interface ConfirmationResult {
  success: boolean;
  requestId: string;
  completedMethods: ConfirmationMethod[];
  remainingMethods: ConfirmationMethod[];
  error?: AuthError;
  canProceed: boolean;
}

/**
 * Sensitive operation configuration
 */
export interface SensitiveOperationConfig {
  operationType: SensitiveOperationType;
  requiredMethods: ConfirmationMethod[];
  maxAttempts: number;
  expirationMinutes: number;
  requiresCurrentPassword: boolean;
  requiresAdditionalVerification: boolean;
}

/**
 * Default configurations for sensitive operations
 */
const DEFAULT_OPERATION_CONFIGS: Record<SensitiveOperationType, SensitiveOperationConfig> = {
  [SensitiveOperationType.PASSWORD_CHANGE]: {
    operationType: SensitiveOperationType.PASSWORD_CHANGE,
    requiredMethods: [ConfirmationMethod.PASSWORD_VERIFICATION],
    maxAttempts: 3,
    expirationMinutes: 15,
    requiresCurrentPassword: true,
    requiresAdditionalVerification: false
  },
  [SensitiveOperationType.EMAIL_CHANGE]: {
    operationType: SensitiveOperationType.EMAIL_CHANGE,
    requiredMethods: [ConfirmationMethod.PASSWORD_VERIFICATION, ConfirmationMethod.EMAIL_VERIFICATION],
    maxAttempts: 3,
    expirationMinutes: 30,
    requiresCurrentPassword: true,
    requiresAdditionalVerification: true
  },
  [SensitiveOperationType.PROFILE_UPDATE]: {
    operationType: SensitiveOperationType.PROFILE_UPDATE,
    requiredMethods: [ConfirmationMethod.PASSWORD_VERIFICATION],
    maxAttempts: 3,
    expirationMinutes: 15,
    requiresCurrentPassword: true,
    requiresAdditionalVerification: false
  },
  [SensitiveOperationType.ASSOCIATION_CREATE]: {
    operationType: SensitiveOperationType.ASSOCIATION_CREATE,
    requiredMethods: [ConfirmationMethod.PASSWORD_VERIFICATION],
    maxAttempts: 3,
    expirationMinutes: 10,
    requiresCurrentPassword: true,
    requiresAdditionalVerification: false
  },
  [SensitiveOperationType.ASSOCIATION_REMOVE]: {
    operationType: SensitiveOperationType.ASSOCIATION_REMOVE,
    requiredMethods: [ConfirmationMethod.PASSWORD_VERIFICATION],
    maxAttempts: 3,
    expirationMinutes: 10,
    requiresCurrentPassword: true,
    requiresAdditionalVerification: true
  },
  [SensitiveOperationType.ACCOUNT_DEACTIVATION]: {
    operationType: SensitiveOperationType.ACCOUNT_DEACTIVATION,
    requiredMethods: [ConfirmationMethod.PASSWORD_VERIFICATION, ConfirmationMethod.EMAIL_VERIFICATION],
    maxAttempts: 2,
    expirationMinutes: 30,
    requiresCurrentPassword: true,
    requiresAdditionalVerification: true
  },
  [SensitiveOperationType.ROLE_CHANGE]: {
    operationType: SensitiveOperationType.ROLE_CHANGE,
    requiredMethods: [ConfirmationMethod.PASSWORD_VERIFICATION, ConfirmationMethod.EMAIL_VERIFICATION],
    maxAttempts: 2,
    expirationMinutes: 30,
    requiresCurrentPassword: true,
    requiresAdditionalVerification: true
  },
  [SensitiveOperationType.SENSITIVE_DATA_ACCESS]: {
    operationType: SensitiveOperationType.SENSITIVE_DATA_ACCESS,
    requiredMethods: [ConfirmationMethod.PASSWORD_VERIFICATION],
    maxAttempts: 3,
    expirationMinutes: 5,
    requiresCurrentPassword: true,
    requiresAdditionalVerification: false
  }
};

/**
 * Sensitive Data Confirmation Service
 * Handles additional confirmation requirements for critical operations
 */
export class SensitiveDataConfirmationService {
  private readonly CONFIRMATION_REQUESTS_KEY = 'taxi_confirmation_requests';
  private readonly CONFIRMATION_LOG_KEY = 'taxi_confirmation_log';
  private cryptoUtils: CryptoUtils;
  private authorizationMiddleware: AuthorizationMiddleware;

  constructor(
    cryptoUtils?: CryptoUtils,
    authorizationMiddleware?: AuthorizationMiddleware
  ) {
    this.cryptoUtils = cryptoUtils || new CryptoUtils();
    this.authorizationMiddleware = authorizationMiddleware || new AuthorizationMiddleware();
  }

  /**
   * Initiate confirmation process for a sensitive operation
   */
  async initiateConfirmation(
    user: User,
    operationType: SensitiveOperationType,
    operationData: any,
    customConfig?: Partial<SensitiveOperationConfig>
  ): Promise<ConfirmationRequest> {
    try {
      // Get operation configuration
      const config = {
        ...DEFAULT_OPERATION_CONFIGS[operationType],
        ...customConfig
      };

      // Validate user permissions for the operation
      await this.validateOperationPermissions(user, operationType, operationData);

      // Create confirmation request
      const request: ConfirmationRequest = {
        id: this.generateRequestId(),
        userId: user.id,
        operationType,
        operationData,
        requiredMethods: config.requiredMethods,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + config.expirationMinutes * 60 * 1000),
        attempts: 0,
        maxAttempts: config.maxAttempts,
        completed: false,
        completedMethods: []
      };

      // Store the request
      await this.storeConfirmationRequest(request);

      // Log the initiation
      await this.logConfirmationEvent(user, 'CONFIRMATION_INITIATED', {
        requestId: request.id,
        operationType,
        requiredMethods: config.requiredMethods
      });

      return request;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al iniciar confirmación de datos sensibles',
        error
      );
    }
  }

  /**
   * Process a confirmation attempt
   */
  async processConfirmation(
    requestId: string,
    attempt: ConfirmationAttempt,
    user: User
  ): Promise<ConfirmationResult> {
    try {
      // Get the confirmation request
      const request = await this.getConfirmationRequest(requestId);
      if (!request) {
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Solicitud de confirmación no encontrada'
        );
      }

      // Validate request ownership
      if (request.userId !== user.id) {
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'No autorizado para esta confirmación'
        );
      }

      // Check if request is expired
      if (new Date() > request.expiresAt) {
        await this.expireConfirmationRequest(requestId);
        throw new AuthError(
          AuthErrorCode.SESSION_EXPIRED,
          'Solicitud de confirmación expirada'
        );
      }

      // Check if request is already completed
      if (request.completed) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          'Confirmación ya completada'
        );
      }

      // Check if method is already completed
      if (request.completedMethods.includes(attempt.method)) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          'Método de confirmación ya completado'
        );
      }

      // Check if method is required
      if (!request.requiredMethods.includes(attempt.method)) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          'Método de confirmación no requerido'
        );
      }

      // Check attempt limits
      if (request.attempts >= request.maxAttempts) {
        await this.expireConfirmationRequest(requestId);
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          'Máximo número de intentos excedido'
        );
      }

      // Process the specific confirmation method
      const methodResult = await this.processConfirmationMethod(
        attempt,
        user,
        request
      );

      // Update request
      request.attempts += 1;
      
      if (methodResult.success) {
        request.completedMethods.push(attempt.method);
        
        // Check if all methods are completed
        const allMethodsCompleted = request.requiredMethods.every(method =>
          request.completedMethods.includes(method)
        );
        
        if (allMethodsCompleted) {
          request.completed = true;
        }
      }

      // Store updated request
      await this.storeConfirmationRequest(request);

      // Log the attempt
      await this.logConfirmationEvent(user, 'CONFIRMATION_ATTEMPT', {
        requestId,
        method: attempt.method,
        success: methodResult.success,
        attempts: request.attempts
      });

      const remainingMethods = request.requiredMethods.filter(method =>
        !request.completedMethods.includes(method)
      );

      return {
        success: methodResult.success,
        requestId,
        completedMethods: request.completedMethods,
        remainingMethods,
        canProceed: request.completed,
        error: methodResult.success ? undefined : methodResult.error
      };

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al procesar confirmación',
        error
      );
    }
  }

  /**
   * Execute the confirmed sensitive operation
   */
  async executeConfirmedOperation(
    requestId: string,
    user: User
  ): Promise<any> {
    try {
      const request = await this.getConfirmationRequest(requestId);
      if (!request) {
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Solicitud de confirmación no encontrada'
        );
      }

      // Validate request ownership
      if (request.userId !== user.id) {
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'No autorizado para esta operación'
        );
      }

      // Check if confirmation is completed
      if (!request.completed) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          'Confirmación no completada'
        );
      }

      // Check if request is expired
      if (new Date() > request.expiresAt) {
        await this.expireConfirmationRequest(requestId);
        throw new AuthError(
          AuthErrorCode.SESSION_EXPIRED,
          'Solicitud de confirmación expirada'
        );
      }

      // Execute the operation based on type
      const result = await this.executeOperation(request, user);

      // Clean up the request
      await this.removeConfirmationRequest(requestId);

      // Log successful execution
      await this.logConfirmationEvent(user, 'OPERATION_EXECUTED', {
        requestId,
        operationType: request.operationType,
        success: true
      });

      return result;

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al ejecutar operación confirmada',
        error
      );
    }
  }

  /**
   * Get confirmation request status
   */
  async getConfirmationStatus(requestId: string, user: User): Promise<{
    exists: boolean;
    completed: boolean;
    expired: boolean;
    remainingMethods: ConfirmationMethod[];
    attemptsRemaining: number;
  }> {
    try {
      const request = await this.getConfirmationRequest(requestId);
      
      if (!request) {
        return {
          exists: false,
          completed: false,
          expired: false,
          remainingMethods: [],
          attemptsRemaining: 0
        };
      }

      // Validate ownership
      if (request.userId !== user.id) {
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'No autorizado para ver esta confirmación'
        );
      }

      const expired = new Date() > request.expiresAt;
      const remainingMethods = request.requiredMethods.filter(method =>
        !request.completedMethods.includes(method)
      );

      return {
        exists: true,
        completed: request.completed,
        expired,
        remainingMethods,
        attemptsRemaining: Math.max(0, request.maxAttempts - request.attempts)
      };

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al obtener estado de confirmación',
        error
      );
    }
  }

  /**
   * Cancel a confirmation request
   */
  async cancelConfirmation(requestId: string, user: User): Promise<void> {
    try {
      const request = await this.getConfirmationRequest(requestId);
      if (!request) {
        return; // Already doesn't exist
      }

      // Validate ownership
      if (request.userId !== user.id) {
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'No autorizado para cancelar esta confirmación'
        );
      }

      // Remove the request
      await this.removeConfirmationRequest(requestId);

      // Log cancellation
      await this.logConfirmationEvent(user, 'CONFIRMATION_CANCELLED', {
        requestId,
        operationType: request.operationType
      });

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al cancelar confirmación',
        error
      );
    }
  }

  // Private helper methods

  private async validateOperationPermissions(
    user: User,
    operationType: SensitiveOperationType,
    operationData: any
  ): Promise<void> {
    // Basic permission checks based on operation type
    switch (operationType) {
      case SensitiveOperationType.ASSOCIATION_CREATE:
      case SensitiveOperationType.ASSOCIATION_REMOVE:
        if (user.rol !== UserRole.PATRON) {
          throw new AuthError(
            AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            'Solo los patrones pueden gestionar asociaciones'
          );
        }
        break;
      
      case SensitiveOperationType.ROLE_CHANGE:
        // Role changes might require admin permissions in a real system
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'Cambio de rol no permitido'
        );
      
      default:
        // Most operations are allowed for the user's own data
        break;
    }
  }

  private async processConfirmationMethod(
    attempt: ConfirmationAttempt,
    user: User,
    request: ConfirmationRequest
  ): Promise<{ success: boolean; error?: AuthError }> {
    try {
      switch (attempt.method) {
        case ConfirmationMethod.PASSWORD_VERIFICATION:
          return await this.verifyPassword(attempt.data.password, user);
        
        case ConfirmationMethod.EMAIL_VERIFICATION:
          return await this.verifyEmailCode(attempt.data.code, user, request);
        
        case ConfirmationMethod.SECURITY_QUESTION:
          return await this.verifySecurityQuestion(attempt.data, user);
        
        default:
          return {
            success: false,
            error: new AuthError(
              AuthErrorCode.VALIDATION_ERROR,
              'Método de confirmación no soportado'
            )
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AuthError ? error : new AuthError(
          AuthErrorCode.NETWORK_ERROR,
          'Error al verificar método de confirmación',
          error
        )
      };
    }
  }

  private async verifyPassword(
    password: string,
    user: User
  ): Promise<{ success: boolean; error?: AuthError }> {
    try {
      // Get user's stored password hash
      const users = this.getStoredUsers();
      const storedUser = users.find(u => u.id === user.id);
      
      if (!storedUser) {
        return {
          success: false,
          error: new AuthError(AuthErrorCode.USER_NOT_FOUND, 'Usuario no encontrado')
        };
      }

      const isValid = await this.cryptoUtils.comparePassword(password, storedUser.passwordHash);
      
      if (!isValid) {
        return {
          success: false,
          error: new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Contraseña incorrecta')
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: new AuthError(
          AuthErrorCode.NETWORK_ERROR,
          'Error al verificar contraseña',
          error
        )
      };
    }
  }

  private async verifyEmailCode(
    code: string,
    user: User,
    request: ConfirmationRequest
  ): Promise<{ success: boolean; error?: AuthError }> {
    // In a real implementation, this would verify a code sent to the user's email
    // For now, we'll simulate with a simple check
    const expectedCode = this.generateEmailVerificationCode(user.email, request.id);
    
    if (code === expectedCode) {
      return { success: true };
    }

    return {
      success: false,
      error: new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Código de verificación incorrecto')
    };
  }

  private async verifySecurityQuestion(
    data: { question: string; answer: string },
    user: User
  ): Promise<{ success: boolean; error?: AuthError }> {
    // In a real implementation, this would check stored security questions
    // For now, we'll return success for demonstration
    return { success: true };
  }

  private async executeOperation(request: ConfirmationRequest, user: User): Promise<any> {
    // This would delegate to the appropriate service based on operation type
    // For now, we'll return a success indicator
    return {
      operationType: request.operationType,
      operationData: request.operationData,
      executedAt: new Date(),
      success: true
    };
  }

  private generateEmailVerificationCode(email: string, requestId: string): string {
    // Simple code generation for demonstration
    // In a real implementation, this would be more secure
    const hash = email + requestId + Date.now().toString();
    return hash.slice(-6).toUpperCase();
  }

  private generateRequestId(): string {
    return 'conf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }

  private async storeConfirmationRequest(request: ConfirmationRequest): Promise<void> {
    try {
      const requests = this.getStoredConfirmationRequests();
      const existingIndex = requests.findIndex(r => r.id === request.id);
      
      if (existingIndex >= 0) {
        requests[existingIndex] = request;
      } else {
        requests.push(request);
      }

      localStorage.setItem(this.CONFIRMATION_REQUESTS_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('Error storing confirmation request:', error);
    }
  }

  private async getConfirmationRequest(requestId: string): Promise<ConfirmationRequest | null> {
    try {
      const requests = this.getStoredConfirmationRequests();
      const request = requests.find(r => r.id === requestId);
      
      if (!request) return null;

      return {
        ...request,
        createdAt: new Date(request.createdAt),
        expiresAt: new Date(request.expiresAt)
      };
    } catch (error) {
      console.error('Error getting confirmation request:', error);
      return null;
    }
  }

  private async removeConfirmationRequest(requestId: string): Promise<void> {
    try {
      const requests = this.getStoredConfirmationRequests();
      const filteredRequests = requests.filter(r => r.id !== requestId);
      localStorage.setItem(this.CONFIRMATION_REQUESTS_KEY, JSON.stringify(filteredRequests));
    } catch (error) {
      console.error('Error removing confirmation request:', error);
    }
  }

  private async expireConfirmationRequest(requestId: string): Promise<void> {
    await this.removeConfirmationRequest(requestId);
  }

  private getStoredConfirmationRequests(): ConfirmationRequest[] {
    try {
      const stored = localStorage.getItem(this.CONFIRMATION_REQUESTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
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

  private async logConfirmationEvent(
    user: User,
    eventType: string,
    data: any
  ): Promise<void> {
    try {
      const logEntry = {
        id: this.generateRequestId(),
        userId: user.id,
        userEmail: user.email,
        eventType,
        timestamp: new Date(),
        data
      };

      const logs = this.getStoredConfirmationLogs();
      logs.push(logEntry);

      // Keep only recent logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      localStorage.setItem(this.CONFIRMATION_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging confirmation event:', error);
    }
  }

  private getStoredConfirmationLogs(): any[] {
    try {
      const stored = localStorage.getItem(this.CONFIRMATION_LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Singleton instance for global use
 */
export const sensitiveDataConfirmationService = new SensitiveDataConfirmationService();