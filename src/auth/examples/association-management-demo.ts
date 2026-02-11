/**
 * Demo script for Association Management functionality (Task 5.3)
 * Demonstrates the complete patron-taxista association workflow
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

import { AuthService } from '../services/auth-service';
import { RoleService } from '../services/role-service';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
import { UserRole, UserRegistrationData } from '../types';

async function demonstrateAssociationManagement() {
  console.log('🚕 Association Management Demo - Task 5.3');
  console.log('==========================================\n');

  // Initialize services
  const jwtUtils = new JWTUtils();
  const cryptoUtils = new CryptoUtils();
  const authService = new AuthService(jwtUtils, cryptoUtils);
  const roleService = new RoleService(() => authService.getCurrentUser());

  try {
    // Clear any existing data
    localStorage.clear();

    // 1. Create test users
    console.log('1️⃣ Creating test users...');
    
    const patronData: UserRegistrationData = {
      email: 'patron@demo.com',
      password: 'SecurePass123',
      nombre: 'Juan Pérez',
      telefono: '+1234567890',
      rol: UserRole.PATRON
    };

    const taxista1Data: UserRegistrationData = {
      email: 'carlos@demo.com',
      password: 'SecurePass123',
      nombre: 'Carlos García',
      telefono: '+1234567891',
      rol: UserRole.TAXISTA
    };

    const taxista2Data: UserRegistrationData = {
      email: 'maria@demo.com',
      password: 'SecurePass123',
      nombre: 'María López',
      telefono: '+1234567892',
      rol: UserRole.TAXISTA
    };

    const taxista3Data: UserRegistrationData = {
      email: 'ana@demo.com',
      password: 'SecurePass123',
      nombre: 'Ana Martín',
      rol: UserRole.TAXISTA
    };

    const patron = await authService.register(patronData);
    const taxista1 = await authService.register(taxista1Data);
    const taxista2 = await authService.register(taxista2Data);
    const taxista3 = await authService.register(taxista3Data);

    console.log(`✅ Created patron: ${patron.nombre} (${patron.email})`);
    console.log(`✅ Created taxista: ${taxista1.nombre} (${taxista1.numeroTaxista})`);
    console.log(`✅ Created taxista: ${taxista2.nombre} (${taxista2.numeroTaxista})`);
    console.log(`✅ Created taxista: ${taxista3.nombre} (${taxista3.numeroTaxista})\n`);

    // 2. Login as patron
    console.log('2️⃣ Logging in as patron...');
    await authService.login({ email: patron.email, password: 'SecurePass123' });
    console.log(`✅ Logged in as: ${patron.nombre}\n`);

    // 3. Search for available taxistas
    console.log('3️⃣ Searching for available taxistas...');
    const availableTaxistas = await roleService.searchAvailableTaxistas();
    console.log(`📋 Found ${availableTaxistas.length} available taxistas:`);
    availableTaxistas.forEach(t => {
      console.log(`   - ${t.nombre} (${t.numeroTaxista}) - ${t.email}`);
    });
    console.log();

    // 4. Advanced search with filtering
    console.log('4️⃣ Advanced search with filtering...');
    const filteredTaxistas = await roleService.searchAvailableTaxistasAdvanced({
      searchTerm: 'a', // Should match Carlos, María, and Ana
      sortBy: 'nombre',
      sortOrder: 'asc',
      limit: 2
    });
    console.log(`🔍 Advanced search results (search: 'a', sorted by name, limit: 2):`);
    filteredTaxistas.forEach(t => {
      console.log(`   - ${t.nombre} (${t.numeroTaxista})`);
    });
    console.log();

    // 5. Create associations
    console.log('5️⃣ Creating associations...');
    const association1 = await roleService.createAssociation(patron.id, taxista1.id);
    console.log(`✅ Associated ${taxista1.nombre} with ${patron.nombre}`);
    
    await roleService.createAssociation(patron.id, taxista2.id);
    console.log(`✅ Associated ${taxista2.nombre} with ${patron.nombre}\n`);

    // 6. Check notifications for patron
    console.log('6️⃣ Checking notifications for patron...');
    const patronNotifications = roleService.getNotifications();
    console.log(`📬 Patron has ${patronNotifications.length} notifications:`);
    patronNotifications.forEach(n => {
      console.log(`   - ${n.title}: ${n.message}`);
    });
    console.log();

    // 7. Check notifications for taxista
    console.log('7️⃣ Checking notifications for taxista...');
    await authService.login({ email: taxista1.email, password: 'SecurePass123' });
    const taxistaNotifications = roleService.getNotifications();
    console.log(`📬 ${taxista1.nombre} has ${taxistaNotifications.length} notifications:`);
    taxistaNotifications.forEach(n => {
      console.log(`   - ${n.title}: ${n.message}`);
    });
    console.log();

    // 8. Back to patron - check associated users
    console.log('8️⃣ Checking associated users for patron...');
    await authService.login({ email: patron.email, password: 'SecurePass123' });
    const associatedUsers = await roleService.getAssociatedUsers();
    console.log(`👥 Patron has ${associatedUsers.length} associated taxistas:`);
    associatedUsers.forEach(u => {
      console.log(`   - ${u.nombre} (${u.numeroTaxista}) - ${u.email}`);
    });
    console.log();

    // 9. Check updated available taxistas (should exclude associated ones)
    console.log('9️⃣ Checking updated available taxistas...');
    const updatedAvailable = await roleService.searchAvailableTaxistas();
    console.log(`📋 Now ${updatedAvailable.length} available taxistas (excluding associated):`);
    updatedAvailable.forEach(t => {
      console.log(`   - ${t.nombre} (${t.numeroTaxista}) - ${t.email}`);
    });
    console.log();

    // 10. Get association statistics
    console.log('🔟 Getting association statistics...');
    const stats = roleService.getAssociationStatistics();
    console.log('📊 Association Statistics:');
    console.log(`   - Total associations: ${stats.totalAssociations}`);
    console.log(`   - Active associations: ${stats.activeAssociations}`);
    console.log(`   - Recent associations (30 days): ${stats.recentAssociations}`);
    console.log();

    // 11. Test association removal
    console.log('1️⃣1️⃣ Testing association removal...');
    await roleService.removeAssociation(association1.id);
    console.log(`❌ Removed association between ${taxista1.nombre} and ${patron.nombre}`);
    
    // Check updated statistics
    const updatedStats = roleService.getAssociationStatistics();
    console.log('📊 Updated Statistics:');
    console.log(`   - Active associations: ${updatedStats.activeAssociations}`);
    console.log(`   - Inactive associations: ${updatedStats.inactiveAssociations}`);
    console.log();

    // 12. Check removal notifications
    console.log('1️⃣2️⃣ Checking removal notifications...');
    const removalNotifications = roleService.getNotifications(true); // unread only
    console.log(`📬 Patron has ${removalNotifications.length} new notifications:`);
    removalNotifications.forEach(n => {
      console.log(`   - ${n.title}: ${n.message}`);
    });
    console.log();

    // 13. Verify taxista maintains individual access
    console.log('1️⃣3️⃣ Verifying taxista individual access...');
    await authService.login({ email: taxista1.email, password: 'SecurePass123' });
    console.log(`✅ ${taxista1.nombre} can still log in after association removal`);
    console.log(`✅ Has access to own data: ${roleService.canAccessUserData(taxista1.id)}`);
    console.log(`✅ Can input operational data: ${roleService.hasPermission('input_operational_data' as any)}`);
    console.log();

    // 14. Demonstrate data filtering
    console.log('1️⃣4️⃣ Demonstrating data filtering...');
    await authService.login({ email: patron.email, password: 'SecurePass123' });
    
    // Mock operational data
    const mockServices = [
      { id: '1', userId: taxista1.id, amount: 100, description: 'Service 1' },
      { id: '2', userId: taxista2.id, amount: 200, description: 'Service 2' },
      { id: '3', userId: taxista3.id, amount: 150, description: 'Service 3' },
      { id: '4', userId: patron.id, amount: 300, description: 'Patron Service' }
    ];

    const filteredData = roleService.filterDataByRole(mockServices);
    console.log(`🔍 Patron can see ${filteredData.length} out of ${mockServices.length} service records:`);
    filteredData.forEach(d => {
      console.log(`   - ${d.description}: $${d.amount}`);
    });
    console.log();

    console.log('🎉 Association Management Demo completed successfully!');
    console.log('✅ All functionality working as expected');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateAssociationManagement().catch(console.error);
}

export { demonstrateAssociationManagement };