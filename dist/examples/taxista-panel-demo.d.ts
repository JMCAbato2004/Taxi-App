import { TaxistaPanel } from '../components/taxista-panel';
import { TaxistaPanelUI } from '../components/taxista-panel-ui';
/**
 * Demo class for taxista panel functionality
 */
export declare class TaxistaPanelDemo {
    private authService;
    private roleService;
    private serviceExpenseService;
    private reconciliationService;
    private taxistaPanel;
    private taxistaPanelUI;
    constructor();
    /**
     * Initialize the demo with sample data
     */
    initializeDemo(): Promise<void>;
    /**
     * Create sample taxista user for demo
     */
    private createSampleTaxista;
    /**
     * Login as the sample taxista
     */
    private loginAsTaxista;
    /**
     * Initialize the taxista panel
     */
    private initializeTaxistaPanel;
    /**
     * Initialize the taxista panel UI
     */
    initializeTaxistaPanelUI(containerId: string): void;
    /**
     * Demonstrate personal data access
     */
    demonstratePersonalDataAccess(): Promise<void>;
    /**
     * Demonstrate personal history access
     */
    demonstratePersonalHistoryAccess(): Promise<void>;
    /**
     * Demonstrate independent access during association
     */
    demonstrateIndependentAccess(): Promise<void>;
    /**
     * Demonstrate data export functionality
     */
    demonstrateDataExport(): void;
    /**
     * Run complete demo
     */
    runCompleteDemo(): Promise<void>;
    /**
     * Get the taxista panel instance
     */
    getTaxistaPanel(): TaxistaPanel | null;
    /**
     * Get the taxista panel UI instance
     */
    getTaxistaPanelUI(): TaxistaPanelUI | null;
    /**
     * Clean up demo data
     */
    cleanup(): void;
}
export default TaxistaPanelDemo;
//# sourceMappingURL=taxista-panel-demo.d.ts.map