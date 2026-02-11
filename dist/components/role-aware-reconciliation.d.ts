import { User, UserRole, Permission } from '../types';
import { AuthService } from '../services/auth-service';
import { RoleService } from '../services/role-service';
/**
 * Role-aware wrapper for the existing ReconciliationModule
 * This component enhances the existing reconciliation functionality with role-based context
 */
export declare class RoleAwareReconciliationModule {
    private authService;
    private roleService;
    private reconciliationIntegration;
    private originalStorageManager;
    private roleAwareStorageManager;
    constructor(authService: AuthService, roleService: RoleService, originalStorageManager: any);
    /**
     * Get role-aware storage manager that applies filtering and context
     */
    getStorageManager(): any;
    /**
     * Get reconciliation context for the current user
     */
    getReconciliationContext(): {
        userRole: UserRole | null;
        canViewAggregatedData: boolean;
        canInputData: boolean;
        associatedUsers: User[];
        permissions: Permission[];
    };
    /**
     * Get aggregated summary for patrones
     * Requirements: 5.2 - Patrones should see aggregated data from their associated taxistas
     */
    getAggregatedSummary(dataType?: 'services' | 'expenses' | 'reconciliations'): import("../services/reconciliation-integration").AggregatedSummary | null;
    /**
     * Enhanced reconciliation generation with role context
     * Requirements: 5.2, 5.4 - Apply role-based filtering and context
     */
    generateRoleAwareReconciliation(calculationEngine: any, selectedPeriod: {
        start: Date;
        end: Date;
    }, cashBreakdown: any, distributionSettings: any): any;
    /**
     * Get role-specific UI configuration
     * Returns configuration object for customizing the UI based on user role
     */
    getRoleSpecificUIConfig(): {
        showAggregatedData: boolean;
        showAssociatedTaxistas: boolean;
        canManageAllData: boolean;
        userDisplayName: string;
        userIdentifier: string;
        permissions: never[];
        userRole?: never;
        associatedUsers?: never;
    } | {
        showAggregatedData: boolean;
        showAssociatedTaxistas: boolean;
        canManageAllData: boolean;
        userDisplayName: string;
        userIdentifier: string;
        userRole: UserRole;
        permissions: Permission[];
        associatedUsers: User[];
    };
    /**
     * Get role-specific statistics for dashboard
     */
    getRoleSpecificStatistics(): {
        aggregatedData: {
            services: import("../services/reconciliation-integration").AggregatedSummary | null;
            expenses: import("../services/reconciliation-integration").AggregatedSummary | null;
        };
        associatedTaxistasCount: number;
        associationStats: any;
        totalServices: any;
        totalExpenses: any;
        totalReconciliations: any;
        totalServiceAmount: any;
        totalExpenseAmount: any;
    } | {
        taxistaNumber: string | undefined;
        personalData: boolean;
        totalServices: any;
        totalExpenses: any;
        totalReconciliations: any;
        totalServiceAmount: any;
        totalExpenseAmount: any;
    } | null;
    /**
     * Validate reconciliation operation permissions
     */
    validateReconciliationOperation(operation: 'create' | 'read' | 'update' | 'delete', targetData?: any): boolean;
    /**
     * Get filtered notification messages based on role
     */
    getRoleSpecificNotifications(): string[];
    /**
     * Export role-filtered data
     * Only exports data that the current user has permission to see
     */
    exportRoleFilteredData(format?: 'json' | 'csv'): string;
}
/**
 * Factory function to create a role-aware reconciliation module
 */
export declare function createRoleAwareReconciliationModule(authService: AuthService, roleService: RoleService, originalStorageManager: any): RoleAwareReconciliationModule;
/**
 * Integration helper for existing reconciliation components
 * This function can be used to enhance existing reconciliation components with role awareness
 */
export declare function enhanceReconciliationWithRoles(originalReconciliationModule: any, authService: AuthService, roleService: RoleService): any;
//# sourceMappingURL=role-aware-reconciliation.d.ts.map