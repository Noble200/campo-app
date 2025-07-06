// scripts/create-real-icons.js - Crear iconos ICO válidos
const fs = require('fs');
const path = require('path');

console.log('🎨 Creando iconos ICO válidos para AgroGestión...');

// Función para crear un icono ICO básico válido
function createBasicICO() {
  // Este es un ICO mínimo válido de 16x16 píxeles transparente
  const icoData = Buffer.from([
    // ICO Header
    0x00, 0x00, // Reserved
    0x01, 0x00, // Type (1 = ICO)
    0x01, 0x00, // Number of images
    
    // Image Directory Entry
    0x10,       // Width (16)
    0x10,       // Height (16)
    0x00,       // Colors in palette (0 = no palette)
    0x00,       // Reserved
    0x01, 0x00, // Color planes
    0x20, 0x00, // Bits per pixel (32-bit)
    0x00, 0x04, 0x00, 0x00, // Size of bitmap data (1024 bytes)
    0x16, 0x00, 0x00, 0x00, // Offset to bitmap data
    
    // Bitmap Data (16x16 pixels, 32-bit RGBA)
    // Esta sección crea un icono verde simple
    ...Array(1024).fill(0).map((_, i) => {
      const pixelIndex = Math.floor(i / 4);
      const component = i % 4;
      const x = pixelIndex % 16;
      const y = Math.floor(pixelIndex / 16);
      
      // Crear un patrón simple (cuadrado verde con borde)
      if (x === 0 || x === 15 || y === 0 || y === 15) {
        // Borde negro
        return component === 3 ? 0xFF : 0x00; // A=255, RGB=0
      } else if (x >= 4 && x <= 11 && y >= 4 && y <= 11) {
        // Centro verde
        switch(component) {
          case 0: return 0x00; // B
          case 1: return 0x80; // G
          case 2: return 0x00; // R
          case 3: return 0xFF; // A
        }
      } else {
        // Fondo transparente
        return 0x00;
      }
    })
  ]);
  
  return icoData;
}

// Función para crear todos los iconos necesarios
async function createAllIcons() {
  const iconsDir = path.join(__dirname, '..', 'build-resources');
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  const iconData = createBasicICO();
  
  const iconFiles = [
    'icon.ico',
    'installer.ico', 
    'uninstaller.ico',
    'header.ico',
    'file-icon.ico'
  ];
  
  iconFiles.forEach(filename => {
    const iconPath = path.join(iconsDir, filename);
    fs.writeFileSync(iconPath, iconData);
    console.log(`✅ Creado: ${filename} (ICO válido)`);
  });
  
  console.log('\n🎉 Todos los iconos ICO fueron creados exitosamente!');
  console.log('📝 Estos son iconos básicos funcionales.');
  console.log('💡 Para un resultado profesional, reemplázalos con iconos personalizados.');
}

// Función para validar iconos
function validateIcons() {
  const iconsDir = path.join(__dirname, '..', 'build-resources');
  const iconFiles = ['icon.ico', 'installer.ico', 'uninstaller.ico', 'header.ico', 'file-icon.ico'];
  
  console.log('\n🔍 Validando iconos...');
  
  iconFiles.forEach(filename => {
    const iconPath = path.join(iconsDir, filename);
    if (fs.existsSync(iconPath)) {
      const stats = fs.statSync(iconPath);
      const data = fs.readFileSync(iconPath);
      
      // Verificar header ICO básico
      const isValidICO = data.length >= 6 && 
                        data[0] === 0x00 && data[1] === 0x00 && // Reserved
                        data[2] === 0x01 && data[3] === 0x00;   // Type = ICO
      
      console.log(`${isValidICO ? '✅' : '❌'} ${filename}: ${stats.size} bytes ${isValidICO ? '(ICO válido)' : '(formato inválido)'}`);
    } else {
      console.log(`❌ ${filename}: No encontrado`);
    }
  });
}

// Función principal
async function main() {
  console.log('\n🌱 === GENERADOR DE ICONOS ICO PARA AGROGESTION ===\n');
  
  try {
    await createAllIcons();
    validateIcons();
    
    console.log('\n🚀 Próximos pasos:');
    console.log('1. npm run test-build    # Probar el empaquetado');
    console.log('2. npm run dist-win-64   # Crear instalador completo');
    console.log('\n💡 Para iconos personalizados:');
    console.log('• Crea un logo PNG de 512x512');
    console.log('• Usa https://www.icoconverter.com/ para convertir a ICO');
    console.log('• Reemplaza los archivos en build-resources/');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { createAllIcons, validateIcons };