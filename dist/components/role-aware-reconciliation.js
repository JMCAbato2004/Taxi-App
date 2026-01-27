// Role-Aware Reconciliation Module
// Integrates existing reconciliation functionality with role-based authentication
// Requirements: 5.2, 5.4
import { UserRole, Permission, AuthError, AuthErrorCode } from '../types';
import { ReconciliationIntegrationService } from '../services/reconciliation-integration';
/**
 * Role-aware wrapper for the existing ReconciliationModule
 * This component enhances the existing reconciliation functionality with role-based context
 */
export class RoleAwareReconciliationModule {
    constructor(authService, roleService, originalStorageManager) {
        this.authService = authService;
        this.roleService = roleService;
        this.reconciliationIntegration = new ReconciliationIntegrationService(this.roleService, () => this.authService.getCurrentUser());
        this.originalStorageManager = originalStorageManager;
        this.roleAwareStorageManager = this.reconciliationIntegration.wrapStorageOperations(originalStorageManager);
    }
    /**
     * Get role-aware storage manager that applies filtering and context
     */
    getStorageManager() {
        return this.roleAwareStorageManager;
    }
    /**
     * Get reconciliation context for the current user
     */
    getReconciliationContext() {
        return this.reconciliationIntegration.getReconciliationContext();
    }
    /**
     * Get aggregated summary for patrones
     * Requirements: 5.2 - Patrones should see aggregated data from their associated taxistas
     */
    getAggregatedSummary(dataType = 'services') {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser || currentUser.rol !== UserRole.PATRON) {
            return null;
        }
        let data = [];
        let aggregationField = 'amount';
        switch (dataType) {
            case 'services':
                data = this.originalStorageManager.getServices();
                aggregationField = 'totalAmount';
                break;
            case 'expenses':
                data = this.originalStorageManager.getExpenses();
                aggregationField = 'amount';
                break;
            case 'reconciliations':
                data = this.originalStorageManager.getReconciliations();
                aggregationField = 'totalAmount';
                break;
        }
        return this.reconciliationIntegration.getAggregatedSummary(data, aggregationField);
    }
    /**
     * Enhanced reconciliation generation with role context
     * Requirements: 5.2, 5.4 - Apply role-based filtering and context
     */
    generateRoleAwareReconciliation(calculationEngine, selectedPeriod, cashBreakdown, distributionSettings) {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        // Get filtered data based on user role
        const services = this.roleAwareStorageManager.getServices();
        const expenses = this.roleAwareStorageManager.getExpenses();
        // Validate that user has data to reconcile
        if (services.length === 0) {
            if (currentUser.rol === UserRole.PATRON) {
                throw new Error('No hay servicios de taxistas asociados para liquidar en el período seleccionado');
            }
            else {
                throw new Error('No hay servicios para liquidar en el período seleccionado');
            }
        }
        // Generate reconciliation with role context
        const reconciliation = calculationEngine.generateReconciliation(services, expenses, selectedPeriod, cashBreakdown, distributionSettings);
        // Add role-specific metadata
        const enrichedReconciliation = {
            ...reconciliation,
            userRole: currentUser.rol,
            userId: currentUser.id,
            createdBy: currentUser.id,
            numeroTaxista: currentUser.rol === UserRole.TAXISTA ? currentUser.numeroTaxista : undefined,
            // Add aggregated data for patrones
            ...(currentUser.rol === UserRole.PATRON && {
                aggregatedData: this.getAggregatedSummary('services'),
                associatedTaxistas: this.roleService.getAccessibleUsers()
                    .filter(u => u.rol === UserRole.TAXISTA)
                    .map(u => ({
                    id: u.id,
                    nombre: u.nombre,
                    numeroTaxista: u.numeroTaxista
                }))
            })
        };
        return enrichedReconciliation;
    }
    /**
     * Get role-specific UI configuration
     * Returns configuration object for customizing the UI based on user role
     */
    getRoleSpecificUIConfig() {
        const context = this.getReconciliationContext();
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            return {
                showAggregatedData: false,
                showAssociatedTaxistas: false,
                canManageAllData: false,
                userDisplayName: '',
                userIdentifier: '',
                permissions: []
            };
        }
        return {
            showAggregatedData: context.canViewAggregatedData,
            showAssociatedTaxistas: currentUser.rol === UserRole.PATRON,
            canManageAllData: context.canViewAggregatedData,
            userDisplayName: currentUser.nombre,
            userIdentifier: currentUser.rol === UserRole.TAXISTA
                ? currentUser.numeroTaxista || currentUser.email
                : currentUser.email,
            userRole: currentUser.rol,
            permissions: context.permissions,
            associatedUsers: context.associatedUsers
        };
    }
    /**
     * Get role-specific statistics for dashboard
     */
    getRoleSpecificStatistics() {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser)
            return null;
        const services = this.roleAwareStorageManager.getServices();
        const expenses = this.roleAwareStorageManager.getExpenses();
        const reconciliations = this.roleAwareStorageManager.getReconciliations();
        const baseStats = {
            totalServices: services.length,
            totalExpenses: expenses.length,
            totalReconciliations: reconciliations.length,
            totalServiceAmount: services.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
            totalExpenseAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
        };
        if (currentUser.rol === UserRole.PATRON) {
            // Add aggregated statistics for patrones
            const aggregatedServices = this.getAggregatedSummary('services');
            const aggregatedExpenses = this.getAggregatedSummary('expenses');
            return {
                ...baseStats,
                aggregatedData: {
                    services: aggregatedServices,
                    expenses: aggregatedExpenses
                },
                associatedTaxistasCount: aggregatedServices?.associatedTaxistas || 0,
                associationStats: this.roleService.getAssociationStatistics()
            };
        }
        // For taxistas, return basic stats
        return {
            ...baseStats,
            taxistaNumber: currentUser.numeroTaxista,
            personalData: true
        };
    }
    /**
     * Validate reconciliation operation permissions
     */
    validateReconciliationOperation(operation, targetData) {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser)
            return false;
        switch (operation) {
            case 'create':
                return this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA);
            case 'read':
                if (!targetData)
                    return true; // Can read own filtered data
                return this.reconciliationIntegration.canAccessReconciliationData(targetData);
            case 'update':
            case 'delete':
                if (!targetData)
                    return false;
                return this.reconciliationIntegration.canModifyReconciliationData(targetData);
            default:
                return false;
        }
    }
    /**
     * Get filtered notification messages based on role
     */
    getRoleSpecificNotifications() {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser)
            return [];
        const notifications = [];
        const context = this.getReconciliationContext();
        if (currentUser.rol === UserRole.PATRON) {
            const stats = this.getRoleSpecificStatistics();
            if (stats?.associatedTaxistasCount === 0) {
                notifications.push('No tienes taxistas asociados. Asocia taxistas para ver sus datos de reconciliación.');
            }
            else if (stats?.aggregatedData?.services?.totalRecords === 0) {
                notifications.push('Tus taxistas asociados no han registrado servicios aún.');
            }
        }
        else if (currentUser.rol === UserRole.TAXISTA) {
            const services = this.roleAwareStorageManager.getServices();
            if (services.length === 0) {
                notifications.push('No has registrado servicios aún. Comienza registrando tu primer servicio.');
            }
        }
        return notifications;
    }
    /**
     * Export role-filtered data
     * Only exports data that the current user has permission to see
     */
    exportRoleFilteredData(format = 'json') {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        const services = this.roleAwareStorageManager.getServices();
        const expenses = this.roleAwareStorageManager.getExpenses();
        const reconciliations = this.roleAwareStorageManager.getReconciliations();
        const exportData = {
            exportDate: new Date().toISOString(),
            userRole: currentUser.rol,
            userName: currentUser.nombre,
            userIdentifier: currentUser.rol === UserRole.TAXISTA ? currentUser.numeroTaxista : currentUser.email,
            data: {
                services,
                expenses,
                reconciliations
            },
            summary: this.getRoleSpecificStatistics()
        };
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        }
        else {
            // Convert to CSV format (simplified)
            const csvLines = [];
            // Services CSV
            if (services.length > 0) {
                csvLines.push('SERVICIOS');
                csvLines.push('Fecha,Hora,Importe,Tipo de Pago,Plataforma,Articulado');
                services.forEach((s) => {
                    csvLines.push(`${s.date},${s.startTime},${s.totalAmount},${s.paymentType},${s.platform || ''},${s.isArticulated ? 'Sí' : 'No'}`);
                });
                csvLines.push('');
            }
            // Expenses CSV
            if (expenses.length > 0) {
                csvLines.push('GASTOS');
                csvLines.push('Fecha,Concepto,Importe,Categoría');
                expenses.forEach((e) => {
                    csvLines.push(`${e.date},${e.concept},${e.amount},${e.category}`);
                });
            }
            return csvLines.join('\n');
        }
    }
}
/**
 * Factory function to create a role-aware reconciliation module
 */
