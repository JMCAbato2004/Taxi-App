import { User, UserRole } from '../types';
import { RoleService } from './role-service';
import { ReconciliationIntegrationService, ServiceData, ExpenseData } from './reconciliation-integration';
/**
 * Enhanced service data with authentication context
 */
export interface AuthenticatedServiceData extends ServiceData {
    createdByUser?: User;
    associatedTaxista?: User | undefined;
    canEdit?: boolean;
    canDelete?: boolean;
}
/**
 * Enhanced expense data with authentication context
 */
export interface AuthenticatedExpenseData extends ExpenseData {
    createdByUser?: User;
    associatedTaxista?: User | undefined;
    canEdit?: boolean;
    canDelete?: boolean;
}
/**
 * Service operation context for authentication
 */
export interface ServiceOperationContext {
    user: User;
    operation: 'create' | 'read' | 'update' | 'delete';
    targetData?: ServiceData | ExpenseData;
}
/**
 * Integration service for service and expense management with authentication
 */
export declare class ServiceExpenseIntegrationService {
    private roleService;
    private reconciliationService;
    private getCurrentUser;
    constructor(roleService: RoleService, reconciliationService: ReconciliationIntegrationService, getCurrentUser: () => User | null);
    /**
     * Create a new service with automatic user association
     * Requirements: 5.3 - Associate operations with correct user
     */
    createService(serviceData: Partial<ServiceData>): Promise<AuthenticatedServiceData>;
    /**
     * Create a new expense with automatic user association
     * Requirements: 5.3 - Associate operations with correct user
     */
    createExpense(expenseData: Partial<ExpenseData>): Promise<AuthenticatedExpenseData>;
    /**
     * Get services with role-based filtering and authentication context
     * Requirements: 5.5 - Implement filtering for individual taxistas
     */
    getServicesWithAuth(services: ServiceData[]): AuthenticatedServiceData[];
    /**
     * Get expenses with role-based filtering and authentication context
     * Requirements: 5.5 - Implement filtering for individual taxistas
     */
    getExpensesWithAuth(expenses: ExpenseData[]): AuthenticatedExpenseData[];
    /**
     * Update a service with permission validation
     * Requirements: 5.3, 5.5 - Associate operations with correct user and apply filtering
     */
    updateService(serviceId: string, updates: Partial<ServiceData>, existingServices: ServiceData[]): Promise<AuthenticatedServiceData>;
    /**
     * Update an expense with permission validation
     * Requirements: 5.3, 5.5 - Associate operations with correct user and apply filtering
     */
    updateExpense(expenseId: string, updates: Partial<ExpenseData>, existingExpenses: ExpenseData[]): Promise<AuthenticatedExpenseData>;
    /**
     * Delete a service with permission validation
     * Requirements: 5.3, 5.5 - Associate operations with correct user and apply filtering
     */
    deleteService(serviceId: string, existingServices: ServiceData[]): Promise<void>;
    /**
     * Delete an expense with permission validation
     * Requirements: 5.3, 5.5 - Associate operations with correct user and apply filtering
     */
    deleteExpense(expenseId: string, existingExpenses: ExpenseData[]): Promise<void>;
    /**
     * Get user context for service/expense operations
     * Requirements: 5.3, 5.5 - Provide context for user association and filtering
     */
    getOperationContext(): {
        user: User | null;
        canCreateServices: boolean;
        canCreateExpenses: boolean;
        canViewAggregatedData: boolean;
        associatedUsers: User[];
        userRole: UserRole | null;
    };
    /**
     * Validate operation permissions
     * Requirements: 5.3, 5.5 - Validate user permissions for operations
     */
    validateOperationPermissions(context: ServiceOperationContext): boolean;
    /**
     * Get aggregated statistics for patrones
     * Requirements: 5.5 - Provide aggregated data for patrones
     */
    getAggregatedStats(services: ServiceData[], expenses: ExpenseData[]): {
        services: any;
        expenses: any;
    } | null;
    /**
     * Wrap existing storage operations with authentication
     * Requirements: 5.3, 5.5 - Integrate with existing storage while applying authentication
     */
    wrapStorageOperations(storageManager: any): any;
    /**
     * Add authentication context to a service
     */
    private addAuthContextToService;
    /**
     * Add authentication context to an expense
     */
    private addAuthContextToExpense;
}
//# sourceMappingURL=service-expense-integration.d.ts.map