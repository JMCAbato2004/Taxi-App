// Reconciliation Integration Service with Role-Based Context
// Adapts existing reconciliation functionality to work with authentication system
// Requirements: 5.2, 5.4

import { 
  User, 
  UserRole, 
  Permission,
  AuthError,
  AuthErrorCode
} from '../types';
import { RoleService } from './role-service';

/**
 * Interface for reconciliation data that can be filtered by role
 */
export interface ReconciliationDataItem {
  id: string;
  userId?: string;
  taxistaId?: string;
  createdBy?: string;
  numeroTaxista?: string;
  date: Date;
  amount?: number;
  [key: string]: any;
}

/**
 * Service data structure for reconciliation
 */
export interface ServiceData extends ReconciliationDataItem {
  startTime: string;
  totalAmount: number;
  paymentType: 'cash' | 'card' | 'app';
  platform?: string;
  isArticulated: boolean;
  commission?: number;
  incentives?: number;
  tips?: number;
}

/**
 * Expense data structure for reconciliation
 */
export interface ExpenseData extends ReconciliationDataItem {
  concept: string;
  amount: number;
  category: 'fuel' | 'maintenance' | 'insurance' | 'other';
}

/**
 * Reconciliation data structure
 */
export interface ReconciliationData extends ReconciliationDataItem {
  period: {
    start: Date;
    end: Date;
  };
  services: ServiceData[];
  expenses: ExpenseData[];
  summary: {
    totalServices: number;
    totalAmount: number;
    totalExpenses: number;
    netIncome: number;
  };
  clientName?: string;
  driverRate: number;
  ownerRate: number;
}

/**
 * Aggregated data summary for patrones
 */
export interface AggregatedSummary {
  totalRecords: number;
  totalAmount: number;
  averageAmount: number;
  associatedTaxistas: number;
  byTaxista: {
    [taxistaId: string]: {
      nombre: string;
      numeroTaxista: string;
      totalAmount: number;
      recordCount: number;
    };
  };
}

/**
 * Service for integrating reconciliation functionality with role-based authentication
 */
export class ReconciliationIntegrationService {
  constructor(
    private roleService: RoleService,
    private getCurrentUser: () => User | null
  ) {}

  /**
   * Filter services data based on user role and associations
   * Requirements: 5.2, 5.4 - Apply role-based filtering
   */
  filterServices(services: ServiceData[]): ServiceData[] {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Use RoleService to filter data with reconciliation-specific context
    return this.roleService.filterDataByRole(services, {
      userIdField: 'createdBy',
      dataType: 'services'
    });
  }

  /**
   * Filter expenses data based on user role and associations
   * Requirements: 5.2, 5.4 - Apply role-based filtering
   */
  filterExpenses(expenses: ExpenseData[]): ExpenseData[] {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Use RoleService to filter data with reconciliation-specific context
    return this.roleService.filterDataByRole(expenses, {
      userIdField: 'createdBy',
      dataType: 'expenses'
    });
  }

  /**
   * Filter reconciliation records based on user role and associations
   * Requirements: 5.2, 5.4 - Apply role-based filtering
   */
  filterReconciliations(reconciliations: ReconciliationData[]): ReconciliationData[] {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Use RoleService to filter data with reconciliation-specific context
    return this.roleService.filterDataByRole(reconciliations, {
      userIdField: 'createdBy',
      dataType: 'reconciliations'
    });
  }

  /**
   * Add user context to service data when creating/updating
   * Requirements: 5.3 - Associate operations with correct user
   */
  addUserContextToService(serviceData: Partial<ServiceData>): ServiceData {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Validate user has permission to input operational data
    if (!this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para introducir datos operativos'
      );
    }

    const enrichedService: ServiceData = {
      id: serviceData.id || this.generateId('service'),
      userId: currentUser.id,
      taxistaId: currentUser.rol === UserRole.TAXISTA ? currentUser.id : serviceData.taxistaId,
      createdBy: currentUser.id,
      numeroTaxista: currentUser.rol === UserRole.TAXISTA ? currentUser.numeroTaxista : serviceData.numeroTaxista,
      date: serviceData.date || new Date(),
      startTime: serviceData.startTime || '',
      totalAmount: serviceData.totalAmount || 0,
      paymentType: serviceData.paymentType || 'cash',
      platform: serviceData.platform,
      isArticulated: serviceData.isArticulated || false,
      commission: serviceData.commission,
      incentives: serviceData.incentives,
      tips: serviceData.tips
    };

