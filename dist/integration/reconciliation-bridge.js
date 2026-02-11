"use strict";
/**
 * Reconciliation Bridge - JavaScript Integration
 * Bridges the TypeScript role-aware reconciliation with existing JavaScript modules
 * Requirements: 5.2, 5.4
 */
/**
 * Role-aware reconciliation bridge for JavaScript integration
 * This provides a JavaScript-compatible interface to the TypeScript role services
 */
class ReconciliationBridge {
    constructor() {
        this.authService = null;
        this.roleService = null;
        this.reconciliationIntegration = null;
        this.initialized = false;
    }
    /**
     * Initialize the bridge with auth services
     * This should be called when the authentication system is available
     */
    async initialize(authService, roleService) {
        try {
            this.authService = authService;
            this.roleService = roleService;
            // Create reconciliation integration service
            this.reconciliationIntegration = new window.ReconciliationIntegrationService(this.roleService, () => this.authService.getCurrentUser());
            this.initialized = true;
            console.log('✓ Reconciliation bridge initialized with role-based authentication');
            return true;
        }
        catch (error) {
            console.error('Error initializing reconciliation bridge:', error);
            return false;
        }
    }
    /**
     * Check if the bridge is initialized and user is authenticated
     */
    isReady() {
        return this.initialized &&
            this.authService &&
            this.authService.isAuthenticated &&
            this.authService.isAuthenticated();
    }
    /**
     * Get current user information
     */
    getCurrentUser() {
        if (!this.isReady())
            return null;
        return this.authService.getCurrentUser();
    }
    /**
     * Get user role
     */
    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.rol : null;
    }
    /**
     * Check if user has specific permission
     */
    hasPermission(permission) {
        if (!this.isReady())
            return false;
        return this.roleService.hasPermission(permission);
    }
    /**
     * Filter services data based on user role
     */
    filterServices(services) {
        if (!this.isReady() || !this.reconciliationIntegration)
            return [];
        try {
            return this.reconciliationIntegration.filterServices(services);
        }
        catch (error) {
            console.error('Error filtering services:', error);
            return [];
        }
    }
    /**
     * Filter expenses data based on user role
     */
    filterExpenses(expenses) {
        if (!this.isReady() || !this.reconciliationIntegration)
            return [];
        try {
            return this.reconciliationIntegration.filterExpenses(expenses);
        }
        catch (error) {
            console.error('Error filtering expenses:', error);
            return [];
        }
    }
    /**
     * Filter reconciliation data based on user role
     */
    filterReconciliations(reconciliations) {
        if (!this.isReady() || !this.reconciliationIntegration)
            return [];
        try {
            return this.reconciliationIntegration.filterReconciliations(reconciliations);
        }
        catch (error) {
            console.error('Error filtering reconciliations:', error);
            return [];
        }
    }
    /**
     * Add user context to service data
     */
    addUserContextToService(serviceData) {
        if (!this.isReady() || !this.reconciliationIntegration) {
            throw new Error('Authentication required');
        }
        return this.reconciliationIntegration.addUserContextToService(serviceData);
    }
    /**
     * Add user context to expense data
     */
    addUserContextToExpense(expenseData) {
        if (!this.isReady() || !this.reconciliationIntegration) {
            throw new Error('Authentication required');
        }
        return this.reconciliationIntegration.addUserContextToExpense(expenseData);
    }
    /**
     * Get aggregated summary for patrones
     */
    getAggregatedSummary(data, aggregationField = 'amount') {
        if (!this.isReady() || !this.reconciliationIntegration)
            return null;
        try {
            return this.reconciliationIntegration.getAggregatedSummary(data, aggregationField);
        }
        catch (error) {
            console.error('Error getting aggregated summary:', error);
            return null;
        }
    }
    /**
     * Get reconciliation context for current user
     */
    getReconciliationContext() {
        if (!this.isReady() || !this.reconciliationIntegration) {
            return {
                userRole: null,
                canViewAggregatedData: false,
                canInputData: false,
                associatedUsers: [],
                permissions: []
            };
        }
        return this.reconciliationIntegration.getReconciliationContext();
    }
    /**
     * Wrap storage manager with role-based operations
     */
    wrapStorageManager(originalStorageManager) {
        if (!this.isReady() || !this.reconciliationIntegration) {
            console.warn('Bridge not ready, returning original storage manager');
            return originalStorageManager;
        }
        try {
            return this.reconciliationIntegration.wrapStorageOperations(originalStorageManager);
        }
        catch (error) {
            console.error('Error wrapping storage manager:', error);
            return originalStorageManager;
        }
    }
    /**
     * Validate if user can access specific data
     */
    canAccessData(data) {
        if (!this.isReady())
            return false;
        try {
            return this.reconciliationIntegration.canAccessReconciliationData(data);
        }
        catch (error) {
            console.error('Error validating data access:', error);
            return false;
        }
    }
    /**
     * Validate if user can modify specific data
     */
    canModifyData(data) {
        if (!this.isReady())
            return false;
        try {
            return this.reconciliationIntegration.canModifyReconciliationData(data);
        }
        catch (error) {
            console.error('Error validating data modification:', error);
            return false;
        }
    }
    /**
     * Get role-specific UI configuration
     */
    getUIConfig() {
        const context = this.getReconciliationContext();
        const user = this.getCurrentUser();
        if (!user) {
            return {
                showAggregatedData: false,
                showAssociatedTaxistas: false,
                canManageAllData: false,
                userDisplayName: 'Usuario no autenticado',
                userIdentifier: '',
                userRole: null,
                permissions: []
            };
        }
        return {
            showAggregatedData: context.canViewAggregatedData,
            showAssociatedTaxistas: user.rol === 'patron',
            canManageAllData: context.canViewAggregatedData,
            userDisplayName: user.nombre,
            userIdentifier: user.rol === 'taxista'
                ? user.numeroTaxista || user.email
                : user.email,
            userRole: user.rol,
            permissions: context.permissions,
            associatedUsers: context.associatedUsers
        };
    }
    /**
     * Get role-specific statistics
     */
    getStatistics(storageManager) {
        if (!this.isReady())
            return null;
        const user = this.getCurrentUser();
        if (!user)
            return null;
        try {
            // Get filtered data
            const services = this.filterServices(storageManager.getServices());
            const expenses = this.filterExpenses(storageManager.getExpenses());
            const reconciliations = this.filterReconciliations(storageManager.getReconciliations());
            const baseStats = {
                totalServices: services.length,
                totalExpenses: expenses.length,
                totalReconciliations: reconciliations.length,
                totalServiceAmount: services.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
                totalExpenseAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
            };
            if (user.rol === 'patron') {
                // Add aggregated statistics for patrones
                const aggregatedServices = this.getAggregatedSummary(storageManager.getServices(), 'totalAmount');
                const aggregatedExpenses = this.getAggregatedSummary(storageManager.getExpenses(), 'amount');
                return {
                    ...baseStats,
                    aggregatedData: {
                        services: aggregatedServices,
                        expenses: aggregatedExpenses
                    },
                    associatedTaxistasCount: aggregatedServices?.associatedTaxistas || 0,
                    associationStats: this.roleService.getAssociationStatistics ?
                        this.roleService.getAssociationStatistics() : null
                };
            }
            // For taxistas, return basic stats
            return {
                ...baseStats,
                taxistaNumber: user.numeroTaxista,
                personalData: true
            };
        }
        catch (error) {
            console.error('Error getting statistics:', error);
            return null;
        }
    }
    /**
     * Get role-specific notifications
     */
    getNotifications(storageManager) {
        const user = this.getCurrentUser();
        if (!user)
            return [];
        const notifications = [];
        try {
            if (user.rol === 'patron') {
                const stats = this.getStatistics(storageManager);
                if (stats?.associatedTaxistasCount === 0) {
                    notifications.push('No tienes taxistas asociados. Asocia taxistas para ver sus datos de reconciliación.');
                }
                else if (stats?.aggregatedData?.services?.totalRecords === 0) {
                    notifications.push('Tus taxistas asociados no han registrado servicios aún.');
                }
            }
            else if (user.rol === 'taxista') {
                const services = this.filterServices(storageManager.getServices());
                if (services.length === 0) {
                    notifications.push('No has registrado servicios aún. Comienza registrando tu primer servicio.');
                }
            }
        }
        catch (error) {
            console.error('Error getting notifications:', error);
        }
        return notifications;
    }
    /**
     * Enhanced reconciliation generation with role context
     */
    generateRoleAwareReconciliation(calculationEngine, services, expenses, selectedPeriod, cashBreakdown, distributionSettings) {
        if (!this.isReady()) {
            throw new Error('Authentication required');
        }
        const user = this.getCurrentUser();
        // Filter data based on user role
        const filteredServices = this.filterServices(services);
        const filteredExpenses = this.filterExpenses(expenses);
        // Validate that user has data to reconcile
        if (filteredServices.length === 0) {
            if (user.rol === 'patron') {
                throw new Error('No hay servicios de taxistas asociados para liquidar en el período seleccionado');
            }
            else {
                throw new Error('No hay servicios para liquidar en el período seleccionado');
            }
        }
        // Generate reconciliation with filtered data
        const reconciliation = calculationEngine.generateReconciliation(filteredServices, filteredExpenses, selectedPeriod, cashBreakdown, distributionSettings);
        // Add role-specific metadata
        const enrichedReconciliation = {
            ...reconciliation,
            userRole: user.rol,
            userId: user.id,
            createdBy: user.id,
            numeroTaxista: user.rol === 'taxista' ? user.numeroTaxista : undefined
        };
        // Add aggregated data for patrones
        if (user.rol === 'patron') {
            const aggregatedData = this.getAggregatedSummary(services, 'totalAmount');
            const associatedUsers = this.getReconciliationContext().associatedUsers;
            enrichedReconciliation.aggregatedData = aggregatedData;
            enrichedReconciliation.associatedTaxistas = associatedUsers
                .filter(u => u.rol === 'taxista')
                .map(u => ({
                id: u.id,
                nombre: u.nombre,
                numeroTaxista: u.numeroTaxista
            }));
        }
        return enrichedReconciliation;
    }
}
/**
 * Enhanced ReconciliationModule that integrates with role-based authentication
 */
