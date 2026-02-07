# Cumplimiento RGPD - Control de Taxi

## Resumen

Este documento describe cómo la aplicación Control de Taxi cumple con el Reglamento General de Protección de Datos (RGPD) de la Unión Europea, aplicable en España.

## Implementación

### 1. Banner de Consentimiento de Cookies

**Archivo:** `rgpd-manager.js`

- Se muestra automáticamente al primer acceso
- Permite aceptar, rechazar o personalizar el consentimiento
- Registra todas las decisiones del usuario con timestamp
- Enlaces directos a Política de Privacidad y Términos y Condiciones

### 2. Gestión de Consentimientos

**Tipos de cookies/almacenamiento:**

- **Necesarias** (obligatorias): Autenticación, sesión
- **Funcionales** (opcionales): Preferencias, configuración
- **Analíticas** (deshabilitadas por defecto): No implementadas

**Almacenamiento:**
- `taxi_rgpd_consent`: Consentimiento actual
- `taxi_rgpd_consent_log`: Historial de consentimientos

### 3. Derechos del Usuario (RGPD)

#### Derecho de Acceso
- Los usuarios pueden ver todos sus datos en el perfil
- Exportación completa de datos en formato JSON

#### Derecho de Rectificación
- Los usuarios pueden modificar su información personal
- Cambio de contraseña disponible

#### Derecho de Supresión (Derecho al Olvido)
- Botón "Eliminar Todos Mis Datos" en configuración de privacidad
- Elimina:
  - Datos de usuario
  - Servicios registrados
  - Gastos
  - Solicitudes de asociación
  - Sesión activa
- Registro de eliminación con timestamp

#### Derecho de Portabilidad
- Exportación de datos en formato JSON
- Incluye:
  - Información personal (sin contraseña)
  - Servicios
  - Gastos
  - Solicitudes
  - Historial de consentimientos

#### Derecho de Oposición
- Los usuarios pueden rechazar cookies funcionales
- Pueden revocar consentimientos en cualquier momento

### 4. Documentación Legal

**Archivos creados:**

1. **politica-privacidad.html**
   - Identidad del responsable
   - Datos recopilados
   - Finalidad del tratamiento
   - Base legal
   - Derechos del usuario
   - Medidas de seguridad
   - Información sobre cookies
   - Contacto y autoridad de control (AEPD)

2. **terminos-condiciones.html**
   - Aceptación de términos
   - Descripción del servicio
   - Roles de usuario
   - Uso aceptable
   - Limitación de responsabilidad
   - Ley aplicable (España)

### 5. Seguridad y Privacidad

**Medidas implementadas:**

- ✅ Almacenamiento local (no hay servidores externos)
- ✅ Contraseñas almacenadas (sin encriptación avanzada en esta versión)
- ✅ Validación de datos en cliente
- ✅ Registro de acciones (consentimientos, eliminaciones)
- ✅ No se comparten datos con terceros
- ✅ Control total del usuario sobre sus datos

### 6. Transparencia

**Información clara sobre:**

- Qué datos se recopilan
- Por qué se recopilan
- Cómo se almacenan (localStorage)
- Cuánto tiempo se conservan
- Cómo ejercer derechos

### 7. Acceso a Configuración de Privacidad

**Ubicaciones:**

1. **Banner inicial**: Primera visita a la aplicación
2. **Perfil de usuario**: Sección "Privacidad y Datos (RGPD)"
3. **Enlaces en footer**: Política de Privacidad y Términos

**Funciones disponibles:**

- 📥 Exportar Mis Datos
- 🔧 Gestionar Consentimiento
- 🗑️ Eliminar Todos Mis Datos
- 📄 Ver Política de Privacidad
- 📋 Ver Términos y Condiciones

## Archivos del Sistema RGPD

```
rgpd-manager.js          # Lógica de gestión RGPD
rgpd-styles.css          # Estilos del banner y modales
politica-privacidad.html # Política de privacidad completa
terminos-condiciones.html # Términos y condiciones
RGPD-COMPLIANCE.md       # Este documento
```

## Integración en la Aplicación

### index.html
```html
<link rel="stylesheet" href="rgpd-styles.css">
<script src="rgpd-manager.js"></script>
```

### profile.html
```html
<link rel="stylesheet" href="rgpd-styles.css">
<script src="rgpd-manager.js"></script>
```

## Contacto para Privacidad

**Email:** privacidad@controltaxi.es

## Autoridad de Control

**Agencia Española de Protección de Datos (AEPD)**
- Web: https://www.aepd.es
- Dirección: C/ Jorge Juan, 6, 28001 Madrid

## Notas Importantes

1. **Almacenamiento Local**: Todos los datos se almacenan en el navegador del usuario (localStorage). No hay transmisión a servidores externos.

2. **Responsabilidad del Usuario**: Los usuarios deben hacer copias de seguridad de sus datos exportándolos regularmente.

3. **Pérdida de Datos**: Si el usuario borra los datos del navegador, la información se perderá permanentemente.

4. **Actualizaciones**: Esta implementación cumple con los requisitos básicos del RGPD. Para uso en producción, se recomienda:
   - Encriptación de contraseñas con bcrypt
   - Implementación de backend seguro
   - Auditorías de seguridad
   - Certificado SSL/TLS
   - Política de retención de datos

## Checklist de Cumplimiento RGPD

- ✅ Banner de consentimiento de cookies
- ✅ Política de privacidad detallada
- ✅ Términos y condiciones
- ✅ Derecho de acceso (visualización de datos)
- ✅ Derecho de rectificación (edición de perfil)
- ✅ Derecho de supresión (eliminación de cuenta)
- ✅ Derecho de portabilidad (exportación JSON)
- ✅ Derecho de oposición (rechazo de cookies)
- ✅ Registro de consentimientos
- ✅ Transparencia en el tratamiento de datos
- ✅ Base legal para el tratamiento
- ✅ Información sobre el responsable
- ✅ Información sobre derechos del usuario
- ✅ Contacto para ejercer derechos
- ✅ Referencia a autoridad de control (AEPD)
- ✅ Medidas de seguridad implementadas
- ✅ Información sobre conservación de datos
- ✅ Información sobre transferencias (no hay)
- ✅ Política de menores de edad

## Versión

**Versión:** 1.0  
**Fecha:** 7 de febrero de 2026  
**Última actualización:** 7 de febrero de 2026
