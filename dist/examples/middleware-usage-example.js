/**
 * Simple Authorization Middleware Usage Example
 * Shows practical integration patterns
 */
import { AuthService } from '../services/auth-service';
import { RoleService } from '../services/role-service';
import { AuthorizationMiddleware } from '../middleware/authorization-middleware';
import { MiddlewareIntegration } from '../middleware/middleware-integration';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
import { UserRole, Permission } from '../types';
/**
 * Example service that uses authorization middleware
 */
export class SecureDataService {
    constructor() {
        this.authMiddleware = new AuthorizationMiddleware();
        this.integration = new MiddlewareIntegration(this.authMiddleware);
    }
    /**
     * Get user data with authorization check
     */
    async getUserData(currentUser, targetUserId) {
        return await this.integration.requirePermission(currentUser, {
            permission: Permission.VIEW_OWN_DATA,
            resource: 'user-data',
            action: 'read'
        }, async () => {
            // Simulate data retrieval
            return {
                id: targetUserId,
                name: 'User Name',
                email: 'user@example.com',
                lastLogin: new Date()
            };
        });
    }
    /**
     * Create association with authorization and logging
     */
    async createAssociation(currentUser, patronId, taxistaId) {
        return await this.integration.requirePermission(currentUser, {
            permission: Permission.MANAGE_ASSOCIATIONS,
            resource: 'associations',
            action: 'create'
        }, async () => {
            // Simulate association creation
            return {
                id: 'new_association',
                patronId,
                taxistaId,
                created: new Date(),
                active: true
            };
        });
    }
    /**
     * Get filtered data based on user role
     */
    async getFilteredData(currentUser) {
        const allData = [
            { id: '1', userId: 'patron_1', type: 'patron_data' },
            { id: '2', userId: 'taxista_1', type: 'taxista_data' },
            { id: '3', userId: 'other_user', type: 'other_data' }
        ];
        return await this.integration.validateAndFilterData(currentUser, allData, Permission.VIEW_OWN_DATA, 'operational-data');
    }
    /**
     * Get access logs for security monitoring
     */
    getSecurityLogs(currentUser) {
        if (!currentUser || currentUser.rol !== UserRole.PATRON) {
            return [];
        }
        return this.authMiddleware.getAccessLog({
            limit: 50,
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        });
    }
}
/**
 * Example usage demonstration
 */
export async function demonstrateMiddlewareUsage() {
    console.log('🔐 Authorization Middleware Usage Example');
    console.log('==========================================');
    // Initialize services
    const cryptoUtils = new CryptoUtils();
    const jwtUtils = new JWTUtils();
    const authService = new AuthService(jwtUtils, cryptoUtils);
    const roleService = new RoleService(() => authService.getCurrentUser());
    const secureService = new SecureDataService();
    // Create test users
    const patronUser = {
        id: 'patron_example',
        email: 'patron@example.com',
        nombre: 'Example Patron',
        rol: UserRole.PATRON,
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    const taxistaUser = {
        id: 'taxista_example',
        email: 'taxista@example.com',
        nombre: 'Example Taxista',
        rol: UserRole.TAXISTA,
        numeroTaxista: 'TX001',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    try {
        // Example 1: Authorized operation
        console.log('\n1. Authorized operation (Patron creating association):');
        const association = await secureService.createAssociation(patronUser, patronUser.id, taxistaUser.id);
        console.log('✓ Association created:', association);
        // Example 2: Unauthorized operation
        console.log('\n2. Unauthorized operation (Taxista trying to create association):');
        try {
            await secureService.createAssociation(taxistaUser, patronUser.id, taxistaUser.id);
        }
        catch (error) {
            console.log('✗ Operation denied:', error.message);
        }
        // Example 3: Data filtering
        console.log('\n3. Data filtering based on user role:');
        const filteredData = await secureService.getFilteredData(patronUser);
        console.log('Filtered data for patron:', filteredData);
        // Example 4: Security monitoring
        console.log('\n4. Security monitoring:');
        const logs = secureService.getSecurityLogs(patronUser);
        console.log(`Recent access attempts: ${logs.length}`);
        logs.slice(0, 3).forEach(log => {
            const status = log.success ? '✓' : '✗';
            console.log(`  ${status} ${log.userEmail || 'Anonymous'} -> ${log.action} on ${log.resource}`);
        });
        console.log('\n✅ Middleware usage demonstration completed!');
    }
    catch (error) {
        console.error('\n❌ Demonstration failed:', error);
    }
}
//# sourceMappingURL=middleware-usage-example.js.map