// scripts/release.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJson = require('../package.json');
const currentVersion = packageJson.version;

console.log(`🚀 Iniciando proceso de release para AgroGestión v${currentVersion}`);

// Configuración
const CONFIG = {
  appName: 'AgroGestión',
  version: currentVersion,
  distPath: path.join(__dirname, '..', 'dist'),
  buildPath: path.join(__dirname, '..', 'build'),
  releasesPath: path.join(__dirname, '..', 'releases', currentVersion),
  
  // Tipos de instaladores a crear
  installers: [
    { name: 'Setup', target: 'nsis', arch: 'x64' },
    { name: 'MSI', target: 'msi', arch: 'x64' },
    { name: 'Portable', target: 'portable', arch: 'x64' },
    { name: 'Setup-32bit', target: 'nsis', arch: 'ia32' }
  ]
};

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

// Función para verificar prerrequisitos
function checkPrerequisites() {
  console.log('🔍 Verificando prerrequisitos...');
  
  // Verificar que el directorio build existe
  if (!fs.existsSync(CONFIG.buildPath)) {
    console.error('❌ Directorio build no encontrado. Ejecuta "npm run react-build" primero.');
    process.exit(1);
  }
  
  // Verificar iconos necesarios
  const requiredIcons = [
    'build-resources/icon.ico',
    'build-resources/installer.ico'
  ];
  
  for (const iconPath of requiredIcons) {
    if (!fs.existsSync(iconPath)) {
      console.error(`❌ Icono faltante: ${iconPath}`);
      process.exit(1);
    }
  }
  
  // Verificar que no hay cambios sin commitear
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      console.warn('⚠️  Hay cambios sin commitear en Git');
      console.log('   Se recomienda hacer commit antes del release');
    }
  } catch (error) {
    console.warn('⚠️  No se pudo verificar el estado de Git');
  }
  
  console.log('✅ Prerrequisitos verificados');
}

// Función para limpiar directorios
function cleanDirectories() {
  console.log('🧹 Limpiando directorios...');
  
  // Limpiar dist
  if (fs.existsSync(CONFIG.distPath)) {
    fs.rmSync(CONFIG.distPath, { recursive: true, force: true });
  }
  
  // Crear directorio de releases
  if (!fs.existsSync(CONFIG.releasesPath)) {
    fs.mkdirSync(CONFIG.releasesPath, { recursive: true });
  }
  
  console.log('✅ Directorios limpiados');
}

// Función para crear instaladores
function createInstallers() {
  console.log('🏗️  Creando instaladores...');
  
  for (const installer of CONFIG.installers) {
    const description = `Creando ${installer.name} (${installer.arch})`;
    const command = `npm run react-build && electron-builder --win ${installer.target} --${installer.arch}`;
    
    runCommand(command, description);
  }
  
  console.log('✅ Instaladores creados');
}

// Función para generar información del release
function generateReleaseInfo() {
  console.log('📄 Generando información del release...');
  
  const releaseInfo = {
    version: CONFIG.version,
    releaseDate: new Date().toISOString(),
    files: [],
    checksums: {},
    systemRequirements: {
      os: 'Windows 7 or later',
      architecture: 'x64, x86',
      memory: '4 GB RAM minimum, 8 GB recommended',
      storage: '500 MB available space',
      additionalNotes: 'Internet connection required for initial setup'
    },
    changelog: generateChangelog()
  };
  
  // Obtener información de archivos generados
  if (fs.existsSync(CONFIG.distPath)) {
    const files = fs.readdirSync(CONFIG.distPath);
    
    files.forEach(file => {
      const filePath = path.join(CONFIG.distPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && (file.endsWith('.exe') || file.endsWith('.msi'))) {
        const crypto = require('crypto');
        const data = fs.readFileSync(filePath);
        const sha256 = crypto.createHash('sha256').update(data).digest('hex');
        
        releaseInfo.files.push({
          name: file,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          sha256: sha256,
          type: getFileType(file)
        });
        
        releaseInfo.checksums[file] = sha256;
      }
    });
  }
  
  // Guardar información del release
  fs.writeFileSync(
    path.join(CONFIG.releasesPath, 'release-info.json'),
    JSON.stringify(releaseInfo, null, 2)
  );
  
  // Crear archivo README para el release
  const readmeContent = generateReleaseReadme(releaseInfo);
  fs.writeFileSync(
    path.join(CONFIG.releasesPath, 'README.md'),
    readmeContent
  );
  
  console.log('✅ Información del release generada');
  return releaseInfo;
}

