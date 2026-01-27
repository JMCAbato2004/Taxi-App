import { DatabaseConfig } from './config';
export interface Migration {
    id: string;
    name: string;
    up: string;
    down?: string;
    timestamp: Date;
}
export interface MigrationRecord {
    id: string;
    name: string;
    executed_at: Date;
    checksum: string;
}
export declare class MigrationManager {
    private config;
    constructor(config: DatabaseConfig);
    /**
     * Initialize migration tracking table
     */
    initializeMigrationTable(): Promise<void>;
    /**
     * Get all executed migrations
     */
    getExecutedMigrations(): Promise<MigrationRecord[]>;
    /**
     * Check if a migration has been executed
     */
    isMigrationExecuted(migrationId: string): Promise<boolean>;
    /**
     * Record a migration as executed
     */
    recordMigration(migration: Migration, checksum: string): Promise<void>;
    /**
     * Remove migration record (for rollback)
     */
    removeMigrationRecord(migrationId: string): Promise<void>;
    /**
     * Load migration from file
     */
    loadMigrationFromFile(filePath: string): Migration;
    /**
     * Get initial schema migration
     */
    getInitialSchemaMigration(): Migration;
    /**
     * Run a single migration
     */
    runMigration(migration: Migration): Promise<void>;
    /**
     * Run all pending migrations
     */
    runMigrations(): Promise<void>;
    /**
     * Rollback a migration
     */
    rollbackMigration(migration: Migration): Promise<void>;
    /**
     * Validate database schema
     */
    validateSchema(): Promise<boolean>;
    /**
     * Check if table exists
     */
    private tableExists;
    /**
     * Check if index exists
     */
    private indexExists;
    /**
     * Calculate checksum for migration content
     */
    private calculateChecksum;
    /**
     * Execute SQL - placeholder for actual database connection
     * This should be implemented with actual database driver
     */
    private executeSQL;
    /**
     * Set database connection
     */
    setConnection(_connection: any): void;
}
export declare function createMigrationManager(config: DatabaseConfig): MigrationManager;
export declare function runInitialMigration(config: DatabaseConfig): Promise<void>;
export declare function validateDatabaseSchema(config: DatabaseConfig): Promise<boolean>;
//# sourceMappingURL=migrations.d.ts.map