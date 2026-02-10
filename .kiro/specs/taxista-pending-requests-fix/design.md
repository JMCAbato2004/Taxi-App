# Design Document: Taxista Pending Requests Fix

## Overview

This design addresses the inconsistencies in the taxista registration flow by ensuring atomic and consistent handling of pending join requests. The current implementation has a race condition where taxistas are initially created with estado='independiente' in AuthAdapter.register(), and then RegisterModal.createJoinRequest() attempts to update the status to 'solicitando', which may not persist correctly.

The fix ensures that:
1. User creation and join request creation happen atomically
2. The correct initial status is set based on whether an invitation code is provided
3. Patron approval/rejection updates are atomic
4. The UI correctly reflects the current state at all times

## Architecture

The system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │RegisterModal │  │FleetMgmtView │  │DashboardView │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Adapter Layer                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │            AuthAdapter                           │   │
│  │  - register()                                    │   │
│  │  - getCurrentUser()                              │   │
│  │  - updateCurrentUser()                           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Storage Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  taxi_users  │  │taxi_join_    │  │taxi_auth_    │  │
│  │              │  │  requests    │  │current_user  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Atomic Operations**: User creation and join request creation will be handled in a single transaction-like operation
2. **Status-First Approach**: The user's initial estado will be set correctly during creation, not updated afterward
3. **Centralized State Management**: All status updates will go through AuthAdapter to ensure consistency
4. **Immediate Persistence**: Changes will be persisted to localStorage immediately and synchronously

## Components and Interfaces

### AuthAdapter

The AuthAdapter is responsible for user registration and authentication. It will be modified to handle the invitation code logic during registration.

**Modified Method: register(userData)**

```javascript
async register(userData) {
  // Determine initial status based on invitation code
  let initialStatus = 'independiente';
  let patronIdSolicitado = null;
  
  if (userData.rol === 'TAXISTA' && userData.codigoPatron) {
    // Validate invitation code
    const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
    const patron = users.find(u => 
      u.rol === 'PATRON' && 
      u.codigoInvitacion === userData.codigoPatron
    );
    
    if (!patron) {
      throw new Error('Código de invitación inválido');
    }
    
    initialStatus = 'solicitando';
    patronIdSolicitado = patron.id;
  }
  
  // Create user with correct initial status
  const user = {
    id: 'user-' + Date.now(),
    email: userData.email,
    nombre: userData.nombre,
    telefono: userData.telefono,
    rol: userData.rol,
    numeroTaxista: userData.rol === 'TAXISTA' ? 'T-' + Math.floor(Math.random() * 1000) : null,
    codigoInvitacion: userData.rol === 'PATRON' ? this.generateInvitationCode() : null,
    estado: initialStatus,
    patronIdSolicitado: patronIdSolicitado,
    activo: true,
    fechaCreacion: new Date().toISOString()
  };
  
  // Save user
  const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
  users.push(user);
  localStorage.setItem('taxi_users', JSON.stringify(users));
  
  // If taxista with invitation code, create join request
  if (userData.rol === 'TAXISTA' && userData.codigoPatron && patronIdSolicitado) {
    const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
    
    const newRequest = {
      id: Date.now(),
      taxistaId: user.id,
      patronId: patronIdSolicitado,
      estado: 'pendiente',
      fechaSolicitud: new Date().toISOString()
    };
    
    requests.push(newRequest);
    localStorage.setItem('taxi_join_requests', JSON.stringify(requests));
  }
  
  // Auto-login
  this.currentUser = user;
  this.currentToken = 'token-' + user.id + '-' + Date.now();
  this.storeInLocalStorage(user, this.currentToken, ['VIEW_OWN_DATA']);
  
  return user;
}
```

**New Method: approveJoinRequest(requestId)**

```javascript
async approveJoinRequest(requestId) {
  const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
  const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
  
  const request = requests.find(r => r.id === requestId);
  if (!request) {
    throw new Error('Solicitud no encontrada');
  }
  
  const taxista = users.find(u => u.id === request.taxistaId);
  if (!taxista) {
    throw new Error('Taxista no encontrado');
  }
  
  // Update request
  request.estado = 'aprobada';
  request.fechaAprobacion = new Date().toISOString();
  
  // Update taxista
  taxista.estado = 'asociado';
  taxista.patronId = request.patronId;
  delete taxista.patronIdSolicitado;
  
  // Save atomically
  localStorage.setItem('taxi_join_requests', JSON.stringify(requests));
  localStorage.setItem('taxi_users', JSON.stringify(users));
  
  // Update current user if it's the taxista
  if (this.currentUser && this.currentUser.id === taxista.id) {
    this.currentUser = taxista;
    localStorage.setItem('taxi_auth_current_user', JSON.stringify(taxista));
  }
  
  return { request, taxista };
}
```

