/**
 * ToastManager - Utility for displaying toast notifications
 * Provides consistent toast notifications throughout the application
 */
class ToastManager {
  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {number} duration - Duration in milliseconds (default: 2000)
   * @param {string} color - Ionic color (primary, success, warning, danger)
   * @returns {Promise<void>}
   */
  static async show(message, duration = 2000, color = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = duration;
    toast.color = color;
    toast.position = 'bottom';
    
    document.body.appendChild(toast);
    await toast.present();
    
    // Clean up after toast is dismissed
    toast.addEventListener('didDismiss', () => {
      toast.remove();
    });
  }

  /**
   * Show a success toast
   * @param {string} message - Success message
   * @returns {Promise<void>}
   */
  static async showSuccess(message) {
    await this.show(message, 2000, 'success');
  }

  /**
   * Show an error toast
   * @param {string} message - Error message
   * @returns {Promise<void>}
   */
  static async showError(message) {
    await this.show(message, 3000, 'danger');
  }

  /**
   * Show a warning toast
   * @param {string} message - Warning message
   * @returns {Promise<void>}
   */
  static async showWarning(message) {
    await this.show(message, 2500, 'warning');
  }

  /**
   * Show an info toast
   * @param {string} message - Info message
   * @returns {Promise<void>}
   */
  static async showInfo(message) {
    await this.show(message, 2000, 'primary');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastManager;
}
