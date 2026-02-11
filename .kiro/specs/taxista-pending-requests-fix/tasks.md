# Implementation Plan: Taxista Pending Requests Fix

## Overview

This implementation plan fixes the taxista registration flow to properly handle pending join requests. The changes ensure atomic operations, correct initial status assignment, and consistent state management throughout the registration and approval/rejection flow.

## Tasks

- [ ] 1. Update AuthAdapter.register() to handle invitation codes atomically
  - Modify the register method to determine initial status based on invitation code
  - Add validation for invitation codes during registration
  - Create join request atomically with user creation when invitation code is provided
  - Ensure user is created with correct estado ('solicitando' or 'independiente')
  - Set patronIdSolicitado when invitation code is provided
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_

- [ ]* 1.1 Write property test for registration with invitation code
  - **Property 1: Registration with invitation code creates correct state**
  - **Validates: Requirements 1.1, 1.2, 3.1**

- [ ]* 1.2 Write property test for registration without invitation code
  - **Property 2: Registration without invitation code creates independent taxista**
  - **Validates: Requirements 1.3**

- [ ]* 1.3 Write property test for invalid invitation code rejection
  - **Property 3: Invalid invitation codes are rejected**
  - **Validates: Requirements 1.4**

- [ ] 2. Add approveJoinRequest() method to AuthAdapter
  - Create new method to handle request approval
  - Update request estado to 'aprobada' and set fechaAprobacion
  - Update taxista estado to 'asociado' and set patronId
  - Clear patronIdSolicitado from taxista
  - Ensure atomic updates to both request and user records
  - Update currentUser if the approved taxista is logged in
  - _Requirements: 2.3, 2.4, 3.2_

- [ ]* 2.1 Write property test for approval atomicity
  - **Property 6: Approval updates both request and taxista atomically**
  - **Validates: Requirements 2.3, 2.4, 3.2**

- [ ] 3. Add rejectJoinRequest() method to AuthAdapter
  - Create new method to handle request rejection
  - Update request estado to 'rechazada' and set fechaRechazo
  - Update taxista estado to 'independiente'
  - Clear patronId and patronIdSolicitado from taxista
  - Ensure atomic updates to both request and user records
  - Update currentUser if the rejected taxista is logged in
  - _Requirements: 2.5, 2.6, 3.2_

- [ ]* 3.1 Write property test for rejection atomicity
  - **Property 7: Rejection updates both request and taxista atomically**
  - **Validates: Requirements 2.5, 2.6, 3.2**

- [ ] 4. Simplify RegisterModal.handleSubmit()
  - Remove the createJoinRequest() method call (now handled by AuthAdapter)
  - Update handleSubmit to pass codigoPatron in userData
  - Ensure proper error handling for invalid invitation codes
  - Update success messages based on registration type
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 4.1 Write unit tests for RegisterModal form submission
  - Test submission with invitation code
  - Test submission without invitation code
  - Test error handling for invalid codes
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 5. Remove RegisterModal.createJoinRequest() method
  - Delete the createJoinRequest method entirely
  - Verify no other code references this method
  - _Requirements: 1.1, 1.2_

- [ ] 6. Update app.js approveRequest() function
  - Replace inline logic with call to authAdapter.approveJoinRequest()
  - Add proper error handling and loading states
  - Update success message to include taxista name
  - Refresh FleetManagementView after approval
  - _Requirements: 2.3, 2.4_

- [ ]* 6.1 Write unit tests for approveRequest function
  - Test successful approval flow
  - Test error handling
  - Test UI refresh after approval
  - _Requirements: 2.3, 2.4_

- [ ] 7. Update app.js rejectRequest() function
  - Replace inline logic with call to authAdapter.rejectJoinRequest()
  - Add proper error handling and loading states
  - Update info message to include taxista name
  - Refresh FleetManagementView after rejection
  - _Requirements: 2.5, 2.6_

- [ ]* 7.1 Write unit tests for rejectRequest function
  - Test successful rejection flow
  - Test error handling
  - Test UI refresh after rejection
  - _Requirements: 2.5, 2.6_

- [ ] 8. Add duplicate request prevention
  - Update AuthAdapter.register() to check for existing pending requests
  - Prevent creating duplicate requests for the same patron
  - Return appropriate error message if duplicate detected
  - _Requirements: 3.3_

- [ ]* 8.1 Write property test for duplicate prevention
  - **Property 8: Duplicate requests are prevented**
  - **Validates: Requirements 3.3**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify registration flow works correctly
  - Verify approval/rejection flow works correctly
  - Ask the user if questions arise

- [ ] 10. Add data consistency validation
  - Create utility function to validate taxista status matches request status
  - Add validation for 'solicitando' status having corresponding pending request
  - Add validation for approved/rejected requests having correct taxista status
  - _Requirements: 3.4, 3.5_

- [ ]* 10.1 Write property tests for consistency invariants
  - **Property 9: Solicitando status implies pending request exists**
  - **Property 10: Request status and taxista status are consistent**
  - **Validates: Requirements 3.4, 3.5**

- [ ] 11. Update FleetManagementView to display pending requests correctly
  - Verify loadRequests() filters by estado='pendiente' and patronId
  - Ensure renderRequests() displays all required information (name, email, phone, date)
  - Test with various request states
  - _Requirements: 2.1, 2.2_

- [ ]* 11.1 Write property test for pending request filtering
  - **Property 4: Pending requests are filtered correctly**
  - **Validates: Requirements 2.1**

- [ ]* 11.2 Write property test for request display information
  - **Property 5: Pending request display contains required information**
  - **Validates: Requirements 2.2**

- [ ] 12. Implement service filtering by taxista (if not already working)
  - Add filter dropdown to FleetManagementView or relevant view
  - Implement filter logic to show only services from selected taxista
  - Ensure filter options only include taxistas with estado='asociado'
  - Show all services when no filter is applied
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 12.1 Write property tests for service filtering
  - **Property 11: Service filtering by taxista returns correct results**
  - **Property 12: Filter options only include associated taxistas**
  - **Validates: Requirements 4.2, 4.3, 4.4**

- [ ] 13. Add user status visibility in UI
  - Update dashboard or profile view to show current status for taxistas
  - Display "Solicitud pendiente" message for estado='solicitando'
  - Display patron information for estado='asociado'
  - Display "Operando independientemente" for estado='independiente'
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 13.1 Write unit tests for status display
  - Test display for 'solicitando' status
  - Test display for 'asociado' status
  - Test display for 'independiente' status
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 14. Final checkpoint - Integration testing
  - Test complete registration flow with invitation code
  - Test complete registration flow without invitation code
  - Test complete approval flow from patron perspective
  - Test complete rejection flow from patron perspective
  - Verify UI updates correctly after all operations
  - Ensure all tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation focuses on atomicity and consistency to fix the current race condition
