/**
 * Data Synchronization Service
 * Implements offline operation queue and conflict resolution for PWA
 * Requirements: 5.1 - Queue of pending operations, 5.3 - Conflict resolution
 */

import { 
  User, 
  UserRole, 
  AuthError, 
  AuthErrorCode,
  Permission
} from '../types';
import { SecureStorageService } from './secure-storage';
import { RoleService } from './role-service';
import { 
  ServiceExpenseIntegrationService,
  AuthenticatedServiceData,
  AuthenticatedExpenseData
} from './service-expense-integration';

/**
 * Types of operations that can be queued for synchronization
 */
export enum SyncOperationType {
  CREATE_SERVICE = 'create_service',
  UPDATE_SERVICE = 'update_service',
  DELETE_SERVICE = 'delete_service',
  CREATE_EXPENSE = 'create_expense',
  UPDATE_EXPENSE = 'update_expense',
  DELETE_EXPENSE = 'delete_expense',
  UPDATE_PROFILE = 'update_profile',
  CREATE_ASSOCIATION = 'create_association',
  REMOVE_ASSOCIATION = 'remove_association'
}

/**
 * Status of a pending operation
 */
export enum SyncOperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CONFLICT = 'conflict'
}

/**
 * Conflict resolution strategy
 */
export enum ConflictResolutionStrategy {
  CLIENT_WINS = 'client_wins',      // Local changes take precedence
  SERVER_WINS = 'server_wins',      // Server changes take precedence
  MERGE = 'merge',                  // Attempt to merge changes
  MANUAL = 'manual'                 // Require user intervention
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
  originalData?: any; // For conflict resolution
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: number; // Higher number = higher priority
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
  retryDelay: number; // milliseconds
  batchSize: number;
  syncInterval: number; // milliseconds
  conflictResolutionStrategy: ConflictResolutionStrategy;
  prioritizeUserRole: boolean;
  enableBackgroundSync: boolean;
  maxQueueSize: number;
}

/**
 * Data Synchronization Service
 * Handles offline operations and data synchronization with conflict resolution
 */
export class DataSyncService {
  private readonly SYNC_QUEUE_KEY = 'taxi_sync_queue';
  private readonly SYNC_CONFIG_KEY = 'taxi_sync_config';
  private readonly SYNC_STATS_KEY = 'taxi_sync_stats';
  private readonly NETWORK_STATUS_KEY = 'taxi_network_status';
  
  private syncQueue: PendingOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private networkStatusTimer: NodeJS.Timeout | null = null;
  
