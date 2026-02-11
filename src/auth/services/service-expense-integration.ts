// Service and Expense Integration Service with Authentication
// Integrates existing service and expense management with role-based authentication
// Requirements: 5.3, 5.5

import { 
  User, 
  UserRole, 
  Permission,
  AuthError,
  AuthErrorCode
} from '../types';
import { RoleService } from './role-service';
import { 
  ReconciliationIntegrationService,
  ServiceData,
  ExpenseData,
  ReconciliationDataItem
} from './reconciliation-integration';

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
export class ServiceExpenseIntegrationService {
  constructor(
    private roleService: RoleService,
    private reconciliationService: ReconciliationIntegrationService,
    private getCurrentUser: () => User | null
  ) {}

  /**
   * Create a new service with automatic user association
   * Requirements: 5.3 - Associate operations with correct user
   */
  async createService(serviceData: Partial<ServiceData>): Promise<AuthenticatedServiceData> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Validate user has permission to create services
    if (!this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para crear servicios'
      );
    }

    // Use reconciliation service to add user context
    const enrichedService = this.reconciliationService.addUserContextToService(serviceData);

    // Add authentication metadata
    const authenticatedService: AuthenticatedServiceData = {
      ...enrichedService,
      createdByUser: currentUser,
      associatedTaxista: currentUser.rol === UserRole.TAXISTA ? currentUser : undefined,
      canEdit: true,
      canDelete: true
    };

    return authenticatedService;
  }

  /**
   * Create a new expense with automatic user association
   * Requirements: 5.3 - Associate operations with correct user
   */
  async createExpense(expenseData: Partial<ExpenseData>): Promise<AuthenticatedExpenseData> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Validate user has permission to create expenses
    if (!this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para crear gastos'
      );
    }

    // Use reconciliation service to add user context
    const enrichedExpense = this.reconciliationService.addUserContextToExpense(expenseData);

    // Add authentication metadata
    const authenticatedExpense: AuthenticatedExpenseData = {
      ...enrichedExpense,
      createdByUser: currentUser,
      associatedTaxista: currentUser.rol === UserRole.TAXISTA ? currentUser : undefined,
      canEdit: true,
      canDelete: true
    };

    return authenticatedExpense;
  }

  /**
   * Get services with role-based filtering and authentication context
   * Requirements: 5.5 - Implement filtering for individual taxistas
   */
  getServicesWithAuth(services: ServiceData[]): AuthenticatedServiceData[] {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Filter services based on role
    const filteredServices = this.reconciliationService.filterServices(services);

    // Add authentication context to each service
    return filteredServices.map(service => this.addAuthContextToService(service));
  }

  /**
   * Get expenses with role-based filtering and authentication context
   * Requirements: 5.5 - Implement filtering for individual taxistas
   */
  getExpensesWithAuth(expenses: ExpenseData[]): AuthenticatedExpenseData[] {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Filter expenses based on role
    const filteredExpenses = this.reconciliationService.filterExpenses(expenses);

    // Add authentication context to each expense
    return filteredExpenses.map(expense => this.addAuthContextToExpense(expense));
  }

  /**
   * Update a service with permission validation
   * Requirements: 5.3, 5.5 - Associate operations with correct user and apply filtering
   */
  async updateService(serviceId: string, updates: Partial<ServiceData>, existingServices: ServiceData[]): Promise<AuthenticatedServiceData> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Find the existing service
    const existingService = existingServices.find(s => s.id === serviceId);
    if (!existingService) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        'Servicio no encontrado'
      );
    }

    // Validate user can modify this service
    if (!this.reconciliationService.canModifyReconciliationData(existingService)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para modificar este servicio'
      );
    }

    // Create updated service data
    const updatedService: ServiceData = {
      ...existingService,
      ...updates,
      // Preserve original user context
      userId: existingService.userId || '',
      createdBy: existingService.createdBy || '',
      taxistaId: existingService.taxistaId || '',
      numeroTaxista: existingService.numeroTaxista || ''
    };

    return this.addAuthContextToService(updatedService);
  }

  /**
   * Update an expense with permission validation
   * Requirements: 5.3, 5.5 - Associate operations with correct user and apply filtering
   */
  async updateExpense(expenseId: string, updates: Partial<ExpenseData>, existingExpenses: ExpenseData[]): Promise<AuthenticatedExpenseData> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Find the existing expense
    const existingExpense = existingExpenses.find(e => e.id === expenseId);
    if (!existingExpense) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        'Gasto no encontrado'
      );
    }

    // Validate user can modify this expense
    if (!this.reconciliationService.canModifyReconciliationData(existingExpense)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para modificar este gasto'
      );
    }

    // Create updated expense data
    const updatedExpense: ExpenseData = {
      ...existingExpense,
      ...updates,
      // Preserve original user context
      userId: existingExpense.userId || '',
      createdBy: existingExpense.createdBy || '',
      taxistaId: existingExpense.taxistaId || '',
      numeroTaxista: existingExpense.numeroTaxista || ''
    };

    return this.addAuthContextToExpense(updatedExpense);
  }

  /**
   * Delete a service with permission validation
   * Requirements: 5.3, 5.5 - Associate operations with correct user and apply filtering
   */
  async deleteService(serviceId: string, existingServices: ServiceData[]): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Find the existing service
    const existingService = existingServices.find(s => s.id === serviceId);
    if (!existingService) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        'Servicio no encontrado'
      );
    }

    // Validate user can delete this service
    if (!this.reconciliationService.canModifyReconciliationData(existingService)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para eliminar este servicio'
      );
    }
  }

  /**
   * Delete an expense with permission validation
   * Requirements: 5.3, 5.5 - Associate operations with correct user and apply filtering
   */
  async deleteExpense(expenseId: string, existingExpenses: ExpenseData[]): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Find the existing expense
    const existingExpense = existingExpenses.find(e => e.id === expenseId);
    if (!existingExpense) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        'Gasto no encontrado'
      );
    }

    // Validate user can delete this expense
    if (!this.reconciliationService.canModifyReconciliationData(existingExpense)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para eliminar este gasto'
      );
    }
  }

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
  } {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return {
        user: null,
        canCreateServices: false,
        canCreateExpenses: false,
        canViewAggregatedData: false,
        associatedUsers: [],
        userRole: null
      };
    }

    return {
      user: currentUser,
      canCreateServices: this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA),
      canCreateExpenses: this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA),
      canViewAggregatedData: this.roleService.hasPermission(Permission.VIEW_ALL_DRIVERS),
      associatedUsers: this.roleService.getAccessibleUsers(),
      userRole: currentUser.rol
    };
  }

  /**
   * Validate operation permissions
   * Requirements: 5.3, 5.5 - Validate user permissions for operations
   */
  validateOperationPermissions(context: ServiceOperationContext): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.id !== context.user.id) {
      return false;
    }

    switch (context.operation) {
      case 'create':
        return this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA);
      
      case 'read':
        if (context.targetData) {
          return this.reconciliationService.canAccessReconciliationData(context.targetData);
        }
        return true;
      
      case 'update':
      case 'delete':
        if (context.targetData) {
          return this.reconciliationService.canModifyReconciliationData(context.targetData);
        }
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Get aggregated statistics for patrones
   * Requirements: 5.5 - Provide aggregated data for patrones
   */
  getAggregatedStats(services: ServiceData[], expenses: ExpenseData[]): {
    services: any;
    expenses: any;
  } | null {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.rol !== UserRole.PATRON) {
      return null;
    }

    return {
      services: this.reconciliationService.getAggregatedSummary(services, 'totalAmount'),
      expenses: this.reconciliationService.getAggregatedSummary(expenses, 'amount')
    };
  }

  /**
   * Wrap existing storage operations with authentication
   * Requirements: 5.3, 5.5 - Integrate with existing storage while applying authentication
   */
  wrapStorageOperations(storageManager: any): any {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Use reconciliation service wrapper as base
    const wrappedStorage = this.reconciliationService.wrapStorageOperations(storageManager);

    return {
      ...wrappedStorage,

      // Enhanced service operations with authentication context
      getServicesWithAuth: () => {
        const services = wrappedStorage.getServices();
        return this.getServicesWithAuth(services);
      },

      getExpensesWithAuth: () => {
        const expenses = wrappedStorage.getExpenses();
        return this.getExpensesWithAuth(expenses);
      },

      // Enhanced save operations
      saveServiceWithAuth: async (serviceData: Partial<ServiceData>) => {
        const authenticatedService = await this.createService(serviceData);
        return wrappedStorage.saveService(authenticatedService);
      },

      saveExpenseWithAuth: async (expenseData: Partial<ExpenseData>) => {
        const authenticatedExpense = await this.createExpense(expenseData);
        return wrappedStorage.saveExpense(authenticatedExpense);
      },

      // Enhanced update operations
      updateServiceWithAuth: async (id: string, updates: Partial<ServiceData>) => {
        const existingServices = wrappedStorage.getServices();
        const authenticatedService = await this.updateService(id, updates, existingServices);
        return wrappedStorage.updateService(id, authenticatedService);
      },

      updateExpenseWithAuth: async (id: string, updates: Partial<ExpenseData>) => {
        const existingExpenses = wrappedStorage.getExpenses();
        const authenticatedExpense = await this.updateExpense(id, updates, existingExpenses);
        return wrappedStorage.updateExpense(id, authenticatedExpense);
      },

      // Enhanced delete operations
      deleteServiceWithAuth: async (id: string) => {
        const existingServices = wrappedStorage.getServices();
        await this.deleteService(id, existingServices);
        return wrappedStorage.deleteService(id);
      },

      deleteExpenseWithAuth: async (id: string) => {
        const existingExpenses = wrappedStorage.getExpenses();
        await this.deleteExpense(id, existingExpenses);
        return wrappedStorage.deleteExpense(id);
      },

      // Context and stats
      getOperationContext: () => this.getOperationContext(),
      getAggregatedStats: () => {
        const services = wrappedStorage.getServices();
        const expenses = wrappedStorage.getExpenses();
        return this.getAggregatedStats(services, expenses);
      }
    };
  }

  /**
   * Add authentication context to a service
   */
  private addAuthContextToService(service: ServiceData): AuthenticatedServiceData {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return {
        ...service,
        canEdit: false,
        canDelete: false
      };
    }

    // Find associated users
    const associatedUsers = this.roleService.getAccessibleUsers();
    const createdByUser = associatedUsers.find(u => u.id === service.createdBy) || currentUser;
    const associatedTaxista = service.taxistaId ? 
      associatedUsers.find(u => u.id === service.taxistaId) : undefined;

    return {
      ...service,
      createdByUser,
      associatedTaxista,
      canEdit: this.reconciliationService.canModifyReconciliationData(service),
      canDelete: this.reconciliationService.canModifyReconciliationData(service)
    };
  }

  /**
   * Add authentication context to an expense
   */
  private addAuthContextToExpense(expense: ExpenseData): AuthenticatedExpenseData {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return {
        ...expense,
        canEdit: false,
        canDelete: false
      };
    }

    // Find associated users
    const associatedUsers = this.roleService.getAccessibleUsers();
    const createdByUser = associatedUsers.find(u => u.id === expense.createdBy) || currentUser;
    const associatedTaxista = expense.taxistaId ? 
      associatedUsers.find(u => u.id === expense.taxistaId) : undefined;

    return {
      ...expense,
      createdByUser,
      associatedTaxista,
      canEdit: this.reconciliationService.canModifyReconciliationData(expense),
      canDelete: this.reconciliationService.canModifyReconciliationData(expense)
    };
  }
}