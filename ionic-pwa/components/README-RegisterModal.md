# RegisterModal Component

## Overview
The RegisterModal component handles user registration with role selection and comprehensive form validation. It follows the same structure as LoginModal and integrates seamlessly with the AuthAdapter.

## Features

### 1. Modal with Registration Form Fields
- **Nombre** (Name): Required, minimum 3 characters
- **Email**: Required, must be valid email format
- **Teléfono** (Phone): Optional, but validated if provided
- **Contraseña** (Password): Required, minimum 8 characters
- **Confirmar Contraseña** (Confirm Password): Required, must match password
- **Rol** (Role): Required, PATRON or TAXISTA

### 2. Role Selection with Visual Feedback
- **PATRON** (👔): For taxi fleet owners
- **TAXISTA** (🚗): For taxi drivers
- Visual feedback with `.selected` class when role is clicked
- Role-specific descriptions displayed

### 3. Comprehensive Validation
- Real-time validation on input
- Field-specific error messages
- Email format validation
- Phone format validation (if provided)
- Password length validation (minimum 8 characters)
- Password confirmation matching
- Role selection requirement

### 4. Integration with AuthAdapter
- Calls `authAdapter.register(userData)` with validated data
- Handles loading states with LoadingManager
- Displays success/error messages with ToastManager
- Auto-login handled by AuthAdapter

### 5. Auto-Login After Registration
- AuthAdapter stores user data after successful registration
- Component dispatches 'register-success' event
- App.js listens for event and displays dashboard
- Seamless transition from registration to authenticated state

## Usage

```javascript
// Initialize with AuthAdapter
const registerModal = new RegisterModal(authAdapter);

// Show the modal
await registerModal.show();

// Listen for registration success
window.addEventListener('register-success', (event) => {
  const user = event.detail.user;
  console.log('User registered:', user);
  // Handle post-registration logic
});
```

## Validation Rules

### Name (nombre)
- Required
- Minimum 3 characters
- Trimmed before submission

### Email
- Required
- Must match email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Trimmed before submission

### Phone (telefono)
- Optional
- If provided, must contain at least 9 digits
- Accepts various formats: +34 600 000 000, (600) 000-000, etc.
- Trimmed before submission

### Password
- Required
- Minimum 8 characters
- No specific complexity requirements (can be enhanced)

### Confirm Password
- Required
- Must exactly match password field

### Role (rol)
- Required
- Must be either 'PATRON' or 'TAXISTA'
- Selected via visual role selector

## Error Handling

The component provides comprehensive error handling:

1. **Validation Errors**: Displayed inline below each field
2. **Network Errors**: Caught and displayed via ToastManager
3. **Registration Errors**: Error messages from AuthAdapter displayed to user
4. **Loading States**: LoadingManager shows progress during registration

## Events

### Dispatched Events

#### register-success
Dispatched when registration is successful and user is auto-logged in.

```javascript
{
  detail: {
    user: {
      id: string,
      email: string,
      nombre: string,
      telefono: string,
      rol: 'PATRON' | 'TAXISTA',
      numeroTaxista: string | null,
      activo: boolean,
      fechaCreacion: string
    }
  }
}
```

## Requirements Validation

### Requirement 1.4 ✅
"WHEN a user clicks 'Registrarse', THE System SHALL display a modal with registration fields (name, email, phone, password, role selection)"
- Modal displays with all required fields

### Requirement 1.5 ✅
"WHEN a user selects a role during registration, THE System SHALL provide visual feedback with role-specific icons (PATRON: 👔, TAXISTA: 🚗)"
- Role selector shows icons with visual feedback

### Requirement 1.6 ✅
"WHEN a user submits valid registration data, THE System SHALL create an account via Authentication_System and log them in"
- Calls AuthAdapter.register() and handles auto-login

## Testing

A test page is available at `ionic-pwa/test-register-modal.html` that includes:
- Manual testing of the registration modal
- Automated validation tests
- Visual verification of role selection
- Event handling verification

## Future Enhancements

1. **Password Strength Indicator**: Visual feedback on password strength
2. **Email Verification**: Send verification email after registration
3. **Terms and Conditions**: Checkbox for accepting terms
4. **CAPTCHA**: Add CAPTCHA for bot prevention
5. **Social Login**: Add OAuth providers (Google, Facebook, etc.)
6. **Profile Picture**: Allow users to upload profile picture during registration
