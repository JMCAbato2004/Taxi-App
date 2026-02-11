/**
 * FABButton Component
 * Floating Action Button with quick action menu
 */

class FABButton {
  constructor() {
    this.fabElement = null;
    this.isOpen = false;
  }

  /**
   * Initialize the FAB button
   */
  initialize() {
    this.fabElement = document.getElementById('fab-button');
    
    if (!this.fabElement) {
      console.error('FABButton: fab-button element not found');
      return;
    }

    // Set up click listener
    this.fabElement.addEventListener('click', () => {
      this.handleClick();
    });

    console.log('FABButton initialized');
  }

  /**
   * Handle FAB button click
   */
  async handleClick() {
    await this.showActionSheet();
  }

  /**
   * Show action sheet with quick actions
   */
  async showActionSheet() {
    if (!window.ActionSheetManager) {
      console.error('FABButton: ActionSheetManager not available');
      return;
    }

    const buttons = [
      {
        text: 'Nuevo Servicio',
        icon: 'car',
        handler: () => this.handleNewService()
      },
      {
        text: 'Nuevo Gasto',
        icon: 'wallet',
        handler: () => this.handleNewExpense()
      },
      {
        text: 'Ver Reportes',
        icon: 'bar-chart',
        handler: () => this.handleViewReports()
      },
      {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel'
      }
    ];

    await ActionSheetManager.show('Nueva Acción', buttons);
  }

  /**
   * Handle new service action
   */
  handleNewService() {
    // Dispatch event for new service
    window.dispatchEvent(new CustomEvent('fab-new-service'));
    
    // Show placeholder toast for now
    if (window.ToastManager) {
      ToastManager.showInfo('Nuevo servicio - Próximamente');
    }
  }

  /**
   * Handle new expense action
   */
  handleNewExpense() {
    // Dispatch event for new expense
    window.dispatchEvent(new CustomEvent('fab-new-expense'));
    
    // Show placeholder toast for now
    if (window.ToastManager) {
      ToastManager.showInfo('Nuevo gasto - Próximamente');
    }
  }

  /**
   * Handle view reports action
   */
  handleViewReports() {
    // Dispatch event for view reports
    window.dispatchEvent(new CustomEvent('fab-view-reports'));
    
    // Show placeholder toast for now
    if (window.ToastManager) {
      ToastManager.showInfo('Reportes - Próximamente');
    }
  }

  /**
   * Show the FAB button
   */
  show() {
    if (this.fabElement) {
      const fabContainer = this.fabElement.closest('ion-fab');
      if (fabContainer) {
        fabContainer.style.display = 'block';
      }
    }
  }

  /**
   * Hide the FAB button
   */
  hide() {
    if (this.fabElement) {
      const fabContainer = this.fabElement.closest('ion-fab');
      if (fabContainer) {
        fabContainer.style.display = 'none';
      }
    }
  }

  /**
   * Enable the FAB button
   */
  enable() {
    if (this.fabElement) {
      this.fabElement.disabled = false;
    }
  }

  /**
   * Disable the FAB button
   */
  disable() {
    if (this.fabElement) {
      this.fabElement.disabled = true;
    }
  }

  /**
   * Update FAB button color
   * @param {string} color - Ionic color name
   */
  setColor(color) {
    if (this.fabElement) {
      this.fabElement.setAttribute('color', color);
    }
  }

  /**
   * Update FAB button icon
   * @param {string} iconName - Ionic icon name
   */
  setIcon(iconName) {
    if (this.fabElement) {
      const icon = this.fabElement.querySelector('ion-icon');
      if (icon) {
        icon.setAttribute('name', iconName);
      }
    }
  }

  /**
   * Add custom action to the action sheet
   * @param {Object} action - Action object {text, icon, handler}
   */
  addCustomAction(action) {
    if (!action || !action.text || !action.handler) {
      console.error('FABButton: Invalid action object');
      return;
    }

    // Store custom action for next time action sheet is shown
    if (!this.customActions) {
      this.customActions = [];
    }

    this.customActions.push(action);
  }

  /**
   * Clear all custom actions
   */
  clearCustomActions() {
    this.customActions = [];
  }

  /**
   * Show action sheet with custom actions included
   */
  async showActionSheetWithCustomActions() {
    if (!window.ActionSheetManager) {
      console.error('FABButton: ActionSheetManager not available');
      return;
    }

    const defaultButtons = [
      {
        text: 'Nuevo Servicio',
        icon: 'car',
        handler: () => this.handleNewService()
      },
      {
        text: 'Nuevo Gasto',
        icon: 'wallet',
        handler: () => this.handleNewExpense()
      },
      {
        text: 'Ver Reportes',
        icon: 'bar-chart',
        handler: () => this.handleViewReports()
      }
    ];

    // Add custom actions if any
    const buttons = this.customActions && this.customActions.length > 0
      ? [...defaultButtons, ...this.customActions]
      : defaultButtons;

    // Add cancel button
    buttons.push({
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    });

    await ActionSheetManager.show('Nueva Acción', buttons);
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.FABButton = FABButton;
}

console.log('FABButton component loaded');
