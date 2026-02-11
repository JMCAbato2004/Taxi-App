/**
 * RGPDAdapter - Integration layer between Ionic UI and existing RGPD system
 * Connects the Ionic PWA interface to the RGPD compliance manager
 */
class RGPDAdapter {
  constructor() {
    // Will be initialized with actual RGPD manager when integrated
    this.rgpdManager = null;
  }

  /**
   * Initialize the adapter with RGPD manager
   * @param {Object} rgpdManager - RGPD manager instance
   */
  initialize(rgpdManager) {
    this.rgpdManager = rgpdManager;
  }

  /**
   * Show consent dialog
   * @returns {Promise<void>}
   */
  async showConsentDialog() {
    try {
      if (this.rgpdManager) {
        this.rgpdManager.showConsentBanner();
      } else {
        // Fallback if RGPD manager not initialized
        console.warn('RGPD Manager not initialized');
      }
    } catch (error) {
      console.error('Show consent dialog error:', error);
      throw new Error('Error al mostrar el diálogo de consentimiento');
    }
  }

  /**
   * Export user data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Exported data
   */
  async exportUserData(userId) {
    try {
      if (this.rgpdManager) {
        return this.rgpdManager.exportUserData(userId);
      } else {
        // Fallback implementation
        const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
        const user = users.find(u => u.id === userId);

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
        const userServices = services.filter(s => s.userId === userId);

        const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
        const userExpenses = expenses.filter(e => e.userId === userId);

        return {
          exportDate: new Date().toISOString(),
          user: {
            ...user,
            password: '[REDACTED]'
          },
          services: userServices,
          expenses: userExpenses
        };
      }
    } catch (error) {
      console.error('Export user data error:', error);
      throw new Error('Error al exportar los datos: ' + error.message);
    }
  }

  /**
   * Delete user data
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUserData(userId) {
    try {
      if (this.rgpdManager) {
        return this.rgpdManager.deleteAllUserData(userId);
      } else {
        // Fallback implementation
        // Remove user
        const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
        const filteredUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('taxi_users', JSON.stringify(filteredUsers));

        // Remove services
        const services = JSON.parse(localStorage.getItem('taxi_services') || '[]');
        const filteredServices = services.filter(s => s.userId !== userId);
        localStorage.setItem('taxi_services', JSON.stringify(filteredServices));

        // Remove expenses
        const expenses = JSON.parse(localStorage.getItem('taxi_expenses') || '[]');
        const filteredExpenses = expenses.filter(e => e.userId !== userId);
        localStorage.setItem('taxi_expenses', JSON.stringify(filteredExpenses));

        // Clear current user if it's the deleted user
        const currentUser = JSON.parse(localStorage.getItem('taxi_auth_current_user') || 'null');
        if (currentUser && currentUser.id === userId) {
          localStorage.removeItem('taxi_auth_current_user');
        }

        return true;
      }
    } catch (error) {
      console.error('Delete user data error:', error);
      throw new Error('Error al eliminar los datos: ' + error.message);
    }
  }

  /**
   * Get privacy policy
   * @returns {Promise<string>} Privacy policy URL or content
   */
  async getPrivacyPolicy() {
    return 'politica-privacidad.html';
  }

  /**
   * Get terms and conditions
   * @returns {Promise<string>} Terms and conditions URL or content
   */
  async getTermsAndConditions() {
    return 'terminos-condiciones.html';
  }

  /**
   * Get consent status
   * @returns {Object|null} Consent object or null
   */
  getConsent() {
    if (this.rgpdManager) {
      return this.rgpdManager.getConsent();
    } else {
      const stored = localStorage.getItem('taxi_rgpd_consent');
      return stored ? JSON.parse(stored) : null;
    }
  }

  /**
   * Grant consent
   * @returns {void}
   */
  grantConsent() {
    if (this.rgpdManager) {
      this.rgpdManager.grantConsent();
    } else {
      // Fallback implementation
      const consent = {
        accepted: true,
        date: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('taxi_rgpd_consent', JSON.stringify(consent));
    }
  }

  /**
   * Revoke consent
   * @returns {void}
   */
  revokeConsent() {
    if (this.rgpdManager) {
      this.rgpdManager.revokeConsent();
    } else {
      // Fallback implementation
      localStorage.removeItem('taxi_rgpd_consent');
    }
  }

  /**
   * Show privacy settings
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async showPrivacySettings(userId) {
    try {
      if (this.rgpdManager) {
        this.rgpdManager.showPrivacySettings(userId);
      } else {
        console.warn('RGPD Manager not initialized');
        // Could show a basic Ionic modal here as fallback
      }
    } catch (error) {
      console.error('Show privacy settings error:', error);
      throw new Error('Error al mostrar la configuración de privacidad');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RGPDAdapter;
}
