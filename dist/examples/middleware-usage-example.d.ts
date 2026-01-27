/**
 * Simple Authorization Middleware Usage Example
 * Shows practical integration patterns
 */
import { User } from '../types';
/**
 * Example service that uses authorization middleware
 */
export declare class SecureDataService {
    private authMiddleware;
    private integration;
    constructor();
    /**
     * Get user data with authorization check
     */
    getUserData(currentUser: User | null, targetUserId: string): Promise<any>;
    /**
     * Create association with authorization and logging
     */
    createAssociation(currentUser: User | null, patronId: string, taxistaId: string): Promise<any>;
    /**
     * Get filtered data based on user role
     */
    getFilteredData(currentUser: User | null): Promise<any[]>;
    /**
     * Get access logs for security monitoring
     */
    getSecurityLogs(currentUser: User | null): any[];
}
/**
 * Example usage demonstration
 */
export declare function demonstrateMiddlewareUsage(): Promise<void>;
export { SecureDataService };
//# sourceMappingURL=middleware-usage-example.d.ts.map