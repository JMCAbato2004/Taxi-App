/**
 * Comprehensive checkpoint verification test for Task 4: Verificar autenticación básica
 * 
 * This test verifies all the basic authentication functionality:
 * 1. User registration works for both roles
 * 2. Login/logout functionality works
 * 3. JWT token management works
 * 4. Permission assignment works correctly
 * 5. Database schemas are properly implemented
 * 6. TypeScript interfaces are working
 */

import { AuthService } from '../auth-service';
import { RoleService } from '../role-service';
import { JWTUtils } from '../../utils/jwt-utils';
import { CryptoUtils } from '../../utils/crypto-utils';
import { UserRole, Permission, AuthError } from '../../types';

describe('Task 4: Checkpoint - Verificar autenticación básica', () => {
  let authService: AuthService;
  let roleService: RoleService;
  let jwtUtils: JWTUtils;
  let cryptoUtils: CryptoUtils;

  beforeEach(() => {
    jwtUtils = new JWTUtils();
    cryptoUtils = new CryptoUtils();
    authService = new AuthService(jwtUtils, cryptoUtils);
    roleService = new RoleService(() => authService.getCurrentUser());
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('1. User Registration for Both Roles', () => {
    it('should register patron users correctly', async () => {
      const patronData = {
        email: 'patron.test@example.com',
        password: 'SecurePass123',
        nombre: 'Test Patron',
        telefono: '+1234567890',
        rol: UserRole.PATRON
      };

      const patron = await authService.register(patronData);

      expect(patron).toBeDefined();
      expect(patron.email).toBe(patronData.email);
      expect(patron.nombre).toBe(patronData.nombre);
      expect(patron.rol).toBe(UserRole.PATRON);
      expect(patron.numeroTaxista).toBeUndefined();
      expect(patron.activo).toBe(true);
      expect(patron.id).toBeDefined();
      expect(patron.fechaCreacion).toBeInstanceOf(Date);
    });

    it('should register taxista users correctly with numero_taxista', async () => {
      const taxistaData = {
        email: 'taxista.test@example.com',
        password: 'SecurePass123',
        nombre: 'Test Taxista',
        telefono: '+1234567891',
        rol: UserRole.TAXISTA
      };

      const taxista = await authService.register(taxistaData);

      expect(taxista).toBeDefined();
      expect(taxista.email).toBe(taxistaData.email);
      expect(taxista.nombre).toBe(taxistaData.nombre);
      expect(taxista.rol).toBe(UserRole.TAXISTA);
      expect(taxista.numeroTaxista).toBeDefined();
      expect(taxista.numeroTaxista).toMatch(/^TX\d{3}$/);
      expect(taxista.activo).toBe(true);
    });

    it('should generate sequential unique taxista numbers', async () => {
      const taxista1 = await authService.register({
        email: 'taxista1@test.com',
        password: 'SecurePass123',
        nombre: 'Taxista 1',
        rol: UserRole.TAXISTA
      });

      const taxista2 = await authService.register({
        email: 'taxista2@test.com',
        password: 'SecurePass123',
        nombre: 'Taxista 2',
        rol: UserRole.TAXISTA
      });

      expect(taxista1.numeroTaxista).toBe('TX001');
      expect(taxista2.numeroTaxista).toBe('TX002');
    });
  });

  describe('2. Login/Logout Functionality', () => {
    beforeEach(async () => {
      // Register test users
      await authService.register({
        email: 'patron@test.com',
        password: 'SecurePass123',
        nombre: 'Test Patron',
        rol: UserRole.PATRON
      });

      await authService.register({
        email: 'taxista@test.com',
        password: 'SecurePass123',
        nombre: 'Test Taxista',
        rol: UserRole.TAXISTA
      });
    });

    it('should login patron users successfully', async () => {
      const loginResult = await authService.login({
        email: 'patron@test.com',
        password: 'SecurePass123'
      });

      expect(loginResult).toBeDefined();
      expect(loginResult.user.email).toBe('patron@test.com');
      expect(loginResult.user.rol).toBe(UserRole.PATRON);
      expect(loginResult.token).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();
      expect(loginResult.expiresAt).toBeInstanceOf(Date);
      expect(loginResult.permissions).toBeDefined();
      expect(loginResult.permissions.length).toBeGreaterThan(0);
    });

    it('should login taxista users successfully', async () => {
      const loginResult = await authService.login({
        email: 'taxista@test.com',
        password: 'SecurePass123'
      });

      expect(loginResult).toBeDefined();
      expect(loginResult.user.email).toBe('taxista@test.com');
      expect(loginResult.user.rol).toBe(UserRole.TAXISTA);
      expect(loginResult.token).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();
    });

    it('should maintain authentication state after login', async () => {
      await authService.login({
        email: 'patron@test.com',
        password: 'SecurePass123'
      });

      expect(authService.isAuthenticated()).toBe(true);
      
      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser?.email).toBe('patron@test.com');
    });

    it('should clear authentication state after logout', async () => {
      await authService.login({
        email: 'patron@test.com',
        password: 'SecurePass123'
      });

      expect(authService.isAuthenticated()).toBe(true);

      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should reject login with invalid credentials', async () => {
      await expect(authService.login({
        email: 'patron@test.com',
        password: 'WrongPassword'
      })).rejects.toThrow(AuthError);

      await expect(authService.login({
        email: 'nonexistent@test.com',
        password: 'SecurePass123'
      })).rejects.toThrow(AuthError);
    });
  });

  describe('3. JWT Token Management', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'token@test.com',
        password: 'SecurePass123',
        nombre: 'Token Test',
        rol: UserRole.TAXISTA
      });
    });

    it('should generate valid JWT tokens', async () => {
      const loginResult = await authService.login({
        email: 'token@test.com',
        password: 'SecurePass123'
      });

      const token = loginResult.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include correct payload in JWT tokens', async () => {
      const loginResult = await authService.login({
        email: 'token@test.com',
        password: 'SecurePass123'
      });

      const payload = jwtUtils.getTokenPayload(loginResult.token);
      expect(payload).toBeDefined();
      expect(payload?.email).toBe('token@test.com');
      expect(payload?.role).toBe(UserRole.TAXISTA);
      expect(payload?.numeroTaxista).toMatch(/^TX\d{3}$/);
      expect(payload?.permissions).toBeDefined();
    });

    it('should refresh tokens successfully', async () => {
      await authService.login({
        email: 'token@test.com',
        password: 'SecurePass123'
      });

      const newToken = await authService.refreshToken();
      expect(newToken).toBeDefined();
      expect(typeof newToken).toBe('string');
      expect(newToken.split('.')).toHaveLength(3);
    });

    it('should validate token expiration', async () => {
      const loginResult = await authService.login({
        email: 'token@test.com',
        password: 'SecurePass123'
      });

      const isExpired = jwtUtils.isTokenExpired(loginResult.token);
      expect(isExpired).toBe(false);
    });
  });

  describe('4. Permission Assignment', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'patron.perm@test.com',
        password: 'SecurePass123',
        nombre: 'Patron Permissions',
        rol: UserRole.PATRON
      });

      await authService.register({
        email: 'taxista.perm@test.com',
        password: 'SecurePass123',
        nombre: 'Taxista Permissions',
        rol: UserRole.TAXISTA
      });
    });

    it('should assign correct permissions to patron users', async () => {
      await authService.login({
        email: 'patron.perm@test.com',
        password: 'SecurePass123'
      });

      const permissions = roleService.getPermissions();
      const expectedPermissions = [
        Permission.VIEW_ALL_DRIVERS,
        Permission.MANAGE_ASSOCIATIONS,
        Permission.VIEW_AGGREGATED_REPORTS,
        Permission.SEARCH_AVAILABLE_TAXISTAS,
        Permission.EDIT_PROFILE,
        Permission.CHANGE_PASSWORD,
        Permission.VIEW_NOTIFICATIONS
      ];

      for (const permission of expectedPermissions) {
        expect(permissions).toContain(permission);
        expect(roleService.hasPermission(permission)).toBe(true);
      }
    });

    it('should assign correct permissions to taxista users', async () => {
      await authService.login({
        email: 'taxista.perm@test.com',
        password: 'SecurePass123'
      });

      const permissions = roleService.getPermissions();
      const expectedPermissions = [
        Permission.VIEW_OWN_DATA,
        Permission.EDIT_OWN_PROFILE,
        Permission.VIEW_OWN_HISTORY,
        Permission.INPUT_OPERATIONAL_DATA,
        Permission.EDIT_PROFILE,
        Permission.CHANGE_PASSWORD,
        Permission.VIEW_NOTIFICATIONS
      ];

      for (const permission of expectedPermissions) {
        expect(permissions).toContain(permission);
        expect(roleService.hasPermission(permission)).toBe(true);
      }
    });

    it('should restrict taxista from patron permissions', async () => {
      await authService.login({
        email: 'taxista.perm@test.com',
        password: 'SecurePass123'
      });

      const restrictedPermissions = [
        Permission.VIEW_ALL_DRIVERS,
        Permission.MANAGE_ASSOCIATIONS,
        Permission.VIEW_AGGREGATED_REPORTS,
        Permission.SEARCH_AVAILABLE_TAXISTAS
      ];

      for (const permission of restrictedPermissions) {
        expect(roleService.hasPermission(permission)).toBe(false);
      }
    });

    it('should detect user roles correctly', async () => {
      await authService.login({
        email: 'patron.perm@test.com',
        password: 'SecurePass123'
      });

      expect(roleService.getUserRole()).toBe(UserRole.PATRON);

      await authService.logout();
      await authService.login({
        email: 'taxista.perm@test.com',
        password: 'SecurePass123'
      });

      expect(roleService.getUserRole()).toBe(UserRole.TAXISTA);
    });
  });

  describe('5. Role Service Functionality', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'patron.role@test.com',
        password: 'SecurePass123',
        nombre: 'Patron Role',
        rol: UserRole.PATRON
      });

      await authService.register({
        email: 'taxista.role@test.com',
        password: 'SecurePass123',
        nombre: 'Taxista Role',
        rol: UserRole.TAXISTA
      });
    });

    it('should search available taxistas for patron', async () => {
      await authService.login({
        email: 'patron.role@test.com',
        password: 'SecurePass123'
      });

      const availableTaxistas = await roleService.searchAvailableTaxistas();
      expect(availableTaxistas).toBeDefined();
      expect(Array.isArray(availableTaxistas)).toBe(true);
      expect(availableTaxistas.length).toBeGreaterThan(0);

      const taxista = availableTaxistas[0];
      expect(taxista?.id).toBeDefined();
      expect(taxista?.email).toBeDefined();
      expect(taxista?.nombre).toBeDefined();
      expect(taxista?.numeroTaxista).toMatch(/^TX\d{3}$/);
    });

    it('should restrict taxista from searching available taxistas', async () => {
      await authService.login({
        email: 'taxista.role@test.com',
        password: 'SecurePass123'
      });

      await expect(roleService.searchAvailableTaxistas())
        .rejects
        .toThrow(AuthError);
    });

    it('should return empty associations for new users', async () => {
      await authService.login({
        email: 'patron.role@test.com',
        password: 'SecurePass123'
      });

      const associatedUsers = await roleService.getAssociatedUsers();
      expect(associatedUsers).toBeDefined();
      expect(Array.isArray(associatedUsers)).toBe(true);
      expect(associatedUsers.length).toBe(0);
    });
  });

  describe('6. Password Management', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'password@test.com',
        password: 'OriginalPass123',
        nombre: 'Password Test',
        rol: UserRole.PATRON
      });
    });

    it('should change password successfully', async () => {
      await authService.login({
        email: 'password@test.com',
        password: 'OriginalPass123'
      });

      await expect(authService.changePassword('OriginalPass123', 'NewPassword123'))
        .resolves
        .not.toThrow();
    });

    it('should reject password change with wrong current password', async () => {
      await authService.login({
        email: 'password@test.com',
        password: 'OriginalPass123'
      });

      await expect(authService.changePassword('WrongPassword', 'NewPassword123'))
        .rejects
        .toThrow(AuthError);
    });

    it('should reject weak new passwords', async () => {
      await authService.login({
        email: 'password@test.com',
        password: 'OriginalPass123'
      });

      await expect(authService.changePassword('OriginalPass123', '123'))
        .rejects
        .toThrow(AuthError);
    });
  });

  describe('7. Data Validation', () => {
    it('should reject registration with invalid email', async () => {
      await expect(authService.register({
        email: 'invalid-email',
        password: 'SecurePass123',
        nombre: 'Test User',
        rol: UserRole.PATRON
      })).rejects.toThrow(AuthError);
    });

    it('should reject registration with weak password', async () => {
      await expect(authService.register({
        email: 'test@example.com',
        password: '123',
        nombre: 'Test User',
        rol: UserRole.PATRON
      })).rejects.toThrow(AuthError);
    });

    it('should reject registration with missing required fields', async () => {
      await expect(authService.register({
        email: '',
        password: 'SecurePass123',
        nombre: 'Test User',
        rol: UserRole.PATRON
      })).rejects.toThrow(AuthError);

      await expect(authService.register({
        email: 'test@example.com',
        password: '',
        nombre: 'Test User',
        rol: UserRole.PATRON
      })).rejects.toThrow(AuthError);

      await expect(authService.register({
        email: 'test@example.com',
        password: 'SecurePass123',
        nombre: '',
        rol: UserRole.PATRON
      })).rejects.toThrow(AuthError);
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'SecurePass123',
        nombre: 'Test User',
        rol: UserRole.PATRON
      };

      await authService.register(userData);

      await expect(authService.register(userData))
        .rejects
        .toThrow(AuthError);
    });
  });

  describe('8. Offline Access Validation', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'offline@test.com',
        password: 'SecurePass123',
        nombre: 'Offline Test',
        rol: UserRole.TAXISTA
      });
    });

    it('should validate offline access after login', async () => {
      await authService.login({
        email: 'offline@test.com',
        password: 'SecurePass123'
      });

      const hasOfflineAccess = authService.validateOfflineAccess();
      expect(hasOfflineAccess).toBe(true);
    });

    it('should return false for offline access when not logged in', () => {
      const hasOfflineAccess = authService.validateOfflineAccess();
      expect(hasOfflineAccess).toBe(false);
    });
  });

  describe('9. Integration Test - Complete Flow', () => {
    it('should complete full authentication flow for both roles', async () => {
      // Register both types of users
      const patron = await authService.register({
        email: 'integration.patron@test.com',
        password: 'SecurePass123',
        nombre: 'Integration Patron',
        telefono: '+1234567890',
        rol: UserRole.PATRON
      });

      const taxista = await authService.register({
        email: 'integration.taxista@test.com',
        password: 'SecurePass123',
        nombre: 'Integration Taxista',
        telefono: '+1234567891',
        rol: UserRole.TAXISTA
      });

      // Verify registration
      expect(patron.rol).toBe(UserRole.PATRON);
      expect(patron.numeroTaxista).toBeUndefined();
      expect(taxista.rol).toBe(UserRole.TAXISTA);
      expect(taxista.numeroTaxista).toBeDefined();

      // Test patron login and permissions
      const patronLogin = await authService.login({
        email: 'integration.patron@test.com',
        password: 'SecurePass123'
      });

      expect(patronLogin.user.id).toBe(patron.id);
      expect(patronLogin.permissions).toContain(Permission.MANAGE_ASSOCIATIONS);
      expect(roleService.hasPermission(Permission.SEARCH_AVAILABLE_TAXISTAS)).toBe(true);

      // Test taxista search
      const availableTaxistas = await roleService.searchAvailableTaxistas();
      expect(availableTaxistas.length).toBeGreaterThan(0);

      // Logout and test taxista login
      await authService.logout();
      expect(authService.isAuthenticated()).toBe(false);

      const taxistaLogin = await authService.login({
        email: 'integration.taxista@test.com',
        password: 'SecurePass123'
      });

      expect(taxistaLogin.user.id).toBe(taxista.id);
      expect(taxistaLogin.permissions).toContain(Permission.VIEW_OWN_DATA);
      expect(roleService.hasPermission(Permission.INPUT_OPERATIONAL_DATA)).toBe(true);
      expect(roleService.hasPermission(Permission.MANAGE_ASSOCIATIONS)).toBe(false);

      // Test token management
      const newToken = await authService.refreshToken();
      expect(newToken).toBeDefined();

      // Test password change
      await authService.changePassword('SecurePass123', 'NewSecurePass123');

      // Verify old password doesn't work
      await authService.logout();
      await expect(authService.login({
        email: 'integration.taxista@test.com',
        password: 'SecurePass123'
      })).rejects.toThrow(AuthError);

      // Verify new password works
      const newLogin = await authService.login({
        email: 'integration.taxista@test.com',
        password: 'NewSecurePass123'
      });

      expect(newLogin.user.id).toBe(taxista.id);
    });
  });
});