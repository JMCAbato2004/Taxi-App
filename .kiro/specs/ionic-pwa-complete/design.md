# Design Document: Ionic PWA Complete Taxi Management

## Overview

This design document specifies the architecture and implementation approach for integrating existing taxi management systems (authentication, reconciliation, RGPD) with a modern Ionic Framework Progressive Web Application interface. The system will provide a native-like mobile experience using Ionic web components, vanilla JavaScript, and existing TypeScript modules.

The design follows a modular architecture that preserves existing functionality while adding a comprehensive mobile-first UI layer with offline capabilities, role-based access control, and modern UX patterns.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Ionic PWA Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth UI     │  │  Services UI │  │  Balance UI  │     │
│  │  (Modals)    │  │  (CRUD)      │  │  (Reconcile) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Profile UI  │  │  Dashboard   │  │  Navigation  │     │
│  │  (Settings)  │  │  (Stats)     │  │  (Tabs)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Integration Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth        │  │  Reconcile   │  │  RGPD        │     │
│  │  Adapter     │  │  Adapter     │  │  Adapter     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Existing Systems                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth        │  │  Reconcile   │  │  RGPD        │     │
│  │  Service     │  │  Module      │  │  Manager     │     │
│  │  (TS)        │  │  (JS)        │  │  (JS)        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Storage Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Secure      │  │  Local       │  │  Sync        │     │
│  │  Storage     │  │  Storage     │  │  Queue       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The application follows a component-based architecture with clear separation of concerns:

1. **Presentation Layer**: Ionic web components for UI
2. **Integration Layer**: Adapters connecting UI to existing systems
3. **Business Logic Layer**: Existing TypeScript/JavaScript modules
4. **Data Layer**: Storage managers and sync services

### Technology Stack

- **Frontend Framework**: Ionic Framework 7.x (web components)
- **Language**: Vanilla JavaScript (ES6+) for new code
- **Existing Modules**: TypeScript (auth) and JavaScript (reconciliation, RGPD)
- **Storage**: LocalStorage with SecureStorageService
- **Offline**: Service Worker + DataSyncService
- **Styling**: Ionic CSS + Custom CSS variables
- **Build**: No build step required (CDN-based Ionic)

## Components and Interfaces

### 1. Authentication Components

#### LoginModal Component
```javascript
class LoginModal {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.modal = null;
  }

  async show() {
    // Create and display Ionic modal
    // Render login form with email and password fields
    // Handle form submission
  }

  async handleLogin(credentials) {
    // Validate inputs
    // Call authAdapter.login(credentials)
    // Show loading indicator
    // Handle success/error
    // Close modal on success
  }

  close() {
    // Dismiss modal
    // Clean up event listeners
  }
}
```

#### RegisterModal Component
```javascript
class RegisterModal {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.modal = null;
    this.selectedRole = null;
  }

  async show() {
    // Create and display Ionic modal
    // Render registration form
    // Include role selector (PATRON/TAXISTA)
  }

  handleRoleSelection(role) {
    // Update UI to show selected role
    // Store role for registration
  }

  async handleRegister(userData) {
    // Validate all fields
    // Call authAdapter.register(userData)
    // Show loading indicator
    // Handle success/error
    // Close modal and auto-login on success
  }

  close() {
    // Dismiss modal
    // Clean up event listeners
  }
}
```

#### AuthAdapter
```javascript
class AuthAdapter {
  constructor(authService, roleService) {
    this.authService = authService;
    this.roleService = roleService;
  }

  async login(credentials) {
    // Call authService.login(credentials)
    // Return AuthResult
  }

  async register(userData) {
    // Call authService.register(userData)
    // Auto-login after registration
    // Return User
  }

  async logout() {
    // Call authService.logout()
    // Clear UI state
  }

  getCurrentUser() {
    // Return authService.getCurrentUser()
  }

  isAuthenticated() {
    // Return authService.isAuthenticated()
  }

  hasPermission(permission) {
    // Return roleService.hasPermission(permission)
  }
}
```

### 2. Dashboard Components

#### DashboardView Component
```javascript
class DashboardView {
  constructor(authAdapter, reconcileAdapter) {
    this.authAdapter = authAdapter;
    this.reconcileAdapter = reconcileAdapter;
    this.stats = null;
  }

  async render() {
    const user = this.authAdapter.getCurrentUser();
    const stats = await this.loadStats(user);
    
    // Render welcome section or dashboard based on auth state
    if (!user) {
      this.renderWelcome();
    } else {
      this.renderDashboard(stats);
    }
  }

  async loadStats(user) {
    // Load services and expenses
    // Calculate statistics based on role
    // Return aggregated stats
  }

  renderWelcome() {
    // Show welcome card with login/register buttons
    // Show features list
  }

  renderDashboard(stats) {
    // Show stat cards (services, income, expenses, net)
    // Show recent activity list
    // Show role-specific information
  }

  async refresh() {
    // Reload stats
    // Update UI
  }
}
```

#### StatsCard Component
```javascript
class StatsCard {
  constructor(label, value, icon, theme) {
    this.label = label;
    this.value = value;
    this.icon = icon;
    this.theme = theme;
  }

  render() {
    // Return HTML for stat card
    // Use Ionic card styling
    // Display icon, value, and label
  }
}
```

### 3. Service Management Components

#### ServiceListView Component
```javascript
class ServiceListView {
  constructor(reconcileAdapter, authAdapter) {
    this.reconcileAdapter = reconcileAdapter;
    this.authAdapter = authAdapter;
    this.services = [];
    this.filters = {
      searchTerm: '',
      paymentType: 'all',
      dateFrom: null,
      dateTo: null
    };
  }

  async render() {
    // Load services filtered by role
    // Render service list with Ionic items
    // Show statistics
    // Show filter controls
  }

  async loadServices() {
    const user = this.authAdapter.getCurrentUser();
    const allServices = await this.reconcileAdapter.getServices();
    
    // Filter by role permissions
    this.services = this.filterByRole(allServices, user);
    
    // Apply additional filters
    this.services = this.applyFilters(this.services);
  }

  filterByRole(services, user) {
    // Use roleService to filter data
    // TAXISTA: only own services
    // PATRON: all associated taxistas' services
  }

  applyFilters(services) {
    // Apply search, date range, payment type filters
    // Return filtered services
  }

  async handleAddService() {
    // Show ServiceFormModal
    // On save, refresh list
  }

  async handleEditService(service) {
    // Show ServiceFormModal with service data
    // On save, refresh list
  }

  async handleDeleteService(service) {
    // Show confirmation
    // Delete via reconcileAdapter
    // Refresh list
  }

  async refresh() {
    // Reload services
    // Update UI
  }
}
```

#### ServiceFormModal Component
```javascript
class ServiceFormModal {
  constructor(reconcileAdapter, service = null) {
    this.reconcileAdapter = reconcileAdapter;
    this.service = service; // null for new, object for edit
    this.modal = null;
    this.formData = this.initializeFormData();
  }

  initializeFormData() {
    if (this.service) {
      return { ...this.service };
    }
    return {
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().slice(0, 5),
      totalAmount: '',
      paymentType: 'cash',
      platform: 'other',
      isArticulated: false,
      commission: '',
      incentives: '',
      tips: '',
      commissionPaidBy: 'shared'
    };
  }

  async show() {
    // Create Ionic modal
    // Render form with all fields
    // Set up event listeners
  }

  validateForm() {
    const errors = {};
    
    // Validate required fields
    if (!this.formData.date) {
      errors.date = 'La fecha es obligatoria';
    }
    
    if (!this.formData.totalAmount || this.formData.totalAmount <= 0) {
      errors.totalAmount = 'El importe debe ser mayor que 0';
    }
    
    if (this.formData.paymentType === 'app' && this.formData.platform === 'other') {
      errors.platform = 'Debe seleccionar una plataforma';
    }
    
    return errors;
  }

  async handleSubmit() {
    const errors = this.validateForm();
    
    if (Object.keys(errors).length > 0) {
      this.showErrors(errors);
      return;
    }
    
    // Show loading
    if (this.service) {
      await this.reconcileAdapter.updateService(this.service.id, this.formData);
    } else {
      await this.reconcileAdapter.createService(this.formData);
    }
    
    // Show success toast
    // Close modal
  }

  close() {
    // Dismiss modal
    // Clean up
  }
}
```

