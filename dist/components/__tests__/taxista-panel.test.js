// Taxista Panel Tests
// Unit tests for the taxista personal dashboard functionality
// Requirements: 4.1, 4.5, 4.3
import { TaxistaPanel } from '../taxista-panel';
import { AuthService } from '../../services/auth-service';
import { RoleService } from '../../services/role-service';
import { ServiceExpenseIntegrationService } from '../../services/service-expense-integration';
import { ReconciliationIntegrationService } from '../../services/reconciliation-integration';
import { JWTUtils } from '../../utils/jwt-utils';
import { CryptoUtils } from '../../utils/crypto-utils';
import { UserRole, AuthError, AuthErrorCode } from '../../types';
describe('TaxistaPanel', () => {
    let authService;
    let roleService;
    let serviceExpenseService;
    let reconciliationService;
    let taxistaPanel;
    let config;
    // Mock taxista user
    const mockTaxistaUser = {
        id: 'taxista_123',
        email: 'test.taxista@example.com',
        nombre: 'Test Taxista',
        telefono: '+34 666 123 456',
        rol: UserRole.TAXISTA,
        numeroTaxista: 'TX001',
        activo: true,
        fechaCreacion: new Date('2023-01-01'),
        fechaActualizacion: new Date('2023-01-01')
    };
    beforeEach(() => {
        // Initialize services
        const jwtUtils = new JWTUtils();
        const cryptoUtils = new CryptoUtils();
        authService = new AuthService(jwtUtils, cryptoUtils);
        roleService = new RoleService(() => authService.getCurrentUser());
        reconciliationService = new ReconciliationIntegrationService(roleService);
        serviceExpenseService = new ServiceExpenseIntegrationService(roleService, reconciliationService, () => authService.getCurrentUser());
        // Mock current user as taxista
        jest.spyOn(authService, 'getCurrentUser').mockReturnValue(mockTaxistaUser);
        config = {
            authService,
            roleService,
            serviceExpenseService,
            onError: jest.fn(),
            onSuccess: jest.fn(),
            onDataUpdated: jest.fn()
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Initialization', () => {
        it('should initialize successfully with taxista user', async () => {
            taxistaPanel = new TaxistaPanel(config);
            expect(taxistaPanel.getCurrentUser()).toEqual(mockTaxistaUser);
            expect(taxistaPanel.isLoadingData()).toBe(false);
        });
        it('should throw error when initialized with non-taxista user', () => {
            const patronUser = { ...mockTaxistaUser, rol: UserRole.PATRON, numeroTaxista: undefined };
            jest.spyOn(authService, 'getCurrentUser').mockReturnValue(patronUser);
            expect(() => new TaxistaPanel(config)).toThrow();
            expect(config.onError).toHaveBeenCalledWith(expect.objectContaining({
                code: AuthErrorCode.INSUFFICIENT_PERMISSIONS
            }));
        });
        it('should throw error when no user is authenticated', () => {
            jest.spyOn(authService, 'getCurrentUser').mockReturnValue(null);
            expect(() => new TaxistaPanel(config)).toThrow();
            expect(config.onError).toHaveBeenCalledWith(expect.objectContaining({
                code: AuthErrorCode.INSUFFICIENT_PERMISSIONS
            }));
        });
    });
    describe('Personal Data Access - Requirement 4.1', () => {
        beforeEach(() => {
            taxistaPanel = new TaxistaPanel(config);
        });
        it('should provide access to personal profile data', () => {
            const profile = taxistaPanel.getPersonalProfile();
            expect(profile).toBeDefined();
            expect(profile?.user).toEqual(mockTaxistaUser);
            expect(profile?.accountStatus).toBe('active');
            expect(profile?.memberSince).toEqual(mockTaxistaUser.fechaCreacion);
        });
        it('should provide access to personal statistics', () => {
            const stats = taxistaPanel.getPersonalStats();
            expect(stats).toBeDefined();
            expect(typeof stats?.totalServices).toBe('number');
            expect(typeof stats?.totalRevenue).toBe('number');
            expect(typeof stats?.averageServiceValue).toBe('number');
            expect(Array.isArray(stats?.recentActivity)).toBe(true);
        });
        it('should display taxista number prominently', () => {
            const currentUser = taxistaPanel.getCurrentUser();
            expect(currentUser?.numeroTaxista).toBe('TX001');
            expect(currentUser?.numeroTaxista).toMatch(/^TX\d{3}$/);
        });
        it('should allow updating personal profile', async () => {
            const updates = {
                personalSettings: {
                    notifications: false,
                    dataSharing: true,
                    autoSync: false
                }
            };
            const result = await taxistaPanel.updatePersonalProfile(updates);
            expect(result).toBe(true);
            expect(config.onSuccess).toHaveBeenCalledWith('Perfil actualizado exitosamente');
            expect(config.onDataUpdated).toHaveBeenCalled();
        });
    });
    describe('Personal History Access - Requirement 4.5', () => {
        beforeEach(() => {
            taxistaPanel = new TaxistaPanel(config);
        });
        it('should provide access to personal services history', () => {
            const services = taxistaPanel.getPersonalServices();
            expect(Array.isArray(services)).toBe(true);
            // All services should belong to the current taxista
            services.forEach(service => {
                expect(service.taxistaId).toBe(mockTaxistaUser.id);
                expect(service.numeroTaxista).toBe(mockTaxistaUser.numeroTaxista);
            });
        });
        it('should provide access to personal expenses history', () => {
            const expenses = taxistaPanel.getPersonalExpenses();
            expect(Array.isArray(expenses)).toBe(true);
            // All expenses should belong to the current taxista
            expenses.forEach(expense => {
                expect(expense.taxistaId).toBe(mockTaxistaUser.id);
                expect(expense.numeroTaxista).toBe(mockTaxistaUser.numeroTaxista);
            });
        });
        it('should support history filtering', async () => {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const filters = {
                dateFrom: lastMonth,
                type: 'services',
                sortBy: 'amount',
                sortOrder: 'desc',
                limit: 10
            };
            await taxistaPanel.filterHistory(filters);
            const currentFilters = taxistaPanel.getCurrentFilters();
            expect(currentFilters.dateFrom).toEqual(lastMonth);
            expect(currentFilters.type).toBe('services');
            expect(currentFilters.sortBy).toBe('amount');
            expect(currentFilters.limit).toBe(10);
        });
        it('should allow clearing history filters', () => {
            taxistaPanel.clearHistoryFilters();
            const filters = taxistaPanel.getCurrentFilters();
            expect(Object.keys(filters)).toHaveLength(0);
        });
        it('should support data export', () => {
            const exportedData = taxistaPanel.exportPersonalData();
            expect(typeof exportedData).toBe('string');
            const parsedData = JSON.parse(exportedData);
            expect(parsedData.taxista.numeroTaxista).toBe(mockTaxistaUser.numeroTaxista);
            expect(parsedData.taxista.nombre).toBe(mockTaxistaUser.nombre);
            expect(parsedData.exportedBy).toBe(mockTaxistaUser.numeroTaxista);
            expect(Array.isArray(parsedData.services)).toBe(true);
            expect(Array.isArray(parsedData.expenses)).toBe(true);
        });
    });
    describe('Independent Access - Requirement 4.3', () => {
        beforeEach(() => {
            taxistaPanel = new TaxistaPanel(config);
        });
        it('should maintain independent access during associations', () => {
            const hasIndependentAccess = taxistaPanel.hasIndependentAccess();
            expect(hasIndependentAccess).toBe(true);
        });
        it('should provide association status information', () => {
            const associationStatus = taxistaPanel.getAssociationStatus();
            expect(associationStatus).toBeDefined();
            expect(typeof associationStatus.isAssociated).toBe('boolean');
            expect(typeof associationStatus.maintainsIndependence).toBe('boolean');
            expect(associationStatus.maintainsIndependence).toBe(true);
        });
        it('should allow creating services independently', async () => {
            const serviceData = {
                serviceType: 'Carrera Urbana',
                totalAmount: 25.50,
                origin: 'Plaza Mayor',
                destination: 'Aeropuerto',
                distance: 15.2,
                duration: 35
            };
            const result = await taxistaPanel.createService(serviceData);
            expect(result).toBe(true);
            expect(config.onSuccess).toHaveBeenCalledWith('Servicio creado exitosamente');
            expect(config.onDataUpdated).toHaveBeenCalled();
        });
        it('should allow creating expenses independently', async () => {
            const expenseData = {
                category: 'Combustible',
                amount: 45.00,
                vendor: 'Gasolinera Test',
                description: 'Repostaje de prueba'
            };
            const result = await taxistaPanel.createExpense(expenseData);
            expect(result).toBe(true);
            expect(config.onSuccess).toHaveBeenCalledWith('Gasto registrado exitosamente');
            expect(config.onDataUpdated).toHaveBeenCalled();
        });
        it('should ensure data is associated with correct taxista', async () => {
            const serviceData = {
                serviceType: 'Carrera Nocturna',
                totalAmount: 30.00
            };
            // Mock the service creation to verify data association
            const createServiceSpy = jest.spyOn(serviceExpenseService, 'createService');
            await taxistaPanel.createService(serviceData);
            expect(createServiceSpy).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockTaxistaUser.id,
                taxistaId: mockTaxistaUser.id,
                numeroTaxista: mockTaxistaUser.numeroTaxista,
                createdBy: mockTaxistaUser.id
            }));
        });
    });
    describe('Notifications', () => {
        beforeEach(() => {
            taxistaPanel = new TaxistaPanel(config);
        });
        it('should provide access to notifications', () => {
            const notifications = taxistaPanel.getNotifications();
            expect(Array.isArray(notifications)).toBe(true);
        });
        it('should provide unread notification count', () => {
            const unreadCount = taxistaPanel.getUnreadNotificationCount();
            expect(typeof unreadCount).toBe('number');
            expect(unreadCount).toBeGreaterThanOrEqual(0);
        });
        it('should allow marking notifications as read', () => {
            const result = taxistaPanel.markNotificationAsRead('test_notification_id');
            expect(typeof result).toBe('boolean');
        });
    });
    describe('Error Handling', () => {
        beforeEach(() => {
            taxistaPanel = new TaxistaPanel(config);
        });
        it('should handle service creation errors gracefully', async () => {
            // Mock service creation to throw error
            jest.spyOn(serviceExpenseService, 'createService').mockRejectedValue(new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Invalid service data'));
            const result = await taxistaPanel.createService({
                serviceType: 'Invalid Service',
                totalAmount: -10 // Invalid amount
            });
            expect(result).toBe(false);
            expect(config.onError).toHaveBeenCalledWith(expect.objectContaining({
                code: AuthErrorCode.VALIDATION_ERROR
            }));
        });
        it('should handle expense creation errors gracefully', async () => {
            // Mock expense creation to throw error
            jest.spyOn(serviceExpenseService, 'createExpense').mockRejectedValue(new AuthError(AuthErrorCode.VALIDATION_ERROR, 'Invalid expense data'));
            const result = await taxistaPanel.createExpense({
                category: 'Invalid Category',
                amount: -5 // Invalid amount
            });
            expect(result).toBe(false);
            expect(config.onError).toHaveBeenCalledWith(expect.objectContaining({
                code: AuthErrorCode.VALIDATION_ERROR
            }));
        });
        it('should handle data export errors gracefully', () => {
            // Mock getCurrentUser to return null to trigger error
            jest.spyOn(taxistaPanel, 'getCurrentUser').mockReturnValue(null);
            expect(() => taxistaPanel.exportPersonalData()).toThrow(AuthError);
        });
    });
    describe('Data Loading', () => {
        beforeEach(() => {
            taxistaPanel = new TaxistaPanel(config);
        });
        it('should track loading state', async () => {
            // Initially should not be loading (constructor completes synchronously)
            expect(taxistaPanel.isLoadingData()).toBe(false);
        });
        it('should reload personal data', async () => {
            const initialStats = taxistaPanel.getPersonalStats();
            await taxistaPanel.loadPersonalData();
            const updatedStats = taxistaPanel.getPersonalStats();
            expect(updatedStats).toBeDefined();
        });
    });
    describe('Integration with Existing Services', () => {
        beforeEach(() => {
            taxistaPanel = new TaxistaPanel(config);
        });
        it('should integrate with role service for permissions', () => {
            const hasIndependentAccess = taxistaPanel.hasIndependentAccess();
            // Should call role service to check permissions
            expect(hasIndependentAccess).toBe(true);
        });
        it('should integrate with service expense service for data operations', async () => {
            const createServiceSpy = jest.spyOn(serviceExpenseService, 'createService');
            await taxistaPanel.createService({
                serviceType: 'Test Service',
                totalAmount: 20.00
            });
            expect(createServiceSpy).toHaveBeenCalled();
        });
        it('should maintain data consistency across services', () => {
            const currentUser = taxistaPanel.getCurrentUser();
            const services = taxistaPanel.getPersonalServices();
            const expenses = taxistaPanel.getPersonalExpenses();
            // All data should be associated with the current user
            services.forEach(service => {
                expect(service.taxistaId).toBe(currentUser?.id);
            });
            expenses.forEach(expense => {
                expect(expense.taxistaId).toBe(currentUser?.id);
            });
        });
    });
});
//# sourceMappingURL=taxista-panel.test.js.map