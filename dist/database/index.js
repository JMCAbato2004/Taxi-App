// Database module exports for authentication system
// Provides unified access to database configuration, connections, and migrations
export { defaultConfig, sqliteConfig, mysqlConfig, getDatabaseConfig, buildPostgreSQLConnectionString, buildMySQLConnectionString, buildSQLiteConnectionString, getConnectionString } from './config';
export { ConnectionManager, getConnectionManager, initializeDatabase, closeDatabase } from './connection';
export { MigrationManager, createMigrationManager, runInitialMigration, validateDatabaseSchema } from './migrations';
// Import for internal use
import { getConnectionManager, initializeDatabase } from './connection';
import { getDatabaseConfig } from './config';
import { validateDatabaseSchema, runInitialMigration } from './migrations';
// Utility functions for database operations
export class DatabaseUtils {
    /**
     * Setup complete database environment
     * Initializes connection and runs migrations
     */
    static async setupDatabase(config) {
        const manager = await initializeDatabase(config);
        // Run initial migrations
        await runInitialMigration(config || getDatabaseConfig());
        // Validate schema
        const isValid = await validateDatabaseSchema(config || getDatabaseConfig());
        if (!isValid) {
            throw new Error('Database schema validation failed');
        }
        console.log('Database setup completed successfully');
        return manager;
    }
    /**
     * Health check for database
     */
    static async healthCheck(config) {
        try {
            const manager = getConnectionManager(config);
            const connected = await manager.testConnection();
            if (!connected) {
                return { connected: false, schemaValid: false, error: 'Connection failed' };
            }
            const schemaValid = await validateDatabaseSchema(config || getDatabaseConfig());
            return { connected, schemaValid };
        }
        catch (error) {
            return {
                connected: false,
                schemaValid: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Reset database (for testing/development)
     */
    static async resetDatabase(config) {
        const manager = getConnectionManager(config);
        // Drop all tables in reverse dependency order
        const dropTables = [
            'DROP TABLE IF EXISTS sesiones CASCADE;',
            'DROP TABLE IF EXISTS asociaciones CASCADE;',
            'DROP TABLE IF EXISTS usuarios CASCADE;',
            'DROP TABLE IF EXISTS schema_migrations CASCADE;'
        ];
        for (const sql of dropTables) {
            await manager.execute(sql);
        }
        // Drop views
        const dropViews = [
            'DROP VIEW IF EXISTS vista_asociaciones_activas;',
            'DROP VIEW IF EXISTS vista_taxistas_disponibles;',
            'DROP VIEW IF EXISTS vista_patron_dashboard;'
        ];
        for (const sql of dropViews) {
            await manager.execute(sql);
        }
        // Drop functions
        const dropFunctions = [
            'DROP FUNCTION IF EXISTS update_fecha_actualizacion() CASCADE;',
            'DROP FUNCTION IF EXISTS generate_numero_taxista() CASCADE;',
            'DROP FUNCTION IF EXISTS auto_generate_numero_taxista() CASCADE;',
            'DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;'
        ];
        for (const sql of dropFunctions) {
            await manager.execute(sql);
        }
        console.log('Database reset completed');
    }
    /**
     * Backup database schema
     */
    static async backupSchema(_config) {
        // This would implement schema backup functionality
        // For now, return the schema file content
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, 'schemas.sql');
        return fs.readFileSync(schemaPath, 'utf-8');
    }
    /**
     * Get database statistics
     */
    static async getStatistics(config) {
        const manager = getConnectionManager(config);
        try {
            const [totalUsersResult, patronesResult, taxistasResult, associationsResult, sessionsResult] = await Promise.all([
                manager.query('SELECT COUNT(*) as count FROM usuarios WHERE activo = true'),
                manager.query('SELECT COUNT(*) as count FROM usuarios WHERE rol = ? AND activo = true', ['patron']),
                manager.query('SELECT COUNT(*) as count FROM usuarios WHERE rol = ? AND activo = true', ['taxista']),
                manager.query('SELECT COUNT(*) as count FROM asociaciones WHERE activa = true'),
                manager.query('SELECT COUNT(*) as count FROM sesiones WHERE activa = true AND fecha_expiracion > CURRENT_TIMESTAMP')
            ]);
            return {
                totalUsers: totalUsersResult.rows[0]?.count || 0,
                totalPatrones: patronesResult.rows[0]?.count || 0,
                totalTaxistas: taxistasResult.rows[0]?.count || 0,
                totalAssociations: associationsResult.rows[0]?.count || 0,
                activeSessions: sessionsResult.rows[0]?.count || 0
            };
        }
        catch (error) {
            console.error('Failed to get database statistics:', error);
            return {
                totalUsers: 0,
                totalPatrones: 0,
                totalTaxistas: 0,
                totalAssociations: 0,
                activeSessions: 0
            };
        }
    }
}
// Default export for convenience
export default {
    DatabaseUtils,
    setupDatabase: DatabaseUtils.setupDatabase,
    healthCheck: DatabaseUtils.healthCheck,
    resetDatabase: DatabaseUtils.resetDatabase,
    getStatistics: DatabaseUtils.getStatistics
};
//# sourceMappingURL=index.js.map