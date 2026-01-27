// Database migration utilities for authentication system
// Handles schema creation, updates, and rollbacks

import { readFileSync } from 'fs';
import { join } from 'path';
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

export class MigrationManager {
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize migration tracking table
   */
  async initializeMigrationTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL
      );
    `;

    await this.executeSQL(createTableSQL);
  }

  /**
   * Get all executed migrations
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const sql = 'SELECT * FROM schema_migrations ORDER BY executed_at ASC';
    return await this.executeSQL(sql);
  }

  /**
   * Check if a migration has been executed
   */
  async isMigrationExecuted(migrationId: string): Promise<boolean> {
    const sql = 'SELECT COUNT(*) as count FROM schema_migrations WHERE id = ?';
    const result = await this.executeSQL(sql, [migrationId]);
    return result[0].count > 0;
  }

  /**
   * Record a migration as executed
   */
  async recordMigration(migration: Migration, checksum: string): Promise<void> {
    const sql = `
      INSERT INTO schema_migrations (id, name, executed_at, checksum) 
      VALUES (?, ?, CURRENT_TIMESTAMP, ?)
    `;
    await this.executeSQL(sql, [migration.id, migration.name, checksum]);
  }

  /**
   * Remove migration record (for rollback)
   */
  async removeMigrationRecord(migrationId: string): Promise<void> {
    const sql = 'DELETE FROM schema_migrations WHERE id = ?';
    await this.executeSQL(sql, [migrationId]);
  }

  /**
   * Load migration from file
   */
  loadMigrationFromFile(filePath: string): Migration {
    const content = readFileSync(filePath, 'utf-8');
    const fileName = filePath.split('/').pop() || '';
    const [timestampStr, ...nameParts] = fileName.replace('.sql', '').split('_');
    
    return {
      id: fileName.replace('.sql', ''),
      name: nameParts.join('_'),
      up: content,
      timestamp: new Date(parseInt(timestampStr || '0'))
    };
  }

  /**
   * Get initial schema migration
   */
  getInitialSchemaMigration(): Migration {
    const schemaPath = join(__dirname, 'schemas.sql');
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    
    return {
      id: '001_initial_schema',
      name: 'initial_schema',
      up: schemaContent,
      timestamp: new Date()
    };
  }

  /**
   * Run a single migration
   */
  async runMigration(migration: Migration): Promise<void> {
    const checksum = this.calculateChecksum(migration.up);
    
    // Check if already executed
    if (await this.isMigrationExecuted(migration.id)) {
      console.log(`Migration ${migration.id} already executed, skipping...`);
      return;
    }

    console.log(`Running migration: ${migration.id} - ${migration.name}`);
    
    try {
      // Execute migration SQL
      await this.executeSQL(migration.up);
      
      // Record successful execution
      await this.recordMigration(migration, checksum);
      
      console.log(`Migration ${migration.id} completed successfully`);
    } catch (error) {
      console.error(`Migration ${migration.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    await this.initializeMigrationTable();
    
    // Get initial schema migration
    const initialMigration = this.getInitialSchemaMigration();
    await this.runMigration(initialMigration);
    
    console.log('All migrations completed successfully');
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`Migration ${migration.id} does not have a rollback script`);
    }

    console.log(`Rolling back migration: ${migration.id} - ${migration.name}`);
    
    try {
      // Execute rollback SQL
      await this.executeSQL(migration.down);
      
      // Remove migration record
      await this.removeMigrationRecord(migration.id);
      
      console.log(`Migration ${migration.id} rolled back successfully`);
    } catch (error) {
      console.error(`Rollback of migration ${migration.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Validate database schema
   */
  async validateSchema(): Promise<boolean> {
    try {
      // Check if all required tables exist
      const requiredTables = ['usuarios', 'asociaciones', 'sesiones'];
      
      for (const table of requiredTables) {
        const exists = await this.tableExists(table);
        if (!exists) {
          console.error(`Required table '${table}' does not exist`);
          return false;
        }
      }

      // Check if all required indexes exist
      const requiredIndexes = [
        'idx_usuarios_email',
        'idx_usuarios_rol',
        'idx_asociaciones_patron_id',
        'idx_sesiones_usuario_id'
      ];

      for (const index of requiredIndexes) {
        const exists = await this.indexExists(index);
        if (!exists) {
          console.warn(`Recommended index '${index}' does not exist`);
        }
      }

      console.log('Schema validation completed successfully');
      return true;
    } catch (error) {
      console.error('Schema validation failed:', error);
      return false;
    }
  }

  /**
   * Check if table exists
   */
  private async tableExists(tableName: string): Promise<boolean> {
    let sql: string;
    
    switch (this.config.type) {
      case 'postgresql':
        sql = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ?
          );
        `;
        break;
      case 'mysql':
        sql = `
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_name = ?;
        `;
        break;
      case 'sqlite':
        sql = `
          SELECT COUNT(*) as count 
          FROM sqlite_master 
          WHERE type='table' 
          AND name = ?;
        `;
        break;
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }

    const result = await this.executeSQL(sql, [tableName]);
    return this.config.type === 'postgresql' ? result[0].exists : result[0].count > 0;
  }

  /**
   * Check if index exists
   */
  private async indexExists(indexName: string): Promise<boolean> {
    let sql: string;
    
    switch (this.config.type) {
      case 'postgresql':
        sql = `
          SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE indexname = ?
          );
        `;
        break;
      case 'mysql':
        sql = `
          SELECT COUNT(*) as count 
          FROM information_schema.statistics 
          WHERE table_schema = DATABASE() 
          AND index_name = ?;
        `;
        break;
      case 'sqlite':
        sql = `
          SELECT COUNT(*) as count 
          FROM sqlite_master 
          WHERE type='index' 
          AND name = ?;
        `;
        break;
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }

    const result = await this.executeSQL(sql, [indexName]);
    return this.config.type === 'postgresql' ? result[0].exists : result[0].count > 0;
  }

  /**
   * Calculate checksum for migration content
   */
  private calculateChecksum(content: string): string {
    // Simple checksum calculation - in production, use crypto.createHash
    return Buffer.from(content).toString('base64').slice(0, 64);
  }

  /**
   * Execute SQL - placeholder for actual database connection
   * This should be implemented with actual database driver
   */
  private async executeSQL(sql: string, params: any[] = []): Promise<any[]> {
    // This is a placeholder - actual implementation would use database driver
    // Examples:
    // - PostgreSQL: pg library
    // - MySQL: mysql2 library  
    // - SQLite: sqlite3 library
    
    console.log('Executing SQL:', sql.substring(0, 100) + '...');
    if (params.length > 0) {
      console.log('Parameters:', params);
    }
    
    // Return empty array as placeholder
    return [];
  }

  /**
   * Set database connection
   */
  setConnection(_connection: any): void {
    // Connection would be set here in real implementation
  }
}

// Export utility functions
export function createMigrationManager(config: DatabaseConfig): MigrationManager {
  return new MigrationManager(config);
}

export async function runInitialMigration(config: DatabaseConfig): Promise<void> {
  const manager = createMigrationManager(config);
  await manager.runMigrations();
}

export async function validateDatabaseSchema(config: DatabaseConfig): Promise<boolean> {
  const manager = createMigrationManager(config);
  return await manager.validateSchema();
}