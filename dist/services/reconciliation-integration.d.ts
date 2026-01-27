import { User, UserRole, Permission } from '../types';
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
export declare class ReconciliationIntegrationService {
    private roleService;
    private getCurrentUser;
    constructor(roleService: RoleService, getCurrentUser: () => User | null);
    /**
     * Filter services data based on user role and associations
     * Requirements: 5.2, 5.4 - Apply role-based filtering
     */
    filterServices(services: ServiceData[]): ServiceData[];
    /**
     * Filter expenses data based on user role and associations
     * Requirements: 5.2, 5.4 - Apply role-based filtering
     */
    filterExpenses(expenses: ExpenseData[]): ExpenseData[];
    /**
     * Filter reconciliation records based on user role and associations
     * Requirements: 5.2, 5.4 - Apply role-based filtering
     */
    filterReconciliations(reconciliations: ReconciliationData[]): ReconciliationData[];
    /**
     * Add user context to service data when creating/updating
     * Requirements: 5.3 - Associate operations with correct user
     */
    addUserContextToService(serviceData: Partial<ServiceData>): ServiceData;
    /**
     * Add user context to expense data when creating/updating
     * Requirements: 5.3 - Associate operations with correct user
     */
    addUserContextToExpense(expenseData: Partial<ExpenseData>): ExpenseData;
    /**
     * Add user context to reconciliation data when creating/updating
     * Requirements: 5.3 - Associate operations with correct user
     */
    addUserContextToReconciliation(reconciliationData: Partial<ReconciliationData>): ReconciliationData;
    /**
     * Get aggregated data summary for patrones
     * Requirements: 5.2 - Patrones should see aggregated data from their associated taxistas
     */
    getAggregatedSummary(data: ReconciliationDataItem[], aggregationField?: string): AggregatedSummary | null;
    /**
     * Validate if current user can access specific reconciliation data
     * Requirements: 5.4 - Data filtering should be applied based on user role context
     */
    canAccessReconciliationData(data: ReconciliationDataItem): boolean;
    /**
     * Validate if current user can modify specific reconciliation data
     * Requirements: 5.4 - Data filtering should be applied based on user role context
     */
    canModifyReconciliationData(data: ReconciliationDataItem): boolean;
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
    };
    /**
     * Apply role-based filtering to existing reconciliation storage operations
     * This method wraps the existing storage operations with role-based context
     */
    wrapStorageOperations(storageManager: any): any;
    private generateId;
}
//# sourceMappingURL=reconciliation-integration.d.ts.map