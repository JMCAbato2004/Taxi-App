/**
 * Data Synchronization Bridge
 * Integrates DataSyncService with existing components and provides unified interface
 * Requirements: 5.1, 5.3 - Bridge sync service with existing functionality
 */
import { ConflictResolutionStrategy, PendingOperation, SyncConflict, SyncStats } from '../services/data-sync';
import { SecureStorageService } from '../services/secure-storage';
import { RoleService } from '../services/role-service';
import { ServiceExpenseIntegrationService } from '../services/service-expense-integration';
import { User } from '../types';
/**
 * Enhanced service data with sync metadata
 */
export interface SyncAwareServiceData {
    id: string;
    description: string;
    amount: number;
    userId: string;
    taxistaId?: string;
    numeroTaxista?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    syncStatus?: 'synced' | 'pending' | 'conflict' | 'failed';
    syncOperationId?: string;
    lastSyncAttempt?: Date;
}
/**
 * Enhanced expense data with sync metadata
 */
export interface SyncAwareExpenseData {
    id: string;
    description: string;
    amount: number;
    category: string;
    userId: string;
    taxistaId?: string;
    numeroTaxista?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    syncStatus?: 'synced' | 'pending' | 'conflict' | 'failed';
    syncOperationId?: string;
    lastSyncAttempt?: Date;
}
/**
 * Sync operation result
 */
export interface SyncOperationResult {
    operationId: string;
    success: boolean;
    error?: string;
    willSyncWhenOnline?: boolean;
}
/**
 * Sync dashboard data for monitoring
 */
export interface SyncDashboard {
    stats: SyncStats;
    pendingOperations: PendingOperation[];
    conflicts: SyncConflict[];
    recentActivity: {
        type: 'sync' | 'conflict' | 'error';
        message: string;
        timestamp: Date;
    }[];
}
/**
 * Data Synchronization Bridge
 * Provides unified interface for sync-aware data operations
 */
export declare class DataSyncBridge {
    private dataSyncService;
    constructor(secureStorage: SecureStorageService, roleService: RoleService, serviceExpenseIntegration: ServiceExpenseIntegrationService, getCurrentUser: () => User | null, syncConfig?: any);
    /**
     * Create service with automatic sync queuing
     * Requirements: 5.1 - Queue operations for offline scenarios
     */
    createService(serviceData: Partial<SyncAwareServiceData>): Promise<SyncOperationResult>;
    /**
     * Update service with conflict detection
     * Requirements: 5.3 - Handle conflicts during updates
     */
    updateService(serviceId: string, updates: Partial<SyncAwareServiceData>, conflictResolution?: ConflictResolutionStrategy): Promise<SyncOperationResult>;
    /**
     * Delete service with sync queuing
     * Requirements: 5.1 - Queue delete operations
     */
    deleteService(serviceId: string): Promise<SyncOperationResult>;
    /**
     * Create expense with automatic sync queuing
     * Requirements: 5.1 - Queue operations for offline scenarios
     */
    createExpense(expenseData: Partial<SyncAwareExpenseData>): Promise<SyncOperationResult>;
    /**
     * Update expense with conflict detection
     * Requirements: 5.3 - Handle conflicts during updates
     */
    updateExpense(expenseId: string, updates: Partial<SyncAwareExpenseData>, conflictResolution?: ConflictResolutionStrategy): Promise<SyncOperationResult>;
    /**
     * Delete expense with sync queuing
     * Requirements: 5.1 - Queue delete operations
     */
    deleteExpense(expenseId: string): Promise<SyncOperationResult>;
    /**
     * Update user profile with sync queuing
     * Requirements: 5.1 - Queue profile updates
     */
    updateProfile(updates: Partial<User>): Promise<SyncOperationResult>;
    /**
     * Create association with sync queuing
     * Requirements: 5.1 - Queue association operations
     */
    createAssociation(patronId: string, taxistaId: string): Promise<SyncOperationResult>;
    /**
     * Remove association with sync queuing
     * Requirements: 5.1 - Queue association removal
     */
    removeAssociation(associationId: string): Promise<SyncOperationResult>;
    /**
     * Get comprehensive sync dashboard
     * Requirements: 5.1, 5.3 - Provide sync status and conflict information
     */
    getSyncDashboard(): Promise<SyncDashboard>;
    /**
     * Force immediate synchronization
     * Requirements: 5.1 - Allow manual sync trigger
     */
    forceSync(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Resolve conflict with user choice
     * Requirements: 5.3 - Allow manual conflict resolution
     */
    resolveConflict(conflictId: string, resolution: ConflictResolutionStrategy, resolvedData?: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Cancel pending operation
     * Requirements: 5.1 - Allow operation cancellation
     */
    cancelOperation(operationId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Clear completed operations
     * Requirements: 5.1 - Queue maintenance
     */
    clearCompletedOperations(): Promise<{
        clearedCount: number;
    }>;
    /**
     * Update sync configuration
     * Requirements: 5.1 - Allow sync configuration
     */
    updateSyncConfig(config: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Enhance service data with sync status
     * Requirements: 5.1 - Provide sync status for data items
     */
    enhanceServicesWithSyncStatus(services: any[]): SyncAwareServiceData[];
    /**
     * Enhance expense data with sync status
     * Requirements: 5.1 - Provide sync status for data items
     */
    enhanceExpensesWithSyncStatus(expenses: any[]): SyncAwareExpenseData[];
    /**
     * Get network status
     * Requirements: 5.1 - Provide network connectivity information
     */
    getNetworkStatus(): Promise<{
        isOnline: boolean;
        connectionType?: string;
        effectiveType?: string;
        lastChecked: Date;
    }>;
    /**
     * Check if offline mode is active
     * Requirements: 5.1 - Indicate offline mode status
     */
    isOfflineMode(): boolean;
    /**
     * Get offline capabilities status
     * Requirements: 5.1 - Indicate offline capabilities
     */
    getOfflineCapabilities(): {
        canCreateServices: boolean;
        canCreateExpenses: boolean;
        canUpdateProfile: boolean;
        canManageAssociations: boolean;
        estimatedSyncTime?: Date;
    };
    /**
     * Cleanup and destroy bridge
     */
    destroy(): void;
    private getSyncStatusFromOperation;
}
/**
 * Factory function to create DataSyncBridge instance
 * Requirements: 5.1, 5.3 - Provide easy instantiation
 */
export declare function createDataSyncBridge(secureStorage: SecureStorageService, roleService: RoleService, serviceExpenseIntegration: ServiceExpenseIntegrationService, getCurrentUser: () => User | null, config?: {
    maxRetries?: number;
    syncInterval?: number;
    batchSize?: number;
    conflictResolutionStrategy?: ConflictResolutionStrategy;
    prioritizeUserRole?: boolean;
    enableBackgroundSync?: boolean;
}): DataSyncBridge;
//# sourceMappingURL=data-sync-bridge.d.ts.map