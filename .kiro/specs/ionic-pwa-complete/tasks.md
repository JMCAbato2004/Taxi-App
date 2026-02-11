# Implementation Plan: Ionic PWA Complete Taxi Management

## Overview

This implementation plan breaks down the Ionic PWA Complete feature into discrete, manageable coding tasks. Each task builds on previous steps and includes references to specific requirements. The plan follows a logical progression from core infrastructure through feature implementation to testing and integration.

## Tasks

- [x] 1. Set up project structure and core infrastructure
  - Create main HTML file with Ionic Framework CDN imports
  - Set up CSS custom properties for theming
  - Initialize service worker for PWA functionality
  - Create base adapter classes (AuthAdapter, ReconcileAdapter, RGPDAdapter)
  - Set up utility managers (ToastManager, LoadingManager, ActionSheetManager)
  - _Requirements: 9.1, 9.9, 10.1, 10.2, 11.1_

- [ ]* 1.1 Write property test for theme persistence
  - **Property 29: Theme Persistence**
  - **Validates: Requirements 9.1, 9.3, 9.4, 9.5**

- [ ] 2. Implement authentication UI components
  - [x] 2.1 Create LoginModal component with email and password fields
    - Implement modal creation and display using Ionic modal
    - Add form validation for email and password
    - Connect to AuthAdapter.login()
    - Handle loading states and error display
    - _Requirements: 1.2, 1.3, 1.7_

  - [ ]* 2.2 Write property test for authentication round trip
    - **Property 1: Authentication Round Trip**
    - **Validates: Requirements 1.3, 1.8, 1.10**

  - [x] 2.3 Create RegisterModal component with role selection
    - Implement modal with registration form fields
    - Add role selector with visual feedback (PATRON/TAXISTA icons)
    - Validate all registration fields
    - Connect to AuthAdapter.register()
    - Handle auto-login after successful registration
    - _Requirements: 1.4, 1.5, 1.6_

  - [ ]* 2.4 Write property test for registration auto-login
    - **Property 2: Registration Auto-Login**
    - **Validates: Requirements 1.6**

  - [ ]* 2.5 Write property test for authentication error handling
    - **Property 3: Authentication Error Handling**
    - **Validates: Requirements 1.7**

- [x] 3. Implement AuthAdapter integration layer
  - Create AuthAdapter class connecting UI to existing auth services
  - Implement login(), register(), logout() methods
  - Implement getCurrentUser(), isAuthenticated(), hasPermission()
  - Add token storage using SecureStorageService
  - Add role permission loading from RoleService
  - _Requirements: 1.3, 1.6, 1.8, 1.9, 1.10_

- [ ]* 3.1 Write property test for token storage and clearing
  - **Property 1: Authentication Round Trip** (token aspect)
  - **Validates: Requirements 1.8, 1.10**


- [x] 4. Implement dashboard and navigation
  - [x] 4.1 Create TabNavigation component with four tabs
    - Implement Ionic tab bar with home, services, balance, profile tabs
    - Add tab switching logic with active state management
    - Implement swipe gesture navigation between tabs
    - Add keyboard shortcuts for tab navigation (Ctrl+1-4)
    - _Requirements: 2.1, 2.5, 2.6, 2.7_

  - [ ]* 4.2 Write property test for navigation tab consistency
    - **Property 5: Navigation Tab Consistency**
    - **Validates: Requirements 2.5, 2.7**

  - [ ]* 4.3 Write property test for gesture navigation
    - **Property 6: Gesture Navigation**
    - **Validates: Requirements 2.6**

  - [x] 4.4 Create DashboardView component
    - Implement welcome screen for unauthenticated users
    - Implement dashboard with statistics for authenticated users
    - Load and display real-time stats (services, income, expenses)
    - Implement role-based data filtering (TAXISTA vs PATRON)
    - Display recent activity list with service details
    - Add pull-to-refresh functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.8, 2.10_

  - [ ]* 4.5 Write property test for role-based data filtering
    - **Property 4: Role-Based Data Filtering**
    - **Validates: Requirements 2.3, 2.4, 3.1, 7.1, 7.2, 7.3, 7.9, 7.10**

  - [ ]* 4.6 Write property test for pull-to-refresh
    - **Property 28: Pull-to-Refresh Data Reload**
    - **Validates: Requirements 2.10**

  - [x] 4.7 Create StatsCard component for displaying statistics
    - Implement reusable stat card with icon, value, and label
    - Add Ionic card styling
    - Support different themes
    - _Requirements: 2.2_

  - [x] 4.8 Create FABButton component for quick actions
    - Implement Ionic FAB button positioned at bottom right
    - Add action sheet with options (Nuevo Servicio, Nuevo Gasto, Ver Reportes)
    - Connect actions to respective modals
    - _Requirements: 2.9, 10.5_

