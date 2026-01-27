// Patron Panel Integration Demo
// Demonstrates how to integrate the patron panel with existing services
// Requirements: 3.1, 3.2, 2.1, 2.2

import { PatronPanel, PatronPanelUI, createPatronPanel, createPatronPanelUI } from '../components/patron-panel';
import { PatronPanelUIConfig } from '../components/patron-panel-ui';
import { AuthService } from '../services/auth-service';
import { RoleService } from '../services/role-service';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
import { 
  User, 
  UserRole, 
  UserRegistrationData,
  AuthError,
  AuthErrorCode 
} from '../types';

/**
 * Demo class showing how to integrate the patron panel
 */
export class PatronPanelDemo {
  private authService: AuthService;
  private roleService: RoleService;
  private patronPanel: PatronPanel | null = null;
  private patronPanelUI: PatronPanelUI | null = null;

  constructor() {
    // Initialize services
    const jwtUtils = new JWTUtils('demo-secret-key');
    const cryptoUtils = new CryptoUtils();
    
    this.authService = new AuthService(jwtUtils, cryptoUtils);
    this.roleService = new RoleService(() => this.authService.getCurrentUser());
  }

  /**
   * Initialize demo with sample data
   */
  async initializeDemo(): Promise<void> {
    try {
      console.log('🚀 Initializing Patron Panel Demo...');

      // Create sample users
      await this.createSampleUsers();

      // Login as patron
      await this.loginAsPatron();

      // Create patron panel
      this.createPatronPanel();

      console.log('✅ Demo initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing demo:', error);
      throw error;
    }
  }

  /**
   * Create sample users for demonstration
   */
  private async createSampleUsers(): Promise<void> {
    console.log('👥 Creating sample users...');

    // Create patron user
    const patronData: UserRegistrationData = {
      email: 'patron@demo.com',
      password: 'SecurePass123!',
      nombre: 'Juan Pérez',
      telefono: '+34123456789',
      rol: UserRole.PATRON
    };

    try {
      await this.authService.register(patronData);
      console.log('✅ Patron user created');
    } catch (error) {
      if (error instanceof AuthError && error.code === AuthErrorCode.DUPLICATE_EMAIL) {
        console.log('ℹ️ Patron user already exists');
      } else {
        throw error;
      }
    }

    // Create sample taxistas
    const taxistaData = [
      {
        email: 'maria@demo.com',
        password: 'SecurePass456!',
        nombre: 'María García',
        telefono: '+34987654321',
        rol: UserRole.TAXISTA
      },
      {
        email: 'carlos@demo.com',
        password: 'SecurePass789!',
        nombre: 'Carlos López',
        telefono: '+34555666777',
        rol: UserRole.TAXISTA
      },
      {
        email: 'ana@demo.com',
        password: 'SecurePass012!',
        nombre: 'Ana Martínez',
        telefono: '+34111222333',
        rol: UserRole.TAXISTA
      }
    ];

    for (const taxista of taxistaData) {
      try {
        await this.authService.register(taxista);
        console.log(`✅ Taxista ${taxista.nombre} created`);
      } catch (error) {
        if (error instanceof AuthError && error.code === AuthErrorCode.DUPLICATE_EMAIL) {
          console.log(`ℹ️ Taxista ${taxista.nombre} already exists`);
        } else {
          console.warn(`⚠️ Error creating taxista ${taxista.nombre}:`, error);
        }
      }
    }
  }

