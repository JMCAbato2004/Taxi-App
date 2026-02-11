// Service and Expense Integration Demo
// Demonstrates integration of service and expense management with authentication
// Requirements: 5.3, 5.5
import { AuthService } from '../services/auth-service';
import { RoleService } from '../services/role-service';
import { ReconciliationIntegrationService } from '../services/reconciliation-integration';
import { ServiceExpenseIntegrationService } from '../services/service-expense-integration';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
import { UserRole } from '../types';
/**
 * Demo class for service and expense integration
 */
export class ServiceExpenseIntegrationDemo {
    constructor() {
        // Initialize services
        const jwtUtils = new JWTUtils();
        const cryptoUtils = new CryptoUtils();
        this.authService = new AuthService(jwtUtils, cryptoUtils);
        this.roleService = new RoleService(this.authService);
        this.reconciliationService = new ReconciliationIntegrationService(this.roleService, () => this.authService.getCurrentUser());
        this.integrationService = new ServiceExpenseIntegrationService(this.roleService, this.reconciliationService, () => this.authService.getCurrentUser());
    }
    /**
     * Demo: Patron creates and manages services for associated taxistas
     */
    async demoPatronServiceManagement() {
        console.log('\n=== Demo: Patron Service Management ===');
        try {
            // Register and login as patron
            const patronData = {
                email: 'patron@demo.com',
                password: 'patron123',
                nombre: 'Juan Patrón',
                rol: UserRole.PATRON
            };
            const patron = await this.authService.register(patronData);
            await this.authService.login({
                email: patronData.email,
                password: patronData.password
            });
            console.log('✅ Patron logged in:', patron.nombre);
            // Register taxistas
            const taxista1Data = {
                email: 'taxista1@demo.com',
                password: 'taxista123',
                nombre: 'Carlos Taxista',
                rol: UserRole.TAXISTA
            };
            const taxista2Data = {
                email: 'taxista2@demo.com',
                password: 'taxista456',
                nombre: 'Ana Taxista',
                rol: UserRole.TAXISTA
            };
            const taxista1 = await this.authService.register(taxista1Data);
            const taxista2 = await this.authService.register(taxista2Data);
            // Create associations
            await this.roleService.createAssociation(patron.id, taxista1.id);
            await this.roleService.createAssociation(patron.id, taxista2.id);
            console.log('✅ Associations created with taxistas');
            // Get operation context
            const context = this.integrationService.getOperationContext();
            console.log('📊 Operation context:', {
                userRole: context.userRole,
                canCreateServices: context.canCreateServices,
                canViewAggregatedData: context.canViewAggregatedData,
                associatedUsers: context.associatedUsers.length
            });
            // Create services for different taxistas
            const service1 = await this.integrationService.createService({
                date: new Date(),
                startTime: '08:00',
                totalAmount: 25.50,
                paymentType: 'cash',
                platform: 'street',
                taxistaId: taxista1.id
            });
            const service2 = await this.integrationService.createService({
                date: new Date(),
                startTime: '10:30',
                totalAmount: 18.75,
                paymentType: 'app',
                platform: 'freenow',
                taxistaId: taxista2.id
            });
            console.log('✅ Services created:', {
                service1: {
                    id: service1.id,
                    amount: service1.totalAmount,
                    taxista: service1.associatedTaxista?.nombre
                },
                service2: {
                    id: service2.id,
                    amount: service2.totalAmount,
                    taxista: service2.associatedTaxista?.nombre
                }
            });
            // Get aggregated stats
            const mockServices = [service1, service2];
            const aggregatedStats = this.integrationService.getAggregatedStats(mockServices, []);
            console.log('📈 Aggregated stats:', aggregatedStats);
        }
        catch (error) {
            console.error('❌ Error in patron demo:', error);
        }
    }
    /**
     * Demo: Taxista creates and manages own services
     */
    async demoTaxistaServiceManagement() {
        console.log('\n=== Demo: Taxista Service Management ===');
        try {
            // Login as taxista
            await this.authService.login({
                email: 'taxista1@demo.com',
                password: 'taxista123'
            });
            const currentUser = this.authService.getCurrentUser();
            console.log('✅ Taxista logged in:', currentUser?.nombre, 'Número:', currentUser?.numeroTaxista);
            // Get operation context
            const context = this.integrationService.getOperationContext();
            console.log('📊 Operation context:', {
                userRole: context.userRole,
                canCreateServices: context.canCreateServices,
                canViewAggregatedData: context.canViewAggregatedData
            });
            // Create own services
            const service1 = await this.integrationService.createService({
                date: new Date(),
                startTime: '14:00',
                totalAmount: 32.00,
                paymentType: 'card',
                platform: 'street'
            });
            const service2 = await this.integrationService.createService({
                date: new Date(),
                startTime: '16:30',
                totalAmount: 28.50,
                paymentType: 'app',
                platform: 'uber',
                commission: 5.70,
                tips: 2.00
            });
            console.log('✅ Services created by taxista:', {
                service1: {
                    id: service1.id,
                    amount: service1.totalAmount,
                    numeroTaxista: service1.numeroTaxista
                },
                service2: {
                    id: service2.id,
                    amount: service2.totalAmount,
                    commission: service2.commission,
                    tips: service2.tips
                }
            });
            // Try to access aggregated data (should be null for taxista)
            const aggregatedStats = this.integrationService.getAggregatedStats([service1, service2], []);
            console.log('📈 Aggregated stats (should be null):', aggregatedStats);
        }
        catch (error) {
            console.error('❌ Error in taxista demo:', error);
        }
    }
    /**
     * Demo: Expense management with authentication
     */
    async demoExpenseManagement() {
        console.log('\n=== Demo: Expense Management ===');
        try {
            // Login as taxista
            await this.authService.login({
                email: 'taxista1@demo.com',
                password: 'taxista123'
            });
            const currentUser = this.authService.getCurrentUser();
            console.log('✅ Taxista logged in for expense management:', currentUser?.nombre);
            // Create expenses
            const expense1 = await this.integrationService.createExpense({
                date: new Date(),
                concept: 'Gasolina',
                amount: 45.00,
                category: 'fuel'
            });
            const expense2 = await this.integrationService.createExpense({
                date: new Date(),
                concept: 'Cambio de aceite',
                amount: 35.00,
                category: 'maintenance'
            });
            console.log('✅ Expenses created:', {
                expense1: {
                    id: expense1.id,
                    concept: expense1.concept,
                    amount: expense1.amount,
                    numeroTaxista: expense1.numeroTaxista
                },
                expense2: {
                    id: expense2.id,
                    concept: expense2.concept,
                    amount: expense2.amount
                }
            });
            // Switch to patron to see aggregated expenses
            await this.authService.login({
                email: 'patron@demo.com',
                password: 'patron123'
            });
            console.log('✅ Switched to patron view');
            const aggregatedExpenseStats = this.integrationService.getAggregatedStats([], [expense1, expense2]);
            console.log('📈 Aggregated expense stats:', aggregatedExpenseStats);
        }
        catch (error) {
            console.error('❌ Error in expense demo:', error);
        }
    }
    /**
     * Demo: Permission validation and access control
     */
    async demoPermissionValidation() {
        console.log('\n=== Demo: Permission Validation ===');
        try {
            // Login as taxista
            await this.authService.login({
                email: 'taxista1@demo.com',
                password: 'taxista123'
            });
            const currentUser = this.authService.getCurrentUser();
            console.log('✅ Testing permissions for taxista:', currentUser.nombre);
            // Test service creation permission
            const canCreateServices = this.integrationService.validateOperationPermissions({
                user: currentUser,
                operation: 'create'
            });
            console.log('🔐 Can create services:', canCreateServices);
            // Create a service to test modification permissions
            const testService = await this.integrationService.createService({
                date: new Date(),
                startTime: '12:00',
                totalAmount: 20.00,
                paymentType: 'cash'
            });
            // Test modification permissions
            const canModify = this.integrationService.validateOperationPermissions({
                user: currentUser,
                operation: 'update',
                targetData: testService
            });
            console.log('🔐 Can modify own service:', canModify);
            // Switch to different taxista and try to modify
            await this.authService.login({
                email: 'taxista2@demo.com',
                password: 'taxista456'
            });
            const otherUser = this.authService.getCurrentUser();
            const canModifyOther = this.integrationService.validateOperationPermissions({
                user: otherUser,
                operation: 'update',
                targetData: testService
            });
            console.log('🔐 Can modify other taxista service:', canModifyOther);
            // Test access to service data
            const canAccess = this.integrationService.validateOperationPermissions({
                user: otherUser,
                operation: 'read',
                targetData: testService
            });
            console.log('🔐 Can access other taxista service:', canAccess);
        }
        catch (error) {
            console.error('❌ Error in permission demo:', error);
        }
    }
    /**
     * Demo: Storage wrapper integration
     */
    async demoStorageIntegration() {
        console.log('\n=== Demo: Storage Integration ===');
        try {
            // Mock storage manager
            const mockStorage = {
                services: [],
                expenses: [],
                getServices: function () { return this.services; },
                getExpenses: function () { return this.expenses; },
                saveService: function (service) {
                    this.services.push(service);
                    return service;
                },
                saveExpense: function (expense) {
                    this.expenses.push(expense);
                    return expense;
                },
                updateService: function (id, updates) {
                    const index = this.services.findIndex(s => s.id === id);
                    if (index >= 0) {
                        this.services[index] = { ...this.services[index], ...updates };
                    }
                    return this.services[index];
                },
                deleteService: function (id) {
                    this.services = this.services.filter(s => s.id !== id);
                }
            };
            // Login as patron
            await this.authService.login({
                email: 'patron@demo.com',
                password: 'patron123'
            });
            console.log('✅ Testing storage wrapper with patron');
            // Wrap storage with authentication
            const wrappedStorage = this.integrationService.wrapStorageOperations(mockStorage);
            // Test authenticated operations
            const service = await wrappedStorage.saveServiceWithAuth({
                date: new Date(),
                startTime: '09:00',
                totalAmount: 30.00,
                paymentType: 'card'
            });
            console.log('✅ Service saved through wrapper:', {
                id: service.id,
                amount: service.totalAmount,
                userId: service.userId,
                createdBy: service.createdBy
            });
            const expense = await wrappedStorage.saveExpenseWithAuth({
                date: new Date(),
                concept: 'Seguro mensual',
                amount: 120.00,
                category: 'insurance'
            });
            console.log('✅ Expense saved through wrapper:', {
                id: expense.id,
                concept: expense.concept,
                amount: expense.amount,
                userId: expense.userId
            });
            // Get filtered data
            const filteredServices = wrappedStorage.getServicesWithAuth();
            const filteredExpenses = wrappedStorage.getExpensesWithAuth();
            console.log('📊 Filtered data:', {
                services: filteredServices.length,
                expenses: filteredExpenses.length
            });
        }
        catch (error) {
            console.error('❌ Error in storage demo:', error);
        }
    }
    /**
     * Run all demos
     */
    async runAllDemos() {
        console.log('🚀 Starting Service and Expense Integration Demo');
        await this.demoPatronServiceManagement();
        await this.demoTaxistaServiceManagement();
        await this.demoExpenseManagement();
        await this.demoPermissionValidation();
        await this.demoStorageIntegration();
        console.log('\n✅ All demos completed successfully!');
    }
}
// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
    window.ServiceExpenseIntegrationDemo = ServiceExpenseIntegrationDemo;
}
export default ServiceExpenseIntegrationDemo;
//# sourceMappingURL=service-expense-integration-demo.js.map