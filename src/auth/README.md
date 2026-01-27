# Sistema de Autenticación con Roles

Este módulo implementa un sistema de autenticación con control de acceso basado en roles (RBAC) para la aplicación PWA de taxi.

## Estructura del Proyecto

```
src/auth/
├── index.ts                    # Exportaciones principales
├── types/
│   └── index.ts               # Tipos e interfaces
├── services/
│   ├── auth-service.ts        # Servicio de autenticación
│   └── role-service.ts        # Servicio de gestión de roles
├── utils/
│   ├── jwt-utils.ts           # Utilidades JWT
│   ├── crypto-utils.ts        # Utilidades de encriptación
│   └── validation-utils.ts    # Utilidades de validación
└── README.md                  # Este archivo
```

## Características Principales

### 🔐 Autenticación
- Registro de usuarios con selección de rol (Patrón/Taxista)
- Inicio de sesión con JWT
- Renovación automática de tokens
- Soporte offline con almacenamiento local

### 👥 Gestión de Roles
- **Patrón**: Puede gestionar taxistas y ver datos agregados
- **Taxista**: Acceso a datos personales y operaciones básicas
- Sistema de permisos granular

### 🔗 Asociaciones
- Los patrones pueden asociar taxistas
- Validación de asociaciones únicas
- Notificaciones de nuevas asociaciones

### 🛡️ Seguridad
- Encriptación de contraseñas
- Validación de fortaleza de contraseñas
- Tokens JWT con expiración
- Sanitización de datos de entrada

## Uso Básico

### Inicialización

```typescript
import { AuthService, RoleService, JWTUtils, CryptoUtils, ValidationUtils } from './auth';

// Crear instancias de utilidades
const jwtUtils = new JWTUtils();
const cryptoUtils = new CryptoUtils();
const validationUtils = new ValidationUtils();

// Crear servicios
const authService = new AuthService(jwtUtils, cryptoUtils, validationUtils);
const roleService = new RoleService(() => authService.getCurrentUser());
```

### Registro de Usuario

```typescript
const userData = {
  email: 'patron@example.com',
  password: 'SecurePassword123!',
  nombre: 'Juan Pérez',
  telefono: '+34123456789',
  rol: UserRole.PATRON
};

try {
  const result = await authService.register(userData);
  console.log('Usuario registrado:', result.user);
} catch (error) {
  console.error('Error en registro:', error.message);
}
```

### Inicio de Sesión

```typescript
const credentials = {
  email: 'patron@example.com',
  password: 'SecurePassword123!'
};

try {
  const result = await authService.login(credentials);
  console.log('Sesión iniciada:', result.user);
} catch (error) {
  console.error('Error en login:', error.message);
}
```

### Gestión de Asociaciones

```typescript
// Buscar taxistas disponibles
const availableTaxistas = await roleService.searchAvailableTaxistas('Juan');

// Crear asociación
const association = await roleService.createAssociation(patronId, taxistaId);

// Obtener usuarios asociados
const associatedUsers = await roleService.getAssociatedUsers();
```

### Validación de Permisos

```typescript
// Verificar si el usuario tiene un permiso específico
if (roleService.hasPermission(Permission.MANAGE_ASSOCIATIONS)) {
  // El usuario puede gestionar asociaciones
}

// Obtener rol del usuario actual
const userRole = roleService.getUserRole();
```

## Tipos Principales

### User
```typescript
interface User {
  id: string;
  email: string;
  nombre: string;
  telefono?: string;
  rol: UserRole;
  numeroTaxista?: string; // solo para taxistas
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  permissions: Permission[];
}
```

### UserRole
```typescript
enum UserRole {
  PATRON = 'patron',
  TAXISTA = 'taxista'
}
```

### Permission
```typescript
enum Permission {
  VIEW_ALL_DRIVERS = 'view_all_drivers',
  MANAGE_ASSOCIATIONS = 'manage_associations',
  VIEW_OWN_DATA = 'view_own_data',
  EDIT_PROFILE = 'edit_profile',
  VIEW_REPORTS = 'view_reports',
  MANAGE_SERVICES = 'manage_services',
  MANAGE_EXPENSES = 'manage_expenses'
}
```

## Manejo de Errores

El sistema utiliza la clase `AuthError` para errores específicos de autenticación:

```typescript
try {
  await authService.login(credentials);
} catch (error) {
  if (error instanceof AuthError) {
    switch (error.code) {
      case AuthErrorCodes.INVALID_CREDENTIALS:
        // Manejar credenciales inválidas
        break;
      case AuthErrorCodes.SESSION_EXPIRED:
        // Manejar sesión expirada
        break;
      // ... otros casos
    }
  }
}
```

## Soporte Offline

El sistema incluye capacidades offline:

- Almacenamiento de tokens en localStorage
- Validación de acceso offline
- Cola de operaciones pendientes para sincronización

```typescript
// Verificar si el acceso offline es válido
const canAccessOffline = authService.validateOfflineAccess();

if (!navigator.onLine && canAccessOffline) {
  // Continuar con funcionalidad limitada offline
}
```

## Testing

El sistema incluye configuración completa para testing:

- Jest con TypeScript
- Property-based testing con fast-check
- Mocks para localStorage y crypto
- Matchers personalizados

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas de propiedades
npm run test:pbt

# Ejecutar con cobertura
npm run test:coverage
```

## Configuración de Desarrollo

### Dependencias Principales
- `jsonwebtoken`: Manejo de JWT
- `bcryptjs`: Encriptación de contraseñas
- `uuid`: Generación de IDs únicos

### Dependencias de Desarrollo
- `typescript`: Compilador TypeScript
- `jest`: Framework de testing
- `fast-check`: Property-based testing
- `eslint`: Linting de código

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar TypeScript
npm run test         # Ejecutar pruebas
npm run lint         # Verificar código
```

## Próximos Pasos

1. Implementar API backend real
2. Añadir autenticación de dos factores
3. Implementar refresh tokens automáticos
4. Añadir logging y auditoría
5. Integrar con sistema de notificaciones push

## Notas de Seguridad

- Las contraseñas se almacenan hasheadas
- Los tokens JWT tienen expiración
- Se valida la fortaleza de contraseñas
- Se sanitizan todos los datos de entrada
- Se implementa comparación segura de hashes

Para más detalles sobre la implementación, consulta los archivos de código fuente y las pruebas correspondientes.