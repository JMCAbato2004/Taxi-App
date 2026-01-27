// Database schema tests for authentication system
// Tests database configuration, connection, and schema validation

import { 
  DatabaseConfig, 
  getDatabaseConfig, 
  ConnectionManager, 
  DatabaseUtils,
  createMigrationManager 
} from '../../src/auth/database';

describe('Database Configuration', () => {
  test('should provide default configuration', () => {
    const config = getDatabaseConfig();
    
    expect(config).toBeDefined();
    expect(config.type).toBeDefined();
    expect(config.database).toBeDefined();
    expect(['postgresql', 'mysql', 'sqlite']).toContain(config.type);
  });

  test('should handle different database types', () => {
    const originalEnv = process.env.DB_TYPE;
    
    // Test PostgreSQL config
    process.env.DB_TYPE = 'postgresql';
    const pgConfig = getDatabaseConfig();
    expect(pgConfig.type).toBe('postgresql');
    expect(pgConfig.port).toBe(5432);
    
    // Test MySQL config
    process.env.DB_TYPE = 'mysql';
    const mysqlConfig = getDatabaseConfig();
    expect(mysqlConfig.type).toBe('mysql');
    
    // Test SQLite config
    process.env.DB_TYPE = 'sqlite';
    const sqliteConfig = getDatabaseConfig();
    expect(sqliteConfig.type).toBe('sqlite');
    expect(sqliteConfig.filename).toBeDefined();
    
    // Restore original environment
    if (originalEnv) {
      process.env.DB_TYPE = originalEnv;
    } else {
      delete process.env.DB_TYPE;
    }
  });

  test('should validate required configuration fields', () => {
    const config: DatabaseConfig = {
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass'
    };

    expect(config.type).toBe('postgresql');
    expect(config.host).toBe('localhost');
    expect(config.database).toBe('test_db');
    expect(config.username).toBe('test_user');
  });
});

describe('Connection Manager', () => {
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    const testConfig: DatabaseConfig = {
      type: 'sqlite',
      database: 'test_auth',
      filename: ':memory:'
    };
    connectionManager = new ConnectionManager(testConfig);
  });

  afterEach(async () => {
    await connectionManager.disconnect();
  });

  test('should create connection manager', () => {
    expect(connectionManager).toBeDefined();
    expect(connectionManager).toBeInstanceOf(ConnectionManager);
  });

  test('should handle connection lifecycle', async () => {
    // Test connection
    const connection = await connectionManager.connect();
    expect(connection).toBeDefined();

    // Test query execution
    const result = await connectionManager.query('SELECT 1 as test');
    expect(result).toBeDefined();
    expect(result.rows).toBeDefined();

    // Test disconnection
    await connectionManager.disconnect();
  });

  test('should handle transaction operations', async () => {
    await connectionManager.connect();

    const result = await connectionManager.transaction(async (connection) => {
      await connection.execute('SELECT 1');
      return 'success';
    });

    expect(result).toBe('success');
  });

  test('should test connection health', async () => {
    const isHealthy = await connectionManager.testConnection();
    expect(typeof isHealthy).toBe('boolean');
  });
});

