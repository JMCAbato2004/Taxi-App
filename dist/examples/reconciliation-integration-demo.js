"use strict";
/**
 * Reconciliation Integration Demo
 * Demonstrates how to integrate role-based authentication with existing reconciliation functionality
 * Requirements: 5.2, 5.4
 */
/**
 * Demo script showing role-aware reconciliation integration
 */
async function demonstrateReconciliationIntegration() {
    console.log('🚀 Starting Reconciliation Integration Demo');
    console.log('==========================================');
    try {
        // Step 1: Initialize authentication services (assuming they're already set up)
        console.log('\n1. Initializing Authentication Services...');
        if (!window.authServiceInstance || !window.roleServiceInstance) {
            console.log('⚠️  Authentication services not found. Please ensure auth system is initialized.');
            return;
        }
        // Step 2: Create reconciliation bridge
        console.log('\n2. Creating Reconciliation Bridge...');
        const bridge = new window.ReconciliationBridge();
        const initialized = await bridge.initialize(window.authServiceInstance, window.roleServiceInstance);
        if (!initialized) {
            console.log('❌ Failed to initialize reconciliation bridge');
            return;
        }
        // Step 3: Demonstrate role-based filtering
        console.log('\n3. Demonstrating Role-Based Data Filtering...');
        // Sample data for demonstration
        const sampleServices = [
            {
                id: 'service_1',
                userId: 'user_patron_1',
                createdBy: 'user_taxista_1',
                numeroTaxista: 'TX001',
                date: new Date('2024-01-15'),
                startTime: '09:00',
                totalAmount: 25.50,
                paymentType: 'cash',
                isArticulated: false
            },
            {
                id: 'service_2',
                userId: 'user_patron_1',
                createdBy: 'user_taxista_2',
                numeroTaxista: 'TX002',
                date: new Date('2024-01-15'),
                startTime: '10:30',
                totalAmount: 18.75,
                paymentType: 'card',
                isArticulated: true
            },
            {
                id: 'service_3',
                userId: 'user_patron_2',
                createdBy: 'user_taxista_3',
                numeroTaxista: 'TX003',
                date: new Date('2024-01-15'),
                startTime: '14:15',
                totalAmount: 32.00,
                paymentType: 'app',
                platform: 'freenow',
                isArticulated: false
            }
        ];
        const sampleExpenses = [
            {
                id: 'expense_1',
                userId: 'user_taxista_1',
                createdBy: 'user_taxista_1',
                numeroTaxista: 'TX001',
                date: new Date('2024-01-15'),
                concept: 'Combustible',
                amount: 45.00,
                category: 'fuel'
            },
            {
                id: 'expense_2',
                userId: 'user_taxista_2',
                createdBy: 'user_taxista_2',
                numeroTaxista: 'TX002',
                date: new Date('2024-01-15'),
                concept: 'Mantenimiento',
                amount: 120.00,
                category: 'maintenance'
            }
        ];
        // Test filtering with different user contexts
        const currentUser = bridge.getCurrentUser();
        console.log(`Current user: ${currentUser?.nombre} (${currentUser?.rol})`);
        const filteredServices = bridge.filterServices(sampleServices);
        const filteredExpenses = bridge.filterExpenses(sampleExpenses);
        console.log(`Filtered services: ${filteredServices.length} of ${sampleServices.length}`);
        console.log(`Filtered expenses: ${filteredExpenses.length} of ${sampleExpenses.length}`);
        // Step 4: Demonstrate aggregated data for patrones
        console.log('\n4. Demonstrating Aggregated Data (for Patrones)...');
        if (currentUser?.rol === 'patron') {
            const aggregatedSummary = bridge.getAggregatedSummary(sampleServices, 'totalAmount');
            console.log('Aggregated Summary:', aggregatedSummary);
            if (aggregatedSummary) {
                console.log(`- Total records: ${aggregatedSummary.totalRecords}`);
                console.log(`- Total amount: €${aggregatedSummary.totalAmount.toFixed(2)}`);
                console.log(`- Associated taxistas: ${aggregatedSummary.associatedTaxistas}`);
                console.log('- By taxista:', aggregatedSummary.byTaxista);
            }
        }
        else {
            console.log('Current user is not a patron - aggregated data not available');
        }
        // Step 5: Demonstrate UI configuration
        console.log('\n5. Demonstrating UI Configuration...');
        const uiConfig = bridge.getUIConfig();
        console.log('UI Configuration:', uiConfig);
        // Step 6: Demonstrate enhanced storage manager
        console.log('\n6. Demonstrating Enhanced Storage Manager...');
        // Create a mock storage manager for demonstration
        const mockStorageManager = {
            getServices: () => sampleServices,
            getExpenses: () => sampleExpenses,
            getReconciliations: () => [],
            saveService: (service) => {
                console.log('Saving service:', service);
                return service;
            },
            saveExpense: (expense) => {
                console.log('Saving expense:', expense);
                return expense;
            }
        };
        const enhancedStorageManager = bridge.wrapStorageManager(mockStorageManager);
        // Test enhanced operations
        console.log('Testing enhanced getServices():');
        const enhancedServices = enhancedStorageManager.getServices();
        console.log(`Enhanced services count: ${enhancedServices.length}`);
        // Test adding user context to new service
        console.log('\nTesting addUserContextToService():');
        try {
            const newServiceData = {
                date: new Date(),
                startTime: '16:00',
                totalAmount: 28.50,
                paymentType: 'card',
                isArticulated: false
            };
            const enrichedService = bridge.addUserContextToService(newServiceData);
            console.log('Enriched service:', enrichedService);
        }
        catch (error) {
            console.log('Error adding user context:', error.message);
        }
        // Step 7: Demonstrate role-specific statistics
        console.log('\n7. Demonstrating Role-Specific Statistics...');
        const statistics = bridge.getStatistics(mockStorageManager);
        console.log('Statistics:', statistics);
        // Step 8: Demonstrate notifications
        console.log('\n8. Demonstrating Role-Specific Notifications...');
        const notifications = bridge.getNotifications(mockStorageManager);
        console.log('Notifications:', notifications);
        // Step 9: Demonstrate enhanced reconciliation module
        console.log('\n9. Demonstrating Enhanced Reconciliation Module...');
        if (window.ReconciliationModule) {
            const EnhancedReconciliationModule = window.createRoleAwareReconciliationModule(window.ReconciliationModule);
            console.log('Enhanced ReconciliationModule created');
            console.log('Is role-aware:', EnhancedReconciliationModule.isRoleAware());
            console.log('UI Config:', EnhancedReconciliationModule.getUIConfig());
        }
        else {
            console.log('⚠️  Original ReconciliationModule not found');
        }
        console.log('\n✅ Reconciliation Integration Demo completed successfully!');
        console.log('\nKey Features Demonstrated:');
        console.log('- Role-based data filtering');
        console.log('- Aggregated data for patrones');
        console.log('- User context enrichment');
        console.log('- Enhanced storage operations');
        console.log('- Role-specific UI configuration');
        console.log('- Statistics and notifications');
    }
    catch (error) {
        console.error('❌ Demo failed:', error);
    }
}
/**
 * Demo for different user roles
 */