function createRoleAwareReconciliationModule(originalReconciliationModule) {
    // Create bridge instance
    const bridge = new ReconciliationBridge();
    // Enhanced module function
    function EnhancedReconciliationModule(props) {
        const { useState, useEffect, createElement: e } = React;
        // Additional state for role-based features
        const [roleContext, setRoleContext] = useState(null);
        const [aggregatedData, setAggregatedData] = useState(null);
        const [roleNotifications, setRoleNotifications] = useState([]);
        const [isRoleAware, setIsRoleAware] = useState(false);
        // Initialize role awareness
        useEffect(() => {
            const initializeRoleAwareness = async () => {
                try {
                    // Check if auth services are available
                    if (window.authServiceInstance && window.roleServiceInstance) {
                        const initialized = await bridge.initialize(window.authServiceInstance, window.roleServiceInstance);
                        if (initialized && bridge.isReady()) {
                            setIsRoleAware(true);
                            setRoleContext(bridge.getReconciliationContext());
                            // Get role-specific notifications
                            const notifications = bridge.getNotifications(props.storageManager || window.ReconciliationStorageManager);
                            setRoleNotifications(notifications);
                            console.log('✓ Reconciliation module enhanced with role awareness');
                        }
                    }
                }
                catch (error) {
                    console.error('Error initializing role awareness:', error);
                }
            };
            initializeRoleAwareness();
        }, []);
        // Update aggregated data for patrones
        useEffect(() => {
            if (isRoleAware && bridge.getUserRole() === 'patron') {
                const stats = bridge.getStatistics(props.storageManager || window.ReconciliationStorageManager);
                setAggregatedData(stats);
            }
        }, [isRoleAware, props.services, props.expenses]);
        // Enhanced props with role-aware storage manager
        const enhancedProps = {
            ...props,
            storageManager: isRoleAware ?
                bridge.wrapStorageManager(props.storageManager || window.ReconciliationStorageManager) :
                (props.storageManager || window.ReconciliationStorageManager),
            // Add role-specific data
            roleContext,
            aggregatedData,
            roleNotifications,
            isRoleAware,
            userRole: bridge.getUserRole(),
            uiConfig: isRoleAware ? bridge.getUIConfig() : null,
            // Enhanced handlers
            onGenerateReconciliation: (calculationEngine, selectedPeriod, cashBreakdown, distributionSettings) => {
                if (isRoleAware) {
                    return bridge.generateRoleAwareReconciliation(calculationEngine, props.services || [], props.expenses || [], selectedPeriod, cashBreakdown, distributionSettings);
                }
                else {
                    // Fallback to original behavior
                    return calculationEngine.generateReconciliation(props.services || [], props.expenses || [], selectedPeriod, cashBreakdown, distributionSettings);
                }
            }
        };
        // Render role-aware notifications if available
        const roleNotificationElements = roleNotifications.length > 0 ?
            e('div', { className: "mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg" }, e('h4', { className: "font-semibold text-blue-800 mb-2" }, '💡 Información de Rol'), roleNotifications.map((notification, index) => e('p', { key: index, className: "text-sm text-blue-700 mb-1" }, notification))) : null;
        // Render aggregated data for patrones
        const aggregatedDataElement = aggregatedData && bridge.getUserRole() === 'patron' ?
            e('div', { className: "mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" }, e('h4', { className: "font-semibold text-green-800 mb-3" }, '📊 Resumen Agregado'), e('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm" }, e('div', { className: "text-center" }, e('div', { className: "font-bold text-lg text-green-700" }, aggregatedData.associatedTaxistasCount), e('div', { className: "text-green-600" }, 'Taxistas')), e('div', { className: "text-center" }, e('div', { className: "font-bold text-lg text-green-700" }, aggregatedData.totalServices), e('div', { className: "text-green-600" }, 'Servicios')), e('div', { className: "text-center" }, e('div', { className: "font-bold text-lg text-green-700" }, `${aggregatedData.totalServiceAmount.toFixed(2)}€`), e('div', { className: "text-green-600" }, 'Ingresos')), e('div', { className: "text-center" }, e('div', { className: "font-bold text-lg text-green-700" }, `${aggregatedData.totalExpenseAmount.toFixed(2)}€`), e('div', { className: "text-green-600" }, 'Gastos')))) : null;
        // Render original module with enhancements
        return e('div', null, roleNotificationElements, aggregatedDataElement, e(originalReconciliationModule, enhancedProps));
    }
    // Expose bridge methods on the enhanced module
    EnhancedReconciliationModule.bridge = bridge;
    EnhancedReconciliationModule.isRoleAware = () => bridge.isReady();
    EnhancedReconciliationModule.getUIConfig = () => bridge.getUIConfig();
    EnhancedReconciliationModule.getStatistics = (storageManager) => bridge.getStatistics(storageManager);
    return EnhancedReconciliationModule;
}
// Export for global use
if (typeof window !== 'undefined') {
    window.ReconciliationBridge = ReconciliationBridge;
    window.createRoleAwareReconciliationModule = createRoleAwareReconciliationModule;
}
// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ReconciliationBridge,
        createRoleAwareReconciliationModule
    };
}
//# sourceMappingURL=reconciliation-bridge.js.map