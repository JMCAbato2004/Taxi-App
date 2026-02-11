// Taxista Panel Demo
// Demonstrates the taxista personal dashboard functionality
// Requirements: 4.1, 4.5, 4.3

import { AuthService } from '../services/auth-service';
import { RoleService } from '../services/role-service';
import { ServiceExpenseIntegrationService } from '../services/service-expense-integration';
import { ReconciliationIntegrationService } from '../services/reconciliation-integration';
import { TaxistaPanel, TaxistaPanelConfig } from '../components/taxista-panel';
import { TaxistaPanelUI, TaxistaPanelUIConfig } from '../components/taxista-panel-ui';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
import { UserRole, AuthError } from '../types';

/**
 * Demo class for taxista panel functionality
 */
export class TaxistaPanelDemo {
  private authService: AuthService;
  private roleService: RoleService;
  private serviceExpenseService: ServiceExpenseIntegrationService;
  private reconciliationService: ReconciliationIntegrationService;
  private taxistaPanel: TaxistaPanel | null = null;
  private taxistaPanelUI: TaxistaPanelUI | null = null;

  constructor() {
    // Initialize services
    const jwtUtils = new JWTUtils();
    const cryptoUtils = new CryptoUtils();
    
    this.authService = new AuthService(jwtUtils, cryptoUtils);
    this.roleService = new RoleService(() => this.authService.getCurrentUser());
    this.reconciliationService = new ReconciliationIntegrationService(this.roleService);
    this.serviceExpenseService = new ServiceExpenseIntegrationService(
      this.roleService,
      this.reconciliationService,
      () => this.authService.getCurrentUser()
    );
  }

  /**
   * Initialize the demo with sample data
   */
  async initializeDemo(): Promise<void> {
    try {
      console.log('🚖 Inicializando Demo del Panel de Taxista...');

      // Create sample taxista user
      await this.createSampleTaxista();

      // Login as taxista
      await this.loginAsTaxista();

      // Initialize taxista panel
      this.initializeTaxistaPanel();

      console.log('✅ Demo inicializado correctamente');
      console.log('📊 Panel de taxista disponible con datos de ejemplo');
      
    } catch (error) {
      console.error('❌ Error inicializando demo:', error);
      throw error;
    }
  }

  /**
   * Create sample taxista user for demo
   */
  private async createSampleTaxista(): Promise<void> {
    try {
      const taxistaData = {
        email: 'juan.taxista@example.com',
        password: 'TaxistaPass123!',
        nombre: 'Juan Carlos Rodríguez',
        telefono: '+34 666 123 456',
        rol: UserRole.TAXISTA
      };

      await this.authService.register(taxistaData);
      console.log('👤 Usuario taxista creado:', taxistaData.nombre);
      
    } catch (error) {
      // User might already exist, that's okay for demo
      if (error instanceof AuthError && error.code === 'AUTH_006') {
        console.log('👤 Usuario taxista ya existe, continuando...');
      } else {
        throw error;
      }
    }
  }

  /**
   * Login as the sample taxista
   */
  private async loginAsTaxista(): Promise<void> {
    const credentials = {
      email: 'juan.taxista@example.com',
      password: 'TaxistaPass123!'
    };

    const authResult = await this.authService.login(credentials);
    console.log('🔐 Sesión iniciada como taxista:', authResult.user.nombre);
    console.log('🆔 Número de taxista:', authResult.user.numeroTaxista);
  }

  /**
   * Initialize the taxista panel
   */
  private initializeTaxistaPanel(): void {
    const config: TaxistaPanelConfig = {
      authService: this.authService,
      roleService: this.roleService,
      serviceExpenseService: this.serviceExpenseService,
      onError: (error: AuthError) => {
        console.error('❌ Error en panel de taxista:', error.message);
      },
      onSuccess: (message: string) => {
        console.log('✅ Éxito:', message);
      },
      onDataUpdated: () => {
        console.log('🔄 Datos actualizados');
      }
    };

    this.taxistaPanel = new TaxistaPanel(config);
  }