### 4. Expense Management Components

#### ExpenseListView Component
```javascript
class ExpenseListView {
  constructor(reconcileAdapter, authAdapter) {
    this.reconcileAdapter = reconcileAdapter;
    this.authAdapter = authAdapter;
    this.expenses = [];
    this.filters = {
      searchTerm: '',
      category: 'all',
      dateFrom: null,
      dateTo: null
    };
  }

  async render() {
    // Load expenses filtered by role
    // Render expense list with Ionic items
    // Show category statistics
    // Show filter controls
  }

  async loadExpenses() {
    const user = this.authAdapter.getCurrentUser();
    const allExpenses = await this.reconcileAdapter.getExpenses();
    
    // Filter by role permissions
    this.expenses = this.filterByRole(allExpenses, user);
    
    // Apply additional filters
    this.expenses = this.applyFilters(this.expenses);
  }

  filterByRole(expenses, user) {
    // Use roleService to filter data
    // TAXISTA: only own expenses
    // PATRON: all associated taxistas' expenses
  }

  applyFilters(expenses) {
    // Apply search, date range, category filters
    // Return filtered expenses
  }

  async handleAddExpense() {
    // Show ExpenseFormModal
    // On save, refresh list
  }

  async handleEditExpense(expense) {
    // Show ExpenseFormModal with expense data
    // On save, refresh list
  }

  async handleDeleteExpense(expense) {
    // Show confirmation
    // Delete via reconcileAdapter
    // Refresh list
  }

  async refresh() {
    // Reload expenses
    // Update UI
  }
}
```

#### ExpenseFormModal Component
```javascript
class ExpenseFormModal {
  constructor(reconcileAdapter, expense = null) {
    this.reconcileAdapter = reconcileAdapter;
    this.expense = expense;
    this.modal = null;
    this.formData = this.initializeFormData();
  }

  initializeFormData() {
    if (this.expense) {
      return { ...this.expense };
    }
    return {
      date: new Date().toISOString().split('T')[0],
      concept: '',
      amount: '',
      category: 'fuel',
      paidBy: 'shared'
    };
  }

  async show() {
    // Create Ionic modal
    // Render form with all fields
    // Set up event listeners
  }

  validateForm() {
    const errors = {};
    
    if (!this.formData.date) {
      errors.date = 'La fecha es obligatoria';
    }
    
    if (!this.formData.concept || this.formData.concept.length < 3) {
      errors.concept = 'El concepto debe tener al menos 3 caracteres';
    }
    
    if (!this.formData.amount || this.formData.amount <= 0) {
      errors.amount = 'El importe debe ser mayor que 0';
    }
    
    return errors;
  }

  async handleSubmit() {
    const errors = this.validateForm();
    
    if (Object.keys(errors).length > 0) {
      this.showErrors(errors);
      return;
    }
    
    // Show loading
    if (this.expense) {
      await this.reconcileAdapter.updateExpense(this.expense.id, this.formData);
    } else {
      await this.reconcileAdapter.createExpense(this.formData);
    }
    
    // Show success toast
    // Close modal
  }

  close() {
    // Dismiss modal
    // Clean up
  }
}
```

### 5. Balance and Reconciliation Components

#### ReconciliationView Component
```javascript
class ReconciliationView {
  constructor(reconcileAdapter, authAdapter) {
    this.reconcileAdapter = reconcileAdapter;
    this.authAdapter = authAdapter;
    this.currentReconciliation = null;
    this.config = {
      clientName: '',
      settlementType: 'percentage',
      driverRate: 40,
      ownerRate: 60,
      fixedOwnerAmount: 0
    };
  }

  async render() {
    if (this.currentReconciliation) {
      this.renderResults();
    } else {
      this.renderConfiguration();
    }
  }

  renderConfiguration() {
    // Show settlement type selector
    // Show percentage or fixed amount inputs
    // Show client name input
    // Show generate button
  }

  async handleGenerate() {
    // Validate configuration
    // Load services and expenses
    // Calculate reconciliation using CalculationEngine
    // Store result
    // Switch to results view
  }

  renderResults() {
    // Show summary statistics
    // Show final distribution
    // Show individual deductions
    // Show save button
  }

  async handleSave() {
    // Save reconciliation via reconcileAdapter
    // Show success toast
    // Reset to configuration view
  }

  async viewHistory() {
    // Show ReconciliationHistoryView
  }
}
```

#### ReconciliationHistoryView Component
```javascript
class ReconciliationHistoryView {
  constructor(reconcileAdapter, authAdapter) {
    this.reconcileAdapter = reconcileAdapter;
    this.authAdapter = authAdapter;
    this.reconciliations = [];
  }

  async render() {
    await this.loadReconciliations();
    // Render list of saved reconciliations
    // Show details for each
  }

  async loadReconciliations() {
    const user = this.authAdapter.getCurrentUser();
    const allReconciliations = await this.reconcileAdapter.getReconciliations();
    
    // Filter by role permissions
    this.reconciliations = this.filterByRole(allReconciliations, user);
  }

  filterByRole(reconciliations, user) {
    // Use roleService to filter data
    // TAXISTA: only own reconciliations
    // PATRON: all associated taxistas' reconciliations
  }

  async handleDelete(reconciliation) {
    // Show confirmation
    // Delete via reconcileAdapter
    // Refresh list
  }
}
```

### 6. Profile Components

#### ProfileView Component
```javascript
class ProfileView {
  constructor(authAdapter, rgpdAdapter) {
    this.authAdapter = authAdapter;
    this.rgpdAdapter = rgpdAdapter;
  }

  async render() {
    const user = this.authAdapter.getCurrentUser();
    
    // Render profile options list
    // - View Profile
    // - Change Password
    // - Privacy (RGPD)
    // - Logout
  }

  async handleViewProfile() {
    // Show ProfileDetailModal with user info
  }

  async handleChangePassword() {
    // Show ChangePasswordModal
  }

  async handlePrivacy() {
    // Open RGPD privacy policy page
  }

  async handleLogout() {
    // Show confirmation
    // Call authAdapter.logout()
    // Navigate to welcome screen
  }
}
```

#### ProfileDetailModal Component
```javascript
class ProfileDetailModal {
  constructor(authAdapter, user) {
    this.authAdapter = authAdapter;
    this.user = user;
    this.modal = null;
  }

  async show() {
    // Create Ionic modal
    // Display user information
    // - Name
    // - Email
    // - Phone
    // - Role
    // - Taxi number (if TAXISTA)
    // - Associated taxistas (if PATRON)
  }

  close() {
    // Dismiss modal
  }
}
```

#### ChangePasswordModal Component
```javascript
class ChangePasswordModal {
  constructor(authAdapter) {
    this.authAdapter = authAdapter;
    this.modal = null;
    this.formData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  async show() {
    // Create Ionic modal
    // Render password change form
  }

  validateForm() {
    const errors = {};
    
    if (!this.formData.currentPassword) {
      errors.currentPassword = 'La contraseña actual es obligatoria';
    }
    
    if (!this.formData.newPassword || this.formData.newPassword.length < 8) {
      errors.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres';
    }
    
    if (this.formData.newPassword !== this.formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return errors;
  }

  async handleSubmit() {
    const errors = this.validateForm();
    
    if (Object.keys(errors).length > 0) {
      this.showErrors(errors);
      return;
    }
    
    // Show loading
    await this.authAdapter.changePassword(
      this.formData.currentPassword,
      this.formData.newPassword
    );
    
    // Show success toast
    // Close modal
  }

  close() {
    // Dismiss modal
    // Clean up
  }
}
```

