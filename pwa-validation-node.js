/**
 * PWA Validation Script for Node.js
 * Validates PWA compatibility and offline capabilities
 * Task 10.3 - Verify PWA compatibility and offline capabilities
 */

const fs = require('fs');
const path = require('path');

class PWAValidationNode {
    constructor() {
        this.results = {
            manifest: { passed: false, tests: [] },
            serviceWorker: { passed: false, tests: [] },
            offlineCapabilities: { passed: false, tests: [] },
            fileStructure: { passed: false, tests: [] },
            configuration: { passed: false, tests: [] }
        };
    }

    async runValidation() {
        console.log('🚀 Iniciando validación PWA...\n');
        
        try {
            await this.validateManifest();
            await this.validateServiceWorker();
            await this.validateOfflineCapabilities();
            await this.validateFileStructure();
            await this.validateConfiguration();
            
            this.generateReport();
            return this.calculateOverallScore() >= 80;
            
        } catch (error) {
            console.error('❌ Error durante la validación:', error.message);
            return false;
        }
    }

    async validateManifest() {
        console.log('📋 Validando PWA Manifest...');
        const results = [];
        
        try {
            // Check if manifest.json exists
            const manifestPath = path.join(process.cwd(), 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                results.push({ passed: true, message: 'Archivo manifest.json existe' });
                
                // Parse and validate manifest content
                const manifestContent = fs.readFileSync(manifestPath, 'utf8');
                const manifest = JSON.parse(manifestContent);
                
                // Check required fields
                const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
                requiredFields.forEach(field => {
                    if (manifest[field]) {
                        results.push({ passed: true, message: `Campo '${field}' presente` });
                    } else {
                        results.push({ passed: false, message: `Campo '${field}' faltante` });
                    }
                });
                
                // Check icons
                if (manifest.icons && manifest.icons.length > 0) {
                    const hasLargeIcon = manifest.icons.some(icon => 
                        icon.sizes && (icon.sizes.includes('512x512') || icon.sizes.includes('192x192'))
                    );
                    results.push({ 
                        passed: hasLargeIcon, 
                        message: hasLargeIcon ? 'Iconos grandes (192x192 o 512x512) disponibles' : 'Faltan iconos grandes' 
                    });
                    
                    // Check if icon files exist
                    let iconFilesExist = 0;
                    manifest.icons.forEach(icon => {
                        const iconPath = path.join(process.cwd(), icon.src.replace('./', ''));
                        if (fs.existsSync(iconPath)) {
                            iconFilesExist++;
                        }
                    });
                    
                    results.push({ 
                        passed: iconFilesExist > 0, 
                        message: `${iconFilesExist}/${manifest.icons.length} archivos de iconos encontrados` 
                    });
                }
                
                // Check display mode
                const validDisplayModes = ['standalone', 'fullscreen', 'minimal-ui'];
                const hasValidDisplay = validDisplayModes.includes(manifest.display);
                results.push({ 
                    passed: hasValidDisplay, 
                    message: `Modo de pantalla '${manifest.display}' ${hasValidDisplay ? 'es válido' : 'no es óptimo para PWA'}` 
                });
                
                // Check theme colors
                results.push({ 
                    passed: !!manifest.theme_color, 
                    message: manifest.theme_color ? 'Color de tema definido' : 'Color de tema faltante' 
                });
                
            } else {
                results.push({ passed: false, message: 'Archivo manifest.json no encontrado' });
            }
            
        } catch (error) {
            results.push({ passed: false, message: `Error al validar manifest: ${error.message}` });
        }
        
        this.results.manifest.tests = results;
        this.results.manifest.passed = results.filter(r => r.passed).length >= results.length * 0.8; // 80% threshold
        this.logResults('MANIFEST', results);
    }

