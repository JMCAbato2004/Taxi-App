// Tests for Reconciliation Integration Service
// Requirements: 5.2, 5.4
import { ReconciliationIntegrationService } from '../reconciliation-integration';
import { UserRole, Permission, AuthError } from '../../types';
// Mock RoleService
class MockRoleService {
    constructor() {
        this.currentUser = null;
        this.permissions = [];
    }
    setCurrentUser(user) {
        this.currentUser = user;
    }
    setPermissions(permissions) {
        this.permissions = permissions;
    }
    hasPermission(permission) {
        return this.permissions.includes(permission);
    }
    getPermissions() {
        return this.permissions;
    }
    filterDataByRole(data, userContext) {
        if (!this.currentUser)
            return [];
        if (this.currentUser.rol === UserRole.PATRON) {
            // Mock patron filtering - return data from associated taxistas
            return data.filter((item) => {
                return item.createdBy === 'user_taxista_1' || item.createdBy === 'user_taxista_2';
            });
        }
        else if (this.currentUser.rol === UserRole.TAXISTA) {
            // Mock taxista filtering - return only own data
            return data.filter((item) => {
                return item.createdBy === this.currentUser.id || item.userId === this.currentUser.id;
            });
        }
        return [];
    }
    validateDataAccess(targetData, operation = 'read') {
        if (!this.currentUser)
            return false;
        if (operation === 'read') {
            if (this.currentUser.rol === UserRole.PATRON) {
                return targetData.createdBy === 'user_taxista_1' || targetData.createdBy === 'user_taxista_2';
            }
            else {
                return targetData.createdBy === this.currentUser.id || targetData.userId === this.currentUser.id;
            }
        }
        return targetData.createdBy === this.currentUser.id || targetData.userId === this.currentUser.id;
    }
    getAccessibleUsers() {
        if (!this.currentUser)
            return [];
        if (this.currentUser.rol === UserRole.PATRON) {
            return [
                this.currentUser,
                {
                    id: 'user_taxista_1',
                    email: 'taxista1@example.com',
                    nombre: 'Taxista Uno',
                    rol: UserRole.TAXISTA,
                    numeroTaxista: 'TX001',
                    activo: true,
                    fechaCreacion: new Date(),
                    fechaActualizacion: new Date()
                },
                {
                    id: 'user_taxista_2',
                    email: 'taxista2@example.com',
                    nombre: 'Taxista Dos',
                    rol: UserRole.TAXISTA,
                    numeroTaxista: 'TX002',
                    activo: true,
                    fechaCreacion: new Date(),
                    fechaActualizacion: new Date()
                }
            ];
        }
        return [this.currentUser];
    }
}
describe('ReconciliationIntegrationService', () => {
    let service;
    let mockRoleService;
    let mockGetCurrentUser;
    const mockPatronUser = {
        id: 'user_patron_1',
        email: 'patron@example.com',
        nombre: 'Patron Test',
        rol: UserRole.PATRON,
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    const mockTaxistaUser = {
        id: 'user_taxista_1',
        email: 'taxista@example.com',
        nombre: 'Taxista Test',
        rol: UserRole.TAXISTA,
        numeroTaxista: 'TX001',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
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
    beforeEach(() => {
        mockRoleService = new MockRoleService();
        mockGetCurrentUser = jest.fn();
        service = new ReconciliationIntegrationService(mockRoleService, mockGetCurrentUser);
    });
    describe('filterServices', () => {
        it('should throw error when user is not authenticated', () => {
            mockGetCurrentUser.mockReturnValue(null);
            expect(() => service.filterServices(sampleServices)).toThrow(AuthError);
            expect(() => service.filterServices(sampleServices)).toThrow('Usuario no autenticado');
        });
        it('should filter services for patron user', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            const filtered = service.filterServices(sampleServices);
            expect(filtered).toHaveLength(2);
            expect(filtered.every(s => s.createdBy === 'user_taxista_1' || s.createdBy === 'user_taxista_2')).toBe(true);
        });
        it('should filter services for taxista user', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const filtered = service.filterServices(sampleServices);
            expect(filtered).toHaveLength(1);
            expect(filtered[0].createdBy).toBe('user_taxista_1');
        });
    });
    describe('filterExpenses', () => {
        it('should throw error when user is not authenticated', () => {
            mockGetCurrentUser.mockReturnValue(null);
            expect(() => service.filterExpenses(sampleExpenses)).toThrow(AuthError);
            expect(() => service.filterExpenses(sampleExpenses)).toThrow('Usuario no autenticado');
        });
        it('should filter expenses for patron user', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            const filtered = service.filterExpenses(sampleExpenses);
            expect(filtered).toHaveLength(2);
            expect(filtered.every(e => e.createdBy === 'user_taxista_1' || e.createdBy === 'user_taxista_2')).toBe(true);
        });
        it('should filter expenses for taxista user', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const filtered = service.filterExpenses(sampleExpenses);
            expect(filtered).toHaveLength(1);
            expect(filtered[0].createdBy).toBe('user_taxista_1');
        });
    });
    describe('addUserContextToService', () => {
        it('should throw error when user is not authenticated', () => {
            mockGetCurrentUser.mockReturnValue(null);
            expect(() => service.addUserContextToService({})).toThrow(AuthError);
            expect(() => service.addUserContextToService({})).toThrow('Usuario no autenticado');
        });
        it('should throw error when user lacks permission', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            mockRoleService.setPermissions([]); // No permissions
            expect(() => service.addUserContextToService({})).toThrow(AuthError);
            expect(() => service.addUserContextToService({})).toThrow('Sin permisos para introducir datos operativos');
        });
        it('should enrich service data for taxista user', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            mockRoleService.setPermissions([Permission.INPUT_OPERATIONAL_DATA]);
            const serviceData = {
                totalAmount: 25.50,
                paymentType: 'cash',
                isArticulated: false
            };
            const enriched = service.addUserContextToService(serviceData);
            expect(enriched.userId).toBe(mockTaxistaUser.id);
            expect(enriched.taxistaId).toBe(mockTaxistaUser.id);
            expect(enriched.createdBy).toBe(mockTaxistaUser.id);
            expect(enriched.numeroTaxista).toBe(mockTaxistaUser.numeroTaxista);
            expect(enriched.totalAmount).toBe(25.50);
            expect(enriched.paymentType).toBe('cash');
            expect(enriched.id).toBeDefined();
        });
        it('should enrich service data for patron user', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            mockRoleService.setPermissions([Permission.INPUT_OPERATIONAL_DATA]);
            const serviceData = {
                taxistaId: 'user_taxista_1',
                numeroTaxista: 'TX001',
                totalAmount: 30.00,
                paymentType: 'card',
                isArticulated: true
            };
            const enriched = service.addUserContextToService(serviceData);
            expect(enriched.userId).toBe(mockPatronUser.id);
            expect(enriched.taxistaId).toBe('user_taxista_1');
            expect(enriched.createdBy).toBe(mockPatronUser.id);
            expect(enriched.numeroTaxista).toBe('TX001');
            expect(enriched.totalAmount).toBe(30.00);
            expect(enriched.paymentType).toBe('card');
            expect(enriched.isArticulated).toBe(true);
        });
    });
    describe('addUserContextToExpense', () => {
        it('should throw error when user is not authenticated', () => {
            mockGetCurrentUser.mockReturnValue(null);
            expect(() => service.addUserContextToExpense({})).toThrow(AuthError);
            expect(() => service.addUserContextToExpense({})).toThrow('Usuario no autenticado');
        });
        it('should throw error when user lacks permission', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            mockRoleService.setPermissions([]); // No permissions
            expect(() => service.addUserContextToExpense({})).toThrow(AuthError);
            expect(() => service.addUserContextToExpense({})).toThrow('Sin permisos para introducir datos operativos');
        });
        it('should enrich expense data for taxista user', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            mockRoleService.setPermissions([Permission.INPUT_OPERATIONAL_DATA]);
            const expenseData = {
                concept: 'Combustible',
                amount: 45.00,
                category: 'fuel'
            };
            const enriched = service.addUserContextToExpense(expenseData);
            expect(enriched.userId).toBe(mockTaxistaUser.id);
            expect(enriched.taxistaId).toBe(mockTaxistaUser.id);
            expect(enriched.createdBy).toBe(mockTaxistaUser.id);
            expect(enriched.numeroTaxista).toBe(mockTaxistaUser.numeroTaxista);
            expect(enriched.concept).toBe('Combustible');
            expect(enriched.amount).toBe(45.00);
            expect(enriched.category).toBe('fuel');
            expect(enriched.id).toBeDefined();
        });
    });
    describe('getAggregatedSummary', () => {
        it('should return null for non-patron users', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const summary = service.getAggregatedSummary(sampleServices, 'totalAmount');
            expect(summary).toBeNull();
        });
        it('should throw error when patron lacks permission', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            mockRoleService.setPermissions([]); // No permissions
            expect(() => service.getAggregatedSummary(sampleServices, 'totalAmount')).toThrow(AuthError);
            expect(() => service.getAggregatedSummary(sampleServices, 'totalAmount')).toThrow('Sin permisos para ver datos agregados');
        });
        it('should return aggregated summary for patron user', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            mockRoleService.setPermissions([Permission.VIEW_ALL_DRIVERS]);
            const summary = service.getAggregatedSummary(sampleServices, 'totalAmount');
            expect(summary).toBeDefined();
            expect(summary.totalRecords).toBe(2); // Filtered to patron's associated taxistas
            expect(summary.totalAmount).toBe(44.25); // 25.50 + 18.75
            expect(summary.averageAmount).toBe(22.125);
            expect(summary.associatedTaxistas).toBe(2);
            expect(Object.keys(summary.byTaxista)).toHaveLength(2);
        });
        it('should return empty summary when no data available', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            mockRoleService.setPermissions([Permission.VIEW_ALL_DRIVERS]);
            const summary = service.getAggregatedSummary([], 'totalAmount');
            expect(summary).toBeDefined();
            expect(summary.totalRecords).toBe(0);
            expect(summary.totalAmount).toBe(0);
            expect(summary.averageAmount).toBe(0);
            expect(summary.associatedTaxistas).toBe(0);
            expect(Object.keys(summary.byTaxista)).toHaveLength(0);
        });
    });
    describe('canAccessReconciliationData', () => {
        it('should validate data access correctly', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const ownData = { createdBy: 'user_taxista_1' };
            const otherData = { createdBy: 'user_taxista_2' };
            expect(service.canAccessReconciliationData(ownData)).toBe(true);
            expect(service.canAccessReconciliationData(otherData)).toBe(false);
        });
    });
    describe('canModifyReconciliationData', () => {
        it('should validate data modification correctly', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const ownData = { createdBy: 'user_taxista_1' };
            const otherData = { createdBy: 'user_taxista_2' };
            expect(service.canModifyReconciliationData(ownData)).toBe(true);
            expect(service.canModifyReconciliationData(otherData)).toBe(false);
        });
    });
    describe('getReconciliationContext', () => {
        it('should return empty context when user is not authenticated', () => {
            mockGetCurrentUser.mockReturnValue(null);
            const context = service.getReconciliationContext();
            expect(context.userRole).toBeNull();
            expect(context.canViewAggregatedData).toBe(false);
            expect(context.canInputData).toBe(false);
            expect(context.associatedUsers).toHaveLength(0);
            expect(context.permissions).toHaveLength(0);
        });
        it('should return context for authenticated taxista user', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            mockRoleService.setPermissions([Permission.INPUT_OPERATIONAL_DATA, Permission.VIEW_OWN_DATA]);
            const context = service.getReconciliationContext();
            expect(context.userRole).toBe(UserRole.TAXISTA);
            expect(context.canViewAggregatedData).toBe(false);
            expect(context.canInputData).toBe(true);
            expect(context.associatedUsers).toHaveLength(1);
            expect(context.permissions).toHaveLength(2);
        });
        it('should return context for authenticated patron user', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            mockRoleService.setPermissions([Permission.VIEW_ALL_DRIVERS, Permission.MANAGE_ASSOCIATIONS]);
            const context = service.getReconciliationContext();
            expect(context.userRole).toBe(UserRole.PATRON);
            expect(context.canViewAggregatedData).toBe(true);
            expect(context.canInputData).toBe(false);
            expect(context.associatedUsers).toHaveLength(3); // Patron + 2 taxistas
            expect(context.permissions).toHaveLength(2);
        });
    });
    describe('wrapStorageOperations', () => {
        let mockStorageManager;
        beforeEach(() => {
            mockStorageManager = {
                getServices: jest.fn().mockReturnValue(sampleServices),
                getExpenses: jest.fn().mockReturnValue(sampleExpenses),
                getReconciliations: jest.fn().mockReturnValue([]),
                saveService: jest.fn(),
                saveExpense: jest.fn(),
                saveReconciliation: jest.fn(),
                updateService: jest.fn(),
                updateExpense: jest.fn(),
                deleteService: jest.fn(),
                deleteExpense: jest.fn(),
                deleteReconciliation: jest.fn(),
                getSettings: jest.fn(),
                saveSettings: jest.fn()
            };
        });
        it('should throw error when user is not authenticated', () => {
            mockGetCurrentUser.mockReturnValue(null);
            expect(() => service.wrapStorageOperations(mockStorageManager)).toThrow(AuthError);
            expect(() => service.wrapStorageOperations(mockStorageManager)).toThrow('Usuario no autenticado');
        });
        it('should wrap storage operations with role-based filtering', () => {
            mockGetCurrentUser.mockReturnValue(mockPatronUser);
            mockRoleService.setCurrentUser(mockPatronUser);
            const wrappedManager = service.wrapStorageOperations(mockStorageManager);
            // Test filtered getServices
            const services = wrappedManager.getServices();
            expect(services).toHaveLength(2); // Filtered for patron
            // Test filtered getExpenses
            const expenses = wrappedManager.getExpenses();
            expect(expenses).toHaveLength(2); // Filtered for patron
            // Test that original methods are called
            expect(mockStorageManager.getServices).toHaveBeenCalled();
            expect(mockStorageManager.getExpenses).toHaveBeenCalled();
        });
        it('should enrich data when saving', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            mockRoleService.setPermissions([Permission.INPUT_OPERATIONAL_DATA]);
            const wrappedManager = service.wrapStorageOperations(mockStorageManager);
            const serviceData = {
                totalAmount: 25.50,
                paymentType: 'cash',
                isArticulated: false
            };
            wrappedManager.saveService(serviceData);
            expect(mockStorageManager.saveService).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockTaxistaUser.id,
                createdBy: mockTaxistaUser.id,
                numeroTaxista: mockTaxistaUser.numeroTaxista,
                totalAmount: 25.50,
                paymentType: 'cash'
            }));
        });
        it('should validate access when updating data', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const wrappedManager = service.wrapStorageOperations(mockStorageManager);
            // Mock existing service that user cannot modify
            mockStorageManager.getServices.mockReturnValue([
                { id: 'service_1', createdBy: 'other_user', totalAmount: 25.50 }
            ]);
            expect(() => wrappedManager.updateService('service_1', { totalAmount: 30.00 }))
                .toThrow(AuthError);
            expect(() => wrappedManager.updateService('service_1', { totalAmount: 30.00 }))
                .toThrow('Sin permisos para modificar este servicio');
        });
        it('should validate access when deleting data', () => {
            mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
            mockRoleService.setCurrentUser(mockTaxistaUser);
            const wrappedManager = service.wrapStorageOperations(mockStorageManager);
            // Mock existing service that user cannot delete
            mockStorageManager.getServices.mockReturnValue([
                { id: 'service_1', createdBy: 'other_user', totalAmount: 25.50 }
            ]);
            expect(() => wrappedManager.deleteService('service_1'))
                .toThrow(AuthError);
            expect(() => wrappedManager.deleteService('service_1'))
                .toThrow('Sin permisos para eliminar este servicio');
        });
    });
});
//# sourceMappingURL=reconciliation-integration.test.js.map