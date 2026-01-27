import { PatronPanel, PatronPanelUI } from '../components/patron-panel';
/**
 * Demo class showing how to integrate the patron panel
 */
export declare class PatronPanelDemo {
    private authService;
    private roleService;
    private patronPanel;
    private patronPanelUI;
    constructor();
    /**
     * Initialize demo with sample data
     */
    initializeDemo(): Promise<void>;
    /**
     * Create sample users for demonstration
     */
    private createSampleUsers;
    /**
     * Login as patron user
     */
    private loginAsPatron;
    /**
     * Create and configure patron panel
     */
    private createPatronPanel;
    /**
     * Create patron panel UI (if container exists)
     */
    createPatronPanelUI(containerId: string): PatronPanelUI | null;
    /**
     * Demonstrate patron panel functionality
     */
    demonstrateFunctionality(): Promise<void>;
    /**
     * Export report data
     */
    exportReportData(): string;
    /**
     * Clean up demo
     */
    cleanup(): Promise<void>;
    /**
     * Get current patron panel instance
     */
    getPatronPanel(): PatronPanel | null;
    /**
     * Get current patron panel UI instance
     */
    getPatronPanelUI(): PatronPanelUI | null;
    /**
     * Show notification (placeholder for UI integration)
     */
    private showNotification;
}
/**
 * Factory function to create and initialize demo
 */
export declare function createPatronPanelDemo(): Promise<PatronPanelDemo>;
/**
 * Run complete demo workflow
 */
export declare function runPatronPanelDemo(): Promise<void>;
export default PatronPanelDemo;
//# sourceMappingURL=patron-panel-demo.d.ts.map