    async validateServiceWorker() {
        console.log('⚙️ Validando Service Worker...');
        const results = [];
        
        try {
            // Check if service worker file exists
            const swPath = path.join(process.cwd(), 'sw.js');
            if (fs.existsSync(swPath)) {
                results.push({ passed: true, message: 'Archivo sw.js existe' });
                
                // Check service worker content
                const swContent = fs.readFileSync(swPath, 'utf8');
                
                // Check for essential SW features
                const hasInstallEvent = swContent.includes('install') && swContent.includes('addEventListener');
                results.push({ 
                    passed: hasInstallEvent, 
                    message: hasInstallEvent ? 'Evento install implementado' : 'Evento install faltante' 
                });
                
                const hasFetchEvent = swContent.includes('fetch') && swContent.includes('addEventListener');
                results.push({ 
                    passed: hasFetchEvent, 
                    message: hasFetchEvent ? 'Evento fetch implementado' : 'Evento fetch faltante' 
                });
                
                const hasCacheLogic = swContent.includes('caches') && swContent.includes('cache');
                results.push({ 
                    passed: hasCacheLogic, 
                    message: hasCacheLogic ? 'Lógica de cache implementada' : 'Lógica de cache faltante' 
                });
                
                // Check for offline fallback
                const hasOfflineFallback = swContent.includes('offline') || swContent.includes('fallback');
                results.push({ 
                    passed: hasOfflineFallback, 
                    message: hasOfflineFallback ? 'Fallback offline implementado' : 'Fallback offline recomendado' 
                });
                
            } else {
                results.push({ passed: false, message: 'Archivo sw.js no encontrado' });
            }
            
            // Check if SW is registered in main HTML
            const indexPath = path.join(process.cwd(), 'index.html');
            if (fs.existsSync(indexPath)) {
                const indexContent = fs.readFileSync(indexPath, 'utf8');
                const hasSwRegistration = indexContent.includes('serviceWorker') && indexContent.includes('register');
                results.push({ 
                    passed: hasSwRegistration, 
                    message: hasSwRegistration ? 'Service Worker registrado en index.html' : 'Registro de SW faltante en index.html' 
                });
            }
            
        } catch (error) {
            results.push({ passed: false, message: `Error al validar Service Worker: ${error.message}` });
        }
        
        this.results.serviceWorker.tests = results;
        this.results.serviceWorker.passed = results.filter(r => r.passed).length >= results.length * 0.7; // 70% threshold
        this.logResults('SERVICE WORKER', results);
    }

