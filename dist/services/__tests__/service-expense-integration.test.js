// Tests for Service and Expense Integration Service
// Tests integration of service and expense management with authentication
// Requirements: 5.3, 5.5
import { ServiceExpenseIntegrationService } from '../service-expense-integration';
import { ReconciliationIntegrationService } from '../reconciliation-integration';
import { UserRole, Permission, AuthError } from '../../types';
// Mock RoleService
class MockRoleService {
    constructor() {
        this.currentUser = null;
        this.permissions = [];
        this.accessibleUsers = [];
    }
    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            this.permissions = user.rol === UserRole.PATRON
                ? [Permission.VIEW_ALL_DRIVERS, Permission.MANAGE_ASSOCIATIONS, Permission.INPUT_OPERATIONAL_DATA]
                : [Permission.VIEW_OWN_DATA, Permission.INPUT_OPERATIONAL_DATA];
        }
        else {
            this.permissions = [];
        }
    }
    setAccessibleUsers(users) {
        this.accessibleUsers = users;
    }
    hasPermission(permission) {
        return this.permissions.includes(permission);
    }
    getAccessibleUsers() {
        return this.accessibleUsers;
    }
    filterDataByRole(data, options) {
        if (!this.currentUser)
            return [];
        if (this.currentUser.rol === UserRole.PATRON) {
            // Patron can see data from associated taxistas
            return data.filter(item => item.userId === this.currentUser.id ||
                item.createdBy === this.currentUser.id ||
                this.accessibleUsers.some(u => u.id === item.userId ||
                    u.id === item.createdBy ||
                    u.id === item.taxistaId));
        }
        else {
            // Taxista can only see own data
            return data.filter(item => item.userId === this.currentUser.id ||
                item.createdBy === this.currentUser.id ||
                item.taxistaId === this.currentUser.id);
        }
    }
    validateDataAccess(data, operation) {
        if (!this.currentUser)
            return false;
        if (this.currentUser.rol === UserRole.PATRON) {
            return data.userId === this.currentUser.id ||
                data.createdBy === this.currentUser.id ||
                this.accessibleUsers.some(u => u.id === data.userId ||
                    u.id === data.createdBy ||
                    u.id === data.taxistaId);
        }
        else {
            return data.userId === this.currentUser.id ||
                data.createdBy === this.currentUser.id ||
                data.taxistaId === this.currentUser.id;
        }
    }
}
describe('ServiceExpenseIntegrationService', () => {
    let service;
    let mockRoleService;
    let mockReconciliationService;
    let mockGetCurrentUser;
    // Mock users
    const mockPatronUser = {
        id: 'user_patron_1',
        email: 'patron@test.com',
        nombre: 'Test Patron',
        rol: UserRole.PATRON,
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    const mockTaxistaUser = {
        id: 'user_taxista_1',
        email: 'taxista@test.com',
        nombre: 'Test Taxista',
        rol: UserRole.TAXISTA,
        numeroTaxista: 'TX001',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    const mockTaxistaUser2 = {
        id: 'user_taxista_2',
        email: 'taxista2@test.com',
        nombre: 'Test Taxista 2',
        rol: UserRole.TAXISTA,
        numeroTaxista: 'TX002',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    beforeEach(() => {
        mockRoleService = new MockRoleService();
        mockGetCurrentUser = jest.fn();
        mockReconciliationService = new ReconciliationIntegrationService(mockRoleService, mockGetCurrentUser);
        service = new ServiceExpenseIntegrationService(mockRoleService, mockReconciliationService, mockGetCurrentUser);
    });
    describe('createService', () => {
        it('should create service with user context for taxista', async () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const serviceData = {
                date: new Date(),
                startTime: '10:00',
                totalAmount: 25.50,
                paymentType: 'cash'
            };
            const result = await service.createService(serviceData);
            expect(result.userId).toBe(mockTaxistaUser.id);
            expect(result.createdBy).toBe(mockTaxistaUser.id);
            expect(result.taxistaId).toBe(mockTaxistaUser.id);
            expect(result.numeroTaxista).toBe(mockTaxistaUser.numeroTaxista);
            expect(result.totalAmount).toBe(25.50);
            expect(result.createdByUser).toBe(mockTaxistaUser);
            expect(result.associatedTaxista).toBe(mockTaxistaUser);
            expect(result.canEdit).toBe(true);
            expect(result.canDelete).toBe(true);
        });
        it('should create service with user context for patron', async () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            const serviceData = {
                date: new Date(),
                startTime: '10:00',
                totalAmount: 25.50,
                paymentType: 'cash',
                taxistaId: mockTaxistaUser.id
            };
            const result = await service.createService(serviceData);
            expect(result.userId).toBe(mockPatronUser.id);
            expect(result.createdBy).toBe(mockPatronUser.id);
            expect(result.taxistaId).toBe(mockTaxistaUser.id);
            expect(result.totalAmount).toBe(25.50);
            expect(result.createdByUser).toBe(mockPatronUser);
            expect(result.canEdit).toBe(true);
            expect(result.canDelete).toBe(true);
        });
        it('should throw error when user is not authenticated', async () => {
            mockGetCurrentUser.mockReturnValue(null);
            const serviceData = {
                date: new Date(),
                totalAmount: 25.50,
                paymentType: 'cash'
            };
            await expect(service.createService(serviceData))
                .rejects
                .toThrow(AuthError);
        });
        it('should throw error when user lacks permissions', async () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            // Remove INPUT_OPERATIONAL_DATA permission
            mockRoleService.permissions = [Permission.VIEW_OWN_DATA];
            const serviceData = {
                date: new Date(),
                totalAmount: 25.50,
                paymentType: 'cash'
            };
            await expect(service.createService(serviceData))
                .rejects
                .toThrow('Sin permisos para crear servicios');
        });
    });
    describe('createExpense', () => {
        it('should create expense with user context for taxista', async () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const expenseData = {
                date: new Date(),
                concept: 'Gasolina',
                amount: 45.00,
                category: 'fuel'
            };
            const result = await service.createExpense(expenseData);
            expect(result.userId).toBe(mockTaxistaUser.id);
            expect(result.createdBy).toBe(mockTaxistaUser.id);
            expect(result.taxistaId).toBe(mockTaxistaUser.id);
            expect(result.numeroTaxista).toBe(mockTaxistaUser.numeroTaxista);
            expect(result.concept).toBe('Gasolina');
            expect(result.amount).toBe(45.00);
            expect(result.createdByUser).toBe(mockTaxistaUser);
            expect(result.associatedTaxista).toBe(mockTaxistaUser);
            expect(result.canEdit).toBe(true);
            expect(result.canDelete).toBe(true);
        });
        it('should throw error when user is not authenticated', async () => {
            mockGetCurrentUser.mockReturnValue(null);
            const expenseData = {
                date: new Date(),
                concept: 'Gasolina',
                amount: 45.00,
                category: 'fuel'
            };
            await expect(service.createExpense(expenseData))
                .rejects
                .toThrow(AuthError);
        });
    });
    describe('getServicesWithAuth', () => {
        const sampleServices = [
            {
                id: 'service_1',
                userId: 'user_patron_1',
                createdBy: 'user_taxista_1',
                taxistaId: 'user_taxista_1',
                numeroTaxista: 'TX001',
                date: new Date(),
                startTime: '10:00',
                totalAmount: 25.50,
                paymentType: 'cash',
                isArticulated: false
            },
            {
                id: 'service_2',
                userId: 'user_patron_1',
                createdBy: 'user_taxista_2',
                taxistaId: 'user_taxista_2',
                numeroTaxista: 'TX002',
                date: new Date(),
                startTime: '11:00',
                totalAmount: 30.00,
                paymentType: 'card',
                isArticulated: false
            }
        ];
        it('should return services with authentication context for patron', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            mockRoleService.setAccessibleUsers([mockTaxistaUser, mockTaxistaUser2]);
            const result = service.getServicesWithAuth(sampleServices);
            expect(result).toHaveLength(2);
            expect(result[0].canEdit).toBeDefined();
            expect(result[0].canDelete).toBeDefined();
            expect(result[0].createdByUser).toBeDefined();
        });
        it('should return filtered services for taxista', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const result = service.getServicesWithAuth(sampleServices);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('service_1');
            expect(result[0].canEdit).toBeDefined();
            expect(result[0].canDelete).toBeDefined();
        });
        it('should throw error when user is not authenticated', () => {
            mockGetCurrentUser.mockReturnValue(null);
            expect(() => service.getServicesWithAuth(sampleServices))
                .toThrow(AuthError);
        });
    });
    describe('updateService', () => {
        const existingServices = [
            {
                id: 'service_1',
                userId: 'user_taxista_1',
                createdBy: 'user_taxista_1',
                taxistaId: 'user_taxista_1',
                numeroTaxista: 'TX001',
                date: new Date(),
                startTime: '10:00',
                totalAmount: 25.50,
                paymentType: 'cash',
                isArticulated: false
            }
        ];
        it('should update service when user has permissions', async () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const updates = { totalAmount: 30.00 };
            const result = await service.updateService('service_1', updates, existingServices);
            expect(result.totalAmount).toBe(30.00);
            expect(result.userId).toBe('user_taxista_1'); // Preserved
            expect(result.createdBy).toBe('user_taxista_1'); // Preserved
        });
        it('should throw error when service not found', async () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const updates = { totalAmount: 30.00 };
            await expect(service.updateService('nonexistent', updates, existingServices))
                .rejects
                .toThrow('Servicio no encontrado');
        });
        it('should throw error when user lacks permissions', async () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser2);
            mockRoleService.setCurrentUser(mockTaxistaUser2);
            const updates = { totalAmount: 30.00 };
            await expect(service.updateService('service_1', updates, existingServices))
                .rejects
                .toThrow('Sin permisos para modificar este servicio');
        });
    });
    describe('getOperationContext', () => {
        it('should return operation context for authenticated patron', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            mockRoleService.setAccessibleUsers([mockTaxistaUser, mockTaxistaUser2]);
            const context = service.getOperationContext();
            expect(context.user).toBe(mockPatronUser);
            expect(context.userRole).toBe(UserRole.PATRON);
            expect(context.canCreateServices).toBe(true);
            expect(context.canCreateExpenses).toBe(true);
            expect(context.canViewAggregatedData).toBe(true);
            expect(context.associatedUsers).toHaveLength(2);
        });
        it('should return operation context for authenticated taxista', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const context = service.getOperationContext();
            expect(context.user).toBe(mockTaxistaUser);
            expect(context.userRole).toBe(UserRole.TAXISTA);
            expect(context.canCreateServices).toBe(true);
            expect(context.canCreateExpenses).toBe(true);
            expect(context.canViewAggregatedData).toBe(false);
            expect(context.associatedUsers).toHaveLength(0);
        });
        it('should return null context for unauthenticated user', () => {
            mockGetCurrentUser.mockReturnValue(null);
            const context = service.getOperationContext();
            expect(context.user).toBeNull();
            expect(context.userRole).toBeNull();
            expect(context.canCreateServices).toBe(false);
            expect(context.canCreateExpenses).toBe(false);
            expect(context.canViewAggregatedData).toBe(false);
            expect(context.associatedUsers).toHaveLength(0);
        });
    });
    describe('validateOperationPermissions', () => {
        it('should validate create operation permissions', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const result = service.validateOperationPermissions({
                user: mockTaxistaUser,
                operation: 'create'
            });
            expect(result).toBe(true);
        });
        it('should validate read operation permissions', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const testData = {
                id: 'test',
                userId: mockTaxistaUser.id,
                createdBy: mockTaxistaUser.id,
                date: new Date()
            };
            const result = service.validateOperationPermissions({
                user: mockTaxistaUser,
                operation: 'read',
                targetData: testData
            });
            expect(result).toBe(true);
        });
        it('should reject operations for different user', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const result = service.validateOperationPermissions({
                user: mockTaxistaUser2, // Different user
                operation: 'create'
            });
            expect(result).toBe(false);
        });
    });
    describe('getAggregatedStats', () => {
        const sampleServices = [
            {
                id: 'service_1',
                userId: 'user_patron_1',
                createdBy: 'user_taxista_1',
                taxistaId: 'user_taxista_1',
                date: new Date(),
                startTime: '10:00',
                totalAmount: 25.50,
                paymentType: 'cash',
                isArticulated: false
            }
        ];
        const sampleExpenses = [
            {
                id: 'expense_1',
                userId: 'user_taxista_1',
                createdBy: 'user_taxista_1',
                date: new Date(),
                concept: 'Gasolina',
                amount: 45.00,
                category: 'fuel'
            }
        ];
        it('should return aggregated stats for patron', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            const result = service.getAggregatedStats(sampleServices, sampleExpenses);
            expect(result).not.toBeNull();
            expect(result?.services).toBeDefined();
            expect(result?.expenses).toBeDefined();
        });
        it('should return null for taxista', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const result = service.getAggregatedStats(sampleServices, sampleExpenses);
            expect(result).toBeNull();
        });
    });
    describe('wrapStorageOperations', () => {
        let mockStorage;
        beforeEach(() => {
            mockStorage = {
                services: [],
                expenses: [],
                getServices: jest.fn(() => mockStorage.services),
                getExpenses: jest.fn(() => mockStorage.expenses),
                saveService: jest.fn((service) => {
                    mockStorage.services.push(service);
                    return service;
                }),
                saveExpense: jest.fn((expense) => {
                    mockStorage.expenses.push(expense);
                    return expense;
                }),
                updateService: jest.fn(),
                updateExpense: jest.fn(),
                deleteService: jest.fn(),
                deleteExpense: jest.fn()
            };
        });
        it('should wrap storage operations with authentication', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const wrappedStorage = service.wrapStorageOperations(mockStorage);
            expect(wrappedStorage.getServicesWithAuth).toBeDefined();
            expect(wrappedStorage.getExpensesWithAuth).toBeDefined();
            expect(wrappedStorage.saveServiceWithAuth).toBeDefined();
            expect(wrappedStorage.saveExpenseWithAuth).toBeDefined();
            expect(wrappedStorage.getOperationContext).toBeDefined();
            expect(wrappedStorage.getAggregatedStats).toBeDefined();
        });
        it('should throw error when wrapping storage without authentication', () => {
            mockGetCurrentUser.mockReturnValue(null);
            expect(() => service.wrapStorageOperations(mockStorage))
                .toThrow('Usuario no autenticado');
        });
    });
});
//# sourceMappingURL=service-expense-integration.test.js.map