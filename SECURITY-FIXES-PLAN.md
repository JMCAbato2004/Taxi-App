# 🔒 PLAN DE CORRECCIÓN DE VULNERABILIDADES

**Rama**: security-fixes  
**Fecha inicio**: 11 de febrero de 2026  
**Prioridad**: CRÍTICA  
**Objetivo**: Resolver las 8 vulnerabilidades críticas identificadas en la auditoría

---

## 📋 CHECKLIST DE TAREAS

### FASE 1: VULNERABILIDADES CRÍTICAS (Prioridad Alta)

#### ✅ Tarea 1: Implementar Hashing de Contraseñas
- [ ] Instalar bcryptjs
- [ ] Modificar AuthAdapter.js para hashear contraseñas en registro
- [ ] Modificar AuthAdapter.js para verificar contraseñas hasheadas en login
- [ ] Migrar contraseñas existentes (si las hay)
- [ ] Tests unitarios

**Archivos a modificar:**
- `ionic-pwa/adapters/AuthAdapter.js`
- `package.json` (añadir dependencia)

**Estimación**: 2-3 horas

---

#### ✅ Tarea 2: Implementar JWT para Autenticación
- [ ] Instalar jsonwebtoken
- [ ] Crear servicio de generación de JWT
- [ ] Implementar refresh tokens
- [ ] Modificar AuthAdapter para usar JWT
- [ ] Implementar expiración de tokens (30 min)
- [ ] Tests de tokens

**Archivos a modificar:**
- `ionic-pwa/adapters/AuthAdapter.js`
- Crear: `ionic-pwa/services/TokenService.js`
- `package.json`

**Estimación**: 3-4 horas

---

#### ✅ Tarea 3: Sanitizar Entradas (Prevenir XSS)
- [ ] Instalar DOMPurify
- [ ] Crear utilidad de sanitización
- [ ] Reemplazar todas las instancias de innerHTML (47 encontradas)
- [ ] Implementar sanitización en formularios
- [ ] Tests de XSS

**Archivos a modificar:**
- Crear: `ionic-pwa/utils/Sanitizer.js`
- `ionic-pwa/components/*.js` (todos los que usan innerHTML)
- `ionic-pwa/app.js`
- `package.json`

**Estimación**: 4-6 horas

---

#### ✅ Tarea 4: Implementar Content Security Policy
- [ ] Definir política CSP estricta
- [ ] Añadir meta tag CSP en index.html
- [ ] Configurar CSP en headers del servidor
- [ ] Probar que no rompe funcionalidad
- [ ] Ajustar política según necesidades

**Archivos a modificar:**
- `ionic-pwa/index.html`
- Crear: `.htaccess` o configuración de servidor

**Estimación**: 2 horas

---

#### ✅ Tarea 5: Encriptar Datos Sensibles
- [ ] Instalar crypto-js
- [ ] Crear servicio de encriptación
- [ ] Migrar de localStorage a IndexedDB
- [ ] Encriptar datos antes de almacenar
- [ ] Desencriptar al leer
- [ ] Tests de encriptación

**Archivos a modificar:**
- Crear: `ionic-pwa/services/SecureStorageService.js`
- `ionic-pwa/adapters/AuthAdapter.js`
- `ionic-pwa/adapters/ReconcileAdapter.js`
- `package.json`

**Estimación**: 5-6 horas

---

#### ✅ Tarea 6: Validación Robusta de Entradas
- [ ] Instalar yup o joi
- [ ] Crear esquemas de validación
- [ ] Implementar validación en todos los formularios
- [ ] Validación de tipos de datos
- [ ] Validación de rangos
- [ ] Tests de validación

**Archivos a modificar:**
- Crear: `ionic-pwa/validators/schemas.js`
- `ionic-pwa/components/ServiceFormModal.js`
- `ionic-pwa/components/ExpenseFormModal.js`
- `ionic-pwa/components/RegisterModal.js`
- `ionic-pwa/components/LoginModal.js`
- `package.json`

**Estimación**: 3-4 horas

---

#### ✅ Tarea 7: Implementar Protección CSRF
- [ ] Generar tokens CSRF
- [ ] Almacenar en sessionStorage
- [ ] Validar en cada operación crítica
- [ ] Implementar en formularios
- [ ] Tests CSRF

**Archivos a modificar:**
- Crear: `ionic-pwa/services/CSRFService.js`
- `ionic-pwa/app.js`
- Todos los formularios

**Estimación**: 2-3 horas

---

#### ✅ Tarea 8: Implementar Rate Limiting
- [ ] Crear servicio de rate limiting
- [ ] Implementar límite de intentos de login (5 intentos)
- [ ] Bloqueo temporal (15 minutos)
- [ ] Almacenar intentos en memoria/localStorage
- [ ] Notificar al usuario
- [ ] Tests de rate limiting

**Archivos a modificar:**
- Crear: `ionic-pwa/services/RateLimitService.js`
- `ionic-pwa/adapters/AuthAdapter.js`
- `ionic-pwa/components/LoginModal.js`

**Estimación**: 2-3 horas

---

### FASE 2: VULNERABILIDADES MEDIAS (Prioridad Media)

