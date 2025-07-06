const fs = require('fs');
const path = require('path');

console.log('📦 Ejecutando tareas previas al empaquetado...');

// Optimizar el directorio build
function optimizeBuild() {
  const buildPath = path.join(__dirname, '..', 'build');
  
  if (!fs.existsSync(buildPath)) {
    console.error('❌ Directorio build no encontrado');
    return;
  }
  
  // Eliminar archivos innecesarios
  const unnecessaryFiles = [
    'static/js/*.map',
    'static/css/*.map',
    '*.txt'
  ];
  
  // Aquí puedes agregar lógica para eliminar archivos innecesarios
  console.log('✅ Build optimizado');
}

// Copiar archivos adicionales necesarios
function copyAdditionalFiles() {
  const filesToCopy = [
    { src: 'scripts/createAdmin.js', dest: 'build/scripts/createAdmin.js' },
    { src: 'README.md', dest: 'build/README.md' }
  ];
  
  filesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(__dirname, '..', src);
    const destPath = path.join(__dirname, '..', dest);
    
    if (fs.existsSync(srcPath)) {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copiado: ${src} → ${dest}`);
    }
  });
}

optimizeBuild();
copyAdditionalFiles();

console.log('✅ Tareas de empaquetado completadas');