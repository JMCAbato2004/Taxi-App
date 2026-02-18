# Environment Configuration

Este directorio contiene la configuración de entorno para la aplicación.

## Detección Automática de Entorno

La aplicación detecta automáticamente el entorno basándose en:

1. **Hostname**: 
   - `localhost`, `127.0.0.1`, `192.168.*`, `10.0.*` → Development
   - `*.github.io`, `taxi-app.com`, `taxiapp.com` → Production
   - `staging.*`, `test.*`, `qa.*` → Staging

2. **Protocolo**:
   - `https://` + dominio no-local → Production
   - `http://` + localhost → Development

3. **Variables de entorno**:
   - `process.env.NODE_ENV === 'production'` → Production

## Forzar Modo Manualmente

### Forzar Modo Producción

Agrega esto ANTES de cargar `environment.js` en `index.html`:

```html
<script>
  window.PRODUCTION_MODE = true;
</script>
<script src="./config/environment.js"></script>
```

### Forzar Modo Staging

```html
<script>
  window.STAGING_MODE = true;
</script>
<script src="./config/environment.js"></script>
```

### Forzar Modo Development

```html
<script>
  window.PRODUCTION_MODE = false;
  window.STAGING_MODE = false;
</script>
<script src="./config/environment.js"></script>
```

## Configuración por Entorno

### Production
- **API URL**: `https://api.taxi-app.com`
- **Debug**: `false`
- **Show Dev Tools**: `false`
- **Log Level**: `error`
- **Show Verification Code**: `false` ⚠️
- **Analytics**: `true`
- **Error Reporting**: `true`

### Staging
- **API URL**: `https://staging-api.taxi-app.com`
- **Debug**: `true`
- **Show Dev Tools**: `true`
- **Log Level**: `warn`
- **Show Verification Code**: `true`
- **Analytics**: `false`
- **Error Reporting**: `true`

### Development
- **API URL**: `http://localhost:3000`
- **Debug**: `true`
- **Show Dev Tools**: `true`
- **Log Level**: `debug`
- **Show Verification Code**: `true` ✅
- **Analytics**: `false`
- **Error Reporting**: `false`

## Uso en Código

```javascript
// Verificar entorno
if (window.environmentConfig.isProduction()) {
  // Código solo para producción
}

if (window.environmentConfig.isDevelopment()) {
  // Código solo para desarrollo
}

// Obtener configuración
const apiUrl = window.environmentConfig.get('apiUrl');
const debug = window.environmentConfig.get('debug');

// Helpers globales
if (window.isProduction()) {
  // ...
}

if (window.isDevelopment()) {
  // ...
}
```

## Seguridad

⚠️ **IMPORTANTE**: En producción:
- Los códigos de verificación NO se muestran en consola
- Los logs de debug están desactivados
- Solo se registran errores críticos
- Analytics y error reporting están activos

## Testing

Para probar el modo producción localmente:

1. Abre `index.html`
2. Agrega antes de `environment.js`:
   ```html
   <script>window.PRODUCTION_MODE = true;</script>
   ```
3. Recarga la página
4. Verifica en consola: `Environment: production`

## Deployment

### GitHub Pages

GitHub Pages automáticamente detecta producción porque:
- Hostname contiene `github.io`
- Protocolo es `https://`

No se requiere configuración adicional.

### Servidor Propio

Si despliegas en tu propio servidor:

1. Asegúrate de usar HTTPS
2. Configura el dominio en `environment.js` (línea 38):
   ```javascript
   const productionDomains = [
     'github.io',
     'taxi-app.com',
     'tu-dominio.com'  // Agregar aquí
   ];
   ```

## Troubleshooting

### El código de verificación se muestra en producción

1. Verifica que estés en modo producción:
   ```javascript
   console.log(window.environmentConfig.getEnvironment());
   ```

2. Si muestra `development`, verifica:
   - ¿Estás usando HTTPS?
   - ¿El hostname está en la lista de producción?
   - ¿Hay algún override manual?

3. Fuerza modo producción temporalmente:
   ```javascript
   window.PRODUCTION_MODE = true;
   location.reload();
   ```

### No puedo ver los códigos en desarrollo

1. Verifica que estés en modo desarrollo:
   ```javascript
   console.log(window.environmentConfig.getEnvironment());
   ```

2. Si muestra `production`, verifica:
   - ¿Estás usando localhost?
   - ¿Hay un override forzando producción?

3. Fuerza modo desarrollo:
   ```javascript
   window.PRODUCTION_MODE = false;
   location.reload();
   ```
