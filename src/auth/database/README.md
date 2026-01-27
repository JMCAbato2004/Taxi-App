# Database Module - Authentication System

This module provides database schema, configuration, and management utilities for the authentication system with roles.

## Overview

The database module implements a complete data layer for the authentication system, supporting:

- **Multi-database support**: PostgreSQL, MySQL, and SQLite
- **Schema management**: Automated migrations and validation
- **Connection pooling**: Efficient database connection management
- **Data integrity**: Comprehensive constraints and relationships
- **Performance optimization**: Strategic indexes and views

## Database Schema

### Tables

#### `usuarios` (Users)
Stores all user accounts with role-based information.

```sql
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(20) CHECK (rol IN ('patron', 'taxista')),
    numero_taxista VARCHAR(10) UNIQUE, -- auto-generated for taxistas
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- Auto-generated `numero_taxista` for taxistas (format: TX001-TX999)
- Role-based constraints ensuring data integrity
- Email format validation
- Automatic timestamp updates

#### `asociaciones` (Associations)
Manages relationships between patrones and taxistas.

```sql
CREATE TABLE asociaciones (
    id UUID PRIMARY KEY,
    patron_id UUID REFERENCES usuarios(id),
    taxista_id UUID REFERENCES usuarios(id),
    fecha_asociacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT true,
    UNIQUE(patron_id, taxista_id)
);
```

**Key Features:**
- Prevents duplicate associations
- Ensures only patrones can create associations
- Ensures only taxistas can be associated
- Cascade deletion with user accounts

#### `sesiones` (Sessions)
Manages JWT refresh tokens and session information.

```sql
CREATE TABLE sesiones (
    id UUID PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    dispositivo VARCHAR(255),
    ip_address INET,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT true
);
```

**Key Features:**
- Unique refresh token management
- Device and IP tracking
- Automatic cleanup of expired sessions
- Session expiration validation

### Views

#### `vista_asociaciones_activas`
Provides detailed information about active associations.

#### `vista_taxistas_disponibles`
Lists taxistas not currently associated with any patron.

#### `vista_patron_dashboard`
Aggregated data for patron dashboard display.

### Functions and Triggers

- **`generate_numero_taxista()`**: Auto-generates unique taxista numbers
- **`update_fecha_actualizacion()`**: Updates timestamp on record changes
- **`cleanup_expired_sessions()`**: Removes expired session records

## Configuration

### Environment Variables

```bash
# Database Type
DB_TYPE=postgresql  # postgresql, mysql, or sqlite

# PostgreSQL/MySQL Configuration
DB_HOST=localhost
DB_PORT=5432        # 5432 for PostgreSQL, 3306 for MySQL
DB_NAME=taxi_auth
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# SQLite Configuration (alternative)
SQLITE_FILE=./data/auth.db
```

### Configuration Examples

```typescript
import { getDatabaseConfig, DatabaseConfig } from './database/config';

// Use environment-based configuration
const config = getDatabaseConfig();

// Or create custom configuration
const customConfig: DatabaseConfig = {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'taxi_auth',
  username: 'postgres',
  password: 'password',
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000
  }
};
```

## Usage

### Basic Setup

```typescript
import { DatabaseUtils } from './database';

// Initialize database with migrations
const manager = await DatabaseUtils.setupDatabase();

// Health check
const health = await DatabaseUtils.healthCheck();
console.log('Database health:', health);
```

### Connection Management

```typescript
import { getConnectionManager } from './database';

// Get connection manager
const manager = getConnectionManager();

// Execute queries
const result = await manager.query(
  'SELECT * FROM usuarios WHERE email = ?',
  ['user@example.com']
);

// Execute in transaction
await manager.transaction(async (connection) => {
  await connection.execute(
    'INSERT INTO usuarios (email, nombre, rol) VALUES (?, ?, ?)',
    ['new@example.com', 'New User', 'taxista']
  );
  
  await connection.execute(
    'INSERT INTO sesiones (usuario_id, refresh_token) VALUES (?, ?)',
    ['user-id', 'refresh-token']
  );
});
```

### Migration Management

```typescript
import { createMigrationManager } from './database';

const migrationManager = createMigrationManager(config);

// Run all migrations
await migrationManager.runMigrations();

// Validate schema
const isValid = await migrationManager.validateSchema();
```

## Database Support

### PostgreSQL (Recommended)
- Full feature support including UUID generation
- Advanced constraints and triggers
- Optimal performance with proper indexing

### MySQL
- Compatible with most features
- May require UUID library for full compatibility
- Good performance with proper configuration

### SQLite
- Ideal for development and testing
- Limited concurrent access
- Some advanced features may not be available

## Performance Considerations

### Indexes
The schema includes strategic indexes for:
- User lookups by email and role
- Association queries by patron/taxista
- Session management by user and token
- Timestamp-based queries

### Connection Pooling
- Configurable pool sizes (default: 2-10 connections)
- Automatic connection lifecycle management
- Timeout handling for long-running queries

### Query Optimization
- Use prepared statements for security and performance
- Leverage views for complex queries
- Regular cleanup of expired sessions

## Security Features

### Data Integrity
- Foreign key constraints prevent orphaned records
- Check constraints ensure valid data formats
- Unique constraints prevent duplicates

### Access Control
- Role-based data access patterns
- Session token uniqueness enforcement
- Automatic cleanup of expired sessions

### Data Validation
- Email format validation
- Phone number format constraints
- Role-specific field requirements

## Maintenance

### Regular Tasks
```typescript
// Cleanup expired sessions
await manager.query('SELECT cleanup_expired_sessions()');

// Get database statistics
const stats = await DatabaseUtils.getStatistics();

// Backup schema
const schemaBackup = await DatabaseUtils.backupSchema();
```

### Development/Testing
```typescript
// Reset database (development only)
await DatabaseUtils.resetDatabase();

// Run specific migration
const migration = migrationManager.getInitialSchemaMigration();
await migrationManager.runMigration(migration);
```

## Error Handling

The module provides comprehensive error handling for:
- Connection failures
- Migration errors
- Constraint violations
- Transaction rollbacks

All database operations should be wrapped in try-catch blocks and handle errors appropriately based on the application context.

## Integration

This database module integrates with:
- **AuthService**: User authentication and session management
- **RoleService**: Permission and association management
- **Testing Framework**: Property-based and unit testing support
- **PWA Features**: Offline data synchronization

For complete integration examples, see the service implementations in the `../services/` directory.