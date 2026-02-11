import { User, UserRole, Permission, Association } from '../types';
export interface IRoleService {
    getUserRole(): UserRole | null;
    hasPermission(permission: Permission): boolean;
    getAssociatedUsers(): Promise<User[]>;
    createAssociation(patronId: string, taxistaId: string): Promise<Association>;
    removeAssociation(associationId: string): Promise<void>;
    filterDataByRole<T>(data: T[], userContext?: any): T[];
    searchAvailableTaxistas(searchTerm?: string): Promise<User[]>;
    getAssociationsForPatron(patronId: string): Promise<Association[]>;
    getAssociationsForTaxista(taxistaId: string): Promise<Association[]>;
}
export declare class RoleService implements IRoleService {
    private getCurrentUser;
    private readonly ASSOCIATIONS_KEY;
    constructor(getCurrentUser: () => User | null);
    getUserRole(): UserRole | null;
    hasPermission(permission: Permission): boolean;
    getAssociatedUsers(): Promise<User[]>;
    createAssociation(patronId: string, taxistaId: string): Promise<Association>;
    removeAssociation(associationId: string): Promise<void>;
    filterDataByRole<T>(data: T[], userContext?: any): T[];
    searchAvailableTaxistas(searchTerm?: string): Promise<User[]>;
    getAssociationsForPatron(patronId: string): Promise<Association[]>;
    getAssociationsForTaxista(taxistaId: string): Promise<Association[]>;
    private getStoredUsers;
    private getStoredAssociations;
    private storeAssociations;
    private generateAssociationId;
    private notifyTaxistaOfAssociation;
    private getStoredNotifications;
    private storeNotifications;
}
//# sourceMappingURL=role-service.d.ts.map