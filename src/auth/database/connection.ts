// Database connection manager for authentication system
// Provides abstraction layer for different database types

import { DatabaseConfig, getDatabaseConfig } from './config';

export interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  close(): Promise<void>;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields?: any[];
}

export class ConnectionManager {
  private config: DatabaseConfig;
  private connection: DatabaseConnection | null = null;
  private isConnected: boolean = false;

  constructor(config?: DatabaseConfig) {
    this.config = config || getDatabaseConfig();
  }

  /**
   * Initialize database connection
   */
  async connect(): Promise<DatabaseConnection> {
    if (this.connection && this.isConnected) {
      return this.connection;
    }

    try {
      this.connection = await this.createConnection();
      this.isConnected = true;
      console.log(`Connected to ${this.config.type} database: ${this.config.database}`);
      return this.connection;
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Create connection based on database type
   */
  private async createConnection(): Promise<DatabaseConnection> {
    switch (this.config.type) {
      case 'postgresql':
        return this.createPostgreSQLConnection();
      case 'mysql':
        return this.createMySQLConnection();
      case 'sqlite':
        return this.createSQLiteConnection();
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  /**
   * Create PostgreSQL connection
   */
  private async createPostgreSQLConnection(): Promise<DatabaseConnection> {
    // This is a placeholder implementation
    // In a real application, you would use the 'pg' library
    
    return new MockDatabaseConnection('postgresql');
  }

  /**
   * Create MySQL connection
   */
  private async createMySQLConnection(): Promise<DatabaseConnection> {
    // This is a placeholder implementation
    // In a real application, you would use the 'mysql2' library
    
    return new MockDatabaseConnection('mysql');
  }

  /**
   * Create SQLite connection
   */
  private async createSQLiteConnection(): Promise<DatabaseConnection> {
    // This is a placeholder implementation
    // In a real application, you would use the 'sqlite3' library
    
    return new MockDatabaseConnection('sqlite');
  }

  /**
   * Get current connection
   */
  getConnection(): DatabaseConnection {
    if (!this.connection || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.connection;
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.isConnected = false;
      console.log('Database connection closed');
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const connection = await this.connect();
      await connection.query('SELECT 1 as test');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Execute query with automatic connection management
   */
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const connection = await this.connect();
    const rows = await connection.query(sql, params);
    return {
      rows,
      rowCount: rows.length
    };
  }

  /**
   * Execute statement with automatic connection management
   */
  async execute(sql: string, params?: any[]): Promise<void> {
    const connection = await this.connect();
    await connection.execute(sql, params);
  }

  /**
   * Execute multiple statements in a transaction
   */
  async transaction<T>(callback: (connection: DatabaseConnection) => Promise<T>): Promise<T> {
    const connection = await this.connect();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
}

/**
 * Mock database connection for development/testing
 * Replace with actual database driver implementations
 */
class MockDatabaseConnection implements DatabaseConnection {
  private dbType: string;

  constructor(dbType: string) {
    this.dbType = dbType;
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    console.log(`[${this.dbType}] Query:`, sql.substring(0, 100) + '...');
    if (params && params.length > 0) {
      console.log(`[${this.dbType}] Params:`, params);
    }

    // Mock response based on query type
    if (sql.toLowerCase().includes('select')) {
      return this.mockSelectResult(sql);
    }
    
    return [];
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    console.log(`[${this.dbType}] Execute:`, sql.substring(0, 100) + '...');
    if (params && params.length > 0) {
      console.log(`[${this.dbType}] Params:`, params);
    }
  }

  async beginTransaction(): Promise<void> {
    console.log(`[${this.dbType}] BEGIN TRANSACTION`);
  }

  async commit(): Promise<void> {
    console.log(`[${this.dbType}] COMMIT`);
  }

  async rollback(): Promise<void> {
    console.log(`[${this.dbType}] ROLLBACK`);
  }

  async close(): Promise<void> {
    console.log(`[${this.dbType}] Connection closed`);
  }

  private mockSelectResult(sql: string): any[] {
    const lowerSql = sql.toLowerCase();
    
    if (lowerSql.includes('schema_migrations')) {
      return [];
    }
    
    if (lowerSql.includes('information_schema') || lowerSql.includes('sqlite_master')) {
      return [{ count: 1, exists: true }];
    }
    
    if (lowerSql.includes('select 1')) {
      return [{ test: 1 }];
    }
    
    return [];
  }
}

// Singleton instance for global use
let globalConnectionManager: ConnectionManager | null = null;

/**
 * Get global connection manager instance
 */
export function getConnectionManager(config?: DatabaseConfig): ConnectionManager {
  if (!globalConnectionManager) {
    globalConnectionManager = new ConnectionManager(config);
  }
  return globalConnectionManager;
}

/**
 * Initialize database connection
 */
export async function initializeDatabase(config?: DatabaseConfig): Promise<ConnectionManager> {
  const manager = getConnectionManager(config);
  await manager.connect();
  return manager;
}

/**
 * Close global database connection
 */
export async function closeDatabase(): Promise<void> {
  if (globalConnectionManager) {
    await globalConnectionManager.disconnect();
    globalConnectionManager = null;
  }
}

// Export types and utilities