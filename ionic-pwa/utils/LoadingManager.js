/**
 * LoadingManager - Utility for displaying loading indicators
 * Manages loading overlays during async operations
 */
class LoadingManager {
  static currentLoading = null;

  /**
   * Show a loading indicator
   * @param {string} message - Loading message (default: 'Cargando...')
   * @returns {Promise<void>}
   */
  static async show(message = 'Cargando...') {
    // Dismiss any existing loading indicator first
    if (this.currentLoading) {
      await this.hide();
    }

    this.currentLoading = document.createElement('ion-loading');
    this.currentLoading.message = message;
    this.currentLoading.spinner = 'crescent';
    
    document.body.appendChild(this.currentLoading);
    await this.currentLoading.present();
  }

  /**
   * Hide the current loading indicator
   * @returns {Promise<void>}
   */
  static async hide() {
    if (this.currentLoading) {
      try {
        await this.currentLoading.dismiss();
        this.currentLoading.remove();
      } catch (error) {
        // Ignore errors if loading was already dismissed
        console.debug('Loading already dismissed:', error);
      } finally {
        this.currentLoading = null;
      }
    }
  }

  /**
   * Check if a loading indicator is currently shown
   * @returns {boolean}
   */
  static isShowing() {
    return this.currentLoading !== null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingManager;
}
