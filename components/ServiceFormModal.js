/**
 * ServiceFormModal Component
 * Modal for creating and editing services
 */

class ServiceFormModal {
  constructor(reconcileAdapter, service = null) {
    this.reconcileAdapter = reconcileAdapter;
    this.service = service; // null for create, object for edit
    this.modal = null;
    this.isEditMode = !!service;
  }

  /**
   * Show the modal
   */
  async show() {
    // Create modal element
    this.modal = document.createElement('ion-modal');
    this.modal.innerHTML = this.getModalContent();
    
    document.body.appendChild(this.modal);
    
    // Wait for modal to be ready
    await this.modal.componentOnReady();
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Pre-fill form if editing
    if (this.isEditMode) {
      this.prefillForm();
    }
    
    // Present modal
    await this.modal.present();
  }

  /**
   * Get modal content HTML
   */
  getModalContent() {
    const title = this.isEditMode ? 'Editar Servicio' : 'Nuevo Servicio';
    const submitText = this.isEditMode ? 'Guardar' : 'Crear';

    return `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>${title}</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-service-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <form id="service-form">
          <!-- Información del Servicio -->
          <ion-list-header>
            <ion-label>Información del Servicio</ion-label>
          </ion-list-header>

          <!-- Date -->
          <ion-item>
            <ion-label position="stacked">Fecha *</ion-label>
            <ion-input 
              type="date" 
              id="service-date" 
              required
              value="${new Date().toISOString().split('T')[0]}">
            </ion-input>
          </ion-item>
          <div class="error-message" id="date-error"></div>

          <!-- Time -->
          <ion-item>
            <ion-label position="stacked">Hora *</ion-label>
            <ion-input 
              type="time" 
              id="service-time"
              required
              value="${new Date().toTimeString().slice(0,5)}">
            </ion-input>
          </ion-item>

          <!-- Origin and Destination -->
          <ion-item>
            <ion-label position="stacked">Origen (Opcional)</ion-label>
            <ion-input 
              type="text" 
              id="service-origin" 
              placeholder="Dirección de origen">
            </ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Destino (Opcional)</ion-label>
            <ion-input 
              type="text" 
              id="service-destination" 
              placeholder="Dirección de destino">
            </ion-input>
          </ion-item>

          <!-- Service Source -->
          <ion-item>
            <ion-label position="stacked">Origen del Servicio *</ion-label>
            <ion-select id="service-source" value="emisora" interface="action-sheet">
              <ion-select-option value="emisora">📻 Emisora</ion-select-option>
              <ion-select-option value="calle">🚶 Calle</ion-select-option>
              <ion-select-option value="uber">🚗 Uber</ion-select-option>
              <ion-select-option value="freenow">🚕 FreeNow</ion-select-option>
              <ion-select-option value="otro">📋 Otro</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Amounts -->
          <ion-list-header style="margin-top: 16px;">
            <ion-label>Importes</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-label position="stacked">Importe del Servicio *</ion-label>
            <ion-input 
              type="number" 
              id="service-amount" 
              placeholder="0.00"
              step="0.01"
              min="0"
              required>
            </ion-input>
          </ion-item>
          <div class="error-message" id="amount-error"></div>

          <ion-item>
            <ion-label position="stacked">Comisión (Opcional)</ion-label>
            <ion-input 
              type="number" 
              id="service-commission" 
              placeholder="0.00"
              step="0.01"
              min="0">
            </ion-input>
          </ion-item>
          <p style="font-size: 12px; color: var(--ion-color-medium); padding: 0 16px; margin-top: -8px;">
            Comisión de la plataforma
          </p>

          <ion-item>
            <ion-label position="stacked">Propina (Opcional)</ion-label>
            <ion-input 
              type="number" 
              id="service-tip" 
              placeholder="0.00"
              step="0.01"
              min="0">
            </ion-input>
          </ion-item>
          <p style="font-size: 12px; color: var(--ion-color-medium); padding: 0 16px; margin-top: -8px;">
            Propina del cliente
          </p>

          <!-- Net Amount Preview -->
          <ion-card style="margin: 16px 0; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%); border: 2px solid var(--ion-color-success);">
            <ion-card-content style="padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: var(--ion-text-color);">Importe Neto</p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: var(--ion-text-color); opacity: 0.8;">
                    Base <span id="preview-base" style="font-weight: 600;">€0.00</span>
                    <span id="preview-commission-text" style="display: none;"> - Comisión <span id="preview-commission" style="font-weight: 600;">€0.00</span></span>
                    <span id="preview-tip-text" style="display: none;"> + Propina <span id="preview-tip" style="font-weight: 600;">€0.00</span></span>
                  </p>
                </div>
                <div style="font-size: 26px; font-weight: bold; color: var(--ion-color-success);" id="preview-net">
                  €0.00
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Client Information -->
          <ion-list-header style="margin-top: 16px;">
            <ion-label>Información del Cliente (Opcional)</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-label position="stacked">Nombre del Cliente</ion-label>
            <ion-input 
              type="text" 
              id="service-client-name" 
              placeholder="Juan Pérez">
            </ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Teléfono</ion-label>
            <ion-input 
              type="tel" 
              id="service-client-phone" 
              placeholder="+34 666 123 456">
            </ion-input>
          </ion-item>

          <!-- Payment Method -->
          <ion-list-header style="margin-top: 16px;">
            <ion-label>Método de Pago</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-label position="stacked">Método de Pago *</ion-label>
            <ion-select id="service-payment-method" value="efectivo" interface="action-sheet">
              <ion-select-option value="efectivo">💵 Efectivo</ion-select-option>
              <ion-select-option value="tarjeta">💳 Tarjeta</ion-select-option>
              <ion-select-option value="transferencia">🏦 Transferencia</ion-select-option>
              <ion-select-option value="app">📱 App</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Notes -->
          <ion-item>
            <ion-label position="stacked">Notas Adicionales</ion-label>
            <ion-textarea 
              id="service-notes" 
              rows="3"
              placeholder="Información adicional sobre el servicio...">
            </ion-textarea>
          </ion-item>

          <!-- Submit Button -->
          <ion-button 
            expand="block" 
            type="submit" 
            id="submit-service-btn"
            style="margin-top: 20px;">
            ${submitText}
          </ion-button>
        </form>
      </ion-content>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    document.getElementById('close-service-modal')?.addEventListener('click', () => {
      this.close();
    });

    // Form submission
    const form = document.getElementById('service-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Real-time validation
    document.getElementById('service-date')?.addEventListener('ionChange', () => {
      this.clearError('date-error');
    });

    document.getElementById('service-amount')?.addEventListener('ionInput', () => {
      this.clearError('amount-error');
      this.updateNetAmountPreview();
    });

    // Auto-calculation listeners
    document.getElementById('service-commission')?.addEventListener('ionInput', () => {
      this.updateNetAmountPreview();
    });

    document.getElementById('service-tip')?.addEventListener('ionInput', () => {
      this.updateNetAmountPreview();
    });

    // Initial preview update
    this.updateNetAmountPreview();
  }

  /**
   * Update net amount preview in real-time
   */
  updateNetAmountPreview() {
    const amount = parseFloat(document.getElementById('service-amount')?.value) || 0;
    const commission = parseFloat(document.getElementById('service-commission')?.value) || 0;
    const tip = parseFloat(document.getElementById('service-tip')?.value) || 0;

    const netAmount = amount + tip - commission;

    // Update preview elements
    document.getElementById('preview-base').textContent = '€' + amount.toFixed(2);
    document.getElementById('preview-commission').textContent = '€' + commission.toFixed(2);
    document.getElementById('preview-tip').textContent = '€' + tip.toFixed(2);
    document.getElementById('preview-net').textContent = '€' + netAmount.toFixed(2);

    // Show/hide commission and tip text
    const commissionText = document.getElementById('preview-commission-text');
    const tipText = document.getElementById('preview-tip-text');

    if (commission > 0) {
      commissionText.style.display = 'inline';
    } else {
      commissionText.style.display = 'none';
    }

    if (tip > 0) {
      tipText.style.display = 'inline';
    } else {
      tipText.style.display = 'none';
    }
  }

  /**
   * Pre-fill form with service data (edit mode)
   */
  prefillForm() {
    if (!this.service) return;

    document.getElementById('service-date').value = this.service.date || '';
    document.getElementById('service-time').value = this.service.time || '';
    document.getElementById('service-origin').value = this.service.origin || '';
    document.getElementById('service-destination').value = this.service.destination || '';
    document.getElementById('service-source').value = this.service.serviceSource || 'emisora';
    document.getElementById('service-amount').value = this.service.amount || '';
    document.getElementById('service-commission').value = this.service.commission || '';
    document.getElementById('service-tip').value = this.service.tip || '';
    document.getElementById('service-client-name').value = this.service.clientName || '';
    document.getElementById('service-client-phone').value = this.service.clientPhone || '';
    document.getElementById('service-payment-method').value = this.service.paymentMethod || 'efectivo';
    document.getElementById('service-notes').value = this.service.notes || '';

    // Update preview after prefilling
    this.updateNetAmountPreview();
  }

  /**
   * Validate form
   */
  validateForm() {
    let isValid = true;

    // Validate date
    const date = document.getElementById('service-date').value;
    if (!date) {
      this.showError('date-error', 'La fecha es obligatoria');
      isValid = false;
    }

    // Validate amount
    const amount = parseFloat(document.getElementById('service-amount').value);
    if (!amount || amount <= 0) {
      this.showError('amount-error', 'El importe debe ser mayor que 0');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Show error message
   */
  showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Clear error message
   */
  clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    // Validate form
    if (!this.validateForm()) {
      ToastManager.showError('Por favor, corrige los errores del formulario');
      return;
    }

    // Collect form data
    const amount = parseFloat(document.getElementById('service-amount').value) || 0;
    const commission = parseFloat(document.getElementById('service-commission').value) || 0;
    const tip = parseFloat(document.getElementById('service-tip').value) || 0;
    const netAmount = amount + tip - commission;

    const serviceData = {
      date: document.getElementById('service-date').value,
      time: document.getElementById('service-time').value,
      origin: document.getElementById('service-origin').value || 'No especificado',
      destination: document.getElementById('service-destination').value || 'No especificado',
      serviceSource: document.getElementById('service-source').value,
      amount: amount,
      commission: commission,
      tip: tip,
      netAmount: netAmount,
      totalAmount: netAmount, // For compatibility
      clientName: document.getElementById('service-client-name').value,
      clientPhone: document.getElementById('service-client-phone').value,
      paymentMethod: document.getElementById('service-payment-method').value,
      notes: document.getElementById('service-notes').value,
      status: 'completado'
    };

    try {
      await LoadingManager.show(this.isEditMode ? 'Guardando cambios...' : 'Creando servicio...');

      if (this.isEditMode) {
        await this.reconcileAdapter.updateService(this.service.id, serviceData);
        ToastManager.showSuccess(`Servicio actualizado • €${netAmount.toFixed(2)}`);
      } else {
        await this.reconcileAdapter.createService(serviceData);
        ToastManager.showSuccess(`Servicio creado • €${netAmount.toFixed(2)}`);
      }

      await LoadingManager.hide();

      // Dispatch event to refresh service list
      window.dispatchEvent(new CustomEvent('service-saved'));

      // Close modal
      await this.close();
    } catch (error) {
      await LoadingManager.hide();
      console.error('Error saving service:', error);
      ToastManager.showError('Error al guardar el servicio. Inténtalo de nuevo.');
    }
  }

  /**
   * Close the modal
   */
  async close() {
    if (this.modal) {
      await this.modal.dismiss();
      this.modal.remove();
    }
  }
}

// Export for use in other modules
window.ServiceFormModal = ServiceFormModal;

console.log('ServiceFormModal component loaded');
