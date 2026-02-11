/**
 * Demo script showing enhanced RoleService functionality
 * Demonstrates contextual data filtering and permission management
 * Requirements: 3.1, 3.2, 3.3, 5.1
 */

import { AuthService } from '../services/auth-service';
import { RoleService } from '../services/role-service';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
import { UserRole, UserRegistrationData } from '../types';

async function demonstrateRoleServiceEnhancements() {
  console.log('🚀 RoleService Enhanced Functionality Demo');
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
    console.log('1. Creating test users...');
    
    const patronData: UserRegistrationData = {
      email: 'patron@demo.com',
      password: 'Password123',
      nombre: 'Demo Patron',
      rol: UserRole.PATRON
    };

    const taxista1Data: UserRegistrationData = {
      email: 'taxista1@demo.com',
      password: 'Password123',
      nombre: 'Demo Taxista 1',
      rol: UserRole.TAXISTA
    };

    const taxista2Data: UserRegistrationData = {
      email: 'taxista2@demo.com',
      password: 'Password123',
      nombre: 'Demo Taxista 2',
      rol: UserRole.TAXISTA
    };

    const unassociatedTaxistaData: UserRegistrationData = {
      email: 'unassociated@demo.com',
      password: 'Password123',
      nombre: 'Unassociated Taxista',
      rol: UserRole.TAXISTA
    };

    const patron = await authService.register(patronData);
    const taxista1 = await authService.register(taxista1Data);
    const taxista2 = await authService.register(taxista2Data);
    const unassociatedTaxista = await authService.register(unassociatedTaxistaData);

    console.log(`✅ Created patron: ${patron.nombre} (${patron.email})`);
    console.log(`✅ Created taxista: ${taxista1.nombre} (${taxista1.numeroTaxista})`);
    console.log(`✅ Created taxista: ${taxista2.nombre} (${taxista2.numeroTaxista})`);
    console.log(`✅ Created unassociated taxista: ${unassociatedTaxista.nombre} (${unassociatedTaxista.numeroTaxista})\n`);

    // 2. Login as patron and create associations
    console.log('2. Creating associations...');
    await authService.login({ email: patron.email, password: 'Password123' });
    
    await roleService.createAssociation(patron.id, taxista1.id);
    await roleService.createAssociation(patron.id, taxista2.id);
    
    console.log(`✅ Associated ${taxista1.nombre} with ${patron.nombre}`);
    console.log(`✅ Associated ${taxista2.nombre} with ${patron.nombre}\n`);

    // 3. Demonstrate contextual data filtering for patron
    console.log('3. Demonstrating contextual data filtering for PATRON...');
    
    // Mock operational data (services, expenses, etc.)
    const mockServices = [
      { id: 'svc1', userId: taxista1.id, amount: 150, type: 'service', description: 'Airport ride' },
      { id: 'svc2', userId: taxista2.id, amount: 200, type: 'service', description: 'City tour' },
      { id: 'svc3', userId: unassociatedTaxista.id, amount: 100, type: 'service', description: 'Short trip' },
      { id: 'svc4', userId: patron.id, amount: 300, type: 'service', description: 'Patron service' }
    ];

    const mockExpenses = [
      { id: 'exp1', taxistaId: taxista1.id, amount: 50, category: 'Fuel' },
      { id: 'exp2', createdBy: taxista2.id, amount: 30, category: 'Maintenance' },
      { id: 'exp3', numeroTaxista: unassociatedTaxista.numeroTaxista, amount: 25, category: 'Food' },
      { id: 'exp4', userId: patron.id, amount: 75, category: 'Office supplies' }
    ];

    const filteredServices = roleService.filterDataByRole(mockServices);
    const filteredExpenses = roleService.filterDataByRole(mockExpenses);

    console.log(`📊 Patron can see ${filteredServices.length}/4 services:`);
    filteredServices.forEach(s => console.log(`   - ${s.description} ($${s.amount})`));
    
    console.log(`📊 Patron can see ${filteredExpenses.length}/4 expenses:`);
    filteredExpenses.forEach(e => console.log(`   - ${e.category} ($${e.amount})`));

    // 4. Demonstrate aggregated data summary
    console.log('\n4. Demonstrating aggregated data summary...');
    const serviceSummary = roleService.getAggregatedDataSummary(mockServices, 'amount');
    const expenseSummary = roleService.getAggregatedDataSummary(mockExpenses, 'amount');

    console.log('📈 Service Summary:', serviceSummary);
    console.log('📈 Expense Summary:', expenseSummary);

    // 5. Demonstrate accessible users
    console.log('\n5. Demonstrating accessible users...');
    const accessibleUsers = roleService.getAccessibleUsers();
    console.log(`👥 Patron can access ${accessibleUsers.length} users:`);
    accessibleUsers.forEach(u => console.log(`   - ${u.nombre} (${u.rol})`));

    // 6. Switch to taxista perspective
    console.log('\n6. Switching to TAXISTA perspective...');
    await authService.login({ email: taxista1.email, password: 'Password123' });

    const taxistaFilteredServices = roleService.filterDataByRole(mockServices);
    const taxistaFilteredExpenses = roleService.filterDataByRole(mockExpenses);
    const taxistaAccessibleUsers = roleService.getAccessibleUsers();

    console.log(`📊 Taxista can see ${taxistaFilteredServices.length}/4 services:`);
    taxistaFilteredServices.forEach(s => console.log(`   - ${s.description} ($${s.amount})`));
    
    console.log(`📊 Taxista can see ${taxistaFilteredExpenses.length}/4 expenses:`);
    taxistaFilteredExpenses.forEach(e => console.log(`   - ${e.category} ($${e.amount})`));

    console.log(`👥 Taxista can access ${taxistaAccessibleUsers.length} users:`);
    taxistaAccessibleUsers.forEach(u => console.log(`   - ${u.nombre} (${u.rol})`));

    // 7. Demonstrate data access validation
    console.log('\n7. Demonstrating data access validation...');
    
    const ownData = { userId: taxista1.id, amount: 100 };
    const otherData = { userId: taxista2.id, amount: 200 };
    const patronData_demo = { userId: patron.id, amount: 300 };

    console.log(`🔒 Can taxista read own data: ${roleService.validateDataAccess(ownData, 'read')}`);
    console.log(`🔒 Can taxista read other taxista data: ${roleService.validateDataAccess(otherData, 'read')}`);
    console.log(`🔒 Can taxista read patron data: ${roleService.validateDataAccess(patronData_demo, 'read')}`);
    console.log(`🔒 Can taxista write own data: ${roleService.validateDataAccess(ownData, 'write')}`);
    console.log(`🔒 Can taxista write other data: ${roleService.validateDataAccess(otherData, 'write')}`);

    // 8. Demonstrate custom context filtering
    console.log('\n8. Demonstrating custom context filtering...');
    await authService.login({ email: patron.email, password: 'Password123' });

    const customData = [
      { id: 'c1', driverId: taxista1.id, route: 'Route A', earnings: 120 },
      { id: 'c2', driverId: taxista2.id, route: 'Route B', earnings: 180 },
      { id: 'c3', driverId: unassociatedTaxista.id, route: 'Route C', earnings: 90 }
    ];

    const customContext = { userIdField: 'driverId' };
    const customFiltered = roleService.filterDataByRole(customData, customContext);

    console.log(`🎯 Custom filtering with 'driverId' field: ${customFiltered.length}/3 records`);
    customFiltered.forEach(d => console.log(`   - ${d.route}: $${d.earnings}`));

    console.log('\n✅ RoleService enhancement demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateRoleServiceEnhancements();
}

export { demonstrateRoleServiceEnhancements };