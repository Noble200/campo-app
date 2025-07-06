const fs = require('fs');
const path = require('path');

console.log('🎨 Creando iconos para el instalador...');

// Función para crear iconos básicos si no existen
function createBasicIcons() {
  const iconsDir = path.join(__dirname, '..', 'build-resources');
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Lista de iconos necesarios
  const requiredIcons = [
    'icon.ico',
    'installer.ico',
    'uninstaller.ico',
    'header.ico',
    'file-icon.ico'
  ];
  
  requiredIcons.forEach(iconName => {
    const iconPath = path.join(iconsDir, iconName);
    if (!fs.existsSync(iconPath)) {
      console.log(`⚠️  Falta icono: ${iconName}`);
      console.log(`   Puedes usar herramientas como:
   • https://www.icoconverter.com/
   • https://convertio.co/png-ico/
   • GIMP con plugin ICO`);
    }
  });
}

createBasicIcons();

console.log('✅ Verificación de iconos completada');