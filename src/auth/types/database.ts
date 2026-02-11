/**
 * Database-specific types and interfaces
 * Provides type safety for database operations and queries
 */

import { User, Association, Session, UserRole } from './index';

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

/**
 * Raw user data as stored in database (usuarios table)
 * Includes all database fields with exact column names
 */
export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  nombre: string;
  telefono: string | null;
  rol: 'patron' | 'taxista';
  numero_taxista: string | null;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

/**
 * Raw association data as stored in database (asociaciones table)
 */
export interface AssociationEntity {
  id: string;
  patron_id: string;
  taxista_id: string;
  fecha_asociacion: Date;
  activa: boolean;
}

/**
 * Raw session data as stored in database (sesiones table)
 */
export interface SessionEntity {
  id: string;
  usuario_id: string;
  refresh_token: string;
  dispositivo: string | null;
  ip_address: string | null;
  fecha_creacion: Date;
  fecha_expiracion: Date;
  activa: boolean;
}

// ============================================================================
// DATABASE VIEW TYPES
// ============================================================================

/**
 * Active associations view (vista_asociaciones_activas)
 */
export interface ActiveAssociationView {
  id: string;
  patron_id: string;
  taxista_id: string;
  fecha_asociacion: Date;
  patron_nombre: string;
  patron_email: string;
  taxista_nombre: string;
  taxista_email: string;
  numero_taxista: string;
  taxista_telefono: string | null;
}

/**
 * Available taxistas view (vista_taxistas_disponibles)
 */
export interface AvailableTaxistaView {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  numero_taxista: string;
  fecha_creacion: Date;
}

/**
 * Patron dashboard view (vista_patron_dashboard)
 */
