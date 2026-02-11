import { User, AuthError, AvailableTaxista, Association, AssociationWithDetails, PatronDashboard } from '../types';
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
export declare class PatronPanel {
    private config;
    private currentUser;
    private associatedTaxistas;
    private availableTaxistas;
    private associations;
    private dashboardData;
    private reportData;
    private isLoading;
    private searchFilters;
    constructor(config: PatronPanelConfig);
    /**
     * Initialize the patron panel
     */
    private initialize;
    /**
     * Load all necessary data for the panel
     */
    loadData(): Promise<void>;
    /**
     * Load associated taxistas
     */
    private loadAssociatedTaxistas;
    /**
     * Load available taxistas for association
     */
    private loadAvailableTaxistas;
    /**
     * Load dashboard summary data
     */
    private loadDashboardData;
    /**
     * Load aggregated report data
     */
    private loadReportData;
    /**
     * Search available taxistas with filters
     */
    searchTaxistas(filters?: TaxistaSearchFilters): Promise<AvailableTaxista[]>;
    /**
     * Create association with a taxista
     */
    createAssociation(taxistaId: string): Promise<boolean>;
    /**
     * Remove association with a taxista
     */
    removeAssociation(associationId: string): Promise<boolean>;
    /**
     * Get current dashboard data
     */
    getDashboardData(): PatronDashboard | null;
    /**
     * Get associated taxistas
     */
    getAssociatedTaxistas(): User[];
    /**
     * Get available taxistas for association
     */
    getAvailableTaxistas(): AvailableTaxista[];
    /**
     * Get detailed associations
     */
    getAssociations(): AssociationWithDetails[];
    /**
     * Get aggregated report data
     */
    getReportData(): AggregatedReportData | null;
    /**
     * Get loading state
     */
    isLoadingData(): boolean;
    /**
     * Get current search filters
     */
    getCurrentFilters(): TaxistaSearchFilters;
    /**
     * Clear search filters
     */
    clearFilters(): void;
    /**
     * Export report data as JSON
     */
    exportReportData(): string;
    /**
     * Get notifications for the patron
     */
    getNotifications(unreadOnly?: boolean): any[];
    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId: string): boolean;
    /**
     * Get unread notification count
     */
    getUnreadNotificationCount(): number;
    /**
     * Enrich associations with user details
     */
    private enrichAssociationsWithDetails;
    /**
     * Generate mock service data for demonstration
     * In a real implementation, this would integrate with existing service data
     */
    private generateMockServiceData;
    /**
     * Calculate monthly growth percentage
     */
    private calculateMonthlyGrowth;
    /**
     * Get top performing taxistas
     */
    private getTopPerformingTaxistas;
    /**
     * Handle errors
     */
    private handleError;
    /**
     * Handle success messages
     */
    private handleSuccess;
}
/**
 * Factory function to create patron panel
 */
export declare function createPatronPanel(config: PatronPanelConfig): PatronPanel;
/**
 * Hook-like function for React integration
 */
export declare function usePatronPanel(config: PatronPanelConfig): {
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
};
//# sourceMappingURL=patron-panel.d.ts.map