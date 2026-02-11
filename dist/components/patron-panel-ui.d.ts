import { PatronPanelConfig } from './patron-panel';
/**
 * UI Configuration for patron panel
 */
export interface PatronPanelUIConfig extends PatronPanelConfig {
    containerId: string;
    theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
        borderRadius?: string;
    };
}
/**
 * Patron Panel UI Component
 */
export declare class PatronPanelUI {
    private config;
    private panel;
    private container;
    private theme;
    constructor(config: PatronPanelUIConfig);
    /**
     * Initialize the UI component
     */
    private initialize;
    /**
     * Render the complete patron panel UI
     */
    private render;
    /**
     * Render the header section
     */
    private renderHeader;
    /**
     * Render the dashboard summary
     */
    private renderDashboard;
    /**
     * Render the tab navigation
     */
    private renderTabs;
    /**
     * Render the associated taxistas tab
     */
    private renderTaxistasTab;
    /**
     * Render individual taxista card
     */
    private renderTaxistaCard;
    /**
     * Render the search taxistas tab
     */
    private renderSearchTab;
    /**
     * Render available taxista card
     */
    private renderAvailableTaxistaCard;
    /**
     * Render the reports tab
     */
    private renderReportsTab;
    /**
     * Render the notifications tab
     */
    private renderNotificationsTab;
    /**
     * Render individual notification card
     */
    private renderNotificationCard;
    /**
     * Get container styles
     */
    private getContainerStyles;
    /**
     * Render CSS styles
     */
    private renderStyles;
    /**
     * Show specific tab
     */
    showTab(tabName: string): void;
    /**
     * Refresh all data
     */
    refreshData(): Promise<void>;
    /**
     * Perform search with current filters
     */
    performSearch(): Promise<void>;
    /**
     * Clear search filters
     */
    clearSearch(): void;
    /**
     * Confirm and create association
     */
    confirmCreateAssociation(taxistaId: string, nombre: string, numeroTaxista: string): Promise<void>;
    /**
     * Confirm and remove association
     */
    confirmRemoveAssociation(associationId: string, taxistaNombre: string): Promise<void>;
    /**
     * View taxista details (placeholder for future implementation)
     */
    viewTaxistaDetails(taxistaId: string): void;
    /**
     * Export reports
     */
    exportReports(): void;
    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId: string): void;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(): void;
    /**
     * Update search results section
     */
    private updateSearchResults;
    /**
     * Update notifications tab
     */
    private updateNotificationsTab;
    /**
     * Update notification badge
     */
    private updateNotificationBadge;
    /**
     * Show temporary message
     */
    private showMessage;
    /**
     * Get time ago string
     */
    private getTimeAgo;
    /**
     * Attach event listeners
     */
    private attachEventListeners;
}
/**
 * Factory function to create patron panel UI
 */
export declare function createPatronPanelUI(config: PatronPanelUIConfig): PatronPanelUI;
//# sourceMappingURL=patron-panel-ui.d.ts.map