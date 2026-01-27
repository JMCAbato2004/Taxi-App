/**
 * Data Synchronization Service
 * Implements offline operation queue and conflict resolution for PWA
 * Requirements: 5.1 - Queue of pending operations, 5.3 - Conflict resolution
 */
import { User, UserRole } from '../types';
import { SecureStorageService } from './secure-storage';
import { RoleService } from './role-service';
import { ServiceExpenseIntegrationService } from './service-expense-integration';
/**
 * Types of operations that can be queued for synchronization
 */
export declare enum SyncOperationType {
    CREATE_SERVICE = "create_service",
    UPDATE_SERVICE = "update_service",
    DELETE_SERVICE = "delete_service",
    CREATE_EXPENSE = "create_expense",
    UPDATE_EXPENSE = "update_expense",
    DELETE_EXPENSE = "delete_expense",
    UPDATE_PROFILE = "update_profile",
    CREATE_ASSOCIATION = "create_association",
    REMOVE_ASSOCIATION = "remove_association"
}
/**
 * Status of a pending operation
 */
export declare enum SyncOperationStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CONFLICT = "conflict"
}
/**
 * Conflict resolution strategy
 */
export declare enum ConflictResolutionStrategy {
    CLIENT_WINS = "client_wins",// Local changes take precedence
    SERVER_WINS = "server_wins",// Server changes take precedence
    MERGE = "merge",// Attempt to merge changes
    MANUAL = "manual"
}
/**
 * Pending operation in the sync queue
 */
export interface PendingOperation {
    id: string;
    type: SyncOperationType;
    status: SyncOperationStatus;
    userId: string;
    userRole: UserRole;
    data: any;
    originalData?: any;
    timestamp: Date;
    retryCount: number;
    maxRetries: number;
    priority: number;
    conflictResolution?: ConflictResolutionStrategy;
    error?: string;
    metadata?: Record<string, any>;
}
/**
 * Sync conflict information
 */
export interface SyncConflict {
    operationId: string;
    type: SyncOperationType;
    localData: any;
    serverData: any;
    conflictFields: string[];
    suggestedResolution: ConflictResolutionStrategy;
    timestamp: Date;
}
/**
 * Network connectivity status
 */
export interface NetworkStatus {
    isOnline: boolean;
    connectionType?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    lastChecked: Date;
}
/**
 * Synchronization statistics
 */
export interface SyncStats {
    totalOperations: number;
    pendingOperations: number;
    completedOperations: number;
    failedOperations: number;
    conflictOperations: number;
    lastSyncTime: Date | null;
    nextSyncTime: Date | null;
    averageSyncDuration: number;
    networkStatus: NetworkStatus;
}
/**
 * Sync configuration options
 */
export interface SyncConfig {
    maxRetries: number;
    retryDelay: number;
    batchSize: number;
    syncInterval: number;
    conflictResolutionStrategy: ConflictResolutionStrategy;
    prioritizeUserRole: boolean;
    enableBackgroundSync: boolean;
    maxQueueSize: number;
}
/**
 * Data Synchronization Service
 * Handles offline operations and data synchronization with conflict resolution
 */
export declare class DataSyncService {
    private secureStorage;
    private roleService;
    private serviceExpenseIntegration;
    private getCurrentUser;
    private config;
    private readonly SYNC_QUEUE_KEY;
    private readonly SYNC_CONFIG_KEY;
    private readonly SYNC_STATS_KEY;
    private readonly NETWORK_STATUS_KEY;
    private syncQueue;
    private isOnline;
    private syncInProgress;
    private syncTimer;
    private networkStatusTimer;
    private readonly defaultConfig;
    constructor(secureStorage: SecureStorageService, roleService: RoleService, serviceExpenseIntegration: ServiceExpenseIntegrationService, getCurrentUser: () => User | null, config?: Partial<SyncConfig>);
    /**
     * Initialize synchronization service
     * Requirements: 5.1 - Initialize queue of pending operations
     */
    private initializeSync;
    /**
     * Add operation to sync queue
     * Requirements: 5.1 - Queue of pending operations for offline scenarios
     */
    queueOperation(type: SyncOperationType, data: any, options?: {
        priority?: number;
        conflictResolution?: ConflictResolutionStrategy;
        metadata?: Record<string, any>;
    }): Promise<string>;
    /**
     * Perform synchronization of pending operations
     * Requirements: 5.1, 5.3 - Process queue and handle conflicts
     */
    performSync(): Promise<void>;
    /**
     * Process a batch of operations
     * Requirements: 5.3 - Handle conflicts during synchronization
     */
    private processBatch;
    /**
     * Execute a single operation
     * Requirements: 5.1, 5.3 - Execute queued operations with conflict detection
     */
    private executeOperation;
    /**
     * Handle synchronization conflicts
     * Requirements: 5.3 - Add conflict resolution for data synchronization
     */
    private handleConflict;
    /**
     * Get pending operations for user review
     * Requirements: 5.1 - Allow users to see pending operations
     */
    getPendingOperations(userId?: string): PendingOperation[];
    /**
     * Get synchronization conflicts requiring manual resolution
     * Requirements: 5.3 - Provide conflict information for manual resolution
     */
    getConflicts(): Promise<SyncConflict[]>;
    /**
     * Resolve a conflict manually
     * Requirements: 5.3 - Allow manual conflict resolution
     */
    resolveConflict(conflictId: string, resolution: ConflictResolutionStrategy, resolvedData?: any): Promise<void>;
    /**
     * Cancel a pending operation
     * Requirements: 5.1 - Allow cancellation of pending operations
     */
    cancelOperation(operationId: string): Promise<void>;
    /**
     * Get synchronization statistics
     * Requirements: 5.1 - Provide sync status information
     */
    getSyncStats(): Promise<SyncStats>;
    /**
     * Force immediate synchronization
     * Requirements: 5.1 - Allow manual sync trigger
     */
    forcSync(): Promise<void>;
    /**
     * Clear completed operations from queue
     * Requirements: 5.1 - Queue maintenance
     */
    clearCompletedOperations(): Promise<number>;
    /**
     * Update sync configuration
     * Requirements: 5.1 - Allow configuration updates
     */
    updateConfig(newConfig: Partial<SyncConfig>): Promise<void>;
    /**
     * Cleanup and destroy service
     */
    destroy(): void;
    private generateOperationId;
    private getDefaultPriority;
    private sortQueueByPriority;
    private loadSyncQueue;
    private saveSyncQueue;
    private cleanupCompletedOperations;
    private setupNetworkMonitoring;
    private stopNetworkMonitoring;
    private updateNetworkStatus;
    private getNetworkStatus;
    private startBackgroundSync;
    private stopBackgroundSync;
    private updateSyncStats;
    private executeCreateService;
    private executeUpdateService;
    private executeDeleteService;
    private executeCreateExpense;
    private executeUpdateExpense;
    private executeDeleteExpense;
    private executeUpdateProfile;
    private executeCreateAssociation;
    private executeRemoveAssociation;
    private applyServerChanges;
    private mergeConflictData;
    private storeConflictForManualResolution;
}
//# sourceMappingURL=data-sync.d.ts.map