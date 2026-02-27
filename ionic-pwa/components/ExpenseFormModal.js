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
          <ion-item style="--min-height: 80px;">
            <ion-label position="stacked" style="font-size: 16px; margin-bottom: 8px;">Importe *</ion-label>
            <ion-input 
              type="text" 
              id="expense-amount" 
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

          <!-- Category -->
          <ion-item>
            <ion-label position="stacked">Concepto *</ion-label>
            <ion-select id="expense-category" value="fuel" interface="action-sheet">
              <ion-select-option value="fuel">⛽ Combustible</ion-select-option>
              <ion-select-option value="other">📋 Otro</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Comments (only shown when "Otro" is selected) -->
          <ion-item id="comments-item" style="display: none;">
            <ion-label position="stacked">Comentarios *</ion-label>
            <ion-textarea 
              id="expense-comments" 
              rows="3"
              placeholder="Explica el motivo del gasto...">
            </ion-textarea>
          </ion-item>
          <div class="error-message" id="comments-error"></div>

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

    // Initialize numeric keyboard for amount input
    this.initializeNumericKeyboard();

    // Form submission
    const form = document.getElementById('expense-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Category change - show/hide comments field
    document.getElementById('expense-category')?.addEventListener('ionChange', (e) => {
      const commentsItem = document.getElementById('comments-item');
      if (e.detail.value === 'other') {
        commentsItem.style.display = 'block';
      } else {
        commentsItem.style.display = 'none';
        document.getElementById('expense-comments').value = '';
        this.clearError('comments-error');
      }
    });

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

    document.getElementById('expense-comments')?.addEventListener('ionInput', () => {
      this.clearError('comments-error');
    });
  }

  /**
   * Initialize numeric keyboard for amount input
   */
  initializeNumericKeyboard() {
    const amountInput = document.getElementById('expense-amount');
    if (amountInput) {
      this.amountKeyboard = new NumericKeyboard(amountInput);
      
      amountInput.addEventListener('click', () => {
        this.amountKeyboard.show();
      });
    }
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
   * Pre-fill form with expense data (edit mode)
   */
  prefillForm() {
    if (!this.expense) return;

    document.getElementById('expense-date').value = this.expense.date || '';
    document.getElementById('expense-concept').value = this.expense.concept || '';
    
    // Format amount with comma decimal
    const amount = this.expense.amount ? this.formatEuros(parseFloat(this.expense.amount)) : '';
    document.getElementById('expense-amount').value = amount;
    
    document.getElementById('expense-category').value = this.expense.category || 'fuel';
    document.getElementById('expense-comments').value = this.expense.comments || '';
    
    // Show comments field if category is "other"
    if (this.expense.category === 'other') {
      document.getElementById('comments-item').style.display = 'block';
    }
  }

  /**
   * Validate form
   */
  validateForm() {
    let isValid = true;

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

    // Validate amount - parse euro value
    const amount = this.parseEuroValue(document.getElementById('expense-amount').value);
    if (!amount || amount <= 0) {
      this.showError('amount-error', 'El importe debe ser mayor que 0');
      isValid = false;
    }

    // Validate comments if category is "other"
    const category = document.getElementById('expense-category').value;
    if (category === 'other') {
      const comments = document.getElementById('expense-comments').value.trim();
      if (!comments) {
        this.showError('comments-error', 'Los comentarios son obligatorios para "Otro"');
        isValid = false;
      } else if (comments.length < 5) {
        this.showError('comments-error', 'Los comentarios deben tener al menos 5 caracteres');
        isValid = false;
      }
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

    // Collect form data - parse euro value
    const amount = this.parseEuroValue(document.getElementById('expense-amount').value);
    
    const expenseData = {
      date: document.getElementById('expense-date').value,
      concept: document.getElementById('expense-concept').value.trim(),
      amount: amount,
      category: document.getElementById('expense-category').value,
      comments: document.getElementById('expense-comments').value.trim()
    };

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
    // Destroy keyboard
    if (this.amountKeyboard) {
      this.amountKeyboard.destroy();
    }
    
    if (this.modal) {
      await this.modal.dismiss();
      this.modal.remove();
    }
  }
}

// Export for use in other modules
window.ExpenseFormModal = ExpenseFormModal;

console.log('ExpenseFormModal component loaded');
