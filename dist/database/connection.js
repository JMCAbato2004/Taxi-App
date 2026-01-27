// Database connection manager for authentication system
// Provides abstraction layer for different database types
import { getDatabaseConfig } from './config';
export class ConnectionManager {
    constructor(config) {
        this.connection = null;
        this.isConnected = false;
        this.config = config || getDatabaseConfig();
    }
    /**
     * Initialize database connection
     */
    async connect() {
        if (this.connection && this.isConnected) {
            return this.connection;
        }
        try {
            this.connection = await this.createConnection();
            this.isConnected = true;
            console.log(`Connected to ${this.config.type} database: ${this.config.database}`);
            return this.connection;
        }
        catch (error) {
            console.error('Failed to connect to database:', error);
            throw error;
        }
    }
    /**
     * Create connection based on database type
     */
    async createConnection() {
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
    async createPostgreSQLConnection() {
        // This is a placeholder implementation
        // In a real application, you would use the 'pg' library
        return new MockDatabaseConnection('postgresql');
    }
    /**
     * Create MySQL connection
     */
    async createMySQLConnection() {
        // This is a placeholder implementation
        // In a real application, you would use the 'mysql2' library
        return new MockDatabaseConnection('mysql');
    }
    /**
     * Create SQLite connection
     */
    async createSQLiteConnection() {
        // This is a placeholder implementation
        // In a real application, you would use the 'sqlite3' library
        return new MockDatabaseConnection('sqlite');
    }
    /**
     * Get current connection
     */
    getConnection() {
        if (!this.connection || !this.isConnected) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.connection;
    }
    /**
     * Close database connection
     */
    async disconnect() {
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
    async testConnection() {
        try {
            const connection = await this.connect();
            await connection.query('SELECT 1 as test');
            return true;
        }
        catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
    /**
     * Execute query with automatic connection management
     */
    async query(sql, params) {
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
    async execute(sql, params) {
        const connection = await this.connect();
        await connection.execute(sql, params);
    }
    /**
     * Execute multiple statements in a transaction
     */
    async transaction(callback) {
        const connection = await this.connect();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
    }
}
/**
 * Mock database connection for development/testing
 * Replace with actual database driver implementations
 */
class MockDatabaseConnection {
    constructor(dbType) {
        this.dbType = dbType;
    }
    async query(sql, params) {
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
    async execute(sql, params) {
        console.log(`[${this.dbType}] Execute:`, sql.substring(0, 100) + '...');
        if (params && params.length > 0) {
            console.log(`[${this.dbType}] Params:`, params);
        }
    }
    async beginTransaction() {
        console.log(`[${this.dbType}] BEGIN TRANSACTION`);
    }
    async commit() {
        console.log(`[${this.dbType}] COMMIT`);
    }
    async rollback() {
        console.log(`[${this.dbType}] ROLLBACK`);
    }
    async close() {
        console.log(`[${this.dbType}] Connection closed`);
    }
    mockSelectResult(sql) {
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
let globalConnectionManager = null;
/**
 * Get global connection manager instance
 */
export function getConnectionManager(config) {
    if (!globalConnectionManager) {
        globalConnectionManager = new ConnectionManager(config);
    }
    return globalConnectionManager;
}
/**
 * Initialize database connection
 */
export async function initializeDatabase(config) {
    const manager = getConnectionManager(config);
    await manager.connect();
    return manager;
}
/**
 * Close global database connection
 */
export async function closeDatabase() {
    if (globalConnectionManager) {
        await globalConnectionManager.disconnect();
        globalConnectionManager = null;
    }
}
// Export types and utilities
//# sourceMappingURL=connection.js.map