  /**
   * Login as patron user
   */
  private async loginAsPatron(): Promise<void> {
    console.log('🔐 Logging in as patron...');

    try {
      const result = await this.authService.login({
        email: 'patron@demo.com',
        password: 'SecurePass123!'
      });

      console.log(`✅ Logged in as ${result.user.nombre} (${result.user.rol})`);
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Create and configure patron panel
   */
  private createPatronPanel(): void {
    console.log('🏗️ Creating patron panel...');

    const config = {
      authService: this.authService,
      roleService: this.roleService,
      onError: (error: AuthError) => {
        console.error('🚨 Patron Panel Error:', error.message);
        this.showNotification(`Error: ${error.message}`, 'error');
      },
      onSuccess: (message: string) => {
        console.log('✅ Patron Panel Success:', message);
        this.showNotification(message, 'success');
      },
      onAssociationCreated: (association) => {
        console.log('🔗 Association created:', association);
        this.showNotification('Nueva asociación creada exitosamente', 'success');
      },
      onAssociationRemoved: (associationId) => {
        console.log('🔗 Association removed:', associationId);
        this.showNotification('Asociación terminada', 'info');
      }
    };

    this.patronPanel = createPatronPanel(config);
    console.log('✅ Patron panel created');
  }

  /**
   * Create patron panel UI (if container exists)
   */
  createPatronPanelUI(containerId: string): PatronPanelUI | null {
    if (!this.patronPanel) {
      console.error('❌ Patron panel not initialized');
      return null;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ Container '${containerId}' not found`);
      return null;
    }

    console.log('🎨 Creating patron panel UI...');

    const uiConfig: PatronPanelUIConfig = {
      containerId,
      authService: this.authService,
      roleService: this.roleService,
      onError: (error: AuthError) => {
        console.error('🚨 UI Error:', error.message);
        this.showNotification(`Error: ${error.message}`, 'error');
      },
      onSuccess: (message: string) => {
        console.log('✅ UI Success:', message);
        this.showNotification(message, 'success');
      },
      theme: {
        primaryColor: '#10b981',
        secondaryColor: '#059669',
        backgroundColor: '#f5f5f5',
        textColor: '#1f2937',
        borderRadius: '8px'
      }
    };

    this.patronPanelUI = createPatronPanelUI(uiConfig);
    console.log('✅ Patron panel UI created');

    return this.patronPanelUI;
  }

  /**
   * Demonstrate patron panel functionality
   */
  async demonstrateFunctionality(): Promise<void> {
    if (!this.patronPanel) {
      throw new Error('Patron panel not initialized');
    }

    console.log('🎯 Demonstrating patron panel functionality...');

    try {
      // 1. Show dashboard data
      console.log('\n📊 Dashboard Data:');
      const dashboardData = this.patronPanel.getDashboardData();
      console.log(JSON.stringify(dashboardData, null, 2));

      // 2. Search available taxistas
      console.log('\n🔍 Searching available taxistas:');
      const availableTaxistas = await this.patronPanel.searchTaxistas();
      console.log(`Found ${availableTaxistas.length} available taxistas:`);
      availableTaxistas.forEach(taxista => {
        console.log(`  - ${taxista.nombre} (${taxista.numeroTaxista}) - ${taxista.email}`);
      });

      // 3. Create association if taxistas are available
      if (availableTaxistas.length > 0) {
        console.log('\n🔗 Creating association with first available taxista...');
        const success = await this.patronPanel.createAssociation(availableTaxistas[0].id);
        
        if (success) {
          console.log('✅ Association created successfully');
          
          // Show updated associated taxistas
          console.log('\n👥 Associated taxistas:');
          const associatedTaxistas = this.patronPanel.getAssociatedTaxistas();
          associatedTaxistas.forEach(taxista => {
            console.log(`  - ${taxista.nombre} (${taxista.numeroTaxista}) - ${taxista.email}`);
          });
        }
      }

      // 4. Show report data
      console.log('\n📈 Report Data:');
      const reportData = this.patronPanel.getReportData();
      if (reportData) {
        console.log(`  Total Taxistas: ${reportData.totalTaxistas}`);
        console.log(`  Active Taxistas: ${reportData.activeTaxistas}`);
        console.log(`  Total Services: ${reportData.totalServices}`);
        console.log(`  Total Revenue: €${reportData.totalRevenue.toFixed(2)}`);
        console.log(`  Monthly Growth: ${reportData.monthlyGrowth}%`);
        
        if (reportData.topPerformingTaxistas.length > 0) {
          console.log('  Top Performers:');
          reportData.topPerformingTaxistas.forEach((taxista, index) => {
            console.log(`    ${index + 1}. ${taxista.nombre} - €${taxista.totalRevenue.toFixed(2)}`);
          });
        }
      }

      // 5. Show notifications
      console.log('\n🔔 Notifications:');
      const notifications = this.patronPanel.getNotifications();
      console.log(`  Total: ${notifications.length}, Unread: ${this.patronPanel.getUnreadNotificationCount()}`);
      notifications.slice(0, 3).forEach(notification => {
        console.log(`  - ${notification.title}: ${notification.message}`);
      });

      // 6. Demonstrate search with filters
      console.log('\n🔍 Advanced search with filters:');
      const filteredResults = await this.patronPanel.searchTaxistas({
        sortBy: 'nombre',
        sortOrder: 'asc',
        limit: 2
      });
      console.log(`Filtered results (${filteredResults.length}):`);
      filteredResults.forEach(taxista => {
        console.log(`  - ${taxista.nombre} (${taxista.numeroTaxista})`);
      });

      console.log('\n✅ Functionality demonstration completed');

    } catch (error) {
      console.error('❌ Error during demonstration:', error);
      throw error;
    }
  }

  /**
   * Export report data
   */
  exportReportData(): string {
    if (!this.patronPanel) {
      throw new Error('Patron panel not initialized');
    }

    console.log('📥 Exporting report data...');
    const exportData = this.patronPanel.exportReportData();
    console.log('✅ Report data exported');
    
    return exportData;
  }

  /**
   * Clean up demo
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up demo...');
    
    try {
      await this.authService.logout();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.warn('⚠️ Error during logout:', error);
    }
  }

  /**
   * Get current patron panel instance
   */
  getPatronPanel(): PatronPanel | null {
    return this.patronPanel;
  }

  /**
   * Get current patron panel UI instance
   */
  getPatronPanelUI(): PatronPanelUI | null {
    return this.patronPanelUI;
  }

  /**
   * Show notification (placeholder for UI integration)
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    console.log(`${icon} [${timestamp}] ${message}`);
  }
}

/**
 * Factory function to create and initialize demo
 */
export async function createPatronPanelDemo(): Promise<PatronPanelDemo> {
  const demo = new PatronPanelDemo();
  await demo.initializeDemo();
  return demo;
}

/**
 * Run complete demo workflow
 */
export async function runPatronPanelDemo(): Promise<void> {
  console.log('🚀 Starting Patron Panel Demo...\n');

  try {
    // Create and initialize demo
    const demo = await createPatronPanelDemo();

    // Demonstrate functionality
    await demo.demonstrateFunctionality();

    // Export report data
    const reportData = demo.exportReportData();
    console.log('\n📄 Sample export data (first 200 chars):');
    console.log(reportData.substring(0, 200) + '...');

    // Cleanup
    await demo.cleanup();

    console.log('\n🎉 Demo completed successfully!');

  } catch (error) {
    console.error('\n💥 Demo failed:', error);
    throw error;
  }
}

// Export for use in other modules
export default PatronPanelDemo;