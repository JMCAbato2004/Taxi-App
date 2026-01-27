// Authenticated Service Manager Component
// Bridges existing ServiceManager with authentication system
// Requirements: 5.3, 5.5
import { AuthError, AuthErrorCode } from '../types';
/**
 * Authenticated Service Manager that wraps existing ServiceManager with authentication
 */
export class AuthenticatedServiceManager {
    constructor(config) {
        this.config = config;
        this.services = [];
        this.operationContext = null;
        this.wrappedStorage = null;
        this.initializeStorage();
        this.loadOperationContext();
    }
    /**
     * Initialize storage with authentication wrapper
     */
    initializeStorage() {
        try {
            this.wrappedStorage = this.config.integrationService.wrapStorageOperations(this.config.storageManager);
        }
        catch (error) {
            this.handleError(error);
        }
    }
    /**
     * Load operation context for current user
     */
    loadOperationContext() {
        try {
            this.operationContext = this.config.integrationService.getOperationContext();
        }
        catch (error) {
            this.handleError(error);
        }
    }
    /**
     * Load services with authentication context
     */
    async loadServices() {
        try {
            if (!this.wrappedStorage) {
                throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Storage no inicializado');
            }
            this.services = this.wrappedStorage.getServicesWithAuth();
            return this.services;
        }
        catch (error) {
            this.handleError(error);
            return [];
        }
    }
    /**
     * Add a new service with authentication
     */
    async addService(serviceData) {
        try {
            if (!this.operationContext?.canCreateServices) {
                throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para crear servicios');
            }
            await this.wrappedStorage.saveServiceWithAuth(serviceData);
            await this.loadServices(); // Reload services
            this.handleSuccess('Servicio creado correctamente');
            return true;
        }
        catch (error) {
            this.handleError(error);
            return false;
        }
    }
    /**
     * Update an existing service with authentication
     */
    async updateService(serviceId, updates) {
        try {
            const existingService = this.services.find(s => s.id === serviceId);
            if (!existingService?.canEdit) {
                throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para modificar este servicio');
            }
            await this.wrappedStorage.updateServiceWithAuth(serviceId, updates);
            await this.loadServices(); // Reload services
            this.handleSuccess('Servicio actualizado correctamente');
            return true;
        }
        catch (error) {
            this.handleError(error);
            return false;
        }
    }
    /**
     * Delete a service with authentication
     */
    async deleteService(serviceId) {
        try {
            const existingService = this.services.find(s => s.id === serviceId);
            if (!existingService?.canDelete) {
                throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para eliminar este servicio');
            }
            await this.wrappedStorage.deleteServiceWithAuth(serviceId);
            await this.loadServices(); // Reload services
            this.handleSuccess('Servicio eliminado correctamente');
            return true;
        }
        catch (error) {
            this.handleError(error);
            return false;
        }
    }
    /**
     * Get current services
     */
    getServices() {
        return this.services;
    }
    /**
     * Get operation context
     */
    getOperationContext() {
        return this.operationContext;
    }
    /**
     * Get aggregated statistics (for patrones)
     */
    getAggregatedStats() {
        try {
            if (!this.operationContext?.canViewAggregatedData) {
                return null;
            }
            return this.wrappedStorage.getAggregatedStats()?.services;
        }
        catch (error) {
            this.handleError(error);
            return null;
        }
    }
    /**
     * Check if user can perform specific operations
     */
    canPerformOperation(operation, serviceId) {
        switch (operation) {
            case 'create':
                return this.operationContext?.canCreateServices || false;
            case 'edit':
            case 'delete':
                if (serviceId) {
                    const service = this.services.find(s => s.id === serviceId);
                    return operation === 'edit' ? (service?.canEdit || false) : (service?.canDelete || false);
                }
                return false;
            default:
                return false;
        }
    }
    /**
     * Get user context information
     */
    getUserContext() {
        return {
            user: this.operationContext?.user || null,
            role: this.operationContext?.userRole || null,
            canViewAggregated: this.operationContext?.canViewAggregatedData || false,
            associatedUsers: this.operationContext?.associatedUsers || []
        };
    }
    /**
     * Create props for existing ServiceManager component
     */
    createServiceManagerProps() {
        return {
            theme: this.config.theme,
            services: this.services.map(service => ({
                ...service,
                // Add metadata for UI
                _authContext: {
                    canEdit: service.canEdit,
                    canDelete: service.canDelete,
                    createdByUser: service.createdByUser,
                    associatedTaxista: service.associatedTaxista
                }
            })),
            onAdd: (serviceData) => this.addService(serviceData),
            onUpdate: (serviceId, updates) => this.updateService(serviceId, updates),
            onDelete: (serviceId) => this.deleteService(serviceId),
            // Additional context for UI
            userContext: this.getUserContext(),
            aggregatedStats: this.getAggregatedStats(),
            canCreate: this.canPerformOperation('create')
        };
    }
    /**
     * Handle errors
     */
    handleError(error) {
        console.error('AuthenticatedServiceManager Error:', error);
        if (this.config.onError) {
            this.config.onError(error);
        }
    }
    /**
     * Handle success messages
     */
    handleSuccess(message) {
        if (this.config.onSuccess) {
            this.config.onSuccess(message);
        }
    }
}
/**
 * Factory function to create authenticated service manager
 */
export function createAuthenticatedServiceManager(config) {
    return new AuthenticatedServiceManager(config);
}
/**
 * Hook-like function for React integration
 */
export function useAuthenticatedServiceManager(config) {
    const manager = new AuthenticatedServiceManager(config);
    let services = [];
    let loading = true;
    let error = null;
    const reload = async () => {
        loading = true;
        error = null;
        try {
            services = await manager.loadServices();
        }
        catch (err) {
            error = err;
        }
        finally {
            loading = false;
        }
    };
    // Initial load
    reload();
    return {
        manager,
        services,
        loading,
        error,
        reload
    };
}
//# sourceMappingURL=authenticated-service-manager.js.map