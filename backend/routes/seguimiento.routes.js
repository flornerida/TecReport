// routes/seguimiento.routes.js
// COMPLETO Y CORREGIDO

const express = require("express");
const prisma = require("../prisma/prismaClient");
const { verificarToken } = require("../middleware/auth.middleware");

const router = express.Router();

// ========== OBTENER SEGUIMIENTO DE UNA INCIDENCIA ==========
router.get("/incidencia/:incidenciaId", verificarToken, async (req, res) => {
  try {
    const { incidenciaId } = req.params;

    const seguimientos = await prisma.seguimiento.findMany({
      where: { incidenciaId: incidenciaId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { fecha: "desc" }
    });

    res.json({ success: true, data: seguimientos });
  } catch (error) {
    console.error("Error obteniendo seguimiento:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== AGREGAR SEGUIMIENTO A UNA INCIDENCIA ==========
router.post("/agregar", verificarToken, async (req, res) => {
  try {
    const { incidenciaId, accion, descripcion, estadoAnterior, estadoNuevo } = req.body;
    const usuarioId = req.usuarioId;

    if (!incidenciaId || !accion) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: incidenciaId y accion"
      });
    }

    // Verificar que la incidencia existe
    const incidencia = await prisma.incidencia.findUnique({
      where: { id: incidenciaId },
      select: { id: true }
    });

    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada"
      });
    }

    const nuevoSeguimiento = await prisma.seguimiento.create({
      data: {
        incidenciaId: incidenciaId,
        usuarioId: usuarioId,
        accion: accion,
        descripcion: descripcion || null,
        estadoAnterior: estadoAnterior || null,
        estadoNuevo: estadoNuevo || null
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.json({ success: true, data: nuevoSeguimiento });
  } catch (error) {
    console.error("Error agregando seguimiento:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;