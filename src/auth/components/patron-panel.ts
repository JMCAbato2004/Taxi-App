// Patron Panel Component
// Comprehensive dashboard for patrones to manage taxistas and view reports
// Requirements: 3.1, 3.2, 2.1, 2.2

import { 
  User, 
  UserRole, 
  Permission,
  AuthError,
  AuthErrorCode,
  AvailableTaxista,
  Association,
  AssociationWithDetails,
  PatronDashboard
} from '../types';
import { RoleService } from '../services/role-service';
import { AuthService } from '../services/auth-service';

/**
 * Configuration for patron panel
 */
export interface PatronPanelConfig {
  authService: AuthService;
  roleService: RoleService;
  onError?: (error: AuthError) => void;
  onSuccess?: (message: string) => void;
  onAssociationCreated?: (association: Association) => void;
  onAssociationRemoved?: (associationId: string) => void;
}

/**
 * Search filters for taxistas
 */
export interface TaxistaSearchFilters {
  searchTerm?: string;
  sortBy?: 'nombre' | 'email' | 'numeroTaxista' | 'fechaCreacion';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

/**
 * Aggregated report data
 */
export interface AggregatedReportData {
  totalTaxistas: number;
  activeTaxistas: number;
  totalServices: number;
  totalRevenue: number;
  averageServiceValue: number;
  monthlyGrowth: number;
  topPerformingTaxistas: Array<{
    id: string;
    nombre: string;
    numeroTaxista: string;
    totalServices: number;
    totalRevenue: number;
  }>;
}

/**
 * Patron Panel Component for managing taxistas and viewing reports
 */
export class PatronPanel {
  private currentUser: User | null = null;
  private associatedTaxistas: User[] = [];
  private availableTaxistas: AvailableTaxista[] = [];
  private associations: AssociationWithDetails[] = [];
  private dashboardData: PatronDashboard | null = null;
  private reportData: AggregatedReportData | null = null;
  private isLoading = false;
  private searchFilters: TaxistaSearchFilters = {};

  constructor(private config: PatronPanelConfig) {
    this.initialize();
  }

  /**
   * Initialize the patron panel
   */
  private async initialize(): Promise<void> {
    try {
      this.currentUser = this.config.authService.getCurrentUser();
      
      if (!this.currentUser || this.currentUser.rol !== UserRole.PATRON) {
        throw new AuthError(
          AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          'Solo los patrones pueden acceder a este panel'
        );
      }

      await this.loadData();
    } catch (error) {
      this.handleError(error as AuthError);
    }
  }

  /**
   * Load all necessary data for the panel
   */
  async loadData(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Load associated taxistas
      await this.loadAssociatedTaxistas();
      
      // Load available taxistas for association
      await this.loadAvailableTaxistas();
      
      // Load dashboard data
      await this.loadDashboardData();
      
      // Load aggregated reports
      await this.loadReportData();
      
    } catch (error) {
      this.handleError(error as AuthError);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load associated taxistas
   */
  private async loadAssociatedTaxistas(): Promise<void> {
    try {
      this.associatedTaxistas = await this.config.roleService.getAssociatedUsers();
      
      // Load detailed association information
      const associations = await this.config.roleService.getAssociationsForPatron(this.currentUser!.id);
      this.associations = await this.enrichAssociationsWithDetails(associations);
      
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al cargar taxistas asociados',
        error
      );
    }
  }

  /**
   * Load available taxistas for association
   */
  private async loadAvailableTaxistas(filters?: TaxistaSearchFilters): Promise<void> {
    try {
      if (filters) {
        this.availableTaxistas = await this.config.roleService.searchAvailableTaxistasAdvanced(filters);
      } else {
        this.availableTaxistas = await this.config.roleService.searchAvailableTaxistas();
      }
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al cargar taxistas disponibles',
        error
      );
    }
  }

