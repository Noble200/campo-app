// scripts/createAdmin.js - Script actualizado con todos los permisos
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, query, where, getDocs } = require('firebase/firestore');
const promptSync = require('prompt-sync')();

// Configuración de Firebase web con las claves existentes
const firebaseConfig = {
  apiKey: "AIzaSyCeGZp5Pna87490Ns8Y_5kCtEjxw12VI2g",
  authDomain: "appja-b8f49.firebaseapp.com",
  projectId: "appja-b8f49",
  storageBucket: "appja-b8f49.firebasestorage.app",
  messagingSenderId: "276671305114",
  appId: "1:276671305114:web:121705036997ea74bc1623"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Función para crear permisos completos de administrador - ACTUALIZADA
const createAdminPermissions = () => {
  return {
    // Permisos principales
    admin: true,
    dashboard: true,
    
    // Inventario
    products: true,
    transfers: true,
    purchases: true,
    expenses: true, // NUEVO: Gestión de gastos
    
    // Producción
    fumigations: true,
    harvests: true, // CORREGIDO: Permiso para cosechas
    fields: true,
    
    // Administración
    warehouses: true,
    activities: true, // NUEVO: Historial de actividades
    reports: true, // NUEVO: Reportes
    users: true
  };
};

// Función para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para validar contraseña
const isValidPassword = (password) => {
  // Al menos 6 caracteres, una mayúscula, una minúscula y un número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

// Función para validar nombre de usuario
const isValidUsername = (username) => {
  // Solo letras, números y guiones bajos, mínimo 3 caracteres
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

async function createAdmin() {
  try {
    console.log('\n🌱 === AGROGESTION - Creación de Usuario Administrador === 🌱\n');
    
    // Solicitar datos del administrador con validaciones
    let email, username, password, displayName;
    
    // Email con validación
    do {
      email = promptSync('📧 Email del administrador (ej: admin@agrogestion.com): ') || 'admin@agrogestion.com';
      if (!isValidEmail(email)) {
        console.log('❌ Email inválido. Por favor ingresa un email válido.');
      }
    } while (!isValidEmail(email));
    
    // Username con validación
    do {
      username = promptSync('👤 Nombre de usuario (3-20 caracteres, solo letras, números y _): ') || 'admin';
      if (!isValidUsername(username)) {
        console.log('❌ Nombre de usuario inválido. Debe tener 3-20 caracteres y solo letras, números y guiones bajos.');
      }
    } while (!isValidUsername(username));
    
    // Contraseña con validación
    do {
      password = promptSync('🔒 Contraseña (mín. 6 caracteres, 1 mayúscula, 1 minúscula, 1 número): ') || 'Admin123!';
      if (!isValidPassword(password)) {
        console.log('❌ Contraseña inválida. Debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número.');
      }
    } while (!isValidPassword(password));
    
    displayName = promptSync('📝 Nombre completo (opcional): ') || 'Administrador del Sistema';
    
    console.log('\n🔍 Verificando disponibilidad...');
    
    // Verificar si el email ya está en uso
    try {
      await createUserWithEmailAndPassword(auth, 'test@test.com', 'test123');
    } catch (testError) {
      // Esto es normal, solo estamos probando la conexión
    }
    
    // Verificar si el nombre de usuario ya existe
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.error('\n❌ Error: El nombre de usuario ya está en uso.');
      console.log('💡 Sugerencia: Prueba con un nombre de usuario diferente.');
      process.exit(1);
    }
    
    console.log('\n✅ Nombre de usuario disponible');
    console.log('\n🚀 Creando usuario administrador...');
    
    // Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Usuario creado en Firebase Auth');
    
    // Crear documento completo en Firestore con todos los permisos
    const adminData = {
      id: user.uid,
      email: email,
      username: username,
      displayName: displayName,
      role: 'admin',
      permissions: createAdminPermissions(), // ACTUALIZADO: Usar función con todos los permisos
      isActive: true,
      isEmailVerified: false,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system-script',
      metadata: {
        accountType: 'administrator',
        creationMethod: 'admin-script',
        initialSetup: true,
        version: '1.0.0'
      }
    };
    
    await setDoc(doc(db, 'users', user.uid), adminData);
    
    console.log('✅ Datos de usuario guardados en Firestore');
    
    // Mostrar resumen de permisos
    console.log('\n🎉 ¡Usuario administrador creado exitosamente!');
    console.log('\n📋 === RESUMEN DEL USUARIO CREADO ===');
    console.log(`   📧 Email: ${email}`);
    console.log(`   👤 Usuario: ${username}`);
    console.log(`   📝 Nombre: ${displayName}`);
    console.log(`   🆔 ID: ${user.uid}`);
    console.log(`   🔑 Rol: Administrador`);
    
    console.log('\n🛡️  === PERMISOS ASIGNADOS ===');
    const permissions = createAdminPermissions();
    const permissionGroups = {
      'Administración': ['admin', 'users'],
      'Panel Principal': ['dashboard'],
      'Inventario': ['products', 'transfers', 'purchases', 'expenses'],
      'Producción': ['fumigations', 'harvests', 'fields'],
      'Gestión': ['warehouses', 'activities', 'reports']
    };
    
    Object.entries(permissionGroups).forEach(([group, perms]) => {
      console.log(`\n   ${group}:`);
      perms.forEach(perm => {
        if (permissions[perm]) {
          const permissionNames = {
            admin: 'Administración completa',
            dashboard: 'Panel principal',
            products: 'Gestión de productos',
            transfers: 'Transferencias',
            purchases: 'Compras',
            expenses: 'Gastos y ventas',
            fumigations: 'Fumigaciones',
            harvests: 'Cosechas',
            fields: 'Campos y lotes',
            warehouses: 'Almacenes',
            activities: 'Historial de actividades',
            reports: 'Reportes',
            users: 'Gestión de usuarios'
          };
          console.log(`     ✅ ${permissionNames[perm] || perm}`);
        }
      });
    });
    
    console.log('\n🔐 === INFORMACIÓN DE SEGURIDAD ===');
    console.log('   ⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro');
    console.log('   🔒 Cambia la contraseña después del primer login');
    console.log('   📧 Verifica el email cuando sea posible');
    console.log('   🚫 No compartas estas credenciales');
    
    console.log('\n🌟 === PRÓXIMOS PASOS ===');
    console.log('   1. 🚀 Inicia la aplicación AgroGestión');
    console.log('   2. 🔑 Inicia sesión con las credenciales creadas');
    console.log('   3. ⚙️  Configura los módulos necesarios');
    console.log('   4. 👥 Crea usuarios adicionales según necesidad');
    console.log('   5. 🏗️  Configura campos, almacenes y productos iniciales');
    
    console.log('\n✨ ¡Configuración completada! Bienvenido a AgroGestión ✨\n');
    
  } catch (error) {
    console.error('\n❌ Error al crear usuario administrador:', error.message);
    
    // Mensajes de error específicos
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 El email ya está en uso. Opciones:');
      console.log('   • Usa un email diferente');
      console.log('   • Si olvidaste la contraseña, puedes restablecerla desde la aplicación');
      console.log('   • Contacta al administrador del sistema');
    } else if (error.code === 'auth/weak-password') {
      console.log('\n💡 La contraseña es demasiado débil. Debe tener:');
      console.log('   • Al menos 6 caracteres');
      console.log('   • Una letra mayúscula');
      console.log('   • Una letra minúscula');
      console.log('   • Un número');
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n💡 El formato del email es inválido');
    } else if (error.code === 'auth/network-request-failed') {
      console.log('\n💡 Error de conexión:');
      console.log('   • Verifica tu conexión a internet');
      console.log('   • Verifica la configuración de Firebase');
    } else {
      console.log('\n💡 Error inesperado. Verifica:');
      console.log('   • La configuración de Firebase');
      console.log('   • Los permisos de Firestore');
      console.log('   • Tu conexión a internet');
    }
    
    console.log('\n📞 Si el problema persiste, contacta al equipo de soporte técnico.\n');
  } finally {
    process.exit(0);
  }
}

// Manejo de interrupciones
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Operación cancelada por el usuario');
  console.log('👋 ¡Hasta luego!');
  process.exit(0);
});

// Información inicial
console.log('🔧 Iniciando script de creación de administrador...');
console.log('📡 Conectando con Firebase...');

// Ejecutar la función principal
createAdmin();