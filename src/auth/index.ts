// Authentication module main exports
export * from './types';
export { AuthService } from './services/auth-service';
export { RoleService } from './services/role-service';
export { JWTUtils } from './utils/jwt-utils';
export { CryptoUtils } from './utils/crypto-utils';
export { ValidationUtils } from './utils/validation-utils';
export { 
  DatabaseUtils, 
  ConnectionManager, 
  getDatabaseConfig,
  type DatabaseConfig,
  type DatabaseConnection,
  type QueryResult
} from './database';
export * from './middleware';