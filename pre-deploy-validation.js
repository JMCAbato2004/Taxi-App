#!/usr/bin/env node

/**
 * Script de validación pre-despliegue para GitHub Pages
 * Verifica que todos los componentes estén listos para producción
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando validación pre-despliegue...\n');

const validations = [];
let allPassed = true;

// Función helper para validaciones
function validate(name, condition, message) {
  const passed = condition;
  validations.push({ name, passed, message });
  
  if (passed) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}: ${message}`);
    allPassed = false;
  }
  
  return passed;
}

// 1. Verificar archivos esenciales
console.log('📁 Verificando archivos esenciales...');
validate(
  'index.html existe',
  fs.existsSync('index.html'),
  'Archivo index.html no encontrado'
);

validate(
  'manifest.json existe',
  fs.existsSync('manifest.json'),
  'Archivo manifest.json no encontrado'
);

validate(
  'Service Worker existe',
  fs.existsSync('sw.js'),
  'Archivo sw.js no encontrado'
);

validate(
  'Directorio de iconos existe',
  fs.existsSync('icons') && fs.statSync('icons').isDirectory(),
  'Directorio icons/ no encontrado'
);

// 2. Verificar configuración PWA
console.log('\n📱 Verificando configuración PWA...');
if (fs.existsSync('manifest.json')) {
  try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    
    validate(
      'Manifest tiene name',
      manifest.name && manifest.name.length > 0,
      'Campo name faltante en manifest.json'
    );
    
    validate(
      'Manifest tiene start_url',
      manifest.start_url,
      'Campo start_url faltante en manifest.json'
    );
    
    validate(
      'Manifest tiene iconos',
      manifest.icons && manifest.icons.length > 0,
      'Campo icons faltante o vacío en manifest.json'
    );
    
    validate(
      'Manifest tiene display standalone',
      manifest.display === 'standalone',
      'Campo display debe ser "standalone" para PWA'
    );
    
  } catch (error) {
    validate(
      'Manifest JSON válido',
      false,
      `Error parsing manifest.json: ${error.message}`
    );
  }
}

// 3. Verificar sistema de autenticación
console.log('\n🔐 Verificando sistema de autenticación...');
validate(
  'auth-system-complete.html existe',
  fs.existsSync('auth-system-complete.html'),
  'Archivo principal de autenticación no encontrado'
);

validate(
  'Directorio src/auth existe',
  fs.existsSync('src/auth') && fs.statSync('src/auth').isDirectory(),
  'Directorio src/auth/ no encontrado'
);

validate(
  'Servicios de autenticación existen',
  fs.existsSync('src/auth/services') && fs.statSync('src/auth/services').isDirectory(),
  'Directorio src/auth/services/ no encontrado'
);

// 4. Verificar archivos de configuración para GitHub Pages
console.log('\n🚀 Verificando configuración GitHub Pages...');
validate(
  'Workflow de GitHub Actions existe',
  fs.existsSync('.github/workflows/deploy.yml'),
  'Archivo .github/workflows/deploy.yml no encontrado'
);

validate(
  'Archivo .nojekyll existe',
  fs.existsSync('.nojekyll'),
  'Archivo .nojekyll no encontrado (necesario para GitHub Pages)'
);

validate(
  'package.json tiene script de build',
  fs.existsSync('package.json') && JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts?.build,
  'Script "build" faltante en package.json'
);

// 5. Verificar iconos PWA
console.log('\n🎨 Verificando iconos PWA...');
const requiredIcons = ['icon-192.png', 'icon-512.png'];
requiredIcons.forEach(icon => {
  validate(
    `Icono ${icon} existe`,
    fs.existsSync(path.join('icons', icon)),
    `Icono icons/${icon} no encontrado`
  );
});

// 6. Verificar TypeScript compilado
console.log('\n⚙️ Verificando compilación TypeScript...');
validate(
  'tsconfig.json existe',
  fs.existsSync('tsconfig.json'),
  'Archivo tsconfig.json no encontrado'
);

// Verificar que hay archivos .js compilados en src/
const hasCompiledJS = fs.existsSync('src') && 
  fs.readdirSync('src', { recursive: true })
    .some(file => file.endsWith('.js') || file.endsWith('.js.map'));

validate(
  'TypeScript compilado',
  hasCompiledJS,
  'No se encontraron archivos .js compilados. Ejecuta "npm run build"'
);

// 7. Verificar estructura de archivos críticos
console.log('\n📋 Verificando estructura de archivos...');
const criticalFiles = [
  'config.js',
  'offline-manager.js',
  'reconciliation/reconciliation-module-functional.js'
];

criticalFiles.forEach(file => {
  validate(
    `${file} existe`,
    fs.existsSync(file),
    `Archivo crítico ${file} no encontrado`
  );
});

// 8. Verificar que no hay archivos de desarrollo en producción
console.log('\n🧹 Verificando limpieza para producción...');
const devFiles = [
  'node_modules',
  '.env',
  '.env.local',
  'coverage'
];

devFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`⚠️  Advertencia: ${file} presente (se ignorará en GitHub Pages)`);
  }
});

// Resumen final
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE VALIDACIÓN');
console.log('='.repeat(50));

const passed = validations.filter(v => v.passed).length;
const total = validations.length;

console.log(`✅ Validaciones exitosas: ${passed}/${total}`);
console.log(`❌ Validaciones fallidas: ${total - passed}/${total}`);

if (allPassed) {
  console.log('\n🎉 ¡VALIDACIÓN EXITOSA!');
  console.log('✅ El proyecto está listo para despliegue en GitHub Pages');
  console.log('\n📋 Próximos pasos:');
  console.log('1. git add .');
  console.log('2. git commit -m "feat: preparación para despliegue GitHub Pages"');
  console.log('3. git push origin main');
  console.log('4. Configurar GitHub Pages en Settings > Pages');
  console.log('5. Esperar despliegue automático (~2-5 minutos)');
  
  process.exit(0);
} else {
  console.log('\n❌ VALIDACIÓN FALLIDA');
  console.log('🔧 Corrige los errores antes de desplegar');
  console.log('\n📋 Acciones recomendadas:');
  console.log('1. npm install (instalar dependencias)');
  console.log('2. npm run build (compilar TypeScript)');
  console.log('3. Verificar archivos faltantes');
  console.log('4. Ejecutar nuevamente: node pre-deploy-validation.js');
  
  process.exit(1);
}