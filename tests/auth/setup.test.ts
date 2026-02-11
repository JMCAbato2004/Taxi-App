// Basic setup test to verify testing infrastructure
import { UserRole, Permission } from '../../src/auth/types';

describe('Authentication Setup Tests', () => {
  test('should have correct UserRole enum values', () => {
    expect(UserRole.PATRON).toBe('patron');
    expect(UserRole.TAXISTA).toBe('taxista');
  });

  test('should have correct Permission enum values', () => {
    expect(Permission.VIEW_ALL_DRIVERS).toBe('view_all_drivers');
    expect(Permission.MANAGE_ASSOCIATIONS).toBe('manage_associations');
    expect(Permission.VIEW_OWN_DATA).toBe('view_own_data');
    expect(Permission.EDIT_PROFILE).toBe('edit_profile');
  });

  test('should have localStorage mock available', () => {
    expect(localStorage.setItem).toBeDefined();
    expect(localStorage.getItem).toBeDefined();
    expect(localStorage.removeItem).toBeDefined();
    expect(localStorage.clear).toBeDefined();
  });

  test('should have crypto mock available', () => {
    expect(crypto.getRandomValues).toBeDefined();
    expect(crypto.subtle.digest).toBeDefined();
  });

  test('should have btoa and atob available', () => {
    expect(btoa).toBeDefined();
    expect(atob).toBeDefined();
    
    const testString = 'Hello World';
    const encoded = btoa(testString);
    const decoded = atob(encoded);
    
    expect(decoded).toBe(testString);
  });

  test('should have custom matchers available', () => {
    const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    expect(validJWT).toBeValidJWT();

    const validUser = {
      id: '123',
      email: 'test@example.com',
      nombre: 'Test User',
      rol: UserRole.TAXISTA,
      activo: true,
      permissions: [Permission.VIEW_OWN_DATA]
    };
    expect(validUser).toHaveValidUserStructure();
  });
});