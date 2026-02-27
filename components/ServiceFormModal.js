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
    const submitText = this.isEditMode ? 'Guardar Cambios' : 'Crear Servicio';

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
        <style>
          /* Estilos para inputs más grandes y ergonómicos */
          #service-form ion-item {
            --min-height: 60px;
            margin-bottom: 12px;
          }
          
          #service-form ion-input,
          #service-form ion-select,
          #service-form ion-textarea {
            --padding-top: 12px;
            --padding-bottom: 12px;
            font-size: 16px !important;
          }
          
          #service-form ion-label {
            font-size: 14px !important;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          #service-form ion-textarea {
            --padding-top: 16px;
            --padding-bottom: 16px;
            min-height: 100px;
          }
          
          #service-form ion-list-header {
            font-size: 16px;
            font-weight: 700;
            padding-top: 8px;
            padding-bottom: 8px;
          }
          
          /* Geolocation button styles */
          .destination-container {
            display: flex;
            gap: 8px;
            align-items: flex-end;
          }
          
          .destination-input-wrapper {
            flex: 1;
          }
          
          #geolocate-btn {
            height: 56px;
            width: 56px;
            margin: 0;
            --padding-start: 0;
            --padding-end: 0;
          }
        </style>
        
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

          <!-- Destination with Geolocation -->
          <div class="destination-container" style="margin-bottom: 12px;">
            <div class="destination-input-wrapper">
              <ion-item>
                <ion-label position="stacked">Destino (Opcional)</ion-label>
                <ion-input 
                  type="text" 
                  id="service-destination" 
                  placeholder="Dirección de destino">
                </ion-input>
              </ion-item>
            </div>
            <ion-button 
              id="geolocate-btn" 
              fill="solid" 
              color="primary"
              title="Capturar ubicación actual">
              <ion-icon slot="icon-only" name="location"></ion-icon>
            </ion-button>
          </div>

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

          <ion-item style="--min-height: 80px;">
            <ion-label position="stacked" style="font-size: 16px; margin-bottom: 8px;">Importe del Servicio *</ion-label>
            <ion-input 
              type="text" 
              id="service-amount" 
              placeholder="0,00"
              readonly
              required
              style="font-size: 28px; font-weight: 600; color: var(--ion-color-primary); cursor: pointer;">
            </ion-input>
            <div slot="end" style="font-size: 24px; color: var(--ion-color-medium); margin-left: 8px;">€</div>
          </ion-item>
          <p style="font-size: 13px; color: var(--ion-color-medium); padding: 0 16px; margin-top: -8px; margin-bottom: 16px;">
            💡 Pulsa para abrir el teclado numérico
          </p>
          <div class="error-message" id="amount-error"></div>

          <ion-item style="--min-height: 70px;">
            <ion-label position="stacked" style="font-size: 15px;">Comisión (Opcional)</ion-label>
            <ion-input 
              type="text" 
              id="service-commission" 
              placeholder="0,00"
              readonly
              style="font-size: 22px; font-weight: 500; cursor: pointer;">
            </ion-input>
            <div slot="end" style="font-size: 20px; color: var(--ion-color-medium);">€</div>
          </ion-item>
          <p style="font-size: 13px; color: var(--ion-color-medium); padding: 0 16px; margin-top: -8px; margin-bottom: 16px;">
            Comisión de la plataforma
          </p>

          <ion-item style="--min-height: 70px;">
            <ion-label position="stacked" style="font-size: 15px;">Propina (Opcional)</ion-label>
            <ion-input 
              type="text" 
              id="service-tip" 
              placeholder="0,00"
              readonly
              style="font-size: 22px; font-weight: 500; cursor: pointer;">
            </ion-input>
            <div slot="end" style="font-size: 20px; color: var(--ion-color-medium);">€</div>
          </ion-item>
          <p style="font-size: 13px; color: var(--ion-color-medium); padding: 0 16px; margin-top: -8px; margin-bottom: 16px;">
            Propina del cliente
          </p>

          <!-- Net Amount Preview -->
          <ion-card style="margin: 16px 0; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%); border: 2px solid var(--ion-color-success);">
            <ion-card-content style="padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; font-size: 15px; font-weight: 600; color: var(--ion-text-color);">Importe Neto</p>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: var(--ion-text-color); opacity: 0.8;">
                    Base <span id="preview-base" style="font-weight: 600;">€0.00</span>
                    <span id="preview-commission-text" style="display: none;"> - Comisión <span id="preview-commission" style="font-weight: 600;">€0.00</span></span>
                    <span id="preview-tip-text" style="display: none;"> + Propina <span id="preview-tip" style="font-weight: 600;">€0.00</span></span>
                  </p>
                </div>
                <div style="font-size: 28px; font-weight: bold; color: var(--ion-color-success);" id="preview-net">
                  €0.00
                </div>
              </div>
            </ion-card-content>
          </ion-card>

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
              rows="4"
              placeholder="Información adicional sobre el servicio...">
            </ion-textarea>
          </ion-item>

          <!-- Action Buttons - Ergonomic Design -->
          <div style="display: flex; gap: 12px; margin-top: 24px; padding-bottom: 16px;">
            <ion-button 
              id="cancel-service-btn"
              expand="block" 
              fill="outline"
              color="medium"
              style="flex: 1; height: 56px; font-size: 16px; font-weight: 600;">
              <ion-icon name="close-circle-outline" slot="start"></ion-icon>
              Cancelar
            </ion-button>
            <ion-button 
              expand="block" 
              type="submit" 
              id="submit-service-btn"
              color="success"
              style="flex: 2; height: 56px; font-size: 16px; font-weight: 600;">
              <ion-icon name="checkmark-circle" slot="start"></ion-icon>
              ${submitText}
            </ion-button>
          </div>
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

    // Cancel button
    document.getElementById('cancel-service-btn')?.addEventListener('click', () => {
      this.close();
    });

    // Geolocation button
    document.getElementById('geolocate-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.captureLocation();
    });

    // Initialize numeric keyboards for money inputs
    this.initializeNumericKeyboards();

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
   * Initialize numeric keyboards for money inputs
   */
  initializeNumericKeyboards() {
    // Amount keyboard
    const amountInput = document.getElementById('service-amount');
    if (amountInput) {
      this.amountKeyboard = new NumericKeyboard(amountInput, () => {
        this.updateNetAmountPreview();
      });
      
      amountInput.addEventListener('click', () => {
        this.amountKeyboard.show();
      });
    }

    // Commission keyboard
    const commissionInput = document.getElementById('service-commission');
    if (commissionInput) {
      this.commissionKeyboard = new NumericKeyboard(commissionInput, () => {
        this.updateNetAmountPreview();
      });
      
      commissionInput.addEventListener('click', () => {
        this.commissionKeyboard.show();
      });
    }

    // Tip keyboard
    const tipInput = document.getElementById('service-tip');
    if (tipInput) {
      this.tipKeyboard = new NumericKeyboard(tipInput, () => {
        this.updateNetAmountPreview();
      });
      
      tipInput.addEventListener('click', () => {
        this.tipKeyboard.show();
      });
    }
  }

  /**
   * Capture current location and reverse geocode to address
   */
  async captureLocation() {
    const geoBtn = document.getElementById('geolocate-btn');
    const destinationInput = document.getElementById('service-destination');
    
    if (!navigator.geolocation) {
      ToastManager.showError('Geolocalización no disponible en este dispositivo');
      return;
    }

    try {
      // Show loading state
      geoBtn.disabled = true;
      const originalIcon = geoBtn.querySelector('ion-icon');
      originalIcon.name = 'hourglass-outline';
      
      ToastManager.show('Obteniendo ubicación...', 'primary');

      // Get current position with more permissive settings for localhost
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Less strict for localhost
          timeout: 15000,
          maximumAge: 60000 // Accept cached location up to 1 minute old
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      console.log('Location captured:', latitude, longitude, 'accuracy:', accuracy);

      // Try to reverse geocode using Nominatim (OpenStreetMap)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'TaxiApp/1.0'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          // Set the address in the input
          destinationInput.value = address;
          
          // Store coordinates as data attributes for future use
          destinationInput.setAttribute('data-lat', latitude);
          destinationInput.setAttribute('data-lon', longitude);
          
          ToastManager.showSuccess(`Ubicación capturada (±${Math.round(accuracy)}m)`);
        } else {
          throw new Error('Geocoding failed');
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed, using coordinates:', geocodeError);
        // Fallback: just use coordinates
        destinationInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        destinationInput.setAttribute('data-lat', latitude);
        destinationInput.setAttribute('data-lon', longitude);
        ToastManager.showSuccess('Coordenadas capturadas');
      }

    } catch (error) {
      console.error('Geolocation error:', error);
      
      let errorMessage = 'Error al obtener ubicación';
      let showManualOption = false;
      
      if (error.code === 1) {
        errorMessage = 'Permiso de ubicación denegado. Activa los permisos en tu navegador.';
      } else if (error.code === 2) {
        // Position unavailable - common in localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          errorMessage = 'Ubicación no disponible en localhost. Prueba en un dispositivo móvil o escribe la dirección manualmente.';
        } else {
          errorMessage = 'No se pudo determinar tu ubicación. Verifica tu conexión GPS/WiFi.';
        }
        showManualOption = true;
      } else if (error.code === 3) {
        errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
      }
      
      ToastManager.showError(errorMessage);
      
      // If on localhost, offer to use a demo location
      if (showManualOption && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        this.offerDemoLocation(destinationInput);
      }
    } finally {
      // Restore button state
      geoBtn.disabled = false;
      const icon = geoBtn.querySelector('ion-icon');
      icon.name = 'location';
    }
  }

  /**
   * Offer demo location for testing in localhost
   */
  async offerDemoLocation(destinationInput) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Ubicación de Prueba';
    alert.message = '¿Quieres usar una ubicación de ejemplo para probar?';
    alert.buttons = [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Usar Demo',
        handler: () => {
          // Madrid city center as demo
          const demoLat = 40.416775;
          const demoLon = -3.703790;
          destinationInput.value = 'Puerta del Sol, Madrid (Demo)';
          destinationInput.setAttribute('data-lat', demoLat);
          destinationInput.setAttribute('data-lon', demoLon);
          ToastManager.show('Ubicación de prueba establecida', 'warning');
        }
      }
    ];
    
    document.body.appendChild(alert);
    await alert.present();
  }

  /**
   * Parse euro value from string (21,50 -> 21.50)
   */
  parseEuroValue(value) {
    if (!value) return 0;
    // Replace comma with dot and parse
    const cleaned = value.toString().replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Format euros for display (21.50 -> "21,50")
   */
  formatEuros(euros) {
    return euros.toFixed(2).replace('.', ',');
  }

  /**
   * Update net amount preview in real-time
   */
  updateNetAmountPreview() {
    // Get values and parse them
    const amount = this.parseEuroValue(document.getElementById('service-amount')?.value);
    const commission = this.parseEuroValue(document.getElementById('service-commission')?.value);
    const tip = this.parseEuroValue(document.getElementById('service-tip')?.value);

    const netAmount = amount + tip - commission;

    // Update preview elements with formatted values
    document.getElementById('preview-base').textContent = this.formatEuros(amount) + '€';
    document.getElementById('preview-commission').textContent = this.formatEuros(commission) + '€';
    document.getElementById('preview-tip').textContent = this.formatEuros(tip) + '€';
    document.getElementById('preview-net').textContent = this.formatEuros(netAmount) + '€';

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
    document.getElementById('service-destination').value = this.service.destination || '';
    document.getElementById('service-source').value = this.service.serviceSource || 'emisora';
    
    // Format values with comma decimal
    document.getElementById('service-amount').value = this.service.amount ? this.formatEuros(this.service.amount) : '';
    document.getElementById('service-commission').value = this.service.commission ? this.formatEuros(this.service.commission) : '';
    document.getElementById('service-tip').value = this.service.tip ? this.formatEuros(this.service.tip) : '';
    
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
    const amount = this.parseEuroValue(document.getElementById('service-amount').value);
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

    // Collect form data - parse euro values
    const amount = this.parseEuroValue(document.getElementById('service-amount').value);
    const commission = this.parseEuroValue(document.getElementById('service-commission').value);
    const tip = this.parseEuroValue(document.getElementById('service-tip').value);
    const netAmount = amount + tip - commission;

    const destinationInput = document.getElementById('service-destination');
    const destination = destinationInput.value || 'No especificado';
    
    // Get coordinates if available
    const latitude = destinationInput.getAttribute('data-lat');
    const longitude = destinationInput.getAttribute('data-lon');

    const serviceData = {
      date: document.getElementById('service-date').value,
      time: document.getElementById('service-time').value,
      destination: destination,
      serviceSource: document.getElementById('service-source').value,
      amount: amount,
      commission: commission,
      tip: tip,
      netAmount: netAmount,
      totalAmount: netAmount, // For compatibility
      paymentMethod: document.getElementById('service-payment-method').value,
      notes: document.getElementById('service-notes').value,
      status: 'completado'
    };
    
    // Add coordinates if available
    if (latitude && longitude) {
      serviceData.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
    }

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
    // Destroy keyboards
    if (this.amountKeyboard) {
      this.amountKeyboard.destroy();
    }
    if (this.commissionKeyboard) {
      this.commissionKeyboard.destroy();
    }
    if (this.tipKeyboard) {
      this.tipKeyboard.destroy();
    }
    
    if (this.modal) {
      await this.modal.dismiss();
      this.modal.remove();
    }
  }
}

// Export for use in other modules
window.ServiceFormModal = ServiceFormModal;

console.log('ServiceFormModal component loaded');
