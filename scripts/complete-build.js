// scripts/complete-build.js - Build completo de AgroGestión
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌱 === BUILD COMPLETO DE AGROGESTION ===\n');

const CONFIG = {
  appName: 'AgroGestión',
  version: require('../package.json').version
};

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ ${description} completado\n`);
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    process.exit(1);
  }
}

function checkFile(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : (required ? '❌' : '⚠️ ')} ${filePath}`);
  return exists;
}

// 1. Preparación inicial
console.log('🔧 Fase 1: Preparación inicial');
runCommand('node scripts/before-build.js', 'Ejecutando preparación pre-build');

// 2. Limpiar build anterior
console.log('🧹 Fase 2: Limpieza');
if (fs.existsSync('build')) {
  fs.rmSync('build', { recursive: true, force: true });
  console.log('✅ Directorio build eliminado');
}
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
  console.log('✅ Directorio dist eliminado');
}

// 3. Build de React
console.log('⚛️  Fase 3: Build de React');
runCommand('npm run react-build', 'Construyendo aplicación React');

// 4. Verificar build
console.log('🔍 Fase 4: Verificación del build');
const buildFiles = [
  'build/index.html',
  'build/static/js',
  'build/static/css'
];

buildFiles.forEach(file => checkFile(file, true));

// 5. Optimizar para Electron
console.log('🔧 Fase 5: Optimización para Electron');
const indexPath = 'build/index.html';
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  const original = content;
  
  // Corregir rutas para Electron
  content = content.replace(/="\/static\//g, '="./static/');
  content = content.replace(/href="\/([^"]*\.css)"/g, 'href="./$1"');
  content = content.replace(/src="\/([^"]*\.js)"/g, 'src="./$1"');
  
  if (content !== original) {
    fs.writeFileSync(indexPath, content);
    console.log('✅ Rutas optimizadas en index.html');
  }
}

// 6. Crear instaladores
console.log('📦 Fase 6: Creación de instaladores');

const buildTargets = [
  { cmd: 'npm run dist-win-64', desc: 'Instalador Windows 64-bit' },
  { cmd: 'npm run dist-win-32', desc: 'Instalador Windows 32-bit' }
];

buildTargets.forEach(target => {
  runCommand(target.cmd, target.desc);
});

// 7. Verificar archivos generados
console.log('📂 Fase 7: Verificación de archivos generados');
if (fs.existsSync('dist')) {
  const files = fs.readdirSync('dist');
  console.log('\n📋 Archivos generados:');
  files.forEach(file => {
    const filePath = path.join('dist', file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   📄 ${file} (${size} MB)`);
  });
}

// 8. Resumen final
console.log('\n🎉 === BUILD COMPLETADO ===');
console.log(`✅ ${CONFIG.appName} v${CONFIG.version} construido exitosamente`);
console.log('📁 Los instaladores están en el directorio ./dist/');
console.log('\n🚀 Archivos listos para distribución:');
console.log('   • Instalador NSIS 64-bit (.exe)');
console.log('   • Instalador NSIS 32-bit (.exe)');
console.log('\n💡 Para crear otros formatos:');
console.log('   • npm run dist (todos los formatos)');
console.log('   • electron-builder --win msi (instalador MSI)');
console.log('   • electron-builder --win portable (versión portable)');