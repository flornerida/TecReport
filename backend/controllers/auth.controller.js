const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_seguro";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const register = async (req, res) => {
  const { nombre, email, password, telefono, area, cargo } = req.body;

  if (!nombre || !email || !password) {
    return res.json({
      success: false,
      message: "Completa los campos obligatorios (nombre, email, area, contraseña)"
    });
  }

  try {
    const existingUser = await prisma.usuario.findUnique({
      where: { correo: email }
    });

    if (existingUser) {
      return res.json({
        success: false,
        message: "El correo ya está registrado"
      });
    }
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre,
        correo: email,
        password: hashedPassword,
        telefono: telefono || null,
        rol: "USUARIO", 
        areaId: areaId,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        areaId: true,
        activo: true,
        createdAt: true
      }
    });
    const token = jwt.sign(
      { id: usuario.id, email: usuario.correo, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
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
    console.error("ERROR register:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Completa todos los campos"
    });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { correo: email },
      include: {
        area: true
      }
    });

    if (!usuario) {
      return res.json({
        success: false,
        message: "Correo o contraseña incorrectos"
      });
    }
    if (!usuario.activo) {
      return res.json({
        success: false,
        message: "Usuario desactivado. Contacta al administrador."
      });
    }

    const validPassword = await bcrypt.compare(password, usuario.password);

    if (!validPassword) {
      return res.json({
        success: false,
        message: "Correo o contraseña incorrectos"
      });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.correo, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
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
    console.error("ERROR login:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Debes ingresar tu correo" });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { correo: email }
    });

    if (!usuario) {
      return res.json({ success: false, message: "Correo no registrado" });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.passwordReset.upsert({
      where: { email: email },
      update: {
        token: code,
        expiresAt: expiry
      },
      create: {
        email: email,
        token: code,
        expiresAt: expiry
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Código de recuperación - Sistema de Incidencias",
      text: `Hola ${usuario.nombre},\n\nTu código de verificación es: ${code}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este cambio, ignora este mensaje.`
    });

    return res.json({
      success: true,
      message: "Código enviado al correo"
    });

  } catch (error) {
    console.error("ERROR forgotPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};
const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.json({ success: false, message: "Faltan datos" });
  }

  try {
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
      return res.json({ success: false, message: "Código inválido o expirado" });
    }

    return res.json({
      success: true,
      message: "Código válido"
    });

  } catch (error) {
    console.error("ERROR verifyCode:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};
const resetPassword = async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return res.json({ success: false, message: "Faltan datos" });
  }

  if (password.length < 6) {
    return res.json({ success: false, message: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
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
      return res.json({ success: false, message: "Código inválido o expirado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.usuario.update({
      where: { correo: email },
      data: { password: hashedPassword }
    });
    await prisma.passwordReset.delete({
      where: { id: resetRecord.id }
    });

    return res.json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error("ERROR resetPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

const getPerfil = async (req, res) => {
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

    return res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error("ERROR getPerfil:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};
const updatePerfil = async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { nombre, telefono, areaId, fotoPerfil } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nombre: nombre !== undefined ? nombre : undefined,
        telefono: telefono !== undefined ? telefono : undefined,
        areaId: areaId !== undefined ? areaId : undefined,
        fotoPerfil: fotoPerfil !== undefined ? fotoPerfil : undefined
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        rol: true,
        areaId: true,
        fotoPerfil: true,
        createdAt: true
      }
    });

    return res.json({
      success: true,
      message: "Perfil actualizado correctamente",
      data: usuario
    });
  } catch (error) {
    console.error("ERROR updatePerfil:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

const cambiarPassword = async (req, res) => {
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

    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { password: hashedPassword }
    });

    return res.json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    console.error("ERROR cambiarPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyCode,
  resetPassword,
  getPerfil,
  updatePerfil,
  cambiarPassword
};