- [x] 5. Checkpoint - Ensure authentication and navigation work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement service management components
  - [x] 6.1 Create ServiceListView component
    - Implement service list with Ionic items
    - Add role-based filtering (TAXISTA: own services, PATRON: all associated)
    - Implement search, filter, and sort controls
    - Display service statistics
    - Add handlers for add, edit, delete actions
    - Implement pull-to-refresh
    - _Requirements: 3.1, 3.6, 3.9, 3.10_

  - [ ]* 6.2 Write property test for service filter consistency
    - **Property 10: Service Filter Consistency**
    - **Validates: Requirements 3.10**

  - [ ]* 6.3 Write property test for payment type icon display
    - **Property 9: Payment Type Icon Display**
    - **Validates: Requirements 3.9**

  - [x] 6.4 Create ServiceFormModal component
    - Implement Ionic modal with service form fields
    - Add date, time, amount, payment type, platform fields
    - Implement conditional platform field (shown when payment type is "app")
    - Add articulated service checkbox
    - Add commission, incentives, tips fields for app payments
    - Add commission paidBy selector
    - Implement form validation
    - Handle create and edit modes
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.7, 3.12_

  - [ ]* 6.5 Write property test for service form validation
    - **Property 7: Service Form Validation**
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 6.6 Write property test for service CRUD persistence
    - **Property 8: Service CRUD Persistence**
    - **Validates: Requirements 3.5, 3.6, 3.7, 3.8**

  - [ ]* 6.7 Write property test for form pre-fill consistency
    - **Property 26: Form Pre-Fill Consistency**
    - **Validates: Requirements 3.7, 4.7**

  - [ ]* 6.8 Write property test for deletion confirmation
    - **Property 27: Deletion Confirmation**
    - **Validates: Requirements 3.8, 4.8**

- [x] 7. Implement ReconcileAdapter for service operations
  - Create ReconcileAdapter class
  - Implement getServices() with role-based filtering
  - Implement createService(), updateService(), deleteService()
  - Add offline operation queueing via DataSyncService
  - Connect to ReconciliationStorageManager
  - _Requirements: 3.1, 3.5, 3.6, 3.11_

- [ ]* 7.1 Write property test for offline operation queueing
  - **Property 22: Offline Operation Queueing**
  - **Validates: Requirements 3.11, 4.10, 8.2, 8.3, 8.4, 8.5**

- [x] 8. Implement expense management components
  - [x] 8.1 Create ExpenseListView component
    - Implement expense list with Ionic items
    - Add role-based filtering
    - Implement search, filter by category, and sort controls
    - Display category statistics
    - Add handlers for add, edit, delete actions
    - Implement pull-to-refresh
    - _Requirements: 4.1, 4.6, 4.8_

  - [ ]* 8.2 Write property test for category icon display
    - **Property 13: Category Icon Display**
    - **Validates: Requirements 4.4**

  - [x] 8.3 Create ExpenseFormModal component
    - Implement Ionic modal with expense form fields
    - Add date, concept, amount, category fields
    - Add paidBy selector (shared, driver, owner)
    - Implement form validation
    - Handle create and edit modes
    - _Requirements: 4.2, 4.3, 4.5, 4.7, 4.9_

  - [ ]* 8.4 Write property test for expense form validation
    - **Property 11: Expense Form Validation**
    - **Validates: Requirements 4.3**

  - [ ]* 8.5 Write property test for expense CRUD persistence
    - **Property 12: Expense CRUD Persistence**
    - **Validates: Requirements 4.5, 4.6, 4.7, 4.8**

- [x] 9. Extend ReconcileAdapter for expense operations
  - Implement getExpenses() with role-based filtering
  - Implement createExpense(), updateExpense(), deleteExpense()
  - Add offline operation queueing
  - _Requirements: 4.1, 4.5, 4.6, 4.10_

