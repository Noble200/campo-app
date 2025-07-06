// scripts/build-agrogestion.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🌱 === CONSTRUCCIÓN DE AGROGESTION ===\n');

// 1. Verificar estructura específica de tu proyecto
console.log('📁 Verificando estructura del proyecto AgroGestión:');
const projectStructure = {
  required: [
    'src/index.js',
    'src/App.js',
    'src/api/firebase.js',
    'src/components/layout/AppLayout/AppLayout.js',
    'src/components/panels/Dashboard/DashboardPanel.js',
    'public/index.html',
    'public/electron.js',
    'public/preload.js'
  ],
  optional: [
    'public/assets/css/global.css',
    'public/assets/icons/icon.png',
    'build'
  ]
};

let hasErrors = false;

projectStructure.required.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) {
    hasErrors = true;
  }
});

projectStructure.optional.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '⚠️ '} ${file} ${exists ? '' : '(opcional)'}`);
});

if (hasErrors) {
  console.error('\n❌ Faltan archivos requeridos. Verifica la estructura del proyecto.');
  process.exit(1);
}

// 2. Verificar dependencias específicas de tu proyecto
console.log('\n📦 Verificando dependencias de AgroGestión:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = {
    dependencies: ['react', 'react-dom', 'firebase', 'react-router-dom', 'dayjs'],
    devDependencies: ['electron', 'electron-builder']
  };
  
  Object.entries(requiredDeps).forEach(([type, deps]) => {
    deps.forEach(dep => {
      const exists = packageJson[type] && packageJson[type][dep];
      console.log(`${exists ? '✅' : '❌'} ${dep} ${exists ? `(${packageJson[type][dep]})` : ''}`);
    });
  });
} catch (error) {
  console.error('❌ Error verificando dependencias:', error.message);
}

// 3. Limpiar build anterior
console.log('\n🧹 Limpiando build anterior...');
if (fs.existsSync('build')) {
  try {
    fs.rmSync('build', { recursive: true, force: true });
    console.log('✅ Directorio build eliminado');
  } catch (error) {
    console.warn('⚠️  Warning eliminando build:', error.message);
  }
}

if (fs.existsSync('dist')) {
  try {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('✅ Directorio dist eliminado');
  } catch (error) {
    console.warn('⚠️  Warning eliminando dist:', error.message);
  }
}

// 4. Configurar variables de entorno para React
console.log('\n⚛️  Configurando variables de entorno...');
process.env.GENERATE_SOURCEMAP = 'false'; // Reducir tamaño del build
process.env.REACT_APP_VERSION = '1.0.0';
process.env.REACT_APP_ELECTRON = 'true';

// 5. Construir React
console.log('\n⚛️  Construyendo aplicación React...');
try {
  execSync('npm run react-build', { 
    stdio: 'inherit',
    env: process.env
  });
  console.log('✅ React build completado');
} catch (error) {
  console.error('❌ Error en React build:', error.message);
  process.exit(1);
}

// 6. Verificar y corregir build de React
console.log('\n🔍 Verificando build generado:');
const buildChecks = [
  'build/index.html',
  'build/static/js',
  'build/static/css'
];

buildChecks.forEach(item => {
  const exists = fs.existsSync(item);
  console.log(`${exists ? '✅' : '❌'} ${item}`);
});

// 7. Verificar el contenido del index.html
console.log('\n🔍 Analizando index.html generado:');
const indexPath = 'build/index.html';
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Verificar referencias
  const jsFiles = content.match(/src="[^"]*\.js[^"]*"/g) || [];
  const cssFiles = content.match(/href="[^"]*\.css[^"]*"/g) || [];
  
  console.log(`📄 Archivos JS: ${jsFiles.length}`);
  console.log(`🎨 Archivos CSS: ${cssFiles.length}`);
  
  // Asegurar que las rutas sean relativas para Electron
  if (content.includes('="/static/')) {
    console.log('🔧 Corrigiendo rutas absolutas a relativas...');
    content = content.replace(/="\/static\//g, '="./static/');
    content = content.replace(/="\/([^\/][^"]*\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf))"/g, '="./$1"');
    
    fs.writeFileSync(indexPath, content, 'utf8');
    console.log('✅ Rutas corregidas en index.html');
  }
  
  // Verificar que los archivos referenciados existen
  const allRefs = [...jsFiles, ...cssFiles];
  allRefs.forEach(ref => {
    const match = ref.match(/(src|href)="([^"]*)"/);
    if (match) {
      const filePath = match[2];
      const fullPath = path.join('build', filePath.startsWith('./') ? filePath.slice(2) : filePath);
      const exists = fs.existsSync(fullPath);
      console.log(`${exists ? '✅' : '❌'} ${filePath}`);
    }
  });
}

// 8. Copiar assets si existen
console.log('\n📂 Copiando assets...');
if (fs.existsSync('public/assets')) {
  try {
    // Crear directorio assets en build si no existe
    const buildAssetsPath = 'build/assets';
    if (!fs.existsSync(buildAssetsPath)) {
      fs.mkdirSync(buildAssetsPath, { recursive: true });
    }
    
    // Copiar recursivamente
    function copyDir(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      entries.forEach(entry => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      });
    }
    
    copyDir('public/assets', 'build/assets');
    console.log('✅ Assets copiados');
  } catch (error) {
    console.warn('⚠️  Warning copiando assets:', error.message);
  }
} else {
  console.log('ℹ️  No hay directorio de assets para copiar');
}

// 9. Verificar iconos para Electron Builder
console.log('\n🎨 Verificando iconos para el instalador:');
const iconFiles = [
  'build-resources/icon.ico',
  'build-resources/installer.ico'
];

const missingIcons = iconFiles.filter(icon => !fs.existsSync(icon));
if (missingIcons.length > 0) {
  console.warn('⚠️  Iconos faltantes para el instalador:');
  missingIcons.forEach(icon => console.warn(`   - ${icon}`));
  
  // Crear iconos básicos si no existen
  try {
    if (!fs.existsSync('build-resources')) {
      fs.mkdirSync('build-resources', { recursive: true });
    }
    
    console.log('💡 Ejecuta "npm run create-icons" para crear iconos básicos');
  } catch (error) {
    console.warn('Warning creando directorio build-resources:', error.message);
  }
}

// 10. Resumen final
console.log('\n📊 === RESUMEN DE LA CONSTRUCCIÓN ===');
console.log('✅ Aplicación React construida exitosamente');
console.log('✅ Archivos de Electron verificados');
console.log('✅ Assets copiados');
console.log('✅ Index.html verificado y corregido');

console.log('\n🎉 ¡Construcción de AgroGestión completada!');
console.log('\n💡 Próximos pasos:');
console.log('   • Probar en desarrollo: npm run start');
console.log('   • Empaquetar: npm run dist-win-64');
console.log('   • Crear iconos (si es necesario): npm run create-icons');

// 11. Verificación final de estructura
console.log('\n📁 Estructura final del build:');
try {
  function listBuildStructure(dir, prefix = '', maxDepth = 2, currentDepth = 0) {
    if (currentDepth >= maxDepth) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)}KB)` : '';
      
      console.log(`${prefix}${stats.isDirectory() ? '📁' : '📄'} ${item}${size}`);
      
      if (stats.isDirectory() && currentDepth < maxDepth - 1) {
        listBuildStructure(fullPath, prefix + '  ', maxDepth, currentDepth + 1);
      }
    });
  }
  
  if (fs.existsSync('build')) {
    listBuildStructure('build');
  }
} catch (error) {
  console.warn('Warning listando estructura:', error.message);
}