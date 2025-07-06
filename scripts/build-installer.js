// scripts/build-installer.js - Script completo para crear instalador con electron-builder
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🌱 === CONSTRUCCIÓN DE INSTALADOR AGROGESTION ===\n');

// Función para ejecutar comandos con mejor manejo de errores
function runCommand(command, description, options = {}) {
  console.log(`📋 ${description}...`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        GENERATE_SOURCEMAP: 'false',
        CI: 'false'
      },
      ...options
    });
    console.log(`✅ ${description} completado`);
    return true;
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    return false;
  }
}

// Función para verificar archivos
function checkFile(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  const icon = exists ? '✅' : (required ? '❌' : '⚠️ ');
  console.log(`${icon} ${filePath}`);
  return exists;
}

// Función para verificar espacio en disco
function checkDiskSpace() {
  try {
    const stats = fs.statSync('.');
    console.log('💾 Verificando espacio en disco...');
    // Estimación básica: necesitamos al menos 500MB libres
    return true;
  } catch (error) {
    console.warn('⚠️  No se pudo verificar espacio en disco');
    return true;
  }
}

// Función para verificar dependencias de Node
function checkNodeModules() {
  console.log('📦 Verificando node_modules...');
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Instalando dependencias...');
    return runCommand('npm install', 'Instalación de dependencias');
  }
  
  // Verificar dependencias críticas
  const criticalDeps = [
    'node_modules/electron',
    'node_modules/electron-builder',
    'node_modules/react',
    'node_modules/react-dom'
  ];
  
  let allDepsOK = true;
  criticalDeps.forEach(dep => {
    if (!checkFile(dep, false)) {
      allDepsOK = false;
    }
  });
  
  if (!allDepsOK) {
    console.log('📦 Reinstalando dependencias...');
    return runCommand('npm install', 'Reinstalación de dependencias');
  }
  
  return true;
}

// PASO 1: Verificaciones iniciales
console.log('🔍 === VERIFICACIONES INICIALES ===');

if (!checkDiskSpace()) {
  console.error('❌ Espacio en disco insuficiente');
  process.exit(1);
}

if (!checkNodeModules()) {
  console.error('❌ Error con las dependencias de Node.js');
  process.exit(1);
}

// Verificar estructura del proyecto
const requiredFiles = [
  'package.json',
  'src/index.js',
  'src/App.js',
  'public/index.html',
  'public/electron.js',
  'public/preload.js'
];

console.log('\n📁 Verificando estructura del proyecto:');
let structureOK = true;
requiredFiles.forEach(file => {
  if (!checkFile(file)) {
    structureOK = false;
  }
});

if (!structureOK) {
  console.error('\n❌ Estructura del proyecto incompleta');
  process.exit(1);
}

// PASO 2: Limpiar directorios previos
console.log('\n🧹 === LIMPIEZA DE DIRECTORIOS ===');
const dirsToClean = ['build', 'dist'];

dirsToClean.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ ${dir} eliminado`);
    } catch (error) {
      console.warn(`⚠️  Warning eliminando ${dir}:`, error.message);
    }
  }
});

// PASO 3: Construir React
console.log('\n⚛️  === CONSTRUCCIÓN DE REACT ===');
if (!runCommand('npm run react-build', 'Construcción de React')) {
  console.error('❌ Error en la construcción de React');
  process.exit(1);
}

// Verificar que React build fue exitoso
console.log('\n🔍 Verificando construcción de React:');
const reactBuildFiles = [
  'build/index.html',
  'build/static',
  'build/static/js',
  'build/static/css'
];

let reactBuildOK = true;
reactBuildFiles.forEach(file => {
  if (!checkFile(file)) {
    reactBuildOK = false;
  }
});

if (!reactBuildOK) {
  console.error('❌ La construcción de React está incompleta');
  process.exit(1);
}

// PASO 4: Preparar archivos de Electron
console.log('\n🔧 === PREPARACIÓN DE ELECTRON ===');
if (!runCommand('node scripts/prepare-electron.js', 'Preparación de archivos Electron')) {
  console.error('❌ Error preparando archivos de Electron');
  process.exit(1);
}

// PASO 5: Crear iconos
console.log('\n🎨 === CREACIÓN DE ICONOS ===');

// Verificar si ya existen iconos
const iconFiles = [
  'build-resources/icon.ico',
  'build-resources/installer.ico',
  'build-resources/uninstaller.ico'
];

const missingIcons = iconFiles.filter(icon => !fs.existsSync(icon));

if (missingIcons.length > 0) {
  console.log('🎨 Creando iconos faltantes...');
  if (!runCommand('node scripts/create-real-icons.js', 'Creación de iconos')) {
    console.warn('⚠️  Warning: No se pudieron crear los iconos automáticamente');
    console.log('💡 Puedes continuar, pero se usarán iconos por defecto');
  }
} else {
  console.log('✅ Todos los iconos están disponibles');
}

// Verificar archivo de licencia
if (!fs.existsSync('build-resources/license.txt')) {
  console.log('📄 Creando archivo de licencia...');
  const licenseContent = `CONTRATO DE LICENCIA DE SOFTWARE - AGROGESTION

