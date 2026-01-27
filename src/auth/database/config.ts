// Database configuration for authentication system
// Supports multiple database backends with connection pooling

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filename?: string; // for SQLite
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    idleTimeoutMillis: number;
  };
}

export const defaultConfig: DatabaseConfig = {
  type: 'postgresql',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  database: process.env['DB_NAME'] || 'taxi_auth',
  username: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || '',
  ssl: process.env['DB_SSL'] === 'true',
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000
  }
};

// SQLite configuration for development/testing
export const sqliteConfig: DatabaseConfig = {
  type: 'sqlite',
  database: 'taxi_auth',
  filename: process.env['SQLITE_FILE'] || './data/auth.db'
};

// MySQL configuration alternative
export const mysqlConfig: DatabaseConfig = {
  type: 'mysql',
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '3306'),
  database: process.env['DB_NAME'] || 'taxi_auth',
  username: process.env['DB_USER'] || 'root',
  password: process.env['DB_PASSWORD'] || '',
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 600000
  }
};

export function getDatabaseConfig(): DatabaseConfig {
  const dbType = process.env['DB_TYPE'] as DatabaseConfig['type'] || 'postgresql';
  
  switch (dbType) {
    case 'sqlite':
      return sqliteConfig;
    case 'mysql':
      return mysqlConfig;
    case 'postgresql':
    default:
      return defaultConfig;
  }
}

// Connection string builders
export function buildPostgreSQLConnectionString(config: DatabaseConfig): string {
  const { host, port, database, username, password, ssl } = config;
  let connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
  
  if (ssl) {
    connectionString += '?ssl=true';
  }
  
  return connectionString;
}

export function buildMySQLConnectionString(config: DatabaseConfig): string {
  const { host, port, database, username, password } = config;
  return `mysql://${username}:${password}@${host}:${port}/${database}`;
}

export function buildSQLiteConnectionString(config: DatabaseConfig): string {
  return config.filename || './data/auth.db';
}

export function getConnectionString(config: DatabaseConfig = getDatabaseConfig()): string {
  switch (config.type) {
    case 'postgresql':
      return buildPostgreSQLConnectionString(config);
    case 'mysql':
      return buildMySQLConnectionString(config);
    case 'sqlite':
      return buildSQLiteConnectionString(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}