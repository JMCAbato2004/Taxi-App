export declare enum UserRole {
    PATRON = "patron",
    TAXISTA = "taxista"
}
export declare enum Permission {
    VIEW_ALL_DRIVERS = "view_all_drivers",
    MANAGE_ASSOCIATIONS = "manage_associations",
    VIEW_OWN_DATA = "view_own_data",
    EDIT_PROFILE = "edit_profile",
    VIEW_REPORTS = "view_reports",
    MANAGE_SERVICES = "manage_services",
    MANAGE_EXPENSES = "manage_expenses"
}
export interface User {
    id: string;
    email: string;
    nombre: string;
    telefono?: string;
    rol: UserRole;
    numeroTaxista?: string;
    activo: boolean;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    permissions: Permission[];
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    password: string;
    nombre: string;
    telefono?: string;
    rol: UserRole;
}
export interface AuthResult {
    user: User;
    token: string;
    refreshToken: string;
    expiresAt: Date;
}
export interface Association {
    id: string;
    patronId: string;
    taxistaId: string;
    fechaAsociacion: Date;
    activa: boolean;
}
export interface Session {
    id: string;
    usuarioId: string;
    refreshToken: string;
    dispositivo?: string;
    ipAddress?: string;
    fechaCreacion: Date;
    fechaExpiracion: Date;
    activa: boolean;
}
export interface JWTPayload {
    sub: string;
    email: string;
    role: UserRole;
    numeroTaxista?: string;
    permissions: Permission[];
    iat: number;
    exp: number;
}
export declare enum AuthErrorCodes {
    INVALID_CREDENTIALS = "AUTH_001",
    SESSION_EXPIRED = "AUTH_002",
    INSUFFICIENT_PERMISSIONS = "AUTH_003",
    INVALID_TOKEN = "AUTH_004",
    USER_NOT_FOUND = "AUTH_005",
    DUPLICATE_EMAIL = "AUTH_006",
    INVALID_ASSOCIATION = "AUTH_007",
    ROLE_MISMATCH = "AUTH_008",
    VALIDATION_ERROR = "AUTH_009",
    NETWORK_ERROR = "AUTH_010"
}
export declare class AuthError extends Error {
    code: AuthErrorCodes;
    details?: any | undefined;
    constructor(code: AuthErrorCodes, message: string, details?: any | undefined);
}
export interface OfflineAuthData {
    user: User;
    token: string;
    expiresAt: Date;
    lastSync: Date;
}
export interface PendingOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'user' | 'association';
    data: any;
    timestamp: Date;
    userId: string;
}
//# sourceMappingURL=index.d.ts.map