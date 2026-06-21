// routes/tecnicos.routes.js
// Adaptado para el sistema de incidencias informáticas

const express = require("express");
const prisma = require("../prisma/prismaClient");
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

const router = express.Router();

// Middleware de autenticación y rol para todas las rutas
router.use(verificarToken);
router.use(verificarRol(['TECNICO']));

// ========== OBTENER INCIDENCIAS ASIGNADAS AL TÉCNICO ==========
// GET /tecnicos/mis-incidencias
router.get("/mis-incidencias", async (req, res) => {
  try {
    const tecnicoId = req.usuarioId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Buscar asignaciones del técnico
    const [asignaciones, total] = await Promise.all([
      prisma.asignacion.findMany({
        where: { tecnicoId },
        skip,
        take: limit,
        include: {
          incidencia: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  correo: true,
                  telefono: true
                }
              },
              area: true,
              seguimientos: {
                orderBy: { fecha: 'desc' },
                take: 5
              }
            }
          }
        },
        orderBy: {
          fechaAsignacion: 'desc'
        }
      }),
      prisma.asignacion.count({ where: { tecnicoId } })
    ]);

    // Extraer las incidencias de las asignaciones
    const incidencias = asignaciones.map(a => a.incidencia);

    console.log(`Técnico ${tecnicoId} tiene ${incidencias.length} incidencias asignadas`);

    res.json({
      success: true,
      data: incidencias,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo incidencias del técnico:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== OBTENER DETALLE DE UNA INCIDENCIA ASIGNADA ==========
// GET /tecnicos/incidencias/:id
router.get("/incidencias/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tecnicoId = req.usuarioId;

    // Verificar que la incidencia está asignada a este técnico
    const asignacion = await prisma.asignacion.findFirst({
      where: {
        incidenciaId: id,
        tecnicoId
      },
      include: {
        incidencia: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                correo: true,
                telefono: true
              }
            },
            tecnicoAsignado: {
              select: {
                id: true,
                nombre: true,
                correo: true
              }
            },
            area: true,
            evidencias: true,
            comentarios: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombre: true,
                    rol: true
                  }
                }
              },
              orderBy: { fechaComentario: 'desc' }
            },
            seguimientos: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombre: true
                  }
                }
              },
              orderBy: { fecha: 'desc' }
            }
          }
        }
      }
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada o no asignada a este técnico"
      });
    }

    res.json({
      success: true,
      data: asignacion.incidencia
    });

  } catch (error) {
    console.error('Error obteniendo incidencia:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== CAMBIAR ESTADO DE UNA INCIDENCIA ==========
// PUT /tecnicos/incidencias/:id/cambiar-estado
router.put("/incidencias/:id/cambiar-estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado, comentario } = req.body;
    const tecnicoId = req.usuarioId;

    // Verificar que la incidencia está asignada a este técnico
    const asignacion = await prisma.asignacion.findFirst({
      where: {
        incidenciaId: id,
        tecnicoId
      },
      include: {
        incidencia: true
      }
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada o no asignada a este técnico"
      });
    }

    const incidencia = asignacion.incidencia;
    const estadoActual = incidencia.estado;

    // Definir transiciones de estado válidas para técnicos
    const transicionesValidas = {
      'REPORTADO': ['EN_PROCESO'],
      'EN_PROCESO': ['DERIVADO'],
      'DERIVADO': ['RESUELTO'],
      'RESUELTO': [],  // No puede cambiar, solo ADMIN puede cerrar
      'CERRADO': []    // Estado final
    };

    // Verificar si la transición es válida
    if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
      return res.status(400).json({
        success: false,
        message: `No puedes cambiar de ${estadoActual} a ${nuevoEstado}. Transiciones permitidas: ${transicionesValidas[estadoActual]?.join(', ') || 'ninguna'}`
      });
    }

    // Validar que el nuevo estado sea válido
    const estadosValidos = ['REPORTADO', 'EN_PROCESO', 'DERIVADO', 'RESUELTO', 'CERRADO'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return res.status(400).json({
        success: false,
        message: `Estado ${nuevoEstado} no válido`
      });
    }

    const estadoAnterior = incidencia.estado;
    const fechaResolucion = nuevoEstado === 'RESUELTO' ? new Date() : undefined;

    // Actualizar la incidencia
    const incidenciaActualizada = await prisma.incidencia.update({
      where: { id },
      data: { 
        estado: nuevoEstado,
        fechaResolucion
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            correo: true
          }
        },
        tecnicoAsignado: {
          select: {
            id: true,
            nombre: true,
            correo: true
          }
        },
        area: true
      }
    });

    // Registrar en seguimiento
    await prisma.seguimiento.create({
      data: {
        incidenciaId: id,
        usuarioId: tecnicoId,
        accion: 'CAMBIO_ESTADO_TECNICO',
        descripcion: comentario || `Estado cambiado de ${estadoAnterior} a ${nuevoEstado}`,
        estadoAnterior,
        estadoNuevo: nuevoEstado
      }
    });

    console.log(`🔧 Técnico ${tecnicoId} cambió incidencia ${id} de ${estadoAnterior} a ${nuevoEstado}`);

    if (req.io) {
      req.io.emit('incidenciaActualizada', incidenciaActualizada);
    }

    res.json({
      success: true,
      message: `Estado cambiado a ${nuevoEstado}`,
      data: incidenciaActualizada
    });

  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== AGREGAR EVIDENCIA A UNA INCIDENCIA ==========
