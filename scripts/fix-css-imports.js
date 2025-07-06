// scripts/fix-css-imports.js
const fs = require('fs');

// Agregar import de CSS a src/index.js si no existe
const indexJs = 'src/index.js';
if (fs.existsSync(indexJs)) {
  let content = fs.readFileSync(indexJs, 'utf8');
  if (!content.includes("import './index.css'")) {
    // Agregar import al inicio después de React imports
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Buscar donde insertar
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('import') && lines[i].includes('react')) {
        insertIndex = i + 1;
      }
    }
    
    lines.splice(insertIndex, 0, "import './index.css';");
    content = lines.join('\n');
    
    fs.writeFileSync(indexJs, content, 'utf8');
    console.log('✅ Agregado import de CSS a src/index.js');
  }
}

console.log('🎉 Corrección de CSS completada');
