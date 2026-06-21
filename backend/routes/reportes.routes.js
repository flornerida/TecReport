const express = require("express");
const prisma = require("../prisma/prismaClient");
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const router = express.Router();

// ========== TEST ==========
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Ruta de reportes funcionando" 
  });
});

// ========== DATOS DE REFERENCIA ==========
router.get("/datos-referencia", async (req, res) => {
  try {
    console.log('Obteniendo datos de referencia...');
    
    const categorias = [
      { value: 'HARDWARE', label: 'Hardware' },
      { value: 'SOFTWARE', label: 'Software' },
      { value: 'RED', label: 'Red' },
      { value: 'OTRO', label: 'Otro' }
    ];
    
    const prioridades = [
      { value: 'BAJA', label: 'Baja' },
      { value: 'MEDIA', label: 'Media' },
      { value: 'ALTA', label: 'Alta' },
      { value: 'CRITICA', label: 'Crítica' }
    ];
    
    // ✅ ESTADOS CORRECTOS - Coinciden con el frontend
    const estados = [
      { value: 'RECIBIDO', label: 'Recibido' },
      { value: 'EN_EVALUACION', label: 'En Evaluación' },
      { value: 'EN_EJECUCION', label: 'En Ejecución' },
      { value: 'FINALIZADO', label: 'Finalizado' },
      { value: 'COMPLETADO', label: 'Completado' }
    ];
    
    const areas = await prisma.area.findMany();
    
    console.log(`Encontrados: ${categorias.length} categorías, ${prioridades.length} prioridades, ${estados.length} estados, ${areas.length} áreas`);
    
    res.json({
      success: true,
      data: {
        categorias,
        prioridades,
        estados,
        areas
      }
    });
  } catch (error) {
    console.error('Error obteniendo datos:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ========== CREAR REPORTE ==========
router.post("/crear", verificarToken, verificarRol(['USUARIO', 'ADMIN', 'TECNICO']), async (req, res) => {
  try {
    const { titulo, descripcion, categoria, prioridad, ubicacion, equipo, areaId, evidencias } = req.body;
    const usuarioId = req.usuarioId;

    console.log('Recibido:', { 
      titulo, 
      descripcion, 
      categoria, 
      prioridad, 
      ubicacion,
      equipo,
      areaId,
      usuarioId, 
      tieneEvidencias: evidencias?.length > 0
    });

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(400).json({
        success: false,
        message: `Usuario con ID ${usuarioId} no encontrado`
      });
    }

    if (!titulo || !descripcion || !categoria || !prioridad) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: título, descripción, categoría o prioridad"
      });
    }

    // ✅ ESTADO CORRECTO: RECIBIDO
    const incidencia = await prisma.incidencia.create({
      data: {
        titulo: titulo,
        descripcion: descripcion,
        categoria: categoria,
        prioridad: prioridad,
        ubicacion: ubicacion || null,
        equipo: equipo || null,
        areaId: areaId || null,
        usuarioId: usuario.id,
        estado: 'RECIBIDO'  // ✅ Cambiado a RECIBIDO
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            correo: true
          }
        },
        area: true
      }
    });

    if (evidencias && Array.isArray(evidencias) && evidencias.length > 0) {
      await prisma.evidencia.createMany({
        data: evidencias.map(urlFoto => ({ 
          incidenciaId: incidencia.id, 
          usuarioId: usuario.id,
          urlFoto: urlFoto,
          tipo: 'PROBLEMA'
        }))
      });
      console.log(`Guardadas ${evidencias.length} evidencias`);
    }

    await prisma.seguimiento.create({
      data: {
        incidenciaId: incidencia.id,
        usuarioId: usuario.id,
        accion: 'CREACIÓN',
        descripcion: `Incidencia creada con título: ${titulo}`,
        estadoNuevo: 'RECIBIDO'
      }
    });

    console.log('Incidencia creada con ID:', incidencia.id);

    res.json({
      success: true,
      message: "Reporte creado correctamente",
      data: incidencia
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== CAMBIAR ESTADO ==========
router.put("/:id/estado", verificarToken, verificarRol(['ADMIN', 'TECNICO']), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, diagnostico, comentario } = req.body;
    const usuarioId = req.usuarioId;

    const incidencia = await prisma.incidencia.findUnique({
      where: { id }
    });

    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado"
      });
    }

    // ✅ ESTADOS VÁLIDOS
    const estadosValidos = ['RECIBIDO', 'EN_EVALUACION', 'EN_EJECUCION', 'FINALIZADO', 'COMPLETADO'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: "Estado no válido"
      });
    }

    const estadoAnterior = incidencia.estado;
    const fechaResolucion = estado === 'COMPLETADO' || estado === 'FINALIZADO' ? new Date() : undefined;

    // Lógica especial de rechazo de solución
    if (estadoAnterior === 'FINALIZADO' && estado === 'EN_EJECUCION') {
      // Obtener todas las evidencias de solución de esta incidencia
      const evidenciasSolucion = await prisma.evidencia.findMany({
        where: { incidenciaId: id, tipo: 'SOLUCION' }
      });
      // Renombrar su descripción para marcarlas como rechazadas
      for (const ev of evidenciasSolucion) {
        if (!ev.descripcion || !ev.descripcion.startsWith('[RECHAZADA]')) {
          const descNueva = ev.descripcion ? `[RECHAZADA] ${ev.descripcion}` : '[RECHAZADA] Evidencia de solución anterior';
          await prisma.evidencia.update({
            where: { id: ev.id },
            data: { descripcion: descNueva }
          });
        }
      }

      // Crear comentario del administrador sobre el rechazo
      if (comentario) {
        await prisma.comentario.create({
          data: {
            incidenciaId: id,
            usuarioId: usuarioId,
            contenido: `Solución rechazada. Motivo: ${comentario}`
          }
        });
      }
    }

    const updateData = { 
      estado: estado,
      fechaResolucion
    };

    if (diagnostico !== undefined) {
      updateData.diagnostico = diagnostico;
    }

    const incidenciaActualizada = await prisma.incidencia.update({
      where: { id },
      data: updateData,
      include: { 
        usuario: {
          select: { id: true, nombre: true, correo: true }
        },
        tecnicoAsignado: {
          select: { id: true, nombre: true }
        },
        area: true
      }
    });

    const descSeguimiento = (estadoAnterior === 'FINALIZADO' && estado === 'EN_EJECUCION' && comentario)
      ? `Solución rechazada. Motivo: ${comentario}`
      : `Estado cambiado de ${estadoAnterior} a ${estado}`;

    await prisma.seguimiento.create({
      data: {
        incidenciaId: id,
        usuarioId: usuarioId,
        accion: 'CAMBIO_ESTADO',
        descripcion: descSeguimiento,
        estadoAnterior,
        estadoNuevo: estado
      }
    });

    console.log(`Reporte ${id} cambiado de ${estadoAnterior} a ${estado}`);

    if (req.io) {
      req.io.emit('incidenciaActualizada', incidenciaActualizada);
    }

    res.json({
      success: true,
      message: "Estado actualizado",
      data: incidenciaActualizada
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ASIGNAR TÉCNICO ==========
router.post("/:id/asignar", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { tecnicoId } = req.body;

    console.log('Asignando técnico:', { incidenciaId: id, tecnicoId });

    const incidencia = await prisma.incidencia.findUnique({
      where: { id }
    });

    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado"
      });
    }

    const tecnico = await prisma.usuario.findUnique({
      where: { id: tecnicoId }
    });

    if (!tecnico || tecnico.rol !== 'TECNICO') {
      return res.status(400).json({
        success: false,
        message: "Técnico no válido"
      });
    }

    const asignacion = await prisma.asignacion.create({
      data: {
        incidenciaId: id,
        tecnicoId: tecnicoId
      },
      include: {
        tecnico: {
          select: {
            id: true,
            nombre: true,
            correo: true
          }
        }
      }
    });

    await prisma.incidencia.update({
      where: { id },
      data: { 
        tecnicoAsignadoId: tecnicoId,
        estado: 'EN_EVALUACION'  // ✅ Cuando se asigna técnico, pasa a EN_EVALUACION
      }
    });

    console.log(`Técnico ${tecnico.nombre} asignado al reporte ${id}`);

    res.json({
      success: true,
      message: "Técnico asignado correctamente",
      data: asignacion
    });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "Este técnico ya está asignado a este reporte"
      });
    }
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== OBTENER TODOS LOS REPORTES ==========
router.get("/", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const usuarioRol = req.usuarioRole;

    let whereClause = {};
    
    if (usuarioRol === 'USUARIO') {
      whereClause = { usuarioId };
    } else if (usuarioRol === 'TECNICO') {
      whereClause = { tecnicoAsignadoId: usuarioId };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [incidencias, total] = await Promise.all([
      prisma.incidencia.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              correo: true,
              area: true
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
        },
        orderBy: {
          fechaHora: 'desc'
        }
      }),
      prisma.incidencia.count({ where: whereClause })
    ]);

    console.log(`Enviando ${incidencias.length} incidencias`);

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
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========== OBTENER REPORTE POR ID ==========
router.get("/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const incidencia = await prisma.incidencia.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nombre: true, correo: true, area: true } },
        tecnicoAsignado: { select: { id: true, nombre: true, correo: true } },
        area: true,
        evidencias: true,
        comentarios: {
          include: {
            usuario: { select: { id: true, nombre: true, rol: true } }
          },
          orderBy: { fechaComentario: 'desc' }
        },
        asignaciones: {
          include: { tecnico: { select: { id: true, nombre: true, correo: true } } },
          orderBy: { fechaAsignacion: 'desc' }
        },
        seguimientos: {
          include: { usuario: { select: { id: true, nombre: true } } },
          orderBy: { fecha: 'desc' }
        }
      }
    });
    
    if (!incidencia) {
      return res.status(404).json({ success: false, message: "Reporte no encontrado" });
    }
    
    res.json({ success: true, data: incidencia });
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;