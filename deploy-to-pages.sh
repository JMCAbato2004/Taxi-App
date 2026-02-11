#!/bin/bash

# Script para preparar el despliegue de ionic-pwa a GitHub Pages
# Este script copia los archivos de ionic-pwa a la raíz para el despliegue

echo "🚀 Preparando despliegue de Ionic PWA con Seguridad..."

# Crear una rama temporal para el despliegue
git checkout -b gh-pages-security-fixes

# Copiar archivos de ionic-pwa a la raíz
echo "📦 Copiando archivos de ionic-pwa a la raíz..."
cp -r ionic-pwa/* .

# Copiar manifest.json si existe
if [ -f "manifest.json" ]; then
    echo "✅ manifest.json ya existe en la raíz"
else
    echo "⚠️  manifest.json no encontrado"
fi

# Crear .nojekyll para GitHub Pages
touch .nojekyll

# Agregar cambios
git add .

# Commit
git commit -m "deploy: Ionic PWA with security features to GitHub Pages"

# Push a la rama de despliegue
git push -f origin gh-pages-security-fixes

echo "✅ Despliegue preparado!"
echo "🌐 Configura GitHub Pages para usar la rama 'gh-pages-security-fixes'"
echo "📍 URL: https://jmcabato2004.github.io/Taxi-App/"
