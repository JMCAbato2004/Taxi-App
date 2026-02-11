/**
 * Bridge class that connects authentication with existing service/expense management
 */
export class ServiceExpenseBridge {
    constructor(authService: any, roleService: any, reconciliationService: any, serviceExpenseIntegrationService: any);
    authService: any;
    roleService: any;
    reconciliationService: any;
    integrationService: any;
    currentUser: any;
    operationContext: any;
    /**
     * Initialize the bridge
     */
    initialize(): void;
    /**
     * Create authenticated storage wrapper
     */
    createAuthenticatedStorage(originalStorage: any): any;
    /**
     * Create authenticated service manager props
     */
    createServiceManagerProps(theme: any, originalStorage: any): {
        theme: any;
        services: never[];
        onAdd: () => never;
        onUpdate: () => never;
        onDelete: () => never;
        userContext: null;
        canCreate: boolean;
        aggregatedStats?: never;
    } | {
        theme: any;
        services: any;
        onAdd: (serviceData: any) => Promise<boolean>;
        onUpdate: (serviceId: any, updates: any) => Promise<boolean>;
        onDelete: (serviceId: any) => Promise<boolean>;
        userContext: {
            user: any;
            role: any;
            canViewAggregated: any;
            associatedUsers: any;
        };
        aggregatedStats: any;
        canCreate: any;
    };
    /**
     * Create authenticated expense manager props
     */
    createExpenseManagerProps(theme: any, originalStorage: any): {
        theme: any;
        expenses: never[];
        onAdd: () => never;
        onUpdate: () => never;
        onDelete: () => never;
        userContext: null;
        canCreate: boolean;
        aggregatedStats?: never;
    } | {
        theme: any;
        expenses: any;
        onAdd: (expenseData: any) => Promise<boolean>;
        onUpdate: (expenseId: any, updates: any) => Promise<boolean>;
        onDelete: (expenseId: any) => Promise<boolean>;
        userContext: {
            user: any;
            role: any;
            canViewAggregated: any;
            associatedUsers: any;
        };
        aggregatedStats: any;
        canCreate: any;
    };
    /**
     * Create enhanced service manager component with authentication
     */
    createAuthenticatedServiceManager(theme: any, originalStorage: any): ({ onError, onSuccess }: {
        onError: any;
        onSuccess: any;
    }) => any;
    /**
     * Create enhanced expense manager component with authentication
     */
    createAuthenticatedExpenseManager(theme: any, originalStorage: any): ({ onError, onSuccess }: {
        onError: any;
        onSuccess: any;
    }) => any;
    /**
     * Get user context for UI
     */
    getUserContext(): {
        user: any;
        role: any;
        canViewAggregated: any;
        canCreateServices: any;
        canCreateExpenses: any;
        associatedUsers: any;
    };
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Refresh authentication context
     */
    refreshContext(): void;
}
/**
 * Factory function to create service expense bridge
 */
export function createServiceExpenseBridge(authService: any, roleService: any, reconciliationService: any, serviceExpenseIntegrationService: any): ServiceExpenseBridge;
//# sourceMappingURL=service-expense-bridge.d.ts.map