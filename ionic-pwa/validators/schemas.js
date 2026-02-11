/**
 * Validation Schemas
 * Comprehensive input validation using custom validation logic
 * 
 * Validates:
 * - User registration and login
 * - Services and expenses
 * - Profile updates
 * - Financial data
 */

class ValidationSchemas {
  constructor() {
    // Email regex
    this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Phone regex (international format)
    this.phoneRegex = /^\+?[1-9]\d{1,14}$/;
    
    // Password requirements
    this.passwordMinLength = 8;
    this.passwordMaxLength = 128;
  }

  /**
   * Validate email
   */
  validateEmail(email) {
    const errors = [];
    
    if (!email) {
      errors.push('El email es obligatorio');
      return { valid: false, errors };
    }
    
    if (typeof email !== 'string') {
      errors.push('El email debe ser texto');
      return { valid: false, errors };
    }
    
    if (!this.emailRegex.test(email)) {
      errors.push('El email no es válido');
    }
    
    if (email.length > 255) {
      errors.push('El email es demasiado largo');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate password
   */
  validatePassword(password) {
    const errors = [];
    
    if (!password) {
      errors.push('La contraseña es obligatoria');
      return { valid: false, errors };
    }
    
    if (password.length < this.passwordMinLength) {
      errors.push(`La contraseña debe tener al menos ${this.passwordMinLength} caracteres`);
    }
    
    if (password.length > this.passwordMaxLength) {
      errors.push(`La contraseña no puede tener más de ${this.passwordMaxLength} caracteres`);
    }
    
    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate phone number
   */
  validatePhone(phone, required = false) {
    const errors = [];
    
    if (!phone) {
      if (required) {
        errors.push('El teléfono es obligatorio');
      }
      return { valid: !required, errors };
    }
    
    // Remove spaces and dashes for validation
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    
    if (!this.phoneRegex.test(cleanPhone)) {
      errors.push('El teléfono no es válido');
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate name
   */
  validateName(name, fieldName = 'nombre') {
    const errors = [];
    
    if (!name) {
      errors.push(`El ${fieldName} es obligatorio`);
      return { valid: false, errors };
    }
    
    if (typeof name !== 'string') {
      errors.push(`El ${fieldName} debe ser texto`);
      return { valid: false, errors };
    }
    
    if (name.trim().length < 2) {
      errors.push(`El ${fieldName} debe tener al menos 2 caracteres`);
    }
    
    if (name.length > 100) {
      errors.push(`El ${fieldName} es demasiado largo`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate amount (money)
   */
  validateAmount(amount, options = {}) {
    const {
      min = 0,
      max = 999999,
      required = true,
      fieldName = 'importe'
    } = options;
    
    const errors = [];
    
    if (amount === null || amount === undefined || amount === '') {
      if (required) {
        errors.push(`El ${fieldName} es obligatorio`);
      }
      return { valid: !required, errors };
    }
    
    const num = parseFloat(amount);
    
    if (isNaN(num)) {
      errors.push(`El ${fieldName} debe ser un número válido`);
      return { valid: false, errors };
    }
    
    if (num < min) {
      errors.push(`El ${fieldName} debe ser mayor o igual a ${min}`);
    }
    
    if (num > max) {
      errors.push(`El ${fieldName} no puede ser mayor a ${max}`);
    }
    
    if (num < 0) {
      errors.push(`El ${fieldName} no puede ser negativo`);
    }
    
    return { valid: errors.length === 0, errors, value: num };
  }

  /**
   * Validate date
   */
  validateDate(date, options = {}) {
    const {
      required = true,
      minDate = null,
      maxDate = null,
      fieldName = 'fecha'
    } = options;
    
    const errors = [];
    
    if (!date) {
      if (required) {
        errors.push(`La ${fieldName} es obligatoria`);
      }
      return { valid: !required, errors };
    }
    
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      errors.push(`La ${fieldName} no es válida`);
      return { valid: false, errors };
    }
    
    if (minDate) {
      const minDateObj = new Date(minDate);
      if (dateObj < minDateObj) {
        errors.push(`La ${fieldName} no puede ser anterior a ${minDateObj.toLocaleDateString()}`);
      }
    }
    
    if (maxDate) {
      const maxDateObj = new Date(maxDate);
      if (dateObj > maxDateObj) {
        errors.push(`La ${fieldName} no puede ser posterior a ${maxDateObj.toLocaleDateString()}`);
      }
    }
    
    return { valid: errors.length === 0, errors, value: dateObj };
  }

  /**
   * Login schema
   */
  validateLogin(data) {
    const errors = {};
    
    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.errors;
    }
    
    if (!data.password) {
      errors.password = ['La contraseña es obligatoria'];
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Registration schema
   */
  validateRegistration(data) {
    const errors = {};
    
    const nameValidation = this.validateName(data.nombre);
    if (!nameValidation.valid) {
      errors.nombre = nameValidation.errors;
    }
    
    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.valid) {
      errors.email = emailValidation.errors;
    }
    
    const phoneValidation = this.validatePhone(data.telefono, true);
    if (!phoneValidation.valid) {
      errors.telefono = phoneValidation.errors;
    }
    
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors;
    }
    
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = ['Las contraseñas no coinciden'];
    }
    
    if (!data.rol || !['PATRON', 'TAXISTA'].includes(data.rol)) {
      errors.rol = ['Debe seleccionar un rol válido'];
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Service schema
   */
  validateService(data) {
    const errors = {};
    
    const dateValidation = this.validateDate(data.date, {
      maxDate: new Date(),
      fieldName: 'fecha'
    });
    if (!dateValidation.valid) {
      errors.date = dateValidation.errors;
    }
    
    const amountValidation = this.validateAmount(data.amount, {
      min: 0.01,
      max: 9999,
      fieldName: 'importe'
    });
    if (!amountValidation.valid) {
      errors.amount = amountValidation.errors;
    }
    
    if (data.commission !== undefined && data.commission !== null && data.commission !== '') {
      const commissionValidation = this.validateAmount(data.commission, {
        min: 0,
        max: data.amount || 9999,
        required: false,
        fieldName: 'comisión'
      });
      if (!commissionValidation.valid) {
        errors.commission = commissionValidation.errors;
      }
    }
    
    if (data.tip !== undefined && data.tip !== null && data.tip !== '') {
      const tipValidation = this.validateAmount(data.tip, {
        min: 0,
        max: 9999,
        required: false,
        fieldName: 'propina'
      });
      if (!tipValidation.valid) {
        errors.tip = tipValidation.errors;
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Expense schema
   */
  validateExpense(data) {
    const errors = {};
    
    const dateValidation = this.validateDate(data.date, {
      maxDate: new Date(),
      fieldName: 'fecha'
    });
    if (!dateValidation.valid) {
      errors.date = dateValidation.errors;
    }
    
    const amountValidation = this.validateAmount(data.amount, {
      min: 0.01,
      max: 99999,
      fieldName: 'importe'
    });
    if (!amountValidation.valid) {
      errors.amount = amountValidation.errors;
    }
    
    if (!data.category) {
      errors.category = ['La categoría es obligatoria'];
    }
    
    const descriptionValidation = this.validateName(data.description, 'descripción');
    if (!descriptionValidation.valid) {
      errors.description = descriptionValidation.errors;
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Profile update schema
   */
  validateProfileUpdate(data) {
    const errors = {};
    
    if (data.nombre) {
      const nameValidation = this.validateName(data.nombre);
      if (!nameValidation.valid) {
        errors.nombre = nameValidation.errors;
      }
    }
    
    if (data.telefono) {
      const phoneValidation = this.validatePhone(data.telefono, false);
      if (!phoneValidation.valid) {
        errors.telefono = phoneValidation.errors;
      }
    }
    
    if (data.email) {
      const emailValidation = this.validateEmail(data.email);
      if (!emailValidation.valid) {
        errors.email = emailValidation.errors;
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Password change schema
   */
  validatePasswordChange(data) {
    const errors = {};
    
    if (!data.currentPassword) {
      errors.currentPassword = ['La contraseña actual es obligatoria'];
    }
    
    const newPasswordValidation = this.validatePassword(data.newPassword);
    if (!newPasswordValidation.valid) {
      errors.newPassword = newPasswordValidation.errors;
    }
    
    if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = ['Las contraseñas no coinciden'];
    }
    
    if (data.currentPassword === data.newPassword) {
      errors.newPassword = ['La nueva contraseña debe ser diferente a la actual'];
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Create singleton instance
const validationSchemas = new ValidationSchemas();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ValidationSchemas = ValidationSchemas;
  window.validationSchemas = validationSchemas;
}

console.log('ValidationSchemas loaded');
