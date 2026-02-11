@echo off
echo ========================================
echo Desplegando Ionic PWA a GitHub Pages
echo ========================================
echo.

REM Resolver bloqueo de Git
echo [1/8] Resolviendo bloqueos de Git...
taskkill /F /IM git.exe 2>nul
if exist .git\index.lock del /F .git\index.lock 2>nul
timeout /t 2 /nobreak >nul

REM Ir a security-fixes
echo [2/8] Cambiando a rama security-fixes...
git checkout security-fixes
if errorlevel 1 (
    echo ERROR: No se pudo cambiar a security-fixes
    pause
    exit /b 1
)

REM Verificar que ionic-pwa existe
echo [3/8] Verificando contenido de ionic-pwa...
if not exist "ionic-pwa\index.html" (
    echo ERROR: No se encuentra ionic-pwa/index.html
    pause
    exit /b 1
)

REM Crear nueva rama gh-pages-deploy
echo [4/8] Creando rama gh-pages-deploy...
git branch -D gh-pages-deploy 2>nul
git checkout -b gh-pages-deploy
if errorlevel 1 (
    echo ERROR: No se pudo crear gh-pages-deploy
    pause
    exit /b 1
)

REM Limpiar todo excepto ionic-pwa
echo [5/8] Limpiando archivos innecesarios...
for /d %%D in (*) do (
    if /i not "%%D"=="ionic-pwa" (
        if /i not "%%D"==".git" (
            rd /s /q "%%D" 2>nul
        )
    )
)

for %%F in (*) do (
    if /i not "%%F"=="deploy-ionic-to-pages.cmd" (
        del /f /q "%%F" 2>nul
    )
)

REM Mover contenido de ionic-pwa a raíz
echo [6/8] Moviendo archivos de ionic-pwa a raíz...
xcopy /E /I /Y ionic-pwa\* . >nul
rd /s /q ionic-pwa

REM Commit
echo [7/8] Creando commit...
git add -A
git commit -m "Deploy: Ionic PWA with security features to GitHub Pages"
if errorlevel 1 (
    echo ERROR: No se pudo crear el commit
    pause
    exit /b 1
)

REM Push
echo [8/8] Subiendo a GitHub...
git push -f origin gh-pages-deploy
if errorlevel 1 (
    echo ERROR: No se pudo hacer push
    pause
    exit /b 1
)

echo.
echo ========================================
echo DESPLIEGUE COMPLETADO
echo ========================================
echo.
echo Ahora configura GitHub Pages:
echo 1. Ve a: https://github.com/JMCAbato2004/Taxi-App/settings/pages
echo 2. Source: Deploy from a branch
echo 3. Branch: gh-pages-deploy
echo 4. Folder: / (root)
echo 5. Click Save
echo.
echo Espera 2-3 minutos y visita:
echo https://jmcabato2004.github.io/Taxi-App/
echo.
pause
