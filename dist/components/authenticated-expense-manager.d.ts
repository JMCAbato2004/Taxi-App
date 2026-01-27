import { User, UserRole, AuthError } from '../types';
import { ServiceExpenseIntegrationService, AuthenticatedExpenseData } from '../services/service-expense-integration';
/**
 * Configuration for authenticated expense manager
 */
export interface AuthenticatedExpenseManagerConfig {
    theme: any;
    integrationService: ServiceExpenseIntegrationService;
    storageManager: any;
    onError?: (error: AuthError) => void;
    onSuccess?: (message: string) => void;
}
/**
 * Props for the authenticated expense manager component
 */
export interface AuthenticatedExpenseManagerProps {
    config: AuthenticatedExpenseManagerConfig;
    className?: string;
}
/**
 * Authenticated Expense Manager that wraps existing ExpenseManager with authentication
 */
export declare class AuthenticatedExpenseManager {
    private config;
    private expenses;
    private operationContext;
    private wrappedStorage;
    constructor(config: AuthenticatedExpenseManagerConfig);
    /**
     * Initialize storage with authentication wrapper
     */
    private initializeStorage;
    /**
     * Load operation context for current user
     */
    private loadOperationContext;
    /**
     * Load expenses with authentication context
     */
    loadExpenses(): Promise<AuthenticatedExpenseData[]>;
    /**
     * Add a new expense with authentication
     */
    addExpense(expenseData: any): Promise<boolean>;
    /**
     * Update an existing expense with authentication
     */
    updateExpense(expenseId: string, updates: any): Promise<boolean>;
    /**
     * Delete an expense with authentication
     */
    deleteExpense(expenseId: string): Promise<boolean>;
    /**
     * Get current expenses
     */
    getExpenses(): AuthenticatedExpenseData[];
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
    canPerformOperation(operation: 'create' | 'edit' | 'delete', expenseId?: string): boolean;
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
     * Create props for existing ExpenseManager component
     */
    createExpenseManagerProps(): any;
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
 * Factory function to create authenticated expense manager
 */
export declare function createAuthenticatedExpenseManager(config: AuthenticatedExpenseManagerConfig): AuthenticatedExpenseManager;
/**
 * Hook-like function for React integration
 */
export declare function useAuthenticatedExpenseManager(config: AuthenticatedExpenseManagerConfig): {
    manager: AuthenticatedExpenseManager;
    expenses: AuthenticatedExpenseData[];
    loading: boolean;
    error: AuthError | null;
    reload: () => Promise<void>;
};
//# sourceMappingURL=authenticated-expense-manager.d.ts.map