    async validateOfflineCapabilities() {
        console.log('🔐 Validando capacidades offline...');
        const results = [];
        
        try {
            // Check for authentication system files
            const authFiles = [
                'src/auth/services/auth-service.ts',
                'src/auth/services/secure-storage.ts',
                'src/auth/services/data-sync.ts'
            ];
            
            let authFilesFound = 0;
            authFiles.forEach(file => {
                const filePath = path.join(process.cwd(), file);
                if (fs.existsSync(filePath)) {
                    authFilesFound++;
                }
            });
            
            results.push({ 
                passed: authFilesFound >= 2, 
                message: `${authFilesFound}/${authFiles.length} archivos de autenticación encontrados` 
            });
            
            // Check for secure storage implementation
            const secureStoragePath = path.join(process.cwd(), 'src/auth/services/secure-storage.ts');
            if (fs.existsSync(secureStoragePath)) {
                const content = fs.readFileSync(secureStoragePath, 'utf8');
                
                const hasEncryption = content.includes('encrypt') || content.includes('crypto');
                results.push({ 
                    passed: hasEncryption, 
                    message: hasEncryption ? 'Funcionalidad de encriptación implementada' : 'Encriptación no detectada' 
                });
                
                const hasTokenStorage = content.includes('token') && content.includes('localStorage');
                results.push({ 
                    passed: hasTokenStorage, 
                    message: hasTokenStorage ? 'Almacenamiento de tokens implementado' : 'Almacenamiento de tokens no detectado' 
                });
            }
            
            // Check for data sync implementation
            const dataSyncPath = path.join(process.cwd(), 'src/auth/services/data-sync.ts');
            if (fs.existsSync(dataSyncPath)) {
                const content = fs.readFileSync(dataSyncPath, 'utf8');
                
                const hasOfflineQueue = content.includes('queue') && content.includes('offline');
                results.push({ 
                    passed: hasOfflineQueue, 
                    message: hasOfflineQueue ? 'Cola de operaciones offline implementada' : 'Cola offline no detectada' 
                });
                
                const hasConflictResolution = content.includes('conflict') && content.includes('resolution');
                results.push({ 
                    passed: hasConflictResolution, 
                    message: hasConflictResolution ? 'Resolución de conflictos implementada' : 'Resolución de conflictos no detectada' 
                });
            }
            
            // Check for role-based access offline
            const roleServicePath = path.join(process.cwd(), 'src/auth/services/role-service.ts');
            if (fs.existsSync(roleServicePath)) {
                const content = fs.readFileSync(roleServicePath, 'utf8');
                
                const hasRoleValidation = content.includes('role') && content.includes('permission');
                results.push({ 
                    passed: hasRoleValidation, 
                    message: hasRoleValidation ? 'Validación de roles offline implementada' : 'Validación de roles no detectada' 
                });
            }
            
        } catch (error) {
            results.push({ passed: false, message: `Error al validar capacidades offline: ${error.message}` });
        }
        
        this.results.offlineCapabilities.tests = results;
        this.results.offlineCapabilities.passed = results.filter(r => r.passed).length >= results.length * 0.7;
        this.logResults('CAPACIDADES OFFLINE', results);
    }

    async validateFileStructure() {
        console.log('📁 Validando estructura de archivos...');
        const results = [];
        
        try {
            // Check essential PWA files
            const essentialFiles = [
                { path: 'manifest.json', name: 'Manifest PWA' },
                { path: 'sw.js', name: 'Service Worker' },
                { path: 'index.html', name: 'Página principal' },
                { path: 'icons', name: 'Directorio de iconos', isDirectory: true }
            ];
            
            essentialFiles.forEach(file => {
                const filePath = path.join(process.cwd(), file.path);
                const exists = file.isDirectory ? fs.existsSync(filePath) && fs.statSync(filePath).isDirectory() : fs.existsSync(filePath);
                results.push({ 
                    passed: exists, 
                    message: `${file.name} ${exists ? 'encontrado' : 'faltante'}` 
                });
            });
            
            // Check authentication structure
            const authStructure = [
                'src/auth/services',
                'src/auth/types',
                'src/auth/middleware',
                'src/auth/components'
            ];
            
            let authDirsFound = 0;
            authStructure.forEach(dir => {
                const dirPath = path.join(process.cwd(), dir);
                if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                    authDirsFound++;
                }
            });
            
            results.push({ 
                passed: authDirsFound >= 3, 
                message: `${authDirsFound}/${authStructure.length} directorios de autenticación encontrados` 
            });
            
            // Check for test files
            const testDirs = [
                'src/auth/services/__tests__',
                'src/auth/components/__tests__',
                'tests'
            ];
            
            let testDirsFound = 0;
            testDirs.forEach(dir => {
                const dirPath = path.join(process.cwd(), dir);
                if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                    testDirsFound++;
                }
            });
            
