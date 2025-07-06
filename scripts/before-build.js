// scripts/before-build.js - Configuración previa al build para AgroGestión
const fs = require('fs');
const path = require('path');

console.log('🔧 === PREPARACIÓN PRE-BUILD AGROGESTION ===\n');

function log(message, type = 'info') {
  const symbols = { info: 'ℹ️ ', success: '✅', warning: '⚠️ ', error: '❌' };
  console.log(`${symbols[type]} ${message}`);
}

// 1. Limpiar archivos temporales y cache
function cleanTempFiles() {
  log('Limpiando archivos temporales...');
  
  const tempDirs = [
    '.tmp', 
    'temp', 
    'cache',
    'node_modules/.cache',
    'build/.cache'
  ];
  
  tempDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        log(`Eliminado: ${dir}`, 'success');
      } catch (error) {
        log(`No se pudo eliminar ${dir}: ${error.message}`, 'warning');
      }
    }
  });
}

// 2. Crear directorio build-resources si no existe
function ensureBuildResourcesDir() {
  log('Verificando directorio build-resources...');
  
  const buildResourcesPath = path.join(__dirname, '..', 'build-resources');
  if (!fs.existsSync(buildResourcesPath)) {
    fs.mkdirSync(buildResourcesPath, { recursive: true });
    log('Directorio build-resources creado', 'success');
  } else {
    log('Directorio build-resources existe', 'success');
  }
}

// 3. Verificar iconos requeridos (sin crearlos)
function checkRequiredIcons() {
  log('Verificando iconos requeridos...');
  
  const requiredIcons = [
    { file: 'build-resources/icon.ico', desc: 'Icono principal' },
    { file: 'build-resources/installer.ico', desc: 'Icono instalador' },
    { file: 'build-resources/uninstaller.ico', desc: 'Icono desinstalador' },
    { file: 'build-resources/header.ico', desc: 'Icono header' }
  ];
  
  let missingIcons = [];
  
  requiredIcons.forEach(icon => {
    const exists = fs.existsSync(icon.file);
    if (exists) {
      log(`${icon.desc}: OK`, 'success');
    } else {
      log(`${icon.desc}: FALTANTE`, 'warning');
      missingIcons.push(icon.file);
    }
  });
  
  if (missingIcons.length > 0) {
    log(`Faltan ${missingIcons.length} iconos. El build continuará con iconos por defecto.`, 'warning');
  }
}

// 4. Verificar estructura del proyecto
function verifyProjectStructure() {
  log('Verificando estructura del proyecto...');
  
  const requiredFiles = [
    { file: 'src/index.js', desc: 'Entry point React' },
    { file: 'src/App.js', desc: 'Componente principal' },
    { file: 'public/index.html', desc: 'HTML template' },
    { file: 'public/electron.js', desc: 'Electron main process' },
    { file: 'public/preload.js', desc: 'Electron preload script' },
    { file: 'package.json', desc: 'Configuración del proyecto' }
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(item => {
    const exists = fs.existsSync(item.file);
    if (exists) {
      log(`${item.desc}: OK`, 'success');
    } else {
      log(`${item.desc}: FALTANTE`, 'error');
      allFilesExist = false;
    }
  });
  
  if (!allFilesExist) {
    log('Estructura del proyecto incompleta. Revisa los archivos faltantes.', 'error');
    process.exit(1);
  }
}

// 5. Crear archivo de información de versión
function createVersionInfo() {
  log('Creando información de versión...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const versionInfo = {
      version: packageJson.version,
      name: packageJson.name,
      productName: packageJson.build?.productName || packageJson.name,
      description: packageJson.description,
      buildDate: new Date().toISOString(),
      buildTimestamp: Date.now(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      electronVersion: packageJson.devDependencies?.electron || 'unknown',
      reactVersion: packageJson.dependencies?.react || 'unknown'
    };
    
    // Crear directorio build si no existe
    const buildDir = path.join(__dirname, '..', 'build');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(buildDir, 'version.json'),
      JSON.stringify(versionInfo, null, 2),
      'utf8'
    );
    
    log(`Información de versión creada: v${versionInfo.version}`, 'success');
    
  } catch (error) {
    log(`Error creando información de versión: ${error.message}`, 'warning');
  }
}

// 6. Optimizar configuración para Electron
function optimizeForElectron() {
  log('Optimizando configuración para Electron...');
  
  // Configurar variables de entorno
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.REACT_APP_ELECTRON = 'true';
  process.env.PUBLIC_URL = './';
  
  log('Variables de entorno configuradas', 'success');
  
  // Verificar que el homepage en package.json sea correcto
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (packageJson.homepage !== './') {
      log('Corrigiendo homepage en package.json...', 'info');
      packageJson.homepage = './';
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      log('Homepage corregido', 'success');
    }
    
  } catch (error) {
    log(`Error verificando package.json: ${error.message}`, 'warning');
  }
}

// 7. Verificar dependencias críticas
function checkDependencies() {
  log('Verificando dependencias críticas...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const criticalDeps = {
      dependencies: ['react', 'react-dom'],
      devDependencies: ['electron', 'electron-builder']
    };
    
    Object.entries(criticalDeps).forEach(([type, deps]) => {
      deps.forEach(dep => {
        const exists = packageJson[type] && packageJson[type][dep];
        if (exists) {
          log(`${dep}: ${packageJson[type][dep]}`, 'success');
        } else {
          log(`${dep}: FALTANTE en ${type}`, 'error');
        }
      });
    });
    
  } catch (error) {
    log(`Error verificando dependencias: ${error.message}`, 'error');
  }
}

// 8. Crear manifiesto de build
function createBuildManifest() {
  log('Creando manifiesto de build...');
  
  const manifest = {
    buildId: `agrogestion-${Date.now()}`,
    timestamp: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    environment: {
      GENERATE_SOURCEMAP: process.env.GENERATE_SOURCEMAP,
      REACT_APP_ELECTRON: process.env.REACT_APP_ELECTRON,
      PUBLIC_URL: process.env.PUBLIC_URL
    },
    files: {
      electronMain: 'public/electron.js',
      preloadScript: 'public/preload.js',
      reactEntry: 'src/index.js'
    }
  };
  
  try {
    const buildDir = path.join(__dirname, '..', 'build');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(buildDir, 'build-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    log('Manifiesto de build creado', 'success');
  } catch (error) {
    log(`Error creando manifiesto: ${error.message}`, 'warning');
  }
}

// Función principal
function main() {
  try {
    log('Iniciando preparación pre-build para AgroGestión', 'info');
    
    cleanTempFiles();
    ensureBuildResourcesDir();
    verifyProjectStructure();
    checkRequiredIcons();
    optimizeForElectron();
    checkDependencies();
    createVersionInfo();
    createBuildManifest();
    
    log('\n🎉 Preparación pre-build completada exitosamente!', 'success');
    log('El proyecto está listo para el build de React y empaquetado con Electron Builder.', 'info');
    
  } catch (error) {
    log(`Error durante la preparación: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main };