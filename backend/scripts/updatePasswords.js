// scripts/updatePasswords.js
// Adaptado para el sistema de incidencias informáticas

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePasswords() {
  try {
    // Buscar todos los usuarios en el modelo 'usuario'
    const usuarios = await prisma.usuario.findMany();
    
    console.log(`🔍 Encontrados ${usuarios.length} usuarios en la base de datos`);
    console.log('================================================');
    
    let actualizados = 0;
    let yaEncriptados = 0;

    for (const usuario of usuarios) {
      // Verificar si la contraseña ya está encriptada con bcrypt
      // Las contraseñas encriptadas con bcrypt comienzan con '$2a$', '$2b$', '$2y$' o '$2x$'
      const isAlreadyHashed = usuario.password.startsWith('$2a$') || 
                              usuario.password.startsWith('$2b$') || 
                              usuario.password.startsWith('$2y$') ||
                              usuario.password.startsWith('$2x$');
      
      if (!isAlreadyHashed) {
        // Encriptar la contraseña actual
        const hashedPassword = await bcrypt.hash(usuario.password, 10);
        
        // Actualizar en la base de datos
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { password: hashedPassword }
        });
        
        console.log(`✅ Usuario ${usuario.correo} - contraseña actualizada`);
        actualizados++;
      } else {
        console.log(`⏭️ Usuario ${usuario.correo} - ya está encriptada (${usuario.password.substring(0, 20)}...)`);
        yaEncriptados++;
      }
    }
    
    console.log('================================================');
    console.log(`📊 Resumen:`);
    console.log(`   - Usuarios actualizados: ${actualizados}`);
    console.log(`   - Usuarios ya encriptados: ${yaEncriptados}`);
    console.log(`   - Total usuarios: ${usuarios.length}`);
    console.log('================================================');
    console.log('✅ Todas las contraseñas han sido actualizadas correctamente');
    console.log('🔐 Ahora puedes iniciar sesión con tus contraseñas originales');
    
  } catch (error) {
    console.error('❌ Error al actualizar contraseñas:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión a la base de datos cerrada');
  }
}

// Ejecutar el script
updatePasswords()
  .then(() => {
    console.log('🏁 Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });