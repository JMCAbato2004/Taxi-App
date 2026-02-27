/**
 * NumericKeyboard Component
 * Custom numeric keyboard for money input on mobile devices
 */

class NumericKeyboard {
  constructor(inputElement, onValueChange) {
    this.inputElement = inputElement;
    this.onValueChange = onValueChange;
    this.keyboardElement = null;
    this.currentValue = '';
    this.maxDecimals = 2;
    this.instanceId = 'keyboard-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Show the keyboard
   */
  show() {
    // Hide any other visible keyboards first
    this.hideOtherKeyboards();
    
    // Create keyboard if it doesn't exist
    if (!this.keyboardElement) {
      this.createKeyboard();
    }

    // Get current value from input
    this.currentValue = this.inputElement.value || '';
    
    // Update display with current value
    this.updateDisplay();

    // Show keyboard
    this.keyboardElement.style.display = 'block';
    
    // Add backdrop
    this.showBackdrop();
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Hide other keyboards
   */
  hideOtherKeyboards() {
    const allKeyboards = document.querySelectorAll('[id^="numeric-keyboard-"]');
    allKeyboards.forEach(kb => {
      if (kb.id !== this.instanceId) {
        kb.style.display = 'none';
      }
    });
  }

  /**
   * Hide the keyboard
   */
  hide() {
    if (this.keyboardElement) {
      this.keyboardElement.style.display = 'none';
    }
    
    this.hideBackdrop();
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Show backdrop
   */
  showBackdrop() {
    let backdrop = document.getElementById('numeric-keyboard-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'numeric-keyboard-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 19999;
        display: block;
      `;
      backdrop.addEventListener('click', () => this.hide());
      document.body.appendChild(backdrop);
    } else {
      backdrop.style.display = 'block';
    }
  }

  /**
   * Hide backdrop
   */
  hideBackdrop() {
    const backdrop = document.getElementById('numeric-keyboard-backdrop');
    if (backdrop) {
      backdrop.style.display = 'none';
    }
  }

  /**
   * Create keyboard element
   */
  createKeyboard() {
    this.keyboardElement = document.createElement('div');
    this.keyboardElement.id = this.instanceId;
    this.keyboardElement.className = 'numeric-keyboard-instance';
    this.keyboardElement.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--ion-background-color, #fff);
      border-top: 2px solid var(--ion-color-primary);
      padding: 16px;
      z-index: 20000;
      display: none;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    `;

    const valueId = this.instanceId + '-value';
    const cancelId = this.instanceId + '-cancel';
    const confirmId = this.instanceId + '-confirm';

    this.keyboardElement.innerHTML = `
      <style>
        .numeric-keyboard-instance {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .keyboard-display {
          background: var(--ion-color-light, #f4f5f8);
          border: 2px solid var(--ion-color-medium, #92949c);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          text-align: right;
          font-size: 36px;
          font-weight: 700;
          color: var(--ion-color-primary);
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        
        .keyboard-display span {
          margin-left: 8px;
          color: var(--ion-color-medium);
        }
        
        .keyboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .keyboard-key {
          background: var(--ion-color-light, #f4f5f8);
          border: 2px solid var(--ion-color-medium-tint, #a2a4ab);
          border-radius: 12px;
          padding: 24px;
          font-size: 28px;
          font-weight: 600;
          color: var(--ion-color-dark, #1f2937);
          cursor: pointer;
          user-select: none;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70px;
        }
        
        .keyboard-key:active {
          transform: scale(0.95);
          background: var(--ion-color-primary);
          color: white;
          border-color: var(--ion-color-primary);
        }
        
        .keyboard-key.special {
          background: var(--ion-color-primary-tint);
          color: white;
          font-size: 24px;
        }
        
        .keyboard-key.special:active {
          background: var(--ion-color-primary-shade);
        }
        
        .keyboard-key.delete {
          background: var(--ion-color-danger-tint);
          color: white;
        }
        
        .keyboard-key.delete:active {
          background: var(--ion-color-danger);
          color: white;
        }
        
        .keyboard-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .keyboard-action-btn {
          padding: 20px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          user-select: none;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
        }
        
        .keyboard-action-btn.cancel {
          background: var(--ion-color-medium);
          color: white;
        }
        
        .keyboard-action-btn.cancel:active {
          background: var(--ion-color-medium-shade);
          transform: scale(0.98);
        }
        
        .keyboard-action-btn.confirm {
          background: var(--ion-color-success);
          color: white;
        }
        
        .keyboard-action-btn.confirm:active {
          background: var(--ion-color-success-shade);
          transform: scale(0.98);
        }
      </style>
      
      <div class="keyboard-display">
        <span id="${valueId}">0,00</span>
        <span>€</span>
      </div>
      
      <div class="keyboard-grid">
        <div class="keyboard-key" data-key="1">1</div>
        <div class="keyboard-key" data-key="2">2</div>
        <div class="keyboard-key" data-key="3">3</div>
        <div class="keyboard-key" data-key="4">4</div>
        <div class="keyboard-key" data-key="5">5</div>
        <div class="keyboard-key" data-key="6">6</div>
        <div class="keyboard-key" data-key="7">7</div>
        <div class="keyboard-key" data-key="8">8</div>
        <div class="keyboard-key" data-key="9">9</div>
        <div class="keyboard-key special" data-key=",">,</div>
        <div class="keyboard-key" data-key="0">0</div>
        <div class="keyboard-key delete" data-key="backspace">⌫</div>
      </div>
      
      <div class="keyboard-actions">
        <button class="keyboard-action-btn cancel" id="${cancelId}">
          Cancelar
        </button>
        <button class="keyboard-action-btn confirm" id="${confirmId}">
          ✓ Aceptar
        </button>
      </div>
    `;

    document.body.appendChild(this.keyboardElement);
    this.attachKeyboardListeners();
  }

  /**
   * Attach keyboard event listeners
   */
  attachKeyboardListeners() {
    const cancelId = this.instanceId + '-cancel';
    const confirmId = this.instanceId + '-confirm';
    
    // Number and special keys
    this.keyboardElement.querySelectorAll('.keyboard-key').forEach(key => {
      key.addEventListener('click', () => {
        const keyValue = key.getAttribute('data-key');
        this.handleKeyPress(keyValue);
      });
    });

    // Cancel button
    document.getElementById(cancelId)?.addEventListener('click', () => {
      this.currentValue = this.inputElement.value || '';
      this.updateDisplay();
      this.hide();
    });

    // Confirm button
    document.getElementById(confirmId)?.addEventListener('click', () => {
      this.confirmValue();
    });
  }

  /**
   * Handle key press
   */
  handleKeyPress(key) {
    if (key === 'backspace') {
      this.currentValue = this.currentValue.slice(0, -1);
    } else if (key === ',') {
      // Only allow one decimal separator
      if (!this.currentValue.includes(',')) {
        this.currentValue += ',';
      }
    } else {
      // Check decimal places limit
      if (this.currentValue.includes(',')) {
        const parts = this.currentValue.split(',');
        if (parts[1] && parts[1].length >= this.maxDecimals) {
          return; // Max decimals reached
        }
      }
      
      this.currentValue += key;
    }

    this.updateDisplay();
  }

  /**
   * Update display
   */
  updateDisplay() {
    const valueId = this.instanceId + '-value';
    const displayElement = document.getElementById(valueId);
    if (displayElement) {
      displayElement.textContent = this.currentValue || '0,00';
    }
  }

  /**
   * Confirm value and update input
   */
  confirmValue() {
    // Format value
    let value = this.currentValue;
    
    // If empty, set to 0
    if (!value) {
      value = '0,00';
    }
    
    // If no decimal part, add ,00
    if (!value.includes(',')) {
      value += ',00';
    }
    
    // If decimal part has only one digit, add 0
    const parts = value.split(',');
    if (parts[1] && parts[1].length === 1) {
      value += '0';
    }
    
    // Update input
    this.inputElement.value = value;
    
    // Trigger change event
    const event = new Event('ionInput', { bubbles: true });
    this.inputElement.dispatchEvent(event);
    
    // Call callback if provided
    if (this.onValueChange) {
      this.onValueChange(value);
    }
    
    this.hide();
  }

  /**
   * Destroy keyboard
   */
  destroy() {
    if (this.keyboardElement) {
      this.keyboardElement.remove();
      this.keyboardElement = null;
    }
    
    this.hideBackdrop();
    const backdrop = document.getElementById('numeric-keyboard-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }
}

// Export for use in other modules
window.NumericKeyboard = NumericKeyboard;

console.log('NumericKeyboard component loaded');