            results.push({ 
                passed: testDirsFound >= 2, 
                message: `${testDirsFound}/${testDirs.length} directorios de pruebas encontrados` 
            });
            
        } catch (error) {
            results.push({ passed: false, message: `Error al validar estructura: ${error.message}` });
        }
        
        this.results.fileStructure.tests = results;
        this.results.fileStructure.passed = results.filter(r => r.passed).length >= results.length * 0.8;
        this.logResults('ESTRUCTURA DE ARCHIVOS', results);
    }

    async validateConfiguration() {
        console.log('⚙️ Validando configuración...');
        const results = [];
        
        try {
            // Check package.json
            const packagePath = path.join(process.cwd(), 'package.json');
            if (fs.existsSync(packagePath)) {
                const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                
                results.push({ passed: true, message: 'package.json encontrado' });
                
                // Check PWA-related dependencies
                const dependencies = { ...packageContent.dependencies, ...packageContent.devDependencies };
                const hasPWADeps = Object.keys(dependencies).some(dep => 
                    dep.includes('workbox') || dep.includes('pwa') || dep.includes('service-worker')
                );
                
                // Check for authentication dependencies
                const hasAuthDeps = dependencies['jsonwebtoken'] && dependencies['bcryptjs'];
                results.push({ 
                    passed: hasAuthDeps, 
                    message: hasAuthDeps ? 'Dependencias de autenticación encontradas' : 'Dependencias de autenticación faltantes' 
                });
                
                // Check for testing dependencies
                const hasTestDeps = dependencies['jest'] && dependencies['fast-check'];
                results.push({ 
                    passed: hasTestDeps, 
                    message: hasTestDeps ? 'Dependencias de testing encontradas' : 'Dependencias de testing faltantes' 
                });
                
                // Check TypeScript configuration
                const hasTypeScript = dependencies['typescript'] && dependencies['@types/jest'];
                results.push({ 
                    passed: hasTypeScript, 
                    message: hasTypeScript ? 'Configuración TypeScript encontrada' : 'TypeScript no configurado' 
                });
            }
            
            // Check TypeScript config
            const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
            if (fs.existsSync(tsconfigPath)) {
                results.push({ passed: true, message: 'tsconfig.json encontrado' });
                
                const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
                const hasStrictMode = tsconfigContent.compilerOptions && tsconfigContent.compilerOptions.strict;
                results.push({ 
                    passed: hasStrictMode, 
                    message: hasStrictMode ? 'Modo estricto TypeScript habilitado' : 'Modo estricto recomendado' 
                });
            }
            
            // Check Jest configuration
            const jestConfig = fs.existsSync(path.join(process.cwd(), 'jest.config.js')) || 
                             (fs.existsSync(packagePath) && JSON.parse(fs.readFileSync(packagePath, 'utf8')).jest);
            results.push({ 
                passed: jestConfig, 
                message: jestConfig ? 'Configuración Jest encontrada' : 'Configuración Jest faltante' 
            });
            
        } catch (error) {
            results.push({ passed: false, message: `Error al validar configuración: ${error.message}` });
        }
        
        this.results.configuration.tests = results;
        this.results.configuration.passed = results.filter(r => r.passed).length >= results.length * 0.7;
        this.logResults('CONFIGURACIÓN', results);
    }

    logResults(category, results) {
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log(`\n${category}: ${passed}/${total} (${percentage}%)`);
        results.forEach(result => {
            console.log(`  ${result.passed ? '✅' : '❌'} ${result.message}`);
        });
        console.log('');
    }

    calculateOverallScore() {
        const categories = Object.keys(this.results);
        const passedCategories = categories.filter(cat => this.results[cat].passed).length;
        return Math.round((passedCategories / categories.length) * 100);
    }

    generateReport() {
        const score = this.calculateOverallScore();
        const overallPassed = score >= 80;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE VALIDACIÓN PWA');
        console.log('='.repeat(60));
        console.log(`Puntuación General: ${score}% ${overallPassed ? '✅ EXITOSO' : '❌ FALLIDO'}`);
        console.log('');
        
        // Category summary
        Object.entries(this.results).forEach(([category, result]) => {
            const passed = result.tests.filter(t => t.passed).length;
            const total = result.tests.length;
            const percentage = Math.round((passed / total) * 100);
            
            console.log(`${result.passed ? '✅' : '❌'} ${category.toUpperCase()}: ${percentage}% (${passed}/${total})`);
        });
        
        console.log('');
        
        // Recommendations
        console.log('💡 RECOMENDACIONES:');
        const recommendations = this.generateRecommendations();
        recommendations.forEach(rec => console.log(`   • ${rec}`));
        
        console.log('\n' + '='.repeat(60));
        
        // Save detailed report
        this.saveDetailedReport(score, overallPassed);
        
        return overallPassed;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (!this.results.manifest.passed) {
            recommendations.push('Completar y corregir el archivo manifest.json');
        }
        
        if (!this.results.serviceWorker.passed) {
            recommendations.push('Implementar o mejorar el Service Worker para capacidades offline');
        }
        
        if (!this.results.offlineCapabilities.passed) {
            recommendations.push('Fortalecer las capacidades de autenticación offline');
        }
        
        if (!this.results.fileStructure.passed) {
            recommendations.push('Organizar mejor la estructura de archivos del proyecto');
        }
        
        if (!this.results.configuration.passed) {
            recommendations.push('Revisar y completar la configuración del proyecto');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('¡Excelente! Todas las validaciones pasaron correctamente');
            recommendations.push('Considerar optimizaciones adicionales para mejor rendimiento');
        }
        
        return recommendations;
    }

    saveDetailedReport(score, overallPassed) {
        const report = {
            timestamp: new Date().toISOString(),
            score,
            overallPassed,
            results: this.results,
            recommendations: this.generateRecommendations(),
            summary: {
                totalCategories: Object.keys(this.results).length,
                passedCategories: Object.values(this.results).filter(r => r.passed).length,
                totalTests: Object.values(this.results).reduce((sum, r) => sum + r.tests.length, 0),
                passedTests: Object.values(this.results).reduce((sum, r) => sum + r.tests.filter(t => t.passed).length, 0)
            }
        };
        
        // Save JSON report
        fs.writeFileSync('pwa-validation-report.json', JSON.stringify(report, null, 2));
        console.log('📄 Reporte detallado guardado en: pwa-validation-report.json');
        
        // Save markdown report
        let mdReport = `# Reporte de Validación PWA - Sistema de Autenticación\n\n`;
        mdReport += `**Fecha:** ${new Date().toLocaleString()}\n`;
        mdReport += `**Puntuación:** ${score}% (${report.summary.passedCategories}/${report.summary.totalCategories} categorías)\n`;
        mdReport += `**Estado:** ${overallPassed ? 'EXITOSO ✅' : 'FALLIDO ❌'}\n\n`;
        
        mdReport += `## Resultados por Categoría\n\n`;
        Object.entries(this.results).forEach(([category, result]) => {
            const passed = result.tests.filter(t => t.passed).length;
            const total = result.tests.length;
            const percentage = Math.round((passed / total) * 100);
            
            mdReport += `### ${category.toUpperCase()} ${result.passed ? '✅' : '❌'} (${percentage}%)\n\n`;
            result.tests.forEach(test => {
                mdReport += `- ${test.passed ? '✅' : '❌'} ${test.message}\n`;
            });
            mdReport += `\n`;
        });
        
        mdReport += `## Recomendaciones\n\n`;
        this.generateRecommendations().forEach(rec => {
            mdReport += `- ${rec}\n`;
        });
        
        mdReport += `\n## Estadísticas\n\n`;
        mdReport += `- **Total de pruebas:** ${report.summary.totalTests}\n`;
        mdReport += `- **Pruebas exitosas:** ${report.summary.passedTests}\n`;
        mdReport += `- **Tasa de éxito:** ${Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%\n`;
        
        fs.writeFileSync('pwa-validation-report.md', mdReport);
        console.log('📄 Reporte markdown guardado en: pwa-validation-report.md');
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new PWAValidationNode();
    validator.runValidation().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

module.exports = PWAValidationNode;