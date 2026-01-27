import { User, UserRole, AuthError } from '../types';
import { ServiceExpenseIntegrationService, AuthenticatedServiceData } from '../services/service-expense-integration';
/**
 * Configuration for authenticated service manager
 */
export interface AuthenticatedServiceManagerConfig {
    theme: any;
    integrationService: ServiceExpenseIntegrationService;
    storageManager: any;
    onError?: (error: AuthError) => void;
    onSuccess?: (message: string) => void;
}
/**
 * Props for the authenticated service manager component
 */
export interface AuthenticatedServiceManagerProps {
    config: AuthenticatedServiceManagerConfig;
    className?: string;
}
/**
 * Authenticated Service Manager that wraps existing ServiceManager with authentication
 */
export declare class AuthenticatedServiceManager {
    private config;
    private services;
    private operationContext;
    private wrappedStorage;
    constructor(config: AuthenticatedServiceManagerConfig);
    /**
     * Initialize storage with authentication wrapper
     */
    private initializeStorage;
    /**
     * Load operation context for current user
     */
    private loadOperationContext;
    /**
     * Load services with authentication context
     */
    loadServices(): Promise<AuthenticatedServiceData[]>;
    /**
     * Add a new service with authentication
     */
    addService(serviceData: any): Promise<boolean>;
    /**
     * Update an existing service with authentication
     */
    updateService(serviceId: string, updates: any): Promise<boolean>;
    /**
     * Delete a service with authentication
     */
    deleteService(serviceId: string): Promise<boolean>;
    /**
     * Get current services
     */
    getServices(): AuthenticatedServiceData[];
    /**
     * Get operation context
     */
    getOperationContext(): any;
    /**
     * Get aggregated statistics (for patrones)
     */
    getAggregatedStats(): any;
    /**
     * Check if user can perform specific operations
     */
    canPerformOperation(operation: 'create' | 'edit' | 'delete', serviceId?: string): boolean;
    /**
     * Get user context information
     */
    getUserContext(): {
        user: User | null;
        role: UserRole | null;
        canViewAggregated: boolean;
        associatedUsers: User[];
    };
    /**
     * Create props for existing ServiceManager component
     */
    createServiceManagerProps(): any;
    /**
     * Handle errors
     */
    private handleError;
    /**
     * Handle success messages
     */
    private handleSuccess;
}
/**
 * Factory function to create authenticated service manager
 */
export declare function createAuthenticatedServiceManager(config: AuthenticatedServiceManagerConfig): AuthenticatedServiceManager;
/**
 * Hook-like function for React integration
 */
export declare function useAuthenticatedServiceManager(config: AuthenticatedServiceManagerConfig): {
    manager: AuthenticatedServiceManager;
    services: AuthenticatedServiceData[];
    loading: boolean;
    error: AuthError | null;
    reload: () => Promise<void>;
};
//# sourceMappingURL=authenticated-service-manager.d.ts.map