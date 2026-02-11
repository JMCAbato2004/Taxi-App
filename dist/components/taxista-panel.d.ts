import { User, AuthError, TaxistaUser, Association } from '../types';
import { RoleService } from '../services/role-service';
import { AuthService } from '../services/auth-service';
import { ServiceExpenseIntegrationService, AuthenticatedServiceData, AuthenticatedExpenseData } from '../services/service-expense-integration';
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
export declare class TaxistaPanel {
    private config;
    private currentUser;
    private personalProfile;
    private personalStats;
    private personalServices;
    private personalExpenses;
    private isLoading;
    private historyFilters;
    constructor(config: TaxistaPanelConfig);
    /**
     * Initialize the taxista panel
     */
    private initialize;
    /**
     * Load all personal data for the taxista
     * Requirements: 4.1, 4.5 - Access to personal data and services history
     */
    loadPersonalData(): Promise<void>;
    /**
     * Load personal profile information
     * Requirements: 4.1 - Access to personal data
     */
    private loadPersonalProfile;
    /**
     * Load personal history of services and expenses
     * Requirements: 4.5 - Access to personal history
     */
    private loadPersonalHistory;
    /**
     * Calculate personal statistics
     * Requirements: 4.5 - Personal statistics and history analysis
     */
    private calculatePersonalStats;
    /**
     * Create a new service
     * Requirements: 4.1 - Input operational data
     */
    createService(serviceData: Partial<AuthenticatedServiceData>): Promise<boolean>;
    /**
     * Create a new expense
     * Requirements: 4.1 - Input operational data
     */
    createExpense(expenseData: Partial<AuthenticatedExpenseData>): Promise<boolean>;
    /**
     * Update personal profile information
     * Requirements: 4.1 - Manage personal data
     */
    updatePersonalProfile(updates: Partial<{
        nombre: string;
        telefono: string;
        personalSettings: Partial<TaxistaPersonalProfile['personalSettings']>;
    }>): Promise<boolean>;
    /**
     * Filter personal history
     * Requirements: 4.5 - Access to personal history with filtering
     */
    filterHistory(filters: HistoryFilters): Promise<void>;
    /**
     * Clear history filters
     */
    clearHistoryFilters(): void;
    /**
     * Export personal data
     * Requirements: 4.5 - Access to personal history and data
     */
    exportPersonalData(): string;
    /**
     * Get current taxista user
     */
    getCurrentUser(): TaxistaUser | null;
    /**
     * Get personal profile
     */
    getPersonalProfile(): TaxistaPersonalProfile | null;
    /**
     * Get personal statistics
     */
    getPersonalStats(): TaxistaPersonalStats | null;
    /**
     * Get personal services
     */
    getPersonalServices(): AuthenticatedServiceData[];
    /**
     * Get personal expenses
     */
    getPersonalExpenses(): AuthenticatedExpenseData[];
    /**
     * Get loading state
     */
    isLoadingData(): boolean;
    /**
     * Get current history filters
     */
    getCurrentFilters(): HistoryFilters;
    /**
     * Get notifications for the taxista
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
     * Check if taxista has independent access
     * Requirements: 4.3 - Independent access during associations
     */
    hasIndependentAccess(): boolean;
    /**
     * Get association status
     * Requirements: 4.3 - Maintain independence during associations
     */
    getAssociationStatus(): {
        isAssociated: boolean;
        currentPatron: User | null;
        associationDate: Date | null;
        maintainsIndependence: boolean;
    };
    /**
     * Apply history filters to loaded data
     */
    private applyHistoryFilters;
    /**
     * Generate mock personal services for demonstration
     */
    private generateMockPersonalServices;
    /**
     * Generate mock personal expenses for demonstration
     */
    private generateMockPersonalExpenses;
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
 * Factory function to create taxista panel
 */
export declare function createTaxistaPanel(config: TaxistaPanelConfig): TaxistaPanel;
/**
 * Hook-like function for React integration
 */
export declare function useTaxistaPanel(config: TaxistaPanelConfig): {
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
};
//# sourceMappingURL=taxista-panel.d.ts.map