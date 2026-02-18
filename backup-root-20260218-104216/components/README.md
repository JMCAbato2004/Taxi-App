# Ionic PWA Components

This directory contains reusable UI components for the Ionic PWA application.

## Components

### LoginModal

**File:** `LoginModal.js`

**Purpose:** Handles user authentication with email and password validation.

**Requirements:** 1.2, 1.3, 1.7

**Features:**
- Email and password input fields
- Real-time form validation
- Email format validation (regex-based)
- Required field validation
- Error display with user-friendly messages
- Loading state management during authentication
- Success/error toast notifications
- Integration with AuthAdapter
- Custom event dispatch on successful login
- Keyboard support (Enter to submit)
- Proper cleanup on modal close

**Usage:**

```javascript
// Initialize with AuthAdapter
const authAdapter = new AuthAdapter();
const loginModal = new LoginModal(authAdapter);

// Show the modal
await loginModal.show();

// Listen for login success
window.addEventListener('login-success', (event) => {
  console.log('User logged in:', event.detail.user);
  // Handle post-login actions
});
```

**Validation Rules:**

1. **Email:**
   - Required field
   - Must match email format: `user@domain.com`
   - Error messages:
     - "El email es obligatorio" (if empty)
     - "El formato del email no es válido" (if invalid format)

2. **Password:**
   - Required field
   - Error message:
     - "La contraseña es obligatoria" (if empty)

**Methods:**

- `show()` - Display the login modal
- `close()` - Close and cleanup the modal
- `validateForm()` - Validate form data and return errors
- `isValidEmail(email)` - Check if email format is valid
- `showErrors(errors)` - Display validation errors
- `showFieldError(field, message)` - Show error for specific field
- `clearFieldError(field)` - Clear error for specific field
- `clearAllErrors()` - Clear all validation errors
- `handleSubmit()` - Process form submission
- `onLoginSuccess(user)` - Handle successful login
- `setupEventListeners()` - Set up modal event listeners

**Events:**

- `login-success` - Fired when login is successful
  - Detail: `{ user: Object }` - The authenticated user object

**Error Handling:**

The component handles errors at multiple levels:

1. **Validation Errors:** Displayed inline below each field
2. **Authentication Errors:** Displayed as error toasts
3. **Network Errors:** Caught and displayed as error toasts

**Styling:**

The component uses Ionic's built-in styling with:
- Primary color toolbar
- Stacked labels for inputs
- Error notes in danger color
- Invalid state for form items
- Block-level submit button

**Accessibility:**

- Proper label associations
- Autocomplete attributes for email and password
- Keyboard navigation support
- Error announcements via ion-note elements

**Testing:**

A test file is available at `ionic-pwa/test-login-modal.html` that verifies:
- Modal display
- Form validation
- Login success flow
- Event dispatching
- Error handling

**Integration:**

The LoginModal integrates with:
- **AuthAdapter:** For authentication logic
- **LoadingManager:** For loading indicators
- **ToastManager:** For success/error notifications

**Future Enhancements:**

- Password visibility toggle
- "Remember me" checkbox
- "Forgot password" link
- Social login options
- Biometric authentication support
- Rate limiting for failed attempts

## Component Guidelines

When creating new components:

1. **Follow the same structure:**
   - Constructor with dependencies
   - `show()` method to display
   - `close()` method to cleanup
   - Event listeners setup
   - Validation methods
   - Error handling

2. **Use Ionic components:**
   - ion-modal for overlays
   - ion-input for form fields
   - ion-button for actions
   - ion-note for error messages

3. **Integrate with utilities:**
   - ToastManager for notifications
   - LoadingManager for async operations
   - ActionSheetManager for action selection

4. **Dispatch custom events:**
   - Use CustomEvent for component communication
   - Include relevant data in event.detail
   - Document events in component README

5. **Handle cleanup:**
   - Remove event listeners
   - Clear form data
   - Remove DOM elements
   - Reset component state

6. **Validate inputs:**
   - Real-time validation on input
   - Clear validation on submit
   - User-friendly error messages
   - Highlight invalid fields

7. **Test thoroughly:**
   - Create test HTML files
   - Test validation rules
   - Test success/error flows
   - Test event dispatching
   - Test cleanup

## Next Components

Upcoming components to be implemented:

- **RegisterModal** - User registration with role selection
- **ServiceFormModal** - Create/edit taxi services
- **ExpenseFormModal** - Create/edit expenses
- **ReconciliationView** - Calculate and display reconciliations
- **ProfileDetailModal** - View/edit user profile
- **ChangePasswordModal** - Change user password

