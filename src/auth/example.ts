// Example usage of the authentication system
import { AuthService } from './services/auth-service';
import { JWTUtils } from './utils/jwt-utils';
import { CryptoUtils } from './utils/crypto-utils';
import { UserRole } from './types';
import { demonstrateRegistration } from './demo/registration-demo';

// Initialize the authentication system
export function initializeAuthSystem(): {
  authService: AuthService;
} {
  // Create utility instances
  const jwtUtils = new JWTUtils();
  const cryptoUtils = new CryptoUtils();

  // Create services
  const authService = new AuthService(jwtUtils, cryptoUtils);

  return { authService };
}

// Example usage functions
export async function exampleUsage(): Promise<void> {
  const { authService } = initializeAuthSystem();

  try {
    // Example 1: Register a new patron
    console.log('=== Registering new patron ===');
    const patronData = {
      email: 'patron@example.com',
      password: 'SecurePassword123',
      nombre: 'Juan Pérez',
      telefono: '+34123456789',
      rol: UserRole.PATRON
    };

    const patron = await authService.register(patronData);
    console.log('Patron registered:', {
      id: patron.id,
      email: patron.email,
      nombre: patron.nombre,
      rol: patron.rol,
      numeroTaxista: patron.numeroTaxista
    });

    // Example 2: Register a new taxista
    console.log('\n=== Registering new taxista ===');
    const taxistaData = {
      email: 'taxista@example.com',
      password: 'SecurePassword456',
      nombre: 'María García',
      telefono: '+34987654321',
      rol: UserRole.TAXISTA
    };

    const taxista = await authService.register(taxistaData);
    console.log('Taxista registered:', {
      id: taxista.id,
      email: taxista.email,
      nombre: taxista.nombre,
      rol: taxista.rol,
      numeroTaxista: taxista.numeroTaxista
    });

    // Example 3: Login as patron
    console.log('\n=== Logging in as patron ===');
    await authService.logout(); // Clear current session
    
    const patronLoginResult = await authService.login({
      email: 'patron@example.com',
      password: 'SecurePassword123'
    });
    console.log('Patron logged in:', {
      email: patronLoginResult.user.email,
      rol: patronLoginResult.user.rol,
      permissions: patronLoginResult.permissions
    });

    // Example 4: Login as taxista
    console.log('\n=== Logging in as taxista ===');
    await authService.logout();
    
    const taxistaLoginResult = await authService.login({
      email: 'taxista@example.com',
      password: 'SecurePassword456'
    });
    console.log('Taxista logged in:', {
      email: taxistaLoginResult.user.email,
      rol: taxistaLoginResult.user.rol,
      numeroTaxista: taxistaLoginResult.user.numeroTaxista,
      permissions: taxistaLoginResult.permissions
    });

    console.log('\n=== Authentication system example completed successfully! ===');

  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// Task 3.3 Registration Demo
export async function runRegistrationDemo(): Promise<void> {
  console.log('🚀 Running Task 3.3 Registration Demo...\n');
  await demonstrateRegistration();
}

// Export for use in browser console or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).authExample = { 
    initializeAuthSystem, 
    exampleUsage, 
    runRegistrationDemo 
  };
} else if (typeof global !== 'undefined') {
  // Node.js environment
  (global as any).authExample = { 
    initializeAuthSystem, 
    exampleUsage, 
    runRegistrationDemo 
  };
}