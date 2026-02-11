# 🚀 Despliegue Rápido - GitHub Pages

## ⚡ Pasos Rápidos (5 minutos)

### 1. Validar Proyecto
```bash
npm run validate-deploy
```

### 2. Subir a GitHub
```bash
git add .
git commit -m "feat: sistema PWA listo para producción"
git push origin main
```

### 3. Configurar GitHub Pages
1. Ve a tu repositorio en GitHub
2. **Settings** > **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: main / (root)
5. **Save**

### 4. ¡Listo! 🎉
Tu app estará en: `https://TU_USUARIO.github.io/NOMBRE_REPO/`

---

## 🧪 Testing Inmediato

### Usuarios de Prueba
- **Patrón**: `patron@test.com` / `Password123`
- **Taxista**: `taxista@test.com` / `Password123`
- **Código invitación**: `PATRON123`

### Flujo de Prueba
1. Registrar nuevo taxista con código `PATRON123`
2. Login como patrón → ver taxista asociado
3. Login como taxista → panel personal
4. Probar funcionalidad offline (desconectar WiFi)

---

## 📱 Instalar como PWA
- **Android**: "Agregar a pantalla de inicio"
- **iOS**: Safari > "Agregar a pantalla de inicio"
- **Desktop**: Icono de instalación en barra de direcciones

---

## 🔧 Si algo falla
```bash
# Recompilar todo
npm run build

# Validar nuevamente
npm run validate-deploy

# Ver logs de GitHub Actions
# GitHub > Actions > Ver último workflow
```