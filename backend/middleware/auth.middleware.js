// middleware/authMiddleware.js
// Adaptado para el sistema de incidencias informáticas

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_seguro';

/**
 * Middleware para verificar el token JWT
 * Extrae el token del header Authorization y lo valida
 * Adjunta los datos del usuario decodificados al objeto req
 */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación requerido'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Adjuntar datos del usuario al request
    req.usuarioId = decoded.id;
    req.usuarioRole = decoded.rol;      // Cambiado: 'role' → 'rol' para coincidir con el modelo
    req.usuarioEmail = decoded.email;
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

/**
 * Middleware para verificar roles permitidos
 * @param {Array} rolesPermitidos - Lista de roles que pueden acceder (ej: ['ADMIN', 'TECNICO'])
 * @returns {Function} Middleware de Express
 */
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuarioRole) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }
    
    if (!rolesPermitidos.includes(req.usuarioRole)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`
      });
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario es ADMIN
 * Versión simplificada para rutas que solo aceptan ADMIN
 */
const verificarAdmin = (req, res, next) => {
  if (!req.usuarioRole) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }
  
  if (req.usuarioRole !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador'
    });
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario es TECNICO
 * Versión simplificada para rutas que solo aceptan TECNICO
 */
const verificarTecnico = (req, res, next) => {
  if (!req.usuarioRole) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }
  
  if (req.usuarioRole !== 'TECNICO') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de técnico'
    });
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario es ADMIN o TECNICO
 * Versión simplificada para rutas que aceptan ambos roles
 */
const verificarAdminOTecnico = (req, res, next) => {
  if (!req.usuarioRole) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }
  
  if (req.usuarioRole !== 'ADMIN' && req.usuarioRole !== 'TECNICO') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador o técnico'
    });
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario es el propietario o tiene rol permitido
 * @param {string} paramIdName - Nombre del parámetro en req.params que contiene el ID del usuario
 */
const verificarPropietario = (paramIdName = 'usuarioId') => {
  return (req, res, next) => {
    const targetUserId = req.params[paramIdName];
    
    // Si es ADMIN, permite el acceso
    if (req.usuarioRole === 'ADMIN') {
      return next();
    }
    
    // Si no es ADMIN, verifica que esté accediendo a sus propios datos
    if (req.usuarioId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. No puedes acceder a los datos de otro usuario'
      });
    }
    
    next();
  };
};

module.exports = {
  verificarToken,
  verificarRol,
  verificarAdmin,
  verificarTecnico,
  verificarAdminOTecnico,
  verificarPropietario
};