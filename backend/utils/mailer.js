const nodemailer = require("nodemailer");

// Configuración del transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Enviar correo de recuperación de contraseña
 */
const sendResetEmail = async (to, code) => {
  try {
    const mailOptions = {
      from: `"Sistema de Incidencias BIGANDER" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🔐 Código de recuperación de contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #1A237E;">Sistema de Incidencias</h2>
            <h3 style="color: #ff6b00;">NEGOCIOS ASOCIADOS BIGANDER S.A.C.</h3>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p style="font-size: 16px;">Hola,</p>
            <p style="font-size: 16px;">Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1A237E; background-color: white; padding: 15px; border-radius: 8px; border: 2px dashed #ff6b00;">
                ${code}
              </div>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              ⏰ Este código es válido por <strong>15 minutos</strong>.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              Si no solicitaste este cambio, ignora este mensaje.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2026 NEGOCIOS ASOCIADOS BIGANDER S.A.C. - Todos los derechos reservados</p>
            <p>Calle Elias Aguirre 300, Miraflores - Arequipa</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado a ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar notificación de nueva incidencia asignada
 */
const sendAsignacionEmail = async (to, incidencia, tecnico) => {
  try {
    const mailOptions = {
      from: `"Sistema de Incidencias" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🛠️ Incidencia asignada",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1A237E;">Incidencia Asignada</h2>
          <p>Se te ha asignado una nueva incidencia:</p>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Título:</strong> ${incidencia.titulo}</p>
            <p><strong>Descripción:</strong> ${incidencia.descripcion}</p>
            <p><strong>Prioridad:</strong> ${incidencia.prioridad}</p>
            <p><strong>Reportado por:</strong> ${incidencia.usuario_nombre}</p>
          </div>
          
          <p>Por favor, revisa el sistema para más detalles.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false };
  }
};

module.exports = { sendResetEmail, sendAsignacionEmail };