// Taxista Panel Component
// Personal dashboard for taxistas to manage their data and view history
// Requirements: 4.1, 4.5, 4.3

import { 
  User, 
  UserRole, 
  Permission,
  AuthError,
  AuthErrorCode,
  TaxistaUser,
  Association
} from '../types';
import { RoleService } from '../services/role-service';
import { AuthService } from '../services/auth-service';
import { 
  ServiceExpenseIntegrationService,
  AuthenticatedServiceData,
  AuthenticatedExpenseData
} from '../services/service-expense-integration';

/**
 * Configuration for taxista panel
 */
export interface TaxistaPanelConfig {
  authService: AuthService;
  roleService: RoleService;
  serviceExpenseService: ServiceExpenseIntegrationService;
  onError?: (error: AuthError) => void;
  onSuccess?: (message: string) => void;
  onDataUpdated?: () => void;
}

/**
 * Personal statistics for taxista
 */
export interface TaxistaPersonalStats {
  totalServices: number;
  totalExpenses: number;
  totalRevenue: number;
  averageServiceValue: number;
  monthlyServices: number;
  monthlyRevenue: number;
  currentMonthGrowth: number;
  topServiceTypes: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'service' | 'expense';
    description: string;
    amount: number;
    date: Date;
  }>;
}

/**
 * Personal profile data for taxista
 */
export interface TaxistaPersonalProfile {
  user: TaxistaUser;
  associations: Association[];
  currentPatron: User | null;
  accountStatus: 'active' | 'inactive' | 'suspended';
  memberSince: Date;
  lastActivity: Date;
  personalSettings: {
    notifications: boolean;
    dataSharing: boolean;
    autoSync: boolean;
  };
}

/**
 * History filter options
 */
export interface HistoryFilters {
  dateFrom?: Date;
  dateTo?: Date;
  type?: 'all' | 'services' | 'expenses';
  sortBy?: 'date' | 'amount' | 'type';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

/**
 * Taxista Panel Component for personal data management and history access
 */
export class TaxistaPanel {
  private currentUser: TaxistaUser | null = null;
  private personalProfile: TaxistaPersonalProfile | null = null;
  private personalStats: TaxistaPersonalStats | null = null;
  private personalServices: AuthenticatedServiceData[] = [];
  private personalExpenses: AuthenticatedExpenseData[] = [];
  private isLoading = false;
  private historyFilters: HistoryFilters = {};

  constructor(private config: TaxistaPanelConfig) {
    this.initialize();
  }

  /**
   * Initialize the taxista panel
   */
  private async initialize(): Promise<void> {
    try {
      const user = this.config.authService.getCurrentUser();
      
      if (!user || user.rol !== UserRole.TAXISTA) {
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'Solo los taxistas pueden acceder a este panel'
        );
      }

      this.currentUser = user as TaxistaUser;
      await this.loadPersonalData();
    } catch (error) {
      this.handleError(error as AuthError);
    }
  }