### 7. Navigation Components

#### TabNavigation Component
```javascript
class TabNavigation {
  constructor() {
    this.activeTab = 'home';
    this.tabs = [
      { id: 'home', label: 'Inicio', icon: 'home' },
      { id: 'services', label: 'Servicios', icon: 'car' },
      { id: 'balance', label: 'Balance', icon: 'wallet' },
      { id: 'profile', label: 'Perfil', icon: 'person' }
    ];
  }

  render() {
    // Render Ionic tab bar
    // Highlight active tab
    // Set up tab change listeners
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    // Update UI
    // Trigger tab content change
  }

  handleSwipeGesture(direction) {
    // Navigate to adjacent tab
    // left: next tab
    // right: previous tab
  }
}
```

#### FABButton Component
```javascript
class FABButton {
  constructor(reconcileAdapter) {
    this.reconcileAdapter = reconcileAdapter;
  }

  render() {
    // Render Ionic FAB button
    // Position at bottom right
  }

  async handleClick() {
    // Show action sheet with options:
    // - Nuevo Servicio
    // - Nuevo Gasto
    // - Ver Reportes
  }
}
```

### 8. Utility Components

#### ToastManager
```javascript
class ToastManager {
  static async show(message, duration = 2000, color = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = duration;
    toast.color = color;
    toast.position = 'bottom';
    
    document.body.appendChild(toast);
    await toast.present();
  }

  static async showSuccess(message) {
    await this.show(message, 2000, 'success');
  }

  static async showError(message) {
    await this.show(message, 3000, 'danger');
  }

  static async showWarning(message) {
    await this.show(message, 2500, 'warning');
  }
}
```

#### LoadingManager
```javascript
class LoadingManager {
  static currentLoading = null;

  static async show(message = 'Cargando...') {
    this.currentLoading = document.createElement('ion-loading');
    this.currentLoading.message = message;
    
    document.body.appendChild(this.currentLoading);
    await this.currentLoading.present();
  }

  static async hide() {
    if (this.currentLoading) {
      await this.currentLoading.dismiss();
      this.currentLoading = null;
    }
  }
}
```

#### ActionSheetManager
```javascript
class ActionSheetManager {
  static async show(header, buttons) {
    const actionSheet = document.createElement('ion-action-sheet');
    actionSheet.header = header;
    actionSheet.buttons = buttons;
    
    document.body.appendChild(actionSheet);
    await actionSheet.present();
  }
}
```

### 9. Adapter Layer

#### ReconcileAdapter
```javascript
class ReconcileAdapter {
  constructor(storageManager, roleService) {
    this.storageManager = storageManager;
    this.roleService = roleService;
  }

  async getServices() {
    const services = this.storageManager.getServices();
    const user = this.roleService.getCurrentUser();
    return this.roleService.filterDataByRole(services);
  }

  async createService(serviceData) {
    this.storageManager.saveService(serviceData);
    // Queue for sync if offline
  }

  async updateService(id, updates) {
    this.storageManager.updateService(id, updates);
    // Queue for sync if offline
  }

  async deleteService(id) {
    this.storageManager.deleteService(id);
    // Queue for sync if offline
  }

  async getExpenses() {
    const expenses = this.storageManager.getExpenses();
    const user = this.roleService.getCurrentUser();
    return this.roleService.filterDataByRole(expenses);
  }

  async createExpense(expenseData) {
    this.storageManager.saveExpense(expenseData);
    // Queue for sync if offline
  }

  async updateExpense(id, updates) {
    this.storageManager.updateExpense(id, updates);
    // Queue for sync if offline
  }

  async deleteExpense(id) {
    this.storageManager.deleteExpense(id);
    // Queue for sync if offline
  }

  async getReconciliations() {
    const reconciliations = this.storageManager.getReconciliations();
    const user = this.roleService.getCurrentUser();
    return this.roleService.filterDataByRole(reconciliations);
  }

  async saveReconciliation(reconciliationData) {
    this.storageManager.saveReconciliation(reconciliationData);
    // Queue for sync if offline
  }

  async deleteReconciliation(id) {
    this.storageManager.deleteReconciliation(id);
    // Queue for sync if offline
  }
}
```

#### RGPDAdapter
```javascript
class RGPDAdapter {
  constructor(rgpdManager) {
    this.rgpdManager = rgpdManager;
  }

  async showConsentDialog() {
    // Display RGPD consent using existing manager
  }

  async exportUserData(userId) {
    // Export all user data
    return this.rgpdManager.exportData(userId);
  }

  async deleteUserData(userId) {
    // Delete all user data
    await this.rgpdManager.deleteData(userId);
  }

  async getPrivacyPolicy() {
    // Return privacy policy content
  }

  async getTermsAndConditions() {
    // Return terms and conditions
  }
}
```

## Data Models