#### ✅ Tarea 9: Forzar HTTPS
- [ ] Añadir meta tag upgrade-insecure-requests
- [ ] Configurar redirección en servidor
- [ ] Tests

**Estimación**: 1 hora

---

#### ✅ Tarea 10: Implementar Timeout de Sesión
- [ ] Crear servicio de sesión
- [ ] Timeout de 30 minutos
- [ ] Detectar actividad del usuario
- [ ] Logout automático
- [ ] Notificar antes de cerrar sesión

**Estimación**: 2 horas

---

#### ✅ Tarea 11: Mejorar Generación de Códigos de Invitación
- [ ] Usar crypto.getRandomValues()
- [ ] Aumentar entropía
- [ ] Tests de unicidad

**Estimación**: 1 hora

---

#### ✅ Tarea 12: Añadir SRI a Recursos Externos
- [ ] Generar hashes SRI para Chart.js
- [ ] Generar hashes SRI para Ionic
- [ ] Añadir atributos integrity
- [ ] Tests

**Estimación**: 1 hora

---

#### ✅ Tarea 13: Eliminar Logs en Producción
- [ ] Crear utilidad de logging
- [ ] Detectar entorno (dev/prod)
- [ ] Reemplazar console.log
- [ ] Tests

**Estimación**: 2 horas

---

#### ✅ Tarea 14: Protección Clickjacking
- [ ] Añadir X-Frame-Options
- [ ] Configurar en servidor
- [ ] Tests

**Estimación**: 30 minutos

---

### FASE 3: MEJORAS ADICIONALES (Prioridad Baja)

#### ✅ Tarea 15: Auditoría de Acciones
- [ ] Crear servicio de auditoría
- [ ] Registrar acciones críticas
- [ ] Almacenar logs
- [ ] Visualización de logs

**Estimación**: 3 horas

---

#### ✅ Tarea 16: Monitoreo de Errores
- [ ] Integrar Sentry o similar
- [ ] Configurar captura de errores
- [ ] Dashboard de errores

**Estimación**: 2 horas

---

#### ✅ Tarea 17: Tests de Seguridad Automatizados
- [ ] Configurar OWASP ZAP
- [ ] Tests de XSS
- [ ] Tests de inyección SQL
- [ ] Tests de autenticación
- [ ] CI/CD integration

**Estimación**: 4 horas

---

## 📦 DEPENDENCIAS A INSTALAR

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dompurify": "^3.0.8",
    "crypto-js": "^4.2.0",
    "yup": "^1.3.3",
    "idb": "^7.1.1"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.5",
    "jest": "^29.7.0",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
```

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Día 1-2**: Tareas 1, 2 (Autenticación segura)
2. **Día 3-4**: Tarea 3 (Sanitización XSS)
3. **Día 5**: Tareas 4, 5 (CSP y Encriptación)
4. **Día 6**: Tareas 6, 7 (Validación y CSRF)
5. **Día 7**: Tarea 8 (Rate Limiting)
6. **Día 8-9**: Tareas 9-14 (Vulnerabilidades medias)
7. **Día 10**: Tests y validación
8. **Día 11-12**: Tareas 15-17 (Mejoras adicionales)

**Tiempo total estimado**: 10-12 días de trabajo

---

## 🧪 ESTRATEGIA DE TESTING

### Tests Unitarios
- Cada servicio nuevo debe tener tests
- Cobertura mínima: 80%

### Tests de Integración
- Flujo completo de autenticación
- Flujo de creación de servicios
- Flujo de gestión de flota

### Tests de Seguridad
- Intentos de XSS
- Intentos de CSRF
- Fuerza bruta en login
- Inyección de código

### Tests Manuales
- Verificar que no se rompe funcionalidad existente
- Probar en diferentes navegadores
- Probar en modo offline

---

## 📊 MÉTRICAS DE ÉXITO

- [ ] 0 vulnerabilidades críticas
- [ ] Puntuación de seguridad > 8/10
- [ ] 100% de formularios con validación
- [ ] 100% de innerHTML sanitizado
- [ ] Tokens JWT implementados
- [ ] Contraseñas hasheadas
- [ ] CSP implementado sin errores
- [ ] Rate limiting funcionando
- [ ] Tests de seguridad pasando

---

## 🚀 PROCESO DE MERGE

1. Completar todas las tareas de Fase 1
2. Ejecutar todos los tests
3. Realizar auditoría de seguridad nuevamente
4. Crear Pull Request a main
5. Code review
6. Merge a main
7. Deploy a producción

---

## 📝 NOTAS IMPORTANTES

- **NO hacer merge a main hasta completar Fase 1**
- Cada tarea debe tener su propio commit
- Documentar cambios en CHANGELOG.md
- Actualizar README.md con nuevas dependencias
- Mantener compatibilidad con funcionalidad existente
- Probar en modo offline después de cada cambio

---

## 🔗 RECURSOS ÚTILES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CSP Guide](https://content-security-policy.com/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

---

**Última actualización**: 11 de febrero de 2026  
**Estado**: 🟡 En progreso  
**Progreso**: 0/17 tareas completadas (0%)
