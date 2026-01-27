/**
 * Unit tests for RoleService
 * Tests permission validation and contextual data filtering
 * Requirements: 3.1, 3.2, 3.3, 5.1
 */
import { RoleService } from '../role-service';
import { AuthService } from '../auth-service';
import { UserRole } from '../../types';
import { JWTUtils } from '../../utils/jwt-utils';
import { CryptoUtils } from '../../utils/crypto-utils';
describe('RoleService - Permission Management and Data Filtering', () => {
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
    describe('Contextual Data Filtering', () => {
        let patron;
        let taxista1;
        let taxista2;
        let unassociatedTaxista;
        beforeEach(async () => {
            // Create test users
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const taxista1Data = {
                email: 'taxista1@test.com',
                password: 'Password123',
                nombre: 'Test Taxista 1',
                rol: UserRole.TAXISTA
            };
            const taxista2Data = {
                email: 'taxista2@test.com',
                password: 'Password123',
                nombre: 'Test Taxista 2',
                rol: UserRole.TAXISTA
            };
            const unassociatedData = {
                email: 'unassociated@test.com',
                password: 'Password123',
                nombre: 'Unassociated Taxista',
                rol: UserRole.TAXISTA
            };
            patron = await authService.register(patronData);
            taxista1 = await authService.register(taxista1Data);
            taxista2 = await authService.register(taxista2Data);
            unassociatedTaxista = await authService.register(unassociatedData);
            // Login as patron and create associations
            await authService.login({ email: patron.email, password: 'Password123' });
            await roleService.createAssociation(patron.id, taxista1.id);
            await roleService.createAssociation(patron.id, taxista2.id);
        });
        it('should filter data correctly for patron - show only associated taxistas data', async () => {
            // Login as patron
            await authService.login({ email: patron.email, password: 'Password123' });
            // Mock operational data
            const mockServices = [
                { id: '1', userId: taxista1.id, amount: 100, description: 'Service 1' },
                { id: '2', userId: taxista2.id, amount: 200, description: 'Service 2' },
                { id: '3', userId: unassociatedTaxista.id, amount: 150, description: 'Service 3' },
                { id: '4', userId: patron.id, amount: 300, description: 'Patron Service' }
            ];
            const filteredData = roleService.filterDataByRole(mockServices);
            expect(filteredData).toHaveLength(3); // taxista1, taxista2, and patron's own data
            expect(filteredData.map(d => d.id)).toContain('1'); // taxista1's data
            expect(filteredData.map(d => d.id)).toContain('2'); // taxista2's data
            expect(filteredData.map(d => d.id)).toContain('4'); // patron's own data
            expect(filteredData.map(d => d.id)).not.toContain('3'); // unassociated taxista's data
        });
        it('should filter data correctly for taxista - show only own data', async () => {
            // Login as taxista1
            await authService.login({ email: taxista1.email, password: 'Password123' });
            // Mock operational data
            const mockExpenses = [
                { id: '1', taxistaId: taxista1.id, amount: 50, category: 'Fuel' },
                { id: '2', taxistaId: taxista2.id, amount: 75, category: 'Maintenance' },
                { id: '3', createdBy: taxista1.id, amount: 25, category: 'Food' },
                { id: '4', userId: patron.id, amount: 100, category: 'Other' }
            ];
            const filteredData = roleService.filterDataByRole(mockExpenses);
            expect(filteredData).toHaveLength(2); // Only taxista1's data
            expect(filteredData.map(d => d.id)).toContain('1'); // taxista1's data by taxistaId
            expect(filteredData.map(d => d.id)).toContain('3'); // taxista1's data by createdBy
            expect(filteredData.map(d => d.id)).not.toContain('2'); // taxista2's data
            expect(filteredData.map(d => d.id)).not.toContain('4'); // patron's data
        });
        it('should handle numeroTaxista field filtering', async () => {
            // Login as patron
            await authService.login({ email: patron.email, password: 'Password123' });
            // Mock data with numeroTaxista field
            const mockData = [
                { id: '1', numeroTaxista: taxista1.numeroTaxista, amount: 100 },
                { id: '2', numeroTaxista: taxista2.numeroTaxista, amount: 200 },
                { id: '3', numeroTaxista: unassociatedTaxista.numeroTaxista, amount: 150 },
                { id: '4', numeroTaxista: 'TX999', amount: 300 } // Non-existent taxista
            ];
            const filteredData = roleService.filterDataByRole(mockData);
            expect(filteredData).toHaveLength(2); // Only associated taxistas
            expect(filteredData.map(d => d.numeroTaxista)).toContain(taxista1.numeroTaxista);
            expect(filteredData.map(d => d.numeroTaxista)).toContain(taxista2.numeroTaxista);
            expect(filteredData.map(d => d.numeroTaxista)).not.toContain(unassociatedTaxista.numeroTaxista);
        });
        it('should handle custom context-based filtering', async () => {
            // Login as patron
            await authService.login({ email: patron.email, password: 'Password123' });
            // Mock data with custom field structure
            const mockData = [
                { id: '1', driverId: taxista1.id, amount: 100 },
                { id: '2', driverId: taxista2.id, amount: 200 },
                { id: '3', driverId: unassociatedTaxista.id, amount: 150 }
            ];
            const userContext = { userIdField: 'driverId' };
            const filteredData = roleService.filterDataByRole(mockData, userContext);
            expect(filteredData).toHaveLength(2); // Only associated taxistas
            expect(filteredData.map(d => d.id)).toContain('1');
            expect(filteredData.map(d => d.id)).toContain('2');
            expect(filteredData.map(d => d.id)).not.toContain('3');
        });
        it('should return empty array when no user is authenticated', async () => {
            await authService.logout();
            const mockData = [
                { id: '1', userId: taxista1.id, amount: 100 }
            ];
            const filteredData = roleService.filterDataByRole(mockData);
            expect(filteredData).toHaveLength(0);
        });
        it('should handle empty data array', async () => {
            await authService.login({ email: patron.email, password: 'Password123' });
            const filteredData = roleService.filterDataByRole([]);
            expect(filteredData).toHaveLength(0);
        });
    });
    describe('Data Access Validation', () => {
        let patron;
        let taxista;
        let unassociatedTaxista;
        beforeEach(async () => {
            // Create and associate users
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
            const unassociatedData = {
                email: 'unassociated@test.com',
                password: 'Password123',
                nombre: 'Unassociated Taxista',
                rol: UserRole.TAXISTA
            };
            patron = await authService.register(patronData);
            taxista = await authService.register(taxistaData);
            unassociatedTaxista = await authService.register(unassociatedData);
            // Create association
            await authService.login({ email: patron.email, password: 'Password123' });
            await roleService.createAssociation(patron.id, taxista.id);
        });
        it('should allow patron to access associated taxista data', async () => {
            await authService.login({ email: patron.email, password: 'Password123' });
            expect(roleService.canAccessUserData(taxista.id)).toBe(true);
            expect(roleService.canAccessUserData(patron.id)).toBe(true); // Own data
            expect(roleService.canAccessUserData(unassociatedTaxista.id)).toBe(false);
        });
        it('should allow taxista to access only own data', async () => {
            await authService.login({ email: taxista.email, password: 'Password123' });
            expect(roleService.canAccessUserData(taxista.id)).toBe(true); // Own data
            expect(roleService.canAccessUserData(patron.id)).toBe(false);
            expect(roleService.canAccessUserData(unassociatedTaxista.id)).toBe(false);
        });
        it('should validate data access for different operations', async () => {
            await authService.login({ email: taxista.email, password: 'Password123' });
            const ownData = { userId: taxista.id, amount: 100 };
            const otherData = { userId: patron.id, amount: 200 };
            // Read access
            expect(roleService.validateDataAccess(ownData, 'read')).toBe(true);
            expect(roleService.validateDataAccess(otherData, 'read')).toBe(false);
            // Write access - only own data
            expect(roleService.validateDataAccess(ownData, 'write')).toBe(true);
            expect(roleService.validateDataAccess(otherData, 'write')).toBe(false);
            // Delete access - only own data
            expect(roleService.validateDataAccess(ownData, 'delete')).toBe(true);
            expect(roleService.validateDataAccess(otherData, 'delete')).toBe(false);
        });
    });
    describe('Accessible Users', () => {
        let patron;
        let taxista1;
        let taxista2;
        let unassociatedTaxista;
        beforeEach(async () => {
            // Create test users
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const taxista1Data = {
                email: 'taxista1@test.com',
                password: 'Password123',
                nombre: 'Test Taxista 1',
                rol: UserRole.TAXISTA
            };
            const taxista2Data = {
                email: 'taxista2@test.com',
                password: 'Password123',
                nombre: 'Test Taxista 2',
                rol: UserRole.TAXISTA
            };
            const unassociatedData = {
                email: 'unassociated@test.com',
                password: 'Password123',
                nombre: 'Unassociated Taxista',
                rol: UserRole.TAXISTA
            };
            patron = await authService.register(patronData);
            taxista1 = await authService.register(taxista1Data);
            taxista2 = await authService.register(taxista2Data);
            unassociatedTaxista = await authService.register(unassociatedData);
            // Create associations
            await authService.login({ email: patron.email, password: 'Password123' });
            await roleService.createAssociation(patron.id, taxista1.id);
            await roleService.createAssociation(patron.id, taxista2.id);
        });
        it('should return patron and associated taxistas for patron user', async () => {
            await authService.login({ email: patron.email, password: 'Password123' });
            const accessibleUsers = roleService.getAccessibleUsers();
            expect(accessibleUsers).toHaveLength(3); // patron + 2 associated taxistas
            expect(accessibleUsers.map(u => u.id)).toContain(patron.id);
            expect(accessibleUsers.map(u => u.id)).toContain(taxista1.id);
            expect(accessibleUsers.map(u => u.id)).toContain(taxista2.id);
            expect(accessibleUsers.map(u => u.id)).not.toContain(unassociatedTaxista.id);
        });
        it('should return only self for taxista user', async () => {
            await authService.login({ email: taxista1.email, password: 'Password123' });
            const accessibleUsers = roleService.getAccessibleUsers();
            expect(accessibleUsers).toHaveLength(1);
            expect(accessibleUsers[0].id).toBe(taxista1.id);
        });
        it('should return empty array when not authenticated', async () => {
            await authService.logout();
            const accessibleUsers = roleService.getAccessibleUsers();
            expect(accessibleUsers).toHaveLength(0);
        });
    });
    describe('Aggregated Data Summary', () => {
        let patron;
        let taxista1;
        let taxista2;
        beforeEach(async () => {
            // Create and associate users
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const taxista1Data = {
                email: 'taxista1@test.com',
                password: 'Password123',
                nombre: 'Test Taxista 1',
                rol: UserRole.TAXISTA
            };
            const taxista2Data = {
                email: 'taxista2@test.com',
                password: 'Password123',
                nombre: 'Test Taxista 2',
                rol: UserRole.TAXISTA
            };
            patron = await authService.register(patronData);
            taxista1 = await authService.register(taxista1Data);
            taxista2 = await authService.register(taxista2Data);
            // Create associations
            await authService.login({ email: patron.email, password: 'Password123' });
            await roleService.createAssociation(patron.id, taxista1.id);
            await roleService.createAssociation(patron.id, taxista2.id);
        });
        it('should calculate aggregated summary for patron', async () => {
            await authService.login({ email: patron.email, password: 'Password123' });
            const mockData = [
                { userId: taxista1.id, amount: 100 },
                { userId: taxista1.id, amount: 200 },
                { userId: taxista2.id, amount: 150 },
                { userId: patron.id, amount: 300 }
            ];
            const summary = roleService.getAggregatedDataSummary(mockData, 'amount');
            expect(summary).toEqual({
                totalRecords: 4,
                totalAmount: 750,
                averageAmount: 187.5,
                associatedTaxistas: 2 // taxista1 and taxista2 (patron not counted as taxista)
            });
        });
        it('should return null for taxista users', async () => {
            await authService.login({ email: taxista1.email, password: 'Password123' });
            const mockData = [
                { userId: taxista1.id, amount: 100 }
            ];
            const summary = roleService.getAggregatedDataSummary(mockData, 'amount');
            expect(summary).toBeNull();
        });
        it('should handle empty data', async () => {
            await authService.login({ email: patron.email, password: 'Password123' });
            const summary = roleService.getAggregatedDataSummary([], 'amount');
            expect(summary).toEqual({
                totalRecords: 0,
                totalAmount: 0,
                averageAmount: 0,
                associatedTaxistas: 0
            });
        });
    });
    describe('Error Handling', () => {
        it('should handle filtering errors gracefully', async () => {
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const patron = await authService.register(patronData);
            await authService.login({ email: patron.email, password: 'Password123' });
            // Mock data that might cause errors
            const problematicData = [
                null,
                undefined,
                { malformedData: true },
                { userId: 'invalid-id' }
            ];
            // Should not throw and return empty array
            expect(() => {
                const result = roleService.filterDataByRole(problematicData);
                expect(Array.isArray(result)).toBe(true);
            }).not.toThrow();
        });
        it('should handle localStorage errors gracefully', async () => {
            const patronData = {
                email: 'patron@test.com',
                password: 'Password123',
                nombre: 'Test Patron',
                rol: UserRole.PATRON
            };
            const patron = await authService.register(patronData);
            await authService.login({ email: patron.email, password: 'Password123' });
            // Mock localStorage to throw errors
            const originalGetItem = localStorage.getItem;
            localStorage.getItem = jest.fn(() => {
                throw new Error('Storage error');
            });
            const mockData = [{ userId: 'test', amount: 100 }];
            // Should handle storage errors gracefully
            expect(() => {
                const result = roleService.filterDataByRole(mockData);
                expect(Array.isArray(result)).toBe(true);
            }).not.toThrow();
            // Restore original localStorage
            localStorage.getItem = originalGetItem;
        });
    });
});
//# sourceMappingURL=role-service.test.js.map