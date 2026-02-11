/**
 * Database-specific types and interfaces
 * Provides type safety for database operations and queries
 */
// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================
/**
 * Transform database user entity to domain user model
 */
export const transformUserEntity = (entity) => ({
    id: entity.id,
    email: entity.email,
    nombre: entity.nombre,
    telefono: entity.telefono || undefined,
    rol: entity.rol,
    numeroTaxista: entity.numero_taxista || undefined,
    activo: entity.activo,
    fechaCreacion: entity.fecha_creacion,
    fechaActualizacion: entity.fecha_actualizacion
});
/**
 * Transform database association entity to domain association model
 */
export const transformAssociationEntity = (entity) => ({
    id: entity.id,
    patronId: entity.patron_id,
    taxistaId: entity.taxista_id,
    fechaAsociacion: entity.fecha_asociacion,
    activa: entity.activa
});
/**
 * Transform database session entity to domain session model
 */
export const transformSessionEntity = (entity) => ({
    id: entity.id,
    usuarioId: entity.usuario_id,
    refreshToken: entity.refresh_token,
    dispositivo: entity.dispositivo ?? undefined,
    ipAddress: entity.ip_address ?? undefined,
    fechaCreacion: entity.fecha_creacion,
    fechaExpiracion: entity.fecha_expiracion,
    activa: entity.activa
});
/**
 * Default seed data
 */
export const DEFAULT_SEED_DATA = {
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
//# sourceMappingURL=database.js.map