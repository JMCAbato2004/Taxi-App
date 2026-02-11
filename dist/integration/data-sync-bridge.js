/**
 * Data Synchronization Bridge
 * Integrates DataSyncService with existing components and provides unified interface
 * Requirements: 5.1, 5.3 - Bridge sync service with existing functionality
 */
import { DataSyncService, SyncOperationType, ConflictResolutionStrategy } from '../services/data-sync';
/**
 * Data Synchronization Bridge
 * Provides unified interface for sync-aware data operations
 */
export class DataSyncBridge {
    constructor(secureStorage, roleService, serviceExpenseIntegration, getCurrentUser, syncConfig) {
        this.dataSyncService = new DataSyncService(secureStorage, roleService, serviceExpenseIntegration, getCurrentUser, syncConfig);
    }
    // ============================================================================
    // SERVICE OPERATIONS WITH SYNC AWARENESS
    // ============================================================================
    /**
     * Create service with automatic sync queuing
     * Requirements: 5.1 - Queue operations for offline scenarios
     */
    async createService(serviceData) {
        try {
            const operationId = await this.dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, {
                ...serviceData,
                createdAt: new Date(),
                updatedAt: new Date()
            }, {
                priority: 70,
                metadata: {
                    entityType: 'service',
                    operation: 'create'
                }
            });
            return {
                operationId,
                success: true,
                willSyncWhenOnline: !navigator.onLine
            };
        }
        catch (error) {
            return {
                operationId: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Update service with conflict detection
     * Requirements: 5.3 - Handle conflicts during updates
     */
    async updateService(serviceId, updates, conflictResolution = ConflictResolutionStrategy.CLIENT_WINS) {
        try {
            const operationId = await this.dataSyncService.queueOperation(SyncOperationType.UPDATE_SERVICE, {
                id: serviceId,
                ...updates,
                updatedAt: new Date()
            }, {
                priority: 60,
                conflictResolution,
                metadata: {
                    entityType: 'service',
                    operation: 'update',
                    entityId: serviceId
                }
            });
            return {
                operationId,
                success: true,
                willSyncWhenOnline: !navigator.onLine
            };
        }
        catch (error) {
            return {
                operationId: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Delete service with sync queuing
     * Requirements: 5.1 - Queue delete operations
     */
    async deleteService(serviceId) {
        try {
            const operationId = await this.dataSyncService.queueOperation(SyncOperationType.DELETE_SERVICE, { id: serviceId }, {
                priority: 50,
                metadata: {
                    entityType: 'service',
                    operation: 'delete',
                    entityId: serviceId
                }
            });
            return {
                operationId,
                success: true,
                willSyncWhenOnline: !navigator.onLine
            };
        }
        catch (error) {
            return {
                operationId: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    // ============================================================================
    // EXPENSE OPERATIONS WITH SYNC AWARENESS
    // ============================================================================
    /**
     * Create expense with automatic sync queuing
     * Requirements: 5.1 - Queue operations for offline scenarios
     */
    async createExpense(expenseData) {
        try {
            const operationId = await this.dataSyncService.queueOperation(SyncOperationType.CREATE_EXPENSE, {
                ...expenseData,
                createdAt: new Date(),
                updatedAt: new Date()
            }, {
                priority: 70,
                metadata: {
                    entityType: 'expense',
                    operation: 'create'
                }
            });
            return {
                operationId,
                success: true,
                willSyncWhenOnline: !navigator.onLine
            };
        }
        catch (error) {
            return {
                operationId: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Update expense with conflict detection
     * Requirements: 5.3 - Handle conflicts during updates
     */
    async updateExpense(expenseId, updates, conflictResolution = ConflictResolutionStrategy.CLIENT_WINS) {
        try {
            const operationId = await this.dataSyncService.queueOperation(SyncOperationType.UPDATE_EXPENSE, {
                id: expenseId,
                ...updates,
                updatedAt: new Date()
            }, {
                priority: 60,
                conflictResolution,
                metadata: {
                    entityType: 'expense',
                    operation: 'update',
                    entityId: expenseId
                }
            });
            return {
                operationId,
                success: true,
                willSyncWhenOnline: !navigator.onLine
            };
        }
        catch (error) {
            return {
                operationId: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Delete expense with sync queuing
     * Requirements: 5.1 - Queue delete operations
     */
    async deleteExpense(expenseId) {
        try {
            const operationId = await this.dataSyncService.queueOperation(SyncOperationType.DELETE_EXPENSE, { id: expenseId }, {
                priority: 50,
                metadata: {
                    entityType: 'expense',
                    operation: 'delete',
                    entityId: expenseId
                }
            });
            return {
                operationId,
                success: true,
                willSyncWhenOnline: !navigator.onLine
            };
        }
        catch (error) {
            return {
                operationId: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    // ============================================================================
    // PROFILE AND ASSOCIATION OPERATIONS
    // ============================================================================
    /**
     * Update user profile with sync queuing
     * Requirements: 5.1 - Queue profile updates
     */
    async updateProfile(updates) {
        try {
            const operationId = await this.dataSyncService.queueOperation(SyncOperationType.UPDATE_PROFILE, updates, {
                priority: 80,
                metadata: {
                    entityType: 'profile',
                    operation: 'update'
                }
            });
            return {
                operationId,
                success: true,
                willSyncWhenOnline: !navigator.onLine
            };
        }
        catch (error) {
            return {
                operationId: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Create association with sync queuing
     * Requirements: 5.1 - Queue association operations
     */
    async createAssociation(patronId, taxistaId) {
        try {
            const operationId = await this.dataSyncService.queueOperation(SyncOperationType.CREATE_ASSOCIATION, { patronId, taxistaId }, {
                priority: 90,
                metadata: {
                    entityType: 'association',
                    operation: 'create'
                }
            });
            return {
                operationId,
                success: true,
                willSyncWhenOnline: !navigator.onLine
            };
        }
        catch (error) {
            return {
                operationId: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Remove association with sync queuing
     * Requirements: 5.1 - Queue association removal
     */
    async removeAssociation(associationId) {
        try {
            const operationId = await this.dataSyncService.queueOperation(SyncOperationType.REMOVE_ASSOCIATION, { associationId }, {
                priority: 90,
                metadata: {
                    entityType: 'association',
                    operation: 'remove'
                }
            });
            return {
                operationId,
                success: true,
                willSyncWhenOnline: !navigator.onLine
            };
        }
        catch (error) {
            return {
                operationId: '',
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    // ============================================================================
    // SYNC MANAGEMENT AND MONITORING
    // ============================================================================
    /**
     * Get comprehensive sync dashboard
     * Requirements: 5.1, 5.3 - Provide sync status and conflict information
     */
    async getSyncDashboard() {
        const [stats, conflicts] = await Promise.all([
            this.dataSyncService.getSyncStats(),
            this.dataSyncService.getConflicts()
        ]);
        const pendingOperations = this.dataSyncService.getPendingOperations();
        // Generate recent activity
        const recentActivity = [
            ...pendingOperations.slice(0, 5).map(op => ({
                type: 'sync',
                message: `Operación ${op.type} pendiente`,
                timestamp: op.timestamp
            })),
            ...conflicts.slice(0, 3).map(conflict => ({
                type: 'conflict',
                message: `Conflicto en ${conflict.type}`,
                timestamp: conflict.timestamp
            }))
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
        return {
            stats,
            pendingOperations,
            conflicts,
            recentActivity
        };
    }
    /**
     * Force immediate synchronization
     * Requirements: 5.1 - Allow manual sync trigger
     */
    async forceSync() {
        try {
            await this.dataSyncService.forcSync();
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Resolve conflict with user choice
     * Requirements: 5.3 - Allow manual conflict resolution
     */
    async resolveConflict(conflictId, resolution, resolvedData) {
        try {
            await this.dataSyncService.resolveConflict(conflictId, resolution, resolvedData);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Cancel pending operation
     * Requirements: 5.1 - Allow operation cancellation
     */
    async cancelOperation(operationId) {
        try {
            await this.dataSyncService.cancelOperation(operationId);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Clear completed operations
     * Requirements: 5.1 - Queue maintenance
     */
    async clearCompletedOperations() {
        const clearedCount = await this.dataSyncService.clearCompletedOperations();
        return { clearedCount };
    }
    /**
     * Update sync configuration
     * Requirements: 5.1 - Allow sync configuration
     */
    async updateSyncConfig(config) {
        try {
            await this.dataSyncService.updateConfig(config);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    // ============================================================================
    // DATA ENHANCEMENT WITH SYNC STATUS
    // ============================================================================
    /**
     * Enhance service data with sync status
     * Requirements: 5.1 - Provide sync status for data items
     */
    enhanceServicesWithSyncStatus(services) {
        const pendingOps = this.dataSyncService.getPendingOperations();
        return services.map(service => {
            const syncOp = pendingOps.find(op => op.metadata?.entityId === service.id &&
                op.metadata?.entityType === 'service');
            return {
                ...service,
                syncStatus: this.getSyncStatusFromOperation(syncOp),
                syncOperationId: syncOp?.id,
                lastSyncAttempt: syncOp?.timestamp
            };
        });
    }
    /**
     * Enhance expense data with sync status
     * Requirements: 5.1 - Provide sync status for data items
     */
    enhanceExpensesWithSyncStatus(expenses) {
        const pendingOps = this.dataSyncService.getPendingOperations();
        return expenses.map(expense => {
            const syncOp = pendingOps.find(op => op.metadata?.entityId === expense.id &&
                op.metadata?.entityType === 'expense');
            return {
                ...expense,
                syncStatus: this.getSyncStatusFromOperation(syncOp),
                syncOperationId: syncOp?.id,
                lastSyncAttempt: syncOp?.timestamp
            };
        });
    }
    /**
     * Get network status
     * Requirements: 5.1 - Provide network connectivity information
     */
    async getNetworkStatus() {
        const stats = await this.dataSyncService.getSyncStats();
        return stats.networkStatus;
    }
    /**
     * Check if offline mode is active
     * Requirements: 5.1 - Indicate offline mode status
     */
    isOfflineMode() {
        return !navigator.onLine;
    }
    /**
     * Get offline capabilities status
     * Requirements: 5.1 - Indicate offline capabilities
     */
    getOfflineCapabilities() {
        const isOnline = navigator.onLine;
        return {
            canCreateServices: true, // Always available offline
            canCreateExpenses: true, // Always available offline
            canUpdateProfile: true, // Always available offline
            canManageAssociations: true, // Always available offline
            estimatedSyncTime: isOnline ? undefined : new Date(Date.now() + 30000) // 30 seconds when back online
        };
    }
    /**
     * Cleanup and destroy bridge
     */
    destroy() {
        this.dataSyncService.destroy();
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    getSyncStatusFromOperation(operation) {
        if (!operation) {
            return 'synced';
        }
        switch (operation.status) {
            case 'pending':
            case 'in_progress':
                return 'pending';
            case 'conflict':
                return 'conflict';
            case 'failed':
                return 'failed';
            case 'completed':
            default:
                return 'synced';
        }
    }
}
/**
 * Factory function to create DataSyncBridge instance
 * Requirements: 5.1, 5.3 - Provide easy instantiation
 */
export function createDataSyncBridge(secureStorage, roleService, serviceExpenseIntegration, getCurrentUser, config) {
    return new DataSyncBridge(secureStorage, roleService, serviceExpenseIntegration, getCurrentUser, config);
}
//# sourceMappingURL=data-sync-bridge.js.map