**New Method: rejectJoinRequest(requestId)**

```javascript
async rejectJoinRequest(requestId) {
  const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
  const users = JSON.parse(localStorage.getItem('taxi_users') || '[]');
  
  const request = requests.find(r => r.id === requestId);
  if (!request) {
    throw new Error('Solicitud no encontrada');
  }
  
  const taxista = users.find(u => u.id === request.taxistaId);
  if (!taxista) {
    throw new Error('Taxista no encontrado');
  }
  
  // Update request
  request.estado = 'rechazada';
  request.fechaRechazo = new Date().toISOString();
  
  // Update taxista
  taxista.estado = 'independiente';
  delete taxista.patronId;
  delete taxista.patronIdSolicitado;
  
  // Save atomically
  localStorage.setItem('taxi_join_requests', JSON.stringify(requests));
  localStorage.setItem('taxi_users', JSON.stringify(users));
  
  // Update current user if it's the taxista
  if (this.currentUser && this.currentUser.id === taxista.id) {
    this.currentUser = taxista;
    localStorage.setItem('taxi_auth_current_user', JSON.stringify(taxista));
  }
  
  return { request, taxista };
}
```

### RegisterModal

The RegisterModal will be simplified to remove the createJoinRequest method, as this logic is now handled by AuthAdapter.

**Modified Method: handleSubmit()**

```javascript
async handleSubmit() {
  // Validate form
  const errors = this.validateForm();
  
  if (Object.keys(errors).length > 0) {
    this.showErrors(errors);
    return;
  }
  
  await LoadingManager.show('Creando cuenta...');
  
  try {
    // Prepare user data
    const userData = {
      nombre: this.formData.nombre.trim(),
      email: this.formData.email.trim(),
      telefono: this.formData.telefono.trim(),
      password: this.formData.password,
      rol: this.selectedRole
    };
    
    // Add invitation code for taxistas
    if (this.selectedRole === 'TAXISTA' && this.formData.codigoInvitacion) {
      userData.codigoPatron = this.formData.codigoInvitacion.trim().toUpperCase();
    }
    
    // Register (this now handles everything atomically)
    const user = await this.authAdapter.register(userData);
    
    await LoadingManager.hide();
    
    // Show success message
    let successMessage = '¡Cuenta creada exitosamente! Bienvenido.';
    if (this.selectedRole === 'TAXISTA' && userData.codigoPatron) {
      successMessage = '¡Cuenta creada! Solicitud de unión enviada al patrón.';
    }
    ToastManager.showSuccess(successMessage);
    
    // Close modal
    this.close();
    
    // Trigger registration success event
    this.onRegisterSuccess(user);
  } catch (error) {
    await LoadingManager.hide();
    const errorMessage = error.message || 'Error al crear la cuenta. Por favor, inténtalo de nuevo.';
    ToastManager.showError(errorMessage);
    console.error('Registration error:', error);
  }
}
```

**Removed Method: createJoinRequest()**

This method is no longer needed as the logic is now in AuthAdapter.register().

### App.js

The app.js file contains the global approveRequest and rejectRequest functions. These will be updated to use the new AuthAdapter methods.

**Modified Function: approveRequest(requestId)**

```javascript
approveRequest: async (requestId) => {
  try {
    await LoadingManager.show('Aprobando solicitud...');
    
    const result = await authAdapter.approveJoinRequest(requestId);
    
    await LoadingManager.hide();
    ToastManager.showSuccess(`Solicitud de ${result.taxista.nombre} aprobada`);
    
    // Refresh fleet management
    if (fleetManagementView) {
      const user = authAdapter.getCurrentUser();
      await fleetManagementView.loadFleet(user);
      await fleetManagementView.loadRequests(user);
    }
  } catch (error) {
    await LoadingManager.hide();
    console.error('Error approving request:', error);
    ToastManager.showError(error.message || 'Error al aprobar solicitud');
  }
}
```

**Modified Function: rejectRequest(requestId)**

```javascript
rejectRequest: async (requestId) => {
  try {
    await LoadingManager.show('Rechazando solicitud...');
    
    const result = await authAdapter.rejectJoinRequest(requestId);
    
    await LoadingManager.hide();
    ToastManager.showInfo(`Solicitud de ${result.taxista.nombre} rechazada`);
    
    // Refresh fleet management
    if (fleetManagementView) {
      const user = authAdapter.getCurrentUser();
      await fleetManagementView.loadFleet(user);
      await fleetManagementView.loadRequests(user);
    }
  } catch (error) {
    await LoadingManager.hide();
    console.error('Error rejecting request:', error);
    ToastManager.showError(error.message || 'Error al rechazar solicitud');
  }
}
```