    return enrichedService;
  }

  /**
   * Add user context to expense data when creating/updating
   * Requirements: 5.3 - Associate operations with correct user
   */
  addUserContextToExpense(expenseData: Partial<ExpenseData>): ExpenseData {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Validate user has permission to input operational data
    if (!this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para introducir datos operativos'
      );
    }

    const enrichedExpense: ExpenseData = {
      id: expenseData.id || this.generateId('expense'),
      userId: currentUser.id,
      taxistaId: currentUser.rol === UserRole.TAXISTA ? currentUser.id : expenseData.taxistaId,
      createdBy: currentUser.id,
      numeroTaxista: currentUser.rol === UserRole.TAXISTA ? currentUser.numeroTaxista : expenseData.numeroTaxista,
      date: expenseData.date || new Date(),
      concept: expenseData.concept || '',
      amount: expenseData.amount || 0,
      category: expenseData.category || 'other'
    };

    return enrichedExpense;
  }

  /**
   * Add user context to reconciliation data when creating/updating
   * Requirements: 5.3 - Associate operations with correct user
   */
  addUserContextToReconciliation(reconciliationData: Partial<ReconciliationData>): ReconciliationData {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Validate user has permission to generate reconciliations
    if (!this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para generar reconciliaciones'
      );
    }

    const enrichedReconciliation: ReconciliationData = {
      id: reconciliationData.id || this.generateId('reconciliation'),
      userId: currentUser.id,
      createdBy: currentUser.id,
      numeroTaxista: currentUser.rol === UserRole.TAXISTA ? currentUser.numeroTaxista : undefined,
      date: new Date(),
      period: reconciliationData.period || {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date()
      },
      services: reconciliationData.services || [],
      expenses: reconciliationData.expenses || [],
      summary: reconciliationData.summary || {
        totalServices: 0,
        totalAmount: 0,
        totalExpenses: 0,
        netIncome: 0
      },
      clientName: reconciliationData.clientName,
      driverRate: reconciliationData.driverRate || 40,
      ownerRate: reconciliationData.ownerRate || 60
    };

    return enrichedReconciliation;
  }

  /**
   * Get aggregated data summary for patrones
   * Requirements: 5.2 - Patrones should see aggregated data from their associated taxistas
   */
  getAggregatedSummary(data: ReconciliationDataItem[], aggregationField: string = 'amount'): AggregatedSummary | null {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.rol !== UserRole.PATRON) {
      return null;
    }

    // Validate user has permission to view aggregated data
    if (!this.roleService.hasPermission(Permission.VIEW_ALL_DRIVERS)) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para ver datos agregados'
      );
    }

    // Filter data to only include associated taxistas
    const filteredData = this.roleService.filterDataByRole(data);
    
    if (filteredData.length === 0) {
      return {
        totalRecords: 0,
        totalAmount: 0,
        averageAmount: 0,
        associatedTaxistas: 0,
        byTaxista: {}
      };
    }

    // Calculate aggregations
    const totalAmount = filteredData.reduce((sum, item: any) => {
      const value = item[aggregationField];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);

    // Group data by taxista
    const byTaxista: { [taxistaId: string]: any } = {};
    const associatedUsers = this.roleService.getAccessibleUsers();

    filteredData.forEach((item: any) => {
      let taxistaId = null;
      if (item.userId && item.userId !== currentUser.id) taxistaId = item.userId;
      else if (item.taxistaId && item.taxistaId !== currentUser.id) taxistaId = item.taxistaId;
      else if (item.createdBy && item.createdBy !== currentUser.id) taxistaId = item.createdBy;
      
      if (taxistaId) {
        const taxista = associatedUsers.find(u => u.id === taxistaId);
        if (taxista && taxista.rol === UserRole.TAXISTA) {
          if (!byTaxista[taxistaId]) {
            byTaxista[taxistaId] = {
              nombre: taxista.nombre,
              numeroTaxista: taxista.numeroTaxista || '',
              totalAmount: 0,
              recordCount: 0
            };
          }
          
          const itemValue = item[aggregationField];
          byTaxista[taxistaId].totalAmount += typeof itemValue === 'number' ? itemValue : 0;
          byTaxista[taxistaId].recordCount += 1;
        }
      }
    });

    return {
      totalRecords: filteredData.length,
      totalAmount,
      averageAmount: filteredData.length > 0 ? totalAmount / filteredData.length : 0,
      associatedTaxistas: Object.keys(byTaxista).length,
      byTaxista
    };
  }

  /**
   * Validate if current user can access specific reconciliation data
   * Requirements: 5.4 - Data filtering should be applied based on user role context
   */
  canAccessReconciliationData(data: ReconciliationDataItem): boolean {
    return this.roleService.validateDataAccess(data, 'read');
  }

  /**
   * Validate if current user can modify specific reconciliation data
   * Requirements: 5.4 - Data filtering should be applied based on user role context
   */
  canModifyReconciliationData(data: ReconciliationDataItem): boolean {
    return this.roleService.validateDataAccess(data, 'write');
  }

  /**
   * Get reconciliation context for current user
   * Returns information about what data the user can see and modify
   */
  getReconciliationContext(): {
    userRole: UserRole | null;
    canViewAggregatedData: boolean;
    canInputData: boolean;
    associatedUsers: User[];
    permissions: Permission[];
  } {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return {
        userRole: null,
        canViewAggregatedData: false,
        canInputData: false,
        associatedUsers: [],
        permissions: []
      };
    }

    return {
      userRole: currentUser.rol,
      canViewAggregatedData: this.roleService.hasPermission(Permission.VIEW_ALL_DRIVERS),
      canInputData: this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA),
      associatedUsers: this.roleService.getAccessibleUsers(),
      permissions: this.roleService.getPermissions()
    };
  }

  /**
   * Apply role-based filtering to existing reconciliation storage operations
   * This method wraps the existing storage operations with role-based context
   */
  wrapStorageOperations(storageManager: any): any {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    return {
      // Wrap getServices to apply role-based filtering
      getServices: () => {
        const services = storageManager.getServices();
        return this.filterServices(services);
      },

      // Wrap getExpenses to apply role-based filtering
      getExpenses: () => {
        const expenses = storageManager.getExpenses();
        return this.filterExpenses(expenses);
      },

      // Wrap getReconciliations to apply role-based filtering
      getReconciliations: () => {
        const reconciliations = storageManager.getReconciliations();
        return this.filterReconciliations(reconciliations);
      },

      // Wrap saveService to add user context
      saveService: (serviceData: Partial<ServiceData>) => {
        const enrichedService = this.addUserContextToService(serviceData);
        return storageManager.saveService(enrichedService);
      },

      // Wrap saveExpense to add user context
      saveExpense: (expenseData: Partial<ExpenseData>) => {
        const enrichedExpense = this.addUserContextToExpense(expenseData);
        return storageManager.saveExpense(enrichedExpense);
      },

      // Wrap saveReconciliation to add user context
      saveReconciliation: (reconciliationData: Partial<ReconciliationData>) => {
        const enrichedReconciliation = this.addUserContextToReconciliation(reconciliationData);
        return storageManager.saveReconciliation(enrichedReconciliation);
      },

      // Wrap updateService with access validation
      updateService: (id: string, updates: Partial<ServiceData>) => {
        const existingServices = storageManager.getServices();
        const existingService = existingServices.find((s: ServiceData) => s.id === id);
        
        if (!existingService) {
          throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Servicio no encontrado');
        }

        if (!this.canModifyReconciliationData(existingService)) {
          throw new AuthError(
            AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            'Sin permisos para modificar este servicio'
          );
        }

        return storageManager.updateService(id, updates);
      },

      // Wrap updateExpense with access validation
      updateExpense: (id: string, updates: Partial<ExpenseData>) => {
        const existingExpenses = storageManager.getExpenses();
        const existingExpense = existingExpenses.find((e: ExpenseData) => e.id === id);
        
        if (!existingExpense) {
          throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Gasto no encontrado');
        }

        if (!this.canModifyReconciliationData(existingExpense)) {
          throw new AuthError(
            AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            'Sin permisos para modificar este gasto'
          );
        }

        return storageManager.updateExpense(id, updates);
      },

      // Wrap deleteService with access validation
      deleteService: (id: string) => {
        const existingServices = storageManager.getServices();
        const existingService = existingServices.find((s: ServiceData) => s.id === id);
        
        if (!existingService) {
          throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Servicio no encontrado');
        }

        if (!this.canModifyReconciliationData(existingService)) {
          throw new AuthError(
            AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            'Sin permisos para eliminar este servicio'
          );
        }

        return storageManager.deleteService(id);
      },

      // Wrap deleteExpense with access validation
      deleteExpense: (id: string) => {
        const existingExpenses = storageManager.getExpenses();
        const existingExpense = existingExpenses.find((e: ExpenseData) => e.id === id);
        
        if (!existingExpense) {
          throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Gasto no encontrado');
        }

        if (!this.canModifyReconciliationData(existingExpense)) {
          throw new AuthError(
            AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            'Sin permisos para eliminar este gasto'
          );
        }

        return storageManager.deleteExpense(id);
      },

      // Pass through other methods unchanged
      getSettings: () => storageManager.getSettings(),
      saveSettings: (settings: any) => storageManager.saveSettings(settings),
      deleteReconciliation: (id: string) => {
        const existingReconciliations = storageManager.getReconciliations();
        const existingReconciliation = existingReconciliations.find((r: ReconciliationData) => r.id === id);
        
        if (!existingReconciliation) {
          throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Reconciliación no encontrada');
        }

        if (!this.canModifyReconciliationData(existingReconciliation)) {
          throw new AuthError(
            AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            'Sin permisos para eliminar esta reconciliación'
          );
        }

        return storageManager.deleteReconciliation(id);
      }
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}