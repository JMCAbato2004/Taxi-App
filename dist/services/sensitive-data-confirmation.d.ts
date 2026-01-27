/**
 * Sensitive Data Confirmation Service
 * Implements additional confirmation mechanisms for critical data modifications
 * Requirements: 6.4
 */
import { User, AuthError } from '../types';
import { CryptoUtils } from '../utils/crypto-utils';
import { AuthorizationMiddleware } from '../middleware/authorization-middleware';
/**
 * Types of sensitive operations that require confirmation
 */
export declare enum SensitiveOperationType {
    PASSWORD_CHANGE = "password_change",
    EMAIL_CHANGE = "email_change",
    PROFILE_UPDATE = "profile_update",
    ASSOCIATION_CREATE = "association_create",
    ASSOCIATION_REMOVE = "association_remove",
    ACCOUNT_DEACTIVATION = "account_deactivation",
    ROLE_CHANGE = "role_change",
    SENSITIVE_DATA_ACCESS = "sensitive_data_access"
}
/**
 * Confirmation methods available
 */
export declare enum ConfirmationMethod {
    PASSWORD_VERIFICATION = "password_verification",
    EMAIL_VERIFICATION = "email_verification",
    TWO_FACTOR_AUTH = "two_factor_auth",
    SECURITY_QUESTION = "security_question"
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
    data: any;
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
 * Sensitive Data Confirmation Service
 * Handles additional confirmation requirements for critical operations
 */
export declare class SensitiveDataConfirmationService {
    private readonly CONFIRMATION_REQUESTS_KEY;
    private readonly CONFIRMATION_LOG_KEY;
    private cryptoUtils;
    private authorizationMiddleware;
    constructor(cryptoUtils?: CryptoUtils, authorizationMiddleware?: AuthorizationMiddleware);
    /**
     * Initiate confirmation process for a sensitive operation
     */
    initiateConfirmation(user: User, operationType: SensitiveOperationType, operationData: any, customConfig?: Partial<SensitiveOperationConfig>): Promise<ConfirmationRequest>;
    /**
     * Process a confirmation attempt
     */
    processConfirmation(requestId: string, attempt: ConfirmationAttempt, user: User): Promise<ConfirmationResult>;
    /**
     * Execute the confirmed sensitive operation
     */
    executeConfirmedOperation(requestId: string, user: User): Promise<any>;
    /**
     * Get confirmation request status
     */
    getConfirmationStatus(requestId: string, user: User): Promise<{
        exists: boolean;
        completed: boolean;
        expired: boolean;
        remainingMethods: ConfirmationMethod[];
        attemptsRemaining: number;
    }>;
    /**
     * Cancel a confirmation request
     */
    cancelConfirmation(requestId: string, user: User): Promise<void>;
    private validateOperationPermissions;
    private processConfirmationMethod;
    private verifyPassword;
    private verifyEmailCode;
    private verifySecurityQuestion;
    private executeOperation;
    private generateEmailVerificationCode;
    private generateRequestId;
    private storeConfirmationRequest;
    private getConfirmationRequest;
    private removeConfirmationRequest;
    private expireConfirmationRequest;
    private getStoredConfirmationRequests;
    private getStoredUsers;
    private logConfirmationEvent;
    private getStoredConfirmationLogs;
}
/**
 * Singleton instance for global use
 */
export declare const sensitiveDataConfirmationService: SensitiveDataConfirmationService;
//# sourceMappingURL=sensitive-data-confirmation.d.ts.map