  private readonly defaultConfig: SyncConfig = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    batchSize: 10,
    syncInterval: 30000, // 30 seconds
    conflictResolutionStrategy: ConflictResolutionStrategy.CLIENT_WINS,
    prioritizeUserRole: true,
    enableBackgroundSync: true,
    maxQueueSize: 100
  };

  constructor(
    private secureStorage: SecureStorageService,
    private roleService: RoleService,
    private serviceExpenseIntegration: ServiceExpenseIntegrationService,
    private getCurrentUser: () => User | null,
    private config: Partial<SyncConfig> = {}
  ) {
    this.config = { ...this.defaultConfig, ...config };
    this.initializeSync();
  }

  /**
   * Initialize synchronization service
   * Requirements: 5.1 - Initialize queue of pending operations
   */
  private async initializeSync(): Promise<void> {
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
    } catch (error) {
      console.error('Error initializing sync service:', error);
    }
  }

  /**
   * Add operation to sync queue
   * Requirements: 5.1 - Queue of pending operations for offline scenarios
   */
  async queueOperation(
    type: SyncOperationType,
    data: any,
    options: {
      priority?: number;
      conflictResolution?: ConflictResolutionStrategy;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    // Check queue size limit
    if (this.syncQueue.length >= this.config.maxQueueSize!) {
      // Remove oldest completed operations to make space
      this.cleanupCompletedOperations();
      
      if (this.syncQueue.length >= this.config.maxQueueSize!) {
        throw new AuthError(
          AuthErrorCode.VALIDATION_ERROR,
          'Cola de sincronización llena'
        );
      }
    }

    const operation: PendingOperation = {
      id: this.generateOperationId(),
      type,
      status: SyncOperationStatus.PENDING,
      userId: currentUser.id,
      userRole: currentUser.rol,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.config.maxRetries!,
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
  async performSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      const pendingOps = this.syncQueue.filter(op => 
        op.status === SyncOperationStatus.PENDING || 
        (op.status === SyncOperationStatus.FAILED && op.retryCount < op.maxRetries)
      );

      if (pendingOps.length === 0) {
        return;
      }

      // Process operations in batches
      const batchSize = this.config.batchSize!;
      for (let i = 0; i < pendingOps.length; i += batchSize) {
        const batch = pendingOps.slice(i, i + batchSize);
        await this.processBatch(batch);
      }

      // Update sync statistics
      await this.updateSyncStats(Date.now() - startTime);

    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
      await this.saveSyncQueue();
    }
  }

  /**
   * Process a batch of operations
   * Requirements: 5.3 - Handle conflicts during synchronization
   */
  private async processBatch(operations: PendingOperation[]): Promise<void> {
    for (const operation of operations) {
      try {
        operation.status = SyncOperationStatus.IN_PROGRESS;
        
        const result = await this.executeOperation(operation);
        
        if (result.success) {
          operation.status = SyncOperationStatus.COMPLETED;
        } else if (result.conflict) {
          operation.status = SyncOperationStatus.CONFLICT;
          await this.handleConflict(operation, result.conflict);
        } else {
          operation.status = SyncOperationStatus.FAILED;
          operation.retryCount++;
          operation.error = result.error;
        }
        
      } catch (error) {
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
  private async executeOperation(operation: PendingOperation): Promise<{
    success: boolean;
    conflict?: SyncConflict;
    error?: string;
  }> {
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
    } catch (error) {
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
  private async handleConflict(operation: PendingOperation, conflict: SyncConflict): Promise<void> {
    const strategy = operation.conflictResolution || this.config.conflictResolutionStrategy!;
    
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
        const mergedData = await this.mergeConflictData(
          operation.data,
          conflict.serverData,
          conflict.conflictFields
        );
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
  getPendingOperations(userId?: string): PendingOperation[] {
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
    } else if (targetUserId !== currentUser.id) {
      // Taxistas can only see their own operations
      return [];
    }

    return this.syncQueue.filter(op => 
      op.userId === targetUserId &&
      op.status !== SyncOperationStatus.COMPLETED
    );
  }

  /**
   * Get synchronization conflicts requiring manual resolution
   * Requirements: 5.3 - Provide conflict information for manual resolution
   */
  async getConflicts(): Promise<SyncConflict[]> {
    try {
      const conflictsData = await this.secureStorage.getCriticalData('sync_conflicts');
      return conflictsData || [];
    } catch (error) {
      console.error('Error retrieving conflicts:', error);
      return [];
    }
  }

  /**
   * Resolve a conflict manually
   * Requirements: 5.3 - Allow manual conflict resolution
   */
  async resolveConflict(
    conflictId: string, 
    resolution: ConflictResolutionStrategy,
    resolvedData?: any
  ): Promise<void> {
    const conflicts = await this.getConflicts();
    const conflict = conflicts.find(c => c.operationId === conflictId);
    
    if (!conflict) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        'Conflicto no encontrado'
      );
    }

    const operation = this.syncQueue.find(op => op.id === conflictId);
    if (!operation) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        'Operación no encontrada'
      );
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
        operation.data = resolvedData || await this.mergeConflictData(
          conflict.localData,
          conflict.serverData,
          conflict.conflictFields
        );
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
  async cancelOperation(operationId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Usuario no autenticado'
      );
    }

    const operationIndex = this.syncQueue.findIndex(op => op.id === operationId);
    if (operationIndex === -1) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        'Operación no encontrada'
      );
    }

    const operation = this.syncQueue[operationIndex];
    
    // Verify user can cancel this operation
    if (operation.userId !== currentUser.id && 
        !(currentUser.rol === UserRole.PATRON && 
          this.roleService.getAccessibleUsers().some(u => u.id === operation.userId))) {
      throw new AuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        'Sin permisos para cancelar esta operación'
      );
    }

    // Remove operation from queue
    this.syncQueue.splice(operationIndex, 1);
    await this.saveSyncQueue();
  }

  /**
   * Get synchronization statistics
   * Requirements: 5.1 - Provide sync status information
   */
  async getSyncStats(): Promise<SyncStats> {
    const networkStatus = await this.getNetworkStatus();
    
    const stats: SyncStats = {
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
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }

    // Calculate next sync time
    if (this.config.enableBackgroundSync && this.syncTimer) {
      stats.nextSyncTime = new Date(Date.now() + this.config.syncInterval!);
    }

    return stats;
  }

  /**
   * Force immediate synchronization
   * Requirements: 5.1 - Allow manual sync trigger
   */
  async forcSync(): Promise<void> {
    if (!this.isOnline) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Sin conexión a internet'
      );
    }

    await this.performSync();
  }

  /**
   * Clear completed operations from queue
   * Requirements: 5.1 - Queue maintenance
   */
  async clearCompletedOperations(): Promise<number> {
    const initialCount = this.syncQueue.length;
    this.syncQueue = this.syncQueue.filter(op => op.status !== SyncOperationStatus.COMPLETED);
    await this.saveSyncQueue();
    return initialCount - this.syncQueue.length;
  }

  /**
   * Update sync configuration
   * Requirements: 5.1 - Allow configuration updates
   */
  async updateConfig(newConfig: Partial<SyncConfig>): Promise<void> {
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
  destroy(): void {
    this.stopBackgroundSync();
    this.stopNetworkMonitoring();
  }

  // Private helper methods

  private generateOperationId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultPriority(type: SyncOperationType, userRole: UserRole): number {
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

  private sortQueueByPriority(): void {
    this.syncQueue.sort((a, b) => {
      // First by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Then by timestamp (older first)
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await this.secureStorage.getCriticalData('sync_queue');
      if (queueData && Array.isArray(queueData)) {
        this.syncQueue = queueData.map(op => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
        this.sortQueueByPriority();
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await this.secureStorage.storeCriticalData('sync_queue', this.syncQueue);
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  private cleanupCompletedOperations(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    this.syncQueue = this.syncQueue.filter(op => 
      op.status !== SyncOperationStatus.COMPLETED || 
      op.timestamp > cutoffTime
    );
  }

  private setupNetworkMonitoring(): void {
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

  private stopNetworkMonitoring(): void {
    if (this.networkStatusTimer) {
      clearInterval(this.networkStatusTimer);
      this.networkStatusTimer = null;
    }
  }

  private async updateNetworkStatus(): Promise<void> {
    const status: NetworkStatus = {
      isOnline: navigator.onLine,
      lastChecked: new Date()
    };

    // Add connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      status.connectionType = connection.type;
      status.effectiveType = connection.effectiveType;
      status.downlink = connection.downlink;
      status.rtt = connection.rtt;
    }

    try {
      await this.secureStorage.storeCriticalData('network_status', status);
    } catch (error) {
      console.error('Error storing network status:', error);
    }
  }

  private async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      const status = await this.secureStorage.getCriticalData('network_status');
      if (status) {
        return {
          ...status,
          lastChecked: new Date(status.lastChecked)
        };
      }
    } catch (error) {
      console.error('Error retrieving network status:', error);
    }

    return {
      isOnline: navigator.onLine,
      lastChecked: new Date()
    };
  }

  private startBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performSync();
      }
    }, this.config.syncInterval);
  }

  private stopBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private async updateSyncStats(duration: number): Promise<void> {
    try {
      const stats = {
        lastSyncTime: new Date(),
        averageSyncDuration: duration
      };
      
      await this.secureStorage.storeCriticalData('sync_statistics', stats);
    } catch (error) {
      console.error('Error updating sync stats:', error);
    }
  }

  // Operation execution methods (simplified for demo)
  
  private async executeCreateService(operation: PendingOperation): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    // Simulate API call to create service
    // In real implementation, this would make HTTP request to backend
    return { success: true };
  }

  private async executeUpdateService(operation: PendingOperation): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    // Simulate conflict detection
    // In real implementation, check server version vs local version
    return { success: true };
  }

  private async executeDeleteService(operation: PendingOperation): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    return { success: true };
  }

  private async executeCreateExpense(operation: PendingOperation): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    return { success: true };
  }

  private async executeUpdateExpense(operation: PendingOperation): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    return { success: true };
  }

  private async executeDeleteExpense(operation: PendingOperation): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    return { success: true };
  }

  private async executeUpdateProfile(operation: PendingOperation): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    return { success: true };
  }

  private async executeCreateAssociation(operation: PendingOperation): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    return { success: true };
  }

  private async executeRemoveAssociation(operation: PendingOperation): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
    return { success: true };
  }

  private async applyServerChanges(operation: PendingOperation, serverData: any): Promise<void> {
    // Apply server changes to local storage
    // Implementation depends on operation type
  }

  private async mergeConflictData(localData: any, serverData: any, conflictFields: string[]): Promise<any> {
    // Simple merge strategy - prefer local for user-modified fields, server for system fields
    const merged = { ...serverData };
    
    for (const field of conflictFields) {
      if (field.includes('user') || field.includes('created') || field.includes('modified')) {
        merged[field] = localData[field];
      }
    }
    
    return merged;
  }

  private async storeConflictForManualResolution(conflict: SyncConflict): Promise<void> {
    try {
      const existingConflicts = await this.getConflicts();
      existingConflicts.push(conflict);
      await this.secureStorage.storeCriticalData('sync_conflicts', existingConflicts);
    } catch (error) {
      console.error('Error storing conflict:', error);
    }
  }
}