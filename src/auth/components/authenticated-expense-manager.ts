// Authenticated Expense Manager Component
// Bridges existing ExpenseManager with authentication system
// Requirements: 5.3, 5.5

import { 
  User, 
  UserRole, 
  Permission,
  AuthError,
  AuthErrorCode
} from '../types';
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
export class AuthenticatedExpenseManager {
  private expenses: AuthenticatedExpenseData[] = [];
  private operationContext: any = null;
  private wrappedStorage: any = null;

  constructor(private config: AuthenticatedExpenseManagerConfig) {
    this.initializeStorage();
    this.loadOperationContext();
  }

  /**
   * Initialize storage with authentication wrapper
   */
  private initializeStorage(): void {
    try {
      this.wrappedStorage = this.config.integrationService.wrapStorageOperations(
        this.config.storageManager
      );
    } catch (error) {
      this.handleError(error as AuthError);
    }
  }

  /**
   * Load operation context for current user
   */
  private loadOperationContext(): void {
    try {
      this.operationContext = this.config.integrationService.getOperationContext();
    } catch (error) {
      this.handleError(error as AuthError);
    }
  }

  /**
   * Load expenses with authentication context
   */
  async loadExpenses(): Promise<AuthenticatedExpenseData[]> {
    try {
      if (!this.wrappedStorage) {
        throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Storage no inicializado');
      }

      this.expenses = this.wrappedStorage.getExpensesWithAuth();
      return this.expenses;
    } catch (error) {
      this.handleError(error as AuthError);
      return [];
    }
  }

  /**
   * Add a new expense with authentication
   */
  async addExpense(expenseData: any): Promise<boolean> {
    try {
      if (!this.operationContext?.canCreateExpenses) {
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'Sin permisos para crear gastos'
        );
      }

      await this.wrappedStorage.saveExpenseWithAuth(expenseData);
      await this.loadExpenses(); // Reload expenses
      
      this.handleSuccess('Gasto creado correctamente');
      return true;
    } catch (error) {
      this.handleError(error as AuthError);
      return false;
    }
  }

  /**
   * Update an existing expense with authentication
   */
  async updateExpense(expenseId: string, updates: any): Promise<boolean> {
    try {
      const existingExpense = this.expenses.find(e => e.id === expenseId);
      if (!existingExpense?.canEdit) {
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'Sin permisos para modificar este gasto'
        );
      }

      await this.wrappedStorage.updateExpenseWithAuth(expenseId, updates);
      await this.loadExpenses(); // Reload expenses
      
      this.handleSuccess('Gasto actualizado correctamente');
      return true;
    } catch (error) {
      this.handleError(error as AuthError);
      return false;
    }
  }

  /**
   * Delete an expense with authentication
   */
  async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      const existingExpense = this.expenses.find(e => e.id === expenseId);
      if (!existingExpense?.canDelete) {
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'Sin permisos para eliminar este gasto'
        );
      }

      await this.wrappedStorage.deleteExpenseWithAuth(expenseId);
      await this.loadExpenses(); // Reload expenses
      
      this.handleSuccess('Gasto eliminado correctamente');
      return true;
    } catch (error) {
      this.handleError(error as AuthError);
      return false;
    }
  }

  /**
   * Get current expenses
   */
  getExpenses(): AuthenticatedExpenseData[] {
    return this.expenses;
  }

  /**
   * Get operation context
   */
  getOperationContext(): any {
    return this.operationContext;
  }

  /**
   * Get aggregated statistics (for patrones)
   */
  getAggregatedStats(): any {
    try {
      if (!this.operationContext?.canViewAggregatedData) {
        return null;
      }

      return this.wrappedStorage.getAggregatedStats()?.expenses;
    } catch (error) {
      this.handleError(error as AuthError);
      return null;
    }
  }

  /**
   * Check if user can perform specific operations
   */
  canPerformOperation(operation: 'create' | 'edit' | 'delete', expenseId?: string): boolean {
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
  getUserContext(): {
    user: User | null;
    role: UserRole | null;
    canViewAggregated: boolean;
    associatedUsers: User[];
  } {
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
  createExpenseManagerProps(): any {
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
      onAdd: (expenseData: any) => this.addExpense(expenseData),
      onUpdate: (expenseId: string, updates: any) => this.updateExpense(expenseId, updates),
      onDelete: (expenseId: string) => this.deleteExpense(expenseId),
      // Additional context for UI
      userContext: this.getUserContext(),
      aggregatedStats: this.getAggregatedStats(),
      canCreate: this.canPerformOperation('create')
    };
  }

  /**
   * Handle errors
   */
  private handleError(error: AuthError): void {
    console.error('AuthenticatedExpenseManager Error:', error);
    if (this.config.onError) {
      this.config.onError(error);
    }
  }

  /**
   * Handle success messages
   */
  private handleSuccess(message: string): void {
    if (this.config.onSuccess) {
      this.config.onSuccess(message);
    }
  }
}

/**
 * Factory function to create authenticated expense manager
 */
export function createAuthenticatedExpenseManager(
  config: AuthenticatedExpenseManagerConfig
): AuthenticatedExpenseManager {
  return new AuthenticatedExpenseManager(config);
}

/**
 * Hook-like function for React integration
 */
export function useAuthenticatedExpenseManager(
  config: AuthenticatedExpenseManagerConfig
): {
  manager: AuthenticatedExpenseManager;
  expenses: AuthenticatedExpenseData[];
  loading: boolean;
  error: AuthError | null;
  reload: () => Promise<void>;
} {
  const manager = new AuthenticatedExpenseManager(config);
  let expenses: AuthenticatedExpenseData[] = [];
  let loading = true;
  let error: AuthError | null = null;

  const reload = async () => {
    loading = true;
    error = null;
    try {
      expenses = await manager.loadExpenses();
    } catch (err) {
      error = err as AuthError;
    } finally {
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