## Data Models

### User Model

```javascript
{
  id: string,                    // Unique identifier
  email: string,                 // User email
  nombre: string,                // Full name
  telefono: string,              // Phone number
  rol: 'PATRON' | 'TAXISTA',    // User role
  numeroTaxista: string | null,  // Taxi number (taxistas only)
  codigoInvitacion: string | null, // Invitation code (patrons only)
  estado: 'independiente' | 'solicitando' | 'asociado', // Association status
  patronId: string | null,       // Associated patron ID (when asociado)
  patronIdSolicitado: string | null, // Requested patron ID (when solicitando)
  activo: boolean,               // Active status
  fechaCreacion: string          // ISO timestamp
}
```

**Status Transitions:**
- `independiente`: Initial state for taxistas without invitation code, or after rejection
- `solicitando`: Taxista has registered with invitation code, waiting for approval
- `asociado`: Patron has approved the request

### Join Request Model

```javascript
{
  id: number,                    // Unique identifier (timestamp)
  taxistaId: string,             // ID of the taxista
  patronId: string,              // ID of the patron
  estado: 'pendiente' | 'aprobada' | 'rechazada', // Request status
  fechaSolicitud: string,        // ISO timestamp of request creation
  fechaAprobacion: string | null, // ISO timestamp of approval (if approved)
  fechaRechazo: string | null    // ISO timestamp of rejection (if rejected)
}
```

**Status Transitions:**
- `pendiente`: Initial state when request is created
- `aprobada`: Patron has approved the request
- `rechazada`: Patron has rejected the request

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration with invitation code creates correct state

*For any* taxista registration with a valid invitation code, the system should create a user with estado='solicitando' and patronIdSolicitado set to the patron's ID, AND create a corresponding join request with estado='pendiente'.

**Validates: Requirements 1.1, 1.2, 3.1**

### Property 2: Registration without invitation code creates independent taxista

*For any* taxista registration without an invitation code, the system should create a user with estado='independiente' and no patronIdSolicitado or join request.

**Validates: Requirements 1.3**

### Property 3: Invalid invitation codes are rejected

*For any* taxista registration with an invalid invitation code, the system should reject the registration and throw an error, without creating a user or join request.

**Validates: Requirements 1.4**

### Property 4: Pending requests are filtered correctly

*For any* patron, querying pending requests should return only join requests with estado='pendiente' that have patronId matching the patron's ID.

**Validates: Requirements 2.1**

### Property 5: Pending request display contains required information

*For any* pending request rendering, the output should contain the taxista's name, email, phone number, and request date.

**Validates: Requirements 2.2**

### Property 6: Approval updates both request and taxista atomically

*For any* pending join request, when approved, both the request estado should be updated to 'aprobada' with fechaAprobacion set, AND the taxista's estado should be updated to 'asociado' with patronId set to the patron's ID.

**Validates: Requirements 2.3, 2.4, 3.2**

### Property 7: Rejection updates both request and taxista atomically

*For any* pending join request, when rejected, both the request estado should be updated to 'rechazada' with fechaRechazo set, AND the taxista's estado should be updated to 'independiente' with patronId cleared.

**Validates: Requirements 2.5, 2.6, 3.2**

### Property 8: Duplicate requests are prevented

*For any* taxista with a pending request for a specific patron, attempting to create another request for the same patron should be prevented.

**Validates: Requirements 3.3**

### Property 9: Solicitando status implies pending request exists

*For any* taxista with estado='solicitando', there must exist a corresponding join request with estado='pendiente' and matching taxistaId.

**Validates: Requirements 3.4**

### Property 10: Request status and taxista status are consistent

*For any* join request, if estado='aprobada' then the corresponding taxista should have estado='asociado' and patronId set; if estado='rechazada' then the taxista should have estado='independiente' and patronId cleared.

**Validates: Requirements 3.5**

### Property 11: Service filtering by taxista returns correct results

*For any* service filter applied to a specific taxista, all returned services should have userId matching that taxista's ID, and when no filter is applied, services from all associated taxistas should be returned.

**Validates: Requirements 4.2, 4.3**

### Property 12: Filter options only include associated taxistas

*For any* patron viewing filter options, only taxistas with estado='asociado' and patronId matching the patron's ID should appear in the filter options.

**Validates: Requirements 4.4**

## Error Handling

### Registration Errors

1. **Invalid Invitation Code**: When a taxista attempts to register with an invitation code that doesn't exist or doesn't belong to a patron, the system should:
   - Throw an error with message "Código de invitación inválido"
   - Not create a user record
   - Not create a join request
   - Display the error to the user via ToastManager