- [x] 10. Checkpoint - Ensure service and expense management work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement balance and reconciliation components
  - [x] 11.1 Create ReconciliationView component
    - Implement configuration view with settlement type selector
    - Add percentage and fixed amount input modes
    - Add client name input
    - Implement generate reconciliation button
    - Create results view with summary statistics
    - Display final distribution (driver amount, owner amount)
    - Display individual deductions
    - Add save reconciliation button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ]* 11.2 Write property test for reconciliation calculation accuracy
    - **Property 14: Reconciliation Calculation Accuracy**
    - **Validates: Requirements 5.5, 5.6, 5.7**

  - [ ]* 11.3 Write property test for reconciliation persistence
    - **Property 15: Reconciliation Persistence**
    - **Validates: Requirements 5.9, 5.10**

  - [x] 11.4 Create ReconciliationHistoryView component
    - Implement list of saved reconciliations
    - Add role-based filtering (TAXISTA: own, PATRON: all associated)
    - Display reconciliation details (client, period, amounts)
    - Add delete functionality with confirmation
    - _Requirements: 5.10, 5.11, 5.12_

  - [ ]* 11.5 Write property test for role-based reconciliation access
    - **Property 16: Role-Based Reconciliation Access**
    - **Validates: Requirements 5.11, 5.12**

- [x] 12. Extend ReconcileAdapter for reconciliation operations
  - Implement getReconciliations() with role-based filtering
  - Implement saveReconciliation(), deleteReconciliation()
  - Connect to CalculationEngine for reconciliation generation
  - _Requirements: 5.5, 5.9, 5.10_

- [x] 13. Implement profile management components
  - [x] 13.1 Create ProfileView component
    - Implement profile options list (View Profile, Change Password, Privacy, Logout)
    - Add handlers for each option
    - Implement logout confirmation
    - _Requirements: 6.1, 6.3, 6.6, 6.7_

  - [x] 13.2 Create ProfileDetailModal component
    - Display user information (name, email, phone, role)
    - Display role-specific info (taxi number for TAXISTA, associated taxistas for PATRON)
    - _Requirements: 6.2, 6.8, 6.9_

  - [ ]* 13.3 Write property test for profile display consistency
    - **Property 19: Profile Display Consistency**
    - **Validates: Requirements 6.8, 6.9**

  - [x] 13.4 Create ChangePasswordModal component
    - Implement password change form with current, new, confirm fields
    - Add form validation (minimum 8 characters, passwords match)
    - Validate current password before updating
    - Connect to AuthAdapter.changePassword()
    - _Requirements: 6.3, 6.4_

  - [ ]* 13.5 Write property test for password change validation
    - **Property 17: Password Change Validation**
    - **Validates: Requirements 6.4**

  - [ ]* 13.6 Write property test for sensitive data confirmation
    - **Property 18: Sensitive Data Confirmation**
    - **Validates: Requirements 6.5**

- [x] 14. Implement role-based access control
  - [x] 14.1 Enhance RoleService integration
    - Ensure all data filtering uses RoleService.filterDataByRole()
    - Implement permission validation before operations
    - Add access denial for TAXISTA viewing other drivers' data
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7, 7.8_

  - [ ]* 14.2 Write property test for access control enforcement
    - **Property 20: Access Control Enforcement**
    - **Validates: Requirements 7.4, 7.7, 7.8**

  - [x] 14.3 Implement association management
    - Add confirmation flow for creating associations
    - Add notification for removing associations
    - Ensure data integrity during association changes
    - _Requirements: 7.5, 7.6_

  - [ ]* 14.4 Write property test for association management
    - **Property 21: Association Management**
    - **Validates: Requirements 7.5, 7.6**

- [x] 15. Checkpoint - Ensure all features work with role-based access
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement offline functionality
  - [ ] 16.1 Set up DataSyncService integration
    - Initialize DataSyncService with SecureStorageService and RoleService
    - Configure sync settings (retry count, batch size, conflict resolution)
    - Set up network status monitoring
    - _Requirements: 8.1, 8.6, 8.7, 8.8_

  - [ ] 16.2 Implement offline operation queueing
    - Add queueing for all create, update, delete operations
    - Set operation priorities based on type and user role
    - Store queued operations in SecureStorageService
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [ ] 16.3 Implement synchronization logic
    - Add automatic sync when connection is restored
    - Process operations in priority order
    - Implement conflict detection and resolution
    - Display sync status indicator
    - _Requirements: 8.6, 8.7, 8.8, 8.9_

  - [ ]* 16.4 Write property test for online synchronization
    - **Property 23: Online Synchronization**
    - **Validates: Requirements 8.6, 8.7, 8.8**

  - [ ] 16.5 Implement offline data access
    - Ensure critical data is cached in SecureStorageService
    - Configure Service Worker to cache essential assets
    - Add offline data retrieval logic
    - _Requirements: 8.11, 8.12_

  - [ ]* 16.6 Write property test for offline data access
    - **Property 24: Offline Data Access**
    - **Validates: Requirements 8.11, 8.12**

  - [ ] 16.7 Create sync queue view
    - Display pending operations with details
    - Show operation status and retry count
    - Add manual retry and cancel options
    - _Requirements: 8.10_

  - [ ]* 16.8 Write property test for sync status visibility
    - **Property 25: Sync Status Visibility**
    - **Validates: Requirements 8.9, 8.10**

