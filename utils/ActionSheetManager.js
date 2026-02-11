/**
 * ActionSheetManager - Utility for displaying action sheets
 * Provides consistent action sheet dialogs throughout the application
 */
class ActionSheetManager {
  /**
   * Show an action sheet
   * @param {string} header - Action sheet header
   * @param {Array<Object>} buttons - Array of button configurations
   * @returns {Promise<void>}
   */
  static async show(header, buttons) {
    const actionSheet = document.createElement('ion-action-sheet');
    actionSheet.header = header;
    actionSheet.buttons = buttons;
    
    document.body.appendChild(actionSheet);
    await actionSheet.present();
    
    // Clean up after action sheet is dismissed
    actionSheet.addEventListener('didDismiss', () => {
      actionSheet.remove();
    });
  }

  /**
   * Show a confirmation action sheet
   * @param {string} header - Confirmation header
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Callback when confirmed
   * @param {Function} onCancel - Callback when cancelled (optional)
   * @returns {Promise<void>}
   */
  static async showConfirmation(header, message, onConfirm, onCancel = null) {
    const buttons = [
      {
        text: 'Confirmar',
        role: 'destructive',
        handler: onConfirm
      },
      {
        text: 'Cancelar',
        role: 'cancel',
        handler: onCancel || (() => {})
      }
    ];

    await this.show(header, buttons);
  }

  /**
   * Show a delete confirmation action sheet
   * @param {string} itemName - Name of item to delete
   * @param {Function} onConfirm - Callback when confirmed
   * @returns {Promise<void>}
   */
  static async showDeleteConfirmation(itemName, onConfirm) {
    await this.showConfirmation(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar ${itemName}?`,
      onConfirm
    );
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ActionSheetManager;
}
