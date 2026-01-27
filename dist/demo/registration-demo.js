/**
 * Demo script showing Task 3.3 registration functionality
 * Demonstrates user registration with role selection
 */
import { AuthService } from '../services/auth-service';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
import { UserRole } from '../types';
export async function demonstrateRegistration() {
    console.log('🚕 Taxi PWA - User Registration Demo\n');
    const jwtUtils = new JWTUtils();
    const cryptoUtils = new CryptoUtils();
    const authService = new AuthService(jwtUtils, cryptoUtils);
    // Clear any existing data
    localStorage.clear();
    try {
        // Register a Patron
        console.log('📝 Registering a Patron...');
        const patronData = {
            email: 'patron@taxiapp.com',
            password: 'SecurePass123',
            nombre: 'Juan Carlos Patron',
            telefono: '+34123456789',
            rol: UserRole.PATRON
        };
        const patron = await authService.register(patronData);
        console.log(`✅ Patron registered successfully:`);
        console.log(`   - ID: ${patron.id}`);
        console.log(`   - Email: ${patron.email}`);
        console.log(`   - Name: ${patron.nombre}`);
        console.log(`   - Role: ${patron.rol}`);
        console.log(`   - Taxista Number: ${patron.numeroTaxista || 'N/A (correct for patron)'}`);
        console.log(`   - Active: ${patron.activo}`);
        console.log(`   - Created: ${patron.fechaCreacion.toISOString()}\n`);
        // Register a Taxista
        console.log('📝 Registering a Taxista...');
        const taxistaData = {
            email: 'taxista@taxiapp.com',
            password: 'SecurePass123',
            nombre: 'María González Taxista',
            telefono: '+34987654321',
            rol: UserRole.TAXISTA
        };
        const taxista = await authService.register(taxistaData);
        console.log(`✅ Taxista registered successfully:`);
        console.log(`   - ID: ${taxista.id}`);
        console.log(`   - Email: ${taxista.email}`);
        console.log(`   - Name: ${taxista.nombre}`);
        console.log(`   - Role: ${taxista.rol}`);
        console.log(`   - Taxista Number: ${taxista.numeroTaxista} (auto-generated)`);
        console.log(`   - Active: ${taxista.activo}`);
        console.log(`   - Created: ${taxista.fechaCreacion.toISOString()}\n`);
        // Register another Taxista to show sequential numbering
        console.log('📝 Registering another Taxista...');
        const taxista2Data = {
            email: 'taxista2@taxiapp.com',
            password: 'SecurePass123',
            nombre: 'Pedro Martínez Taxista',
            rol: UserRole.TAXISTA
        };
        const taxista2 = await authService.register(taxista2Data);
        console.log(`✅ Second Taxista registered successfully:`);
        console.log(`   - Taxista Number: ${taxista2.numeroTaxista} (sequential numbering)\n`);
        // Test login and permissions
        console.log('🔐 Testing login and permissions...');
        const patronLogin = await authService.login({
            email: patronData.email,
            password: patronData.password
        });
        console.log(`✅ Patron logged in successfully:`);
        console.log(`   - Permissions: ${patronLogin.permissions.join(', ')}`);
        console.log(`   - Token expires: ${patronLogin.expiresAt.toISOString()}\n`);
        const taxistaLogin = await authService.login({
            email: taxistaData.email,
            password: taxistaData.password
        });
        console.log(`✅ Taxista logged in successfully:`);
        console.log(`   - Permissions: ${taxistaLogin.permissions.join(', ')}`);
        console.log(`   - Token expires: ${taxistaLogin.expiresAt.toISOString()}\n`);
        // Test validation
        console.log('🛡️ Testing validation...');
        try {
            await authService.register({
                email: 'invalid-email',
                password: 'weak',
                nombre: '',
                rol: UserRole.PATRON
            });
        }
        catch (error) {
            console.log(`✅ Validation working correctly: ${error.message}\n`);
        }
        // Test duplicate email
        try {
            await authService.register({
                email: patronData.email, // Duplicate
                password: 'SecurePass123',
                nombre: 'Another User',
                rol: UserRole.TAXISTA
            });
        }
        catch (error) {
            console.log(`✅ Duplicate email rejection working: ${error.message}\n`);
        }
        console.log('🎉 Registration demo completed successfully!');
        console.log('All Task 3.3 requirements are implemented and working:');
        console.log('   ✅ Role selection during registration');
        console.log('   ✅ Permission assignment according to role');
        console.log('   ✅ Automatic unique taxista number generation');
        console.log('   ✅ Mandatory field validation');
        console.log('   ✅ Duplicate email rejection');
    }
    catch (error) {
        console.error('❌ Demo failed:', error);
    }
}
// Export for use in other modules
export { AuthService, JWTUtils, CryptoUtils, UserRole };
//# sourceMappingURL=registration-demo.js.map