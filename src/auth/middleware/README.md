# Authorization Middleware

Comprehensive authorization middleware for role-based access control, security logging, and data encryption.

## Overview

The Authorization Middleware provides:

- **Permission Validation**: Role-based access control with fine-grained permissions
- **Access Logging**: Comprehensive logging of all access attempts (successful and failed)
- **Data Encryption**: Encryption/decryption of sensitive data fields
- **Security Monitoring**: Statistics and monitoring for suspicious activity
- **Integration Helpers**: High-level integration methods for easy adoption

## Requirements Fulfilled

- **Requirement 6.1**: Permission validation before accessing functionalities
- **Requirement 6.2**: Logging of unauthorized access attempts
- **Requirement 6.5**: Encryption of sensitive data

## Core Components

### AuthorizationMiddleware

Main middleware class that handles:
- Permission checking based on user roles
- Access attempt logging
- Data access validation
- Sensitive data encryption/decryption
- Security statistics and monitoring

### MiddlewareIntegration

High-level integration service that provides:
- Protected operation execution
- Data filtering based on permissions
- Simplified authorization workflows

## Usage Examples

### Basic Permission Check

```typescript
import { AuthorizationMiddleware, createAuthorizationContext } from './middleware';
import { Permission } from './types';

const middleware = new AuthorizationMiddleware();

const context = createAuthorizationContext(
  currentUser,
  'associations',
  'create',
  Permission.MANAGE_ASSOCIATIONS
);

const result = await middleware.authorize(context);
if (result.authorized) {
  // Proceed with operation
} else {
  // Handle unauthorized access
  throw result.error;
}
```

### Protected Operations

```typescript
import { MiddlewareIntegration } from './middleware';

const integration = new MiddlewareIntegration();

const result = await integration.requirePermission(
  currentUser,
  {
    permission: Permission.MANAGE_ASSOCIATIONS,
    resource: 'associations',
    action: 'create'
  },
  async () => {
    // Your protected operation here
    return createAssociation(patronId, taxistaId);
  }
);
```

### Data Filtering

```typescript
const filteredData = await integration.validateAndFilterData(
  currentUser,
  allData,
  Permission.VIEW_OWN_DATA,
  'operational-data'
);
```

### Data Encryption

```typescript
const encryptedData = await middleware.encryptSensitiveData(
  userData,
  {
    encryptFields: ['email', 'telefono'],
    skipEncryption: false
  }
);
```

### Security Monitoring

```typescript
// Get access logs
const logs = middleware.getAccessLog({
  userId: 'specific_user',
  success: false, // Only failed attempts
  limit: 50
});

// Get security statistics
const stats = middleware.getSecurityStatistics('day');
console.log(`Failed attempts: ${stats.failedAttempts}`);
console.log(`Suspicious activity: ${stats.suspiciousActivity.length}`);
```

## Permission System

### Available Permissions

**Patron Permissions:**
- `VIEW_ALL_DRIVERS`: View all associated taxistas
- `MANAGE_ASSOCIATIONS`: Create/remove associations
- `VIEW_AGGREGATED_REPORTS`: View aggregated data reports
- `SEARCH_AVAILABLE_TAXISTAS`: Search for available taxistas

**Taxista Permissions:**
- `VIEW_OWN_DATA`: View own operational data
- `EDIT_OWN_PROFILE`: Edit own profile information
- `VIEW_OWN_HISTORY`: View own service history
- `INPUT_OPERATIONAL_DATA`: Input operational data

**Common Permissions:**
- `EDIT_PROFILE`: Edit profile information
- `CHANGE_PASSWORD`: Change password
- `VIEW_NOTIFICATIONS`: View notifications

### Role-Permission Mapping

Permissions are automatically assigned based on user roles:

```typescript
const ROLE_PERMISSIONS = {
  [UserRole.PATRON]: [
    Permission.VIEW_ALL_DRIVERS,
    Permission.MANAGE_ASSOCIATIONS,
    Permission.VIEW_AGGREGATED_REPORTS,
    // ... other patron permissions
  ],
  [UserRole.TAXISTA]: [
    Permission.VIEW_OWN_DATA,
    Permission.EDIT_OWN_PROFILE,
    Permission.VIEW_OWN_HISTORY,
    // ... other taxista permissions
  ]
};
```

## Data Access Rules

### Ownership Rules

1. **Users can always access their own data**
2. **Patrones can access data from associated taxistas**
3. **Taxistas cannot access other users' data**

