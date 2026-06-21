// backend/routes/notificaciones.routes.js
// Rutas para notificaciones push

const express = require("express");
const prisma = require("../prisma/prismaClient");
const { verificarToken } = require("../middleware/auth.middleware");
const { Expo } = require('expo-server-sdk');

const router = express.Router();

// Inicializar Expo SDK
let expo = new Expo();

// ========== REGISTRAR TOKEN PUSH ==========
router.post("/registrar-token", verificarToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const usuarioId = req.usuarioId;

    if (!pushToken) {
      return res.status(400).json({ success: false, message: "Token requerido" });
    }

    // Validar que el token sea válido para Expo
    if (!Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({ success: false, message: "Token push inválido" });
    }

    // Guardar token en el usuario
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { pushToken: pushToken },
    });

    console.log(`✅ Token push registrado para usuario: ${usuarioId}`);
    res.json({ success: true, message: "Token registrado correctamente" });
  } catch (error) {
    console.error("Error registrando token push:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== OBTENER NOTIFICACIONES DEL USUARIO ==========
router.get("/", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { soloNoLeidas } = req.query;

    const whereClause = { usuarioId };
    if (soloNoLeidas === 'true') {
      whereClause.leido = false;
    }

    const notificaciones = await prisma.notificacion.findMany({
      where: whereClause,
      orderBy: { fechaEnvio: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: notificaciones });
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MARCAR NOTIFICACIÓN COMO LEÍDA ==========
router.put("/:id/leer", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuarioId;

    await prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leido: true },
    });

    res.json({ success: true, message: "Notificación marcada como leída" });
  } catch (error) {
    console.error("Error marcando notificación:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MARCAR TODAS COMO LEÍDAS ==========
router.put("/marcar-todas-leidas", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;

    await prisma.notificacion.updateMany({
      where: { usuarioId, leido: false },
      data: { leido: true },
    });

    res.json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error marcando notificaciones:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ELIMINAR NOTIFICACIÓN ==========
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuarioId;

    await prisma.notificacion.deleteMany({
      where: { id, usuarioId },
    });

    res.json({ success: true, message: "Notificación eliminada" });
  } catch (error) {
    console.error("Error eliminando notificación:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ENVIAR NOTIFICACIÓN A UN USUARIO ==========
router.post("/enviar", verificarToken, async (req, res) => {
  try {
    const { usuarioId, titulo, mensaje, data, tipo } = req.body;

    // Obtener el token push del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { pushToken: true, nombre: true }
    });

    if (!usuario) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Guardar notificación en la base de datos
    const notificacion = await prisma.notificacion.create({
      data: {
        usuarioId: usuarioId,
        mensaje: mensaje,
        incidenciaId: data?.incidenciaId,
      }
    });

    // Enviar push notification si tiene token
    if (usuario.pushToken && Expo.isExpoPushToken(usuario.pushToken)) {
      const message = {
        to: usuario.pushToken,
        sound: 'default',
        title: titulo,
        body: mensaje,
        data: { ...data, notificacionId: notificacion.id, tipo: tipo },
      };

      const chunks = expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
      console.log(`📬 Notificación push enviada a ${usuario.nombre}`);
    } else {
      console.log(`⚠️ Usuario ${usuario.nombre} no tiene token push válido`);
    }

    res.json({ 
      success: true, 
      message: "Notificación enviada",
      data: notificacion 
    });
  } catch (error) {
    console.error("Error enviando notificación:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ENVIAR NOTIFICACIÓN A MÚLTIPLES USUARIOS ==========
router.post("/enviar-masivo", verificarToken, async (req, res) => {
  try {
    const { usuariosIds, titulo, mensaje, data, tipo } = req.body;

    if (!usuariosIds || !Array.isArray(usuariosIds) || usuariosIds.length === 0) {
      return res.status(400).json({ success: false, message: "Lista de usuarios requerida" });
    }

    // Obtener tokens de los usuarios
    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: usuariosIds } },
      select: { id: true, pushToken: true, nombre: true }
    });

    const messages = [];
    const notificacionesData = [];

    for (const usuario of usuarios) {
      // Guardar en BD
      const notificacion = await prisma.notificacion.create({
        data: {
          usuarioId: usuario.id,
          mensaje: mensaje,
          incidenciaId: data?.incidenciaId,
        }
      });
      notificacionesData.push(notificacion);

      // Preparar push
      if (usuario.pushToken && Expo.isExpoPushToken(usuario.pushToken)) {
        messages.push({
          to: usuario.pushToken,
          sound: 'default',
          title: titulo,
          body: mensaje,
          data: { ...data, notificacionId: notificacion.id, tipo: tipo },
        });
      }
    }

    // Enviar pushes en lotes
    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
      console.log(`📬 Notificaciones push enviadas a ${messages.length} usuarios`);
    }

    res.json({ 
      success: true, 
      message: `Notificaciones enviadas a ${usuarios.length} usuarios`,
      data: notificacionesData
    });
  } catch (error) {
    console.error("Error enviando notificaciones masivas:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;