const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma/prismaClient");
const { verificarToken, verificarRol } = require("../middleware/auth.middleware");
const ExcelJS = require('exceljs');

const router = express.Router();

router.get("/estadisticas", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const totalUsuarios = await prisma.usuario.count();
    const totalIncidencias = await prisma.incidencia.count();
    
    const incidencias = await prisma.incidencia.findMany({
      select: {
        estado: true,
        prioridad: true
      }
    });

    const estadoMap = new Map();
    incidencias.forEach(incidencia => {
      const estado = incidencia.estado;
      estadoMap.set(estado, (estadoMap.get(estado) || 0) + 1);
    });
    const prioridadMap = new Map();
    incidencias.forEach(incidencia => {
      const prioridad = incidencia.prioridad;
      prioridadMap.set(prioridad, (prioridadMap.get(prioridad) || 0) + 1);
    });

    const incidenciasPorEstado = Array.from(estadoMap, ([estado, cantidad]) => ({
      estado,
      cantidad
    }));

    const incidenciasPorPrioridad = Array.from(prioridadMap, ([prioridad, cantidad]) => ({
      prioridad,
      cantidad
    }));

    res.json({
      success: true,
      data: {
        totalUsuarios,
        totalIncidencias,
        incidenciasPorEstado,
        incidenciasPorPrioridad
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== USUARIOS ==========
router.get("/usuarios", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/usuarios", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const { nombre, correo, password, telefono, rol, areaId } = req.body;

    console.log('📝 Creando usuario:', { nombre, correo, rol });

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: nombre, correo y password"
      });
    }

    const existe = await prisma.usuario.findUnique({
      where: { correo: correo }
    });

    if (existe) {
      return res.status(400).json({
        success: false,
        message: "El correo electrónico ya está registrado"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre,
        correo: correo,
        password: hashedPassword,
        telefono: telefono || null,
        rol: rol || 'USUARIO',
        activo: true,
        areaId: areaId || null
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true
      }
    });

    console.log('✅ Usuario creado:', usuario.correo);

    res.status(201).json({
      success: true,
      message: "Usuario creado correctamente",
      data: usuario
    });
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/usuarios/:id", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, telefono, rol, activo } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? nombre : undefined,
        correo: correo !== undefined ? correo : undefined,
        telefono: telefono !== undefined ? telefono : undefined,
        rol: rol !== undefined ? rol : undefined,
        activo: activo !== undefined ? activo : undefined
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: "Usuario actualizado correctamente",
      data: usuario
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/usuarios/:id", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    await prisma.usuario.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Usuario eliminado correctamente"
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/tecnicos", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const tecnicos = await prisma.usuario.findMany({
      where: { rol: 'TECNICO' },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({
      success: true,
      data: tecnicos
    });
  } catch (error) {
    console.error('Error obteniendo técnicos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/areas", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
    res.json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Error obteniendo áreas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/incidencias", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [incidencias, total] = await Promise.all([
      prisma.incidencia.findMany({
        skip,
        take: limit,
        include: {
          usuario: {
            select: { id: true, nombre: true, correo: true, area: true }
          },
          tecnicoAsignado: {
            select: { id: true, nombre: true, correo: true }
          },
          area: true
        },
        orderBy: {
          fechaHora: 'desc'
        }
      }),
      prisma.incidencia.count()
    ]);

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
    console.error('Error obteniendo incidencias:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/exportar-incidencias", async (req, res) => {
  try {
    let token = req.headers['authorization']?.split(' ')[1];
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Token de autenticación requerido" });
    }
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_seguro';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(403).json({ success: false, message: "Token inválido o expirado" });
    }
    
    if (decoded.rol !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "No autorizado. Se requiere rol ADMIN" });
    }
    const { estado, fechaDesde, fechaHasta, prioridad } = req.query;
    let whereClause = {};
    if (estado && estado !== 'todos') whereClause.estado = estado;
    if (prioridad && prioridad !== 'todos') whereClause.prioridad = prioridad;
    if (fechaDesde) {
      whereClause.fechaHora = { gte: new Date(fechaDesde) };
    }
    if (fechaHasta) {
      whereClause.fechaHora = {
        ...whereClause.fechaHora,
        lte: new Date(new Date(fechaHasta).setHours(23, 59, 59))
      };
    }
    
    const incidencias = await prisma.incidencia.findMany({
      where: whereClause,
      include: {
        usuario: { select: { id: true, nombre: true, correo: true, telefono: true, area: true } },
        tecnicoAsignado: { select: { id: true, nombre: true, correo: true } },
        area: true
      },
      orderBy: { fechaHora: 'desc' }
    });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Incidencias');
    
    // Cuadrícula visible
    worksheet.views = [{ showGridLines: true }];

    // Definición de Colores
    const COLOR_PRIMARY = '1A237E'; // Navy Blue
    const COLOR_SECONDARY = '0F172A'; // Slate Dark
    const COLOR_LIGHT_BLUE = 'F1F5F9'; // Light gray-blue
    
    const ESTADO_ESTILOS = {
      'REPORTADO':    { text: '0284C7', bg: 'E0F2FE', label: 'Reportado' },
      'RECIBIDO':     { text: '1D4ED8', bg: 'DBEAFE', label: 'Recibido' },
      'EN_EVALUACION':{ text: 'C2410C', bg: 'FFEDD5', label: 'En Evaluación' },
      'EN_EJECUCION': { text: '7E22CE', bg: 'F3E8FF', label: 'En Ejecución' },
      'FINALIZADO':   { text: 'B91C1C', bg: 'FEE2E2', label: 'Finalizado' },
      'COMPLETADO':   { text: '15803D', bg: 'DCFCE7', label: 'Completado' },
      'CERRADO':      { text: '15803D', bg: 'DCFCE7', label: 'Cerrado' },
    };

    const PRIORIDAD_ESTILOS = {
      'CRITICA': { text: '991B1B', bg: 'FEE2E2', label: 'Crítica' },
      'ALTA':    { text: 'C2410C', bg: 'FFEDD5', label: 'Alta' },
      'MEDIA':   { text: '854D0E', bg: 'FEF9C3', label: 'Media' },
      'BAJA':    { text: '166534', bg: 'DCFCE7', label: 'Baja' },
    };

    const CATEGORIA_TEXTOS = {
      'HARDWARE': 'Hardware',
      'SOFTWARE': 'Software',
      'RED':      'Red',
      'OTRO':     'Otro',
    };

    // ─── TÍTULO PRINCIPAL (B2:L2) ────────────────────────────────────────────────
    worksheet.mergeCells('B2:L2');
    const titleCell = worksheet.getCell('B2');
    titleCell.value = 'REPORTE DE INCIDENCIAS TÉCNICAS - SISTEMA TECREPORT';
    titleCell.font = { name: 'Segoe UI', bold: true, size: 16, color: { argb: 'FFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_PRIMARY }
    };
    worksheet.getRow(2).height = 42;

    // ─── INFORMACIÓN DE GENERACIÓN (B4:D5) ────────────────────────────────────────
    worksheet.getCell('B4').value = 'Fecha de Emisión:';
    worksheet.getCell('B4').font = { name: 'Segoe UI', bold: true, size: 10, color: { argb: '475569' } };
    worksheet.getCell('C4').value = new Date().toLocaleString('es-PE');
    worksheet.getCell('C4').font = { name: 'Segoe UI', size: 10 };

    worksheet.getCell('B5').value = 'Filtro de Estado:';
    worksheet.getCell('B5').font = { name: 'Segoe UI', bold: true, size: 10, color: { argb: '475569' } };
    const getEstadoDisplay = (e) => ESTADO_ESTILOS[e]?.label || 'Todos';
    worksheet.getCell('C5').value = estado && estado !== 'todos' ? getEstadoDisplay(estado) : 'Todos los estados';
    worksheet.getCell('C5').font = { name: 'Segoe UI', size: 10 };

    // ─── TARJETAS DE MÉTRICAS (B7:L9) ─────────────────────────────────────────────
    const totalCount = incidencias.length;
    const completedCount = incidencias.filter(i => ['COMPLETADO','CERRADO'].includes(i.estado)).length;
    const processCount = incidencias.filter(i => ['EN_EVALUACION','EN_EJECUCION'].includes(i.estado)).length;
    const criticalCount = incidencias.filter(i => i.prioridad === 'CRITICA').length;

    const createMetricCard = (startCol, endCol, title, value, fgColor, bgColor) => {
      const cellRange = `${startCol}7:${endCol}8`;
      worksheet.mergeCells(cellRange);
      const cell = worksheet.getCell(`${startCol}7`);
      cell.value = `${title}\n${value}`;
      cell.font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: fgColor } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      
      // Aplicar bordes finos a todo el rango
      const colStartIdx = startCol.charCodeAt(0) - 64;
      const colEndIdx = endCol.charCodeAt(0) - 64;
      for (let r = 7; r <= 8; r++) {
        for (let c = colStartIdx; c <= colEndIdx; c++) {
          const wcell = worksheet.getCell(r, c);
          wcell.border = {
            top:    { style: 'thin', color: { argb: 'CBD5E1' } },
            left:   { style: 'thin', color: { argb: 'CBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
            right:  { style: 'thin', color: { argb: 'CBD5E1' } }
          };
        }
      }
    };

    createMetricCard('B', 'D', 'TOTAL INCIDENCIAS', totalCount, '1E293B', 'F1F5F9');
    createMetricCard('E', 'G', 'COMPLETADOS', `${completedCount} (${totalCount > 0 ? Math.round(completedCount/totalCount*100) : 0}%)`, '15803D', 'DCFCE7');
    createMetricCard('H', 'J', 'EN PROCESO', processCount, 'B45309', 'FEF9C3');
    createMetricCard('K', 'L', 'CRÍTICOS', criticalCount, '991B1B', 'FEE2E2');
    worksheet.getRow(7).height = 24;
    worksheet.getRow(8).height = 24;

    // ─── TABLA DE DATOS (Row 11+) ────────────────────────────────────────────────
    const headers = [
      'ID',
      'Título',
      'Categoría',
      'Prioridad',
      'Estado',
      'Equipo / Ubicación',
      'Reportado Por',
      'Email Usuario',
      'Técnico Asignado',
      'Área',
      'Fecha Creación',
      'Fecha Resolución'
    ];

    const startRow = 11;
    headers.forEach((h, index) => {
      const cell = worksheet.getCell(startRow, index + 2); // Inicia en columna B (index + 2)
      cell.value = h;
      cell.font = { name: 'Segoe UI', bold: true, size: 11, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLOR_SECONDARY }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top:    { style: 'medium', color: { argb: '000000' } },
        bottom: { style: 'medium', color: { argb: '000000' } }
      };
    });
    worksheet.getRow(startRow).height = 30;

    let currentRowIdx = startRow + 1;
    for (const inc of incidencias) {
      const dataRow = [
        inc.id.substring(0, 8).toUpperCase(),
        inc.titulo,
        CATEGORIA_TEXTOS[inc.categoria] || inc.categoria,
        inc.prioridad,
        inc.estado,
        `${inc.equipo || '-'} \n(${inc.ubicacion || '-'})`,
        inc.usuario?.nombre || '-',
        inc.usuario?.correo || '-',
        inc.tecnicoAsignado?.nombre || 'Sin asignar',
        inc.area?.nombre || inc.usuario?.area?.nombre || '-',
        new Date(inc.fechaHora).toLocaleString('es-PE'),
        inc.fechaResolucion ? new Date(inc.fechaResolucion).toLocaleString('es-PE') : '-'
      ];

      dataRow.forEach((val, index) => {
        const cell = worksheet.getCell(currentRowIdx, index + 2);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '1E293B' } };
        cell.alignment = { vertical: 'middle', wrapText: true };
        
        // Bordes finos
        cell.border = {
          top:    { style: 'thin', color: { argb: 'E2E8F0' } },
          left:   { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right:  { style: 'thin', color: { argb: 'E2E8F0' } }
        };

        // Cebra striping
        if (currentRowIdx % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F8FAFC' }
          };
        }

        // Alinear al centro columnas de ID, Categoria, Prioridad, Estado y Fechas
        if ([0, 2, 3, 4, 10, 11].includes(index)) {
          cell.alignment.horizontal = 'center';
        }

        // Estilos específicos para prioridad
        if (index === 3) {
          const estiloP = PRIORIDAD_ESTILOS[val];
          if (estiloP) {
            cell.font = { name: 'Segoe UI', bold: true, size: 9.5, color: { argb: estiloP.text } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: estiloP.bgColor || estiloP.bg }
            };
          }
        }

        // Estilos específicos para Estado
        if (index === 4) {
          const estiloE = ESTADO_ESTILOS[val];
          if (estiloE) {
            cell.value = estiloE.label;
            cell.font = { name: 'Segoe UI', bold: true, size: 9.5, color: { argb: estiloE.text } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: estiloE.bgColor || estiloE.bg }
            };
          }
        }
      });
      
      worksheet.getRow(currentRowIdx).height = 36;
      currentRowIdx++;
    }

    // Auto-ajustar el ancho de las columnas
    const colLetters = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
    colLetters.forEach((colL, colIdx) => {
      const column = worksheet.getColumn(colL);
      let maxLen = 0;
      column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        // Ignorar filas superiores a la tabla para el cálculo de ancho
        if (rowNumber >= startRow) {
          const valStr = cell.value ? cell.value.toString() : '';
          const lines = valStr.split('\n');
          lines.forEach(l => {
            if (l.length > maxLen) maxLen = l.length;
          });
        }
      });
      column.width = Math.max(maxLen + 4, 12);
    });

    // Encabezados HTTP para descargar archivo Excel
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=incidencias_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exportando incidencias:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/incidencias/:id/completar", verificarToken, verificarRol(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const incidencia = await prisma.incidencia.findUnique({
      where: { id }
    });

    if (!incidencia) {
      return res.status(404).json({
        success: false,
        message: "Incidencia no encontrada"
      });
    }

    const incidenciaActualizada = await prisma.incidencia.update({
      where: { id },
      data: { 
        estado: 'CERRADO',
        fechaResolucion: new Date()
      },
      include: { 
        usuario: { select: { id: true, nombre: true, correo: true } },
        tecnicoAsignado: { select: { id: true, nombre: true } }
      }
    });

    await prisma.seguimiento.create({
      data: {
        incidenciaId: id,
        usuarioId: req.usuarioId,
        accion: 'COMPLETADO_ADMIN',
        descripcion: 'Incidencia completada por administrador',
        estadoAnterior: incidencia.estado,
        estadoNuevo: 'CERRADO'
      }
    });

    console.log(`Admin completó incidencia ${id} → CERRADO`);

    if (req.io) {
      req.io.emit('incidenciaActualizada', incidenciaActualizada);
    }

    res.json({
      success: true,
      message: "Incidencia completada exitosamente",
      data: incidenciaActualizada
    });
  } catch (error) {
    console.error('Error completando incidencia:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;