// POST /tecnicos/incidencias/:id/evidencias
router.post("/incidencias/:id/evidencias", async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, urlFoto, descripcion } = req.body;
    const tecnicoId = req.usuarioId;

    // Verificar que la incidencia está asignada a este técnico
    const asignacion = await prisma.asignacion.findFirst({
      where: {
        incidenciaId: id,
        tecnicoId
      }
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada o no asignada a este técnico"
      });
    }

    if (!urlFoto) {
      return res.status(400).json({
        success: false,
        message: "La URL de la foto es requerida"
      });
    }

    const tipoValido = tipo === 'PROBLEMA' || tipo === 'SOLUCION';
    if (!tipoValido) {
      return res.status(400).json({
        success: false,
        message: "Tipo debe ser 'PROBLEMA' o 'SOLUCION'"
      });
    }

    const evidencia = await prisma.evidencia.create({
      data: {
        incidenciaId: id,
        usuarioId: tecnicoId,
        tipo,
        urlFoto,
        descripcion: descripcion || null
      }
    });

    // Registrar en seguimiento
    await prisma.seguimiento.create({
      data: {
        incidenciaId: id,
        usuarioId: tecnicoId,
        accion: 'AGREGAR_EVIDENCIA',
        descripcion: `Evidencia de tipo ${tipo} agregada`
      }
    });

    console.log(`📸 Técnico ${tecnicoId} agregó evidencia a incidencia ${id}`);

    res.json({
      success: true,
      message: "Evidencia agregada correctamente",
      data: evidencia
    });

  } catch (error) {
    console.error('Error agregando evidencia:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== AGREGAR COMENTARIO A UNA INCIDENCIA ==========
// POST /tecnicos/incidencias/:id/comentarios
router.post("/incidencias/:id/comentarios", async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido, destinatario } = req.body;
    const tecnicoId = req.usuarioId;

    // Verificar que la incidencia está asignada a este técnico
    const asignacion = await prisma.asignacion.findFirst({
      where: {
        incidenciaId: id,
        tecnicoId
      }
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada o no asignada a este técnico"
      });
    }

    if (!contenido || contenido.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El comentario no puede estar vacío"
      });
    }

    const dest = destinatario === 'TECNICO' ? 'TECNICO' : 'TODOS';

    const comentario = await prisma.comentario.create({
      data: {
        incidenciaId: id,
        usuarioId: tecnicoId,
        contenido: contenido.trim(),
        destinatario: dest
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

    console.log(`💬 Técnico ${tecnicoId} comentó en incidencia ${id}`);

    res.json({
      success: true,
      message: "Comentario agregado correctamente",
      data: comentario
    });

  } catch (error) {
    console.error('Error agregando comentario:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== OBTENER ESTADÍSTICAS DEL TÉCNICO ==========
// GET /tecnicos/mis-estadisticas
router.get("/mis-estadisticas", async (req, res) => {
  try {
    const tecnicoId = req.usuarioId;

    // Obtener todas las incidencias asignadas al técnico
    const incidencias = await prisma.incidencia.findMany({
      where: { tecnicoAsignadoId: tecnicoId },
      select: { estado: true }
    });

    const total = incidencias.length;
    const reportadas = incidencias.filter(i => i.estado === 'REPORTADO').length;
    const enProceso = incidencias.filter(i => i.estado === 'EN_PROCESO' || i.estado === 'DERIVADO').length;
    const resueltas = incidencias.filter(i => i.estado === 'RESUELTO').length;
    const cerradas = incidencias.filter(i => i.estado === 'CERRADO').length;

    res.json({
      success: true,
      data: {
        total,
        reportadas,
        enProceso,
        resueltas,
        cerradas
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== ENDPOINTS DEPRECATED (mantenidos por compatibilidad) ==========

// GET /tecnicos/mis-reportes (deprecated)
router.get("/mis-reportes", async (req, res) => {
  console.warn('⚠️ Endpoint deprecated: /tecnicos/mis-reportes - Usar /tecnicos/mis-incidencias');
  
  try {
    const tecnicoId = req.usuarioId;
    const incidencias = await prisma.incidencia.findMany({
      where: { tecnicoAsignadoId: tecnicoId },
      include: {
        usuario: {
          select: { id: true, nombre: true, correo: true }
        },
        area: true
      },
      orderBy: { fechaHora: 'desc' }
    });

    res.json({
      success: true,
      data: incidencias
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /tecnicos/reportes/:id (deprecated)
router.get("/reportes/:id", async (req, res) => {
  console.warn(`⚠️ Endpoint deprecated: /tecnicos/reportes/${req.params.id} - Usar /tecnicos/incidencias/${req.params.id}`);
  
  try {
    const { id } = req.params;
    const tecnicoId = req.usuarioId;

    const incidencia = await prisma.incidencia.findFirst({
      where: {
        id,
        tecnicoAsignadoId: tecnicoId
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, correo: true }
        },
        tecnicoAsignado: true,
        area: true,
        evidencias: true,
        comentarios: {
          include: { usuario: true },
          orderBy: { fechaComentario: 'desc' }
        }
      }
    });

    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada o no asignada"
      });
    }

    res.json({ success: true, data: incidencia });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /tecnicos/reportes/:id/cambiar-estado (deprecated)
router.put("/reportes/:id/cambiar-estado", async (req, res) => {
  console.warn(`⚠️ Endpoint deprecated: /tecnicos/reportes/${req.params.id}/cambiar-estado - Usar /tecnicos/incidencias/${req.params.id}/cambiar-estado`);
  
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    const tecnicoId = req.usuarioId;

    const incidencia = await prisma.incidencia.findFirst({
      where: {
        id,
        tecnicoAsignadoId: tecnicoId
      }
    });

    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada o no asignada"
      });
    }

    const transicionesValidas = {
      'REPORTADO': ['EN_PROCESO'],
      'EN_PROCESO': ['DERIVADO'],
      'DERIVADO': ['RESUELTO']
    };

    if (!transicionesValidas[incidencia.estado]?.includes(nuevoEstado)) {
      return res.status(400).json({
        success: false,
        message: `No puedes cambiar de ${incidencia.estado} a ${nuevoEstado}`
      });
    }

    const fechaResolucion = nuevoEstado === 'RESUELTO' ? new Date() : undefined;

    const incidenciaActualizada = await prisma.incidencia.update({
      where: { id },
      data: { 
        estado: nuevoEstado,
        fechaResolucion
      }
    });

    await prisma.seguimiento.create({
      data: {
        incidenciaId: id,
        usuarioId: tecnicoId,
        accion: 'CAMBIO_ESTADO_TECNICO',
        estadoAnterior: incidencia.estado,
        estadoNuevo: nuevoEstado
      }
    });

    res.json({
      success: true,
      message: `Estado cambiado a ${nuevoEstado}`,
      data: incidenciaActualizada
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;