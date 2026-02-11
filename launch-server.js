#!/usr/bin/env node

/**
 * Servidor HTTP simple para lanzar la PWA de Control de Ventas con Conciliación de Taxista
 * 
 * Este servidor sirve la aplicación completa con todas las funcionalidades:
 * - Control de ventas básico
 * - Módulo de conciliación de taxista completo
 * - Funcionalidad PWA offline
 * - Exportación de reportes
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuración del servidor
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

// MIME types para diferentes archivos
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

// Función para obtener el tipo MIME
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// Función para servir archivos estáticos
function serveStaticFile(res, filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 - Archivo no encontrado</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1 class="error">404 - Archivo no encontrado</h1>
            <p>El archivo <code>${filePath}</code> no existe.</p>
            <a href="/">← Volver al inicio</a>
          </body>
          </html>
        `);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error interno del servidor');
      }
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Cache-Control': 'no-cache' // Para desarrollo
    });
    res.end(data);
  });
}

// Crear el servidor HTTP
const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Remover query parameters
  filePath = filePath.split('?')[0];
  
  // Prevenir directory traversal
  if (filePath.includes('..')) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Solicitud inválida');
    return;
  }

  console.log(`📄 Sirviendo: ${filePath}`);
  serveStaticFile(res, filePath);
});

// Función para abrir el navegador
function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${start} ${url}`, (error) => {
    if (error) {
      console.log(`⚠️  No se pudo abrir el navegador automáticamente.`);
      console.log(`🌐 Abre manualmente: ${url}`);
    } else {
      console.log(`🚀 Navegador abierto en: ${url}`);
    }
  });
}

// Iniciar el servidor
server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  
  console.log('🎉 ¡SERVIDOR INICIADO EXITOSAMENTE!');
  console.log('=' .repeat(60));
  console.log(`🌐 URL: ${url}`);
  console.log(`📱 PWA: Control de Ventas + Conciliación de Taxista`);
  console.log(`🖥️  Host: ${HOST}`);
  console.log(`🔌 Puerto: ${PORT}`);
  console.log('=' .repeat(60));
  console.log('');
  console.log('🚀 FUNCIONALIDADES DISPONIBLES:');
  console.log('   ✅ Control de ventas básico');
  console.log('   ✅ Módulo de conciliación de taxista completo');
  console.log('   ✅ Gestión de servicios y gastos (CRUD)');
  console.log('   ✅ Generación automática de conciliaciones');
  console.log('   ✅ Calculadora de efectivo con desglose');
  console.log('   ✅ Exportación de reportes (PDF y JSON)');
  console.log('   ✅ Interfaz responsiva (móvil/tablet/escritorio)');
  console.log('   ✅ Funcionalidad PWA offline');
  console.log('   ✅ Sincronización de datos');
  console.log('');
  console.log('📱 DISPOSITIVOS SOPORTADOS:');
  console.log('   📱 Móvil: Gestos táctiles y navegación optimizada');
  console.log('   📟 Tablet: Interfaz adaptada');
  console.log('   🖥️  Escritorio: Atajos de teclado y funcionalidad completa');
  console.log('');
  console.log('🎯 PARA PROBAR EL SISTEMA:');
  console.log('   1. Navega a "Conciliación" en el menú inferior');
  console.log('   2. Agrega algunos servicios en la pestaña "Servicios"');
  console.log('   3. Agrega gastos en la pestaña "Gastos"');
  console.log('   4. Genera una conciliación en la pestaña "Conciliación"');
  console.log('   5. Exporta reportes en PDF o JSON');
  console.log('');
  console.log('⚡ ATAJOS DE TECLADO (Escritorio):');
  console.log('   Ctrl+1-4: Cambiar entre pestañas');
  console.log('   Ctrl+N: Nuevo elemento');
  console.log('   Ctrl+S: Guardar');
  console.log('   Ctrl+E: Exportar');
  console.log('');
  console.log('🛑 Para detener el servidor: Ctrl+C');
  console.log('');
  
  // Abrir navegador automáticamente después de 2 segundos
  setTimeout(() => {
    openBrowser(url);
  }, 2000);
});

// Manejo de errores del servidor
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: El puerto ${PORT} ya está en uso.`);
    console.log(`💡 Prueba con otro puerto: PORT=8081 node launch-server.js`);
  } else {
    console.error('❌ Error del servidor:', err);
  }
  process.exit(1);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    process.exit(0);
  });
});

console.log('🔄 Iniciando servidor...');