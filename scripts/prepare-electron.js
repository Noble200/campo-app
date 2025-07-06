// scripts/prepare-electron.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Preparando archivos para electron-builder...');

// Función para verificar y crear directorios
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Directorio creado: ${dirPath}`);
  }
}

// Función para copiar archivos
function copyFile(src, dest, description) {
  try {
    if (fs.existsSync(src)) {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
      console.log(`✅ ${description}: ${src} → ${dest}`);
      return true;
    } else {
      console.error(`❌ Archivo fuente no encontrado: ${src}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error copiando ${description}:`, error.message);
    return false;
  }
}

// 1. Verificar que build existe
if (!fs.existsSync('build')) {
  console.error('❌ Directorio build no encontrado. Ejecuta "npm run react-build" primero.');
  process.exit(1);
}

console.log('✅ Directorio build encontrado');

// 2. Copiar electron.js al directorio build
const electronFiles = [
  {
    src: 'public/electron.js',
    dest: 'build/electron.js',
    desc: 'Archivo principal de Electron'
  },
  {
    src: 'public/preload.js', 
    dest: 'build/preload.js',
    desc: 'Script preload de Electron'
  }
];

let allFilesCopied = true;
electronFiles.forEach(file => {
  if (!copyFile(file.src, file.dest, file.desc)) {
    allFilesCopied = false;
  }
});

if (!allFilesCopied) {
  console.error('❌ Error copiando archivos de Electron');
  process.exit(1);
}

// 3. Arreglar rutas en index.html para que funcionen con Electron
console.log('🔧 Corrigiendo rutas en index.html...');
const indexHtmlPath = 'build/index.html';

if (fs.existsSync(indexHtmlPath)) {
  let content = fs.readFileSync(indexHtmlPath, 'utf8');
  const originalContent = content;
  
  // Convertir rutas absolutas a relativas
  content = content.replace(/href="\/static\//g, 'href="./static/');
  content = content.replace(/src="\/static\//g, 'src="./static/');
  content = content.replace(/href="\/([^\/][^"]*\.(css|ico|png|jpg|svg))"/g, 'href="./$1"');
  content = content.replace(/src="\/([^\/][^"]*\.(js|png|jpg|svg))"/g, 'src="./$1"');
  
  // Agregar CSP para Electron si no existe
  if (!content.includes('Content-Security-Policy')) {
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https: wss:;">`;
    content = content.replace('<head>', `<head>\n    ${cspMeta}`);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(indexHtmlPath, content);
    console.log('✅ Rutas corregidas en index.html');
  } else {
    console.log('ℹ️  No se necesitaron correcciones en index.html');
  }
} else {
  console.error('❌ build/index.html no encontrado');
  process.exit(1);
}

// 4. Copiar assets si existen
if (fs.existsSync('public/assets')) {
  console.log('📂 Copiando assets...');
  
  function copyDirRecursive(src, dest) {
    ensureDir(dest);
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
  
  copyDirRecursive('public/assets', 'build/assets');
  console.log('✅ Assets copiados');
}

// 5. Verificar estructura final
console.log('\n📁 Verificando estructura final para electron-builder:');
const requiredFiles = [
  'build/index.html',
  'build/electron.js',
  'build/preload.js',
  'build/static'
];

let structureOK = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) structureOK = false;
});

// 6. Crear archivo de versión para debug
const versionInfo = {
  version: require('../package.json').version,
  buildDate: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform
};

fs.writeFileSync('build/version.json', JSON.stringify(versionInfo, null, 2));
console.log('✅ Archivo de versión creado');

// 7. Verificar archivos estáticos
console.log('\n📊 Información del build:');
try {
  const buildStats = fs.statSync('build');
  console.log(`📁 Directorio build: ${buildStats.isDirectory() ? 'OK' : 'ERROR'}`);
  
  const indexSize = fs.statSync('build/index.html').size;
  console.log(`📄 index.html: ${(indexSize / 1024).toFixed(1)} KB`);
  
  if (fs.existsSync('build/static/js')) {
    const jsFiles = fs.readdirSync('build/static/js').filter(f => f.endsWith('.js'));
    console.log(`📜 Archivos JS: ${jsFiles.length}`);
  }
  
  if (fs.existsSync('build/static/css')) {
    const cssFiles = fs.readdirSync('build/static/css').filter(f => f.endsWith('.css'));
    console.log(`🎨 Archivos CSS: ${cssFiles.length}`);
  }
} catch (error) {
  console.warn('⚠️  Error obteniendo estadísticas:', error.message);
}

if (structureOK) {
  console.log('\n🎉 Archivos preparados correctamente para electron-builder');
  console.log('💡 Ahora puedes ejecutar: npm run dist-win-64');
} else {
  console.error('\n❌ Error en la preparación de archivos');
  process.exit(1);
}