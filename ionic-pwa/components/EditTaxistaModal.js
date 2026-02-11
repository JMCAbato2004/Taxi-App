/**
 * EditTaxistaModal Component
 * Allows editing taxista information
 */

class EditTaxistaModal {
  constructor(authAdapter, taxistaId) {
    this.authAdapter = authAdapter;
    this.taxistaId = taxistaId;
  }

  /**
   * Show edit taxista modal
   */
  async show() {
    const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
    const taxista = users.find(u => u.id === this.taxistaId);
    
    if (!taxista) {
      ToastManager.showError('Taxista no encontrado');
      return;
    }

    const modal = await this.createModal(taxista);
    await modal.present();
  }

  /**
   * Create modal element
   */
  async createModal(taxista) {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Editar Taxista</ion-title>
          <ion-buttons slot="end">
            <ion-button onclick="this.closest('ion-modal').dismiss()">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <form id="edit-taxista-form">
          <!-- Name -->
          <ion-item>
            <ion-label position="stacked">Nombre Completo *</ion-label>
            <ion-input 
              type="text" 
              id="edit-taxista-nombre" 
              value="${taxista.nombre}"
              required
              placeholder="Nombre del taxista">
            </ion-input>
          </ion-item>

          <!-- Email -->
          <ion-item>
            <ion-label position="stacked">Email *</ion-label>
            <ion-input 
              type="email" 
              id="edit-taxista-email" 
              value="${taxista.email}"
              required
              placeholder="correo@ejemplo.com">
            </ion-input>
          </ion-item>

          <!-- Phone -->
          <ion-item>
            <ion-label position="stacked">Teléfono</ion-label>
            <ion-input 
              type="tel" 
              id="edit-taxista-telefono" 
              value="${taxista.telefono || ''}"
              placeholder="+34 600 000 000">
            </ion-input>
          </ion-item>

          <!-- Taxi Number (readonly) -->
          <ion-item>
            <ion-label position="stacked">Número de Taxista</ion-label>
            <ion-input 
              type="text" 
              id="edit-taxista-numero" 
              value="${taxista.numeroTaxista}"
              readonly
              disabled>
            </ion-input>
          </ion-item>
          
          <ion-note color="medium" style="display: block; margin-top: 8px; font-size: 12px;">
            El número de taxista no se puede modificar
          </ion-note>

          <!-- Buttons -->
          <div style="margin-top: 24px; display: flex; gap: 8px;">
            <ion-button expand="block" type="submit" color="primary" style="flex: 1;">
              <ion-icon name="save" slot="start"></ion-icon>
              Guardar Cambios
            </ion-button>
            <ion-button expand="block" fill="outline" onclick="this.closest('ion-modal').dismiss()" style="flex: 1;">
              Cancelar
            </ion-button>
          </div>
        </form>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.componentOnReady();

    // Set up form submission
    const form = modal.querySelector('#edit-taxista-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(modal);
    });

    return modal;
  }

  /**
   * Handle form submission
   */
  async handleSubmit(modal) {
    try {
      await LoadingManager.show('Guardando cambios...');

      // Get form values
      const nombre = modal.querySelector('#edit-taxista-nombre').value.trim();
      const email = modal.querySelector('#edit-taxista-email').value.trim();
      const telefono = modal.querySelector('#edit-taxista-telefono').value.trim();

      // Validate
      if (!nombre || !email) {
        await LoadingManager.hide();
        ToastManager.showError('Nombre y email son obligatorios');
        return;
      }

      // Update taxista
      const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
      const taxistaIndex = users.findIndex(u => u.id === this.taxistaId);
      
      if (taxistaIndex === -1) {
        await LoadingManager.hide();
        ToastManager.showError('Taxista no encontrado');
        return;
      }

      // Update fields
      users[taxistaIndex].nombre = nombre;
      users[taxistaIndex].email = email;
      users[taxistaIndex].telefono = telefono;

      // Save changes
      localStorage.setItem('taxi_users', JSON.stringify(users));

      await LoadingManager.hide();
      ToastManager.showSuccess('Información actualizada');

      // Dispatch event to refresh fleet management
      window.dispatchEvent(new CustomEvent('taxista-updated'));

      // Close modal
      await modal.dismiss();
    } catch (error) {
      await LoadingManager.hide();
      console.error('Error updating taxista:', error);
      ToastManager.showError('Error al actualizar información');
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.EditTaxistaModal = EditTaxistaModal;
}

console.log('EditTaxistaModal component loaded');
