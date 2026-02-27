/**
 * ToastManager - Utility for displaying toast notifications
 * Provides consistent toast notifications throughout the application
 */
class ToastManager {
  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} color - Ionic color (primary, success, warning, danger)
   * @param {number} duration - Duration in milliseconds (default: 2000)
   * @returns {Promise<void>}
   */
  static async show(message, color = 'primary', duration = 2000) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = duration;
    toast.color = color;
    toast.position = 'top'; // Changed from 'bottom' to avoid blocking tab bar
    toast.cssClass = 'custom-toast';
    
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
    await this.show(message, 'success', 2000);
  }

  /**
   * Show an error toast
   * @param {string} message - Error message
   * @returns {Promise<void>}
   */
  static async showError(message) {
    await this.show(message, 'danger', 3000);
  }

  /**
   * Show a warning toast
   * @param {string} message - Warning message
   * @returns {Promise<void>}
   */
  static async showWarning(message) {
    await this.show(message, 'warning', 2500);
  }

  /**
   * Show an info toast
   * @param {string} message - Info message
   * @returns {Promise<void>}
   */
  static async showInfo(message) {
    await this.show(message, 'primary', 2000);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastManager;
}