### Data Identification Patterns

The middleware recognizes data ownership through these patterns:
- `userId`: Direct user ID reference
- `taxistaId`: Taxista-specific ID reference
- `patronId`: Patron-specific ID reference
- `createdBy`: Creator user ID
- `numeroTaxista`: Taxista number matching

## Access Logging

### Log Entry Structure

```typescript
interface AccessAttempt {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
  resource: string;
  action: string;
  permission: Permission;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  errorCode?: AuthErrorCode;
  errorMessage?: string;
}
```

### Log Management

- **Automatic cleanup**: Old entries are automatically removed
- **Storage limits**: Maximum 1000 entries to prevent storage bloat
- **Filtering**: Logs can be filtered by user, resource, success status, date range
- **Security monitoring**: Built-in detection of suspicious activity patterns

## Data Encryption

### Encryption Configuration

```typescript
interface EncryptionConfig {
  encryptFields: string[];     // Fields to encrypt
  encryptionKey?: string;      // Custom encryption key
  skipEncryption?: boolean;    // Skip encryption entirely
}
```

### Default Sensitive Fields

- `password`: User passwords
- `telefono`: Phone numbers
- `email`: Email addresses (optional)
- `personalData`: Any personal data fields

## Security Features

### Threat Detection

- **Multiple failed attempts**: Tracks users with repeated access failures
- **Resource-based monitoring**: Identifies frequently attacked resources
- **Anonymous access tracking**: Monitors unauthenticated access attempts

### Security Statistics

```typescript
interface SecurityStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  uniqueUsers: number;
  topFailedResources: Array<{ resource: string; count: number }>;
  suspiciousActivity: AccessAttempt[];
}
```

## Integration Patterns

### Service Integration

```typescript
class MySecureService {
  private integration = new MiddlewareIntegration();

  async secureOperation(user: User, data: any) {
    return await this.integration.requirePermission(
      user,
      { permission: Permission.REQUIRED_PERMISSION },
      () => this.performOperation(data)
    );
  }
}
```

### API Middleware

```typescript
// Express.js example
app.use('/api/secure', async (req, res, next) => {
  const context = createAuthorizationContext(
    req.user,
    req.path,
    req.method.toLowerCase(),
    getRequiredPermission(req.path)
  );

  const result = await middleware.authorize(context);
  if (!result.authorized) {
    return res.status(403).json({ error: result.error?.message });
  }

  next();
});
```

## Testing

The middleware includes comprehensive tests covering:

- **Permission validation**: All role-permission combinations
- **Access logging**: Log creation, filtering, and cleanup
- **Data encryption**: Encryption/decryption of sensitive fields
- **Security monitoring**: Statistics and threat detection
- **Integration helpers**: High-level integration methods

Run tests with:
```bash
npm test -- src/auth/middleware
```

## Performance Considerations

- **Efficient storage**: Uses localStorage with automatic cleanup
- **Minimal overhead**: Permission checks are O(1) operations
- **Lazy loading**: Security statistics calculated on-demand
- **Memory management**: Automatic log rotation prevents memory bloat

## Security Best Practices

1. **Always validate permissions** before sensitive operations
2. **Log all access attempts** for security monitoring
3. **Encrypt sensitive data** at rest and in transit
4. **Monitor for suspicious patterns** regularly
5. **Clean up old logs** to prevent storage issues
6. **Use strong encryption keys** in production
7. **Implement rate limiting** for repeated failures

## Configuration

### Environment Variables

```typescript
// Production configuration
const config = {
  encryptionKey: process.env.ENCRYPTION_KEY,
  maxLogEntries: parseInt(process.env.MAX_LOG_ENTRIES) || 1000,
  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30
};
```

### Custom Encryption

```typescript
const customCrypto = new CryptoUtils();
const middleware = new AuthorizationMiddleware(customCrypto);
```

## Error Handling

The middleware provides specific error codes for different scenarios:

- `AUTH_002`: Session expired (unauthenticated user)
- `AUTH_003`: Insufficient permissions
- `AUTH_010`: Network/system errors

All errors include detailed messages and are properly logged for debugging.

## Future Enhancements

- **Rate limiting**: Automatic blocking of suspicious IPs
- **Advanced encryption**: Support for multiple encryption algorithms
- **Audit trails**: Enhanced logging with data change tracking
- **Real-time monitoring**: WebSocket-based security alerts
- **Integration APIs**: REST APIs for external security monitoring tools