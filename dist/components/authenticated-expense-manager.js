// Authenticated Expense Manager Component
// Bridges existing ExpenseManager with authentication system
// Requirements: 5.3, 5.5
import { AuthError, AuthErrorCode } from '../types';
/**
 * Authenticated Expense Manager that wraps existing ExpenseManager with authentication
 */
export class AuthenticatedExpenseManager {
    constructor(config) {
        this.config = config;
        this.expenses = [];
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
     * Load expenses with authentication context
     */
    async loadExpenses() {
        try {
            if (!this.wrappedStorage) {
                throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Storage no inicializado');
            }
            this.expenses = this.wrappedStorage.getExpensesWithAuth();
            return this.expenses;
        }
        catch (error) {
            this.handleError(error);
            return [];
        }
    }
    /**
     * Add a new expense with authentication
     */
    async addExpense(expenseData) {
        try {
            if (!this.operationContext?.canCreateExpenses) {
                throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para crear gastos');
            }
            await this.wrappedStorage.saveExpenseWithAuth(expenseData);
            await this.loadExpenses(); // Reload expenses
            this.handleSuccess('Gasto creado correctamente');
            return true;
        }
        catch (error) {
            this.handleError(error);
            return false;
        }
    }
    /**
     * Update an existing expense with authentication
     */
    async updateExpense(expenseId, updates) {
        try {
            const existingExpense = this.expenses.find(e => e.id === expenseId);
            if (!existingExpense?.canEdit) {
                throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para modificar este gasto');
            }
            await this.wrappedStorage.updateExpenseWithAuth(expenseId, updates);
            await this.loadExpenses(); // Reload expenses
            this.handleSuccess('Gasto actualizado correctamente');
            return true;
        }
        catch (error) {
            this.handleError(error);
            return false;
        }
    }
    /**
     * Delete an expense with authentication
     */
    async deleteExpense(expenseId) {
        try {
            const existingExpense = this.expenses.find(e => e.id === expenseId);
            if (!existingExpense?.canDelete) {
                throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para eliminar este gasto');
            }
            await this.wrappedStorage.deleteExpenseWithAuth(expenseId);
            await this.loadExpenses(); // Reload expenses
            this.handleSuccess('Gasto eliminado correctamente');
            return true;
        }
        catch (error) {
            this.handleError(error);
            return false;
        }
    }
    /**
     * Get current expenses
     */
    getExpenses() {
        return this.expenses;
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
            return this.wrappedStorage.getAggregatedStats()?.expenses;
        }
        catch (error) {
            this.handleError(error);
            return null;
        }
    }
    /**
     * Check if user can perform specific operations
     */
    canPerformOperation(operation, expenseId) {
        switch (operation) {
            case 'create':
                return this.operationContext?.canCreateExpenses || false;
            case 'edit':
            case 'delete':
                if (expenseId) {
                    const expense = this.expenses.find(e => e.id === expenseId);
                    return operation === 'edit' ? (expense?.canEdit || false) : (expense?.canDelete || false);
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
     * Create props for existing ExpenseManager component
     */
    createExpenseManagerProps() {
        return {
            theme: this.config.theme,
            expenses: this.expenses.map(expense => ({
                ...expense,
                // Add metadata for UI
                _authContext: {
                    canEdit: expense.canEdit,
                    canDelete: expense.canDelete,
                    createdByUser: expense.createdByUser,
                    associatedTaxista: expense.associatedTaxista
                }
            })),
            onAdd: (expenseData) => this.addExpense(expenseData),
            onUpdate: (expenseId, updates) => this.updateExpense(expenseId, updates),
            onDelete: (expenseId) => this.deleteExpense(expenseId),
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
        console.error('AuthenticatedExpenseManager Error:', error);
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
 * Factory function to create authenticated expense manager
 */
export function createAuthenticatedExpenseManager(config) {
    return new AuthenticatedExpenseManager(config);
}
/**
 * Hook-like function for React integration
 */
export function useAuthenticatedExpenseManager(config) {
    const manager = new AuthenticatedExpenseManager(config);
    let expenses = [];
    let loading = true;
    let error = null;
    const reload = async () => {
        loading = true;
        error = null;
        try {
            expenses = await manager.loadExpenses();
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
        expenses,
        loading,
        error,
        reload
    };
}
//# sourceMappingURL=authenticated-expense-manager.js.map