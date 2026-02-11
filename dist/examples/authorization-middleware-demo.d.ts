/**
 * Authorization Middleware Demo
 * Demonstrates comprehensive usage of the authorization middleware
 * Requirements: 6.1, 6.2, 6.5
 */
/**
 * Demo class showing practical authorization middleware usage
 */
export declare class AuthorizationDemo {
    private authMiddleware;
    private integration;
    constructor();
    /**
     * Demo 1: Basic permission checking
     */
    demoBasicPermissionCheck(): Promise<void>;
    /**
     * Demo 2: Data access validation with associations
     */
    demoDataAccessValidation(): Promise<void>;
    /**
     * Demo 3: Sensitive data encryption
     */
    demoDataEncryption(): Promise<void>;
    /**
     * Demo 4: Using middleware integration for protected operations
     */
    demoProtectedOperations(): Promise<void>;
    /**
     * Demo 5: Data filtering with role-based access
     */
    demoDataFiltering(): Promise<void>;
    /**
     * Demo 6: Access logging and security monitoring
     */
    demoAccessLogging(): Promise<void>;
    /**
     * Run all demos
     */
    runAllDemos(): Promise<void>;
}
export default AuthorizationDemo;
//# sourceMappingURL=authorization-middleware-demo.d.ts.map