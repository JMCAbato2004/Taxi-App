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
    // Use the global FAB action sheet from app.js if available
    if (window.app && typeof window.app.showFabActionSheet === 'function') {
      // Call the app's FAB action sheet which has all the proper handlers
      const fabActionSheet = window.app.showFabActionSheet || window.showFabActionSheet;
      if (fabActionSheet) {
        await fabActionSheet();
        return;
      }
    }
    
    // Fallback to local action sheet
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

    const buttons = [];

    // Agregar opciones de fichaje si WorkShiftAdapter está disponible
    if (window.workShiftAdapter) {
      const activeShift = await window.workShiftAdapter.getActiveShift();
      
      if (!activeShift) {
        // No hay jornada activa - mostrar opción de iniciar
        buttons.push({
          text: 'Iniciar Jornada',
          icon: 'play',
          handler: () => this.handleStartShift()
        });
      } else if (activeShift.status === 'active') {
        // Jornada activa - mostrar pausar y finalizar
        buttons.push({
          text: 'Pausar Jornada',
          icon: 'pause',
          handler: () => this.handlePauseShift()
        });
        buttons.push({
          text: 'Finalizar Jornada',
          icon: 'stop',
          handler: () => this.handleEndShift()
        });
      } else if (activeShift.status === 'paused') {
        // Jornada pausada - mostrar reanudar y finalizar
        buttons.push({
          text: 'Reanudar Jornada',
          icon: 'play',
          handler: () => this.handleResumeShift()
        });
        buttons.push({
          text: 'Finalizar Jornada',
          icon: 'stop',
          handler: () => this.handleEndShift()
        });
      }
    }

    // Agregar opciones estándar
    buttons.push({
      text: 'Nuevo Servicio',
      icon: 'car',
      handler: () => this.handleNewService()
    });
    buttons.push({
      text: 'Nuevo Gasto',
      icon: 'wallet',
      handler: () => this.handleNewExpense()
    });
    buttons.push({
      text: 'Ver Reportes',
      icon: 'bar-chart',
      handler: () => this.handleViewReports()
    });
    buttons.push({
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    });

    await ActionSheetManager.show('Acciones Rápidas', buttons);
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
   * Handle start shift action
   */
  async handleStartShift() {
    try {
      if (!window.workShiftAdapter) {
        console.error('FABButton: WorkShiftAdapter not available');
        return;
      }

      if (window.LoadingManager) {
        window.LoadingManager.show('Iniciando jornada...');
      }

      await window.workShiftAdapter.startShift();

      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Jornada iniciada correctamente');
      }
    } catch (error) {
      console.error('Error starting shift:', error);
      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }
      if (window.ToastManager) {
        window.ToastManager.showError(error.message);
      }
    }
  }

  /**
   * Handle pause shift action
   */
  async handlePauseShift() {
    try {
      if (!window.workShiftAdapter) {
        console.error('FABButton: WorkShiftAdapter not available');
        return;
      }

      const activeShift = await window.workShiftAdapter.getActiveShift();
      if (!activeShift) return;

      if (window.LoadingManager) {
        window.LoadingManager.show('Pausando jornada...');
      }

      await window.workShiftAdapter.pauseShift(activeShift.id);

      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Jornada pausada');
      }
    } catch (error) {
      console.error('Error pausing shift:', error);
      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }
      if (window.ToastManager) {
        window.ToastManager.showError(error.message);
      }
    }
  }

  /**
   * Handle resume shift action
   */
  async handleResumeShift() {
    try {
      if (!window.workShiftAdapter) {
        console.error('FABButton: WorkShiftAdapter not available');
        return;
      }

      const activeShift = await window.workShiftAdapter.getActiveShift();
      if (!activeShift) return;

      if (window.LoadingManager) {
        window.LoadingManager.show('Reanudando jornada...');
      }

      await window.workShiftAdapter.resumeShift(activeShift.id);

      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Jornada reanudada');
      }
    } catch (error) {
      console.error('Error resuming shift:', error);
      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }
      if (window.ToastManager) {
        window.ToastManager.showError(error.message);
      }
    }
  }

  /**
   * Handle end shift action
   */
  async handleEndShift() {
    try {
      if (!window.workShiftAdapter) {
        console.error('FABButton: WorkShiftAdapter not available');
        return;
      }

      const activeShift = await window.workShiftAdapter.getActiveShift();
      if (!activeShift) return;

      // Confirmar con el usuario usando AlertManager
      if (window.AlertManager) {
        const confirmed = await window.AlertManager.confirm(
          'Finalizar Jornada',
          '¿Estás seguro de que quieres finalizar la jornada?'
        );

        if (!confirmed) return;
      }

      if (window.LoadingManager) {
        window.LoadingManager.show('Finalizando jornada...');
      }

      await window.workShiftAdapter.endShift(activeShift.id);

      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }

      if (window.ToastManager) {
        window.ToastManager.showSuccess('Jornada finalizada correctamente');
      }
    } catch (error) {
      console.error('Error ending shift:', error);
      if (window.LoadingManager) {
        window.LoadingManager.hide();
      }
      if (window.ToastManager) {
        window.ToastManager.showError(error.message);
      }
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