export interface PatronDashboardView {
  patron_id: string;
  patron_nombre: string;
  patron_email: string;
  total_taxistas_asociados: number;
  nuevas_asociaciones_mes: number;
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

/**
 * Parameters for user creation
 */
export interface CreateUserParams {
  email: string;
  password_hash: string;
  nombre: string;
  telefono?: string;
  rol: 'patron' | 'taxista';
  numero_taxista?: string;
}

/**
 * Parameters for user updates
 */
export interface UpdateUserParams {
  nombre?: string;
  telefono?: string;
  email?: string;
  fecha_actualizacion?: Date;
}

/**
 * Parameters for association creation
 */
export interface CreateAssociationParams {
  patron_id: string;
  taxista_id: string;
}

/**
 * Parameters for session creation
 */
export interface CreateSessionParams {
  usuario_id: string;
  refresh_token: string;
  dispositivo?: string;
  ip_address?: string;
  fecha_expiracion: Date;
}

/**
 * Query filters for users
 */
export interface UserQueryFilters {
  rol?: UserRole;
  activo?: boolean;
  email?: string;
  numero_taxista?: string;
  search?: string; // For name/email search
}

/**
 * Query filters for associations
 */
export interface AssociationQueryFilters {
  patron_id?: string;
  taxista_id?: string;
  activa?: boolean;
  fecha_desde?: Date;
  fecha_hasta?: Date;
}

/**
 * Query filters for sessions
 */
export interface SessionQueryFilters {
  usuario_id?: string;
  activa?: boolean;
  expired?: boolean;
  dispositivo?: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Database query result with pagination
 */
export interface PaginatedQueryResult<T> {
  rows: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform database user entity to domain user model
 */
export const transformUserEntity = (entity: UserEntity): User => ({
  id: entity.id,
  email: entity.email,
  nombre: entity.nombre,
  telefono: entity.telefono || undefined,
  rol: entity.rol as UserRole,
  numeroTaxista: entity.numero_taxista || undefined,
  activo: entity.activo,
  fechaCreacion: entity.fecha_creacion,
  fechaActualizacion: entity.fecha_actualizacion
});

/**
 * Transform database association entity to domain association model
 */
export const transformAssociationEntity = (entity: AssociationEntity): Association => ({
  id: entity.id,
  patronId: entity.patron_id,
  taxistaId: entity.taxista_id,
  fechaAsociacion: entity.fecha_asociacion,
  activa: entity.activa
});

/**
 * Transform database session entity to domain session model
 */
export const transformSessionEntity = (entity: SessionEntity): Session => ({
  id: entity.id,
  usuarioId: entity.usuario_id,
  refreshToken: entity.refresh_token,
  dispositivo: entity.dispositivo ?? undefined,
  ipAddress: entity.ip_address ?? undefined,
  fechaCreacion: entity.fecha_creacion,
  fechaExpiracion: entity.fecha_expiracion,
  activa: entity.activa
});

// ============================================================================
// DATABASE OPERATION TYPES
// ============================================================================

/**
 * Database transaction context
 */
export interface DatabaseTransaction {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Repository interface for users
 */
export interface IUserRepository {
  create(params: CreateUserParams): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByNumeroTaxista(numero: string): Promise<UserEntity | null>;
  update(id: string, params: UpdateUserParams): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  findMany(filters: UserQueryFilters, pagination?: PaginationParams): Promise<PaginatedQueryResult<UserEntity>>;
  exists(email: string): Promise<boolean>;
}

/**
 * Repository interface for associations
 */
export interface IAssociationRepository {
  create(params: CreateAssociationParams): Promise<AssociationEntity>;
  findById(id: string): Promise<AssociationEntity | null>;
  findByPatronId(patronId: string): Promise<AssociationEntity[]>;
  findByTaxistaId(taxistaId: string): Promise<AssociationEntity | null>;
  update(id: string, activa: boolean): Promise<AssociationEntity>;
  delete(id: string): Promise<void>;
  findMany(filters: AssociationQueryFilters, pagination?: PaginationParams): Promise<PaginatedQueryResult<AssociationEntity>>;
  findActiveAssociationsWithDetails(patronId?: string): Promise<ActiveAssociationView[]>;
  findAvailableTaxistas(search?: string): Promise<AvailableTaxistaView[]>;
}

/**
 * Repository interface for sessions
 */
export interface ISessionRepository {
  create(params: CreateSessionParams): Promise<SessionEntity>;
  findById(id: string): Promise<SessionEntity | null>;
  findByRefreshToken(token: string): Promise<SessionEntity | null>;
  findByUserId(userId: string): Promise<SessionEntity[]>;
  update(id: string, activa: boolean): Promise<SessionEntity>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteByUserId(userId: string): Promise<void>;
  findMany(filters: SessionQueryFilters, pagination?: PaginationParams): Promise<PaginatedQueryResult<SessionEntity>>;
}

// ============================================================================
// MIGRATION TYPES
// ============================================================================

/**
 * Database migration interface
 */
export interface Migration {
  version: string;
  name: string;
  up: (connection: DatabaseConnection) => Promise<void>;
  down: (connection: DatabaseConnection) => Promise<void>;
}

/**
 * Migration status
 */
export interface MigrationStatus {
  version: string;
  name: string;
  appliedAt: Date;
}

// ============================================================================
// SEED DATA TYPES
// ============================================================================

/**
 * Seed data for development/testing
 */
export interface SeedData {
  users: CreateUserParams[];
  associations: CreateAssociationParams[];
}

/**
 * Default seed data
 */
export const DEFAULT_SEED_DATA: SeedData = {
  users: [
    {
      email: 'patron@example.com',
      password_hash: '$2b$10$example_hash_patron',
      nombre: 'Juan Pérez',
      telefono: '+1234567890',
      rol: 'patron'
    },
    {
      email: 'taxista1@example.com',
      password_hash: '$2b$10$example_hash_taxista1',
      nombre: 'Carlos García',
      telefono: '+1234567891',
      rol: 'taxista',
      numero_taxista: 'TX001'
    },
    {
      email: 'taxista2@example.com',
      password_hash: '$2b$10$example_hash_taxista2',
      nombre: 'María López',
      telefono: '+1234567892',
      rol: 'taxista',
      numero_taxista: 'TX002'
    }
  ],
  associations: []
};