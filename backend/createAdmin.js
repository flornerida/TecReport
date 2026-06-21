// backend/createAdmin.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@gmail.com';
    const password = 'Admin123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const existing = await prisma.usuario.findUnique({
      where: { correo: email }
    });
    
    if (existing) {

      await prisma.usuario.update({
        where: { correo: email },
        data: { password: hashedPassword }
      });
      console.log('Contraseña actualizada para admin existente');
    } else {

      await prisma.usuario.create({
        data: {
          nombre: 'Administrador Bigander',
          correo: email,
          password: hashedPassword,
          telefono: '987654321',
          rol: 'ADMIN',
          activo: true,
        }
      });
      console.log('✅ Administrador creado exitosamente');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Correo:', email);
    console.log('🔐 Contraseña:', password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();