### Service Model
```javascript
{
  id: string,                    // Unique identifier
  date: Date,                    // Service date
  startTime: string,             // HH:MM format
  totalAmount: number,           // Total service amount
  paymentType: 'cash' | 'card' | 'app',
  platform: 'freenow' | 'uber' | 'cabify' | 'other',
  isArticulated: boolean,        // Articulated bus service
  commission: number,            // Platform commission
  incentives: number,            // Driver incentives
  tips: number,                  // Tips received
  commissionPaidBy: 'shared' | 'driver' | 'owner',
  userId: string,                // Creator user ID
  createdAt: Date,               // Creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

### Expense Model
```javascript
{
  id: string,                    // Unique identifier
  date: Date,                    // Expense date
  concept: string,               // Expense description
  amount: number,                // Expense amount
  category: 'fuel' | 'maintenance' | 'insurance' | 'other',
  paidBy: 'shared' | 'driver' | 'owner',
  userId: string,                // Creator user ID
  createdAt: Date,               // Creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

### Reconciliation Model
```javascript
{
  id: string,                    // Unique identifier
  clientName: string,            // Client/driver name
  period: {
    start: Date,                 // Period start date
    end: Date                    // Period end date
  },
  settlementType: 'percentage' | 'fixed',
  driverRate: number,            // Driver percentage (0-100)
  ownerRate: number,             // Owner percentage (0-100)
  fixedOwnerAmount: number,      // Fixed amount for owner (if applicable)
  summary: {
    totalServices: number,       // Number of services
    netIncome: number,           // Total income
    totalExpenses: number,       // Total expenses
    expensesDriver: number,      // Driver-specific expenses
    expensesOwner: number,       // Owner-specific expenses
    commDriver: number,          // Driver commissions
    commOwner: number,           // Owner commissions
    freenowExtras: number        // Freenow extras
  },
  finalSettlement: {
    driverAmount: number,        // Final amount for driver
    ownerAmount: number          // Final amount for owner
  },
  userId: string,                // Creator user ID
  createdAt: Date,               // Creation timestamp
  updatedAt: Date                // Last update timestamp
}
```

### User Model (from existing auth system)
```typescript
{
  id: string,
  email: string,
  nombre: string,
  telefono?: string,
  rol: 'PATRON' | 'TAXISTA',
  numeroTaxista?: string,        // Only for TAXISTA
  activo: boolean,
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

### SyncOperation Model
```typescript
{
  id: string,
  type: SyncOperationType,
  status: SyncOperationStatus,
  userId: string,
  userRole: UserRole,
  data: any,
  originalData?: any,
  timestamp: Date,
  retryCount: number,
  maxRetries: number,
  priority: number,
  conflictResolution?: ConflictResolutionStrategy,
  error?: string,
  metadata?: Record<string, any>
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

#### Requirement 1: Authentication Integration

1.1 WHEN a user opens the application without authentication, THE System SHALL display a welcome screen with login and register options
  Thoughts: This is testing a specific UI state. We can test that when no auth token exists, the welcome screen is rendered with the correct buttons.
  Testable: yes - example

1.2 WHEN a user clicks "Iniciar Sesión", THE System SHALL display a modal with email and password fields connected to Authentication_System
  Thoughts: This is testing UI interaction and modal display. We can test that clicking the button creates and displays a modal with the correct form fields.
  Testable: yes - example

1.3 WHEN a user submits valid login credentials, THE System SHALL authenticate via Authentication_System and display the dashboard
  Thoughts: This is a rule that should apply to all valid credentials. We can generate random valid credentials, submit them, and verify authentication succeeds and dashboard is shown.
  Testable: yes - property

1.4 WHEN a user clicks "Registrarse", THE System SHALL display a modal with registration fields
  Thoughts: This is testing UI interaction. Similar to 1.2, this is a specific example of modal display.
  Testable: yes - example

1.5 WHEN a user selects a role during registration, THE System SHALL provide visual feedback with role-specific icons
  Thoughts: This is testing UI feedback. We can test that selecting each role updates the UI with the correct icon.
  Testable: yes - property

1.6 WHEN a user submits valid registration data, THE System SHALL create an account via Authentication_System and log them in
  Thoughts: This is a rule for all valid registration data. We can generate random valid registration data and verify account creation and auto-login.
  Testable: yes - property

1.7 WHEN authentication fails, THE System SHALL display an error toast with the specific error message
  Thoughts: This is testing error handling across all failure scenarios. We can generate various invalid credentials and verify error toasts are shown.
  Testable: yes - property

1.8 WHEN a user logs in successfully, THE System SHALL store authentication tokens securely using SecureStorageService
  Thoughts: This is a rule for all successful logins. We can test that after any successful login, tokens are stored in SecureStorageService.
  Testable: yes - property

1.9 WHEN a user is authenticated, THE System SHALL load their role-specific permissions from RoleService
  Thoughts: This is a rule for all authenticated users. We can test that for any authenticated user, their permissions are loaded from RoleService.
  Testable: yes - property

1.10 WHEN a user logs out, THE System SHALL clear all authentication data and return to the welcome screen
  Thoughts: This is a rule for all logout operations. We can test that after any logout, auth data is cleared and welcome screen is shown.
  Testable: yes - property

#### Requirement 2: Dashboard and Navigation

2.1 WHEN a user logs in, THE System SHALL display a dashboard with four navigation tabs
  Thoughts: This is testing that the dashboard has the correct structure. We can test that after login, exactly 4 tabs are rendered.
  Testable: yes - example

2.2 WHEN a user is on the dashboard, THE System SHALL display real-time statistics
  Thoughts: This is testing that statistics are displayed. We can test that the dashboard contains stat elements with values.
  Testable: yes - example

2.3 WHEN a user is a TAXISTA, THE System SHALL display only their own data in the dashboard
  Thoughts: This is a rule for all TAXISTA users. We can test that for any TAXISTA, the dashboard only shows their own data.
  Testable: yes - property

2.4 WHEN a user is a PATRON, THE System SHALL display aggregated data from all associated taxistas
  Thoughts: This is a rule for all PATRON users. We can test that for any PATRON, the dashboard shows aggregated data from their taxistas.
  Testable: yes - property

2.5 WHEN a user taps a navigation tab, THE System SHALL switch to that section with a smooth transition
  Thoughts: This is a rule for all tab taps. We can test that tapping any tab switches to that section.
  Testable: yes - property

2.6 WHEN a user swipes left or right, THE System SHALL navigate between adjacent tabs
  Thoughts: This is testing gesture navigation. We can test that swipe gestures navigate to adjacent tabs.
  Testable: yes - property

2.7 WHEN a user is on any tab, THE System SHALL highlight the active tab in the navigation bar
  Thoughts: This is a rule for all tabs. We can test that for any active tab, it is highlighted in the navigation.
  Testable: yes - property

2.8 WHEN the dashboard loads, THE System SHALL display recent activity with service details and timestamps
  Thoughts: This is testing that recent activity is displayed. We can test that the dashboard contains activity items with required fields.
  Testable: yes - example

2.9 WHEN a user taps the menu button, THE System SHALL display an action sheet with profile, settings, privacy, and logout options
  Thoughts: This is testing that the menu action sheet has the correct options. We can test that tapping menu displays an action sheet with exactly these options.
  Testable: yes - example

2.10 WHEN a user pulls down on any list, THE System SHALL refresh the data from storage
  Thoughts: This is a rule for all lists. We can test that pull-to-refresh on any list reloads data.
  Testable: yes - property

#### Requirement 3: Service Management

3.1 WHEN a user navigates to the Services tab, THE System SHALL display a list of services filtered by their role permissions
  Thoughts: This is a rule for all users. We can test that for any user, the services list is filtered according to their role.
  Testable: yes - property

3.2 WHEN a user taps the "Nuevo Servicio" button, THE System SHALL display a modal form with service fields
  Thoughts: This is testing that the button displays a modal. This is a specific example.
  Testable: yes - example

3.3 WHEN a user fills the service form, THE System SHALL validate all required fields
  Thoughts: This is a rule for all form submissions. We can test that for any form data, required fields are validated.
  Testable: yes - property

3.4 WHEN a user selects "app" as payment type, THE System SHALL require platform selection
  Thoughts: This is a conditional validation rule. We can test that when payment type is "app", platform is required.
  Testable: yes - property

3.5 WHEN a user submits a valid service, THE System SHALL save it via ReconciliationStorageManager and close the modal
  Thoughts: This is a rule for all valid service submissions. We can test that for any valid service, it is saved and modal closes.
  Testable: yes - property

3.6 WHEN a user taps a service in the list, THE System SHALL display service details with edit and delete options
  Thoughts: This is a rule for all services. We can test that tapping any service shows details with edit/delete options.
  Testable: yes - property

3.7 WHEN a user edits a service, THE System SHALL pre-fill the form with existing data
  Thoughts: This is a rule for all service edits. We can test that for any service being edited, the form is pre-filled with its data.
  Testable: yes - property

3.8 WHEN a user deletes a service, THE System SHALL request confirmation before removing it
  Thoughts: This is a rule for all service deletions. We can test that for any service deletion, a confirmation is shown.
  Testable: yes - property

3.9 WHEN services are displayed, THE System SHALL show payment type icons
  Thoughts: This is a rule for all displayed services. We can test that for any service, the correct payment type icon is shown.
  Testable: yes - property

3.10 WHEN a user filters services, THE System SHALL update the list and statistics in real-time
  Thoughts: This is a rule for all filter operations. We can test that applying any filter updates both list and stats.
  Testable: yes - property

3.11 WHEN a user is offline, THE System SHALL queue service operations for later synchronization
  Thoughts: This is a rule for all operations when offline. We can test that when offline, any service operation is queued.
  Testable: yes - property

3.12 WHEN a service includes commission, THE System SHALL allow selection of who pays
  Thoughts: This is a conditional rule. We can test that when commission > 0, the paidBy selector is available.
  Testable: yes - property

#### Requirement 4: Expense Management

4.1 WHEN a user navigates to the Balance tab, THE System SHALL display expense management options
  Thoughts: This is testing that the Balance tab has expense options. This is a specific example.
  Testable: yes - example

4.2 WHEN a user taps "Nuevo Gasto", THE System SHALL display a modal form with expense fields
  Thoughts: This is testing that the button displays a modal. This is a specific example.
  Testable: yes - example

4.3 WHEN a user fills the expense form, THE System SHALL validate required fields
  Thoughts: This is a rule for all expense form submissions. We can test that for any form data, required fields are validated.
  Testable: yes - property

4.4 WHEN a user selects an expense category, THE System SHALL display category-specific icons
  Thoughts: This is a rule for all category selections. We can test that for any category, the correct icon is displayed.
  Testable: yes - property

4.5 WHEN a user submits a valid expense, THE System SHALL save it via ReconciliationStorageManager
  Thoughts: This is a rule for all valid expense submissions. We can test that for any valid expense, it is saved.
  Testable: yes - property

4.6 WHEN a user views expenses, THE System SHALL display them grouped by category with totals
  Thoughts: This is a rule for expense display. We can test that expenses are grouped by category and totals are calculated.
  Testable: yes - property

4.7 WHEN a user edits an expense, THE System SHALL pre-fill the form with existing data
  Thoughts: This is a rule for all expense edits. We can test that for any expense being edited, the form is pre-filled.
  Testable: yes - property

4.8 WHEN a user deletes an expense, THE System SHALL request confirmation before removing it
  Thoughts: This is a rule for all expense deletions. We can test that for any expense deletion, a confirmation is shown.
  Testable: yes - property

4.9 WHEN an expense is created, THE System SHALL allow selection of who pays
  Thoughts: This is a rule for all expense creation. We can test that the paidBy selector is available during creation.
  Testable: yes - property

4.10 WHEN a user is offline, THE System SHALL queue expense operations for later synchronization
  Thoughts: This is a rule for all operations when offline. We can test that when offline, any expense operation is queued.
  Testable: yes - property

#### Requirement 5: Balance and Reconciliation

5.1 WHEN a user navigates to the Balance tab, THE System SHALL display reconciliation calculation options
  Thoughts: This is testing that the Balance tab has reconciliation options. This is a specific example.
  Testable: yes - example

5.2 WHEN a user configures a reconciliation, THE System SHALL allow selection of settlement type
  Thoughts: This is testing that settlement type selection is available. This is a specific example.
  Testable: yes - example

5.3 WHEN a user selects percentage settlement, THE System SHALL allow configuration of driver and owner percentages
  Thoughts: This is a conditional rule. We can test that when percentage is selected, percentage inputs are available.
  Testable: yes - property

5.4 WHEN a user selects fixed amount settlement, THE System SHALL allow input of a fixed owner amount
  Thoughts: This is a conditional rule. We can test that when fixed is selected, fixed amount input is available.
  Testable: yes - property

5.5 WHEN a user generates a reconciliation, THE System SHALL calculate using CalculationEngine with services and expenses
  Thoughts: This is a rule for all reconciliation generation. We can test that for any reconciliation, CalculationEngine is used with correct data.
  Testable: yes - property

5.6 WHEN a reconciliation is calculated, THE System SHALL display summary statistics
  Thoughts: This is a rule for all calculated reconciliations. We can test that for any reconciliation, summary stats are displayed.
  Testable: yes - property

5.7 WHEN a reconciliation is displayed, THE System SHALL show final distribution between driver and owner
  Thoughts: This is a rule for all displayed reconciliations. We can test that for any reconciliation, final distribution is shown.
  Testable: yes - property

5.8 WHEN a reconciliation includes deductions, THE System SHALL display individual deductions for driver and owner
  Thoughts: This is a conditional rule. We can test that when deductions > 0, individual deductions are displayed.
  Testable: yes - property

5.9 WHEN a user saves a reconciliation, THE System SHALL store it with client name and timestamp
  Thoughts: This is a rule for all reconciliation saves. We can test that for any saved reconciliation, it has client name and timestamp.
  Testable: yes - property

5.10 WHEN a user views reconciliation history, THE System SHALL display all saved reconciliations with details
  Thoughts: This is testing that history displays all reconciliations. We can test that the history view contains all saved reconciliations.
  Testable: yes - property

5.11 WHEN a user is a PATRON, THE System SHALL allow viewing reconciliations for all associated taxistas
  Thoughts: This is a rule for PATRON users. We can test that for any PATRON, they can view all their taxistas' reconciliations.
  Testable: yes - property

5.12 WHEN a user is a TAXISTA, THE System SHALL allow viewing only their own reconciliations
  Thoughts: This is a rule for TAXISTA users. We can test that for any TAXISTA, they can only view their own reconciliations.
  Testable: yes - property

#### Requirement 6: Profile Management

6.1 WHEN a user navigates to the Profile tab, THE System SHALL display profile options
  Thoughts: This is testing that the Profile tab has the correct options. This is a specific example.
  Testable: yes - example

6.2 WHEN a user taps "Ver Perfil", THE System SHALL display their profile information
  Thoughts: This is a rule for all users. We can test that for any user, tapping "Ver Perfil" displays their information.
  Testable: yes - property

6.3 WHEN a user taps "Cambiar Contraseña", THE System SHALL display a form with current and new password fields
  Thoughts: This is testing that the password change form has the correct fields. This is a specific example.
  Testable: yes - example

6.4 WHEN a user changes their password, THE System SHALL validate the current password before updating
  Thoughts: This is a rule for all password changes. We can test that for any password change, current password is validated first.
  Testable: yes - property

6.5 WHEN a user updates sensitive data, THE System SHALL require additional confirmation via SensitiveDataConfirmationService
  Thoughts: This is a rule for all sensitive data updates. We can test that for any sensitive update, confirmation is required.
  Testable: yes - property

6.6 WHEN a user taps "Privacidad (RGPD)", THE System SHALL open the RGPD privacy policy page
  Thoughts: This is testing that the privacy link opens the correct page. This is a specific example.
  Testable: yes - example

6.7 WHEN a user taps "Cerrar Sesión", THE System SHALL log them out and clear all session data
  Thoughts: This is a rule for all logout operations. We can test that for any logout, session data is cleared.
  Testable: yes - property

6.8 WHEN a user is a TAXISTA, THE System SHALL display their taxi number in the profile
  Thoughts: This is a rule for TAXISTA users. We can test that for any TAXISTA, their taxi number is displayed in profile.
  Testable: yes - property

6.9 WHEN a user is a PATRON, THE System SHALL display the list of associated taxistas
  Thoughts: This is a rule for PATRON users. We can test that for any PATRON, their associated taxistas are displayed.
  Testable: yes - property

6.10 WHEN profile data is updated, THE System SHALL reflect changes immediately in the UI
  Thoughts: This is a rule for all profile updates. We can test that for any profile update, the UI is updated immediately.
  Testable: yes - property

#### Requirement 7: Role-Based Access Control

7.1 WHEN a user logs in as TAXISTA, THE System SHALL filter all data to show only their own services and expenses
  Thoughts: This is a rule for all TAXISTA users. We can test that for any TAXISTA, only their own data is shown.
  Testable: yes - property

7.2 WHEN a user logs in as PATRON, THE System SHALL display aggregated data from all associated taxistas
  Thoughts: This is a rule for all PATRON users. We can test that for any PATRON, aggregated data from their taxistas is shown.
  Testable: yes - property

7.3 WHEN a PATRON views services, THE System SHALL show services from all associated taxistas with driver identification
  Thoughts: This is a rule for PATRON service viewing. We can test that for any PATRON, services from all their taxistas are shown with identification.
  Testable: yes - property

7.4 WHEN a TAXISTA attempts to view another driver's data, THE System SHALL deny access
  Thoughts: This is a rule for TAXISTA access control. We can test that for any TAXISTA, attempting to access another's data is denied.
  Testable: yes - property

7.5 WHEN a PATRON creates an association with a TAXISTA, THE System SHALL require confirmation from both parties
  Thoughts: This is a rule for association creation. We can test that for any association, confirmation is required from both parties.
  Testable: yes - property

7.6 WHEN a PATRON removes an association, THE System SHALL notify the TAXISTA and maintain data integrity
  Thoughts: This is a rule for association removal. We can test that for any removal, TAXISTA is notified and data integrity is maintained.
  Testable: yes - property

7.7 WHEN role permissions are checked, THE System SHALL use RoleService to validate access
  Thoughts: This is a rule for all permission checks. We can test that for any permission check, RoleService is used.
  Testable: yes - property

7.8 WHEN a user performs an operation, THE System SHALL validate permissions before execution
  Thoughts: This is a rule for all operations. We can test that for any operation, permissions are validated first.
  Testable: yes - property

7.9 WHEN a PATRON views statistics, THE System SHALL aggregate data from all associated taxistas
  Thoughts: This is a rule for PATRON statistics. We can test that for any PATRON, statistics are aggregated from their taxistas.
  Testable: yes - property

7.10 WHEN a TAXISTA views statistics, THE System SHALL show only their individual data
  Thoughts: This is a rule for TAXISTA statistics. We can test that for any TAXISTA, only their individual data is shown in statistics.
  Testable: yes - property

#### Requirement 8: Offline Functionality

8.1 WHEN a user loses internet connection, THE System SHALL continue functioning with cached data
  Thoughts: This is a rule for offline operation. We can test that when offline, the system continues to function with cached data.
  Testable: yes - property

8.2 WHEN a user creates a service offline, THE System SHALL queue the operation in DataSyncService
  Thoughts: This is a rule for offline service creation. We can test that for any service created offline, it is queued in DataSyncService.
  Testable: yes - property

8.3 WHEN a user creates an expense offline, THE System SHALL queue the operation in DataSyncService
  Thoughts: This is a rule for offline expense creation. We can test that for any expense created offline, it is queued in DataSyncService.
  Testable: yes - property

8.4 WHEN a user edits data offline, THE System SHALL queue the update operation
  Thoughts: This is a rule for offline edits. We can test that for any edit made offline, it is queued.
  Testable: yes - property

8.5 WHEN a user deletes data offline, THE System SHALL queue the delete operation
  Thoughts: This is a rule for offline deletions. We can test that for any deletion made offline, it is queued.
  Testable: yes - property

8.6 WHEN internet connection is restored, THE System SHALL automatically synchronize queued operations
  Thoughts: This is a rule for coming back online. We can test that when connection is restored, queued operations are synchronized.
  Testable: yes - property

8.7 WHEN synchronization occurs, THE System SHALL process operations in priority order
  Thoughts: This is a rule for sync processing. We can test that for any sync, operations are processed by priority.
  Testable: yes - property

8.8 WHEN a sync conflict is detected, THE System SHALL apply the configured conflict resolution strategy
  Thoughts: This is a rule for conflict handling. We can test that for any conflict, the configured strategy is applied.
  Testable: yes - property

8.9 WHEN offline operations are pending, THE System SHALL display a sync status indicator
  Thoughts: This is a rule for pending operations. We can test that when operations are pending, a status indicator is displayed.
  Testable: yes - property

8.10 WHEN a user views pending operations, THE System SHALL show the sync queue with operation details
  Thoughts: This is a rule for viewing pending operations. We can test that the sync queue displays all pending operations with details.
  Testable: yes - property

8.11 WHEN critical data is accessed offline, THE System SHALL retrieve it from SecureStorageService
  Thoughts: This is a rule for offline data access. We can test that for any critical data accessed offline, it comes from SecureStorageService.
  Testable: yes - property

8.12 WHEN the Service_Worker is active, THE System SHALL cache essential assets for offline use
  Thoughts: This is a rule for Service Worker caching. We can test that when Service Worker is active, essential assets are cached.
  Testable: yes - property

### Property Reflection

After reviewing all the testable properties, I've identified several areas where properties can be combined or where redundancy exists:

**Redundancies to address:**
1. Properties 3.1 and 7.1/7.2 overlap - they all test role-based data filtering. These can be combined into a single comprehensive property about role-based data filtering.
2. Properties 3.11, 4.10, 8.2, 8.3, 8.4, 8.5 all test offline queueing. These can be combined into a single property about offline operation queueing.
3. Properties 2.3, 2.4, 7.9, 7.10 all test role-based statistics display. These can be combined into a single property about role-based statistics.
4. Properties 3.7 and 4.7 both test form pre-filling for edits. These can be combined into a single property about edit form pre-filling.
5. Properties 3.8 and 4.8 both test deletion confirmation. These can be combined into a single property about deletion confirmation.
6. Properties 1.8 and 1.10 test token storage and clearing. These are part of a round-trip property about authentication state management.

**Unique properties to keep:**
- Authentication flow properties (login, register, logout)
- Form validation properties (services, expenses)
- Role-based access control properties
- Offline synchronization properties
- UI interaction properties (modals, toasts, navigation)
- Data persistence properties

After reflection, I'll consolidate redundant properties and focus on unique, comprehensive properties that provide maximum validation value.



### Correctness Properties

Based on the prework analysis and property reflection, here are the consolidated correctness properties:

#### Property 1: Authentication Round Trip
*For any* valid user credentials, logging in then logging out should clear all authentication data and return the system to the unauthenticated state.
**Validates: Requirements 1.3, 1.8, 1.10**

#### Property 2: Registration Auto-Login
*For any* valid registration data, successfully registering should automatically log the user in and display the dashboard.
**Validates: Requirements 1.6**

#### Property 3: Authentication Error Handling
*For any* invalid credentials, attempting to authenticate should display an error toast with a specific error message and not change the authentication state.
**Validates: Requirements 1.7**

#### Property 4: Role-Based Data Filtering
*For any* authenticated user, all data displayed (services, expenses, reconciliations, statistics) should be filtered according to their role: TAXISTA sees only their own data, PATRON sees aggregated data from all associated taxistas.
**Validates: Requirements 2.3, 2.4, 3.1, 7.1, 7.2, 7.3, 7.9, 7.10**

#### Property 5: Navigation Tab Consistency
*For any* navigation tab, tapping it should switch to that section, highlight it in the navigation bar, and maintain the active state until another tab is selected.
**Validates: Requirements 2.5, 2.7**

#### Property 6: Gesture Navigation
*For any* adjacent tabs, swiping left should navigate to the next tab and swiping right should navigate to the previous tab.
**Validates: Requirements 2.6**

#### Property 7: Service Form Validation
*For any* service form submission, the system should validate that required fields (date, totalAmount, paymentType) are present and valid, and if paymentType is "app", platform must be specified.
**Validates: Requirements 3.3, 3.4**

#### Property 8: Service CRUD Persistence
*For any* valid service, creating it should save it to storage, editing it should update the stored version, and deleting it (after confirmation) should remove it from storage.
**Validates: Requirements 3.5, 3.6, 3.7, 3.8**

#### Property 9: Payment Type Icon Display
*For any* service displayed in the list, the correct payment type icon should be shown: 💵 for cash, 💳 for card, 📱 for app.
**Validates: Requirements 3.9**

#### Property 10: Service Filter Consistency
*For any* filter applied to the service list (search term, payment type, date range), both the displayed list and the statistics should update to reflect only the filtered services.
**Validates: Requirements 3.10**

#### Property 11: Expense Form Validation
*For any* expense form submission, the system should validate that required fields (date, concept, amount, category) are present and valid, with concept having at least 3 characters.
**Validates: Requirements 4.3**

#### Property 12: Expense CRUD Persistence
*For any* valid expense, creating it should save it to storage, editing it should update the stored version, and deleting it (after confirmation) should remove it from storage.
**Validates: Requirements 4.5, 4.6, 4.7, 4.8**

#### Property 13: Category Icon Display
*For any* expense category selected, the correct icon should be displayed: ⛽ for fuel, 🔧 for maintenance, 🛡️ for insurance, 📋 for other.
**Validates: Requirements 4.4**

#### Property 14: Reconciliation Calculation Accuracy
*For any* set of services and expenses within a period, generating a reconciliation should calculate summary statistics (total services, net income, total expenses) and final distribution (driver amount, owner amount) using the CalculationEngine with the configured settlement type and rates.
**Validates: Requirements 5.5, 5.6, 5.7**

#### Property 15: Reconciliation Persistence
*For any* calculated reconciliation, saving it should store it with client name, timestamp, and all calculation details, and it should appear in the reconciliation history.
**Validates: Requirements 5.9, 5.10**

#### Property 16: Role-Based Reconciliation Access
*For any* user viewing reconciliation history, TAXISTA users should see only their own reconciliations, and PATRON users should see reconciliations for all associated taxistas.
**Validates: Requirements 5.11, 5.12**

#### Property 17: Password Change Validation
*For any* password change attempt, the system should validate the current password before allowing the update, and should require the new password to meet security requirements (minimum 8 characters).
**Validates: Requirements 6.4**

#### Property 18: Sensitive Data Confirmation
*For any* sensitive data update (password, email, profile), the system should require additional confirmation via SensitiveDataConfirmationService before executing the change.
**Validates: Requirements 6.5**

#### Property 19: Profile Display Consistency
*For any* authenticated user, viewing their profile should display role-specific information: TAXISTA users see their taxi number, PATRON users see their list of associated taxistas.
**Validates: Requirements 6.8, 6.9**

#### Property 20: Access Control Enforcement
*For any* operation performed by a user, the system should validate permissions using RoleService before execution, and TAXISTA users should be denied access to other drivers' data.
**Validates: Requirements 7.4, 7.7, 7.8**

#### Property 21: Association Management
*For any* association between PATRON and TAXISTA, creating it should require confirmation from both parties, and removing it should notify the TAXISTA while maintaining data integrity.
**Validates: Requirements 7.5, 7.6**

#### Property 22: Offline Operation Queueing
*For any* operation (create, update, delete) performed while offline, the system should queue it in DataSyncService with appropriate priority and metadata for later synchronization.
**Validates: Requirements 3.11, 4.10, 8.2, 8.3, 8.4, 8.5**

#### Property 23: Online Synchronization
*For any* queued operations, when internet connection is restored, the system should automatically synchronize them in priority order, applying the configured conflict resolution strategy for any conflicts detected.
**Validates: Requirements 8.6, 8.7, 8.8**

#### Property 24: Offline Data Access
*For any* critical data accessed while offline, the system should retrieve it from SecureStorageService, and the Service Worker should cache essential assets for offline use.
**Validates: Requirements 8.11, 8.12**

#### Property 25: Sync Status Visibility
*For any* pending offline operations, the system should display a sync status indicator, and viewing the sync queue should show all pending operations with their details.
**Validates: Requirements 8.9, 8.10**

#### Property 26: Form Pre-Fill Consistency
*For any* entity (service or expense) being edited, the edit form should be pre-filled with all existing data from that entity.
**Validates: Requirements 3.7, 4.7**

#### Property 27: Deletion Confirmation
*For any* entity (service, expense, reconciliation) being deleted, the system should request user confirmation before removing it from storage.
**Validates: Requirements 3.8, 4.8**

#### Property 28: Pull-to-Refresh Data Reload
*For any* list view (services, expenses, reconciliations), pulling down should trigger a data reload from storage and update the displayed list.
**Validates: Requirements 2.10**

#### Property 29: Theme Persistence
*For any* theme change (light to dark or dark to light), the system should apply the new theme to all Ionic components, persist the preference in LocalStorage, and reload it on application start.
**Validates: Requirements 9.1, 9.3, 9.4, 9.5**

#### Property 30: Loading Indicator Display
*For any* asynchronous operation (login, save, delete, sync), the system should display a loading indicator during processing and hide it when the operation completes.
**Validates: Requirements 10.1**

#### Property 31: Toast Notification Display
*For any* operation completion (success or error), the system should display a toast notification with an appropriate message and color (success: green, error: red, warning: yellow).
**Validates: Requirements 10.2**

#### Property 32: Data Encryption
*For any* sensitive data stored (authentication tokens, user data), the system should encrypt it using CryptoUtils before storing in SecureStorageService.
**Validates: Requirements 11.1, 11.5**

#### Property 33: Storage Integrity Validation
*For any* data loaded from storage, the system should validate its integrity, and if corruption is detected, should attempt automatic repair or use default values.
**Validates: Requirements 11.6, 14.9**

#### Property 34: Token Refresh
*For any* expired authentication token, the system should attempt to refresh it automatically using the refresh token before requiring re-authentication.
**Validates: Requirements 11.9**

## Error Handling

### Error Categories

1. **Network Errors**: Connection failures, timeouts, server errors
2. **Validation Errors**: Invalid form data, missing required fields
3. **Authentication Errors**: Invalid credentials, expired tokens, insufficient permissions
4. **Storage Errors**: Quota exceeded, data corruption, access denied
5. **Sync Errors**: Conflict detection, operation failures, retry exhaustion

### Error Handling Strategy

```javascript
class ErrorHandler {
  static handle(error, context) {
    // Log error for debugging
    console.error(`Error in ${context}:`, error);
    
    // Determine error type and handle appropriately
    if (error instanceof AuthError) {
      return this.handleAuthError(error);
    } else if (error instanceof ValidationError) {
      return this.handleValidationError(error);
    } else if (error instanceof NetworkError) {
      return this.handleNetworkError(error);
    } else if (error instanceof StorageError) {
      return this.handleStorageError(error);
    } else {
      return this.handleUnknownError(error);
    }
  }

  static handleAuthError(error) {
    // Show error toast
    ToastManager.showError(error.message);
    
    // If session expired, redirect to login
    if (error.code === AuthErrorCode.SESSION_EXPIRED) {
      // Clear auth data
      // Navigate to welcome screen
    }
  }

  static handleValidationError(error) {
    // Show validation errors in form
    // Highlight invalid fields
    // Display error messages
  }

  static handleNetworkError(error) {
    // Show retry option
    ToastManager.showError('Error de conexión. Toca para reintentar.');
    
    // Queue operation for offline sync if applicable
  }

  static handleStorageError(error) {
    // Attempt recovery
    // If quota exceeded, cleanup old data
    // Show user-friendly message
  }

  static handleUnknownError(error) {
    // Log for debugging
    // Show generic error message
    ToastManager.showError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
  }
}
```

### Recovery Mechanisms

1. **Automatic Retry**: Network operations retry with exponential backoff
2. **Data Recovery**: Corrupted data triggers automatic repair attempts
3. **Graceful Degradation**: System continues functioning with reduced features when errors occur
4. **User Notification**: Clear error messages with actionable recovery steps
5. **State Preservation**: Unsaved data is preserved in LocalStorage for recovery

## Testing Strategy

### Dual Testing Approach

The application will use both unit testing and property-based testing for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs

### Unit Testing

Unit tests will focus on:
- Specific UI interactions (button clicks, modal displays)
- Integration points between components
- Edge cases (empty lists, maximum values, special characters)
- Error conditions (network failures, validation errors)

**Example Unit Tests:**
```javascript
describe('LoginModal', () => {
  it('should display modal when show() is called', async () => {
    const modal = new LoginModal(authAdapter);
    await modal.show();
    expect(document.querySelector('ion-modal')).toBeTruthy();
  });

  it('should show error toast for invalid credentials', async () => {
    const modal = new LoginModal(authAdapter);
    await modal.handleLogin({ email: 'invalid', password: 'wrong' });
    // Verify error toast is displayed
  });

  it('should close modal on successful login', async () => {
    const modal = new LoginModal(authAdapter);
    await modal.handleLogin({ email: 'valid@email.com', password: 'correct' });
    // Verify modal is closed
  });
});
```

### Property-Based Testing

Property tests will verify universal properties using a property-based testing library (fast-check for JavaScript):

**Configuration:**
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: ionic-pwa-complete, Property {number}: {property_text}`

**Example Property Tests:**
```javascript
import fc from 'fast-check';

describe('Property 4: Role-Based Data Filtering', () => {
  // Feature: ionic-pwa-complete, Property 4: Role-Based Data Filtering
  it('should filter data according to user role', () => {
    fc.assert(
      fc.property(
        fc.record({
          user: fc.oneof(
            fc.record({ id: fc.uuid(), rol: fc.constant('TAXISTA') }),
            fc.record({ id: fc.uuid(), rol: fc.constant('PATRON') })
          ),
          services: fc.array(fc.record({
            id: fc.uuid(),
            userId: fc.uuid(),
            totalAmount: fc.float({ min: 0, max: 1000 })
          }))
        }),
        ({ user, services }) => {
          const filtered = roleService.filterDataByRole(services, user);
          
          if (user.rol === 'TAXISTA') {
            // All filtered services should belong to this user
            expect(filtered.every(s => s.userId === user.id)).toBe(true);
          } else {
            // PATRON should see services from associated taxistas
            // (test with mock associations)
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 7: Service Form Validation', () => {
  // Feature: ionic-pwa-complete, Property 7: Service Form Validation
  it('should validate required fields and conditional requirements', () => {
    fc.assert(
      fc.property(
        fc.record({
          date: fc.option(fc.date()),
          totalAmount: fc.option(fc.float({ min: -100, max: 1000 })),
          paymentType: fc.oneof(
            fc.constant('cash'),
            fc.constant('card'),
            fc.constant('app')
          ),
          platform: fc.option(fc.oneof(
            fc.constant('freenow'),
            fc.constant('uber'),
            fc.constant('other')
          ))
        }),
        (formData) => {
          const errors = validateServiceForm(formData);
          
          // Date is required
          if (!formData.date) {
            expect(errors.date).toBeDefined();
          }
          
          // Amount must be positive
          if (!formData.totalAmount || formData.totalAmount <= 0) {
            expect(errors.totalAmount).toBeDefined();
          }
          
          // App payment requires platform
          if (formData.paymentType === 'app' && formData.platform === 'other') {
            expect(errors.platform).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 22: Offline Operation Queueing', () => {
  // Feature: ionic-pwa-complete, Property 22: Offline Operation Queueing
  it('should queue all operations when offline', () => {
    fc.assert(
      fc.property(
        fc.record({
          operationType: fc.oneof(
            fc.constant('create'),
            fc.constant('update'),
            fc.constant('delete')
          ),
          entityType: fc.oneof(
            fc.constant('service'),
            fc.constant('expense')
          ),
          data: fc.object()
        }),
        ({ operationType, entityType, data }) => {
          // Simulate offline state
          setOffline(true);
          
          // Perform operation
          performOperation(operationType, entityType, data);
          
          // Verify operation is queued
          const queue = dataSyncService.getPendingOperations();
          expect(queue.some(op => 
            op.type === operationType && 
            op.data === data
          )).toBe(true);
          
          // Cleanup
          setOffline(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Testing Tools

- **Unit Testing**: Jest or Vitest
- **Property-Based Testing**: fast-check
- **E2E Testing**: Playwright or Cypress (optional)
- **Component Testing**: Ionic Testing Library

### Test Coverage Goals

- Unit Test Coverage: 80% minimum
- Property Test Coverage: All 34 correctness properties
- Integration Test Coverage: All critical user flows
- E2E Test Coverage: Main user journeys (login, create service, reconciliation)

## Performance Considerations

### Load Time Optimization

1. **Lazy Loading**: Load Ionic components on demand
2. **Code Splitting**: Separate code by route/feature
3. **Asset Optimization**: Compress images, minify CSS
4. **Caching Strategy**: Aggressive caching of static assets

### Runtime Optimization

1. **Virtual Scrolling**: Use Ionic virtual scroll for large lists
2. **Debouncing**: Debounce search and filter operations
3. **Memoization**: Cache computed values (statistics, filtered lists)
4. **Event Delegation**: Use event delegation for list items

### Storage Optimization

1. **Data Cleanup**: Automatically remove old data (>6 months)
2. **Compression**: Compress large data before storing
3. **Indexing**: Use efficient data structures for lookups
4. **Batch Operations**: Batch multiple storage operations

### Network Optimization

1. **Request Batching**: Batch multiple API calls
2. **Response Caching**: Cache API responses
3. **Optimistic Updates**: Update UI before server confirmation
4. **Background Sync**: Use Service Worker background sync

## Security Considerations

### Authentication Security

1. **Token Storage**: Store tokens in SecureStorageService with encryption
2. **Token Expiration**: Implement automatic token refresh
3. **Session Management**: Clear sessions on logout
4. **Password Requirements**: Enforce strong password policies

### Data Security

1. **Encryption**: Encrypt sensitive data at rest
2. **HTTPS Only**: Require HTTPS for all network requests
3. **Input Validation**: Validate and sanitize all user inputs
4. **XSS Prevention**: Escape user-generated content

### Access Control

1. **Role-Based Access**: Enforce permissions at every layer
2. **Data Isolation**: Ensure users can only access their own data
3. **Audit Logging**: Log sensitive operations for RGPD compliance
4. **Rate Limiting**: Prevent abuse through rate limiting

## Deployment Strategy

### Progressive Web App Setup

1. **Manifest**: Configure web app manifest for installability
2. **Service Worker**: Implement caching and offline strategies
3. **Icons**: Provide icons for all device sizes
4. **Splash Screens**: Configure splash screens for iOS/Android

### Hosting

1. **Static Hosting**: Deploy to CDN (Netlify, Vercel, Cloudflare Pages)
2. **HTTPS**: Ensure HTTPS is enabled
3. **Caching Headers**: Configure appropriate cache headers
4. **Compression**: Enable gzip/brotli compression

### Monitoring

1. **Error Tracking**: Implement error tracking (Sentry)
2. **Analytics**: Track user behavior (privacy-compliant)
3. **Performance Monitoring**: Monitor load times and performance
4. **Uptime Monitoring**: Monitor application availability

## Future Enhancements

### Phase 2 Features

1. **Push Notifications**: Notify users of important events
2. **Biometric Authentication**: Support fingerprint/face recognition
3. **Multi-language Support**: Add internationalization
4. **Advanced Reporting**: Generate PDF reports
5. **Data Export**: Export data to CSV/Excel
6. **Backup/Restore**: Cloud backup and restore functionality

### Phase 3 Features

1. **Real-time Sync**: WebSocket-based real-time synchronization
2. **Collaborative Features**: Multiple users editing simultaneously
3. **Advanced Analytics**: Dashboard with charts and insights
4. **Integration APIs**: Connect with external systems
5. **Mobile Apps**: Native iOS/Android apps using Capacitor
6. **Voice Commands**: Voice-based data entry

## Conclusion

This design provides a comprehensive architecture for integrating existing taxi management systems with a modern Ionic Framework PWA interface. The modular approach ensures maintainability, the adapter pattern enables clean integration, and the focus on offline functionality and role-based access control addresses key user needs.

The correctness properties provide a solid foundation for property-based testing, ensuring the system behaves correctly across all scenarios. The dual testing approach (unit + property tests) will provide comprehensive coverage and confidence in the system's reliability.

The design prioritizes user experience with native-like interactions, performance optimization, and security best practices, while maintaining compatibility with existing systems and data structures.
