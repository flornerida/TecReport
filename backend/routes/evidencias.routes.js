// backend/routes/evidencias.routes.js
const express = require("express");
const prisma = require("../prisma/prismaClient");
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const router = express.Router();

// ========== SUBIR EVIDENCIA ==========
router.post("/subir", verificarToken, async (req, res) => {
  try {
    const { incidenciaId, tipo, urlFoto, descripcion } = req.body;
    const usuarioId = req.usuarioId;

    console.log('📸 Subiendo evidencia:', { 
      incidenciaId, 
      tipo, 
      tieneUrl: !!urlFoto, 
      usuarioId,
      urlLength: urlFoto?.length || 0
    });

    // Validar campos requeridos
    if (!incidenciaId || !tipo || !urlFoto) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: incidenciaId, tipo, urlFoto"
      });
    }

    // Verificar que la incidencia existe
    const incidencia = await prisma.incidencia.findUnique({
      where: { id: incidenciaId }
    });

    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada"
      });
    }

    // Verificar tipo válido
    const tiposValidos = ['PROBLEMA', 'SOLUCION'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: "Tipo no válido. Debe ser PROBLEMA o SOLUCION"
      });
    }

    // Crear la evidencia
    const evidencia = await prisma.evidencia.create({
      data: {
        incidenciaId: incidenciaId,
        usuarioId: usuarioId,
        tipo: tipo,
        urlFoto: urlFoto,
        descripcion: descripcion || null
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            correo: true
          }
        }
      }
    });

    console.log(`✅ Evidencia creada con ID: ${evidencia.id}`);

    res.json({
      success: true,
      message: "Evidencia subida correctamente",
      data: evidencia
    });

  } catch (error) {
    console.error('❌ Error subiendo evidencia:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== OBTENER EVIDENCIAS DE UNA INCIDENCIA ==========
router.get("/incidencia/:incidenciaId", verificarToken, async (req, res) => {
  try {
    const { incidenciaId } = req.params;

    const evidencias = await prisma.evidencia.findMany({
      where: { incidenciaId: incidenciaId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            correo: true
          }
        }
      },
      orderBy: {
        fechaSubida: 'desc'
      }
    });

    res.json({
      success: true,
      data: evidencias
    });

  } catch (error) {
    console.error('❌ Error obteniendo evidencias:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== OBTENER EVIDENCIA POR ID ==========
router.get("/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const evidencia = await prisma.evidencia.findUnique({
      where: { id: id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            correo: true
          }
        },
        incidencia: {
          select: {
            id: true,
            titulo: true
          }
        }
      }
    });

    if (!evidencia) {
      return res.status(404).json({
        success: false,
        message: "Evidencia no encontrada"
      });
    }

    res.json({
      success: true,
      data: evidencia
    });

  } catch (error) {
    console.error('❌ Error obteniendo evidencia:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== ELIMINAR EVIDENCIA ==========
router.delete("/:id", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const evidencia = await prisma.evidencia.findUnique({
      where: { id: id }
    });

    if (!evidencia) {
      return res.status(404).json({
        success: false,
        message: "Evidencia no encontrada"
      });
    }

    await prisma.evidencia.delete({
      where: { id: id }
    });

    res.json({
      success: true,
      message: "Evidencia eliminada correctamente"
    });

  } catch (error) {
    console.error('❌ Error eliminando evidencia:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;