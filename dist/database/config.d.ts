export interface DatabaseConfig {
    type: 'postgresql' | 'mysql' | 'sqlite';
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
    filename?: string;
    ssl?: boolean;
    pool?: {
        min: number;
        max: number;
        acquireTimeoutMillis: number;
        idleTimeoutMillis: number;
    };
}
export declare const defaultConfig: DatabaseConfig;
export declare const sqliteConfig: DatabaseConfig;
export declare const mysqlConfig: DatabaseConfig;
export declare function getDatabaseConfig(): DatabaseConfig;
export declare function buildPostgreSQLConnectionString(config: DatabaseConfig): string;
export declare function buildMySQLConnectionString(config: DatabaseConfig): string;
export declare function buildSQLiteConnectionString(config: DatabaseConfig): string;
export declare function getConnectionString(config?: DatabaseConfig): string;
//# sourceMappingURL=config.d.ts.map