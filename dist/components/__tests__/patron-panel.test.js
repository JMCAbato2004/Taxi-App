// Unit tests for Patron Panel Component
// Tests core functionality, error handling, and integration with services
// Requirements: 3.1, 3.2, 2.1, 2.2
import { PatronPanel } from '../patron-panel';
import { UserRole, AuthErrorCode } from '../../types';
// Mock services
class MockAuthService {
    constructor() {
        this.currentUser = null;
    }
    setCurrentUser(user) {
        this.currentUser = user;
    }
    getCurrentUser() {
        return this.currentUser;
    }
    isAuthenticated() {
        return this.currentUser !== null;
    }
}
class MockRoleService {
    constructor() {
        this.users = [];
        this.associations = [];
        this.notifications = [];
    }
    setUsers(users) {
        this.users = users;
    }
    setAssociations(associations) {
        this.associations = associations;
    }
    setNotifications(notifications) {
        this.notifications = notifications;
    }
    async getAssociatedUsers() {
        // Mock implementation
        return this.users.filter(u => u.rol === UserRole.TAXISTA);
    }
    async searchAvailableTaxistas(searchTerm) {
        const available = this.users.filter(u => u.rol === UserRole.TAXISTA);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return available
                .filter(u => u.nombre.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term) ||
                (u.numeroTaxista && u.numeroTaxista.toLowerCase().includes(term)))
                .map(u => ({
                id: u.id,
                email: u.email,
                nombre: u.nombre,
                telefono: u.telefono,
                numeroTaxista: u.numeroTaxista,
                fechaCreacion: u.fechaCreacion
            }));
        }
        return available.map(u => ({
            id: u.id,
            email: u.email,
            nombre: u.nombre,
            telefono: u.telefono,
            numeroTaxista: u.numeroTaxista,
            fechaCreacion: u.fechaCreacion
        }));
    }
    async searchAvailableTaxistasAdvanced(options = {}) {
        let results = await this.searchAvailableTaxistas(options.searchTerm);
        if (options.sortBy) {
            results.sort((a, b) => {
                let aValue = a[options.sortBy];
                let bValue = b[options.sortBy];
                if (options.sortBy === 'fechaCreacion') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                }
                else {
                    aValue = String(aValue).toLowerCase();
                    bValue = String(bValue).toLowerCase();
                }
                const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                return options.sortOrder === 'desc' ? -comparison : comparison;
            });
        }
        if (options.limit && options.limit > 0) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    async createAssociation(patronId, taxistaId) {
        const association = {
            id: 'assoc_' + Date.now(),
            patronId,
            taxistaId,
            fechaAsociacion: new Date(),
            activa: true
        };
        this.associations.push(association);
        return association;
    }
    async removeAssociation(associationId) {
        const association = this.associations.find(a => a.id === associationId);
        if (association) {
            association.activa = false;
        }
    }
    async getAssociationsForPatron(patronId) {
        return this.associations.filter(a => a.patronId === patronId);
    }
    getAssociationStatistics() {
        return {
            totalAssociations: this.associations.length,
            activeAssociations: this.associations.filter(a => a.activa).length,
            recentAssociations: 1
        };
    }
    getAggregatedDataSummary(data, aggregationField = 'amount') {
        return {
            totalRecords: data.length,
            totalAmount: data.length * 25, // Mock calculation
            averageAmount: 25
        };
    }
    getNotifications(unreadOnly = false) {
        let filtered = this.notifications;
        if (unreadOnly) {
            filtered = filtered.filter(n => !n.read);
        }
        return filtered;
    }
    markNotificationAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            return true;
        }
        return false;
    }
    getUnreadNotificationCount() {
        return this.notifications.filter(n => !n.read).length;
    }
    getAccessibleUsers() {
        return this.users;
    }
}
describe('PatronPanel', () => {
    let mockAuthService;
    let mockRoleService;
    let patronPanel;
    let config;
    let mockPatron;
    let mockTaxistas;
    beforeEach(() => {
        mockAuthService = new MockAuthService();
        mockRoleService = new MockRoleService();
        mockPatron = {
            id: 'patron_1',
            email: 'patron@test.com',
            nombre: 'Juan Pérez',
            telefono: '+34123456789',
            rol: UserRole.PATRON,
            activo: true,
            fechaCreacion: new Date('2024-01-01'),
            fechaActualizacion: new Date()
        };
        mockTaxistas = [
            {
                id: 'taxista_1',
                email: 'taxista1@test.com',
                nombre: 'María García',
                telefono: '+34987654321',
                rol: UserRole.TAXISTA,
                numeroTaxista: 'TX001',
                activo: true,
                fechaCreacion: new Date('2024-01-15'),
                fechaActualizacion: new Date()
            },
            {
                id: 'taxista_2',
                email: 'taxista2@test.com',
                nombre: 'Carlos López',
                telefono: '+34555666777',
                rol: UserRole.TAXISTA,
                numeroTaxista: 'TX002',
                activo: true,
                fechaCreacion: new Date('2024-01-20'),
                fechaActualizacion: new Date()
            }
        ];
        config = {
            authService: mockAuthService,
            roleService: mockRoleService,
            onError: jest.fn(),
            onSuccess: jest.fn(),
            onAssociationCreated: jest.fn(),
            onAssociationRemoved: jest.fn()
        };
        mockAuthService.setCurrentUser(mockPatron);
        mockRoleService.setUsers([mockPatron, ...mockTaxistas]);
    });
    describe('Initialization', () => {
        it('should initialize successfully with valid patron user', async () => {
            patronPanel = new PatronPanel(config);
            expect(patronPanel).toBeDefined();
            expect(patronPanel.getDashboardData()).toBeDefined();
        });
        it('should throw error when user is not a patron', () => {
            const taxistaUser = { ...mockPatron, rol: UserRole.TAXISTA };
            mockAuthService.setCurrentUser(taxistaUser);
            expect(() => {
                new PatronPanel(config);
            }).toThrow();
            expect(config.onError).toHaveBeenCalledWith(expect.objectContaining({
                code: AuthErrorCode.INSUFFICIENT_PERMISSIONS
            }));
        });
        it('should throw error when no user is authenticated', () => {
            mockAuthService.setCurrentUser(null);
            expect(() => {
                new PatronPanel(config);
            }).toThrow();
            expect(config.onError).toHaveBeenCalled();
        });
    });
    describe('Dashboard Data', () => {
        beforeEach(() => {
            patronPanel = new PatronPanel(config);
        });
        it('should load dashboard data correctly', () => {
            const dashboardData = patronPanel.getDashboardData();
            expect(dashboardData).toEqual({
                patronId: mockPatron.id,
                patronNombre: mockPatron.nombre,
                patronEmail: mockPatron.email,
                totalTaxistasAsociados: 0, // No associations initially
                nuevasAsociacionesMes: 1
            });
        });
        it('should update dashboard data after creating associations', async () => {
            // Create an association
            await patronPanel.createAssociation(mockTaxistas[0].id);
            const dashboardData = patronPanel.getDashboardData();
            expect(dashboardData?.totalTaxistasAsociados).toBeGreaterThan(0);
        });
    });
    describe('Taxista Search', () => {
        beforeEach(() => {
            patronPanel = new PatronPanel(config);
        });
        it('should search available taxistas without filters', async () => {
            const results = await patronPanel.searchTaxistas();
            expect(results).toHaveLength(2);
            expect(results[0]).toEqual(expect.objectContaining({
                id: mockTaxistas[0].id,
                nombre: mockTaxistas[0].nombre,
                numeroTaxista: mockTaxistas[0].numeroTaxista
            }));
        });
        it('should search taxistas with search term filter', async () => {
            const filters = {
                searchTerm: 'María'
            };
            const results = await patronPanel.searchTaxistas(filters);
            expect(results).toHaveLength(1);
            expect(results[0].nombre).toBe('María García');
        });
        it('should search taxistas with sorting', async () => {
            const filters = {
                sortBy: 'nombre',
                sortOrder: 'desc'
            };
            const results = await patronPanel.searchTaxistas(filters);
            expect(results[0].nombre).toBe('María García'); // Should be first when sorted desc
        });
        it('should search taxistas with limit', async () => {
            const filters = {
                limit: 1
            };
            const results = await patronPanel.searchTaxistas(filters);
            expect(results).toHaveLength(1);
        });
        it('should handle search errors gracefully', async () => {
            // Mock service to throw error
            jest.spyOn(mockRoleService, 'searchAvailableTaxistasAdvanced')
                .mockRejectedValue(new Error('Search failed'));
            const results = await patronPanel.searchTaxistas();
            expect(results).toEqual([]);
            expect(config.onError).toHaveBeenCalled();
        });
    });
    describe('Association Management', () => {
        beforeEach(() => {
            patronPanel = new PatronPanel(config);
        });
        it('should create association successfully', async () => {
            const success = await patronPanel.createAssociation(mockTaxistas[0].id);
            expect(success).toBe(true);
            expect(config.onSuccess).toHaveBeenCalledWith(expect.stringContaining('Asociación creada con María García'));
            expect(config.onAssociationCreated).toHaveBeenCalled();
        });
        it('should handle create association with invalid taxista', async () => {
            const success = await patronPanel.createAssociation('invalid_id');
            expect(success).toBe(false);
            expect(config.onError).toHaveBeenCalled();
        });
        it('should remove association successfully', async () => {
            // First create an association
            await patronPanel.createAssociation(mockTaxistas[0].id);
            // Get the association ID
            const associations = patronPanel.getAssociations();
            const associationId = associations[0]?.id;
            if (associationId) {
                const success = await patronPanel.removeAssociation(associationId);
                expect(success).toBe(true);
                expect(config.onSuccess).toHaveBeenCalledWith(expect.stringContaining('Asociación con'));
                expect(config.onAssociationRemoved).toHaveBeenCalledWith(associationId);
            }
        });
        it('should handle remove association with invalid ID', async () => {
            const success = await patronPanel.removeAssociation('invalid_id');
            expect(success).toBe(false);
            expect(config.onError).toHaveBeenCalled();
        });
    });
    describe('Report Data', () => {
        beforeEach(() => {
            patronPanel = new PatronPanel(config);
        });
        it('should generate report data correctly', () => {
            const reportData = patronPanel.getReportData();
            expect(reportData).toEqual(expect.objectContaining({
                totalTaxistas: expect.any(Number),
                activeTaxistas: expect.any(Number),
                totalServices: expect.any(Number),
                totalRevenue: expect.any(Number),
                averageServiceValue: expect.any(Number),
                monthlyGrowth: expect.any(Number),
                topPerformingTaxistas: expect.any(Array)
            }));
        });
        it('should include top performing taxistas in report', () => {
            const reportData = patronPanel.getReportData();
            expect(reportData?.topPerformingTaxistas).toBeDefined();
            expect(reportData?.topPerformingTaxistas.length).toBeGreaterThanOrEqual(0);
            if (reportData?.topPerformingTaxistas.length > 0) {
                expect(reportData.topPerformingTaxistas[0]).toEqual(expect.objectContaining({
                    id: expect.any(String),
                    nombre: expect.any(String),
                    numeroTaxista: expect.any(String),
                    totalServices: expect.any(Number),
                    totalRevenue: expect.any(Number)
                }));
            }
        });
    });
    describe('Notifications', () => {
        beforeEach(() => {
            patronPanel = new PatronPanel(config);
            const mockNotifications = [
                {
                    id: 'notif_1',
                    userId: mockPatron.id,
                    type: 'association_created',
                    title: 'Nueva Asociación',
                    message: 'Asociación creada exitosamente',
                    timestamp: new Date(),
                    read: false
                },
                {
                    id: 'notif_2',
                    userId: mockPatron.id,
                    type: 'association_removed',
                    title: 'Asociación Terminada',
                    message: 'Asociación terminada',
                    timestamp: new Date(),
                    read: true
                }
            ];
            mockRoleService.setNotifications(mockNotifications);
        });
        it('should get all notifications', () => {
            const notifications = patronPanel.getNotifications();
            expect(notifications).toHaveLength(2);
        });
        it('should get only unread notifications', () => {
            const unreadNotifications = patronPanel.getNotifications(true);
            expect(unreadNotifications).toHaveLength(1);
            expect(unreadNotifications[0].read).toBe(false);
        });
        it('should get unread notification count', () => {
            const count = patronPanel.getUnreadNotificationCount();
            expect(count).toBe(1);
        });
        it('should mark notification as read', () => {
            const success = patronPanel.markNotificationAsRead('notif_1');
            expect(success).toBe(true);
            const count = patronPanel.getUnreadNotificationCount();
            expect(count).toBe(0);
        });
        it('should handle marking non-existent notification as read', () => {
            const success = patronPanel.markNotificationAsRead('invalid_id');
            expect(success).toBe(false);
        });
    });
    describe('Data Export', () => {
        beforeEach(() => {
            patronPanel = new PatronPanel(config);
        });
        it('should export report data as JSON', () => {
            const exportData = patronPanel.exportReportData();
            expect(exportData).toBeDefined();
            expect(() => JSON.parse(exportData)).not.toThrow();
            const parsed = JSON.parse(exportData);
            expect(parsed).toEqual(expect.objectContaining({
                patron: expect.objectContaining({
                    id: mockPatron.id,
                    nombre: mockPatron.nombre,
                    email: mockPatron.email
                }),
                dashboard: expect.any(Object),
                reportData: expect.any(Object),
                associations: expect.any(Array),
                exportDate: expect.any(String)
            }));
        });
    });
    describe('Loading State', () => {
        it('should track loading state correctly', () => {
            patronPanel = new PatronPanel(config);
            // Initially should not be loading (since we're using synchronous mocks)
            expect(patronPanel.isLoadingData()).toBe(false);
        });
    });
    describe('Filter Management', () => {
        beforeEach(() => {
            patronPanel = new PatronPanel(config);
        });
        it('should store and retrieve current filters', async () => {
            const filters = {
                searchTerm: 'test',
                sortBy: 'nombre',
                sortOrder: 'desc'
            };
            await patronPanel.searchTaxistas(filters);
            const currentFilters = patronPanel.getCurrentFilters();
            expect(currentFilters).toEqual(expect.objectContaining(filters));
        });
        it('should clear filters', () => {
            patronPanel.clearFilters();
            const currentFilters = patronPanel.getCurrentFilters();
            expect(currentFilters).toEqual({});
        });
    });
    describe('Error Handling', () => {
        beforeEach(() => {
            patronPanel = new PatronPanel(config);
        });
        it('should handle service errors in loadData', async () => {
            // Mock service to throw error
            jest.spyOn(mockRoleService, 'getAssociatedUsers')
                .mockRejectedValue(new Error('Service error'));
            await patronPanel.loadData();
            expect(config.onError).toHaveBeenCalled();
        });
        it('should handle authentication errors', () => {
            mockAuthService.setCurrentUser(null);
            expect(() => {
                new PatronPanel(config);
            }).toThrow();
        });
        it('should handle role permission errors', () => {
            const invalidUser = { ...mockPatron, rol: UserRole.TAXISTA };
            mockAuthService.setCurrentUser(invalidUser);
            expect(() => {
                new PatronPanel(config);
            }).toThrow();
        });
    });
    describe('Integration Tests', () => {
        beforeEach(() => {
            patronPanel = new PatronPanel(config);
        });
        it('should complete full workflow: search -> associate -> remove', async () => {
            // 1. Search for available taxistas
            const availableTaxistas = await patronPanel.searchTaxistas();
            expect(availableTaxistas.length).toBeGreaterThan(0);
            // 2. Create association
            const success = await patronPanel.createAssociation(availableTaxistas[0].id);
            expect(success).toBe(true);
            // 3. Verify association exists
            const associatedTaxistas = patronPanel.getAssociatedTaxistas();
            expect(associatedTaxistas.length).toBeGreaterThan(0);
            // 4. Remove association
            const associations = patronPanel.getAssociations();
            if (associations.length > 0) {
                const removeSuccess = await patronPanel.removeAssociation(associations[0].id);
                expect(removeSuccess).toBe(true);
            }
        });
        it('should update dashboard data throughout workflow', async () => {
            const initialDashboard = patronPanel.getDashboardData();
            const initialCount = initialDashboard?.totalTaxistasAsociados || 0;
            // Create association
            await patronPanel.createAssociation(mockTaxistas[0].id);
            const updatedDashboard = patronPanel.getDashboardData();
            expect(updatedDashboard?.totalTaxistasAsociados).toBeGreaterThan(initialCount);
        });
    });
});
//# sourceMappingURL=patron-panel.test.js.map