- [x] 17. Implement theme and appearance features
  - [x] 17.1 Create theme toggle functionality
    - Detect device preferred color scheme on load
    - Implement theme toggle button
    - Apply theme to all Ionic components
    - Persist theme preference in LocalStorage
    - Add smooth transition animations
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.8_

  - [x] 17.2 Configure CSS custom properties for theming
    - Define light and dark theme color variables
    - Apply variables to all custom components
    - Ensure consistency with Ionic theme
    - _Requirements: 9.6, 9.7, 9.9, 9.10_

- [x] 18. Implement UX enhancements
  - [x] 18.1 Add loading indicators
    - Implement LoadingManager for async operations
    - Show loading during login, save, delete, sync
    - Hide loading on operation completion
    - _Requirements: 10.1, 10.7_

  - [ ]* 18.2 Write property test for loading indicator display
    - **Property 30: Loading Indicator Display**
    - **Validates: Requirements 10.1**

  - [x] 18.3 Add toast notifications
    - Implement ToastManager for success/error messages
    - Show toasts for operation completions
    - Use appropriate colors (success: green, error: red, warning: yellow)
    - _Requirements: 10.2, 10.10_

  - [ ]* 18.4 Write property test for toast notification display
    - **Property 31: Toast Notification Display**
    - **Validates: Requirements 10.2**

  - [x] 18.5 Add haptic feedback (if supported)
    - Implement haptic feedback for button taps
    - Check for device support before triggering
    - _Requirements: 10.3_

  - [x] 18.6 Implement modal animations
    - Add smooth slide-up animations for modals
    - Configure 300ms transition duration
    - _Requirements: 10.4, 10.11_

  - [x] 18.7 Implement action sheets
    - Create ActionSheetManager for action selection
    - Use for menu options and FAB actions
    - _Requirements: 10.5_

  - [x] 18.8 Add form validation feedback
    - Implement real-time validation for all forms
    - Highlight invalid fields with error messages
    - _Requirements: 10.9_

  - [x] 18.9 Add keyboard viewport adjustment
    - Adjust viewport when keyboard appears
    - Keep inputs visible during typing
    - _Requirements: 10.12_

- [x] 19. Implement data persistence and security
  - [x] 19.1 Set up SecureStorageService integration
    - Configure encryption for sensitive data
    - Store authentication tokens securely
    - Implement data integrity validation
    - _Requirements: 11.1, 11.5, 11.6_

  - [ ]* 19.2 Write property test for data encryption
    - **Property 32: Data Encryption**
    - **Validates: Requirements 11.1, 11.5**

  - [ ]* 19.3 Write property test for storage integrity validation
    - **Property 33: Storage Integrity Validation**
    - **Validates: Requirements 11.6, 14.9**

  - [x] 19.2 Implement data persistence
    - Persist services, expenses, reconciliations in LocalStorage
    - Add timestamps for synchronization
    - _Requirements: 11.2, 11.3, 11.4, 11.10_

  - [x] 19.3 Implement storage cleanup
    - Add automatic cleanup when quota is exceeded
    - Remove old data (>6 months)
    - Handle missing data gracefully
    - _Requirements: 11.7, 11.8_

  - [x] 19.4 Implement token refresh
    - Add automatic token refresh on expiration
    - Use refresh token from SecureStorageService
    - Handle refresh failures gracefully
    - _Requirements: 11.9_

  - [ ]* 19.5 Write property test for token refresh
    - **Property 34: Token Refresh**
    - **Validates: Requirements 11.9**

