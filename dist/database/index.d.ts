export type { DatabaseConfig } from './config';
export { defaultConfig, sqliteConfig, mysqlConfig, getDatabaseConfig, buildPostgreSQLConnectionString, buildMySQLConnectionString, buildSQLiteConnectionString, getConnectionString } from './config';
export type { DatabaseConnection, QueryResult } from './connection';
export { ConnectionManager, getConnectionManager, initializeDatabase, closeDatabase } from './connection';
export type { Migration, MigrationRecord } from './migrations';
export { MigrationManager, createMigrationManager, runInitialMigration, validateDatabaseSchema } from './migrations';
import { ConnectionManager } from './connection';
import type { DatabaseConfig } from './config';
export declare class DatabaseUtils {
    /**
     * Setup complete database environment
     * Initializes connection and runs migrations
     */
    static setupDatabase(config?: DatabaseConfig): Promise<ConnectionManager>;
    /**
     * Health check for database
     */
    static healthCheck(config?: DatabaseConfig): Promise<{
        connected: boolean;
        schemaValid: boolean;
        error?: string;
    }>;
    /**
     * Reset database (for testing/development)
     */
    static resetDatabase(config?: DatabaseConfig): Promise<void>;
    /**
     * Backup database schema
     */
    static backupSchema(_config?: DatabaseConfig): Promise<string>;
    /**
     * Get database statistics
     */
    static getStatistics(config?: DatabaseConfig): Promise<{
        totalUsers: number;
        totalPatrones: number;
        totalTaxistas: number;
        totalAssociations: number;
        activeSessions: number;
    }>;
}
declare const _default: {
    DatabaseUtils: typeof DatabaseUtils;
    setupDatabase: typeof DatabaseUtils.setupDatabase;
    healthCheck: typeof DatabaseUtils.healthCheck;
    resetDatabase: typeof DatabaseUtils.resetDatabase;
    getStatistics: typeof DatabaseUtils.getStatistics;
};
export default _default;
//# sourceMappingURL=index.d.ts.map