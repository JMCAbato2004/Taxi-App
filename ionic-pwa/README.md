# Control de Taxi - Ionic PWA

Sistema completo de gestión de flotas de taxi con autenticación segura, reportes detallados y capacidades offline.

## 🚀 Características

### Autenticación y Roles
- ✅ Login y registro con validación
- ✅ Roles: PATRON y TAXISTA
- ✅ Control de acceso basado en roles
- ✅ Cambio de contraseña con validación de seguridad

### Gestión de Servicios
- ✅ Crear, editar y eliminar servicios
- ✅ Tipos de pago: Efectivo, Tarjeta, App
- ✅ Detalles de plataformas (Uber, Cabify, Bolt, etc.)
- ✅ Comisiones, incentivos y propinas
- ✅ Filtros y búsqueda
- ✅ Estadísticas en tiempo real

### Gestión de Gastos
- ✅ Crear, editar y eliminar gastos
- ✅ Categorías: Combustible, Mantenimiento, Seguro, Otro
- ✅ Asignación: Compartido, Conductor, Propietario
- ✅ Filtros por categoría
- ✅ Desglose de gastos

### Conciliación
- ✅ Generación de conciliaciones
- ✅ Tipos: Porcentaje o Cantidad Fija
- ✅ Cálculo automático de distribución
- ✅ Historial de conciliaciones
- ✅ Desglose detallado

### Dashboard
- ✅ Estadísticas en tiempo real
- ✅ Actividad reciente
- ✅ Filtrado por rol
- ✅ Pull-to-refresh

### Perfil
- ✅ Información del usuario
- ✅ Detalles específicos por rol
- ✅ Cambio de contraseña
- ✅ Privacidad RGPD

### PWA Features
- ✅ Instalable en dispositivos
- ✅ Service Worker con cache
- ✅ Funciona offline
- ✅ Tema claro/oscuro
- ✅ Responsive design

## 🛠️ Tecnologías

- **Ionic Framework** - Componentes UI nativos
- **Vanilla JavaScript** - Sin frameworks pesados
- **LocalStorage** - Persistencia de datos
- **Service Worker** - Capacidades offline
- **CSS Custom Properties** - Theming

## 📁 Estructura del Proyecto

```
ionic-pwa/
├── index.html              # Página principal
├── app.js                  # Lógica de aplicación
├── service-worker.js       # PWA service worker
├── components/             # Componentes UI
│   ├── LoginModal.js
│   ├── RegisterModal.js
│   ├── DashboardView.js
│   ├── ServiceListView.js
│   ├── ServiceFormModal.js
│   ├── ExpenseListView.js
│   ├── ExpenseFormModal.js
│   ├── ReconciliationView.js
│   ├── ReconciliationHistoryView.js
│   ├── ProfileDetailModal.js
│   ├── ChangePasswordModal.js
│   ├── TabNavigation.js
│   ├── StatsCard.js
│   └── FABButton.js
├── adapters/               # Capa de integración
│   ├── AuthAdapter.js
│   ├── ReconcileAdapter.js
│   └── RGPDAdapter.js
├── utils/                  # Utilidades
│   ├── ToastManager.js
│   ├── LoadingManager.js
│   └── ActionSheetManager.js
└── styles/
    └── theme.css           # Estilos y theming
```

## 🚦 Inicio Rápido

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd ionic-pwa
```

2. **Iniciar servidor local**
```bash
# Opción 1: Python
python -m http.server 8084

# Opción 2: Node.js
npx http-server -p 8084

# Opción 3: PHP
php -S localhost:8084
```

3. **Abrir en navegador**
```
http://localhost:8084/ionic-pwa/index.html
```

## 👥 Usuarios de Prueba

### Patrón
- Email: `patron@test.com`
- Contraseña: `password123`
- Permisos: Ver todos los datos, gestionar asociaciones

### Taxista
- Email: `taxista@test.com`
- Contraseña: `password123`
- Permisos: Ver solo sus propios datos

## 📱 Instalación como PWA

1. Abrir la aplicación en Chrome/Edge
2. Click en el icono de instalación en la barra de direcciones
3. Confirmar instalación
4. La app aparecerá como aplicación nativa

## 🎨 Theming

La aplicación soporta tema claro y oscuro:
- **Automático**: Detecta preferencia del sistema
- **Manual**: Botón de toggle en el header
- **Persistente**: Se guarda la preferencia

## 🔒 Seguridad y Privacidad

- ✅ Tokens JWT para autenticación
- ✅ Almacenamiento seguro de credenciales
- ✅ Cumplimiento RGPD
- ✅ Consentimiento de privacidad
- ✅ Validación de formularios

## 📊 Datos de Ejemplo

Para probar la aplicación, puedes:
1. Registrar un nuevo usuario
2. Crear servicios de prueba
3. Añadir gastos
4. Generar conciliaciones

## 🐛 Troubleshooting

### La aplicación no carga
- Verificar que el servidor esté corriendo
- Limpiar cache del navegador (Ctrl + Shift + R)
- Verificar la consola del navegador

### Service Worker no actualiza
- Abrir DevTools → Application → Service Workers
- Click en "Unregister"
- Recargar la página

### Datos no persisten
- Verificar que localStorage esté habilitado
- Verificar permisos del navegador
- No usar modo incógnito

## 🔄 Actualizaciones

Para actualizar a la última versión:
1. Hacer hard refresh (Ctrl + Shift + R)
2. Limpiar cache del Service Worker
3. Recargar la aplicación

## 📝 Notas de Desarrollo

- Los componentes usan Ionic Web Components
- La persistencia usa localStorage (temporal)
- Para producción, integrar con backend real
- Los adapters están preparados para integración

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 📞 Soporte

Para soporte o preguntas, contactar al equipo de desarrollo.

---

**Versión**: 4.0  
**Última actualización**: 2024  
**Estado**: ✅ MVP Completo
