/**
 * Reconciliation Bridge - JavaScript Integration
 * Bridges the TypeScript role-aware reconciliation with existing JavaScript modules
 * Requirements: 5.2, 5.4
 */
/**
 * Role-aware reconciliation bridge for JavaScript integration
 * This provides a JavaScript-compatible interface to the TypeScript role services
 */
export class ReconciliationBridge {
    authService: any;
    roleService: any;
    reconciliationIntegration: any;
    initialized: boolean;
    /**
     * Initialize the bridge with auth services
     * This should be called when the authentication system is available
     */
    initialize(authService: any, roleService: any): Promise<boolean>;
    /**
     * Check if the bridge is initialized and user is authenticated
     */
    isReady(): any;
    /**
     * Get current user information
     */
    getCurrentUser(): any;
    /**
     * Get user role
     */
    getUserRole(): any;
    /**
     * Check if user has specific permission
     */
    hasPermission(permission: any): any;
    /**
     * Filter services data based on user role
     */
    filterServices(services: any): any;
    /**
     * Filter expenses data based on user role
     */
    filterExpenses(expenses: any): any;
    /**
     * Filter reconciliation data based on user role
     */
    filterReconciliations(reconciliations: any): any;
    /**
     * Add user context to service data
     */
    addUserContextToService(serviceData: any): any;
    /**
     * Add user context to expense data
     */
    addUserContextToExpense(expenseData: any): any;
    /**
     * Get aggregated summary for patrones
     */
    getAggregatedSummary(data: any, aggregationField?: string): any;
    /**
     * Get reconciliation context for current user
     */
    getReconciliationContext(): any;
    /**
     * Wrap storage manager with role-based operations
     */
    wrapStorageManager(originalStorageManager: any): any;
    /**
     * Validate if user can access specific data
     */
    canAccessData(data: any): any;
    /**
     * Validate if user can modify specific data
     */
    canModifyData(data: any): any;
    /**
     * Get role-specific UI configuration
     */
    getUIConfig(): {
        showAggregatedData: boolean;
        showAssociatedTaxistas: boolean;
        canManageAllData: boolean;
        userDisplayName: string;
        userIdentifier: string;
        userRole: null;
        permissions: never[];
        associatedUsers?: never;
    } | {
        showAggregatedData: any;
        showAssociatedTaxistas: boolean;
        canManageAllData: any;
        userDisplayName: any;
        userIdentifier: any;
        userRole: any;
        permissions: any;
        associatedUsers: any;
    };
    /**
     * Get role-specific statistics
     */
    getStatistics(storageManager: any): {
        aggregatedData: {
            services: any;
            expenses: any;
        };
        associatedTaxistasCount: any;
        associationStats: any;
        totalServices: any;
        totalExpenses: any;
        totalReconciliations: any;
        totalServiceAmount: any;
        totalExpenseAmount: any;
    } | {
        taxistaNumber: any;
        personalData: boolean;
        totalServices: any;
        totalExpenses: any;
        totalReconciliations: any;
        totalServiceAmount: any;
        totalExpenseAmount: any;
    } | null;
    /**
     * Get role-specific notifications
     */
    getNotifications(storageManager: any): string[];
    /**
     * Enhanced reconciliation generation with role context
     */
    generateRoleAwareReconciliation(calculationEngine: any, services: any, expenses: any, selectedPeriod: any, cashBreakdown: any, distributionSettings: any): any;
}
/**
 * Enhanced ReconciliationModule that integrates with role-based authentication
 */
export function createRoleAwareReconciliationModule(originalReconciliationModule: any): {
    (props: any): any;
    bridge: ReconciliationBridge;
    isRoleAware(): any;
    getUIConfig(): {
        showAggregatedData: boolean;
        showAssociatedTaxistas: boolean;
        canManageAllData: boolean;
        userDisplayName: string;
        userIdentifier: string;
        userRole: null;
        permissions: never[];
        associatedUsers?: never;
    } | {
        showAggregatedData: any;
        showAssociatedTaxistas: boolean;
        canManageAllData: any;
        userDisplayName: any;
        userIdentifier: any;
        userRole: any;
        permissions: any;
        associatedUsers: any;
    };
    getStatistics(storageManager: any): {
        aggregatedData: {
            services: any;
            expenses: any;
        };
        associatedTaxistasCount: any;
        associationStats: any;
        totalServices: any;
        totalExpenses: any;
        totalReconciliations: any;
        totalServiceAmount: any;
        totalExpenseAmount: any;
    } | {
        taxistaNumber: any;
        personalData: boolean;
        totalServices: any;
        totalExpenses: any;
        totalReconciliations: any;
        totalServiceAmount: any;
        totalExpenseAmount: any;
    } | null;
};
//# sourceMappingURL=reconciliation-bridge.d.ts.map