  /**
   * Initialize the taxista panel UI
   */
  initializeTaxistaPanelUI(containerId: string): void {
    if (!this.taxistaPanel) {
      throw new Error('Panel de taxista no inicializado. Ejecuta initializeDemo() primero.');
    }

    const uiConfig: TaxistaPanelUIConfig = {
      containerId,
      authService: this.authService,
      roleService: this.roleService,
      serviceExpenseService: this.serviceExpenseService,
      theme: {
        primaryColor: '#059669',
        secondaryColor: '#047857',
        backgroundColor: '#f5f5f5',
        textColor: '#1f2937',
        borderRadius: '8px'
      },
      onError: (error: AuthError) => {
        console.error('❌ Error en UI de taxista:', error.message);
      },
      onSuccess: (message: string) => {
        console.log('✅ Éxito:', message);
      },
      onDataUpdated: () => {
        console.log('🔄 Datos actualizados');
      }
    };

    this.taxistaPanelUI = new TaxistaPanelUI(uiConfig);
    console.log('🎨 UI del panel de taxista inicializada');
  }

  /**
   * Demonstrate personal data access
   */
  async demonstratePersonalDataAccess(): Promise<void> {
    if (!this.taxistaPanel) {
      throw new Error('Panel no inicializado');
    }

    console.log('\n📊 === DEMOSTRACIÓN: Acceso a Datos Personales ===');
    
    // Get current user
    const currentUser = this.taxistaPanel.getCurrentUser();
    console.log('👤 Usuario actual:', {
      nombre: currentUser?.nombre,
      numeroTaxista: currentUser?.numeroTaxista,
      email: currentUser?.email,
      telefono: currentUser?.telefono
    });

    // Get personal profile
    const profile = this.taxistaPanel.getPersonalProfile();
    console.log('📋 Perfil personal:', {
      accountStatus: profile?.accountStatus,
      memberSince: profile?.memberSince?.toLocaleDateString(),
      associations: profile?.associations.length || 0,
      currentPatron: profile?.currentPatron?.nombre || 'Ninguno'
    });

    // Get personal statistics
    const stats = this.taxistaPanel.getPersonalStats();
    console.log('📈 Estadísticas personales:', {
      totalServices: stats?.totalServices || 0,
      totalRevenue: `€${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
      averageServiceValue: `€${stats?.averageServiceValue?.toFixed(2) || '0.00'}`,
      monthlyServices: stats?.monthlyServices || 0,
      monthlyRevenue: `€${stats?.monthlyRevenue?.toFixed(2) || '0.00'}`
    });
  }

  /**
   * Demonstrate personal history access
   */
  async demonstratePersonalHistoryAccess(): Promise<void> {
    if (!this.taxistaPanel) {
      throw new Error('Panel no inicializado');
    }

    console.log('\n📋 === DEMOSTRACIÓN: Acceso a Historial Personal ===');
    
    // Get personal services
    const services = this.taxistaPanel.getPersonalServices();
    console.log(`🚗 Servicios personales: ${services.length} registros`);
    
    if (services.length > 0) {
      const recentService = services[0];
      console.log('🔍 Último servicio:', {
        tipo: recentService.serviceType,
        importe: `€${recentService.totalAmount?.toFixed(2)}`,
        fecha: new Date(recentService.date || '').toLocaleDateString(),
        origen: recentService.origin,
        destino: recentService.destination
      });
    }

    // Get personal expenses
    const expenses = this.taxistaPanel.getPersonalExpenses();
    console.log(`💸 Gastos personales: ${expenses.length} registros`);
    
    if (expenses.length > 0) {
      const recentExpense = expenses[0];
      console.log('🔍 Último gasto:', {
        categoria: recentExpense.category,
        importe: `€${recentExpense.amount?.toFixed(2)}`,
        fecha: new Date(recentExpense.date || '').toLocaleDateString(),
        proveedor: recentExpense.vendor
      });
    }

    // Demonstrate filtering
    console.log('\n🔍 Demostrando filtrado de historial...');
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    await this.taxistaPanel.filterHistory({
      dateFrom: lastMonth,
      type: 'services',
      sortBy: 'amount',
      sortOrder: 'desc',
      limit: 5
    });

    const filteredServices = this.taxistaPanel.getPersonalServices();
    console.log(`📊 Servicios del último mes (top 5): ${filteredServices.length} registros`);
  }

  /**
   * Demonstrate independent access during association
   */
  async demonstrateIndependentAccess(): Promise<void> {
    if (!this.taxistaPanel) {
      throw new Error('Panel no inicializado');
    }

    console.log('\n🆓 === DEMOSTRACIÓN: Acceso Independiente ===');
    
    // Check independent access
    const hasIndependentAccess = this.taxistaPanel.hasIndependentAccess();
    console.log('✅ Acceso independiente:', hasIndependentAccess ? 'SÍ' : 'NO');

    // Get association status
    const associationStatus = this.taxistaPanel.getAssociationStatus();
    console.log('🤝 Estado de asociación:', {
      isAssociated: associationStatus.isAssociated,
      currentPatron: associationStatus.currentPatron?.nombre || 'Ninguno',
      maintainsIndependence: associationStatus.maintainsIndependence
    });

    // Demonstrate data creation (independent operation)
    console.log('\n📝 Creando servicio personal (operación independiente)...');
    const serviceCreated = await this.taxistaPanel.createService({
      serviceType: 'Carrera Urbana',
      totalAmount: 25.50,
      origin: 'Plaza Mayor',
      destination: 'Aeropuerto',
      distance: 15.2,
      duration: 35,
      description: 'Servicio demo - acceso independiente'
    });

    console.log('✅ Servicio creado:', serviceCreated ? 'SÍ' : 'NO');

    // Demonstrate expense creation
    console.log('📝 Registrando gasto personal...');
    const expenseCreated = await this.taxistaPanel.createExpense({
      category: 'Combustible',
      amount: 45.00,
      vendor: 'Gasolinera Demo',
      description: 'Repostaje demo - acceso independiente'
    });

    console.log('✅ Gasto registrado:', expenseCreated ? 'SÍ' : 'NO');
  }

  /**
   * Demonstrate data export functionality
   */
  demonstrateDataExport(): void {
    if (!this.taxistaPanel) {
      throw new Error('Panel no inicializado');
    }

    console.log('\n📥 === DEMOSTRACIÓN: Exportación de Datos ===');
    
    try {
      const exportedData = this.taxistaPanel.exportPersonalData();
      const dataSize = new Blob([exportedData]).size;
      
      console.log('✅ Datos exportados exitosamente');
      console.log(`📊 Tamaño de exportación: ${(dataSize / 1024).toFixed(2)} KB`);
      console.log('📋 Datos incluidos: perfil, estadísticas, servicios, gastos');
      
      // Parse and show summary
      const parsedData = JSON.parse(exportedData);
      console.log('🔍 Resumen de exportación:', {
        taxista: parsedData.taxista.nombre,
        numeroTaxista: parsedData.taxista.numeroTaxista,
        servicios: parsedData.services?.length || 0,
        gastos: parsedData.expenses?.length || 0,
        fechaExportacion: new Date(parsedData.exportDate).toLocaleString()
      });
      
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
    }
  }

  /**
   * Run complete demo
   */
  async runCompleteDemo(): Promise<void> {
    try {
      await this.initializeDemo();
      await this.demonstratePersonalDataAccess();
      await this.demonstratePersonalHistoryAccess();
      await this.demonstrateIndependentAccess();
      this.demonstrateDataExport();
      
      console.log('\n🎉 === DEMO COMPLETADO ===');
      console.log('✅ Todas las funcionalidades del panel de taxista demostradas');
      console.log('📱 Panel listo para uso en PWA');
      
    } catch (error) {
      console.error('❌ Error en demo completo:', error);
      throw error;
    }
  }

  /**
   * Get the taxista panel instance
   */
  getTaxistaPanel(): TaxistaPanel | null {
    return this.taxistaPanel;
  }

  /**
   * Get the taxista panel UI instance
   */
  getTaxistaPanelUI(): TaxistaPanelUI | null {
    return this.taxistaPanelUI;
  }

  /**
   * Clean up demo data
   */
  cleanup(): void {
    // In a real implementation, this would clean up test data
    console.log('🧹 Limpiando datos de demo...');
    this.authService.logout();
    console.log('✅ Cleanup completado');
  }
}

// Export for use in other modules
export default TaxistaPanelDemo;

// Example usage
if (typeof window !== 'undefined') {
  (window as any).TaxistaPanelDemo = TaxistaPanelDemo;
}