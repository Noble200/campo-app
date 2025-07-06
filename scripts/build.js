// scripts/build.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏗️  Iniciando proceso de construcción de AgroGestión...');

// Función para ejecutar comandos
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado`);
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    process.exit(1);
  }
}

// Función para verificar archivos
function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${name} encontrado: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${name} NO encontrado: ${filePath}`);
    return false;
  }
}

// 1. Limpiar directorios
console.log('\n🧹 Limpiando directorios...');
runCommand('npm run clean', 'Limpieza de directorios');

// 2. Verificar archivos de Electron
console.log('\n🔍 Verificando archivos de Electron...');
const electronFiles = [
  { path: 'public/electron.js', name: 'Electron Main' },
  { path: 'public/preload.js', name: 'Electron Preload' }
];

let allElectronFilesExist = true;
electronFiles.forEach(file => {
  if (!checkFile(file.path, file.name)) {
    allElectronFilesExist = false;
  }
});

if (!allElectronFilesExist) {
  console.error('\n❌ Faltan archivos de Electron. Asegúrate de que public/electron.js y public/preload.js existan.');
  process.exit(1);
}

// 3. Construir React
console.log('\n⚛️  Construyendo aplicación React...');
runCommand('npm run react-build', 'Construcción de React');

// 4. Verificar construcción de React
console.log('\n🔍 Verificando construcción de React...');
const buildFiles = [
  { path: 'build/index.html', name: 'Index HTML' },
  { path: 'build/static', name: 'Directorio static' }
];

buildFiles.forEach(file => {
  checkFile(file.path, file.name);
});

// 5. Copiar assets si existen
console.log('\n📂 Copiando assets...');
if (fs.existsSync('public/assets')) {
  try {
    execSync('npm run copy-assets', { stdio: 'inherit' });
    console.log('✅ Assets copiados');
  } catch (error) {
    console.warn('⚠️  Warning: No se pudieron copiar los assets:', error.message);
  }
} else {
  console.log('ℹ️  No hay directorio de assets para copiar');
}

// 6. Verificar iconos
console.log('\n🎨 Verificando iconos...');
const iconFiles = [
  'build-resources/icon.ico',
  'build-resources/installer.ico',
  'build-resources/uninstaller.ico'
];

const missingIcons = iconFiles.filter(icon => !fs.existsSync(icon));
if (missingIcons.length > 0) {
  console.warn('⚠️  Iconos faltantes:');
  missingIcons.forEach(icon => console.warn(`   - ${icon}`));
  console.log('💡 Ejecuta "npm run create-icons" para crear iconos básicos');
}

// 7. Mostrar resumen
console.log('\n📊 Resumen de la construcción:');
console.log('✅ Aplicación React construida');
console.log('✅ Archivos de Electron verificados');
console.log('✅ Estructura de archivos lista para empaquetado');

console.log('\n🎉 Construcción completada exitosamente!');
console.log('💡 Ahora puedes ejecutar:');
console.log('   • npm run pack-win (para empaquetado sin instalador)');
console.log('   • npm run dist-win-64 (para crear instalador)');