/**
 * Authorization Middleware Demo
 * Demonstrates comprehensive usage of the authorization middleware
 * Requirements: 6.1, 6.2, 6.5
 */

import {
  AuthorizationMiddleware,
  createAuthorizationContext
} from '../middleware/authorization-middleware';
import {
  MiddlewareIntegration
} from '../middleware/middleware-integration';
import {
  User,
  UserRole,
  Permission,
  AuthError
} from '../types';

/**
 * Demo class showing practical authorization middleware usage
 */
export class AuthorizationDemo {
  private authMiddleware: AuthorizationMiddleware;
  private integration: MiddlewareIntegration;

  constructor() {
    this.authMiddleware = new AuthorizationMiddleware();
    this.integration = new MiddlewareIntegration(this.authMiddleware);
  }

  /**
   * Demo 1: Basic permission checking
   */
  async demoBasicPermissionCheck(): Promise<void> {
    console.log('\n=== Demo 1: Basic Permission Checking ===');

    const patronUser: User = {
      id: 'patron_demo',
      email: 'patron@demo.com',
      nombre: 'Demo Patron',
      rol: UserRole.PATRON,
      activo: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const taxistaUser: User = {
      id: 'taxista_demo',
      email: 'taxista@demo.com',
      nombre: 'Demo Taxista',
      rol: UserRole.TAXISTA,
      numeroTaxista: 'TX999',
      activo: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    // Test patron permissions
    console.log('Testing patron permissions:');
    const patronContext = createAuthorizationContext(
      patronUser,
      'associations',
      'create',
      Permission.MANAGE_ASSOCIATIONS
    );

    const patronResult = await this.authMiddleware.authorize(patronContext);
    console.log(`- Patron can manage associations: ${patronResult.authorized}`);

    // Test taxista permissions
    console.log('Testing taxista permissions:');
    const taxistaContext = createAuthorizationContext(
      taxistaUser,
      'associations',
      'create',
      Permission.MANAGE_ASSOCIATIONS
    );

    const taxistaResult = await this.authMiddleware.authorize(taxistaContext);
    console.log(`- Taxista can manage associations: ${taxistaResult.authorized}`);
    if (!taxistaResult.authorized) {
      console.log(`  Error: ${taxistaResult.error?.message}`);
    }
  }

  /**
   * Demo 2: Data access validation with associations
   */
  async demoDataAccessValidation(): Promise<void> {
    console.log('\n=== Demo 2: Data Access Validation ===');

    const patronUser: User = {
      id: 'patron_data',
      email: 'patron@data.com',
      nombre: 'Data Patron',
      rol: UserRole.PATRON,
      activo: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const taxistaUser: User = {
      id: 'taxista_data',
      email: 'taxista@data.com',
      nombre: 'Data Taxista',
      rol: UserRole.TAXISTA,
      numeroTaxista: 'TX888',
      activo: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    // Create association for demo
    const associations = [{
      id: 'demo_assoc',
      patronId: patronUser.id,
      taxistaId: taxistaUser.id,
      fechaAsociacion: new Date(),
      activa: true
    }];
    localStorage.setItem('taxi_associations', JSON.stringify(associations));

    // Test data access scenarios
    const testData = [
      { id: '1', userId: patronUser.id, content: 'Patron own data' },
      { id: '2', userId: taxistaUser.id, content: 'Associated taxista data' },
      { id: '3', userId: 'other_user', content: 'Other user data' }
    ];

    console.log('Testing patron data access:');
    for (const data of testData) {
      const canAccess = await this.authMiddleware.validateDataAccess(
        patronUser,
        data,
        'read'
      );
      console.log(`- Can access "${data.content}": ${canAccess}`);
    }

    console.log('Testing taxista data access:');
    for (const data of testData) {
      const canAccess = await this.authMiddleware.validateDataAccess(
        taxistaUser,
        data,
        'read'
      );
      console.log(`- Can access "${data.content}": ${canAccess}`);
    }
  }

  /**
   * Demo 3: Sensitive data encryption
   */
  async demoDataEncryption(): Promise<void> {
    console.log('\n=== Demo 3: Sensitive Data Encryption ===');

    const sensitiveData = {
      name: 'John Doe',
      email: 'john@example.com',
      telefono: '+1234567890',
      publicInfo: 'This is public'
    };

    console.log('Original data:', sensitiveData);

    // Encrypt sensitive fields
    const encryptedData = await this.authMiddleware.encryptSensitiveData(
      sensitiveData,
      {
        encryptFields: ['email', 'telefono'],
        skipEncryption: false
      }
    );

    console.log('Encrypted data:', encryptedData);

    // Decrypt sensitive fields
    const decryptedData = await this.authMiddleware.decryptSensitiveData(
      encryptedData,
      {
        encryptFields: ['email', 'telefono'],
        skipEncryption: false
      }
    );

    console.log('Decrypted data:', decryptedData);
  }

  /**
   * Demo 4: Using middleware integration for protected operations
   */
  async demoProtectedOperations(): Promise<void> {
    console.log('\n=== Demo 4: Protected Operations ===');

    const patronUser: User = {
      id: 'patron_ops',
      email: 'patron@ops.com',
      nombre: 'Operations Patron',
      rol: UserRole.PATRON,
      activo: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    // Simulate a protected operation
    const createAssociationOperation = async () => {
      console.log('  Executing association creation...');
      return {
        id: 'new_association',
        patronId: patronUser.id,
        taxistaId: 'some_taxista',
        created: new Date(),
        success: true
      };
    };

    try {
      console.log('Attempting protected operation with valid permissions:');
      const result = await this.integration.requirePermission(
        patronUser,
        {
          permission: Permission.MANAGE_ASSOCIATIONS,
          resource: 'associations',
          action: 'create'
        },
        createAssociationOperation
      );

      console.log('  Operation successful:', result);
    } catch (error) {
      console.log('  Operation failed:', (error as Error).message);
    }

    // Try with insufficient permissions
    const taxistaUser: User = {
      id: 'taxista_ops',
      email: 'taxista@ops.com',
      nombre: 'Operations Taxista',
      rol: UserRole.TAXISTA,
      numeroTaxista: 'TX777',
      activo: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    try {
      console.log('Attempting protected operation with insufficient permissions:');
      await this.integration.requirePermission(
        taxistaUser,
        {
          permission: Permission.MANAGE_ASSOCIATIONS,
          resource: 'associations',
          action: 'create'
        },
        createAssociationOperation
      );
    } catch (error) {
      console.log('  Operation failed as expected:', (error as AuthError).message);
    }
  }

  /**
   * Demo 5: Data filtering with role-based access
   */
  async demoDataFiltering(): Promise<void> {
    console.log('\n=== Demo 5: Data Filtering ===');

    const patronUser: User = {
      id: 'patron_filter',
      email: 'patron@filter.com',
      nombre: 'Filter Patron',
      rol: UserRole.PATRON,
      activo: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    // Create test data
    const allData = [
      { id: '1', userId: patronUser.id, type: 'patron_data', value: 100 },
      { id: '2', userId: 'associated_taxista', type: 'taxista_data', value: 200 },
      { id: '3', userId: 'other_user', type: 'other_data', value: 300 },
      { id: '4', userId: patronUser.id, type: 'patron_data', value: 400 }
    ];

    console.log('All data:', allData);

    try {
      const filteredData = await this.integration.validateAndFilterData(
        patronUser,
        allData,
        Permission.VIEW_ALL_DRIVERS,
        'operational-data'
      );

      console.log('Filtered data for patron:', filteredData);
    } catch (error) {
      console.log('Data filtering failed:', (error as Error).message);
    }
  }

  /**
   * Demo 6: Access logging and security monitoring
   */
  async demoAccessLogging(): Promise<void> {
    console.log('\n=== Demo 6: Access Logging and Security Monitoring ===');

    // Generate some access attempts
    const users = [
      {
        id: 'user1',
        email: 'user1@test.com',
        nombre: 'User 1',
        rol: UserRole.PATRON,
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      },
      {
        id: 'user2',
        email: 'user2@test.com',
        nombre: 'User 2',
        rol: UserRole.TAXISTA,
        numeroTaxista: 'TX666',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      }
    ];

    // Simulate various access attempts
    for (let i = 0; i < 5; i++) {
      const user = users[i % 2] as User;
      const context = createAuthorizationContext(
        user,
        `resource_${i}`,
        'read',
        i % 2 === 0 ? Permission.VIEW_ALL_DRIVERS : Permission.MANAGE_ASSOCIATIONS
      );

      await this.authMiddleware.authorize(context);
    }

    // Show access logs
    console.log('Recent access logs:');
    const logs = this.authMiddleware.getAccessLog({ limit: 10 });
    logs.forEach(log => {
      const status = log.success ? '✓' : '✗';
      console.log(`  ${status} ${log.userEmail || 'Anonymous'} -> ${log.action} on ${log.resource}`);
    });

    // Show security statistics
    console.log('\nSecurity statistics:');
    const stats = this.authMiddleware.getSecurityStatistics('day');
    console.log(`  Total attempts: ${stats.totalAttempts}`);
    console.log(`  Successful: ${stats.successfulAttempts}`);
    console.log(`  Failed: ${stats.failedAttempts}`);
    console.log(`  Unique users: ${stats.uniqueUsers}`);

    if (stats.topFailedResources.length > 0) {
      console.log('  Top failed resources:');
      stats.topFailedResources.forEach(resource => {
        console.log(`    - ${resource.resource}: ${resource.count} failures`);
      });
    }
  }

  /**
   * Run all demos
   */
  async runAllDemos(): Promise<void> {
    console.log('🔐 Authorization Middleware Demo');
    console.log('================================');

    try {
      await this.demoBasicPermissionCheck();
      await this.demoDataAccessValidation();
      await this.demoDataEncryption();
      await this.demoProtectedOperations();
      await this.demoDataFiltering();
      await this.demoAccessLogging();

      console.log('\n✅ All demos completed successfully!');
    } catch (error) {
      console.error('\n❌ Demo failed:', error);
    }
  }
}

/**
 * Run the demo if this file is executed directly
 */
if (require.main === module) {
  const demo = new AuthorizationDemo();
  demo.runAllDemos().catch(console.error);
}

export default AuthorizationDemo;