describe('Migration Manager', () => {
  test('should create migration manager', () => {
    const config: DatabaseConfig = {
      type: 'sqlite',
      database: 'test_auth',
      filename: ':memory:'
    };

    const migrationManager = createMigrationManager(config);
    expect(migrationManager).toBeDefined();
  });

  test('should load initial schema migration', () => {
    const config: DatabaseConfig = {
      type: 'sqlite',
      database: 'test_auth',
      filename: ':memory:'
    };

    const migrationManager = createMigrationManager(config);
    const migration = migrationManager.getInitialSchemaMigration();
    
    expect(migration).toBeDefined();
    expect(migration.id).toBe('001_initial_schema');
    expect(migration.name).toBe('initial_schema');
    expect(migration.up).toContain('CREATE TABLE usuarios');
    expect(migration.up).toContain('CREATE TABLE asociaciones');
    expect(migration.up).toContain('CREATE TABLE sesiones');
  });

  test('should validate schema structure', () => {
    const config: DatabaseConfig = {
      type: 'sqlite',
      database: 'test_auth',
      filename: ':memory:'
    };

    const migrationManager = createMigrationManager(config);
    const migration = migrationManager.getInitialSchemaMigration();
    
    // Check that schema contains required tables
    expect(migration.up).toContain('CREATE TABLE usuarios');
    expect(migration.up).toContain('CREATE TABLE asociaciones');
    expect(migration.up).toContain('CREATE TABLE sesiones');
    
    // Check that schema contains required constraints
    expect(migration.up).toContain('CHECK (rol IN (\'patron\', \'taxista\'))');
    expect(migration.up).toContain('UNIQUE(patron_id, taxista_id)');
    expect(migration.up).toContain('FOREIGN KEY');
    
    // Check that schema contains required indexes
    expect(migration.up).toContain('CREATE INDEX idx_usuarios_email');
    expect(migration.up).toContain('CREATE INDEX idx_asociaciones_patron_id');
    expect(migration.up).toContain('CREATE INDEX idx_sesiones_usuario_id');
  });
});

describe('Database Utils', () => {
  test('should provide health check functionality', async () => {
    const config: DatabaseConfig = {
      type: 'sqlite',
      database: 'test_auth',
      filename: ':memory:'
    };

    const health = await DatabaseUtils.healthCheck(config);
    
    expect(health).toBeDefined();
    expect(typeof health.connected).toBe('boolean');
    expect(typeof health.schemaValid).toBe('boolean');
  });

  test('should provide database statistics', async () => {
    const config: DatabaseConfig = {
      type: 'sqlite',
      database: 'test_auth',
      filename: ':memory:'
    };

    const stats = await DatabaseUtils.getStatistics(config);
    
    expect(stats).toBeDefined();
    expect(typeof stats.totalUsers).toBe('number');
    expect(typeof stats.totalPatrones).toBe('number');
    expect(typeof stats.totalTaxistas).toBe('number');
    expect(typeof stats.totalAssociations).toBe('number');
    expect(typeof stats.activeSessions).toBe('number');
  });

  test('should handle backup schema functionality', async () => {
    const schemaBackup = await DatabaseUtils.backupSchema();
    
    expect(schemaBackup).toBeDefined();
    expect(typeof schemaBackup).toBe('string');
    expect(schemaBackup).toContain('CREATE TABLE usuarios');
  });
});

