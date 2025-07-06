const fs = require('fs');
const path = require('path');

console.log('🔐 Ejecutando tareas posteriores a la firma...');

// Verificar que el ejecutable esté firmado (si usas firma de código)
function verifySignature(filePath) {
  // Aquí puedes agregar verificación de firma
  console.log(`✅ Verificando firma de: ${filePath}`);
}

// Crear checksums de los archivos generados
function createChecksums(distPath) {
  const crypto = require('crypto');
  
  if (!fs.existsSync(distPath)) return;
  
  const files = fs.readdirSync(distPath);
  const checksums = {};
  
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && (file.endsWith('.exe') || file.endsWith('.msi'))) {
      const data = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      checksums[file] = {
        sha256: hash,
        size: stats.size,
        created: stats.ctime.toISOString()
      };
    }
  });
  
  fs.writeFileSync(
    path.join(distPath, 'checksums.json'),
    JSON.stringify(checksums, null, 2)
  );
  
  console.log('✅ Checksums creados');
}

const distPath = path.join(__dirname, '..', 'dist');
createChecksums(distPath);

console.log('✅ Tareas posteriores completadas');