async function demonstrateRoleScenarios() {
    console.log('\n🎭 Demonstrating Different Role Scenarios');
    console.log('=========================================');
    // This would typically involve switching between different authenticated users
    // For demo purposes, we'll show what each role would see
    console.log('\n📋 Scenario 1: Taxista User');
    console.log('- Can see only their own services and expenses');
    console.log('- Can input new operational data');
    console.log('- Cannot see aggregated data from other taxistas');
    console.log('- Gets notifications about their personal data');
    console.log('\n👤 Scenario 2: Patron User');
    console.log('- Can see services and expenses from associated taxistas');
    console.log('- Can view aggregated summaries across all associated taxistas');
    console.log('- Cannot directly input operational data (taxistas do this)');
    console.log('- Gets notifications about association management');
    console.log('- Can generate reconciliations with aggregated data');
    console.log('\n🔒 Security Features:');
    console.log('- All data access is validated based on user role and associations');
    console.log('- Patrones can only see data from their associated taxistas');
    console.log('- Taxistas can only see their own data');
    console.log('- All operations require proper authentication');
}
/**
 * Integration guide for existing applications
 */
function showIntegrationGuide() {
    console.log('\n📖 Integration Guide for Existing Applications');
    console.log('==============================================');
    console.log('\n1. Initialize Authentication System:');
    console.log(`
// Ensure auth services are available globally
window.authServiceInstance = new AuthService(jwtUtils, cryptoUtils);
window.roleServiceInstance = new RoleService(() => authServiceInstance.getCurrentUser());
  `);
    console.log('\n2. Enhance Existing Reconciliation Module:');
    console.log(`
// Wrap your existing ReconciliationModule
const EnhancedReconciliationModule = createRoleAwareReconciliationModule(ReconciliationModule);

// Use the enhanced module instead of the original
ReactDOM.render(
  React.createElement(EnhancedReconciliationModule, {
    theme: yourTheme,
    onBack: yourBackHandler
  }),
  document.getElementById('reconciliation-container')
);
  `);
    console.log('\n3. Access Role-Aware Features:');
    console.log(`
// Get role-specific UI configuration
const uiConfig = EnhancedReconciliationModule.getUIConfig();

// Get statistics with role-based filtering
const stats = EnhancedReconciliationModule.getStatistics(storageManager);

// Check if role awareness is active
if (EnhancedReconciliationModule.isRoleAware()) {
  // Role-based features are available
}
  `);
    console.log('\n4. Handle Role-Based Data:');
    console.log(`
// Data is automatically filtered based on user role
// Patrones see aggregated data from associated taxistas
// Taxistas see only their own data
// All operations respect role-based permissions
  `);
}
// Auto-run demo if in browser environment
if (typeof window !== 'undefined') {
    // Make demo functions available globally
    window.demonstrateReconciliationIntegration = demonstrateReconciliationIntegration;
    window.demonstrateRoleScenarios = demonstrateRoleScenarios;
    window.showIntegrationGuide = showIntegrationGuide;
    // Auto-run demo after a short delay to ensure other scripts are loaded
    setTimeout(() => {
        console.log('🎯 Reconciliation Integration Demo Available');
        console.log('Run: demonstrateReconciliationIntegration()');
        console.log('Run: demonstrateRoleScenarios()');
        console.log('Run: showIntegrationGuide()');
    }, 1000);
}
// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        demonstrateReconciliationIntegration,
        demonstrateRoleScenarios,
        showIntegrationGuide
    };
}
//# sourceMappingURL=reconciliation-integration-demo.js.map