// scripts/diagnose-css.js
const fs = require('fs');
const path = require('path');

console.log('🎨 === DIAGNÓSTICO DE CSS PARA AGROGESTION ===\n');

// 1. Verificar archivos CSS existentes
console.log('📄 Verificando archivos CSS en el proyecto:');

const cssFiles = [
  'src/index.css',
  'src/App.css',
  'public/assets/css/global.css',
  'public/assets/css/normalize.css',
  'src/components/layout/AppLayout/appLayout.css',
  'src/components/layout/Header/header.css',
  'src/components/layout/Sidebar/sidebar.css',
  'src/components/panels/Dashboard/dashboard.css',
  'src/components/panels/Products/products.css',
  'src/components/panels/Fields/fields.css',
  'src/components/panels/Fumigations/fumigations.css',
  'src/components/panels/Harvests/harvests.css',
  'src/components/panels/Expenses/expenses.css',
  'src/components/panels/Activities/activities.css'
];

let foundCssFiles = [];
let missingCssFiles = [];

cssFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  
  if (exists) {
    foundCssFiles.push(file);
    
    // Verificar tamaño y contenido básico
    try {
      const stats = fs.statSync(file);
      const content = fs.readFileSync(file, 'utf8');
      const size = (stats.size / 1024).toFixed(2);
      const lines = content.split('\n').length;
      
      console.log(`    📏 Tamaño: ${size}KB | Líneas: ${lines}`);
      
      // Verificar errores de sintaxis básicos
      if (content.includes('@import') && !content.trim().startsWith('@import')) {
        console.log(`    ⚠️  Imports CSS no están al inicio`);
      }
      
      // Contar selectores CSS aproximadamente
      const selectors = content.match(/[.#]?[a-zA-Z][\w-]*\s*{/g) || [];
      console.log(`    🎯 Selectores encontrados: ${selectors.length}`);
      
      // Verificar si hay caracteres problemáticos
      if (content.includes('\uFEFF')) {
        console.log(`    ⚠️  Contiene BOM (caracteres problemáticos)`);
      }
      
    } catch (error) {
      console.log(`    ❌ Error leyendo archivo: ${error.message}`);
    }
  } else {
    missingCssFiles.push(file);
  }
});

// 2. Verificar imports de CSS en archivos JS
console.log('\n📥 Verificando imports de CSS en archivos JavaScript:');

const jsFiles = [
  'src/index.js',
  'src/App.js',
  'src/components/layout/AppLayout/AppLayout.js',
  'src/components/layout/Header/Header.js',
  'src/components/layout/Sidebar/Sidebar.js'
];

jsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const cssImports = content.match(/import\s+['"][^'"]*\.css['"];?/g) || [];
      
      console.log(`📄 ${file}:`);
      if (cssImports.length > 0) {
        cssImports.forEach(imp => {
          console.log(`    ✅ ${imp}`);
          
          // Verificar que el archivo importado existe
          const cssPath = imp.match(/['"]([^'"]*\.css)['"]/)[1];
          let resolvedPath;
          
          if (cssPath.startsWith('./')) {
            resolvedPath = path.resolve(path.dirname(file), cssPath);
          } else if (cssPath.startsWith('../')) {
            resolvedPath = path.resolve(path.dirname(file), cssPath);
          } else {
            resolvedPath = path.resolve('src', cssPath);
          }
          
          const exists = fs.existsSync(resolvedPath);
          console.log(`        📁 ${resolvedPath}: ${exists ? '✅' : '❌'}`);
        });
      } else {
        console.log(`    ❌ No se encontraron imports de CSS`);
      }
    } catch (error) {
      console.log(`    ❌ Error leyendo archivo: ${error.message}`);
    }
  }
});

// 3. Crear CSS mínimo que garantice funcionalidad
console.log('\n🔧 Creando archivos CSS básicos si faltan...');

// Crear src/index.css si no existe
if (!fs.existsSync('src/index.css')) {
  const indexCss = `/* src/index.css - Generado automáticamente */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}`;
  
  try {
    fs.writeFileSync('src/index.css', indexCss, 'utf8');
    console.log('✅ Creado src/index.css básico');
  } catch (error) {
    console.log(`❌ Error creando src/index.css: ${error.message}`);
  }
}

// Crear src/App.css si no existe
if (!fs.existsSync('src/App.css')) {
  const appCss = `/* src/App.css - Generado automáticamente */
.App {
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}

.App-link {
  color: #61dafb;
}`;
  
  try {
    fs.writeFileSync('src/App.css', appCss, 'utf8');
    console.log('✅ Creado src/App.css básico');
  } catch (error) {
    console.log(`❌ Error creando src/App.css: ${error.message}`);
  }
}

// 4. Sugerencias para arreglar CSS
console.log('\n💡 === SUGERENCIAS PARA SOLUCIONAR CSS ===');

if (foundCssFiles.length === 0) {
  console.log('❌ No se encontraron archivos CSS. Necesitas:');
  console.log('   1. Crear src/index.css y src/App.css');
  console.log('   2. Importar CSS en src/index.js y src/App.js');
} else {
  console.log('✅ Se encontraron archivos CSS.');
  
  if (missingCssFiles.length > 0) {
    console.log('\n⚠️  Archivos CSS faltantes que pueden estar siendo importados:');
    missingCssFiles.forEach(file => console.log(`   - ${file}`));
  }
}

console.log('\n🔧 Para garantizar que CSS se compile:');
console.log('   1. Asegúrate de que src/index.js importe "./index.css"');
console.log('   2. Cada componente debe importar su CSS correspondiente');
console.log('   3. Verifica que no hay errores de sintaxis en CSS');
console.log('   4. Ejecuta: npm run react-build y revisa warnings');

// 5. Generar script de corrección automática
console.log('\n📝 Generando script de corrección...');

const fixScript = `// scripts/fix-css-imports.js
const fs = require('fs');

// Agregar import de CSS a src/index.js si no existe
const indexJs = 'src/index.js';
if (fs.existsSync(indexJs)) {
  let content = fs.readFileSync(indexJs, 'utf8');
  if (!content.includes("import './index.css'")) {
    // Agregar import al inicio después de React imports
    const lines = content.split('\\n');
    let insertIndex = 0;
    
    // Buscar donde insertar
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('import') && lines[i].includes('react')) {
        insertIndex = i + 1;
      }
    }
    
    lines.splice(insertIndex, 0, "import './index.css';");
    content = lines.join('\\n');
    
    fs.writeFileSync(indexJs, content, 'utf8');
    console.log('✅ Agregado import de CSS a src/index.js');
  }
}

console.log('🎉 Corrección de CSS completada');
`;

try {
  fs.writeFileSync('scripts/fix-css-imports.js', fixScript, 'utf8');
  console.log('✅ Script de corrección creado: scripts/fix-css-imports.js');
} catch (error) {
  console.log(`❌ Error creando script: ${error.message}`);
}

console.log('\n🎉 Diagnóstico de CSS completado!');
console.log('\n🚀 Próximos pasos:');
console.log('   1. Ejecutar: node scripts/fix-css-imports.js');
console.log('   2. Ejecutar: npm run build');
console.log('   3. Verificar que aparezcan archivos CSS en build/static/css/');