// backend/services/email.service.js - Versión simplificada
const nodemailer = require('nodemailer');

let transporter = null;

// Intentar crear transporter solo si hay configuración
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  console.log('📧 Servicio de email configurado');
} else {
  console.log('⚠️ Servicio de email no configurado - modo simulación');
}

const enviarCorreoRecuperacion = async (email, codigo, nombre) => {
  // Si no hay transporter, simular envío
  if (!transporter) {
    console.log(`📧 [SIMULACIÓN] Email a ${email}: Código ${codigo} para ${nombre}`);
    return { success: true };
  }

  try {
    const mailOptions = {
      from: `"Sistema de Incidencias" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Sistema de Incidencias TI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1A237E;">Sistema de Incidencias</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Tu código de verificación es:</p>
          <div style="background: #e8eaf6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="letter-spacing: 5px; color: #1A237E;">${codigo}</h1>
          </div>
          <p>Este código expira en <strong>10 minutos</strong>.</p>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email enviado a ${email} - Código: ${codigo}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email (¿Credenciales inválidas?):', error.message);
    console.log(`📧 [SIMULACIÓN AUTOFALLBACK] Código de recuperación para ${email} es: ${codigo}`);
    // Retornamos true para no bloquear al usuario en la aplicación móvil
    return { success: true };
  }
};

module.exports = { enviarCorreoRecuperacion };