const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/prismaClient");
const { enviarCorreoRecuperacion } = require("../services/email.service");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_seguro';

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token requerido" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Token inválido" });
  }
};

// ========== REGISTRO DE USUARIO ==========
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password, telefono, area, cargo } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { correo: email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Correo ya registrado"
      });
    }

    // Buscar o crear el área si se proporcionó
    let areaId = null;
    if (area) {
      const areaExistente = await prisma.area.findFirst({
        where: { nombre: area }
      });
      if (areaExistente) {
        areaId = areaExistente.id;
      } else {
        const nuevaArea = await prisma.area.create({
          data: { nombre: area, descripcion: `Área: ${area}` }
        });
        areaId = nuevaArea.id;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre,
        correo: email,
        password: hashedPassword,
        rol: "USUARIO", 
        telefono: telefono || null,
        areaId: areaId,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        activo: true,
        areaId: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.correo, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      data: {
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.correo,
          telefono: usuario.telefono,
          rol: usuario.rol,
          areaId: usuario.areaId
        }
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario"
    });
  }
});

// ========== LOGIN ==========
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { correo: email },
      include: {
        area: true
      }
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: "Usuario desactivado. Contacta al administrador."
      });
    }

    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.correo, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Login exitoso",
      data: {
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.correo,
          telefono: usuario.telefono,
          rol: usuario.rol,
          areaId: usuario.areaId,
          area: usuario.area
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
});

// ========== RECUPERAR CONTRASEÑA ==========
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Debes enviar un correo"
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { correo: email }
    });
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "No existe una cuenta con este correo electrónico"
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.passwordReset.upsert({
      where: { email: usuario.correo },
      update: {
        token: code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      },
      create: {
        email: usuario.correo,
        token: code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    const emailResult = await enviarCorreoRecuperacion(email, code, usuario.nombre);

    if (emailResult.success) {
      res.json({
        success: true,
        message: "Se ha enviado un código de verificación a tu correo electrónico"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error al enviar el correo. Intenta nuevamente."
      });
    }

  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
});

// ========== VERIFICAR CÓDIGO ==========
router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos"
      });
    }

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email: email,
        token: code,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Código inválido o expirado"
      });
    }

    res.json({
      success: true,
      message: "Código válido"
    });

  } catch (error) {
    console.error('Error en verify-code:', error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
});

// ========== RESTABLECER CONTRASEÑA ==========
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, password } = req.body;
    
    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos"
      });
    }

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email: email,
        token: code,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Código inválido o expirado"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.usuario.update({
      where: { correo: email },
      data: { password: hashedPassword }
    });

    await prisma.passwordReset.delete({
      where: { id: resetRecord.id }
    });

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor"
    });
  }
});

// ========== OBTENER USUARIO ACTUAL ==========
router.get("/me", verificarToken, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuarioId },
      select: { 
        id: true, 
        nombre: true, 
        correo: true, 
        telefono: true,
        rol: true,
        areaId: true,
        area: true,
        activo: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, data: usuario });

  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// ========== PERFIL DE USUARIO ==========

// Obtener perfil completo
router.get("/perfil", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        areaId: true,
        area: true,
        fotoPerfil: true,
        createdAt: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener perfil"
    });
  }
});

// Actualizar perfil
router.put("/perfil", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { nombre, telefono, areaId, fotoPerfil } = req.body;

    let finalAreaId = undefined;
    if (areaId !== undefined) {
      if (areaId === "" || areaId === null || areaId === "null") {
        finalAreaId = null;
      } else {
        let areaExistente = null;
        
        // 1. Si tiene formato de UUID, buscar por ID en la base de datos
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(areaId);
        if (isUUID) {
          areaExistente = await prisma.area.findUnique({
            where: { id: areaId }
          });
        }
        
        // 2. Si no se encontró por ID (o no es UUID), buscar por nombre del área
        if (!areaExistente) {
          areaExistente = await prisma.area.findFirst({
            where: { nombre: areaId }
          });
        }
        
        // 3. Si no existe con ese nombre, crearla de forma automática
        if (!areaExistente) {
          areaExistente = await prisma.area.create({
            data: { nombre: areaId, descripcion: `Área: ${areaId}` }
          });
        }
        
        finalAreaId = areaExistente.id;
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nombre: nombre !== undefined ? nombre : undefined,
        telefono: telefono !== undefined ? telefono : undefined,
        areaId: finalAreaId,
        fotoPerfil: fotoPerfil !== undefined ? fotoPerfil : undefined
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        areaId: true,
        area: true,
        fotoPerfil: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: "Perfil actualizado correctamente",
      data: usuario
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar perfil"
    });
  }
});

// Cambiar contraseña
router.put("/cambiar-password", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { passwordActual, nuevaPassword } = req.body;

    if (!passwordActual || !nuevaPassword) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos"
      });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 6 caracteres"
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const validPassword = await bcrypt.compare(passwordActual, usuario.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Contraseña actual incorrecta"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar contraseña"
    });
  }
});

// ========== REGISTRAR TOKEN PUSH ==========
router.post("/register-push-token", verificarToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const usuarioId = req.usuarioId;

    if (!pushToken) {
      return res.status(400).json({ success: false, message: "Token requerido" });
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { pushToken: pushToken },
    });

    res.json({ success: true, message: "Token registrado correctamente" });
  } catch (error) {
    console.error("Error guardando token push:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;