export function createRoleAwareReconciliationModule(authService, roleService, originalStorageManager) {
    return new RoleAwareReconciliationModule(authService, roleService, originalStorageManager);
}
/**
 * Integration helper for existing reconciliation components
 * This function can be used to enhance existing reconciliation components with role awareness
 */
export function enhanceReconciliationWithRoles(originalReconciliationModule, authService, roleService) {
    const roleAwareModule = createRoleAwareReconciliationModule(authService, roleService, originalReconciliationModule.storageManager || window.ReconciliationStorageManager);
    // Return enhanced module with role-aware capabilities
    return {
        ...originalReconciliationModule,
        roleAware: roleAwareModule,
        getStorageManager: () => roleAwareModule.getStorageManager(),
        getReconciliationContext: () => roleAwareModule.getReconciliationContext(),
        getAggregatedSummary: (dataType) => roleAwareModule.getAggregatedSummary(dataType),
        getRoleSpecificUIConfig: () => roleAwareModule.getRoleSpecificUIConfig(),
        getRoleSpecificStatistics: () => roleAwareModule.getRoleSpecificStatistics(),
        validateOperation: (operation, targetData) => roleAwareModule.validateReconciliationOperation(operation, targetData),
        getNotifications: () => roleAwareModule.getRoleSpecificNotifications(),
        exportData: (format) => roleAwareModule.exportRoleFilteredData(format)
    };
}
//# sourceMappingURL=role-aware-reconciliation.js.map