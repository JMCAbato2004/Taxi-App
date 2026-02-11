/**
 * Data Synchronization Service
 * Implements offline operation queue and conflict resolution for PWA
 * Requirements: 5.1 - Queue of pending operations, 5.3 - Conflict resolution
 */
import { UserRole, AuthError, AuthErrorCode } from '../types';
/**
 * Types of operations that can be queued for synchronization
 */
export var SyncOperationType;
(function (SyncOperationType) {
    SyncOperationType["CREATE_SERVICE"] = "create_service";
    SyncOperationType["UPDATE_SERVICE"] = "update_service";
    SyncOperationType["DELETE_SERVICE"] = "delete_service";
    SyncOperationType["CREATE_EXPENSE"] = "create_expense";
    SyncOperationType["UPDATE_EXPENSE"] = "update_expense";
    SyncOperationType["DELETE_EXPENSE"] = "delete_expense";
    SyncOperationType["UPDATE_PROFILE"] = "update_profile";
    SyncOperationType["CREATE_ASSOCIATION"] = "create_association";
    SyncOperationType["REMOVE_ASSOCIATION"] = "remove_association";
})(SyncOperationType || (SyncOperationType = {}));
/**
 * Status of a pending operation
 */
export var SyncOperationStatus;
(function (SyncOperationStatus) {
    SyncOperationStatus["PENDING"] = "pending";
    SyncOperationStatus["IN_PROGRESS"] = "in_progress";
    SyncOperationStatus["COMPLETED"] = "completed";
    SyncOperationStatus["FAILED"] = "failed";
    SyncOperationStatus["CONFLICT"] = "conflict";
})(SyncOperationStatus || (SyncOperationStatus = {}));
/**
 * Conflict resolution strategy
 */
export var ConflictResolutionStrategy;
(function (ConflictResolutionStrategy) {
    ConflictResolutionStrategy["CLIENT_WINS"] = "client_wins";
    ConflictResolutionStrategy["SERVER_WINS"] = "server_wins";
    ConflictResolutionStrategy["MERGE"] = "merge";
    ConflictResolutionStrategy["MANUAL"] = "manual"; // Require user intervention
})(ConflictResolutionStrategy || (ConflictResolutionStrategy = {}));
/**
 * Data Synchronization Service
 * Handles offline operations and data synchronization with conflict resolution
 */
