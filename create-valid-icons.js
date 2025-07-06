const fs = require('fs');
const https = require('https');
const path = require('path');

console.log('🎨 Descargando iconos válidos para testing...');

// Función para descargar archivo
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Eliminar archivo parcial
      reject(err);
    });
  });
}

async function createValidIcons() {
  // Crear directorios si no existen
  if (!fs.existsSync('build-resources')) {
    fs.mkdirSync('build-resources', { recursive: true });
  }

  try {
    // URL de un icono genérico de 256x256 (icono de aplicación genérico)
    const iconUrl = 'https://raw.githubusercontent.com/electron/electron/main/shell/browser/resources/win/icon.ico';
    
    console.log('📥 Descargando icono válido...');
    await downloadFile(iconUrl, 'build-resources/icon.ico');
    
    // Copiar el mismo icono para todos los usos
    const iconFiles = [
      'build-resources/installer.ico',
      'build-resources/uninstaller.ico',
      'build-resources/header.ico',
      'build-resources/file-icon.ico'
    ];

    iconFiles.forEach(iconPath => {
      fs.copyFileSync('build-resources/icon.ico', iconPath);
      console.log(`✅ Copiado: ${iconPath}`);
    });

    console.log('\n🎉 ¡Iconos válidos creados!');
    console.log('📏 Todos los iconos son ahora de 256x256 píxeles');
    console.log('\n🚀 Ahora ejecuta: npm run dist-win');
    
  } catch (error) {
    console.error('❌ Error descargando icono:', error.message);
    console.log('\n💡 ALTERNATIVA: Descarga manualmente un icono .ico de 256x256 desde:');
    console.log('• https://iconarchive.com/');
    console.log('• https://www.flaticon.com/');
    console.log('• https://icons8.com/');
    console.log('\nY guárdalo como: build-resources/icon.ico');
  }
}

createValidIcons();