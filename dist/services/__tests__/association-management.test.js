/**
 * Unit tests for Association Management functionality in RoleService
 * Tests Task 5.3: Implementar gestión de asociaciones Patrón-Taxista
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */
import { RoleService } from '../role-service';
import { AuthService } from '../auth-service';
import { UserRole, Permission } from '../../types';
import { JWTUtils } from '../../utils/jwt-utils';
import { CryptoUtils } from '../../utils/crypto-utils';
describe('RoleService - Association Management (Task 5.3)', () => {
    let roleService;
    let authService;
    let jwtUtils;
    let cryptoUtils;
    beforeEach(() => {
        jwtUtils = new JWTUtils();
        cryptoUtils = new CryptoUtils();
        authService = new AuthService(jwtUtils, cryptoUtils);
        roleService = new RoleService(() => authService.getCurrentUser());
        localStorage.clear();
    });
    describe('Search Available Taxistas', () => {
        let patron;
        let taxista1;
        let taxista2;
        let taxista3;
        beforeEach(async () => {
            // Create test users
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const taxista1Data = {
                email: 'carlos@test.com',
                password: 'Password123',
                nombre: 'Carlos García',
                telefono: '+1234567890',
                rol: UserRole.TAXISTA
            };
            const taxista2Data = {
                email: 'maria@test.com',
                password: 'Password123',
                nombre: 'María López',
                telefono: '+1234567891',
                rol: UserRole.TAXISTA
            };
            const taxista3Data = {
                email: 'juan@test.com',
                password: 'Password123',
                nombre: 'Juan Pérez',
                rol: UserRole.TAXISTA
            };
            patron = await authService.register(patronData);
            taxista1 = await authService.register(taxista1Data);
            taxista2 = await authService.register(taxista2Data);
            taxista3 = await authService.register(taxista3Data);
            // Login as patron
            await authService.login({ email: patron.email, password: 'Password123' });
        });
        it('should return all available taxistas when no search term provided', async () => {
            const availableTaxistas = await roleService.searchAvailableTaxistas();
            expect(availableTaxistas).toHaveLength(3);
            expect(availableTaxistas.map(t => t.nombre)).toContain('Carlos García');
            expect(availableTaxistas.map(t => t.nombre)).toContain('María López');
            expect(availableTaxistas.map(t => t.nombre)).toContain('Juan Pérez');
        });
        it('should filter taxistas by name search term', async () => {
            const availableTaxistas = await roleService.searchAvailableTaxistas('carlos');
            expect(availableTaxistas).toHaveLength(1);
            expect(availableTaxistas[0].nombre).toBe('Carlos García');
            expect(availableTaxistas[0].email).toBe('carlos@test.com');
            expect(availableTaxistas[0].telefono).toBe('+1234567890');
        });
        it('should filter taxistas by email search term', async () => {
            const availableTaxistas = await roleService.searchAvailableTaxistas('maria@test');
            expect(availableTaxistas).toHaveLength(1);
            expect(availableTaxistas[0].nombre).toBe('María López');
        });
        it('should filter taxistas by numero taxista', async () => {
            const availableTaxistas = await roleService.searchAvailableTaxistas(taxista1.numeroTaxista);
            expect(availableTaxistas).toHaveLength(1);
            expect(availableTaxistas[0].id).toBe(taxista1.id);
        });
        it('should exclude already associated taxistas from search results', async () => {
            // Associate taxista1 with patron
            await roleService.createAssociation(patron.id, taxista1.id);
            const availableTaxistas = await roleService.searchAvailableTaxistas();
            expect(availableTaxistas).toHaveLength(2);
            expect(availableTaxistas.map(t => t.id)).not.toContain(taxista1.id);
            expect(availableTaxistas.map(t => t.id)).toContain(taxista2.id);
            expect(availableTaxistas.map(t => t.id)).toContain(taxista3.id);
        });
        it('should return empty array for case-insensitive search with no matches', async () => {
            const availableTaxistas = await roleService.searchAvailableTaxistas('nonexistent');
            expect(availableTaxistas).toHaveLength(0);
        });
        it('should throw error when non-patron tries to search', async () => {
            await authService.login({ email: taxista1.email, password: 'Password123' });
            await expect(roleService.searchAvailableTaxistas())
                .rejects
                .toThrow('Solo los patrones pueden buscar taxistas');
        });
        it('should throw error when unauthenticated user tries to search', async () => {
            await authService.logout();
            await expect(roleService.searchAvailableTaxistas())
                .rejects
                .toThrow('Solo los patrones pueden buscar taxistas');
        });
    });
    describe('Advanced Search for Available Taxistas', () => {
        let patron;
        let taxistas;
        beforeEach(async () => {
            // Create patron
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            patron = await authService.register(patronData);
            // Create multiple taxistas with different creation times
            taxistas = [];
            const taxistaNames = ['Ana Martín', 'Bruno Silva', 'Carmen Ruiz', 'Diego Torres'];
            for (let i = 0; i < taxistaNames.length; i++) {
                const taxistaData = {
                    email: `taxista${i + 1}@test.com`,
                    password: 'Password123',
                    nombre: taxistaNames[i],
                    rol: UserRole.TAXISTA
                };
                const taxista = await authService.register(taxistaData);
                taxistas.push(taxista);
                // Add small delay to ensure different creation times
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            await authService.login({ email: patron.email, password: 'Password123' });
        });
        it('should sort taxistas by name ascending', async () => {
            const result = await roleService.searchAvailableTaxistasAdvanced({
                sortBy: 'nombre',
                sortOrder: 'asc'
            });
            expect(result).toHaveLength(4);
            expect(result[0].nombre).toBe('Ana Martín');
            expect(result[1].nombre).toBe('Bruno Silva');
            expect(result[2].nombre).toBe('Carmen Ruiz');
            expect(result[3].nombre).toBe('Diego Torres');
        });
        it('should sort taxistas by name descending', async () => {
            const result = await roleService.searchAvailableTaxistasAdvanced({
                sortBy: 'nombre',
                sortOrder: 'desc'
            });
            expect(result).toHaveLength(4);
            expect(result[0].nombre).toBe('Diego Torres');
            expect(result[1].nombre).toBe('Carmen Ruiz');
            expect(result[2].nombre).toBe('Bruno Silva');
            expect(result[3].nombre).toBe('Ana Martín');
        });
        it('should sort taxistas by creation date descending (newest first)', async () => {
            const result = await roleService.searchAvailableTaxistasAdvanced({
                sortBy: 'fechaCreacion',
                sortOrder: 'desc'
            });
            expect(result).toHaveLength(4);
            // Diego Torres was created last, so should be first
            expect(result[0].nombre).toBe('Diego Torres');
            expect(result[3].nombre).toBe('Ana Martín');
        });
        it('should limit results when limit is specified', async () => {
            const result = await roleService.searchAvailableTaxistasAdvanced({
                sortBy: 'nombre',
                sortOrder: 'asc',
                limit: 2
            });
            expect(result).toHaveLength(2);
            expect(result[0].nombre).toBe('Ana Martín');
            expect(result[1].nombre).toBe('Bruno Silva');
        });
        it('should combine search term with sorting and limiting', async () => {
            const result = await roleService.searchAvailableTaxistasAdvanced({
                searchTerm: 'an', // Should match Ana Martín
                sortBy: 'nombre',
                sortOrder: 'desc',
                limit: 1
            });
            expect(result).toHaveLength(1);
            expect(result[0].nombre).toBe('Ana Martín');
        });
    });
    describe('Create Association', () => {
        let patron;
        let taxista;
        let anotherPatron;
        beforeEach(async () => {
            // Create test users
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const taxistaData = {
                email: 'taxista@test.com',
                password: 'Password123',
                nombre: 'Test Taxista',
                rol: UserRole.TAXISTA
            };
            const anotherPatronData = {
                email: 'patron2@test.com',
                password: 'Password123',
                nombre: 'Another Patron',
                rol: UserRole.PATRON
            };
            patron = await authService.register(patronData);
            taxista = await authService.register(taxistaData);
            anotherPatron = await authService.register(anotherPatronData);
            // Login as patron
            await authService.login({ email: patron.email, password: 'Password123' });
        });
        it('should create association successfully', async () => {
            const association = await roleService.createAssociation(patron.id, taxista.id);
            expect(association).toBeDefined();
            expect(association.patronId).toBe(patron.id);
            expect(association.taxistaId).toBe(taxista.id);
            expect(association.activa).toBe(true);
            expect(association.fechaAsociacion).toBeInstanceOf(Date);
            expect(association.id).toMatch(/^assoc_/);
        });
        it('should create notifications for both patron and taxista', async () => {
            await roleService.createAssociation(patron.id, taxista.id);
            // Check patron notifications
            const patronNotifications = roleService.getNotifications();
            expect(patronNotifications).toHaveLength(1);
            expect(patronNotifications[0].type).toBe('association_created');
            expect(patronNotifications[0].title).toBe('Asociación Creada');
            expect(patronNotifications[0].message).toContain('Test Taxista');
            // Check taxista notifications
            await authService.login({ email: taxista.email, password: 'Password123' });
            const taxistaNotifications = roleService.getNotifications();
            expect(taxistaNotifications).toHaveLength(1);
            expect(taxistaNotifications[0].type).toBe('association_created');
            expect(taxistaNotifications[0].title).toBe('Nueva Asociación');
            expect(taxistaNotifications[0].message).toContain('Test Patron');
        });
        it('should throw error when patron not found', async () => {
            await expect(roleService.createAssociation('invalid-patron-id', taxista.id))
                .rejects
                .toThrow('Patrón no encontrado');
        });
        it('should throw error when taxista not found', async () => {
            await expect(roleService.createAssociation(patron.id, 'invalid-taxista-id'))
                .rejects
                .toThrow('Taxista no encontrado');
        });
        it('should throw error when trying to associate with wrong role types', async () => {
            // Try to associate two patrones
            await expect(roleService.createAssociation(patron.id, anotherPatron.id))
                .rejects
                .toThrow('Taxista no encontrado');
            // Try to associate taxista as patron
            await expect(roleService.createAssociation(taxista.id, patron.id))
                .rejects
                .toThrow('Patrón no encontrado');
        });
        it('should throw error when association already exists', async () => {
            await roleService.createAssociation(patron.id, taxista.id);
            await expect(roleService.createAssociation(patron.id, taxista.id))
                .rejects
                .toThrow('La asociación ya existe');
        });
        it('should throw error when taxista is already associated with another patron', async () => {
            // Associate taxista with first patron
            await roleService.createAssociation(patron.id, taxista.id);
            // Try to associate same taxista with another patron
            await authService.login({ email: anotherPatron.email, password: 'Password123' });
            await expect(roleService.createAssociation(anotherPatron.id, taxista.id))
                .rejects
                .toThrow('El taxista ya está asociado a otro patrón');
        });
        it('should throw error when user lacks permissions', async () => {
            await authService.login({ email: taxista.email, password: 'Password123' });
            await expect(roleService.createAssociation(patron.id, taxista.id))
                .rejects
                .toThrow('Sin permisos para gestionar asociaciones');
        });
        it('should throw error when user is not authenticated', async () => {
            await authService.logout();
            await expect(roleService.createAssociation(patron.id, taxista.id))
                .rejects
                .toThrow('Usuario no autenticado');
        });
    });
    describe('Remove Association', () => {
        let patron;
        let taxista;
        let association;
        beforeEach(async () => {
            // Create test users
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const taxistaData = {
                email: 'taxista@test.com',
                password: 'Password123',
                nombre: 'Test Taxista',
                rol: UserRole.TAXISTA
            };
            patron = await authService.register(patronData);
            taxista = await authService.register(taxistaData);
            // Login as patron and create association
            await authService.login({ email: patron.email, password: 'Password123' });
            association = await roleService.createAssociation(patron.id, taxista.id);
        });
        it('should remove association successfully', async () => {
            await roleService.removeAssociation(association.id);
            // Verify association is marked as inactive
            const associations = await roleService.getAssociationsForPatron(patron.id);
            const removedAssociation = associations.find(a => a.id === association.id);
            expect(removedAssociation?.activa).toBe(false);
        });
        it('should create notifications for both users when association is removed', async () => {
            // Clear existing notifications from creation
            roleService.markAllNotificationsAsRead();
            await authService.login({ email: taxista.email, password: 'Password123' });
            roleService.markAllNotificationsAsRead();
            await authService.login({ email: patron.email, password: 'Password123' });
            await roleService.removeAssociation(association.id);
            // Check patron notifications
            const patronNotifications = roleService.getNotifications(true); // unread only
            expect(patronNotifications).toHaveLength(1);
            expect(patronNotifications[0].type).toBe('association_removed');
            expect(patronNotifications[0].title).toBe('Asociación Terminada');
            // Check taxista notifications
            await authService.login({ email: taxista.email, password: 'Password123' });
            const taxistaNotifications = roleService.getNotifications(true); // unread only
            expect(taxistaNotifications).toHaveLength(1);
            expect(taxistaNotifications[0].type).toBe('association_removed');
            expect(taxistaNotifications[0].title).toBe('Asociación Terminada');
        });
        it('should throw error when association not found', async () => {
            await expect(roleService.removeAssociation('invalid-association-id'))
                .rejects
                .toThrow('Asociación no encontrada');
        });
        it('should throw error when patron tries to remove association they do not own', async () => {
            // Create another patron
            const anotherPatronData = {
                email: 'patron2@test.com',
                password: 'Password123',
                nombre: 'Another Patron',
                rol: UserRole.PATRON
            };
            const anotherPatron = await authService.register(anotherPatronData);
            // Login as the other patron
            await authService.login({ email: anotherPatron.email, password: 'Password123' });
            await expect(roleService.removeAssociation(association.id))
                .rejects
                .toThrow('No tienes permisos para eliminar esta asociación');
        });
        it('should throw error when user lacks permissions', async () => {
            await authService.login({ email: taxista.email, password: 'Password123' });
            await expect(roleService.removeAssociation(association.id))
                .rejects
                .toThrow('Sin permisos para gestionar asociaciones');
        });
        it('should throw error when user is not authenticated', async () => {
            await authService.logout();
            await expect(roleService.removeAssociation(association.id))
                .rejects
                .toThrow('Usuario no autenticado');
        });
    });
    describe('Notification System', () => {
        let patron;
        let taxista;
        beforeEach(async () => {
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const taxistaData = {
                email: 'taxista@test.com',
                password: 'Password123',
                nombre: 'Test Taxista',
                rol: UserRole.TAXISTA
            };
            patron = await authService.register(patronData);
            taxista = await authService.register(taxistaData);
            await authService.login({ email: patron.email, password: 'Password123' });
        });
        it('should get notifications for current user', async () => {
            await roleService.createAssociation(patron.id, taxista.id);
            const notifications = roleService.getNotifications();
            expect(notifications).toHaveLength(1);
            expect(notifications[0].userId).toBe(patron.id);
            expect(notifications[0].read).toBe(false);
        });
        it('should get only unread notifications when requested', async () => {
            await roleService.createAssociation(patron.id, taxista.id);
            const allNotifications = roleService.getNotifications();
            expect(allNotifications).toHaveLength(1);
            // Mark as read
            roleService.markNotificationAsRead(allNotifications[0].id);
            const unreadNotifications = roleService.getNotifications(true);
            expect(unreadNotifications).toHaveLength(0);
        });
        it('should mark notification as read', async () => {
            await roleService.createAssociation(patron.id, taxista.id);
            const notifications = roleService.getNotifications();
            const notificationId = notifications[0].id;
            const result = roleService.markNotificationAsRead(notificationId);
            expect(result).toBe(true);
            const updatedNotifications = roleService.getNotifications();
            expect(updatedNotifications[0].read).toBe(true);
        });
        it('should not mark notification as read for wrong user', async () => {
            await roleService.createAssociation(patron.id, taxista.id);
            const patronNotifications = roleService.getNotifications();
            const notificationId = patronNotifications[0].id;
            // Switch to taxista
            await authService.login({ email: taxista.email, password: 'Password123' });
            const result = roleService.markNotificationAsRead(notificationId);
            expect(result).toBe(false);
        });
        it('should mark all notifications as read', async () => {
            await roleService.createAssociation(patron.id, taxista.id);
            // Create another association to generate more notifications
            const taxista2Data = {
                email: 'taxista2@test.com',
                password: 'Password123',
                nombre: 'Test Taxista 2',
                rol: UserRole.TAXISTA
            };
            const taxista2 = await authService.register(taxista2Data);
            await roleService.createAssociation(patron.id, taxista2.id);
            expect(roleService.getUnreadNotificationCount()).toBe(2);
            const markedCount = roleService.markAllNotificationsAsRead();
            expect(markedCount).toBe(2);
            expect(roleService.getUnreadNotificationCount()).toBe(0);
        });
        it('should get correct unread notification count', async () => {
            expect(roleService.getUnreadNotificationCount()).toBe(0);
            await roleService.createAssociation(patron.id, taxista.id);
            expect(roleService.getUnreadNotificationCount()).toBe(1);
            const notifications = roleService.getNotifications();
            roleService.markNotificationAsRead(notifications[0].id);
            expect(roleService.getUnreadNotificationCount()).toBe(0);
        });
        it('should sort notifications by timestamp (newest first)', async () => {
            await roleService.createAssociation(patron.id, taxista.id);
            // Add delay and create another notification
            await new Promise(resolve => setTimeout(resolve, 10));
            const taxista2Data = {
                email: 'taxista2@test.com',
                password: 'Password123',
                nombre: 'Test Taxista 2',
                rol: UserRole.TAXISTA
            };
            const taxista2 = await authService.register(taxista2Data);
            await roleService.createAssociation(patron.id, taxista2.id);
            const notifications = roleService.getNotifications();
            expect(notifications).toHaveLength(2);
            // Newer notification should be first
            expect(new Date(notifications[0].timestamp).getTime())
                .toBeGreaterThan(new Date(notifications[1].timestamp).getTime());
        });
    });
    describe('Association Statistics', () => {
        let patron;
        let taxistas;
        beforeEach(async () => {
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            patron = await authService.register(patronData);
            // Create multiple taxistas
            taxistas = [];
            for (let i = 0; i < 3; i++) {
                const taxistaData = {
                    email: `taxista${i + 1}@test.com`,
                    password: 'Password123',
                    nombre: `Test Taxista ${i + 1}`,
                    rol: UserRole.TAXISTA
                };
                const taxista = await authService.register(taxistaData);
                taxistas.push(taxista);
            }
            await authService.login({ email: patron.email, password: 'Password123' });
        });
        it('should return null for non-patron users', async () => {
            await authService.login({ email: taxistas[0].email, password: 'Password123' });
            const stats = roleService.getAssociationStatistics();
            expect(stats).toBeNull();
        });
        it('should return correct statistics for patron with no associations', async () => {
            const stats = roleService.getAssociationStatistics();
            expect(stats).toEqual({
                totalAssociations: 0,
                activeAssociations: 0,
                inactiveAssociations: 0,
                recentAssociations: 0,
                oldestAssociation: null,
                newestAssociation: null
            });
        });
        it('should return correct statistics for patron with active associations', async () => {
            // Create associations
            const association1 = await roleService.createAssociation(patron.id, taxistas[0].id);
            await new Promise(resolve => setTimeout(resolve, 10));
            const association2 = await roleService.createAssociation(patron.id, taxistas[1].id);
            const stats = roleService.getAssociationStatistics();
            expect(stats.totalAssociations).toBe(2);
            expect(stats.activeAssociations).toBe(2);
            expect(stats.inactiveAssociations).toBe(0);
            expect(stats.recentAssociations).toBe(2); // Both created within 30 days
            expect(stats.oldestAssociation).toEqual(association1.fechaAsociacion);
            expect(stats.newestAssociation).toEqual(association2.fechaAsociacion);
        });
        it('should return correct statistics after removing associations', async () => {
            // Create associations
            const association1 = await roleService.createAssociation(patron.id, taxistas[0].id);
            const association2 = await roleService.createAssociation(patron.id, taxistas[1].id);
            // Remove one association
            await roleService.removeAssociation(association1.id);
            const stats = roleService.getAssociationStatistics();
            expect(stats.totalAssociations).toBe(2);
            expect(stats.activeAssociations).toBe(1);
            expect(stats.inactiveAssociations).toBe(1);
            expect(stats.recentAssociations).toBe(2); // Both created recently, regardless of status
        });
    });
    describe('Integration with Existing Functionality', () => {
        let patron;
        let taxista;
        beforeEach(async () => {
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const taxistaData = {
                email: 'taxista@test.com',
                password: 'Password123',
                nombre: 'Test Taxista',
                rol: UserRole.TAXISTA
            };
            patron = await authService.register(patronData);
            taxista = await authService.register(taxistaData);
            await authService.login({ email: patron.email, password: 'Password123' });
            await roleService.createAssociation(patron.id, taxista.id);
        });
        it('should update associated users list after creating association', async () => {
            const associatedUsers = await roleService.getAssociatedUsers();
            expect(associatedUsers).toHaveLength(1);
            expect(associatedUsers[0].id).toBe(taxista.id);
            expect(associatedUsers[0].nombre).toBe('Test Taxista');
        });
        it('should update associated users list after removing association', async () => {
            const associations = await roleService.getAssociationsForPatron(patron.id);
            await roleService.removeAssociation(associations[0].id);
            const associatedUsers = await roleService.getAssociatedUsers();
            expect(associatedUsers).toHaveLength(0);
        });
        it('should maintain individual account access for taxista after association', async () => {
            await authService.login({ email: taxista.email, password: 'Password123' });
            // Taxista should still be able to access their own data
            expect(roleService.canAccessUserData(taxista.id)).toBe(true);
            expect(roleService.hasPermission(Permission.VIEW_OWN_DATA)).toBe(true);
            expect(roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)).toBe(true);
        });
        it('should maintain individual account access for taxista after association removal', async () => {
            // Remove association
            await authService.login({ email: patron.email, password: 'Password123' });
            const associations = await roleService.getAssociationsForPatron(patron.id);
            await roleService.removeAssociation(associations[0].id);
            // Taxista should still have access to their account
            await authService.login({ email: taxista.email, password: 'Password123' });
            expect(roleService.canAccessUserData(taxista.id)).toBe(true);
            expect(roleService.hasPermission(Permission.VIEW_OWN_DATA)).toBe(true);
        });
    });
});
//# sourceMappingURL=association-management.test.js.map