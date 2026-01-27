/**
 * Data Synchronization Demo
 * Demonstrates offline operation queue and conflict resolution capabilities
 * Requirements: 5.1, 5.3 - Demo sync functionality
 */
import { SecureStorageService } from '../services/secure-storage';
import { RoleService } from '../services/role-service';
import { ServiceExpenseIntegrationService } from '../services/service-expense-integration';
import { User } from '../types';
/**
 * Demo class for data synchronization functionality
 */
export declare class DataSyncDemo {
    private syncBridge;
    private demoContainer;
    private statusContainer;
    private operationsContainer;
    private conflictsContainer;
    constructor(container: HTMLElement, secureStorage: SecureStorageService, roleService: RoleService, serviceExpenseIntegration: ServiceExpenseIntegrationService, getCurrentUser: () => User | null);
    /**
     * Initialize demo interface
     */
    private initializeDemo;
    /**
     * Setup event listeners for demo interactions
     */
    private setupEventListeners;
    /**
     * Start periodic status updates
     */
    private startStatusUpdates;
    /**
     * Update demo status display
     */
    private updateStatus;
    /**
     * Update network status display
     */
    private updateNetworkStatus;
    /**
     * Update sync statistics display
     */
    private updateSyncStats;
    /**
     * Update operations list display
     */
    private updateOperationsList;
    /**
     * Update conflicts list display
     */
    private updateConflictsList;
    /**
     * Update data lists with sync status
     */
    private updateDataLists;
    /**
     * Toggle offline mode simulation
     */
    private toggleOfflineMode;
    /**
     * Force synchronization
     */
    private forceSync;
    /**
     * Create demo service
     */
    private createDemoService;
    /**
     * Create demo expense
     */
    private createDemoExpense;
    /**
     * Update demo profile
     */
    private updateDemoProfile;
    /**
     * Create demo association
     */
    private createDemoAssociation;
    /**
     * Simulate a conflict scenario
     */
    private simulateConflict;
    /**
     * Clear completed operations
     */
    private clearCompleted;
    /**
     * Cancel operation (called from HTML)
     */
    cancelOperation(operationId: string): Promise<void>;
    /**
     * Resolve conflict (called from HTML)
     */
    resolveConflict(conflictId: string, strategy: string): Promise<void>;
    /**
     * Show notification to user
     */
    private showNotification;
    /**
     * Cleanup demo
     */
    destroy(): void;
}
/**
 * Initialize data sync demo
 */
export declare function initializeDataSyncDemo(container: HTMLElement, secureStorage: SecureStorageService, roleService: RoleService, serviceExpenseIntegration: ServiceExpenseIntegrationService, getCurrentUser: () => User | null): DataSyncDemo;
//# sourceMappingURL=data-sync-demo.d.ts.map