describe('Schema Validation', () => {
  test('should validate required table structures', () => {
    const config: DatabaseConfig = {
      type: 'postgresql',
      database: 'test_auth'
    };

    const migrationManager = createMigrationManager(config);
    const migration = migrationManager.getInitialSchemaMigration();
    
    // Validate usuarios table structure
    expect(migration.up).toContain('id UUID PRIMARY KEY');
    expect(migration.up).toContain('email VARCHAR(255) UNIQUE NOT NULL');
    expect(migration.up).toContain('password_hash VARCHAR(255) NOT NULL');
    expect(migration.up).toContain('nombre VARCHAR(255) NOT NULL');
    expect(migration.up).toContain('rol VARCHAR(20) NOT NULL');
    expect(migration.up).toContain('numero_taxista VARCHAR(10) UNIQUE');
    
    // Validate asociaciones table structure
    expect(migration.up).toContain('patron_id UUID NOT NULL');
    expect(migration.up).toContain('taxista_id UUID NOT NULL');
    expect(migration.up).toContain('fecha_asociacion TIMESTAMP');
    expect(migration.up).toContain('activa BOOLEAN DEFAULT true');
    
    // Validate sesiones table structure
    expect(migration.up).toContain('usuario_id UUID NOT NULL');
    expect(migration.up).toContain('refresh_token VARCHAR(500) NOT NULL UNIQUE');
    expect(migration.up).toContain('fecha_expiracion TIMESTAMP NOT NULL');
  });

  test('should validate business logic constraints', () => {
    const config: DatabaseConfig = {
      type: 'postgresql',
      database: 'test_auth'
    };

    const migrationManager = createMigrationManager(config);
    const migration = migrationManager.getInitialSchemaMigration();
    
    // Check role constraints
    expect(migration.up).toContain('CHECK (rol IN (\'patron\', \'taxista\'))');
    
    // Check taxista number constraints
    expect(migration.up).toContain('check_numero_taxista_for_taxista');
    expect(migration.up).toContain('check_numero_taxista_format');
    
    // Check association constraints
    expect(migration.up).toContain('CHECK (patron_id != taxista_id)');
    expect(migration.up).toContain('UNIQUE(patron_id, taxista_id)');
    
    // Check email format constraint
    expect(migration.up).toContain('check_email_format');
    
    // Check expiration constraint
    expect(migration.up).toContain('check_expiration_after_creation');
  });

  test('should validate performance indexes', () => {
    const config: DatabaseConfig = {
      type: 'postgresql',
      database: 'test_auth'
    };

    const migrationManager = createMigrationManager(config);
    const migration = migrationManager.getInitialSchemaMigration();
    
    // Check usuarios indexes
    expect(migration.up).toContain('CREATE INDEX idx_usuarios_email ON usuarios(email)');
    expect(migration.up).toContain('CREATE INDEX idx_usuarios_rol ON usuarios(rol)');
    expect(migration.up).toContain('CREATE INDEX idx_usuarios_numero_taxista');
    
    // Check asociaciones indexes
    expect(migration.up).toContain('CREATE INDEX idx_asociaciones_patron_id');
    expect(migration.up).toContain('CREATE INDEX idx_asociaciones_taxista_id');
    expect(migration.up).toContain('CREATE INDEX idx_asociaciones_activa');
    
    // Check sesiones indexes
    expect(migration.up).toContain('CREATE INDEX idx_sesiones_usuario_id');
    expect(migration.up).toContain('CREATE INDEX idx_sesiones_refresh_token');
    expect(migration.up).toContain('CREATE INDEX idx_sesiones_expiracion');
  });

  test('should validate helper functions and triggers', () => {
    const config: DatabaseConfig = {
      type: 'postgresql',
      database: 'test_auth'
    };

    const migrationManager = createMigrationManager(config);
    const migration = migrationManager.getInitialSchemaMigration();
    
    // Check timestamp update function
    expect(migration.up).toContain('CREATE OR REPLACE FUNCTION update_fecha_actualizacion()');
    expect(migration.up).toContain('CREATE TRIGGER trigger_usuarios_update_timestamp');
    
    // Check taxista number generation
    expect(migration.up).toContain('CREATE OR REPLACE FUNCTION generate_numero_taxista()');
    expect(migration.up).toContain('CREATE TRIGGER trigger_auto_numero_taxista');
    
    // Check cleanup function
    expect(migration.up).toContain('CREATE OR REPLACE FUNCTION cleanup_expired_sessions()');
  });

  test('should validate views for common queries', () => {
    const config: DatabaseConfig = {
      type: 'postgresql',
      database: 'test_auth'
    };

    const migrationManager = createMigrationManager(config);
    const migration = migrationManager.getInitialSchemaMigration();
    
    // Check required views
    expect(migration.up).toContain('CREATE VIEW vista_asociaciones_activas');
    expect(migration.up).toContain('CREATE VIEW vista_taxistas_disponibles');
    expect(migration.up).toContain('CREATE VIEW vista_patron_dashboard');
    
    // Check view content
    expect(migration.up).toContain('patron_nombre');
    expect(migration.up).toContain('taxista_nombre');
    expect(migration.up).toContain('numero_taxista');
  });
});