2. **Duplicate Email**: When attempting to register with an email that already exists:
   - Throw an error with message "El email ya está registrado"
   - Not create a user record
   - Display the error to the user

### Request Management Errors

1. **Request Not Found**: When attempting to approve/reject a non-existent request:
   - Throw an error with message "Solicitud no encontrada"
   - Not modify any data
   - Display the error to the user

2. **Taxista Not Found**: When a request references a taxista that doesn't exist:
   - Throw an error with message "Taxista no encontrado"
   - Not modify the request
   - Display the error to the user

### Data Consistency Errors

1. **Orphaned Request**: If a join request exists but the referenced taxista doesn't exist:
   - Log a warning
   - Skip the request in UI displays
   - Provide admin tools to clean up orphaned data

2. **Orphaned Status**: If a taxista has estado='solicitando' but no pending request exists:
   - Log a warning
   - Display a message to the user to contact support
   - Provide admin tools to fix inconsistent state

## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** will focus on:
- Specific examples of registration flows (with/without invitation codes)
- Edge cases like empty strings, special characters in invitation codes
- Error conditions (invalid codes, missing data)
- Integration between components (AuthAdapter → RegisterModal → FleetManagementView)
- UI rendering with specific data fixtures

**Property-Based Tests** will focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- State consistency across operations
- Atomicity of multi-step operations

### Property Test Configuration

- **Test Library**: fast-check (JavaScript property-based testing library)
- **Minimum Iterations**: 100 runs per property test
- **Tag Format**: Each property test must include a comment:
  ```javascript
  // Feature: taxista-pending-requests-fix, Property N: [property description]
  ```

### Test Organization

```
tests/
├── unit/
│   ├── auth-adapter.test.js
│   │   ├── register with invitation code
│   │   ├── register without invitation code
│   │   ├── approve request
│   │   ├── reject request
│   │   └── error cases
│   ├── register-modal.test.js
│   │   ├── form validation
│   │   ├── invitation code field visibility
│   │   └── submit handling
│   └── fleet-management-view.test.js
│       ├── pending requests display
│       ├── fleet list display
│       └── filter functionality
└── property/
    ├── registration-properties.test.js
    │   ├── Property 1: Registration with invitation code
    │   ├── Property 2: Registration without invitation code
    │   └── Property 3: Invalid invitation codes
    ├── request-management-properties.test.js
    │   ├── Property 4: Pending requests filtering
    │   ├── Property 6: Approval atomicity
    │   ├── Property 7: Rejection atomicity
    │   └── Property 8: Duplicate prevention
    ├── consistency-properties.test.js
    │   ├── Property 9: Solicitando implies pending request
    │   └── Property 10: Request and taxista status consistency
    └── filtering-properties.test.js
        ├── Property 11: Service filtering correctness
        └── Property 12: Filter options correctness
```

### Example Property Test

```javascript
// Feature: taxista-pending-requests-fix, Property 1: Registration with invitation code creates correct state
test('Property 1: Registration with invitation code creates correct state', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        nombre: fc.string({ minLength: 3, maxLength: 50 }),
        email: fc.emailAddress(),
        telefono: fc.string({ minLength: 9, maxLength: 15 }),
        password: fc.string({ minLength: 8, maxLength: 20 })
      }),
      async (taxistaData) => {
        // Setup: Create a patron with invitation code
        const patron = await createTestPatron();
        
        // Action: Register taxista with invitation code
        const userData = {
          ...taxistaData,
          rol: 'TAXISTA',
          codigoPatron: patron.codigoInvitacion
        };
        
        const user = await authAdapter.register(userData);
        
        // Assertions
        expect(user.estado).toBe('solicitando');
        expect(user.patronIdSolicitado).toBe(patron.id);
        
        // Verify join request was created
        const requests = JSON.parse(localStorage.getItem('taxi_join_requests') || '[]');
        const request = requests.find(r => r.taxistaId === user.id);
        
        expect(request).toBeDefined();
        expect(request.estado).toBe('pendiente');
        expect(request.patronId).toBe(patron.id);
        
        // Cleanup
        await cleanupTestData();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Manual Testing Checklist

- [ ] Register as taxista with valid invitation code → verify status is 'solicitando'
- [ ] Register as taxista without invitation code → verify status is 'independiente'
- [ ] Register as taxista with invalid code → verify error message
- [ ] Login as patron → verify pending requests appear in Fleet Management
- [ ] Approve a request → verify taxista status changes to 'asociado'
- [ ] Reject a request → verify taxista status changes to 'independiente'
- [ ] Login as taxista after approval → verify patron info is displayed
- [ ] Login as taxista after rejection → verify independent status is displayed
- [ ] Verify no duplicate requests can be created for same patron
- [ ] Verify service filtering works correctly in Fleet Management
