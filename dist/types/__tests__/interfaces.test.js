/**
 * Unit tests for TypeScript interfaces and type definitions
 * Validates type safety and interface contracts
 */
import { UserRole, Permission, isPatronUser, isTaxistaUser, ROLE_PERMISSIONS, TAXISTA_NUMBER_REGEX, EMAIL_REGEX } from '../index';
import { transformUserEntity, transformAssociationEntity, transformSessionEntity } from '../database';
import { validateUserRegistration, validateLogin, validateField, USER_REGISTRATION_SCHEMA, RequiredRule, EmailRule, PasswordStrengthRule, PhoneRule, ValidationErrorCode } from '../validation';
describe('TypeScript Interfaces', () => {
    describe('User Types', () => {
        it('should create valid patron user', () => {
            const patronUser = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'patron@example.com',
                nombre: 'Juan Pérez',
                telefono: '+1234567890',
                rol: UserRole.PATRON,
                numeroTaxista: undefined,
                activo: true,
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
            expect(patronUser.rol).toBe(UserRole.PATRON);
            expect(patronUser.numeroTaxista).toBeUndefined();
            expect(isPatronUser(patronUser)).toBe(true);
            expect(isTaxistaUser(patronUser)).toBe(false);
        });
        it('should create valid taxista user', () => {
            const taxistaUser = {
                id: '123e4567-e89b-12d3-a456-426614174001',
                email: 'taxista@example.com',
                nombre: 'Carlos García',
                telefono: '+1234567891',
                rol: UserRole.TAXISTA,
                numeroTaxista: 'TX001',
                activo: true,
                fechaCreacion: new Date(),
                fechaActualizacion: new Date()
            };
            expect(taxistaUser.rol).toBe(UserRole.TAXISTA);
            expect(taxistaUser.numeroTaxista).toBe('TX001');
            expect(isTaxistaUser(taxistaUser)).toBe(true);
            expect(isPatronUser(taxistaUser)).toBe(false);
        });
        it('should validate taxista number format', () => {
            expect(TAXISTA_NUMBER_REGEX.test('TX001')).toBe(true);
            expect(TAXISTA_NUMBER_REGEX.test('TX999')).toBe(true);
            expect(TAXISTA_NUMBER_REGEX.test('TX000')).toBe(true);
            expect(TAXISTA_NUMBER_REGEX.test('TX1000')).toBe(false);
            expect(TAXISTA_NUMBER_REGEX.test('T001')).toBe(false);
            expect(TAXISTA_NUMBER_REGEX.test('TX01')).toBe(false);
        });
        it('should validate email format', () => {
            expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
            expect(EMAIL_REGEX.test('test.email+tag@domain.co.uk')).toBe(true);
            expect(EMAIL_REGEX.test('invalid-email')).toBe(false);
            expect(EMAIL_REGEX.test('@domain.com')).toBe(false);
            expect(EMAIL_REGEX.test('user@')).toBe(false);
        });
    });
    describe('Permission System', () => {
        it('should assign correct permissions to patron role', () => {
            const patronPermissions = ROLE_PERMISSIONS[UserRole.PATRON];
            expect(patronPermissions).toContain(Permission.VIEW_ALL_DRIVERS);
            expect(patronPermissions).toContain(Permission.MANAGE_ASSOCIATIONS);
            expect(patronPermissions).toContain(Permission.VIEW_AGGREGATED_REPORTS);
            expect(patronPermissions).toContain(Permission.SEARCH_AVAILABLE_TAXISTAS);
            expect(patronPermissions).toContain(Permission.EDIT_PROFILE);
            expect(patronPermissions).toContain(Permission.CHANGE_PASSWORD);
            expect(patronPermissions).toContain(Permission.VIEW_NOTIFICATIONS);
        });
        it('should assign correct permissions to taxista role', () => {
            const taxistaPermissions = ROLE_PERMISSIONS[UserRole.TAXISTA];
            expect(taxistaPermissions).toContain(Permission.VIEW_OWN_DATA);
            expect(taxistaPermissions).toContain(Permission.EDIT_OWN_PROFILE);
            expect(taxistaPermissions).toContain(Permission.VIEW_OWN_HISTORY);
            expect(taxistaPermissions).toContain(Permission.INPUT_OPERATIONAL_DATA);
            expect(taxistaPermissions).toContain(Permission.EDIT_PROFILE);
            expect(taxistaPermissions).toContain(Permission.CHANGE_PASSWORD);
            expect(taxistaPermissions).toContain(Permission.VIEW_NOTIFICATIONS);
        });
        it('should not allow taxistas to have patron permissions', () => {
            const taxistaPermissions = ROLE_PERMISSIONS[UserRole.TAXISTA];
            expect(taxistaPermissions).not.toContain(Permission.VIEW_ALL_DRIVERS);
            expect(taxistaPermissions).not.toContain(Permission.MANAGE_ASSOCIATIONS);
            expect(taxistaPermissions).not.toContain(Permission.VIEW_AGGREGATED_REPORTS);
            expect(taxistaPermissions).not.toContain(Permission.SEARCH_AVAILABLE_TAXISTAS);
        });
    });
    describe('Association Types', () => {
        it('should create valid association', () => {
            const association = {
                id: '123e4567-e89b-12d3-a456-426614174002',
                patronId: '123e4567-e89b-12d3-a456-426614174000',
                taxistaId: '123e4567-e89b-12d3-a456-426614174001',
                fechaAsociacion: new Date(),
                activa: true
            };
            expect(association.patronId).toBeDefined();
            expect(association.taxistaId).toBeDefined();
            expect(association.patronId).not.toBe(association.taxistaId);
            expect(association.activa).toBe(true);
        });
    });
    describe('Authentication Types', () => {
        it('should create valid login credentials', () => {
            const credentials = {
                email: 'user@example.com',
                password: 'securePassword123'
            };
            expect(credentials.email).toBeDefined();
            expect(credentials.password).toBeDefined();
        });
        it('should create valid auth result', () => {
            const authResult = {
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'patron@example.com',
                    nombre: 'Juan Pérez',
                    rol: UserRole.PATRON,
                    activo: true,
                    fechaCreacion: new Date(),
                    fechaActualizacion: new Date()
                },
                token: 'jwt.token.here',
                refreshToken: 'refresh.token.here',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
                permissions: ROLE_PERMISSIONS[UserRole.PATRON]
            };
            expect(authResult.user.rol).toBe(UserRole.PATRON);
            expect(authResult.permissions).toEqual(ROLE_PERMISSIONS[UserRole.PATRON]);
        });
        it('should create valid JWT payload', () => {
            const payload = {
                sub: '123e4567-e89b-12d3-a456-426614174001',
                email: 'taxista@example.com',
                role: UserRole.TAXISTA,
                numeroTaxista: 'TX001',
                permissions: ROLE_PERMISSIONS[UserRole.TAXISTA],
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15 minutes
            };
            expect(payload.role).toBe(UserRole.TAXISTA);
            expect(payload.numeroTaxista).toBe('TX001');
            expect(payload.exp).toBeGreaterThan(payload.iat);
        });
    });
    describe('Database Transformations', () => {
        it('should transform user entity to domain model', () => {
            const entity = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'patron@example.com',
                password_hash: '$2b$10$hashedpassword',
                nombre: 'Juan Pérez',
                telefono: '+1234567890',
                rol: 'patron',
                numero_taxista: null,
                activo: true,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            };
            const user = transformUserEntity(entity);
            expect(user.id).toBe(entity.id);
            expect(user.email).toBe(entity.email);
            expect(user.nombre).toBe(entity.nombre);
            expect(user.telefono).toBe(entity.telefono);
            expect(user.rol).toBe(UserRole.PATRON);
            expect(user.numeroTaxista).toBeUndefined();
            expect(user.activo).toBe(entity.activo);
        });
        it('should transform taxista entity with numero_taxista', () => {
            const entity = {
                id: '123e4567-e89b-12d3-a456-426614174001',
                email: 'taxista@example.com',
                password_hash: '$2b$10$hashedpassword',
                nombre: 'Carlos García',
                telefono: null,
                rol: 'taxista',
                numero_taxista: 'TX001',
                activo: true,
                fecha_creacion: new Date(),
                fecha_actualizacion: new Date()
            };
            const user = transformUserEntity(entity);
            expect(user.rol).toBe(UserRole.TAXISTA);
            expect(user.numeroTaxista).toBe('TX001');
            expect(user.telefono).toBeUndefined();
        });
        it('should transform association entity', () => {
            const entity = {
                id: '123e4567-e89b-12d3-a456-426614174002',
                patron_id: '123e4567-e89b-12d3-a456-426614174000',
                taxista_id: '123e4567-e89b-12d3-a456-426614174001',
                fecha_asociacion: new Date(),
                activa: true
            };
            const association = transformAssociationEntity(entity);
            expect(association.id).toBe(entity.id);
            expect(association.patronId).toBe(entity.patron_id);
            expect(association.taxistaId).toBe(entity.taxista_id);
            expect(association.fechaAsociacion).toBe(entity.fecha_asociacion);
            expect(association.activa).toBe(entity.activa);
        });
        it('should transform session entity', () => {
            const entity = {
                id: '123e4567-e89b-12d3-a456-426614174003',
                usuario_id: '123e4567-e89b-12d3-a456-426614174000',
                refresh_token: 'refresh.token.here',
                dispositivo: 'iPhone 12',
                ip_address: '192.168.1.1',
                fecha_creacion: new Date(),
                fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                activa: true
            };
            const session = transformSessionEntity(entity);
            expect(session.id).toBe(entity.id);
            expect(session.usuarioId).toBe(entity.usuario_id);
            expect(session.refreshToken).toBe(entity.refresh_token);
            expect(session.dispositivo).toBe(entity.dispositivo);
            expect(session.ipAddress).toBe(entity.ip_address);
            expect(session.activa).toBe(entity.activa);
        });
    });
    describe('Validation System', () => {
        describe('Validation Rules', () => {
            it('should validate required fields', () => {
                const rule = new RequiredRule();
                expect(rule.validate('value').isValid).toBe(true);
                expect(rule.validate('').isValid).toBe(false);
                expect(rule.validate(null).isValid).toBe(false);
                expect(rule.validate(undefined).isValid).toBe(false);
            });
            it('should validate email format', () => {
                const rule = new EmailRule();
                expect(rule.validate('user@example.com').isValid).toBe(true);
                expect(rule.validate('test.email+tag@domain.co.uk').isValid).toBe(true);
                expect(rule.validate('invalid-email').isValid).toBe(false);
                expect(rule.validate('@domain.com').isValid).toBe(false);
                expect(rule.validate('').isValid).toBe(true); // Empty is valid (let required rule handle it)
            });
            it('should validate password strength', () => {
                const rule = new PasswordStrengthRule();
                expect(rule.validate('StrongPass123').isValid).toBe(true);
                expect(rule.validate('weak').isValid).toBe(false);
                expect(rule.validate('nouppercase123').isValid).toBe(false);
                expect(rule.validate('NOLOWERCASE123').isValid).toBe(false);
                expect(rule.validate('NoNumbers').isValid).toBe(false);
                expect(rule.validate('').isValid).toBe(true); // Empty is valid (let required rule handle it)
            });
            it('should validate phone numbers', () => {
                const rule = new PhoneRule();
                expect(rule.validate('+1234567890').isValid).toBe(true);
                expect(rule.validate('123-456-7890').isValid).toBe(true);
                expect(rule.validate('(123) 456-7890').isValid).toBe(true);
                expect(rule.validate('123').isValid).toBe(false);
                expect(rule.validate('abc').isValid).toBe(false);
                expect(rule.validate('').isValid).toBe(true); // Optional field
            });
        });
        describe('Form Validation', () => {
            it('should validate user registration with valid data', () => {
                const validData = {
                    email: 'user@example.com',
                    password: 'StrongPass123',
                    confirmPassword: 'StrongPass123',
                    nombre: 'Juan Pérez',
                    telefono: '+1234567890',
                    rol: 'patron'
                };
                const result = validateUserRegistration(validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
            it('should reject registration with invalid email', () => {
                const invalidData = {
                    email: 'invalid-email',
                    password: 'StrongPass123',
                    confirmPassword: 'StrongPass123',
                    nombre: 'Juan Pérez',
                    rol: 'patron'
                };
                const result = validateUserRegistration(invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors.some(e => e.field === 'email')).toBe(true);
            });
            it('should reject registration with weak password', () => {
                const invalidData = {
                    email: 'user@example.com',
                    password: 'weak',
                    confirmPassword: 'weak',
                    nombre: 'Juan Pérez',
                    rol: 'patron'
                };
                const result = validateUserRegistration(invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors.some(e => e.field === 'password')).toBe(true);
            });
            it('should reject registration with mismatched passwords', () => {
                const invalidData = {
                    email: 'user@example.com',
                    password: 'StrongPass123',
                    confirmPassword: 'DifferentPass123',
                    nombre: 'Juan Pérez',
                    rol: 'patron'
                };
                const result = validateUserRegistration(invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors.some(e => e.field === 'confirmPassword')).toBe(true);
            });
            it('should reject registration with missing required fields', () => {
                const invalidData = {
                    email: '',
                    password: '',
                    confirmPassword: '',
                    nombre: '',
                    rol: ''
                };
                const result = validateUserRegistration(invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
                expect(result.errors.some(e => e.code === ValidationErrorCode.REQUIRED)).toBe(true);
            });
            it('should validate login with valid credentials', () => {
                const validData = {
                    email: 'user@example.com',
                    password: 'password123'
                };
                const result = validateLogin(validData);
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
            it('should reject login with invalid email', () => {
                const invalidData = {
                    email: 'invalid-email',
                    password: 'password123'
                };
                const result = validateLogin(invalidData);
                expect(result.isValid).toBe(false);
                expect(result.errors.some(e => e.field === 'email')).toBe(true);
            });
        });
        describe('Field Validation', () => {
            it('should validate individual fields correctly', () => {
                const emailErrors = validateField('email', 'invalid-email', USER_REGISTRATION_SCHEMA);
                expect(emailErrors.length).toBeGreaterThan(0);
                expect(emailErrors[0]?.field).toBe('email');
                const validEmailErrors = validateField('email', 'user@example.com', USER_REGISTRATION_SCHEMA);
                expect(validEmailErrors).toHaveLength(0);
            });
            it('should handle optional fields correctly', () => {
                const phoneErrors = validateField('telefono', '', USER_REGISTRATION_SCHEMA);
                expect(phoneErrors).toHaveLength(0); // Optional field, empty is valid
                const invalidPhoneErrors = validateField('telefono', 'abc', USER_REGISTRATION_SCHEMA);
                expect(invalidPhoneErrors.length).toBeGreaterThan(0);
            });
        });
    });
});
//# sourceMappingURL=interfaces.test.js.map