export class DataSyncService {
    constructor(secureStorage, roleService, serviceExpenseIntegration, getCurrentUser, config = {}) {
        this.secureStorage = secureStorage;
        this.roleService = roleService;
        this.serviceExpenseIntegration = serviceExpenseIntegration;
        this.getCurrentUser = getCurrentUser;
        this.config = config;
        this.SYNC_QUEUE_KEY = 'taxi_sync_queue';
        this.SYNC_CONFIG_KEY = 'taxi_sync_config';
        this.SYNC_STATS_KEY = 'taxi_sync_stats';
        this.NETWORK_STATUS_KEY = 'taxi_network_status';
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.syncTimer = null;
        this.networkStatusTimer = null;
        this.defaultConfig = {
            maxRetries: 3,
            retryDelay: 5000, // 5 seconds
            batchSize: 10,
            syncInterval: 30000, // 30 seconds
            conflictResolutionStrategy: ConflictResolutionStrategy.CLIENT_WINS,
            prioritizeUserRole: true,
            enableBackgroundSync: true,
            maxQueueSize: 100
        };
        this.config = { ...this.defaultConfig, ...config };
        this.initializeSync();
    }
    /**
     * Initialize synchronization service
     * Requirements: 5.1 - Initialize queue of pending operations
     */
    async initializeSync() {
        try {
            // Load existing sync queue from storage
            await this.loadSyncQueue();
            // Set up network status monitoring
            this.setupNetworkMonitoring();
            // Start background sync if enabled
            if (this.config.enableBackgroundSync) {
                this.startBackgroundSync();
            }
            // Attempt initial sync if online
            if (this.isOnline) {
                setTimeout(() => this.performSync(), 1000);
            }
        }
        catch (error) {
            console.error('Error initializing sync service:', error);
        }
    }
    /**
     * Add operation to sync queue
     * Requirements: 5.1 - Queue of pending operations for offline scenarios
     */
    async queueOperation(type, data, options = {}) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        // Check queue size limit
        if (this.syncQueue.length >= this.config.maxQueueSize) {
            // Remove oldest completed operations to make space
            this.cleanupCompletedOperations();
            if (this.syncQueue.length >= this.config.maxQueueSize) {
                throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Cola de sincronización llena');
            }
        }
        const operation = {
            id: this.generateOperationId(),
            type,
            status: SyncOperationStatus.PENDING,
            userId: currentUser.id,
            userRole: currentUser.rol,
            data,
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: this.config.maxRetries,
            priority: options.priority || this.getDefaultPriority(type, currentUser.rol),
            conflictResolution: options.conflictResolution || this.config.conflictResolutionStrategy,
            metadata: options.metadata
        };
        // Add to queue and sort by priority
        this.syncQueue.push(operation);
        this.sortQueueByPriority();
        // Save queue to storage
        await this.saveSyncQueue();
        // Attempt immediate sync if online
        if (this.isOnline && !this.syncInProgress) {
            setTimeout(() => this.performSync(), 100);
        }
        return operation.id;
    }
    /**
     * Perform synchronization of pending operations
     * Requirements: 5.1, 5.3 - Process queue and handle conflicts
     */
    async performSync() {
        if (this.syncInProgress || !this.isOnline) {
            return;
        }
        this.syncInProgress = true;
        const startTime = Date.now();
        try {
            const pendingOps = this.syncQueue.filter(op => op.status === SyncOperationStatus.PENDING ||
                (op.status === SyncOperationStatus.FAILED && op.retryCount < op.maxRetries));
            if (pendingOps.length === 0) {
                return;
            }
            // Process operations in batches
            const batchSize = this.config.batchSize;
            for (let i = 0; i < pendingOps.length; i += batchSize) {
                const batch = pendingOps.slice(i, i + batchSize);
                await this.processBatch(batch);
            }
            // Update sync statistics
            await this.updateSyncStats(Date.now() - startTime);
        }
        catch (error) {
            console.error('Error during sync:', error);
        }
        finally {
            this.syncInProgress = false;
            await this.saveSyncQueue();
        }
    }
    /**
     * Process a batch of operations
     * Requirements: 5.3 - Handle conflicts during synchronization
     */
    async processBatch(operations) {
        for (const operation of operations) {
            try {
                operation.status = SyncOperationStatus.IN_PROGRESS;
                const result = await this.executeOperation(operation);
                if (result.success) {
                    operation.status = SyncOperationStatus.COMPLETED;
                }
                else if (result.conflict) {
                    operation.status = SyncOperationStatus.CONFLICT;
                    await this.handleConflict(operation, result.conflict);
                }
                else {
                    operation.status = SyncOperationStatus.FAILED;
                    operation.retryCount++;
                    operation.error = result.error;
                }
            }
            catch (error) {
                operation.status = SyncOperationStatus.FAILED;
                operation.retryCount++;
                operation.error = error instanceof Error ? error.message : 'Unknown error';
            }
        }
    }
    /**
     * Execute a single operation
     * Requirements: 5.1, 5.3 - Execute queued operations with conflict detection
     */
    async executeOperation(operation) {
        try {
            switch (operation.type) {
                case SyncOperationType.CREATE_SERVICE:
                    return await this.executeCreateService(operation);
                case SyncOperationType.UPDATE_SERVICE:
                    return await this.executeUpdateService(operation);
                case SyncOperationType.DELETE_SERVICE:
                    return await this.executeDeleteService(operation);
                case SyncOperationType.CREATE_EXPENSE:
                    return await this.executeCreateExpense(operation);
                case SyncOperationType.UPDATE_EXPENSE:
                    return await this.executeUpdateExpense(operation);
                case SyncOperationType.DELETE_EXPENSE:
                    return await this.executeDeleteExpense(operation);
                case SyncOperationType.UPDATE_PROFILE:
                    return await this.executeUpdateProfile(operation);
                case SyncOperationType.CREATE_ASSOCIATION:
                    return await this.executeCreateAssociation(operation);
                case SyncOperationType.REMOVE_ASSOCIATION:
                    return await this.executeRemoveAssociation(operation);
                default:
                    return {
                        success: false,
                        error: `Tipo de operación no soportado: ${operation.type}`
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Handle synchronization conflicts
     * Requirements: 5.3 - Add conflict resolution for data synchronization
     */
    async handleConflict(operation, conflict) {
        const strategy = operation.conflictResolution || this.config.conflictResolutionStrategy;
        switch (strategy) {
            case ConflictResolutionStrategy.CLIENT_WINS:
                // Force local changes to server
                operation.data = { ...operation.data, forceUpdate: true };
                operation.status = SyncOperationStatus.PENDING;
                operation.retryCount = 0;
                break;
            case ConflictResolutionStrategy.SERVER_WINS:
                // Accept server changes and mark as completed
                operation.status = SyncOperationStatus.COMPLETED;
                await this.applyServerChanges(operation, conflict.serverData);
                break;
            case ConflictResolutionStrategy.MERGE:
                // Attempt to merge changes
                const mergedData = await this.mergeConflictData(operation.data, conflict.serverData, conflict.conflictFields);
                operation.data = mergedData;
                operation.status = SyncOperationStatus.PENDING;
                operation.retryCount = 0;
                break;
            case ConflictResolutionStrategy.MANUAL:
                // Store conflict for manual resolution
                await this.storeConflictForManualResolution(conflict);
                break;
        }
    }
    /**
     * Get pending operations for user review
     * Requirements: 5.1 - Allow users to see pending operations
     */
    getPendingOperations(userId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return [];
        }
        const targetUserId = userId || currentUser.id;
        // Patrones can see operations for their associated taxistas
        if (currentUser.rol === UserRole.PATRON && userId) {
            const accessibleUsers = this.roleService.getAccessibleUsers();
            const canAccess = accessibleUsers.some(u => u.id === targetUserId);
            if (!canAccess) {
                return [];
            }
        }
        else if (targetUserId !== currentUser.id) {
            // Taxistas can only see their own operations
            return [];
        }
        return this.syncQueue.filter(op => op.userId === targetUserId &&
            op.status !== SyncOperationStatus.COMPLETED);
    }
    /**
     * Get synchronization conflicts requiring manual resolution
     * Requirements: 5.3 - Provide conflict information for manual resolution
     */
    async getConflicts() {
        try {
            const conflictsData = await this.secureStorage.getCriticalData('sync_conflicts');
            return conflictsData || [];
        }
        catch (error) {
            console.error('Error retrieving conflicts:', error);
            return [];
        }
    }
    /**
     * Resolve a conflict manually
     * Requirements: 5.3 - Allow manual conflict resolution
     */
    async resolveConflict(conflictId, resolution, resolvedData) {
        const conflicts = await this.getConflicts();
        const conflict = conflicts.find(c => c.operationId === conflictId);
        if (!conflict) {
            throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Conflicto no encontrado');
        }
        const operation = this.syncQueue.find(op => op.id === conflictId);
        if (!operation) {
            throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Operación no encontrada');
        }
        // Apply resolution
        switch (resolution) {
            case ConflictResolutionStrategy.CLIENT_WINS:
                operation.data = conflict.localData;
                break;
            case ConflictResolutionStrategy.SERVER_WINS:
                operation.data = conflict.serverData;
                break;
            case ConflictResolutionStrategy.MERGE:
                operation.data = resolvedData || await this.mergeConflictData(conflict.localData, conflict.serverData, conflict.conflictFields);
                break;
        }
        // Reset operation for retry
        operation.status = SyncOperationStatus.PENDING;
        operation.retryCount = 0;
        // Remove conflict from storage
        const updatedConflicts = conflicts.filter(c => c.operationId !== conflictId);
        await this.secureStorage.storeCriticalData('sync_conflicts', updatedConflicts);
        // Save updated queue
        await this.saveSyncQueue();
        // Attempt sync
        if (this.isOnline) {
            setTimeout(() => this.performSync(), 100);
        }
    }
    /**
     * Cancel a pending operation
     * Requirements: 5.1 - Allow cancellation of pending operations
     */
    async cancelOperation(operationId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
        }
        const operationIndex = this.syncQueue.findIndex(op => op.id === operationId);
        if (operationIndex === -1) {
            throw new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Operación no encontrada');
        }
        const operation = this.syncQueue[operationIndex];
        // Verify user can cancel this operation
        if (operation.userId !== currentUser.id &&
            !(currentUser.rol === UserRole.PATRON &&
                this.roleService.getAccessibleUsers().some(u => u.id === operation.userId))) {
            throw new AuthError(AuthErrorCode.INSUFFICIENT_PERMISSIONS, 'Sin permisos para cancelar esta operación');
        }
        // Remove operation from queue
        this.syncQueue.splice(operationIndex, 1);
        await this.saveSyncQueue();
    }
    /**
     * Get synchronization statistics
     * Requirements: 5.1 - Provide sync status information
     */
    async getSyncStats() {
        const networkStatus = await this.getNetworkStatus();
        const stats = {
            totalOperations: this.syncQueue.length,
            pendingOperations: this.syncQueue.filter(op => op.status === SyncOperationStatus.PENDING).length,
            completedOperations: this.syncQueue.filter(op => op.status === SyncOperationStatus.COMPLETED).length,
            failedOperations: this.syncQueue.filter(op => op.status === SyncOperationStatus.FAILED).length,
            conflictOperations: this.syncQueue.filter(op => op.status === SyncOperationStatus.CONFLICT).length,
            lastSyncTime: null,
            nextSyncTime: null,
            averageSyncDuration: 0,
            networkStatus
        };
        try {
            const storedStats = await this.secureStorage.getCriticalData('sync_statistics');
            if (storedStats) {
                stats.lastSyncTime = storedStats.lastSyncTime ? new Date(storedStats.lastSyncTime) : null;
                stats.averageSyncDuration = storedStats.averageSyncDuration || 0;
            }
        }
        catch (error) {
            console.error('Error loading sync stats:', error);
        }
        // Calculate next sync time
        if (this.config.enableBackgroundSync && this.syncTimer) {
            stats.nextSyncTime = new Date(Date.now() + this.config.syncInterval);
        }
        return stats;
    }
    /**
     * Force immediate synchronization
     * Requirements: 5.1 - Allow manual sync trigger
     */
    async forcSync() {
        if (!this.isOnline) {
            throw new AuthError(AuthErrorCode.NETWORK_ERROR, 'Sin conexión a internet');
        }
        await this.performSync();
    }
    /**
     * Clear completed operations from queue
     * Requirements: 5.1 - Queue maintenance
     */
    async clearCompletedOperations() {
        const initialCount = this.syncQueue.length;
        this.syncQueue = this.syncQueue.filter(op => op.status !== SyncOperationStatus.COMPLETED);
        await this.saveSyncQueue();
        return initialCount - this.syncQueue.length;
    }
    /**
     * Update sync configuration
     * Requirements: 5.1 - Allow configuration updates
     */
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        await this.secureStorage.storeCriticalData('sync_config', this.config);
        // Restart background sync if interval changed
        if (newConfig.syncInterval && this.config.enableBackgroundSync) {
            this.stopBackgroundSync();
            this.startBackgroundSync();
        }
    }
    /**
     * Cleanup and destroy service
     */
    destroy() {
        this.stopBackgroundSync();
        this.stopNetworkMonitoring();
    }
    // Private helper methods
    generateOperationId() {
        return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getDefaultPriority(type, userRole) {
        // Higher priority for patron operations if configured
        const roleBonus = (this.config.prioritizeUserRole && userRole === UserRole.PATRON) ? 10 : 0;
        switch (type) {
            case SyncOperationType.CREATE_ASSOCIATION:
            case SyncOperationType.REMOVE_ASSOCIATION:
                return 90 + roleBonus;
            case SyncOperationType.UPDATE_PROFILE:
                return 80 + roleBonus;
            case SyncOperationType.CREATE_SERVICE:
            case SyncOperationType.CREATE_EXPENSE:
                return 70 + roleBonus;
            case SyncOperationType.UPDATE_SERVICE:
            case SyncOperationType.UPDATE_EXPENSE:
                return 60 + roleBonus;
            case SyncOperationType.DELETE_SERVICE:
            case SyncOperationType.DELETE_EXPENSE:
                return 50 + roleBonus;
            default:
                return 40 + roleBonus;
        }
    }
    sortQueueByPriority() {
        this.syncQueue.sort((a, b) => {
            // First by priority (higher first)
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            // Then by timestamp (older first)
            return a.timestamp.getTime() - b.timestamp.getTime();
        });
    }
    async loadSyncQueue() {
        try {
            const queueData = await this.secureStorage.getCriticalData('sync_queue');
            if (queueData && Array.isArray(queueData)) {
                this.syncQueue = queueData.map(op => ({
                    ...op,
                    timestamp: new Date(op.timestamp)
                }));
                this.sortQueueByPriority();
            }
        }
        catch (error) {
            console.error('Error loading sync queue:', error);
            this.syncQueue = [];
        }
    }
    async saveSyncQueue() {
        try {
            await this.secureStorage.storeCriticalData('sync_queue', this.syncQueue);
        }
        catch (error) {
            console.error('Error saving sync queue:', error);
        }
    }
    cleanupCompletedOperations() {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        this.syncQueue = this.syncQueue.filter(op => op.status !== SyncOperationStatus.COMPLETED ||
            op.timestamp > cutoffTime);
    }
    setupNetworkMonitoring() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateNetworkStatus();
            if (!this.syncInProgress) {
                setTimeout(() => this.performSync(), 1000);
            }
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateNetworkStatus();
        });
        // Periodic network status check
        this.networkStatusTimer = setInterval(() => {
            this.updateNetworkStatus();
        }, 60000); // Check every minute
    }
    stopNetworkMonitoring() {
        if (this.networkStatusTimer) {
            clearInterval(this.networkStatusTimer);
            this.networkStatusTimer = null;
        }
    }
    async updateNetworkStatus() {
        const status = {
            isOnline: navigator.onLine,
            lastChecked: new Date()
        };
        // Add connection info if available
        if ('connection' in navigator) {
            const connection = navigator.connection;
            status.connectionType = connection.type;
            status.effectiveType = connection.effectiveType;
            status.downlink = connection.downlink;
            status.rtt = connection.rtt;
        }
        try {
            await this.secureStorage.storeCriticalData('network_status', status);
        }
        catch (error) {
            console.error('Error storing network status:', error);
        }
    }
    async getNetworkStatus() {
        try {
            const status = await this.secureStorage.getCriticalData('network_status');
            if (status) {
                return {
                    ...status,
                    lastChecked: new Date(status.lastChecked)
                };
            }
        }
        catch (error) {
            console.error('Error retrieving network status:', error);
        }
        return {
            isOnline: navigator.onLine,
            lastChecked: new Date()
        };
    }
    startBackgroundSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        this.syncTimer = setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.performSync();
            }
        }, this.config.syncInterval);
    }
    stopBackgroundSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }
    async updateSyncStats(duration) {
        try {
            const stats = {
                lastSyncTime: new Date(),
                averageSyncDuration: duration
            };
            await this.secureStorage.storeCriticalData('sync_statistics', stats);
        }
        catch (error) {
            console.error('Error updating sync stats:', error);
        }
    }
    // Operation execution methods (simplified for demo)
    async executeCreateService(operation) {
        // Simulate API call to create service
        // In real implementation, this would make HTTP request to backend
        return { success: true };
    }
    async executeUpdateService(operation) {
        // Simulate conflict detection
        // In real implementation, check server version vs local version
        return { success: true };
    }
    async executeDeleteService(operation) {
        return { success: true };
    }
    async executeCreateExpense(operation) {
        return { success: true };
    }
    async executeUpdateExpense(operation) {
        return { success: true };
    }
    async executeDeleteExpense(operation) {
        return { success: true };
    }
    async executeUpdateProfile(operation) {
        return { success: true };
    }
    async executeCreateAssociation(operation) {
        return { success: true };
    }
    async executeRemoveAssociation(operation) {
        return { success: true };
    }
    async applyServerChanges(operation, serverData) {
        // Apply server changes to local storage
        // Implementation depends on operation type
    }
    async mergeConflictData(localData, serverData, conflictFields) {
        // Simple merge strategy - prefer local for user-modified fields, server for system fields
        const merged = { ...serverData };
        for (const field of conflictFields) {
            if (field.includes('user') || field.includes('created') || field.includes('modified')) {
                merged[field] = localData[field];
            }
        }
        return merged;
    }
    async storeConflictForManualResolution(conflict) {
        try {
            const existingConflicts = await this.getConflicts();
            existingConflicts.push(conflict);
            await this.secureStorage.storeCriticalData('sync_conflicts', existingConflicts);
        }
        catch (error) {
            console.error('Error storing conflict:', error);
        }
    }
}
//# sourceMappingURL=data-sync.js.map