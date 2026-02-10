# Requirements Document

## Introduction

This document specifies the requirements for fixing the taxista registration flow to properly implement a pending requests system. Currently, the system has inconsistencies where taxistas are initially set to 'independiente' status during registration, and the subsequent status update to 'solicitando' may not persist correctly. This fix ensures an atomic and consistent flow where taxistas who register with a patron's invitation code enter a pending state until the patron approves or rejects their request.

## Glossary

- **Taxista**: A taxi driver user who can register services and expenses
- **Patron**: A fleet manager user who oversees multiple taxistas
- **Join_Request**: A request created when a taxista registers with a patron's invitation code
- **Registration_System**: The system component handling user registration
- **Auth_Adapter**: The authentication adapter managing user data and authentication state
- **Register_Modal**: The UI component for user registration
- **Fleet_Management_View**: The UI view where patrons manage their fleet and pending requests
- **Invitation_Code**: A 6-character code generated for patrons to share with taxistas
- **User_Status**: The estado field on a user indicating their association state (solicitando, asociado, independiente)
- **Request_Status**: The estado field on a join request indicating its state (pendiente, aprobada, rechazada)

## Requirements

### Requirement 1: Taxista Registration with Invitation Code

**User Story:** As a taxista, I want to register with my patron's invitation code, so that I can request to join their fleet.

#### Acceptance Criteria

1. WHEN a taxista registers with a valid invitation code, THE Registration_System SHALL create the user with estado='solicitando' and patronIdSolicitado set to the patron's ID
2. WHEN a taxista registers with a valid invitation code, THE Registration_System SHALL create a Join_Request with estado='pendiente'
3. WHEN a taxista registers without an invitation code, THE Registration_System SHALL create the user with estado='independiente'
4. WHEN a taxista registers with an invalid invitation code, THE Registration_System SHALL reject the registration and display an error message
5. THE Registration_System SHALL ensure the user creation and join request creation are atomic operations

### Requirement 2: Patron Request Management

**User Story:** As a patron, I want to see and manage pending join requests from taxistas, so that I can control who joins my fleet.

#### Acceptance Criteria

1. WHEN a patron views the Fleet_Management_View, THE System SHALL display all Join_Requests with estado='pendiente' for that patron
2. WHEN displaying a pending request, THE System SHALL show the taxista's name, email, phone number, and request date
3. WHEN a patron approves a Join_Request, THE System SHALL update the request estado to 'aprobada' and set fechaAprobacion
4. WHEN a patron approves a Join_Request, THE System SHALL update the taxista's estado to 'asociado' and set patronId to the patron's ID
5. WHEN a patron rejects a Join_Request, THE System SHALL update the request estado to 'rechazada' and set fechaRechazo
6. WHEN a patron rejects a Join_Request, THE System SHALL update the taxista's estado to 'independiente' and clear patronId

### Requirement 3: Request State Consistency

**User Story:** As a system administrator, I want the registration and request approval flow to be atomic and consistent, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN a taxista registers with an invitation code, THE System SHALL persist both the user record and join request before completing the registration
2. WHEN a patron approves or rejects a request, THE System SHALL update both the request status and taxista status atomically
3. IF a taxista has a pending request, THE System SHALL prevent creating duplicate requests for the same patron
4. WHEN a taxista's status is 'solicitando', THE System SHALL ensure a corresponding pending Join_Request exists
5. WHEN a Join_Request is approved or rejected, THE System SHALL ensure the taxista's status reflects the decision

### Requirement 4: Service Filtering by Taxista

**User Story:** As a patron, I want to filter services by taxista, so that I can view individual driver performance.

#### Acceptance Criteria

1. WHEN a patron views services in the Fleet_Management_View, THE System SHALL provide a filter option to select a specific taxista
2. WHEN a taxista filter is applied, THE System SHALL display only services created by that taxista
3. WHEN no filter is applied, THE System SHALL display services from all associated taxistas
4. THE System SHALL only show taxistas with estado='asociado' in the filter options

### Requirement 5: User Status Visibility

**User Story:** As a taxista, I want to see my current association status, so that I know whether my request is pending, approved, or if I'm independent.

#### Acceptance Criteria

1. WHEN a taxista with estado='solicitando' logs in, THE System SHALL display a message indicating their request is pending approval
2. WHEN a taxista with estado='asociado' logs in, THE System SHALL display their patron's information
3. WHEN a taxista with estado='independiente' logs in, THE System SHALL display that they are operating independently
4. THE System SHALL update the displayed status immediately after a patron approves or rejects a request