  /**
   * Load all personal data for the taxista
   * Requirements: 4.1, 4.5 - Access to personal data and services history
   */
  async loadPersonalData(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Load personal profile
      await this.loadPersonalProfile();
      
      // Load personal services and expenses
      await this.loadPersonalHistory();
      
      // Calculate personal statistics
      await this.calculatePersonalStats();
      
    } catch (error) {
      this.handleError(error as AuthError);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load personal profile information
   * Requirements: 4.1 - Access to personal data
   */
  private async loadPersonalProfile(): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Get associations (if any)
      const associations = await this.config.roleService.getAssociationsForTaxista(this.currentUser.id);
      
      // Get current patron (if associated)
      let currentPatron: User | null = null;
      const activeAssociation = associations.find(a => a.activa);
      if (activeAssociation) {
        const associatedUsers = this.config.roleService.getAccessibleUsers();
        currentPatron = associatedUsers.find(u => u.id === activeAssociation.patronId) || null;
      }

      this.personalProfile = {
        user: this.currentUser,
        associations,
        currentPatron,
        accountStatus: this.currentUser.activo ? 'active' : 'inactive',
        memberSince: this.currentUser.fechaCreacion,
        lastActivity: new Date(), // In real implementation, track actual last activity
        personalSettings: {
          notifications: true,
          dataSharing: false,
          autoSync: true
        }
      };
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al cargar perfil personal',
        error
      );
    }
  }

  /**
   * Load personal history of services and expenses
   * Requirements: 4.5 - Access to personal history
   */
  private async loadPersonalHistory(filters?: HistoryFilters): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Get operation context
      const context = this.config.serviceExpenseService.getOperationContext();
      
      // Mock data for demonstration - in real implementation, this would fetch from storage
      const mockServices = this.generateMockPersonalServices();
      const mockExpenses = this.generateMockPersonalExpenses();

      // Get filtered data with authentication context
      this.personalServices = this.config.serviceExpenseService.getServicesWithAuth(mockServices);
      this.personalExpenses = this.config.serviceExpenseService.getExpensesWithAuth(mockExpenses);

      // Apply additional filters if provided
      if (filters) {
        this.applyHistoryFilters(filters);
      }
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al cargar historial personal',
        error
      );
    }
  }

  /**
   * Calculate personal statistics
   * Requirements: 4.5 - Personal statistics and history analysis
   */
  private async calculatePersonalStats(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Calculate totals
      const totalServices = this.personalServices.length;
      const totalExpenses = this.personalExpenses.length;
      const totalRevenue = this.personalServices.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const totalExpenseAmount = this.personalExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // Calculate monthly data
      const monthlyServices = this.personalServices.filter(s => 
        new Date(s.date || '') >= currentMonth
      ).length;
      const monthlyRevenue = this.personalServices
        .filter(s => new Date(s.date || '') >= currentMonth)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      // Calculate previous month for growth comparison
      const previousMonthServices = this.personalServices.filter(s => {
        const serviceDate = new Date(s.date || '');
        return serviceDate >= previousMonth && serviceDate < currentMonth;
      }).length;

      const currentMonthGrowth = previousMonthServices > 0 
        ? ((monthlyServices - previousMonthServices) / previousMonthServices) * 100 
        : 0;

      // Analyze service types
      const serviceTypeMap = new Map<string, { count: number; revenue: number }>();
      this.personalServices.forEach(service => {
        const type = service.serviceType || 'Servicio General';
        const existing = serviceTypeMap.get(type) || { count: 0, revenue: 0 };
        serviceTypeMap.set(type, {
          count: existing.count + 1,
          revenue: existing.revenue + (service.totalAmount || 0)
        });
      });

      const topServiceTypes = Array.from(serviceTypeMap.entries())
        .map(([type, data]) => ({ type, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Get recent activity (last 10 items)
      const recentActivity = [
        ...this.personalServices.map(s => ({
          id: s.id || '',
          type: 'service' as const,
          description: s.description || `Servicio ${s.serviceType || 'General'}`,
          amount: s.totalAmount || 0,
          date: new Date(s.date || '')
        })),
        ...this.personalExpenses.map(e => ({
          id: e.id || '',
          type: 'expense' as const,
          description: e.description || `Gasto ${e.category || 'General'}`,
          amount: e.amount || 0,
          date: new Date(e.date || '')
        }))
      ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

      this.personalStats = {
        totalServices,
        totalExpenses,
        totalRevenue,
        averageServiceValue: totalServices > 0 ? totalRevenue / totalServices : 0,
        monthlyServices,
        monthlyRevenue,
        currentMonthGrowth,
        topServiceTypes,
        recentActivity
      };
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al calcular estadísticas personales',
        error
      );
    }
  }

  /**
   * Create a new service
   * Requirements: 4.1 - Input operational data
   */
  async createService(serviceData: Partial<AuthenticatedServiceData>): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
      }

      // Ensure the service is associated with the current taxista
      const enrichedServiceData = {
        ...serviceData,
        userId: this.currentUser.id,
        taxistaId: this.currentUser.id,
        numeroTaxista: this.currentUser.numeroTaxista,
        createdBy: this.currentUser.id,
        date: serviceData.date || new Date().toISOString()
      };

      await this.config.serviceExpenseService.createService(enrichedServiceData);

      // Reload data to reflect changes
      await this.loadPersonalData();

      this.handleSuccess('Servicio creado exitosamente');
      
      if (this.config.onDataUpdated) {
        this.config.onDataUpdated();
      }

      return true;
    } catch (error) {
      this.handleError(error as AuthError);
      return false;
    }
  }

  /**
   * Create a new expense
   * Requirements: 4.1 - Input operational data
   */
  async createExpense(expenseData: Partial<AuthenticatedExpenseData>): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
      }

      // Ensure the expense is associated with the current taxista
      const enrichedExpenseData = {
        ...expenseData,
        userId: this.currentUser.id,
        taxistaId: this.currentUser.id,
        numeroTaxista: this.currentUser.numeroTaxista,
        createdBy: this.currentUser.id,
        date: expenseData.date || new Date().toISOString()
      };

      await this.config.serviceExpenseService.createExpense(enrichedExpenseData);

      // Reload data to reflect changes
      await this.loadPersonalData();

      this.handleSuccess('Gasto registrado exitosamente');
      
      if (this.config.onDataUpdated) {
        this.config.onDataUpdated();
      }

      return true;
    } catch (error) {
      this.handleError(error as AuthError);
      return false;
    }
  }

  /**
   * Update personal profile information
   * Requirements: 4.1 - Manage personal data
   */
  async updatePersonalProfile(updates: Partial<{
    nombre: string;
    telefono: string;
    personalSettings: Partial<TaxistaPersonalProfile['personalSettings']>;
  }>): Promise<boolean> {
    try {
      if (!this.currentUser || !this.personalProfile) {
        throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
      }

      // Update personal settings if provided
      if (updates.personalSettings) {
        this.personalProfile.personalSettings = {
          ...this.personalProfile.personalSettings,
          ...updates.personalSettings
        };
      }

      // For actual profile updates (name, phone), we would use the auth service
      // This is a simplified version for demonstration
      if (updates.nombre || updates.telefono) {
        // In real implementation, this would call authService.updateProfile()
        console.log('Profile update would be processed:', { updates });
      }

      this.handleSuccess('Perfil actualizado exitosamente');
      
      if (this.config.onDataUpdated) {
        this.config.onDataUpdated();
      }

      return true;
    } catch (error) {
      this.handleError(error as AuthError);
      return false;
    }
  }

  /**
   * Filter personal history
   * Requirements: 4.5 - Access to personal history with filtering
   */
  async filterHistory(filters: HistoryFilters): Promise<void> {
    try {
      this.historyFilters = { ...this.historyFilters, ...filters };
      await this.loadPersonalHistory(this.historyFilters);
      await this.calculatePersonalStats();
    } catch (error) {
      this.handleError(error as AuthError);
    }
  }

  /**
   * Clear history filters
   */
  clearHistoryFilters(): void {
    this.historyFilters = {};
    this.loadPersonalHistory();
  }

  /**
   * Export personal data
   * Requirements: 4.5 - Access to personal history and data
   */
  exportPersonalData(): string {
    if (!this.currentUser || !this.personalProfile || !this.personalStats) {
      throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Datos no disponibles');
    }

    const exportData = {
      taxista: {
        id: this.currentUser.id,
        nombre: this.currentUser.nombre,
        email: this.currentUser.email,
        numeroTaxista: this.currentUser.numeroTaxista,
        telefono: this.currentUser.telefono
      },
      profile: this.personalProfile,
      statistics: this.personalStats,
      services: this.personalServices,
      expenses: this.personalExpenses,
      exportDate: new Date().toISOString(),
      exportedBy: this.currentUser.numeroTaxista
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Getter methods

  /**
   * Get current taxista user
   */
  getCurrentUser(): TaxistaUser | null {
    return this.currentUser;
  }

  /**
   * Get personal profile
   */
  getPersonalProfile(): TaxistaPersonalProfile | null {
    return this.personalProfile;
  }

  /**
   * Get personal statistics
   */
  getPersonalStats(): TaxistaPersonalStats | null {
    return this.personalStats;
  }

  /**
   * Get personal services
   */
  getPersonalServices(): AuthenticatedServiceData[] {
    return this.personalServices;
  }

  /**
   * Get personal expenses
   */
  getPersonalExpenses(): AuthenticatedExpenseData[] {
    return this.personalExpenses;
  }

  /**
   * Get loading state
   */
  isLoadingData(): boolean {
    return this.isLoading;
  }

  /**
   * Get current history filters
   */
  getCurrentFilters(): HistoryFilters {
    return { ...this.historyFilters };
  }

  /**
   * Get notifications for the taxista
   */
  getNotifications(unreadOnly: boolean = false): any[] {
    return this.config.roleService.getNotifications(unreadOnly);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): boolean {
    return this.config.roleService.markNotificationAsRead(notificationId);
  }

  /**
   * Get unread notification count
   */
  getUnreadNotificationCount(): number {
    return this.config.roleService.getUnreadNotificationCount();
  }

  /**
   * Check if taxista has independent access
   * Requirements: 4.3 - Independent access during associations
   */
  hasIndependentAccess(): boolean {
    return this.config.roleService.hasPermission(Permission.VIEW_OWN_DATA) &&
           this.config.roleService.hasPermission(Permission.EDIT_OWN_PROFILE);
  }

  /**
   * Get association status
   * Requirements: 4.3 - Maintain independence during associations
   */
  getAssociationStatus(): {
    isAssociated: boolean;
    currentPatron: User | null;
    associationDate: Date | null;
    maintainsIndependence: boolean;
  } {
    const profile = this.getPersonalProfile();
    const hasIndependentAccess = this.hasIndependentAccess();

    return {
      isAssociated: !!profile?.currentPatron,
      currentPatron: profile?.currentPatron || null,
      associationDate: profile?.associations.find(a => a.activa)?.fechaAsociacion || null,
      maintainsIndependence: hasIndependentAccess
    };
  }

  // Private helper methods

  /**
   * Apply history filters to loaded data
   */
  private applyHistoryFilters(filters: HistoryFilters): void {
    let filteredServices = [...this.personalServices];
    let filteredExpenses = [...this.personalExpenses];

    // Date filtering
    if (filters.dateFrom) {
      filteredServices = filteredServices.filter(s => 
        new Date(s.date || '') >= filters.dateFrom!
      );
      filteredExpenses = filteredExpenses.filter(e => 
        new Date(e.date || '') >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filteredServices = filteredServices.filter(s => 
        new Date(s.date || '') <= filters.dateTo!
      );
      filteredExpenses = filteredExpenses.filter(e => 
        new Date(e.date || '') <= filters.dateTo!
      );
    }

    // Type filtering
    if (filters.type === 'services') {
      filteredExpenses = [];
    } else if (filters.type === 'expenses') {
      filteredServices = [];
    }

    // Sorting
    if (filters.sortBy) {
      const sortFn = (a: any, b: any) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'date':
            aValue = new Date(a.date || '').getTime();
            bValue = new Date(b.date || '').getTime();
            break;
          case 'amount':
            aValue = a.totalAmount || a.amount || 0;
            bValue = b.totalAmount || b.amount || 0;
            break;
          case 'type':
            aValue = a.serviceType || a.category || '';
            bValue = b.serviceType || b.category || '';
            break;
          default:
            return 0;
        }

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      };

      filteredServices.sort(sortFn);
      filteredExpenses.sort(sortFn);
    }

    // Limit
    if (filters.limit && filters.limit > 0) {
      filteredServices = filteredServices.slice(0, filters.limit);
      filteredExpenses = filteredExpenses.slice(0, filters.limit);
    }

    this.personalServices = filteredServices;
    this.personalExpenses = filteredExpenses;
  }

  /**
   * Generate mock personal services for demonstration
   */
  private generateMockPersonalServices(): any[] {
    if (!this.currentUser) return [];

    const mockServices = [];
    const now = new Date();
    
    // Generate services for the last 3 months
    for (let i = 0; i < 30; i++) {
      const serviceDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      const serviceTypes = ['Carrera Urbana', 'Carrera Aeropuerto', 'Servicio Especial', 'Carrera Nocturna'];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      
      mockServices.push({
        id: `service_${this.currentUser.id}_${i}`,
        userId: this.currentUser.id,
        taxistaId: this.currentUser.id,
        numeroTaxista: this.currentUser.numeroTaxista,
        createdBy: this.currentUser.id,
        serviceType,
        description: `${serviceType} - ${serviceDate.toLocaleDateString()}`,
        totalAmount: Math.floor(Math.random() * 50) + 10, // 10-60 euros
        date: serviceDate.toISOString(),
        status: 'completed',
        origin: `Origen ${i + 1}`,
        destination: `Destino ${i + 1}`,
        distance: Math.floor(Math.random() * 20) + 2, // 2-22 km
        duration: Math.floor(Math.random() * 60) + 10 // 10-70 minutes
      });
    }
    
    return mockServices;
  }

  /**
   * Generate mock personal expenses for demonstration
   */
  private generateMockPersonalExpenses(): any[] {
    if (!this.currentUser) return [];

    const mockExpenses = [];
    const now = new Date();
    
    // Generate expenses for the last 3 months
    for (let i = 0; i < 20; i++) {
      const expenseDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      const categories = ['Combustible', 'Mantenimiento', 'Seguro', 'Peajes', 'Limpieza'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      mockExpenses.push({
        id: `expense_${this.currentUser.id}_${i}`,
        userId: this.currentUser.id,
        taxistaId: this.currentUser.id,
        numeroTaxista: this.currentUser.numeroTaxista,
        createdBy: this.currentUser.id,
        category,
        description: `${category} - ${expenseDate.toLocaleDateString()}`,
        amount: Math.floor(Math.random() * 100) + 5, // 5-105 euros
        date: expenseDate.toISOString(),
        receipt: Math.random() > 0.5 ? `receipt_${i}.pdf` : undefined,
        vendor: `Proveedor ${i + 1}`
      });
    }
    
    return mockExpenses;
  }

  /**
   * Handle errors
   */
  private handleError(error: AuthError): void {
    console.error('TaxistaPanel Error:', error);
    if (this.config.onError) {
      this.config.onError(error);
    }
  }

  /**
   * Handle success messages
   */
  private handleSuccess(message: string): void {
    if (this.config.onSuccess) {
      this.config.onSuccess(message);
    }
  }
}

/**
 * Factory function to create taxista panel
 */
export function createTaxistaPanel(config: TaxistaPanelConfig): TaxistaPanel {
  return new TaxistaPanel(config);
}

/**
 * Hook-like function for React integration
 */
export function useTaxistaPanel(config: TaxistaPanelConfig): {
  panel: TaxistaPanel;
  currentUser: TaxistaUser | null;
  personalProfile: TaxistaPersonalProfile | null;
  personalStats: TaxistaPersonalStats | null;
  personalServices: AuthenticatedServiceData[];
  personalExpenses: AuthenticatedExpenseData[];
  isLoading: boolean;
  notifications: any[];
  unreadCount: number;
  associationStatus: any;
  createService: (serviceData: Partial<AuthenticatedServiceData>) => Promise<boolean>;
  createExpense: (expenseData: Partial<AuthenticatedExpenseData>) => Promise<boolean>;
  updateProfile: (updates: any) => Promise<boolean>;
  filterHistory: (filters: HistoryFilters) => Promise<void>;
  exportData: () => string;
  reload: () => Promise<void>;
} {
  const panel = new TaxistaPanel(config);
  
  return {
    panel,
    currentUser: panel.getCurrentUser(),
    personalProfile: panel.getPersonalProfile(),
    personalStats: panel.getPersonalStats(),
    personalServices: panel.getPersonalServices(),
    personalExpenses: panel.getPersonalExpenses(),
    isLoading: panel.isLoadingData(),
    notifications: panel.getNotifications(),
    unreadCount: panel.getUnreadNotificationCount(),
    associationStatus: panel.getAssociationStatus(),
    createService: (serviceData) => panel.createService(serviceData),
    createExpense: (expenseData) => panel.createExpense(expenseData),
    updateProfile: (updates) => panel.updatePersonalProfile(updates),
    filterHistory: (filters) => panel.filterHistory(filters),
    exportData: () => panel.exportPersonalData(),
    reload: () => panel.loadPersonalData()
  };
}