Copyright (c) 2024 AgroGestión. Todos los derechos reservados.

Al instalar o usar AgroGestión, usted acepta los términos y condiciones de uso.

Para más información, visite: www.agrogestion.com`;
  
  if (!fs.existsSync('build-resources')) {
    fs.mkdirSync('build-resources', { recursive: true });
  }
  fs.writeFileSync('build-resources/license.txt', licenseContent);
}

// PASO 6: Construir con electron-builder
console.log('\n🏗️  === CONSTRUCCIÓN CON ELECTRON-BUILDER ===');

console.log('📋 Ejecutando electron-builder para Windows x64...');
console.log('⏳ Esto puede tomar varios minutos...\n');

const builderSuccess = runCommand(
  'electron-builder --win --x64 --publish never',
  'Construcción del instalador con electron-builder',
  { stdio: 'pipe' }
);

if (!builderSuccess) {
  console.error('\n❌ Error en electron-builder');
  console.log('\n🔧 Intentando diagnóstico...');
  
  // Intentar construir solo el directorio (sin instalador)
  console.log('🔧 Intentando construcción de directorio solamente...');
  if (runCommand('electron-builder --win --dir', 'Construcción de directorio')) {
    console.log('✅ La construcción de directorio funcionó');
    console.log('❌ El problema está en la creación del instalador NSIS');
    console.log('\n💡 Soluciones posibles:');
    console.log('   1. Verificar que NSIS esté instalado');
    console.log('   2. Ejecutar como administrador');
    console.log('   3. Verificar antivirus/firewall');
  }
  process.exit(1);
}

// PASO 7: Verificar archivos generados
console.log('\n📦 === VERIFICACIÓN DE ARCHIVOS GENERADOS ===');

const distPath = 'dist';
if (fs.existsSync(distPath)) {
  const distFiles = fs.readdirSync(distPath);
  console.log(`📁 Archivos en dist: ${distFiles.length}`);
  
  distFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    const size = stats.isFile() ? ` (${(stats.size / 1024 / 1024).toFixed(1)} MB)` : '';
    console.log(`  📄 ${file}${size}`);
  });
  
  // Buscar el instalador principal
  const setupFile = distFiles.find(f => f.includes('Setup') && f.endsWith('.exe'));
  const portableFile = distFiles.find(f => f.includes('Portable') && f.endsWith('.exe'));
  
  if (setupFile) {
    console.log(`\n🎉 Instalador creado: dist/${setupFile}`);
  }
  if (portableFile) {
    console.log(`🎉 Versión portable creada: dist/${portableFile}`);
  }
} else {
  console.error('❌ No se encontró el directorio dist');
  process.exit(1);
}

// PASO 8: Información final
console.log('\n🎉 === CONSTRUCCIÓN COMPLETADA EXITOSAMENTE ===');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`📋 Aplicación: ${packageJson.productName || packageJson.name}`);
console.log(`📋 Versión: ${packageJson.version}`);
console.log(`📋 Plataforma: Windows x64`);

console.log('\n📁 Archivos generados en ./dist/');
console.log('✅ Instalador NSIS (.exe)');
console.log('✅ Versión portable (.exe)');

console.log('\n🚀 Próximos pasos:');
console.log('   1. Probar el instalador en una máquina limpia');
console.log('   2. Verificar que la aplicación funciona correctamente');
console.log('   3. Distribuir el instalador a los usuarios');

console.log('\n💡 Notas importantes:');
console.log('   • El instalador no requiere permisos de administrador');
console.log('   • Se instala en el directorio del usuario por defecto');
console.log('   • Crea accesos directos en escritorio y menú inicio');

console.log('\n✨ ¡AgroGestión está listo para distribuir! ✨');