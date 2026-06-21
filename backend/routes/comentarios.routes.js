// routes/comentarios.routes.js
// COMPLETO Y CORREGIDO

const express = require("express");
const prisma = require("../prisma/prismaClient");
const { verificarToken } = require("../middleware/auth.middleware");

const router = express.Router();

// ========== OBTENER COMENTARIOS DE UNA INCIDENCIA ==========
router.get("/incidencia/:incidenciaId", verificarToken, async (req, res) => {
  try {
    const { incidenciaId } = req.params;

    const comentarios = await prisma.comentario.findMany({
      where: { incidenciaId: incidenciaId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true
          }
        }
      },
      orderBy: { fechaComentario: "desc" }
    });

    res.json({ success: true, data: comentarios });
  } catch (error) {
    console.error("Error obteniendo comentarios:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== AGREGAR COMENTARIO A UNA INCIDENCIA ==========
router.post("/agregar", verificarToken, async (req, res) => {
  try {
    const { incidenciaId, contenido } = req.body;
    const usuarioId = req.usuarioId;

    if (!incidenciaId) {
      return res.status(400).json({
        success: false,
        message: "ID de incidencia requerido"
      });
    }

    if (!contenido || contenido.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El comentario no puede estar vacío"
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

    const nuevoComentario = await prisma.comentario.create({
      data: {
        incidenciaId: incidenciaId,
        usuarioId: usuarioId,
        contenido: contenido.trim(),
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true
          }
        }
      }
    });

    if (req.io) {
      req.io.emit('nuevoComentario', nuevoComentario);
    }

    res.json({ success: true, data: nuevoComentario });
  } catch (error) {
    console.error("Error agregando comentario:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ENDPOINTS DEPRECATED (compatibilidad) ==========
router.post("/reporte/:reporteId", verificarToken, async (req, res) => {
  try {
    const { reporteId } = req.params;
    const { comentario } = req.body;
    const usuarioId = req.usuarioId;

    if (!comentario || comentario.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El comentario no puede estar vacío"
      });
    }

    const incidencia = await prisma.incidencia.findUnique({
      where: { id: reporteId },
      select: { id: true }
    });

    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada"
      });
    }

    const nuevoComentario = await prisma.comentario.create({
      data: {
        incidenciaId: reporteId,
        usuarioId: usuarioId,
        contenido: comentario.trim(),
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, rol: true }
        }
      }
    });

    if (req.io) {
      req.io.emit('nuevoComentario', nuevoComentario);
    }

    res.json({ success: true, data: nuevoComentario });
  } catch (error) {
    console.error("Error agregando comentario (deprecated):", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/reporte/:reporteId", verificarToken, async (req, res) => {
  try {
    const { reporteId } = req.params;

    const comentarios = await prisma.comentario.findMany({
      where: { incidenciaId: reporteId },
      include: {
        usuario: {
          select: { id: true, nombre: true, rol: true }
        }
      },
      orderBy: { fechaComentario: "desc" }
    });

    res.json({ success: true, data: comentarios });
  } catch (error) {
    console.error("Error obteniendo comentarios (deprecated):", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;