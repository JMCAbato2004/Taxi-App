import { DatabaseConfig } from './config';
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
export declare class ConnectionManager {
    private config;
    private connection;
    private isConnected;
    constructor(config?: DatabaseConfig);
    /**
     * Initialize database connection
     */
    connect(): Promise<DatabaseConnection>;
    /**
     * Create connection based on database type
     */
    private createConnection;
    /**
     * Create PostgreSQL connection
     */
    private createPostgreSQLConnection;
    /**
     * Create MySQL connection
     */
    private createMySQLConnection;
    /**
     * Create SQLite connection
     */
    private createSQLiteConnection;
    /**
     * Get current connection
     */
    getConnection(): DatabaseConnection;
    /**
     * Close database connection
     */
    disconnect(): Promise<void>;
    /**
     * Test database connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Execute query with automatic connection management
     */
    query(sql: string, params?: any[]): Promise<QueryResult>;
    /**
     * Execute statement with automatic connection management
     */
    execute(sql: string, params?: any[]): Promise<void>;
    /**
     * Execute multiple statements in a transaction
     */
    transaction<T>(callback: (connection: DatabaseConnection) => Promise<T>): Promise<T>;
}
/**
 * Get global connection manager instance
 */
export declare function getConnectionManager(config?: DatabaseConfig): ConnectionManager;
/**
 * Initialize database connection
 */
export declare function initializeDatabase(config?: DatabaseConfig): Promise<ConnectionManager>;
/**
 * Close global database connection
 */
export declare function closeDatabase(): Promise<void>;
//# sourceMappingURL=connection.d.ts.map