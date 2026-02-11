// Reconciliation Integration Service with Role-Based Context
// Adapts existing reconciliation functionality to work with authentication system
// Requirements: 5.2, 5.4
import { UserRole, Permission, AuthError, AuthErrorCode } from '../types';
/**
 * Service for integrating reconciliation functionality with role-based authentication
 */
export class ReconciliationIntegrationService {
    constructor(roleService, getCurrentUser) {
        this.roleService = roleService;
        this.getCurrentUser = getCurrentUser;
    }
    /**
     * Filter services data based on user role and associations
     * Requirements: 5.2, 5.4 - Apply role-based filtering
     */
    filterServices(services) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
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
    filterExpenses(expenses) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
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
    filterReconciliations(reconciliations) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
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
    addUserContextToService(serviceData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        // Validate user has permission to input operational data
        if (!this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para introducir datos operativos');
        }
        const enrichedService = {
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
    addUserContextToExpense(expenseData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        // Validate user has permission to input operational data
        if (!this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para introducir datos operativos');
        }
        const enrichedExpense = {
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
    addUserContextToReconciliation(reconciliationData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        // Validate user has permission to generate reconciliations
        if (!this.roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para generar reconciliaciones');
        }
        const enrichedReconciliation = {
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
    getAggregatedSummary(data, aggregationField = 'amount') {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== UserRole.PATRON) {
            return null;
        }
        // Validate user has permission to view aggregated data
        if (!this.roleService.hasPermission(Permission.VIEW_ALL_DRIVERS)) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para ver datos agregados');
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
        const totalAmount = filteredData.reduce((sum, item) => {
            const value = item[aggregationField];
            return sum + (typeof value === 'number' ? value : 0);
        }, 0);
        // Group data by taxista
        const byTaxista = {};
        const associatedUsers = this.roleService.getAccessibleUsers();
        filteredData.forEach((item) => {
            let taxistaId = null;
            if (item.userId && item.userId !== currentUser.id)
                taxistaId = item.userId;
            else if (item.taxistaId && item.taxistaId !== currentUser.id)
                taxistaId = item.taxistaId;
            else if (item.createdBy && item.createdBy !== currentUser.id)
                taxistaId = item.createdBy;
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
    canAccessReconciliationData(data) {
        return this.roleService.validateDataAccess(data, 'read');
    }
    /**
     * Validate if current user can modify specific reconciliation data
     * Requirements: 5.4 - Data filtering should be applied based on user role context
     */
    canModifyReconciliationData(data) {
        return this.roleService.validateDataAccess(data, 'write');
    }
    /**
     * Get reconciliation context for current user
     * Returns information about what data the user can see and modify
     */
    getReconciliationContext() {
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
    wrapStorageOperations(storageManager) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
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
            saveService: (serviceData) => {
                const enrichedService = this.addUserContextToService(serviceData);
                return storageManager.saveService(enrichedService);
            },
            // Wrap saveExpense to add user context
            saveExpense: (expenseData) => {
                const enrichedExpense = this.addUserContextToExpense(expenseData);
                return storageManager.saveExpense(enrichedExpense);
            },
            // Wrap saveReconciliation to add user context
            saveReconciliation: (reconciliationData) => {
                const enrichedReconciliation = this.addUserContextToReconciliation(reconciliationData);
                return storageManager.saveReconciliation(enrichedReconciliation);
            },
            // Wrap updateService with access validation
            updateService: (id, updates) => {
                const existingServices = storageManager.getServices();
                const existingService = existingServices.find((s) => s.id === id);
                if (!existingService) {
                    throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Servicio no encontrado');
                }
                if (!this.canModifyReconciliationData(existingService)) {
                    throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para modificar este servicio');
                }
                return storageManager.updateService(id, updates);
            },
            // Wrap updateExpense with access validation
            updateExpense: (id, updates) => {
                const existingExpenses = storageManager.getExpenses();
                const existingExpense = existingExpenses.find((e) => e.id === id);
                if (!existingExpense) {
                    throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Gasto no encontrado');
                }
                if (!this.canModifyReconciliationData(existingExpense)) {
                    throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para modificar este gasto');
                }
                return storageManager.updateExpense(id, updates);
            },
            // Wrap deleteService with access validation
            deleteService: (id) => {
                const existingServices = storageManager.getServices();
                const existingService = existingServices.find((s) => s.id === id);
                if (!existingService) {
                    throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Servicio no encontrado');
                }
                if (!this.canModifyReconciliationData(existingService)) {
                    throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para eliminar este servicio');
                }
                return storageManager.deleteService(id);
            },
            // Wrap deleteExpense with access validation
            deleteExpense: (id) => {
                const existingExpenses = storageManager.getExpenses();
                const existingExpense = existingExpenses.find((e) => e.id === id);
                if (!existingExpense) {
                    throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Gasto no encontrado');
                }
                if (!this.canModifyReconciliationData(existingExpense)) {
                    throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para eliminar este gasto');
                }
                return storageManager.deleteExpense(id);
            },
            // Pass through other methods unchanged
            getSettings: () => storageManager.getSettings(),
            saveSettings: (settings) => storageManager.saveSettings(settings),
            deleteReconciliation: (id) => {
                const existingReconciliations = storageManager.getReconciliations();
                const existingReconciliation = existingReconciliations.find((r) => r.id === id);
                if (!existingReconciliation) {
                    throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Reconciliación no encontrada');
                }
                if (!this.canModifyReconciliationData(existingReconciliation)) {
                    throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para eliminar esta reconciliación');
                }
                return storageManager.deleteReconciliation(id);
            }
        };
    }
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
}
//# sourceMappingURL=reconciliation-integration.js.map