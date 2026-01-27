import { TaxistaPanelConfig } from './taxista-panel';
/**
 * UI Configuration for taxista panel
 */
export interface TaxistaPanelUIConfig extends TaxistaPanelConfig {
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
 * Taxista Panel UI Component
 */
export declare class TaxistaPanelUI {
    private config;
    private panel;
    private container;
    private theme;
    constructor(config: TaxistaPanelUIConfig);
    /**
     * Initialize the UI component
     */
    private initialize;
    /**
     * Render the complete taxista panel UI
     */
    private render;
    /**
     * Render the header section
     */
    private renderHeader;
    /**
     * Render the personal summary section
     */
    private renderPersonalSummary;
    /**
     * Render the tab navigation
     */
    private renderTabs;
    /**
     * Render the dashboard tab
     */
    private renderDashboardTab;
    /**
     * Render the history tab
     */
    private renderHistoryTab;
    /**
     * Render individual history item
     */
    private renderHistoryItem;
    /**
     * Render the services tab
     */
    private renderServicesTab;
    /**
     * Render individual service card
     */
    private renderServiceCard;
    /**
     * Render the expenses tab
     */
    private renderExpensesTab;
    /**
     * Render individual expense card
     */
    private renderExpenseCard;
    /**
     * Render the profile tab
     */
    private renderProfileTab;
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
     * Apply history filters
     */
    applyHistoryFilters(): Promise<void>;
    /**
     * Clear history filters
     */
    clearHistoryFilters(): void;
    /**
     * Show create service form
     */
    showCreateServiceForm(): void;
    /**
     * Hide create service form
     */
    hideCreateServiceForm(): void;
    /**
     * Create new service
     */
    createService(): Promise<void>;
    /**
     * Show create expense form
     */
    showCreateExpenseForm(): void;
    /**
     * Hide create expense form
     */
    hideCreateExpenseForm(): void;
    /**
     * Create new expense
     */
    createExpense(): Promise<void>;
    /**
     * Update personal settings
     */
    updateSettings(): Promise<void>;
    /**
     * Export personal data
     */
    exportData(): void;
    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId: string): void;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(): void;
    /**
     * Update history results section
     */
    private updateHistoryResults;
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
 * Factory function to create taxista panel UI
 */
export declare function createTaxistaPanelUI(config: TaxistaPanelUIConfig): TaxistaPanelUI;
//# sourceMappingURL=taxista-panel-ui.d.ts.map