- [x] 20. Integrate RGPD compliance
  - [x] 20.1 Create RGPDAdapter
    - Connect to existing RGPD_Manager
    - Implement consent dialog display
    - Implement data export functionality
    - Implement data deletion functionality
    - _Requirements: 12.1, 12.3, 12.4_

  - [x] 20.2 Add RGPD UI integration
    - Display consent dialogs on first access
    - Add privacy settings in profile
    - Link to privacy policy and terms pages
    - _Requirements: 12.2, 12.7, 12.8_

  - [x] 20.3 Implement RGPD audit logging
    - Log sensitive operations with timestamps
    - Record profile data changes
    - Ensure minimal data collection
    - _Requirements: 12.5, 12.6, 12.9, 12.10_

- [x] 21. Checkpoint - Ensure all integrations work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Implement performance optimizations
  - [x] 22.1 Add lazy loading for components
    - Implement lazy loading for modals
    - Load components on demand
    - _Requirements: 13.1, 13.4_

  - [x] 22.2 Implement virtual scrolling for lists
    - Add Ionic virtual scroll to service and expense lists
    - Configure for large datasets
    - _Requirements: 13.3_

  - [x] 22.3 Add caching for computed values
    - Cache statistics calculations
    - Cache filtered lists
    - Implement memoization
    - _Requirements: 13.5, 13.8_

  - [x] 22.4 Configure Service Worker caching
    - Cache critical assets (HTML, CSS, JS, icons)
    - Implement cache-first strategy for static assets
    - _Requirements: 13.7_

  - [x] 22.5 Optimize network requests
    - Implement request debouncing for search
    - Add response caching
    - _Requirements: 13.8_

  - [x] 22.6 Ensure smooth animations
    - Verify 60fps frame rate for all animations
    - Optimize animation performance
    - _Requirements: 13.6_

- [x] 23. Implement error handling
  - [x] 23.1 Create ErrorHandler utility
    - Implement error categorization (network, validation, auth, storage, sync)
    - Add error-specific handling logic
    - Implement recovery mechanisms
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [x] 23.2 Add error recovery features
    - Implement automatic retry with exponential backoff
    - Add data recovery for corrupted data
    - Implement graceful degradation
    - Preserve unsaved data in LocalStorage
    - _Requirements: 14.5, 14.8, 14.9, 14.10_

- [x] 24. Implement accessibility features
  - [x] 24.1 Add ARIA labels to components
    - Add labels to all Ionic components
    - Ensure proper semantic HTML
    - _Requirements: 15.1_

  - [x] 24.2 Ensure touch target sizes
    - Verify minimum 44x44px for all interactive elements
    - Adjust button and link sizes if needed
    - _Requirements: 15.2_

  - [x] 24.3 Verify color contrast
    - Check all text meets WCAG AA contrast ratios
    - Adjust colors if needed
    - _Requirements: 15.3_

  - [x] 24.4 Add form accessibility
    - Associate labels with inputs
    - Add descriptive error messages
    - _Requirements: 15.4, 15.6_

  - [x] 24.5 Implement keyboard navigation
    - Ensure full keyboard navigation support
    - Add visible focus indicators
    - _Requirements: 15.7, 15.8_

  - [x] 24.6 Add screen reader support
    - Announce page changes
    - Announce errors
    - Use ARIA live regions for dynamic content
    - Add alt text to images
    - _Requirements: 15.5, 15.6, 15.9, 15.10_

- [ ] 25. Write integration tests
  - [ ]* 25.1 Write integration test for authentication flow
    - Test complete login, register, logout flow
    - **Validates: Requirements 1.1-1.10**

  - [ ]* 25.2 Write integration test for service management flow
    - Test create, edit, delete service flow
    - **Validates: Requirements 3.1-3.12**

  - [ ]* 25.3 Write integration test for expense management flow
    - Test create, edit, delete expense flow
    - **Validates: Requirements 4.1-4.10**

  - [ ]* 25.4 Write integration test for reconciliation flow
    - Test configure, generate, save reconciliation flow
    - **Validates: Requirements 5.1-5.12**

  - [ ]* 25.5 Write integration test for offline sync flow
    - Test offline operations and synchronization
    - **Validates: Requirements 8.1-8.12**

- [x] 26. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 27. Create PWA manifest and icons
  - Create web app manifest with app metadata
  - Generate icons for all device sizes (192x192, 512x512)
  - Configure splash screens for iOS/Android
  - Set up installability prompts
  - _Requirements: 13.7_

- [x] 28. Documentation and deployment preparation
  - Write README with setup instructions
  - Document API integration points
  - Create deployment guide
  - Configure hosting settings (cache headers, compression)
  - Set up error tracking and monitoring

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate complete user flows
- All tests should reference their corresponding design document properties
