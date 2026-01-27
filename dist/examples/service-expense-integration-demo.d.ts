/**
 * Demo class for service and expense integration
 */
export declare class ServiceExpenseIntegrationDemo {
    private authService;
    private roleService;
    private reconciliationService;
    private integrationService;
    constructor();
    /**
     * Demo: Patron creates and manages services for associated taxistas
     */
    demoPatronServiceManagement(): Promise<void>;
    /**
     * Demo: Taxista creates and manages own services
     */
    demoTaxistaServiceManagement(): Promise<void>;
    /**
     * Demo: Expense management with authentication
     */
    demoExpenseManagement(): Promise<void>;
    /**
     * Demo: Permission validation and access control
     */
    demoPermissionValidation(): Promise<void>;
    /**
     * Demo: Storage wrapper integration
     */
    demoStorageIntegration(): Promise<void>;
    /**
     * Run all demos
     */
    runAllDemos(): Promise<void>;
}
export default ServiceExpenseIntegrationDemo;
//# sourceMappingURL=service-expense-integration-demo.d.ts.map