// Función para copiar archivos a releases
function copyToReleases() {
  console.log('📂 Copiando archivos al directorio de releases...');
  
  if (!fs.existsSync(CONFIG.distPath)) {
    console.error('❌ Directorio dist no encontrado');
    return;
  }
  
  const files = fs.readdirSync(CONFIG.distPath);
  
  files.forEach(file => {
    const srcPath = path.join(CONFIG.distPath, file);
    const destPath = path.join(CONFIG.releasesPath, file);
    
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copiado: ${file}`);
    }
  });
  
  console.log('✅ Archivos copiados');
}

// Función para generar changelog
function generateChangelog() {
  try {
    // Intentar obtener commits desde el último tag
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    const commits = execSync(`git log ${lastTag}..HEAD --oneline`, { encoding: 'utf8' });
    
    if (commits.trim()) {
      return commits.split('\n').filter(line => line.trim()).map(line => {
        const [hash, ...messageParts] = line.split(' ');
        return `• ${messageParts.join(' ')} (${hash})`;
      }).join('\n');
    }
  } catch (error) {
    console.warn('⚠️  No se pudo generar changelog automático');
  }
  
  return '• Mejoras generales y corrección de errores';
}

// Función para generar README del release
function generateReleaseReadme(releaseInfo) {
  return `# ${CONFIG.appName} v${CONFIG.version}

**Fecha de lanzamiento:** ${new Date(releaseInfo.releaseDate).toLocaleDateString('es-ES')}

## 📥 Descargas

| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
${releaseInfo.files.map(file => 
  `| ${file.name} | ${file.sizeFormatted} | ${file.type} |`
).join('\n')}

## 📋 Requisitos del Sistema

- **Sistema Operativo:** ${releaseInfo.systemRequirements.os}
- **Arquitectura:** ${releaseInfo.systemRequirements.architecture}
- **Memoria RAM:** ${releaseInfo.systemRequirements.memory}
- **Espacio en disco:** ${releaseInfo.systemRequirements.storage}

## 🆕 Cambios en esta versión

${releaseInfo.changelog}

## 📦 Tipos de instaladores

- **Setup (.exe):** Instalador tradicional de Windows con asistente
- **MSI:** Instalador corporativo compatible con Group Policy
- **Portable:** Ejecutable que no requiere instalación

## 🔐 Verificación de integridad

Puedes verificar la integridad de los archivos usando los siguientes hashes SHA-256:

\`\`\`
${Object.entries(releaseInfo.checksums).map(([file, hash]) => 
  `${hash}  ${file}`
).join('\n')}
\`\`\`

## 🚀 Instalación

1. Descarga el archivo que prefieras
2. Ejecuta como administrador (recomendado)
3. Sigue las instrucciones del asistente
4. ¡Disfruta de ${CONFIG.appName}!

## 📞 Soporte

Si tienes problemas con la instalación o el uso de ${CONFIG.appName}, contacta al equipo de soporte.
`;
}

// Función para obtener tipo de archivo
function getFileType(filename) {
  if (filename.includes('Setup') && filename.endsWith('.exe')) {
    return 'Instalador NSIS';
  } else if (filename.endsWith('.msi')) {
    return 'Instalador MSI';
  } else if (filename.includes('Portable')) {
    return 'Versión portable';
  } else if (filename.endsWith('.zip')) {
    return 'Archivos comprimidos';
  }
  return 'Archivo ejecutable';
}

// Función para formatear bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función para crear tag de Git
function createGitTag() {
  console.log('🏷️  Creando tag de Git...');
  
  try {
    const tagName = `v${CONFIG.version}`;
    const tagMessage = `Release ${CONFIG.appName} ${CONFIG.version}`;
    
    runCommand(`git tag -a ${tagName} -m "${tagMessage}"`, `Creando tag ${tagName}`);
    console.log(`✅ Tag ${tagName} creado`);
    
    console.log('💡 Para subir el tag al repositorio remoto, ejecuta:');
    console.log(`   git push origin ${tagName}`);
  } catch (error) {
    console.warn('⚠️  No se pudo crear el tag de Git:', error.message);
  }
}

// Función principal
async function main() {
  try {
    console.log(`\n🎯 === RELEASE ${CONFIG.appName.toUpperCase()} V${CONFIG.version} ===\n`);
    
    checkPrerequisites();
    cleanDirectories();
    createInstallers();
    const releaseInfo = generateReleaseInfo();
    copyToReleases();
    createGitTag();
    
    console.log(`\n🎉 === RELEASE COMPLETADO ===`);
    console.log(`📦 Archivos generados en: ${CONFIG.releasesPath}`);
    console.log(`📄 Información del release: release-info.json`);
    console.log(`📋 Resumen de archivos:`);
    
    releaseInfo.files.forEach(file => {
      console.log(`   • ${file.name} (${file.sizeFormatted})`);
    });
    
    console.log(`\n🚀 Próximos pasos:`);
    console.log(`   1. Probar los instaladores en diferentes sistemas`);
    console.log(`   2. Subir los archivos a tu plataforma de distribución`);
    console.log(`   3. Comunicar el release a los usuarios`);
    console.log(`   4. git push origin v${CONFIG.version} (para subir el tag)`);
    
  } catch (error) {
    console.error('❌ Error durante el proceso de release:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };