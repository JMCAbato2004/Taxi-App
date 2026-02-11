/**
 * ExpenseFormModal Component
 * Modal for creating and editing expenses
 */

class ExpenseFormModal {
  constructor(reconcileAdapter, expense = null) {
    this.reconcileAdapter = reconcileAdapter;
    this.expense = expense; // null for create, object for edit
    this.modal = null;
    this.isEditMode = !!expense;
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
    const title = this.isEditMode ? 'Editar Gasto' : 'Nuevo Gasto';
    const submitText = this.isEditMode ? 'Guardar' : 'Crear';

    return `
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>${title}</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-expense-modal">
              <ion-icon name="close"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <form id="expense-form">
          <!-- Date -->
          <ion-item>
            <ion-label position="stacked">Fecha *</ion-label>
            <ion-input 
              type="date" 
              id="expense-date" 
              required
              value="${new Date().toISOString().split('T')[0]}">
            </ion-input>
          </ion-item>
          <div class="error-message" id="date-error"></div>

          <!-- Concept -->
          <ion-item>
            <ion-label position="stacked">Concepto *</ion-label>
            <ion-input 
              type="text" 
              id="expense-concept" 
              placeholder="Ej: Gasolina, Cambio de aceite..."
              required>
            </ion-input>
          </ion-item>
          <div class="error-message" id="concept-error"></div>

          <!-- Amount -->
          <ion-item>
            <ion-label position="stacked">Importe *</ion-label>
            <ion-input 
              type="number" 
              id="expense-amount" 
              placeholder="0.00"
              step="0.01"
              min="0"
              required>
            </ion-input>
          </ion-item>
          <div class="error-message" id="amount-error"></div>

          <!-- Category -->
          <ion-item>
            <ion-label position="stacked">Categoría *</ion-label>
            <ion-select id="expense-category" value="other" interface="action-sheet">
              <ion-select-option value="fuel">⛽ Combustible</ion-select-option>
              <ion-select-option value="maintenance">🔧 Mantenimiento</ion-select-option>
              <ion-select-option value="insurance">🛡️ Seguro</ion-select-option>
              <ion-select-option value="other">📋 Otro</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Paid By -->
          <ion-item>
            <ion-label position="stacked">Pagado Por *</ion-label>
            <ion-select id="expense-paid-by" value="shared" interface="action-sheet">
              <ion-select-option value="shared">Compartido</ion-select-option>
              <ion-select-option value="driver">Conductor</ion-select-option>
              <ion-select-option value="owner">Propietario</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Notes -->
          <ion-item>
            <ion-label position="stacked">Notas</ion-label>
            <ion-textarea 
              id="expense-notes" 
              rows="3"
              placeholder="Notas adicionales...">
            </ion-textarea>
          </ion-item>

          <!-- Submit Button -->
          <ion-button 
            expand="block" 
            type="submit" 
            id="submit-expense-btn"
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
    document.getElementById('close-expense-modal')?.addEventListener('click', () => {
      this.close();
    });

    // Form submission
    const form = document.getElementById('expense-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Real-time validation
    document.getElementById('expense-date')?.addEventListener('ionChange', () => {
      this.clearError('date-error');
    });

    document.getElementById('expense-concept')?.addEventListener('ionInput', () => {
      this.clearError('concept-error');
    });

    document.getElementById('expense-amount')?.addEventListener('ionInput', () => {
      this.clearError('amount-error');
    });
  }

  /**
   * Pre-fill form with expense data (edit mode)
   */
  prefillForm() {
    if (!this.expense) return;

    document.getElementById('expense-date').value = this.expense.date || '';
    document.getElementById('expense-concept').value = this.expense.concept || '';
    document.getElementById('expense-amount').value = this.expense.amount || '';
    document.getElementById('expense-category').value = this.expense.category || 'other';
    document.getElementById('expense-paid-by').value = this.expense.paidBy || 'shared';
    document.getElementById('expense-notes').value = this.expense.notes || '';
  }

  /**
   * Validate form using ValidationSchemas
   */
  validateForm() {
    let isValid = true;

    // Use ValidationSchemas if available
    if (window.validationSchemas) {
      const validation = window.validationSchemas.validateExpense({
        date: document.getElementById('expense-date').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        category: document.getElementById('expense-category').value,
        description: document.getElementById('expense-concept').value.trim()
      });
      
      if (!validation.valid) {
        // Show errors
        if (validation.errors.date) {
          this.showError('date-error', validation.errors.date[0]);
          isValid = false;
        }
        if (validation.errors.description) {
          this.showError('concept-error', validation.errors.description[0]);
          isValid = false;
        }
        if (validation.errors.amount) {
          this.showError('amount-error', validation.errors.amount[0]);
          isValid = false;
        }
      }
      
      return isValid;
    }

    // Fallback validation
    // Validate date
    const date = document.getElementById('expense-date').value;
    if (!date) {
      this.showError('date-error', 'La fecha es obligatoria');
      isValid = false;
    }

    // Validate concept
    const concept = document.getElementById('expense-concept').value.trim();
    if (!concept) {
      this.showError('concept-error', 'El concepto es obligatorio');
      isValid = false;
    } else if (concept.length < 3) {
      this.showError('concept-error', 'El concepto debe tener al menos 3 caracteres');
      isValid = false;
    }

    // Validate amount
    const amount = parseFloat(document.getElementById('expense-amount').value);
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
   * Handle form submission with CSRF protection
   */
  async handleSubmit() {
    // Validate form
    if (!this.validateForm()) {
      ToastManager.showError('Por favor, corrige los errores del formulario');
      return;
    }

    // Collect form data
    let expenseData = {
      date: document.getElementById('expense-date').value,
      concept: document.getElementById('expense-concept').value.trim(),
      amount: parseFloat(document.getElementById('expense-amount').value),
      category: document.getElementById('expense-category').value,
      paidBy: document.getElementById('expense-paid-by').value,
      notes: document.getElementById('expense-notes').value.trim()
    };

    // Add CSRF token
    if (window.csrfService) {
      expenseData = window.csrfService.addTokenToData(expenseData);
    }

    try {
      await LoadingManager.show(this.isEditMode ? 'Guardando...' : 'Creando...');

      if (this.isEditMode) {
        await this.reconcileAdapter.updateExpense(this.expense.id, expenseData);
        ToastManager.showSuccess('Gasto actualizado');
      } else {
        await this.reconcileAdapter.createExpense(expenseData);
        ToastManager.showSuccess('Gasto creado');
      }

      await LoadingManager.hide();

      // Dispatch event to refresh expense list
      window.dispatchEvent(new CustomEvent('expense-saved'));

      // Close modal
      await this.close();
    } catch (error) {
      await LoadingManager.hide();
      console.error('Error saving expense:', error);
      ToastManager.showError('Error al guardar el gasto');
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
window.ExpenseFormModal = ExpenseFormModal;

console.log('ExpenseFormModal component loaded');
