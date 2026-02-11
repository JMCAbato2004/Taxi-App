import { User, UserRole, Permission, Association, IRoleService, AvailableTaxista } from '../types';
import { SensitiveDataConfirmationService, ConfirmationRequest } from './sensitive-data-confirmation';
export declare class RoleService implements IRoleService {
    private getCurrentUser;
    private readonly ASSOCIATIONS_KEY;
    private sensitiveDataService;
    constructor(getCurrentUser: () => User | null, sensitiveDataService?: SensitiveDataConfirmationService);
    getUserRole(): UserRole | null;
    hasPermission(permission: Permission): boolean;
    getPermissions(): Permission[];
    getAssociatedUsers(): Promise<User[]>;
    createAssociation(patronId: string, taxistaId: string): Promise<Association>;
    /**
     * Initiate association creation with confirmation requirement
     * Requirements: 6.4 - Additional confirmation for sensitive data
     */
    initiateAssociationCreation(patronId: string, taxistaId: string): Promise<ConfirmationRequest>;
    removeAssociation(associationId: string): Promise<void>;
    /**
     * Initiate association removal with confirmation requirement
     * Requirements: 6.4 - Additional confirmation for sensitive data
     */
    initiateAssociationRemoval(associationId: string): Promise<ConfirmationRequest>;
    /**
     * Execute confirmed association creation
     * Requirements: 6.4 - Additional confirmation for sensitive data
     */
    executeConfirmedAssociationCreation(confirmationRequestId: string): Promise<Association>;
    /**
     * Execute confirmed association removal
     * Requirements: 6.4 - Additional confirmation for sensitive data
     */
    executeConfirmedAssociationRemoval(confirmationRequestId: string): Promise<void>;
    filterDataByRole<T>(data: T[], userContext?: any): T[];
    /**
     * Filter data for Patron users - show data from associated taxistas
     */
    private filterDataForPatron;
    /**
     * Filter data for Taxista users - show only their own data
     */
    private filterDataForTaxista;
    searchAvailableTaxistas(searchTerm?: string): Promise<AvailableTaxista[]>;
    getAssociationsForPatron(patronId: string): Promise<Association[]>;
    getAssociationsForTaxista(taxistaId: string): Promise<Association[]>;
    /**
     * Check if current user can access data from a specific user
     */
    canAccessUserData(targetUserId: string): boolean;
    /**
     * Get filtered user list based on current user's permissions
     */
    getAccessibleUsers(): User[];
    /**
     * Validate if current user can perform an operation on target data
     */
    validateDataAccess(targetData: any, operation?: 'read' | 'write' | 'delete'): boolean;
    /**
     * Get aggregated data summary for patrones
     */
    getAggregatedDataSummary<T>(data: T[], aggregationField?: string): any;
    private getStoredUsers;
    private getStoredAssociations;
    private storeAssociations;
    private notifyAssociationRemoval;
    /**
     * Get notifications for current user
     */
    getNotifications(unreadOnly?: boolean): any[];
    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId: string): boolean;
    /**
     * Mark all notifications as read for current user
     */
    markAllNotificationsAsRead(): number;
    /**
     * Get count of unread notifications for current user
     */
    getUnreadNotificationCount(): number;
    /**
     * Enhanced search for available taxistas with additional filters
     */
    searchAvailableTaxistasAdvanced(options?: {
        searchTerm?: string;
        sortBy?: 'nombre' | 'email' | 'numeroTaxista' | 'fechaCreacion';
        sortOrder?: 'asc' | 'desc';
        limit?: number;
    }): Promise<AvailableTaxista[]>;
    /**
     * Get association statistics for current patron
     */
    getAssociationStatistics(): any;
    private generateNotificationId;
    private generateAssociationId;
    private notifyTaxistaOfAssociation;
    private getStoredNotifications;
    private storeNotifications;
}
//# sourceMappingURL=role-service.d.ts.map