  /**
   * Load dashboard summary data
   */
  private async loadDashboardData(): Promise<void> {
    try {
      const stats = this.config.roleService.getAssociationStatistics();
      
      this.dashboardData = {
        patronId: this.currentUser!.id,
        patronNombre: this.currentUser!.nombre,
        patronEmail: this.currentUser!.email,
        totalTaxistasAsociados: stats?.activeAssociations || 0,
        nuevasAsociacionesMes: stats?.recentAssociations || 0
      };
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al cargar datos del dashboard',
        error
      );
    }
  }

  /**
   * Load aggregated report data
   */
  private async loadReportData(): Promise<void> {
    try {
      // This would integrate with existing service/expense data
      // For now, we'll create a mock structure that can be extended
      const mockServiceData = this.generateMockServiceData();
      const aggregatedStats = this.config.roleService.getAggregatedDataSummary(mockServiceData, 'amount');
      
      this.reportData = {
        totalTaxistas: this.associatedTaxistas.length,
        activeTaxistas: this.associatedTaxistas.filter(t => t.activo).length,
        totalServices: aggregatedStats?.totalRecords || 0,
        totalRevenue: aggregatedStats?.totalAmount || 0,
        averageServiceValue: aggregatedStats?.averageAmount || 0,
        monthlyGrowth: this.calculateMonthlyGrowth(),
        topPerformingTaxistas: this.getTopPerformingTaxistas()
      };
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Error al cargar datos de reportes',
        error
      );
    }
  }

  /**
   * Search available taxistas with filters
   */
  async searchTaxistas(filters: TaxistaSearchFilters = {}): Promise<AvailableTaxista[]> {
    try {
      this.searchFilters = { ...this.searchFilters, ...filters };
      await this.loadAvailableTaxistas(this.searchFilters);
      return this.availableTaxistas;
    } catch (error) {
      this.handleError(error as AuthError);
      return [];
    }
  }

  /**
   * Create association with a taxista
   */
  async createAssociation(taxistaId: string): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new AuthError(AuthErrorCode.SESSION_EXPIRED, 'Usuario no autenticado');
      }

      // Check if taxista is available
      const taxista = this.availableTaxistas.find(t => t.id === taxistaId);
      if (!taxista) {
        throw new AuthError(
          AuthErrorCode.USER_NOT_FOUND,
          'Taxista no encontrado o no disponible'
        );
      }

      // Create the association
      const association = await this.config.roleService.createAssociation(
        this.currentUser.id,
        taxistaId
      );

      // Reload data to reflect changes
      await this.loadData();

      this.handleSuccess(`Asociación creada con ${taxista.nombre} (${taxista.numeroTaxista})`);
      
      if (this.config.onAssociationCreated) {
        this.config.onAssociationCreated(association);
      }

      return true;
    } catch (error) {
      this.handleError(error as AuthError);
      return false;
    }
  }

  /**
   * Remove association with a taxista
   */
  async removeAssociation(associationId: string): Promise<boolean> {
    try {
      const association = this.associations.find(a => a.id === associationId);
      if (!association) {
        throw new AuthError(
          AuthErrorCode.INVALID_ASSOCIATION,
          'Asociación no encontrada'
        );
      }

      await this.config.roleService.removeAssociation(associationId);

      // Reload data to reflect changes
      await this.loadData();

      this.handleSuccess(`Asociación con ${association.taxistaNombre} terminada`);
      
      if (this.config.onAssociationRemoved) {
        this.config.onAssociationRemoved(associationId);
      }

      return true;
    } catch (error) {
      this.handleError(error as AuthError);
      return false;
    }
  }

  /**
   * Get current dashboard data
   */
  getDashboardData(): PatronDashboard | null {
    return this.dashboardData;
  }

  /**
   * Get associated taxistas
   */
  getAssociatedTaxistas(): User[] {
    return this.associatedTaxistas;
  }

  /**
   * Get available taxistas for association
   */
  getAvailableTaxistas(): AvailableTaxista[] {
    return this.availableTaxistas;
  }

  /**
   * Get detailed associations
   */
  getAssociations(): AssociationWithDetails[] {
    return this.associations;
  }

  /**
   * Get aggregated report data
   */
  getReportData(): AggregatedReportData | null {
    return this.reportData;
  }

  /**
   * Get loading state
   */
  isLoadingData(): boolean {
    return this.isLoading;
  }

  /**
   * Get current search filters
   */
  getCurrentFilters(): TaxistaSearchFilters {
    return { ...this.searchFilters };
  }

  /**
   * Clear search filters
   */
  clearFilters(): void {
    this.searchFilters = {};
    this.loadAvailableTaxistas();
  }

  /**
   * Export report data as JSON
   */
  exportReportData(): string {
    const exportData = {
      patron: {
        id: this.currentUser?.id,
        nombre: this.currentUser?.nombre,
        email: this.currentUser?.email
      },
      dashboard: this.dashboardData,
      reportData: this.reportData,
      associations: this.associations,
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get notifications for the patron
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

  // Private helper methods

  /**
   * Enrich associations with user details
   */
  private async enrichAssociationsWithDetails(associations: Association[]): Promise<AssociationWithDetails[]> {
    const users = this.config.roleService.getAccessibleUsers();
    
    return associations.map(assoc => {
      const patron = users.find(u => u.id === assoc.patronId);
      const taxista = users.find(u => u.id === assoc.taxistaId);
      
      return {
        ...assoc,
        patronNombre: patron?.nombre || 'Desconocido',
        patronEmail: patron?.email || '',
        taxistaNombre: taxista?.nombre || 'Desconocido',
        taxistaEmail: taxista?.email || '',
        taxistaNumero: taxista?.numeroTaxista || '',
        taxistaTelefono: taxista?.telefono
      };
    });
  }

  /**
   * Generate mock service data for demonstration
   * In a real implementation, this would integrate with existing service data
   */
  private generateMockServiceData(): any[] {
    const mockData = [];
    const now = new Date();
    
    // Generate sample data for each associated taxista
    this.associatedTaxistas.forEach(taxista => {
      const serviceCount = Math.floor(Math.random() * 20) + 5; // 5-25 services
      
      for (let i = 0; i < serviceCount; i++) {
        const serviceDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
        mockData.push({
          id: `service_${taxista.id}_${i}`,
          userId: taxista.id,
          taxistaId: taxista.id,
          numeroTaxista: taxista.numeroTaxista,
          amount: Math.floor(Math.random() * 50) + 10, // 10-60 euros
          date: serviceDate,
          type: 'service',
          description: `Servicio ${i + 1} - ${taxista.nombre}`
        });
      }
    });
    
    return mockData;
  }

  /**
   * Calculate monthly growth percentage
   */
  private calculateMonthlyGrowth(): number {
    // Mock calculation - in real implementation would compare with previous month
    return Math.floor(Math.random() * 20) - 5; // -5% to +15%
  }

  /**
   * Get top performing taxistas
   */
  private getTopPerformingTaxistas(): Array<{
    id: string;
    nombre: string;
    numeroTaxista: string;
    totalServices: number;
    totalRevenue: number;
  }> {
    return this.associatedTaxistas
      .map(taxista => ({
        id: taxista.id,
        nombre: taxista.nombre,
        numeroTaxista: taxista.numeroTaxista || '',
        totalServices: Math.floor(Math.random() * 25) + 5,
        totalRevenue: Math.floor(Math.random() * 1000) + 200
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5); // Top 5
  }

  /**
   * Handle errors
   */
  private handleError(error: AuthError): void {
    console.error('PatronPanel Error:', error);
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
 * Factory function to create patron panel
 */
export function createPatronPanel(config: PatronPanelConfig): PatronPanel {
  return new PatronPanel(config);
}

/**
 * Hook-like function for React integration
 */
export function usePatronPanel(config: PatronPanelConfig): {
  panel: PatronPanel;
  dashboardData: PatronDashboard | null;
  associatedTaxistas: User[];
  availableTaxistas: AvailableTaxista[];
  reportData: AggregatedReportData | null;
  isLoading: boolean;
  notifications: any[];
  unreadCount: number;
  searchTaxistas: (filters?: TaxistaSearchFilters) => Promise<AvailableTaxista[]>;
  createAssociation: (taxistaId: string) => Promise<boolean>;
  removeAssociation: (associationId: string) => Promise<boolean>;
  reload: () => Promise<void>;
} {
  const panel = new PatronPanel(config);
  
  return {
    panel,
    dashboardData: panel.getDashboardData(),
    associatedTaxistas: panel.getAssociatedTaxistas(),
    availableTaxistas: panel.getAvailableTaxistas(),
    reportData: panel.getReportData(),
    isLoading: panel.isLoadingData(),
    notifications: panel.getNotifications(),
    unreadCount: panel.getUnreadNotificationCount(),
    searchTaxistas: (filters) => panel.searchTaxistas(filters),
    createAssociation: (taxistaId) => panel.createAssociation(taxistaId),
    removeAssociation: (associationId) => panel.removeAssociation(associationId),
    reload: () => panel.loadData()
  };
}