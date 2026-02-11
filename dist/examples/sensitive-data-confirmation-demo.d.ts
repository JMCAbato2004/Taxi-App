/**
 * Sensitive Data Confirmation Demo
 * Demonstrates how to use the sensitive data confirmation system
 * Requirements: 6.4 - Additional confirmation for sensitive data modifications
 */
/**
 * Demo class showing sensitive data confirmation workflows
 */
export declare class SensitiveDataConfirmationDemo {
    private authService;
    private roleService;
    private sensitiveDataService;
    constructor();
    /**
     * Demo: Password change with confirmation
     */
    demoPasswordChange(): Promise<void>;
    /**
     * Demo: Email change with multi-step confirmation
     */
    demoEmailChange(): Promise<void>;
    /**
     * Demo: Association management with confirmation
     */
    demoAssociationManagement(): Promise<void>;
    /**
     * Demo: Confirmation status tracking
     */
    demoConfirmationStatus(): Promise<void>;
    /**
     * Demo: Error handling scenarios
     */
    demoErrorHandling(): Promise<void>;
    /**
     * Run all demos
     */
    runAllDemos(): Promise<void>;
}
/**
 * Usage example
 */
export declare function runSensitiveDataDemo(): Promise<void>;
export default SensitiveDataConfirmationDemo;
//# sourceMappingURL=sensitive-data-confirmation-demo.d.ts.map