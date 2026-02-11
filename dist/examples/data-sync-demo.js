/**
 * Data Synchronization Demo
 * Demonstrates offline operation queue and conflict resolution capabilities
 * Requirements: 5.1, 5.3 - Demo sync functionality
 */
import { createDataSyncBridge } from '../integration/data-sync-bridge';
import { ConflictResolutionStrategy } from '../services/data-sync';
/**
 * Demo class for data synchronization functionality
 */
export class DataSyncDemo {
    constructor(container, secureStorage, roleService, serviceExpenseIntegration, getCurrentUser) {
        this.demoContainer = container;
        // Create sync bridge with demo configuration
        this.syncBridge = createDataSyncBridge(secureStorage, roleService, serviceExpenseIntegration, getCurrentUser, {
            maxRetries: 3,
            syncInterval: 10000, // 10 seconds for demo
            batchSize: 5,
            conflictResolutionStrategy: ConflictResolutionStrategy.CLIENT_WINS,
            prioritizeUserRole: true,
            enableBackgroundSync: true
        });
        this.initializeDemo();
    }
    /**
     * Initialize demo interface
     */
    initializeDemo() {
        this.demoContainer.innerHTML = `
      <div class="data-sync-demo">
        <h2>🔄 Data Synchronization Demo</h2>
        <p>Demonstrates offline operation queue and conflict resolution</p>
        
        <!-- Network Status -->
        <div class="network-status">
          <h3>📡 Network Status</h3>
          <div id="network-info"></div>
          <button id="toggle-offline">Toggle Offline Mode</button>
          <button id="force-sync">Force Sync</button>
        </div>

        <!-- Sync Statistics -->
        <div class="sync-stats">
          <h3>📊 Sync Statistics</h3>
          <div id="sync-stats"></div>
        </div>

        <!-- Operations Demo -->
        <div class="operations-demo">
          <h3>⚡ Operations</h3>
          <div class="operation-buttons">
            <button id="create-service">Create Service (Offline)</button>
            <button id="create-expense">Create Expense (Offline)</button>
            <button id="update-profile">Update Profile</button>
            <button id="create-association">Create Association</button>
          </div>
          <div id="operations-list"></div>
        </div>

        <!-- Conflicts Demo -->
        <div class="conflicts-demo">
          <h3>⚠️ Conflicts</h3>
          <div class="conflict-buttons">
            <button id="simulate-conflict">Simulate Conflict</button>
            <button id="clear-completed">Clear Completed</button>
          </div>
          <div id="conflicts-list"></div>
        </div>

        <!-- Data with Sync Status -->
        <div class="data-demo">
          <h3>📋 Data with Sync Status</h3>
          <div id="services-list"></div>
          <div id="expenses-list"></div>
        </div>
      </div>
    `;
        this.statusContainer = this.demoContainer.querySelector('#network-info');
        this.operationsContainer = this.demoContainer.querySelector('#operations-list');
        this.conflictsContainer = this.demoContainer.querySelector('#conflicts-list');
        this.setupEventListeners();
        this.startStatusUpdates();
    }
    /**
     * Setup event listeners for demo interactions
     */
    setupEventListeners() {
        // Network controls
        this.demoContainer.querySelector('#toggle-offline')?.addEventListener('click', () => {
            this.toggleOfflineMode();
        });
        this.demoContainer.querySelector('#force-sync')?.addEventListener('click', () => {
            this.forceSync();
        });
        // Operation buttons
        this.demoContainer.querySelector('#create-service')?.addEventListener('click', () => {
            this.createDemoService();
        });
        this.demoContainer.querySelector('#create-expense')?.addEventListener('click', () => {
            this.createDemoExpense();
        });
        this.demoContainer.querySelector('#update-profile')?.addEventListener('click', () => {
            this.updateDemoProfile();
        });
        this.demoContainer.querySelector('#create-association')?.addEventListener('click', () => {
            this.createDemoAssociation();
        });
        // Conflict buttons
        this.demoContainer.querySelector('#simulate-conflict')?.addEventListener('click', () => {
            this.simulateConflict();
        });
        this.demoContainer.querySelector('#clear-completed')?.addEventListener('click', () => {
            this.clearCompleted();
        });
    }
    /**
     * Start periodic status updates
     */
    startStatusUpdates() {
        this.updateStatus();
        setInterval(() => this.updateStatus(), 2000);
    }
    /**
     * Update demo status display
     */
    async updateStatus() {
        try {
            const [dashboard, networkStatus, offlineCapabilities] = await Promise.all([
                this.syncBridge.getSyncDashboard(),
                this.syncBridge.getNetworkStatus(),
                Promise.resolve(this.syncBridge.getOfflineCapabilities())
            ]);
            this.updateNetworkStatus(networkStatus, offlineCapabilities);
            this.updateSyncStats(dashboard);
            this.updateOperationsList(dashboard);
            this.updateConflictsList(dashboard);
            this.updateDataLists();
        }
        catch (error) {
            console.error('Error updating status:', error);
        }
    }
    /**
     * Update network status display
     */
    updateNetworkStatus(networkStatus, capabilities) {
        const isOffline = this.syncBridge.isOfflineMode();
        this.statusContainer.innerHTML = `
      <div class="status-item ${isOffline ? 'offline' : 'online'}">
        <strong>Status:</strong> ${isOffline ? '🔴 Offline' : '🟢 Online'}
      </div>
      <div class="status-item">
        <strong>Connection:</strong> ${networkStatus.connectionType || 'Unknown'}
      </div>
      <div class="status-item">
        <strong>Last Checked:</strong> ${networkStatus.lastChecked.toLocaleTimeString()}
      </div>
      <div class="capabilities">
        <strong>Offline Capabilities:</strong>
        <ul>
          <li>Create Services: ${capabilities.canCreateServices ? '✅' : '❌'}</li>
          <li>Create Expenses: ${capabilities.canCreateExpenses ? '✅' : '❌'}</li>
          <li>Update Profile: ${capabilities.canUpdateProfile ? '✅' : '❌'}</li>
          <li>Manage Associations: ${capabilities.canManageAssociations ? '✅' : '❌'}</li>
        </ul>
      </div>
    `;
    }
    /**
     * Update sync statistics display
     */
    updateSyncStats(dashboard) {
        const stats = dashboard.stats;
        const statsContainer = this.demoContainer.querySelector('#sync-stats');
        statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <strong>Total Operations:</strong> ${stats.totalOperations}
        </div>
        <div class="stat-item">
          <strong>Pending:</strong> ${stats.pendingOperations}
        </div>
        <div class="stat-item">
          <strong>Completed:</strong> ${stats.completedOperations}
        </div>
        <div class="stat-item">
          <strong>Failed:</strong> ${stats.failedOperations}
        </div>
        <div class="stat-item">
          <strong>Conflicts:</strong> ${stats.conflictOperations}
        </div>
        <div class="stat-item">
          <strong>Last Sync:</strong> ${stats.lastSyncTime ? stats.lastSyncTime.toLocaleTimeString() : 'Never'}
        </div>
      </div>
    `;
    }
    /**
     * Update operations list display
     */
    updateOperationsList(dashboard) {
        const operations = dashboard.pendingOperations.slice(0, 10);
        this.operationsContainer.innerHTML = operations.length > 0 ? `
      <div class="operations-list">
        ${operations.map(op => `
          <div class="operation-item ${op.status}">
            <div class="operation-header">
              <strong>${op.type}</strong>
              <span class="status-badge ${op.status}">${op.status}</span>
            </div>
            <div class="operation-details">
              <small>
                User: ${op.userRole} | 
                Priority: ${op.priority} | 
                Retries: ${op.retryCount}/${op.maxRetries} |
                ${op.timestamp.toLocaleTimeString()}
              </small>
            </div>
            <div class="operation-actions">
              <button onclick="dataSyncDemo.cancelOperation('${op.id}')" class="cancel-btn">Cancel</button>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<p>No pending operations</p>';
    }
    /**
     * Update conflicts list display
     */
    updateConflictsList(dashboard) {
        const conflicts = dashboard.conflicts;
        this.conflictsContainer.innerHTML = conflicts.length > 0 ? `
      <div class="conflicts-list">
        ${conflicts.map(conflict => `
          <div class="conflict-item">
            <div class="conflict-header">
              <strong>${conflict.type}</strong>
              <span class="conflict-time">${conflict.timestamp.toLocaleTimeString()}</span>
            </div>
            <div class="conflict-details">
              <div class="conflict-data">
                <div class="local-data">
                  <strong>Local:</strong>
                  <pre>${JSON.stringify(conflict.localData, null, 2)}</pre>
                </div>
                <div class="server-data">
                  <strong>Server:</strong>
                  <pre>${JSON.stringify(conflict.serverData, null, 2)}</pre>
                </div>
              </div>
              <div class="conflict-fields">
                <strong>Conflicting Fields:</strong> ${conflict.conflictFields.join(', ')}
              </div>
            </div>
            <div class="conflict-actions">
              <button onclick="dataSyncDemo.resolveConflict('${conflict.operationId}', 'client_wins')" class="resolve-btn">Use Local</button>
              <button onclick="dataSyncDemo.resolveConflict('${conflict.operationId}', 'server_wins')" class="resolve-btn">Use Server</button>
              <button onclick="dataSyncDemo.resolveConflict('${conflict.operationId}', 'merge')" class="resolve-btn">Merge</button>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<p>No conflicts</p>';
    }
    /**
     * Update data lists with sync status
     */
    updateDataLists() {
        // Demo services data
        const demoServices = [
            { id: 'service-1', description: 'Demo Service 1', amount: 100, createdAt: new Date() },
            { id: 'service-2', description: 'Demo Service 2', amount: 200, createdAt: new Date() }
        ];
        // Demo expenses data
        const demoExpenses = [
            { id: 'expense-1', description: 'Demo Expense 1', amount: 50, category: 'Fuel', createdAt: new Date() },
            { id: 'expense-2', description: 'Demo Expense 2', amount: 75, category: 'Maintenance', createdAt: new Date() }
        ];
        const servicesWithSync = this.syncBridge.enhanceServicesWithSyncStatus(demoServices);
        const expensesWithSync = this.syncBridge.enhanceExpensesWithSyncStatus(demoExpenses);
        // Update services list
        const servicesContainer = this.demoContainer.querySelector('#services-list');
        servicesContainer.innerHTML = `
      <h4>Services</h4>
      ${servicesWithSync.map(service => `
        <div class="data-item ${service.syncStatus}">
          <div class="data-header">
            <strong>${service.description}</strong>
            <span class="sync-badge ${service.syncStatus}">${service.syncStatus}</span>
          </div>
          <div class="data-details">
            Amount: $${service.amount} | 
            ${service.lastSyncAttempt ? `Last Sync: ${service.lastSyncAttempt.toLocaleTimeString()}` : 'Never synced'}
          </div>
        </div>
      `).join('')}
    `;
        // Update expenses list
        const expensesContainer = this.demoContainer.querySelector('#expenses-list');
        expensesContainer.innerHTML = `
      <h4>Expenses</h4>
      ${expensesWithSync.map(expense => `
        <div class="data-item ${expense.syncStatus}">
          <div class="data-header">
            <strong>${expense.description}</strong>
            <span class="sync-badge ${expense.syncStatus}">${expense.syncStatus}</span>
          </div>
          <div class="data-details">
            Amount: $${expense.amount} | Category: ${expense.category} |
            ${expense.lastSyncAttempt ? `Last Sync: ${expense.lastSyncAttempt.toLocaleTimeString()}` : 'Never synced'}
          </div>
        </div>
      `).join('')}
    `;
    }
    // ============================================================================
    // DEMO ACTIONS
    // ============================================================================
    /**
     * Toggle offline mode simulation
     */
    toggleOfflineMode() {
        // Simulate offline mode by overriding navigator.onLine
        const currentStatus = navigator.onLine;
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: !currentStatus
        });
        // Trigger online/offline events
        const event = new Event(!currentStatus ? 'offline' : 'online');
        window.dispatchEvent(event);
        this.showNotification(`Switched to ${!currentStatus ? 'offline' : 'online'} mode`);
    }
    /**
     * Force synchronization
     */
    async forceSync() {
        try {
            const result = await this.syncBridge.forceSync();
            if (result.success) {
                this.showNotification('Sync completed successfully');
            }
            else {
                this.showNotification(`Sync failed: ${result.error}`, 'error');
            }
        }
        catch (error) {
            this.showNotification('Sync error occurred', 'error');
        }
    }
    /**
     * Create demo service
     */
    async createDemoService() {
        const serviceData = {
            id: `service-${Date.now()}`,
            description: `Demo Service ${new Date().toLocaleTimeString()}`,
            amount: Math.floor(Math.random() * 500) + 50,
            userId: 'current-user',
            createdBy: 'current-user'
        };
        try {
            const result = await this.syncBridge.createService(serviceData);
            if (result.success) {
                this.showNotification(`Service created ${result.willSyncWhenOnline ? '(will sync when online)' : 'and synced'}`);
            }
            else {
                this.showNotification(`Failed to create service: ${result.error}`, 'error');
            }
        }
        catch (error) {
            this.showNotification('Error creating service', 'error');
        }
    }
    /**
     * Create demo expense
     */
    async createDemoExpense() {
        const categories = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Tolls'];
        const expenseData = {
            id: `expense-${Date.now()}`,
            description: `Demo Expense ${new Date().toLocaleTimeString()}`,
            amount: Math.floor(Math.random() * 200) + 20,
            category: categories[Math.floor(Math.random() * categories.length)],
            userId: 'current-user',
            createdBy: 'current-user'
        };
        try {
            const result = await this.syncBridge.createExpense(expenseData);
            if (result.success) {
                this.showNotification(`Expense created ${result.willSyncWhenOnline ? '(will sync when online)' : 'and synced'}`);
            }
            else {
                this.showNotification(`Failed to create expense: ${result.error}`, 'error');
            }
        }
        catch (error) {
            this.showNotification('Error creating expense', 'error');
        }
    }
    /**
     * Update demo profile
     */
    async updateDemoProfile() {
        const profileUpdates = {
            nombre: `Updated Name ${new Date().toLocaleTimeString()}`,
            telefono: `555-${Math.floor(Math.random() * 9000) + 1000}`
        };
        try {
            const result = await this.syncBridge.updateProfile(profileUpdates);
            if (result.success) {
                this.showNotification(`Profile updated ${result.willSyncWhenOnline ? '(will sync when online)' : 'and synced'}`);
            }
            else {
                this.showNotification(`Failed to update profile: ${result.error}`, 'error');
            }
        }
        catch (error) {
            this.showNotification('Error updating profile', 'error');
        }
    }
    /**
     * Create demo association
     */
    async createDemoAssociation() {
        const patronId = 'patron-1';
        const taxistaId = `taxista-${Date.now()}`;
        try {
            const result = await this.syncBridge.createAssociation(patronId, taxistaId);
            if (result.success) {
                this.showNotification(`Association created ${result.willSyncWhenOnline ? '(will sync when online)' : 'and synced'}`);
            }
            else {
                this.showNotification(`Failed to create association: ${result.error}`, 'error');
            }
        }
        catch (error) {
            this.showNotification('Error creating association', 'error');
        }
    }
    /**
     * Simulate a conflict scenario
     */
    async simulateConflict() {
        // Create an operation that will conflict
        const serviceData = {
            id: 'conflict-service',
            description: 'Service with Conflict',
            amount: 100,
            userId: 'current-user'
        };
        try {
            const result = await this.syncBridge.updateService('conflict-service', serviceData, ConflictResolutionStrategy.MANUAL);
            if (result.success) {
                this.showNotification('Conflict scenario created (check conflicts section)');
            }
        }
        catch (error) {
            this.showNotification('Error simulating conflict', 'error');
        }
    }
    /**
     * Clear completed operations
     */
    async clearCompleted() {
        try {
            const result = await this.syncBridge.clearCompletedOperations();
            this.showNotification(`Cleared ${result.clearedCount} completed operations`);
        }
        catch (error) {
            this.showNotification('Error clearing operations', 'error');
        }
    }
    // ============================================================================
    // PUBLIC METHODS FOR GLOBAL ACCESS
    // ============================================================================
    /**
     * Cancel operation (called from HTML)
     */
    async cancelOperation(operationId) {
        try {
            const result = await this.syncBridge.cancelOperation(operationId);
            if (result.success) {
                this.showNotification('Operation cancelled');
            }
            else {
                this.showNotification(`Failed to cancel: ${result.error}`, 'error');
            }
        }
        catch (error) {
            this.showNotification('Error cancelling operation', 'error');
        }
    }
    /**
     * Resolve conflict (called from HTML)
     */
    async resolveConflict(conflictId, strategy) {
        try {
            const resolutionStrategy = strategy;
            const result = await this.syncBridge.resolveConflict(conflictId, resolutionStrategy);
            if (result.success) {
                this.showNotification(`Conflict resolved using ${strategy} strategy`);
            }
            else {
                this.showNotification(`Failed to resolve conflict: ${result.error}`, 'error');
            }
        }
        catch (error) {
            this.showNotification('Error resolving conflict', 'error');
        }
    }
    /**
     * Show notification to user
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      border-radius: 4px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    /**
     * Cleanup demo
     */
    destroy() {
        this.syncBridge.destroy();
    }
}
// Global reference for HTML onclick handlers
let dataSyncDemo;
/**
 * Initialize data sync demo
 */
export function initializeDataSyncDemo(container, secureStorage, roleService, serviceExpenseIntegration, getCurrentUser) {
    dataSyncDemo = new DataSyncDemo(container, secureStorage, roleService, serviceExpenseIntegration, getCurrentUser);
    // Make globally accessible for HTML handlers
    window.dataSyncDemo = dataSyncDemo;
    return dataSyncDemo;
}
//# sourceMappingURL=data-sync-demo.js.map