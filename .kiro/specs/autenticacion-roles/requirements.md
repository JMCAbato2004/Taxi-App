# Documento de Requisitos

## Introducción

Sistema de autenticación con roles para una aplicación PWA de taxi que permite la gestión diferenciada de usuarios según su rol (Patrón o Taxista), manteniendo la funcionalidad existente de reconciliación, gestión de servicios y gastos.

## Glosario

- **Sistema_Autenticacion**: El módulo de autenticación y autorización de la aplicación
- **Usuario**: Persona que utiliza la aplicación (puede ser Patrón o Taxista)
- **Patron**: Usuario propietario de vehículos que puede gestionar taxistas
- **Taxista**: Usuario conductor que opera vehículos y puede estar asociado a un patrón
- **Rol**: Clasificación del usuario que determina sus permisos (Patrón o Taxista)
- **Cuenta_Usuario**: Perfil individual con credenciales y datos personales
- **Asociacion**: Relación entre un patrón y un taxista bajo su cargo
- **Numero_Taxista**: Identificador único del taxista para introducir datos

## Requisitos

### Requisito 1: Registro de Usuarios con Selección de Rol

**Historia de Usuario:** Como usuario nuevo, quiero registrarme en la aplicación seleccionando mi rol, para que el sistema me proporcione las funcionalidades apropiadas según mi tipo de usuario.

#### Criterios de Aceptación

1. CUANDO un usuario accede al registro, EL Sistema_Autenticacion DEBERÁ mostrar una interfaz para seleccionar entre "Patrón" o "Taxista"
2. CUANDO un usuario completa el registro con rol "Patrón", EL Sistema_Autenticacion DEBERÁ crear una Cuenta_Usuario con permisos de gestión de taxistas
3. CUANDO un usuario completa el registro con rol "Taxista", EL Sistema_Autenticacion DEBERÁ crear una Cuenta_Usuario con permisos de introducción de datos y asignar un Numero_Taxista único
4. CUANDO se crea una cuenta, EL Sistema_Autenticacion DEBERÁ validar que todos los campos obligatorios estén completos
5. CUANDO se intenta registrar con credenciales duplicadas, EL Sistema_Autenticacion DEBERÁ rechazar el registro y mostrar un mensaje de error

### Requisito 2: Gestión de Asociaciones Patrón-Taxista

**Historia de Usuario:** Como patrón, quiero añadir roles de taxista a diferentes personas que utilicen mis automóviles, para que puedan operar bajo mi supervisión y yo pueda gestionar su información.

#### Criterios de Aceptación

1. CUANDO un patrón busca añadir un taxista, EL Sistema_Autenticacion DEBERÁ permitir buscar usuarios existentes con rol "Taxista"
2. CUANDO un patrón selecciona un taxista disponible, EL Sistema_Autenticacion DEBERÁ crear una Asociacion entre el patrón y el taxista
3. CUANDO se crea una asociación, EL Sistema_Autenticacion DEBERÁ notificar al taxista sobre la nueva asociación
4. CUANDO un patrón intenta asociar un taxista ya asociado a otro patrón, EL Sistema_Autenticacion DEBERÁ rechazar la operación y mostrar un mensaje informativo
5. CUANDO un patrón desea remover una asociación, EL Sistema_Autenticacion DEBERÁ permitir desasociar al taxista manteniendo su cuenta individual

### Requisito 3: Acceso a Información de Taxistas por Patrón

**Historia de Usuario:** Como patrón, quiero tener acceso a la información de los taxistas que están bajo mi cargo, para que pueda supervisar y gestionar sus actividades operativas.

#### Criterios de Aceptación

1. CUANDO un patrón accede a su panel, EL Sistema_Autenticacion DEBERÁ mostrar una lista de todos los taxistas asociados
2. CUANDO un patrón selecciona un taxista asociado, EL Sistema_Autenticacion DEBERÁ mostrar la información detallada del taxista incluyendo datos operativos
3. CUANDO un patrón consulta datos de servicios, EL Sistema_Autenticacion DEBERÁ filtrar y mostrar solo información de taxistas bajo su cargo
4. CUANDO un patrón intenta acceder a información de taxistas no asociados, EL Sistema_Autenticacion DEBERÁ denegar el acceso
5. MIENTRAS un taxista esté asociado a un patrón, EL Sistema_Autenticacion DEBERÁ mantener visible su información para el patrón

### Requisito 4: Cuenta Individual y Acceso de Datos para Taxistas

**Historia de Usuario:** Como taxista, quiero tener mi propia cuenta y acceso para introducir datos asociados a mi número, para que pueda gestionar mi información personal y operativa de forma independiente.

#### Criterios de Aceptación

1. CUANDO un taxista inicia sesión, EL Sistema_Autenticacion DEBERÁ proporcionar acceso a su panel personal con su Numero_Taxista
2. CUANDO un taxista introduce datos operativos, EL Sistema_Autenticacion DEBERÁ asociar automáticamente los datos con su Numero_Taxista
3. CUANDO un taxista está asociado a un patrón, EL Sistema_Autenticacion DEBERÁ mantener su acceso independiente a su cuenta personal
4. CUANDO un taxista modifica su información personal, EL Sistema_Autenticacion DEBERÁ actualizar los datos manteniendo la integridad de las asociaciones
5. EL Sistema_Autenticacion DEBERÁ permitir al taxista ver su historial de datos y servicios registrados

### Requisito 5: Integración con Funcionalidad Existente

**Historia de Usuario:** Como usuario de la aplicación existente, quiero que el nuevo sistema de autenticación se integre sin interrumpir las funcionalidades actuales, para que pueda continuar usando reconciliación, gestión de servicios y gastos.

#### Criterios de Aceptación

1. CUANDO un usuario autenticado accede a funcionalidades existentes, EL Sistema_Autenticacion DEBERÁ mantener el contexto de su rol para filtrar datos apropiadamente
2. CUANDO se realizan operaciones de reconciliación, EL Sistema_Autenticacion DEBERÁ aplicar permisos según el rol del usuario
3. CUANDO se gestionan servicios y gastos, EL Sistema_Autenticacion DEBERÁ asociar las operaciones con el usuario correcto según su rol
4. CUANDO un patrón accede a reportes, EL Sistema_Autenticacion DEBERÁ mostrar datos agregados de todos sus taxistas asociados
5. CUANDO un taxista accede a reportes, EL Sistema_Autenticacion DEBERÁ mostrar solo sus datos personales

### Requisito 6: Seguridad y Autorización

**Historia de Usuario:** Como administrador del sistema, quiero que el acceso a la información esté correctamente protegido según los roles, para que se mantenga la privacidad y seguridad de los datos.

#### Criterios de Aceptación

1. CUANDO un usuario intenta acceder a funcionalidades, EL Sistema_Autenticacion DEBERÁ validar permisos según su rol antes de permitir el acceso
2. CUANDO se detecta un intento de acceso no autorizado, EL Sistema_Autenticacion DEBERÁ denegar el acceso y registrar el evento
3. CUANDO expira una sesión, EL Sistema_Autenticacion DEBERÁ requerir nueva autenticación antes de permitir operaciones
4. CUANDO se modifican datos sensibles, EL Sistema_Autenticacion DEBERÁ requerir confirmación adicional
5. EL Sistema_Autenticacion DEBERÁ encriptar todas las credenciales y datos sensibles almacenados